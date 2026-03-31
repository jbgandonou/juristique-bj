import { CcjaScraper } from '../../src/pipeline/scrapers/ccja.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

describe('CcjaScraper', () => {
  let scraper: CcjaScraper;

  beforeEach(() => {
    scraper = new CcjaScraper();
  });

  it('should have name "CCJA"', () => {
    expect(scraper.name).toBe('CCJA');
  });

  it('should target 17 OHADA member states', () => {
    const members = (scraper as any).OHADA_MEMBERS;
    expect(members.length).toBe(17);
    expect(members).toContain('BJ');
    expect(members).toContain('SN');
  });

  it('should have JURISPRUDENCE text type available', () => {
    expect(TextType.JURISPRUDENCE).toBe('jurisprudence');
  });

  it('should parse French dates correctly', () => {
    const parseDate = (scraper as any).parseFrenchDate.bind(scraper);
    expect(parseDate('Arrêt du 15 mars 2023')).toBe('2023-03-15');
    expect(parseDate('no date')).toBeUndefined();
  });
});
