import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Scraper, ScrapedText, FRANCOPHONE_CODES } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

const BASE = 'https://www.constituteproject.org/service';

// Map Constitute country_id to ISO-2 code
const CONSTITUTE_TO_ISO2: Record<string, string> = {
  Benin: 'BJ', Burkina_Faso: 'BF', Burundi: 'BI', Cameroon: 'CM',
  Central_African_Republic: 'CF', Chad: 'TD', Comoros: 'KM',
  Congo: 'CG', Democratic_Republic_of_the_Congo: 'CD', "Cote_d'Ivoire": 'CI',
  Djibouti: 'DJ', Gabon: 'GA', Guinea: 'GN', Equatorial_Guinea: 'GQ',
  Madagascar: 'MG', Mali: 'ML', Mauritania: 'MR', Niger: 'NE',
  Rwanda: 'RW', Senegal: 'SN', Seychelles: 'SC', Togo: 'TG',
  Tunisia: 'TN', Vanuatu: 'VU', Haiti: 'HT', Monaco: 'MC',
};

@Injectable()
export class ConstituteScraper implements Scraper {
  name = 'Constitute Project';
  private readonly logger = new Logger(ConstituteScraper.name);

  async scrape(): Promise<ScrapedText[]> {
    const results: ScrapedText[] = [];

    const { data: constitutions } = await axios.get(`${BASE}/constitutions`, {
      params: { region: 'Africa' },
      timeout: 30000,
    });

    if (!Array.isArray(constitutions)) {
      this.logger.warn('No constitutions returned from API');
      return [];
    }

    this.logger.log(`Found ${constitutions.length} African constitutions`);

    for (const c of constitutions) {
      const countryId = c.country_id || c.id?.split('_')[0];
      const iso2 = CONSTITUTE_TO_ISO2[countryId];
      if (!iso2 || !FRANCOPHONE_CODES.includes(iso2)) continue;
      if (!c.public || !c.show) continue;

      try {
        await this.delay(1000);

        const consId = c.id;
        this.logger.log(`Fetching constitution: ${consId}`);

        const { data: html } = await axios.get(`${BASE}/html`, {
          params: { cons_id: consId },
          timeout: 30000,
        });

        const contentText = typeof html === 'string'
          ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          : '';

        // Extract year from the id (e.g., "Benin_1990")
        const yearMatch = consId?.match(/(\d{4})/);
        const year = yearMatch?.[1];

        results.push({
          title: c.title_long || c.title || `Constitution ${c.country} (${year || ''})`,
          textType: TextType.CONSTITUTION,
          countryCodes: [iso2],
          contentText: contentText.substring(0, 100000),
          promulgationDate: year ? `${year}-01-01` : undefined,
          sourceUrl: `https://www.constituteproject.org/constitution/${consId}`,
          sourceName: this.name,
        });

        this.logger.log(`Scraped: ${c.title || consId}`);
      } catch (err) {
        this.logger.warn(`Failed to fetch ${c.id}: ${err.message}`);
      }
    }

    this.logger.log(`Total: ${results.length} francophone constitutions`);
    return results;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
