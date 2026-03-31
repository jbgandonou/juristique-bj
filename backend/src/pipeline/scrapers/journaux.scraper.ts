import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

interface JournalSource {
  countryCode: string;
  countryName: string;
  baseUrl: string;
  listPaths: string[];
  contentSelectors: string[];
}

@Injectable()
export class JournauxScraper extends BaseScraper {
  name = 'Journaux officiels';

  private readonly DELAY_MS = 2000;

  private readonly SOURCES: JournalSource[] = [
    {
      countryCode: 'BJ',
      countryName: 'Bénin',
      baseUrl: 'https://sgg.gouv.bj',
      listPaths: ['/journal-officiel', '/jo', '/textes-officiels', '/publications'],
      contentSelectors: ['.entry-content, .content, article, .post-content'],
    },
    {
      countryCode: 'SN',
      countryName: 'Sénégal',
      baseUrl: 'https://www.jo.gouv.sn',
      listPaths: ['/', '/journal-officiel', '/publications', '/textes'],
      contentSelectors: ['.entry-content, .content, article, .field-content'],
    },
    {
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      baseUrl: 'https://www.jogouv.ci',
      listPaths: ['/', '/journal-officiel', '/publications'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'CM',
      countryName: 'Cameroun',
      baseUrl: 'https://www.sppm.cm',
      listPaths: ['/', '/journal-officiel', '/publications'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'BF',
      countryName: 'Burkina Faso',
      baseUrl: 'https://legiburkina.bf',
      listPaths: ['/', '/journal-officiel', '/textes', '/jo'],
      contentSelectors: ['.entry-content, .content, article, .texte'],
    },
    {
      countryCode: 'ML',
      countryName: 'Mali',
      baseUrl: 'https://sgg.gouv.ml',
      listPaths: ['/', '/journal-officiel', '/textes-officiels'],
      contentSelectors: ['.entry-content, .content, article'],
    },
  ];

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const source of this.SOURCES) {
      this.log('info', `Scraping Journal officiel: ${source.countryName}...`);
      try {
        const texts = await this.scrapeJournal(source);
        allTexts.push(...texts);
        this.log('info', `${source.countryName}: ${texts.length} texts found`);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.WARNING,
          message: `Failed to scrape JO ${source.countryName}: ${(error as Error).message}`,
          metadata: { countryCode: source.countryCode, baseUrl: source.baseUrl },
        });
      }
      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private async scrapeJournal(source: JournalSource): Promise<ScrapedText[]> {
    let listHtml: string | null = null;
    let workingUrl: string | null = null;

    for (const path of source.listPaths) {
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
        message: `No JO page found for ${source.countryName}`,
        metadata: { triedPaths: source.listPaths.map((p) => `${source.baseUrl}${p}`) },
      });
      return [];
    }

    const $ = cheerio.load(listHtml);
    const textLinks: { title: string; url: string }[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 15 &&
        (text.toLowerCase().includes('décret') ||
          text.toLowerCase().includes('arrêté') ||
          text.toLowerCase().includes('ordonnance') ||
          text.toLowerCase().includes('loi') ||
          text.toLowerCase().includes('n°') ||
          href.includes('decret') ||
          href.includes('arrete') ||
          href.includes('.pdf'))
      ) {
        const fullUrl = href.startsWith('http')
          ? href
          : href.startsWith('/')
            ? `${source.baseUrl}${href}`
            : `${workingUrl}/${href}`;
        if (!textLinks.some((l) => l.url === fullUrl)) {
          textLinks.push({ title: text, url: fullUrl });
        }
      }
    });

    if (textLinks.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No text links found on JO ${source.countryName}: ${workingUrl}`,
      });
      return [];
    }

    const texts: ScrapedText[] = [];
    const maxTexts = 50;

    for (const link of textLinks.slice(0, maxTexts)) {
      if (link.url.endsWith('.pdf')) {
        texts.push({
          title: link.title,
          textType: this.detectTextType(link.title),
          countryCodes: [source.countryCode],
          sourceUrl: link.url,
          sourceName: 'Journaux officiels',
          language: 'fr',
        });
        continue;
      }

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

        const dateMatch = link.title.match(/\b(20\d{2}|19\d{2})\b/);
        const promulgationDate = dateMatch ? `${dateMatch[1]}-01-01` : undefined;

        texts.push({
          title: link.title,
          textType: this.detectTextType(link.title),
          countryCodes: [source.countryCode],
          contentText: content.substring(0, 100000) || undefined,
          sourceUrl: link.url,
          sourceName: 'Journaux officiels',
          promulgationDate,
          language: 'fr',
        });
      } catch (error) {
        this.log('debug', `Failed to fetch JO text: ${link.url}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return texts;
  }

  private detectTextType(title: string): TextType {
    const lower = title.toLowerCase();
    if (lower.includes('décret') || lower.includes('decret')) return TextType.DECRET;
    if (lower.includes('arrêté') || lower.includes('arrete')) return TextType.ARRETE;
    if (lower.includes('ordonnance')) return TextType.ORDONNANCE;
    if (lower.includes('loi organique')) return TextType.LOI_ORGANIQUE;
    if (lower.includes('loi')) return TextType.LOI;
    return TextType.DECRET;
  }
}
