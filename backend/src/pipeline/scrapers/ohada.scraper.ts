import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class OhadaScraper extends BaseScraper {
  name = 'OHADA';

  private readonly BASE_URL = 'https://www.ohada.org';
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

  private readonly SECTIONS = [
    { path: '/actes-uniformes/', type: TextType.ACTE_UNIFORME, label: 'Actes Uniformes' },
    { path: '/reglements/', type: TextType.LOI, label: 'Règlements' },
    { path: '/decisions/', type: TextType.LOI, label: 'Décisions' },
  ];

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const section of this.SECTIONS) {
      this.log('info', `Scraping OHADA ${section.label}...`);
      try {
        const texts = await this.scrapeSection(section.path, section.type);
        allTexts.push(...texts);
        this.log('info', `OHADA ${section.label}: ${texts.length} texts found`);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.ERROR,
          message: `Failed to scrape OHADA ${section.label}: ${(error as Error).message}`,
          metadata: { section: section.path },
        });
      }
      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private async scrapeSection(path: string, textType: TextType): Promise<ScrapedText[]> {
    const url = `${this.BASE_URL}${path}`;
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    const links: { title: string; url: string }[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 20 &&
        (href.includes('acte-uniforme') ||
          href.includes('reglement') ||
          href.includes('decision') ||
          href.includes(this.BASE_URL))
      ) {
        const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
        if (!links.some((l) => l.url === fullUrl)) {
          links.push({ title: text, url: fullUrl });
        }
      }
    });

    if (links.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No links found on OHADA page: ${url}. HTML structure may have changed.`,
        metadata: { url, htmlLength: html.length },
      });
      return [];
    }

    const texts: ScrapedText[] = [];

    for (const link of links) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        const content = detail$('.entry-content, .elementor-widget-container, article, .post-content')
          .first()
          .text()
          .trim();

        const dateStr = this.parseFrenchDate(link.title) ?? this.parseFrenchDate(content.substring(0, 500));

        texts.push({
          title: link.title,
          textType,
          countryCodes: [...this.OHADA_MEMBERS],
          contentText: content.substring(0, 100000),
          contentHtml: detail$('.entry-content, article').first().html() ?? undefined,
          sourceUrl: link.url,
          sourceName: 'OHADA',
          promulgationDate: dateStr,
          language: 'fr',
        });
      } catch (error) {
        this.log('warn', `Failed to fetch OHADA detail: ${link.url} — ${(error as Error).message}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return texts;
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
