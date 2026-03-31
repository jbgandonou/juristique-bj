import { TextType } from '../../legal-texts/entities/legal-text.entity';

export enum AlertType {
  SCRAPE_FAILED = 'scrape_failed',
  STRUCTURE_CHANGED = 'structure_changed',
  NO_RESULTS = 'no_results',
  VALIDATION_ERROR = 'validation_error',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface ScraperAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata?: Record<string, any>;
}

export interface ScrapedText {
  title: string;
  textType: TextType;
  countryCodes: string[];
  contentText?: string;
  contentHtml?: string;
  summary?: string;
  reference?: string;
  promulgationDate?: string;
  sourceUrl?: string;
  sourceName: string;
  language?: string;
}

export interface Scraper {
  name: string;
  scrape(): Promise<ScrapedText[]>;
}

// 26 francophone African country codes (ISO-2)
export const FRANCOPHONE_CODES = [
  'BJ', 'BF', 'BI', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
  'CI', 'DJ', 'GA', 'GN', 'GQ', 'HT', 'MG', 'ML', 'MR',
  'MC', 'NE', 'RW', 'SN', 'SC', 'TG', 'TN', 'VU',
];

// ISO-3 to ISO-2 mapping for FAOLEX
export const ISO3_TO_ISO2: Record<string, string> = {
  BEN: 'BJ', BFA: 'BF', BDI: 'BI', CMR: 'CM', CAF: 'CF',
  TCD: 'TD', COM: 'KM', COG: 'CG', COD: 'CD', CIV: 'CI',
  DJI: 'DJ', GAB: 'GA', GIN: 'GN', GNQ: 'GQ', HTI: 'HT',
  MDG: 'MG', MLI: 'ML', MRT: 'MR', MCO: 'MC', NER: 'NE',
  RWA: 'RW', SEN: 'SN', SYC: 'SC', TGO: 'TG', TUN: 'TN',
  VUT: 'VU',
};
