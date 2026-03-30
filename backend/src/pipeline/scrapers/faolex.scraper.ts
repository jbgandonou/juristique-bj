import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Scraper, ScrapedText, FRANCOPHONE_CODES, ISO3_TO_ISO2 } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

// FAOLEX search URL — returns HTML results filtered by country ISO-3 code
const SEARCH_URL = 'https://www.fao.org/faolex/results/details/en/c/LEX-FAOC';
const BASE_SEARCH = 'https://www.fao.org/faolex/results/en/';

// Map FAOLEX type to our TextType
const TYPE_MAP: Record<string, TextType> = {
  Legislation: TextType.LOI,
  Regulation: TextType.DECRET,
  Constitution: TextType.CONSTITUTION,
  Policy: TextType.LOI,
};

// Focus on a subset of countries per run to avoid timeouts
const PRIORITY_COUNTRIES_ISO3 = [
  'BEN', 'SEN', 'CIV', 'CMR', 'BFA', 'MLI', 'NER', 'TGO',
  'GAB', 'COG', 'TCD', 'GIN', 'MDG', 'MRT',
];

@Injectable()
export class FaolexScraper implements Scraper {
  name = 'FAOLEX';
  private readonly logger = new Logger(FaolexScraper.name);

  async scrape(): Promise<ScrapedText[]> {
    const results: ScrapedText[] = [];

    for (const iso3 of PRIORITY_COUNTRIES_ISO3) {
      const iso2 = ISO3_TO_ISO2[iso3];
      if (!iso2) continue;

      try {
        await this.delay(2000);
        this.logger.log(`Scraping FAOLEX for country: ${iso3}`);

        const { data: html } = await axios.get(BASE_SEARCH, {
          params: {
            query: `country:(${iso3})`,
            sort: 'date desc',
          },
          timeout: 30000,
          headers: {
            'User-Agent': 'JusAfrica/1.0 (legal research platform)',
            'Accept': 'text/html',
          },
        });

        const $ = cheerio.load(html);
        let count = 0;

        // Parse search results — FAOLEX uses various result layouts
        $('article, .result-item, .search-result, [class*="result"]').each((_, el) => {
          if (count >= 20) return; // max 20 per country per run

          const titleEl = $(el).find('h2 a, h3 a, .title a, a[href*="LEX-FAOC"]').first();
          const title = titleEl.text().trim();
          const href = titleEl.attr('href') || '';

          if (!title || title.length < 5) return;

          const sourceUrl = href.startsWith('http') ? href : `https://www.fao.org${href}`;

          // Try to extract date
          const dateText = $(el).text();
          const yearMatch = dateText.match(/\b(19|20)\d{2}\b/);
          const year = yearMatch?.[0];

          // Try to detect type
          const typeText = $(el).find('.type, .document-type, [class*="type"]').text().trim();
          const textType = TYPE_MAP[typeText] || TextType.LOI;

          // Extract abstract if available
          const abstract = $(el).find('.abstract, .summary, p').first().text().trim();

          results.push({
            title: title.substring(0, 500),
            textType,
            countryCodes: [iso2],
            contentText: abstract || undefined,
            summary: abstract ? abstract.substring(0, 500) : undefined,
            promulgationDate: year ? `${year}-01-01` : undefined,
            sourceUrl,
            sourceName: this.name,
          });

          count++;
        });

        this.logger.log(`Found ${count} results for ${iso3}`);
      } catch (err) {
        this.logger.warn(`Failed to scrape FAOLEX for ${iso3}: ${err.message}`);
      }
    }

    this.logger.log(`Total: ${results.length} FAOLEX texts`);
    return results;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
