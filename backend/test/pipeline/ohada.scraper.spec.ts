import { OhadaScraper } from '../../src/pipeline/scrapers/ohada.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

describe('OhadaScraper', () => {
  let scraper: OhadaScraper;

  beforeEach(() => {
    scraper = new OhadaScraper();
  });

  it('should have name "OHADA"', () => {
    expect(scraper.name).toBe('OHADA');
  });

  it('should target 17 OHADA member states', () => {
    const members = (scraper as any).OHADA_MEMBERS;
    expect(members.length).toBe(17);
    expect(members).toContain('BJ');
    expect(members).toContain('SN');
    expect(members).toContain('CM');
  });

  it('should parse French dates correctly', () => {
    const parseDate = (scraper as any).parseFrenchDate.bind(scraper);
    expect(parseDate('17 octobre 1993')).toBe('1993-10-17');
    expect(parseDate('1 janvier 2024')).toBe('2024-01-01');
    expect(parseDate('no date here')).toBeUndefined();
  });

  it('should have 3 sections to scrape', () => {
    const sections = (scraper as any).SECTIONS;
    expect(sections.length).toBe(3);
    expect(sections[0].label).toBe('Actes Uniformes');
    expect(sections[1].label).toBe('Règlements');
    expect(sections[2].label).toBe('Décisions');
  });
});
