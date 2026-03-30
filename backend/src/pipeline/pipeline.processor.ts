import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { PipelineJob, JobStatus } from './entities/pipeline-job.entity';
import { LegalText, TextStatus } from '../legal-texts/entities/legal-text.entity';
import { Country } from '../countries/entities/country.entity';
import { ConstituteScraper } from './scrapers/constitute.scraper';
import { FaolexScraper } from './scrapers/faolex.scraper';
import { OhadaScraper } from './scrapers/ohada.scraper';
import { ScrapedText } from './scrapers/scraper.interface';

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
    private readonly constituteScraper: ConstituteScraper,
    private readonly faolexScraper: FaolexScraper,
    private readonly ohadaScraper: OhadaScraper,
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
      await this.updateStatus(pipelineJob, JobStatus.SCRAPING);
      const scraper = this.getScraper(sourceName);
      const scrapedTexts = await scraper.scrape();
      this.logger.log(`Scraped ${scrapedTexts.length} texts from ${sourceName}`);

      // Stage 2: Extracting (cleanup/validation)
      await this.updateStatus(pipelineJob, JobStatus.EXTRACTING);
      const validTexts = scrapedTexts.filter((t) => t.title && t.countryCodes.length > 0);
      this.logger.log(`${validTexts.length} valid texts after filtering`);

      // Stage 3: Enriching (country matching + dedup + create LegalText)
      await this.updateStatus(pipelineJob, JobStatus.ENRICHING);
      const created = await this.createLegalTexts(validTexts);
      this.logger.log(`Created ${created} new legal texts`);

      // Done
      pipelineJob.textsCount = created;
      pipelineJob.completedAt = new Date();
      await this.updateStatus(pipelineJob, JobStatus.READY_FOR_REVIEW);

    } catch (err) {
      this.logger.error(`Job ${pipelineJobId} failed: ${err.message}`, err.stack);
      pipelineJob.errorMessage = err.message?.substring(0, 2000);
      pipelineJob.completedAt = new Date();
      await this.updateStatus(pipelineJob, JobStatus.FAILED);
    }
  }

  private getScraper(sourceName: string) {
    switch (sourceName) {
      case 'Constitute Project':
        return this.constituteScraper;
      case 'FAOLEX':
        return this.faolexScraper;
      case 'OHADA':
        return this.ohadaScraper;
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }
  }

  private async updateStatus(pipelineJob: PipelineJob, status: JobStatus) {
    pipelineJob.status = status;
    if (status === JobStatus.SCRAPING && !pipelineJob.startedAt) {
      pipelineJob.startedAt = new Date();
    }
    await this.jobRepo.save(pipelineJob);
  }

  private async createLegalTexts(texts: ScrapedText[]): Promise<number> {
    // Preload all countries for fast lookup
    const countries = await this.countryRepo.find();
    const codeMap = new Map(countries.map((c) => [c.code, c]));

    let created = 0;

    for (const text of texts) {
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
          promulgationDate: text.promulgationDate ? new Date(text.promulgationDate) : undefined,
          sourceUrl: text.sourceUrl,
          sourceName: text.sourceName,
          status: TextStatus.PENDING_REVIEW,
        });

        await this.textRepo.save(legalText);
        created++;
      }
    }

    return created;
  }
}
