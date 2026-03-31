import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base.scraper';
import { ScrapedText, ISO3_TO_ISO2 } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class FaolexScraper extends BaseScraper {
  name = 'FAOLEX';

  private readonly API_URL = 'https://fao-faolex-prod.appspot.com/api/query';
  private readonly PRIORITY_COUNTRIES = ['BEN', 'SEN', 'CIV', 'CMR', 'BFA', 'MLI'];
  private readonly MAX_PER_COUNTRY = 200;
  private readonly PAGE_SIZE = 10;
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
          const data = await this.postJson<any>(this.API_URL, query, {
            headers: { 'Content-Type': 'text/plain' },
          });

          const results = data.results ?? [];
          if (results.length === 0) {
            hasMore = false;
            break;
          }

          for (const doc of results) {
            const text = this.parseResult(doc, iso2);
            if (text) allTexts.push(text);
          }

          hasMore = data.hasMoreResults ?? false;
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
      query: `country:(${iso3})`,
      requestOptions: {
        searchApplicationId: 'searchapplications/1be285f8874b8c6bfaabf84aa9d0c1be',
      },
      facetOptions: [],
      start,
    };
  }

  private parseResult(doc: any, iso2: string): ScrapedText | null {
    // Extract metadata fields into maps (single value + all values)
    const fields: Record<string, string> = {};
    const fieldArrays: Record<string, string[]> = {};
    if (doc.metadata?.fields) {
      for (const f of doc.metadata.fields) {
        const values = f.textValues?.values ?? [];
        if (values.length > 0) {
          fields[f.name] = values[0];
          fieldArrays[f.name] = values;
        }
      }
    }

    const title = fields.titleOfText ?? doc.title;
    if (!title) return null;

    const faolexId = fields.faolexId;

    // Source URL: FAOLEX detail page
    const sourceUrl = faolexId
      ? `https://www.fao.org/faolex/results/details/en/c/${faolexId}`
      : undefined;

    // PDF link: try linksToFullText first, then alternativeLinks
    const pdfFilename = fields.linksToFullText ?? fields.alternativeLinks;
    const pdfUrl = pdfFilename
      ? `https://faolex.fao.org/docs/pdf/${pdfFilename}`
      : undefined;

    const dateStr = fields.dateOfText;
    let promulgationDate: string | undefined;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        promulgationDate = parsed.toISOString().split('T')[0];
      }
    }

    const typeStr = fields.typeOfTextCode ?? '';
    const textType = this.detectTextTypeFromTitle(title) ?? this.mapTextType(typeStr);
    const abstract = fields.abstract ?? '';

    // Build content: abstract from FAOLEX (this is real data from FAO, not generated)
    // Include PDF link so users can access the full official document
    let contentText = abstract;
    if (pdfUrl) {
      contentText = contentText
        ? `${contentText}\n\n📄 Document PDF officiel : ${pdfUrl}`
        : `📄 Document PDF officiel : ${pdfUrl}`;
    }

    return {
      title,
      textType,
      countryCodes: [iso2],
      contentText,
      summary: abstract || undefined,
      sourceUrl: pdfUrl ?? sourceUrl,
      sourceName: 'FAOLEX',
      promulgationDate,
      language: 'fr',
      reference: faolexId ? `FAOLEX-${faolexId}` : undefined,
    };
  }

  private detectTextTypeFromTitle(title: string): TextType | null {
    const lower = title.toLowerCase();
    if (lower.startsWith('décret') || lower.startsWith('decret')) return TextType.DECRET;
    if (lower.startsWith('arrêté') || lower.startsWith('arrete') || lower.startsWith('arrêt')) return TextType.ARRETE;
    if (lower.startsWith('ordonnance')) return TextType.ORDONNANCE;
    if (lower.includes('loi organique')) return TextType.LOI_ORGANIQUE;
    if (lower.startsWith('loi')) return TextType.LOI;
    if (lower.startsWith('constitution')) return TextType.CONSTITUTION;
    return null;
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
