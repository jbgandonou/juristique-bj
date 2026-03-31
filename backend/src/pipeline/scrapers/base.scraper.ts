import axios, { AxiosRequestConfig } from 'axios';
import {
  Scraper,
  ScrapedText,
  ScraperAlert,
  AlertType,
  AlertSeverity,
} from './scraper.interface';

export abstract class BaseScraper implements Scraper {
  abstract name: string;
  abstract collect(): Promise<ScrapedText[]>;

  protected retryDelayMs = 1000;
  private alerts: ScraperAlert[] = [];

  async scrape(): Promise<ScrapedText[]> {
    let raw: ScrapedText[];
    try {
      raw = await this.retryOperation(() => this.collect(), 3, this.retryDelayMs);
    } catch (error) {
      this.addAlert({
        type: AlertType.SCRAPE_FAILED,
        severity: AlertSeverity.ERROR,
        message: `Scraper "${this.name}" failed after 3 attempts: ${(error as Error).message}`,
        metadata: { error: (error as Error).message, stack: (error as Error).stack },
      });
      return [];
    }

    if (raw.length === 0) {
      this.addAlert({
        type: AlertType.NO_RESULTS,
        severity: AlertSeverity.WARNING,
        message: `Scraper "${this.name}" returned 0 results`,
      });
      return [];
    }

    const valid = raw.filter((doc) => this.validate(doc));
    this.log('info', `${this.name}: ${raw.length} collected, ${valid.length} valid`);
    return valid;
  }

  validate(doc: ScrapedText): boolean {
    if (!doc.title || doc.title.trim().length < 10) {
      this.log('debug', `Rejected: title too short — "${doc.title}"`);
      return false;
    }

    if (!doc.countryCodes || doc.countryCodes.length === 0) {
      this.log('debug', `Rejected: no country codes — "${doc.title}"`);
      return false;
    }

    if (doc.language && doc.language !== 'fr') {
      this.addAlert({
        type: AlertType.VALIDATION_ERROR,
        severity: AlertSeverity.INFO,
        message: `Rejected non-French text: "${doc.title}" (lang: ${doc.language})`,
      });
      return false;
    }

    return true;
  }

  async retryOperation<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 1000,
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.log('warn', `${this.name} attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`);
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(4, attempt - 1);
          await this.sleep(delay);
        }
      }
    }
    throw lastError;
  }

  async fetchPage(url: string, config?: AxiosRequestConfig): Promise<string> {
    const response = await axios.get<string>(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'JusAfrica-Bot/1.0 (legal research; contact@jusafrica.com)',
      },
      ...config,
    });
    return response.data;
  }

  async fetchJson<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await axios.get<T>(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'JusAfrica-Bot/1.0 (legal research; contact@jusafrica.com)',
      },
      ...config,
    });
    return response.data;
  }

  async postJson<T = any>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await axios.post<T>(url, data, {
      timeout: 30000,
      headers: {
        'User-Agent': 'JusAfrica-Bot/1.0 (legal research; contact@jusafrica.com)',
      },
      ...config,
    });
    return response.data;
  }

  addAlert(alert: ScraperAlert): void {
    this.alerts.push(alert);
    const level = alert.severity === AlertSeverity.ERROR ? 'error' : 'warn';
    this.log(level, `[ALERT:${alert.type}] ${alert.message}`);
  }

  getAlerts(): ScraperAlert[] {
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  log(level: string, message: string, meta?: Record<string, any>): void {
    const prefix = `[${this.name}]`;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}${metaStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}${metaStr}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}${metaStr}`);
        break;
      default:
        console.log(`${prefix} ${message}${metaStr}`);
    }
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
