import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

interface AssemblySource {
  countryCode: string;
  countryName: string;
  baseUrl: string;
  lawListPaths: string[];
  contentSelectors: string[];
}

@Injectable()
export class AssembleesScraper extends BaseScraper {
  name = 'Assemblées nationales';

  private readonly DELAY_MS = 2000;

  private readonly SOURCES: AssemblySource[] = [
    {
      countryCode: 'BJ',
      countryName: 'Bénin',
      baseUrl: 'https://www.assemblee-nationale.bj',
      lawListPaths: ['/lois-votees', '/lois', '/textes-votes'],
      contentSelectors: ['.entry-content, .content, article, .post-content'],
    },
    {
      countryCode: 'SN',
      countryName: 'Sénégal',
      baseUrl: 'https://www.assemblee-nationale.sn',
      lawListPaths: ['/lois-votees', '/textes-de-loi', '/lois'],
      contentSelectors: ['.entry-content, .content, article, .field-content'],
    },
    {
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      baseUrl: 'https://www.assnat.ci',
      lawListPaths: ['/lois-votees', '/les-lois', '/textes'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'CM',
      countryName: 'Cameroun',
      baseUrl: 'https://www.assemblee-nationale.cm',
      lawListPaths: ['/lois-votees', '/textes-adoptes', '/lois'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'BF',
      countryName: 'Burkina Faso',
      baseUrl: 'https://www.assemblee.bf',
      lawListPaths: ['/lois-votees', '/textes', '/lois'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'ML',
      countryName: 'Mali',
      baseUrl: 'https://www.assemblee-nationale.ml',
      lawListPaths: ['/lois-votees', '/textes', '/lois-adoptees'],
      contentSelectors: ['.entry-content, .content, article'],
    },
  ];

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const source of this.SOURCES) {
      this.log('info', `Scraping Assemblée nationale: ${source.countryName}...`);
      try {
        const texts = await this.scrapeAssembly(source);
        allTexts.push(...texts);
        this.log('info', `${source.countryName}: ${texts.length} laws found`);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.WARNING,
          message: `Failed to scrape Assemblée nationale ${source.countryName}: ${(error as Error).message}`,
          metadata: { countryCode: source.countryCode, baseUrl: source.baseUrl },
        });
      }
      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private async scrapeAssembly(source: AssemblySource): Promise<ScrapedText[]> {
    let listHtml: string | null = null;
    let workingUrl: string | null = null;

    for (const path of source.lawListPaths) {
      const url = `${source.baseUrl}${path}`;
      try {
        listHtml = await this.fetchPage(url);
        workingUrl = url;
        break;
      } catch {
        this.log('debug', `Not found: ${url}`);
      }
    }

    if (!listHtml || !workingUrl) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No law list page found for Assemblée ${source.countryName}`,
        metadata: { triedPaths: source.lawListPaths.map((p) => `${source.baseUrl}${p}`) },
      });
      return [];
    }

    const $ = cheerio.load(listHtml);
    const lawLinks: { title: string; url: string }[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 15 &&
        (text.toLowerCase().includes('loi') ||
          text.toLowerCase().includes('n°') ||
          href.includes('loi'))
      ) {
        const fullUrl = href.startsWith('http')
          ? href
          : href.startsWith('/')
            ? `${source.baseUrl}${href}`
            : `${workingUrl}/${href}`;
        if (!lawLinks.some((l) => l.url === fullUrl)) {
          lawLinks.push({ title: text, url: fullUrl });
        }
      }
    });

    if (lawLinks.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No law links found on ${workingUrl}`,
      });
      return [];
    }

    const texts: ScrapedText[] = [];
    const maxLaws = 50;

    for (const link of lawLinks.slice(0, maxLaws)) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        let content = '';
        for (const selector of source.contentSelectors) {
          const el = detail$(selector).first();
          if (el.length && el.text().trim().length > 100) {
            content = el.text().trim();
            break;
          }
        }

        const textType = link.title.toLowerCase().includes('organique')
          ? TextType.LOI_ORGANIQUE
          : TextType.LOI;

        const dateMatch = link.title.match(/\b(20\d{2}|19\d{2})\b/);
        const promulgationDate = dateMatch ? `${dateMatch[1]}-01-01` : undefined;

        texts.push({
          title: link.title,
          textType,
          countryCodes: [source.countryCode],
          contentText: content.substring(0, 100000) || undefined,
          sourceUrl: link.url,
          sourceName: 'Assemblées nationales',
          promulgationDate,
          language: 'fr',
        });
      } catch (error) {
        this.log('debug', `Failed to fetch law detail: ${link.url}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return texts;
  }
}
