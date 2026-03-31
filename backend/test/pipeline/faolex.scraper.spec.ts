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

  it('should filter by French language in API query', () => {
    const query = (scraper as any).buildQuery('BEN', 0);
    expect(query.query).toContain('language:(FRA)');
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
});
