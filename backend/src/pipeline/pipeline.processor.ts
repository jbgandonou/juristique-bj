import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { PipelineJob, JobStatus } from './entities/pipeline-job.entity';
import { LegalText, TextStatus } from '../legal-texts/entities/legal-text.entity';
import { Country } from '../countries/entities/country.entity';
import { FaolexScraper } from './scrapers/faolex.scraper';
import { OhadaScraper } from './scrapers/ohada.scraper';
import { ConstitutionsScraper } from './scrapers/constitutions.scraper';
import { CcjaScraper } from './scrapers/ccja.scraper';
import { AssembleesScraper } from './scrapers/assemblees.scraper';
import { JournauxScraper } from './scrapers/journaux.scraper';
import { PrimatureSnScraper } from './scrapers/primature-sn.scraper';
import { TogoOfficielScraper } from './scrapers/togo-officiel.scraper';
import { ScrapedText } from './scrapers/scraper.interface';
import { BaseScraper } from './scrapers/base.scraper';
import { PipelineAlertsService } from './pipeline-alerts.service';

@Processor('pipeline', { concurrency: 1 })
export class PipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(PipelineProcessor.name);

  constructor(
    @InjectRepository(PipelineJob)
    private readonly jobRepo: Repository<PipelineJob>,
    @InjectRepository(LegalText)
    private readonly textRepo: Repository<LegalText>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    private readonly faolexScraper: FaolexScraper,
    private readonly ohadaScraper: OhadaScraper,
    private readonly constitutionsScraper: ConstitutionsScraper,
    private readonly ccjaScraper: CcjaScraper,
    private readonly assembleesScraper: AssembleesScraper,
    private readonly journauxScraper: JournauxScraper,
    private readonly primatureSnScraper: PrimatureSnScraper,
    private readonly togoOfficielScraper: TogoOfficielScraper,
    private readonly alertsService: PipelineAlertsService,
  ) {
    super();
  }

  async process(job: Job<{ pipelineJobId: string; sourceName: string }>) {
    const { pipelineJobId, sourceName } = job.data;
    this.logger.log(`Processing job ${pipelineJobId} for source: ${sourceName}`);

    const pipelineJob = await this.jobRepo.findOne({ where: { id: pipelineJobId } });
    if (!pipelineJob) {
      this.logger.error(`PipelineJob ${pipelineJobId} not found`);
      return;
    }

    try {
      // Stage 1: Scraping
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.SCRAPING,
        startedAt: new Date(),
        metadataJson: { progress: 10, stage: 'Scraping texts from source...' } as Record<string, any>,
      });

      if (await this.isJobCancelled(pipelineJobId)) {
        return;
      }

      const scraper = this.getScraper(sourceName);
      scraper.clearAlerts();
      const scrapedTexts = await scraper.scrape();
      const alerts = scraper.getAlerts();
      if (alerts.length > 0) {
        await this.alertsService.createFromScraper(pipelineJobId, alerts);
      }
      this.logger.log(`Scraped ${scrapedTexts.length} texts from ${sourceName}`);

      if (await this.isJobCancelled(pipelineJobId)) {
        return;
      }

      // Stage 2: Extracting (cleanup/validation)
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.EXTRACTING,
        metadataJson: { progress: 40, stage: `Validating ${scrapedTexts.length} texts...`, scrapedCount: scrapedTexts.length } as Record<string, any>,
      });
      const validTexts = scrapedTexts.filter((t) => t.title && t.countryCodes.length > 0);
      this.logger.log(`${validTexts.length} valid texts after filtering`);

      if (await this.isJobCancelled(pipelineJobId)) {
        return;
      }

      // Stage 3: Enriching (country matching + dedup + create LegalText)
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.ENRICHING,
        metadataJson: { progress: 60, stage: `Creating ${validTexts.length} legal texts...`, validCount: validTexts.length } as Record<string, any>,
      });
      const created = await this.createLegalTexts(validTexts);
      this.logger.log(`Created ${created} new legal texts`);

      // Done
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.READY_FOR_REVIEW,
        textsCount: created,
        completedAt: new Date(),
        metadataJson: { progress: 100, stage: 'Complete', textsCreated: created } as Record<string, any>,
      });

    } catch (err) {
      this.logger.error(`Job ${pipelineJobId} failed: ${err.message}`, err.stack);
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.FAILED,
        errorMessage: (err as Error).message?.substring(0, 2000),
        completedAt: new Date(),
        metadataJson: { progress: 0, stage: 'Failed', error: (err as Error).message?.substring(0, 500) } as Record<string, any>,
      });
    }
  }

  private getScraper(sourceName: string): BaseScraper {
    switch (sourceName) {
      case 'FAOLEX':
        return this.faolexScraper;
      case 'OHADA':
        return this.ohadaScraper;
      case 'Constitutions':
        return this.constitutionsScraper;
      case 'CCJA':
        return this.ccjaScraper;
      case 'Assemblées nationales':
        return this.assembleesScraper;
      case 'Journaux officiels':
        return this.journauxScraper;
      case 'Primature Sénégal':
        return this.primatureSnScraper;
      case 'Togo Documents officiels':
        return this.togoOfficielScraper;
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }
  }

  private async isJobCancelled(jobId: string): Promise<boolean> {
    const job = await this.jobRepo.findOneBy({ id: jobId });
    return job?.status === JobStatus.FAILED && job?.errorMessage === 'Cancelled by admin';
  }

  private async createLegalTexts(texts: ScrapedText[]): Promise<number> {
    // Preload all countries for fast lookup
    const countries = await this.countryRepo.find();
    const codeMap = new Map(countries.map((c) => [c.code, c]));

    let created = 0;
    let skippedValidation = 0;

    for (const text of texts) {
      // Content validation
      if (!this.isValidForStorage(text)) {
        skippedValidation++;
        continue;
      }

      for (const code of text.countryCodes) {
        const country = codeMap.get(code);
        if (!country) continue;

        // Dedup: check if same title + country + source already exists
        const existing = await this.textRepo.findOne({
          where: {
            title: text.title,
            countryId: country.id,
            sourceName: text.sourceName,
          },
        });
        if (existing) continue;

        const legalText = this.textRepo.create({
          title: text.title,
          textType: text.textType,
          countryId: country.id,
          contentText: text.contentText,
          summary: text.summary,
          reference: text.reference,
          promulgationDate: this.parseDate(text.promulgationDate),
          sourceUrl: text.sourceUrl,
          sourceName: text.sourceName,
          status: TextStatus.PENDING_REVIEW,
        });

        await this.textRepo.save(legalText);
        created++;
      }
    }

    if (skippedValidation > 0) {
      this.logger.warn(`Skipped ${skippedValidation} texts failing content validation`);
    }

    return created;
  }

  private isValidForStorage(text: ScrapedText): boolean {
    // Title must be meaningful (already checked in scraper, double-check here)
    if (!text.title || text.title.trim().length < 10) return false;

    // If date is provided, it must be a plausible year
    if (text.promulgationDate) {
      const year = new Date(text.promulgationDate).getFullYear();
      if (isNaN(year) || year < 1960 || year > new Date().getFullYear() + 1) return false;
    }

    return true;
  }

  private parseDate(dateStr?: string): Date | undefined {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return undefined;
    const year = date.getFullYear();
    if (year < 1960 || year > new Date().getFullYear() + 1) return undefined;
    return date;
  }
}
