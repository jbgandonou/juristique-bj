import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Scraper, ScrapedText, FRANCOPHONE_CODES } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

const BASE = 'https://www.constituteproject.org/service';

// Constitute uses lowercase country codes in constitution IDs
const CODE_TO_CONSTITUTE: Record<string, string> = {
  BJ: 'Benin', BF: 'Burkina_Faso', BI: 'Burundi', CM: 'Cameroon',
  CF: 'Central_African_Republic', TD: 'Chad', KM: 'Comoros',
  CG: 'Congo', CD: 'Democratic_Republic_of_the_Congo', CI: 'Cote_dIvoire',
  DJ: 'Djibouti', GA: 'Gabon', GN: 'Guinea', GQ: 'Equatorial_Guinea',
  MG: 'Madagascar', ML: 'Mali', MR: 'Mauritania', NE: 'Niger',
  RW: 'Rwanda', SN: 'Senegal', SC: 'Seychelles', TG: 'Togo',
  TN: 'Tunisia', VU: 'Vanuatu', HT: 'Haiti', MC: 'Monaco',
};

@Injectable()
export class ConstituteScraper implements Scraper {
  name = 'Constitute Project';
  private readonly logger = new Logger(ConstituteScraper.name);

  async scrape(): Promise<ScrapedText[]> {
    const results: ScrapedText[] = [];

    // Get all African constitutions
    const { data: constitutions } = await axios.get(`${BASE}/constitutions`, {
      params: { region: 'Africa' },
    });

    if (!Array.isArray(constitutions)) {
      this.logger.warn('No constitutions returned from API');
      return [];
    }

    for (const constitution of constitutions) {
      const country = constitution.country;
      // Find matching ISO-2 code
      const code = Object.entries(CODE_TO_CONSTITUTE).find(
        ([, name]) => name.toLowerCase() === country?.toLowerCase(),
      )?.[0];

      if (!code || !FRANCOPHONE_CODES.includes(code)) continue;

      try {
        // Delay between requests
        await this.delay(1000);

        const consId = constitution.constitution_id || constitution.id;
        if (!consId) continue;

        const { data: html } = await axios.get(`${BASE}/html`, {
          params: { cons_id: consId },
        });

        const contentText = typeof html === 'string'
          ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          : '';

        results.push({
          title: `Constitution ${constitution.country} (${constitution.year || ''})`.trim(),
          textType: TextType.CONSTITUTION,
          countryCodes: [code],
          contentText: contentText.substring(0, 100000), // limit size
          promulgationDate: constitution.year ? `${constitution.year}-01-01` : undefined,
          sourceUrl: `https://www.constituteproject.org/constitution/${consId}`,
          sourceName: this.name,
        });

        this.logger.log(`Scraped constitution: ${constitution.country} (${constitution.year})`);
      } catch (err) {
        this.logger.warn(`Failed to fetch constitution for ${country}: ${err.message}`);
      }
    }

    return results;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
