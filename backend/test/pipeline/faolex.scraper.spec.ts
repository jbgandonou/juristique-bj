import { FaolexScraper } from '../../src/pipeline/scrapers/faolex.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

describe('FaolexScraper', () => {
  let scraper: FaolexScraper;

  beforeEach(() => {
    scraper = new FaolexScraper();
  });

  it('should have name "FAOLEX"', () => {
    expect(scraper.name).toBe('FAOLEX');
  });

  it('should target 6 priority countries', () => {
    const countries = (scraper as any).PRIORITY_COUNTRIES;
    expect(countries).toContain('BEN');
    expect(countries).toContain('SEN');
    expect(countries).toContain('CIV');
    expect(countries).toContain('CMR');
    expect(countries).toContain('BFA');
    expect(countries).toContain('MLI');
    expect(countries.length).toBe(6);
  });

  it('should build query with country filter and correct structure', () => {
    const query = (scraper as any).buildQuery('BEN', 0);
    expect(query.query).toContain('country:(BEN)');
    expect(query.requestOptions?.searchApplicationId).toBe(
      'searchapplications/1be285f8874b8c6bfaabf84aa9d0c1be',
    );
    expect(query.start).toBe(0);
  });

  it('should use PAGE_SIZE of 10', () => {
    expect((scraper as any).PAGE_SIZE).toBe(10);
  });

  it('should map FAOLEX types to TextType enum', () => {
    const mapType = (scraper as any).mapTextType.bind(scraper);
    expect(mapType('Legislation')).toBe(TextType.LOI);
    expect(mapType('Regulation')).toBe(TextType.DECRET);
    expect(mapType('Constitution')).toBe(TextType.CONSTITUTION);
    expect(mapType('Unknown')).toBe(TextType.LOI);
  });

  it('should map FAOLEX themes to our theme slugs', () => {
    const mapThemes = (scraper as any).mapThemes.bind(scraper);
    expect(mapThemes('Agriculture')).toContain('agriculture');
    expect(mapThemes('Environment')).toContain('environnement');
    expect(mapThemes('Water')).toContain('eau');
    expect(mapThemes('Fisheries')).toContain('peche-aquaculture');
  });

  it('should parse result from new metadata fields format', () => {
    const parseResult = (scraper as any).parseResult.bind(scraper);
    const doc = {
      title: 'filename.pdf',
      metadata: {
        fields: [
          { name: 'faolexId', textValues: { values: ['LEX-FAOC123456'] } },
          { name: 'titleOfText', textValues: { values: ['Loi sur l\'agriculture'] } },
          { name: 'dateOfText', textValues: { values: ['2020-01-15'] } },
          { name: 'typeOfTextCode', textValues: { values: ['Legislation'] } },
          { name: 'abstract', textValues: { values: ['Résumé du texte.'] } },
        ],
      },
    };

    const result = parseResult(doc, 'BJ');
    expect(result).not.toBeNull();
    expect(result.title).toBe('Loi sur l\'agriculture');
    expect(result.reference).toBe('FAOLEX-LEX-FAOC123456');
    expect(result.sourceUrl).toBe('https://www.fao.org/faolex/results/details/en/c/LEX-FAOC123456');
    expect(result.promulgationDate).toBe('2020-01-15');
    expect(result.sourceName).toBe('FAOLEX');
    expect(result.countryCodes).toEqual(['BJ']);
  });
});
