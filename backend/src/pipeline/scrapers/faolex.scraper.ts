import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base.scraper';
import { ScrapedText, ISO3_TO_ISO2 } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class FaolexScraper extends BaseScraper {
  name = 'FAOLEX';

  private readonly API_URL = 'https://faolex.fao.org/api/v1/query';
  private readonly PRIORITY_COUNTRIES = ['BEN', 'SEN', 'CIV', 'CMR', 'BFA', 'MLI'];
  private readonly MAX_PER_COUNTRY = 200;
  private readonly PAGE_SIZE = 50;
  private readonly DELAY_MS = 2000;

  private readonly THEME_MAP: Record<string, string> = {
    Agriculture: 'agriculture',
    'Cultivated plants': 'agriculture',
    Environment: 'environnement',
    'Environmental planning': 'environnement',
    Water: 'eau',
    Fisheries: 'peche-aquaculture',
    'Sea fish': 'peche-aquaculture',
    'Inland fisheries': 'peche-aquaculture',
    Forestry: 'forets',
    'Wild species & ecosystems': 'biodiversite',
    Livestock: 'elevage',
    'Animal husbandry': 'elevage',
    Energy: 'energie',
    Mining: 'mines',
    Land: 'foncier',
    'Land & soil': 'foncier',
    Food: 'alimentation',
    'Food safety': 'alimentation',
  };

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const iso3 of this.PRIORITY_COUNTRIES) {
      const iso2 = ISO3_TO_ISO2[iso3];
      if (!iso2) {
        this.log('warn', `Unknown ISO3 code: ${iso3}`);
        continue;
      }

      this.log('info', `Scraping FAOLEX for ${iso3}...`);
      let start = 0;
      let hasMore = true;

      while (hasMore && start < this.MAX_PER_COUNTRY) {
        try {
          const query = this.buildQuery(iso3, start);
          const data = await this.postJson<any>(this.API_URL, query);

          const results = data.results ?? data.response?.docs ?? [];
          if (results.length === 0) {
            hasMore = false;
            break;
          }

          for (const doc of results) {
            const text = this.parseResult(doc, iso2);
            if (text) allTexts.push(text);
          }

          hasMore = data.hasMoreResults ?? results.length >= this.PAGE_SIZE;
          start += this.PAGE_SIZE;
        } catch (error) {
          this.log('warn', `FAOLEX API error for ${iso3} at offset ${start}: ${(error as Error).message}`);
          hasMore = false;
        }

        await this.sleep(this.DELAY_MS);
      }

      this.log('info', `FAOLEX ${iso3}: ${allTexts.length} total texts so far`);
    }

    return allTexts;
  }

  private buildQuery(iso3: string, start: number): Record<string, any> {
    return {
      query: `country:(${iso3}) AND language:(FRA) AND repealed:(N)`,
      start,
      rows: this.PAGE_SIZE,
      sortField: 'dateOfText',
      sortOrder: 'DESCENDING',
    };
  }

  private parseResult(doc: any, iso2: string): ScrapedText | null {
    const title = doc.titleOfText ?? doc.title;
    if (!title) return null;

    const faolexId = doc.faolexId ?? doc.id;
    const sourceUrl = faolexId
      ? `https://www.fao.org/faolex/results/details/en/c/${faolexId}`
      : undefined;

    const dateStr = doc.dateOfText ?? doc.year;
    let promulgationDate: string | undefined;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        promulgationDate = parsed.toISOString().split('T')[0];
      }
    }

    const typeStr = doc.typeOfText ?? '';
    const textType = this.mapTextType(typeStr);

    const abstract = doc.abstract ?? doc.abstractEn ?? '';

    return {
      title,
      textType,
      countryCodes: [iso2],
      contentText: abstract,
      summary: abstract.length > 500 ? abstract.substring(0, 500) + '...' : abstract,
      sourceUrl,
      sourceName: 'FAOLEX',
      promulgationDate,
      language: 'fr',
      reference: faolexId ? `FAOLEX-${faolexId}` : undefined,
    };
  }

  private mapTextType(faoType: string): TextType {
    const normalized = faoType.toLowerCase();
    if (normalized.includes('constitution')) return TextType.CONSTITUTION;
    if (normalized.includes('regulation')) return TextType.DECRET;
    return TextType.LOI;
  }

  private mapThemes(mainArea: string): string[] {
    if (!mainArea) return [];
    const themes: string[] = [];
    for (const [keyword, slug] of Object.entries(this.THEME_MAP)) {
      if (mainArea.toLowerCase().includes(keyword.toLowerCase())) {
        if (!themes.includes(slug)) themes.push(slug);
      }
    }
    return themes;
  }
}
