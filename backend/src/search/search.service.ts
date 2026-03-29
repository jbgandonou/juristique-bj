import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Typesense from 'typesense';
import { Client } from 'typesense';

const COLLECTION_NAME = 'legal_texts';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Typesense.Client({
      nodes: [{
        host: this.configService.get('TYPESENSE_HOST') || 'localhost',
        port: parseInt(this.configService.get('TYPESENSE_PORT') || '8108'),
        protocol: 'http',
      }],
      apiKey: this.configService.get('TYPESENSE_API_KEY') || 'juristique_dev_key',
      connectionTimeoutSeconds: 5,
    });
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection() {
    try {
      await this.client.collections(COLLECTION_NAME).retrieve();
      this.logger.log(`Collection '${COLLECTION_NAME}' already exists`);
    } catch {
      this.logger.log(`Creating collection '${COLLECTION_NAME}'...`);
      await this.client.collections().create({
        name: COLLECTION_NAME,
        fields: [
          { name: 'title', type: 'string' },
          { name: 'reference', type: 'string', optional: true },
          { name: 'contentText', type: 'string', optional: true },
          { name: 'summary', type: 'string', optional: true },
          { name: 'textType', type: 'string', facet: true },
          { name: 'countryCode', type: 'string', facet: true },
          { name: 'countryName', type: 'string', facet: true },
          { name: 'themeSlugs', type: 'string[]', facet: true },
          { name: 'themeNames', type: 'string[]', facet: true },
          { name: 'isInForce', type: 'bool', facet: true },
          { name: 'isVerified', type: 'bool', facet: true },
          { name: 'hierarchyRank', type: 'int32' },
          { name: 'promulgationDate', type: 'int64', optional: true },
          { name: 'status', type: 'string', facet: true },
        ],
        default_sorting_field: 'promulgationDate',
      });
      this.logger.log(`Collection '${COLLECTION_NAME}' created`);
    }
  }

  async indexDocument(doc: {
    id: string;
    title: string;
    reference?: string;
    contentText?: string;
    summary?: string;
    textType: string;
    countryCode: string;
    countryName: string;
    themeSlugs: string[];
    themeNames: string[];
    isInForce: boolean;
    isVerified: boolean;
    hierarchyRank: number;
    promulgationDate?: Date;
    status: string;
  }) {
    const typesenseDoc = {
      ...doc,
      promulgationDate: doc.promulgationDate
        ? Math.floor(new Date(doc.promulgationDate).getTime() / 1000)
        : 0,
    };

    try {
      await this.client.collections(COLLECTION_NAME).documents().upsert(typesenseDoc);
    } catch (error) {
      this.logger.error(`Failed to index document ${doc.id}: ${error}`);
    }
  }

  async removeDocument(id: string) {
    try {
      await this.client.collections(COLLECTION_NAME).documents(id).delete();
    } catch (error) {
      this.logger.error(`Failed to remove document ${id}: ${error}`);
    }
  }

  async search(params: {
    q: string;
    countryCode?: string;
    themeSlug?: string;
    textType?: string;
    isInForce?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { q, countryCode, themeSlug, textType, isInForce, page = 1, limit = 20 } = params;

    const filterBy: string[] = ['status:=published'];
    if (countryCode) filterBy.push(`countryCode:=${countryCode}`);
    if (themeSlug) filterBy.push(`themeSlugs:=${themeSlug}`);
    if (textType) filterBy.push(`textType:=${textType}`);
    if (isInForce !== undefined) filterBy.push(`isInForce:=${isInForce}`);

    const result = await this.client.collections(COLLECTION_NAME).documents().search({
      q: q || '*',
      query_by: 'title,reference,contentText,summary',
      filter_by: filterBy.join(' && '),
      sort_by: q ? '_text_match:desc,promulgationDate:desc' : 'promulgationDate:desc',
      page,
      per_page: limit,
      highlight_full_fields: 'title,summary',
      snippet_threshold: 50,
    });

    return {
      data: result.hits?.map((hit: any) => ({
        id: hit.document.id,
        ...hit.document,
        highlights: hit.highlights,
      })) || [],
      total: result.found || 0,
      page,
      limit,
      totalPages: Math.ceil((result.found || 0) / limit),
    };
  }
}
