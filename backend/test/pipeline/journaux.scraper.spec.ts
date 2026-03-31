import { JournauxScraper } from '../../src/pipeline/scrapers/journaux.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

describe('JournauxScraper', () => {
  let scraper: JournauxScraper;

  beforeEach(() => {
    scraper = new JournauxScraper();
  });

  it('should have name "Journaux officiels"', () => {
    expect(scraper.name).toBe('Journaux officiels');
  });

  it('should target 6 priority countries', () => {
    const sources = (scraper as any).SOURCES;
    expect(sources.length).toBe(6);
  });

  it('should detect text types from title', () => {
    const detect = (scraper as any).detectTextType.bind(scraper);
    expect(detect('Décret n° 2024-001 portant nomination')).toBe(TextType.DECRET);
    expect(detect('Arrêté interministériel n° 001')).toBe(TextType.ARRETE);
    expect(detect('Ordonnance n° 2024-002 relative à')).toBe(TextType.ORDONNANCE);
    expect(detect('Loi organique n° 2024-003')).toBe(TextType.LOI_ORGANIQUE);
    expect(detect('Loi n° 2024-004 portant code')).toBe(TextType.LOI);
  });
});
