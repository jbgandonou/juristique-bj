import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class TogoOfficielScraper extends BaseScraper {
  name = 'Togo Documents officiels';

  private readonly BASE_URL = 'https://www.republiquetogolaise.com';
  private readonly LIST_PATH = '/documents-officiels/listes';

  async collect(): Promise<ScrapedText[]> {
    const url = `${this.BASE_URL}${this.LIST_PATH}`;
    this.log('info', `Fetching Togo documents: ${url}`);

    let html: string;
    try {
      html = await this.fetchPage(url);
    } catch (error) {
      this.addAlert({
        type: AlertType.SCRAPE_FAILED,
        severity: AlertSeverity.ERROR,
        message: `Failed to fetch republiquetogolaise.com: ${(error as Error).message}`,
      });
      return [];
    }

    return this.parseDocumentsPage(html);
  }

  private parseDocumentsPage(html: string): ScrapedText[] {
    const $ = cheerio.load(html);
    const texts: ScrapedText[] = [];

    // Documents are in a dropfiles table, links are a.title or a[href$=".pdf"]
    $('a').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const title = $(el).text().trim();

      // Only grab PDF document links
      if (!href.includes('.pdf') && !href.includes('/Documents-officiels/')) return;
      if (title.length < 5) return;

      const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;

      // Avoid duplicates
      if (texts.some((t) => t.sourceUrl === fullUrl)) return;

      // Try to extract date from title
      const dateMatch = title.match(
        /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
      );
      let promulgationDate: string | undefined;
      if (dateMatch) {
        const months: Record<string, string> = {
          janvier: '01', février: '02', mars: '03', avril: '04',
          mai: '05', juin: '06', juillet: '07', août: '08',
          septembre: '09', octobre: '10', novembre: '11', décembre: '12',
        };
        const m = months[dateMatch[2].toLowerCase()];
        if (m) {
          promulgationDate = `${dateMatch[3]}-${m}-${dateMatch[1].padStart(2, '0')}`;
        }
      } else {
        const yearMatch = title.match(/\b(20\d{2}|19\d{2})\b/);
        if (yearMatch) promulgationDate = `${yearMatch[1]}-01-01`;
      }

      texts.push({
        title,
        textType: this.detectTextType(title),
        countryCodes: ['TG'],
        sourceUrl: fullUrl,
        sourceName: 'Togo Documents officiels',
        promulgationDate,
        language: 'fr',
      });
    });

    if (texts.length === 0) {
      this.addAlert({
        type: AlertType.NO_RESULTS,
        severity: AlertSeverity.WARNING,
        message: 'No documents found on republiquetogolaise.com',
      });
    }

    return texts;
  }

  private detectTextType(title: string): TextType {
    const lower = title.toLowerCase();
    if (lower.includes('constitution')) return TextType.CONSTITUTION;
    if (lower.includes('loi organique')) return TextType.LOI_ORGANIQUE;
    if (lower.includes('code') || lower.includes('loi')) return TextType.LOI;
    if (lower.includes('décret') || lower.includes('decret')) return TextType.DECRET;
    if (lower.includes('arrêté') || lower.includes('arrete')) return TextType.ARRETE;
    if (lower.includes('ordonnance')) return TextType.ORDONNANCE;
    return TextType.LOI;
  }
}
