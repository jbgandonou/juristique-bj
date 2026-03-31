import { ConstitutionsScraper } from '../../src/pipeline/scrapers/constitutions.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

describe('ConstitutionsScraper', () => {
  let scraper: ConstitutionsScraper;

  beforeEach(() => {
    scraper = new ConstitutionsScraper();
  });

  it('should have name "Constitutions"', () => {
    expect(scraper.name).toBe('Constitutions');
  });

  it('should target 6 priority countries', () => {
    const sources = (scraper as any).SOURCES;
    expect(sources.length).toBe(6);
    const countryCodes = sources.map((s: any) => s.countryCode);
    expect(countryCodes).toContain('BJ');
    expect(countryCodes).toContain('SN');
    expect(countryCodes).toContain('CI');
    expect(countryCodes).toContain('CM');
    expect(countryCodes).toContain('BF');
    expect(countryCodes).toContain('ML');
  });

  it('should produce CONSTITUTION type results', async () => {
    jest.spyOn(scraper, 'fetchPage').mockResolvedValue(`
      <html><body>
        <div class="text">
          <h1>Constitution du Bénin du 11 décembre 1990</h1>
          <p>Le peuple béninois, réaffirmant son attachement aux principes de la démocratie et des droits de l'homme tels qu'ils ont été définis par la Charte des Nations Unies.</p>
          <p>TITRE PREMIER - De l'État et de la Souveraineté</p>
          <p>Article premier - La République du Bénin est une et indivisible, laïque et démocratique.</p>
          <p>Chapitre premier - Dispositions générales relatives au préambule de la constitution de la république.</p>
        </div>
      </body></html>
    `);
    jest.spyOn(scraper as any, 'sleep').mockResolvedValue(undefined);

    const results = await scraper.scrape();
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.textType).toBe(TextType.CONSTITUTION);
      expect(r.language).toBe('fr');
    }
  }, 15000);
});
