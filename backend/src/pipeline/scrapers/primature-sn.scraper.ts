import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class PrimatureSnScraper extends BaseScraper {
  name = 'Primature Sénégal';

  private readonly BASE_URL = 'https://primature.sn';
  private readonly LIST_PATH = '/publications/lois-et-reglements/lois-et-decrets';
  private readonly MAX_PAGES = 4;
  private readonly DELAY_MS = 2000;

  async collect(): Promise<ScrapedText[]> {
    // Step 1: Collect all links from list pages
    const links: { title: string; url: string }[] = [];

    for (let page = 0; page < this.MAX_PAGES; page++) {
      const url = page === 0
        ? `${this.BASE_URL}${this.LIST_PATH}`
        : `${this.BASE_URL}${this.LIST_PATH}?page=${page}`;

      this.log('info', `Fetching list page ${page + 1}/${this.MAX_PAGES}: ${url}`);

      try {
        const html = await this.fetchPage(url);
        const pageLinks = this.parseListPage(html);
        if (pageLinks.length === 0) break;
        links.push(...pageLinks);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.WARNING,
          message: `Failed to fetch primature.sn page ${page}: ${(error as Error).message}`,
        });
        break;
      }

      await this.sleep(this.DELAY_MS);
    }

    // Step 2: Fetch detail page for each link to get full text content
    const allTexts: ScrapedText[] = [];
    for (const link of links) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const text = this.parseDetailPage(link.title, link.url, detailHtml);
        allTexts.push(text);
      } catch (error) {
        // If detail page fails, still keep the metadata
        this.log('debug', `Failed to fetch detail: ${link.url}`);
        allTexts.push({
          title: link.title,
          textType: this.detectTextType(link.title),
          countryCodes: ['SN'],
          sourceUrl: link.url,
          sourceName: 'Primature Sénégal',
          promulgationDate: this.extractDate(link.title),
          language: 'fr',
        });
      }

      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private parseListPage(html: string): { title: string; url: string }[] {
    const $ = cheerio.load(html);
    const links: { title: string; url: string }[] = [];

    $('a[href*="/publications/lois-et-reglements/"]').each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href') ?? '';

      if (title.length < 15) return;
      if (href === this.LIST_PATH || href.endsWith('lois-et-decrets')) return;

      const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
      if (!links.some((l) => l.url === fullUrl)) {
        links.push({ title, url: fullUrl });
      }
    });

    return links;
  }

  private parseDetailPage(title: string, url: string, html: string): ScrapedText {
    const $ = cheerio.load(html);

    // Extract main content — try common selectors for Drupal/CMS sites
    let content = '';
    const selectors = [
      'article', 'main', '[role="main"]',
      '.content', '.main-content', '.field--name-body',
      '.node__content', '.entry-content',
    ];
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length && el.text().trim().length > 100) {
        content = el.text().trim();
        break;
      }
    }

    // Fallback: grab all paragraphs if no container found
    if (!content) {
      const paragraphs: string[] = [];
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 20) paragraphs.push(text);
      });
      content = paragraphs.join('\n\n');
    }

    return {
      title,
      textType: this.detectTextType(title),
      countryCodes: ['SN'],
      contentText: content.substring(0, 100000) || undefined,
      sourceUrl: url,
      sourceName: 'Primature Sénégal',
      promulgationDate: this.extractDate(title),
      language: 'fr',
    };
  }

  private extractDate(title: string): string | undefined {
    const dateMatch = title.match(
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i,
    );
    if (dateMatch) {
      const months: Record<string, string> = {
        janvier: '01', février: '02', mars: '03', avril: '04',
        mai: '05', juin: '06', juillet: '07', août: '08',
        septembre: '09', octobre: '10', novembre: '11', décembre: '12',
      };
      const m = months[dateMatch[2].toLowerCase()];
      if (m) return `${dateMatch[3]}-${m}-${dateMatch[1].padStart(2, '0')}`;
    }
    const yearMatch = title.match(/\b(20\d{2}|19\d{2})\b/);
    if (yearMatch) return `${yearMatch[1]}-01-01`;
    return undefined;
  }

  private detectTextType(title: string): TextType {
    const lower = title.toLowerCase();
    if (lower.includes('loi organique')) return TextType.LOI_ORGANIQUE;
    if (lower.includes('loi')) return TextType.LOI;
    if (lower.includes('ordonnance')) return TextType.ORDONNANCE;
    if (lower.includes('arrêté') || lower.includes('arrete')) return TextType.ARRETE;
    return TextType.DECRET;
  }
}
