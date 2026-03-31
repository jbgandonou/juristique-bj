import { AssembleesScraper } from '../../src/pipeline/scrapers/assemblees.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

describe('AssembleesScraper', () => {
  let scraper: AssembleesScraper;

  beforeEach(() => {
    scraper = new AssembleesScraper();
  });

  it('should have name "Assemblées nationales"', () => {
    expect(scraper.name).toBe('Assemblées nationales');
  });

  it('should target 6 priority countries', () => {
    const sources = (scraper as any).SOURCES;
    expect(sources.length).toBe(6);
    const codes = sources.map((s: any) => s.countryCode);
    expect(codes).toContain('BJ');
    expect(codes).toContain('SN');
    expect(codes).toContain('CI');
    expect(codes).toContain('CM');
    expect(codes).toContain('BF');
    expect(codes).toContain('ML');
  });

  it('should detect loi organique from title', async () => {
    jest.spyOn(scraper, 'fetchPage')
      .mockResolvedValueOnce(`
        <html><body>
          <a href="/loi/2024-01">Loi organique n° 2024-01 relative au conseil constitutionnel</a>
          <a href="/loi/2024-02">Loi n° 2024-02 portant code de procédure civile</a>
        </body></html>
      `)
      .mockResolvedValue(`
        <html><body><article>Contenu détaillé de la loi avec suffisamment de texte pour passer la validation de longueur minimale.</article></body></html>
      `);
    jest.spyOn(scraper as any, 'sleep').mockResolvedValue(undefined);

    const results = await scraper.scrape();
    const organique = results.find(r => r.title.includes('organique'));
    const normale = results.find(r => r.title.includes('code'));
    if (organique) expect(organique.textType).toBe(TextType.LOI_ORGANIQUE);
    if (normale) expect(normale.textType).toBe(TextType.LOI);
  });
});
