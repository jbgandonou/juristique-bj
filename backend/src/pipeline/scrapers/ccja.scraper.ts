import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class CcjaScraper extends BaseScraper {
  name = 'CCJA';

  private readonly BASE_URL = 'https://www.ccja.org';
  private readonly DELAY_MS = 2000;

  private readonly OHADA_MEMBERS = [
    'BJ', 'BF', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
    'CI', 'GQ', 'GA', 'GN', 'GW', 'ML', 'NE', 'SN', 'TG',
  ];

  private readonly FRENCH_MONTHS: Record<string, string> = {
    janvier: '01', février: '02', mars: '03', avril: '04',
    mai: '05', juin: '06', juillet: '07', août: '08',
    septembre: '09', octobre: '10', novembre: '11', décembre: '12',
  };

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    this.log('info', 'Scraping CCJA decisions...');

    const listUrls = [
      `${this.BASE_URL}/jurisprudence`,
      `${this.BASE_URL}/decisions`,
      `${this.BASE_URL}/arrets`,
    ];

    let listHtml: string | null = null;
    let workingUrl: string | null = null;

    for (const url of listUrls) {
      try {
        listHtml = await this.fetchPage(url);
        workingUrl = url;
        this.log('info', `CCJA list page found at ${url}`);
        break;
      } catch {
        this.log('debug', `CCJA URL not found: ${url}`);
      }
    }

    if (!listHtml || !workingUrl) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.ERROR,
        message: 'Could not find CCJA jurisprudence list page. Site structure may have changed.',
        metadata: { triedUrls: listUrls },
      });
      return [];
    }

    const $ = cheerio.load(listHtml);
    const decisionLinks: { title: string; url: string }[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 15 &&
        (href.includes('arret') ||
          href.includes('decision') ||
          href.includes('avis') ||
          text.toLowerCase().includes('arrêt') ||
          text.toLowerCase().includes('avis'))
      ) {
        const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
        if (!decisionLinks.some((l) => l.url === fullUrl)) {
          decisionLinks.push({ title: text, url: fullUrl });
        }
      }
    });

    if (decisionLinks.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No decision links found on CCJA page: ${workingUrl}`,
        metadata: { url: workingUrl },
      });
      return [];
    }

    this.log('info', `Found ${decisionLinks.length} CCJA decision links`);

    for (const link of decisionLinks) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        const content = detail$('.entry-content, .decision-content, article, .post-content, .content')
          .first()
          .text()
          .trim();

        if (content.length < 100) {
          this.log('debug', `CCJA decision content too short: ${link.url}`);
          continue;
        }

        const dateStr = this.parseFrenchDate(link.title) ?? this.parseFrenchDate(content.substring(0, 500));

        allTexts.push({
          title: link.title,
          textType: TextType.JURISPRUDENCE,
          countryCodes: [...this.OHADA_MEMBERS],
          contentText: content.substring(0, 100000),
          sourceUrl: link.url,
          sourceName: 'CCJA',
          promulgationDate: dateStr,
          language: 'fr',
        });
      } catch (error) {
        this.log('warn', `Failed to fetch CCJA decision: ${link.url} — ${(error as Error).message}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private parseFrenchDate(text: string): string | undefined {
    const regex = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
    const match = text.match(regex);
    if (!match) return undefined;

    const day = match[1].padStart(2, '0');
    const month = this.FRENCH_MONTHS[match[2].toLowerCase()];
    const year = match[3];
    if (!month) return undefined;

    return `${year}-${month}-${day}`;
  }
}
