import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { Scraper, ScrapedText, ISO3_TO_ISO2 } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

// FAOLEX CSV bulk download URL (complete collection)
const CSV_URL = 'https://opendata.fao.org/faolex/faolex.csv';

// Map FAOLEX type of text to our TextType
const TYPE_MAP: Record<string, TextType> = {
  Legislation: TextType.LOI,
  Regulation: TextType.DECRET,
  Constitution: TextType.CONSTITUTION,
  'International agreement': TextType.TRAITE,
  Policy: TextType.LOI,
  'Miscellaneous': TextType.LOI,
};

@Injectable()
export class FaolexScraper implements Scraper {
  name = 'FAOLEX';
  private readonly logger = new Logger(FaolexScraper.name);

  async scrape(): Promise<ScrapedText[]> {
    this.logger.log('Downloading FAOLEX CSV (this may take a while)...');

    const { data: csvData } = await axios.get(CSV_URL, {
      responseType: 'text',
      timeout: 300000, // 5 min for large CSV
    });

    this.logger.log('Parsing CSV...');

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    this.logger.log(`Parsed ${records.length} records, filtering francophone Africa...`);

    const results: ScrapedText[] = [];
    const iso3Codes = Object.keys(ISO3_TO_ISO2);

    for (const row of records as Record<string, string>[]) {
      // FAOLEX uses ISO-3 country codes
      const countryIso3 = (row.Country || row.country || '').trim().toUpperCase();
      const iso2 = ISO3_TO_ISO2[countryIso3];
      if (!iso2) continue;

      const title = (row.Title || row.title_of_text || row['Title of text'] || '').trim();
      if (!title) continue;

      const typeStr = (row['Type of text'] || row.type_of_text || '').trim();
      const textType = TYPE_MAP[typeStr] || TextType.LOI;

      const year = (row.Year || row.year || '').trim();
      const faolexId = (row['FAOLEX No'] || row.faolexId || row.faolex_id || '').trim();
      const sourceUrl = faolexId
        ? `https://www.fao.org/faolex/results/details/en/c/${faolexId}/`
        : undefined;

      const abstract = (row.Abstract || row.abstract || '').trim();

      results.push({
        title,
        textType,
        countryCodes: [iso2],
        contentText: abstract || undefined,
        summary: abstract ? abstract.substring(0, 500) : undefined,
        reference: faolexId || undefined,
        promulgationDate: year ? `${year}-01-01` : undefined,
        sourceUrl,
        sourceName: this.name,
      });
    }

    this.logger.log(`Found ${results.length} texts for francophone Africa`);
    return results;
  }
}
