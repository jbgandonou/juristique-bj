import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper, ScrapedText } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

const BASE_URL = 'https://www.ohada.org';
const ACTES_URL = `${BASE_URL}/actes-uniformes/`;

// 17 OHADA member state codes
const OHADA_MEMBERS = [
  'BJ', 'BF', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
  'CI', 'GQ', 'GA', 'GN', 'ML', 'NE', 'SN', 'TG',
];

@Injectable()
export class OhadaScraper implements Scraper {
  name = 'OHADA';
  private readonly logger = new Logger(OhadaScraper.name);

  async scrape(): Promise<ScrapedText[]> {
    const results: ScrapedText[] = [];

    try {
      this.logger.log('Fetching OHADA Actes Uniformes listing...');
      const { data: html } = await axios.get(ACTES_URL, { timeout: 30000 });
      const $ = cheerio.load(html);

      // Find links to individual Actes Uniformes
      const links: { title: string; url: string }[] = [];

      $('a').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (
          text.length > 10 &&
          (href.includes('acte-uniforme') || text.toLowerCase().includes('acte uniforme'))
        ) {
          const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (!links.find((l) => l.url === url)) {
            links.push({ title: text, url });
          }
        }
      });

      this.logger.log(`Found ${links.length} Actes Uniformes links`);

      for (const link of links) {
        try {
          await this.delay(2000);

          this.logger.log(`Scraping: ${link.title}`);
          const { data: pageHtml } = await axios.get(link.url, { timeout: 30000 });
          const page$ = cheerio.load(pageHtml);

          // Extract main content
          const contentEl = page$('.entry-content, .elementor-widget-container, article, .post-content').first();
          const contentText = contentEl.length
            ? contentEl.text().replace(/\s+/g, ' ').trim()
            : page$('body').text().replace(/\s+/g, ' ').trim().substring(0, 50000);

          // Try to extract date from title or content
          const dateMatch = link.title.match(/(\d{1,2})\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s*(\d{4})/i);
          let promulgationDate: string | undefined;
          if (dateMatch) {
            const months: Record<string, string> = {
              janvier: '01', février: '02', mars: '03', avril: '04',
              mai: '05', juin: '06', juillet: '07', août: '08',
              septembre: '09', octobre: '10', novembre: '11', décembre: '12',
            };
            const month = months[dateMatch[2].toLowerCase()] || '01';
            promulgationDate = `${dateMatch[3]}-${month}-${dateMatch[1].padStart(2, '0')}`;
          }

          results.push({
            title: link.title.substring(0, 500),
            textType: TextType.ACTE_UNIFORME,
            countryCodes: [...OHADA_MEMBERS],
            contentText: contentText.substring(0, 100000),
            sourceUrl: link.url,
            sourceName: this.name,
            promulgationDate,
          });
        } catch (err) {
          this.logger.warn(`Failed to scrape ${link.url}: ${err.message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to fetch OHADA listing: ${err.message}`);
    }

    this.logger.log(`Scraped ${results.length} OHADA texts`);
    return results;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
