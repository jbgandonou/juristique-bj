import { BaseScraper } from '../../src/pipeline/scrapers/base.scraper';
import {
  ScrapedText,
  ScraperAlert,
  AlertType,
  AlertSeverity,
} from '../../src/pipeline/scrapers/scraper.interface';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';

class TestScraper extends BaseScraper {
  name = 'Test';

  async collect(): Promise<ScrapedText[]> {
    return [
      {
        title: 'Loi relative au droit commercial',
        textType: TextType.LOI,
        countryCodes: ['BJ'],
        contentText: 'This is a valid legal text with enough content to pass validation checks.',
        sourceName: 'Test',
        sourceUrl: 'https://example.com/test',
        language: 'fr',
      },
    ];
  }
}

class FailingScraper extends BaseScraper {
  name = 'Failing';
  attempts = 0;
  retryDelayMs = 10;

  async collect(): Promise<ScrapedText[]> {
    this.attempts++;
    throw new Error('Network error');
  }
}

class EmptyScraper extends BaseScraper {
  name = 'Empty';

  async collect(): Promise<ScrapedText[]> {
    return [];
  }
}

describe('BaseScraper', () => {
  let scraper: TestScraper;

  beforeEach(() => {
    scraper = new TestScraper();
  });

  describe('scrape()', () => {
    it('should return scraped texts from collect()', async () => {
      const results = await scraper.scrape();
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Loi relative au droit commercial');
    });

    it('should filter out texts with empty titles', async () => {
      const spy = jest.spyOn(scraper, 'collect').mockResolvedValue([
        {
          title: '',
          textType: TextType.LOI,
          countryCodes: ['BJ'],
          contentText: 'content',
          sourceName: 'Test',
          language: 'fr',
        },
      ]);
      const results = await scraper.scrape();
      expect(results.length).toBe(0);
      spy.mockRestore();
    });

    it('should filter out texts with no country codes', async () => {
      const spy = jest.spyOn(scraper, 'collect').mockResolvedValue([
        {
          title: 'Valid Title',
          textType: TextType.LOI,
          countryCodes: [],
          contentText: 'content',
          sourceName: 'Test',
          language: 'fr',
        },
      ]);
      const results = await scraper.scrape();
      expect(results.length).toBe(0);
      spy.mockRestore();
    });

    it('should filter out texts with short titles (< 10 chars)', async () => {
      const spy = jest.spyOn(scraper, 'collect').mockResolvedValue([
        {
          title: 'Short',
          textType: TextType.LOI,
          countryCodes: ['BJ'],
          contentText: 'content enough to pass',
          sourceName: 'Test',
          language: 'fr',
        },
      ]);
      const results = await scraper.scrape();
      expect(results.length).toBe(0);
      spy.mockRestore();
    });
  });

  describe('alerts', () => {
    it('should collect NO_RESULTS alert when collect returns empty', async () => {
      const empty = new EmptyScraper();
      await empty.scrape();
      const alerts = empty.getAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe(AlertType.NO_RESULTS);
      expect(alerts[0].severity).toBe(AlertSeverity.WARNING);
    });

    it('should collect SCRAPE_FAILED alert after retry failure', async () => {
      const failing = new FailingScraper();
      const results = await failing.scrape();
      expect(results).toEqual([]);
      const alerts = failing.getAlerts();
      expect(alerts.some((a) => a.type === AlertType.SCRAPE_FAILED)).toBe(true);
      expect(failing.attempts).toBe(3); // 3 retries
    });
  });

  describe('retry()', () => {
    it('should retry failed operations up to maxAttempts', async () => {
      let count = 0;
      const fn = async () => {
        count++;
        if (count < 3) throw new Error('fail');
        return 'success';
      };
      const result = await scraper.retryOperation(fn, 3, 10);
      expect(result).toBe('success');
      expect(count).toBe(3);
    });

    it('should throw after exhausting retries', async () => {
      const fn = async () => {
        throw new Error('always fails');
      };
      await expect(scraper.retryOperation(fn, 2, 10)).rejects.toThrow('always fails');
    });
  });

  describe('validate()', () => {
    it('should reject texts with non-french language', async () => {
      const spy = jest.spyOn(scraper, 'collect').mockResolvedValue([
        {
          title: 'English Law Title Here',
          textType: TextType.LOI,
          countryCodes: ['BJ'],
          contentText: 'This is english content that should be rejected',
          sourceName: 'Test',
          sourceUrl: 'https://example.com',
          language: 'en',
        },
      ]);
      const results = await scraper.scrape();
      expect(results.length).toBe(0);
      spy.mockRestore();
    });
  });

  describe('fetchPage()', () => {
    it('should fetch a real URL and return HTML string', async () => {
      let html: string;
      try {
        html = await scraper.fetchPage('https://example.com');
      } catch (err: any) {
        // In CI/restricted environments, SSL issues may occur — skip gracefully
        if (
          err.message?.includes('certificate') ||
          err.message?.includes('CERT') ||
          err.code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY' ||
          err.code === 'ECONNREFUSED'
        ) {
          console.warn('fetchPage test skipped: network/SSL not available');
          return;
        }
        throw err;
      }
      expect(typeof html).toBe('string');
      expect(html).toContain('Example Domain');
    }, 15000);
  });
});
