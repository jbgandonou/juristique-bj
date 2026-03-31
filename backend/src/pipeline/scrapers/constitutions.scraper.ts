import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

interface ConstitutionSource {
  countryCode: string;
  countryName: string;
  urls: string[];
  selectors: string[];
}

@Injectable()
export class ConstitutionsScraper extends BaseScraper {
  name = 'Constitutions';

  private readonly DELAY_MS = 2000;

  private readonly SOURCES: ConstitutionSource[] = [
    {
      countryCode: 'BJ',
      countryName: 'Bénin',
      urls: [
        'https://mjp.univ-perp.fr/constit/bj.htm',
        'https://www.constituteproject.org/constitution/Benin_1990',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'SN',
      countryName: 'Sénégal',
      urls: [
        'https://mjp.univ-perp.fr/constit/sn.htm',
        'https://www.constituteproject.org/constitution/Senegal_2016',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      urls: [
        'https://mjp.univ-perp.fr/constit/ci.htm',
        'https://www.constituteproject.org/constitution/Cote_DIvoire_2016',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'CM',
      countryName: 'Cameroun',
      urls: [
        'https://mjp.univ-perp.fr/constit/cm.htm',
        'https://www.constituteproject.org/constitution/Cameroon_2008',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'BF',
      countryName: 'Burkina Faso',
      urls: [
        'https://mjp.univ-perp.fr/constit/bf.htm',
        'https://www.constituteproject.org/constitution/Burkina_Faso_2015',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'ML',
      countryName: 'Mali',
      urls: [
        'https://mjp.univ-perp.fr/constit/ml.htm',
        'https://www.constituteproject.org/constitution/Mali_1992',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
  ];

  async collect(): Promise<ScrapedText[]> {
    const results: ScrapedText[] = [];

    for (const source of this.SOURCES) {
      this.log('info', `Scraping constitution for ${source.countryName}...`);
      const text = await this.scrapeConstitution(source);
      if (text) results.push(text);
      await this.sleep(this.DELAY_MS);
    }

    return results;
  }

  private async scrapeConstitution(source: ConstitutionSource): Promise<ScrapedText | null> {
    for (const url of source.urls) {
      try {
        // Fetch as arraybuffer to handle ISO-8859-1 encoding (common on MJP)
        const response = await this.fetchPage(url, {
          responseType: 'arraybuffer',
          responseEncoding: 'binary',
        } as any);
        const buf = Buffer.from(response, 'binary');
        // Check if page declares ISO-8859-1 encoding
        const probe = buf.toString('ascii').substring(0, 1000).toLowerCase();
        const htmlStr = (probe.includes('iso-8859-1') || probe.includes('latin1'))
          ? buf.toString('latin1')
          : buf.toString('utf-8');
        const $ = cheerio.load(htmlStr);

        let content = '';
        for (const selector of source.selectors) {
          const el = $(selector).first();
          if (el.length && el.text().trim().length > 200) {
            content = el.text().trim();
            break;
          }
        }

        if (content.length < 200) {
          this.log('warn', `Constitution content too short from ${url} (${content.length} chars)`);
          continue;
        }

        // Detect if content is in French (include accent-free variants for ISO-8859 pages)
        const frenchWords = [
          'article', 'titre', 'chapitre', 'constitution', 'peuple',
          'republique', 'république', 'préambule', 'preambule',
          'nationale', 'souverain', 'citoyen', 'democratique',
        ];
        const lowerContent = content.substring(0, 3000).toLowerCase();
        const frenchScore = frenchWords.filter((w) => lowerContent.includes(w)).length;

        if (frenchScore < 1) {
          this.log('warn', `Constitution from ${url} may not be in French (score: ${frenchScore})`);
          this.addAlert({
            type: AlertType.VALIDATION_ERROR,
            severity: AlertSeverity.WARNING,
            message: `Constitution for ${source.countryName} may not be in French`,
            metadata: { url, frenchScore },
          });
          continue;
        }

        return {
          title: `Constitution de la République du ${source.countryName}`,
          textType: TextType.CONSTITUTION,
          countryCodes: [source.countryCode],
          contentText: content.substring(0, 200000),
          sourceUrl: url,
          sourceName: 'Constitutions',
          language: 'fr',
        };
      } catch (error) {
        this.log('warn', `Failed to fetch constitution from ${url}: ${(error as Error).message}`);
      }
    }

    this.addAlert({
      type: AlertType.SCRAPE_FAILED,
      severity: AlertSeverity.ERROR,
      message: `Could not find constitution for ${source.countryName} from any source`,
      metadata: { countryCode: source.countryCode, urls: source.urls },
    });
    return null;
  }
}
