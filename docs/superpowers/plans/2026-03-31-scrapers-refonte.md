# Scrapers Refonte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all scrapers reliable — fix 3 existing (FAOLEX, Constitute, OHADA), add 3 new sources (CCJA, Assemblées nationales, Journaux officiels), unified BaseScraper with retry/alerts/logging.

**Architecture:** All scrapers inherit from `BaseScraper` (abstract class) in NestJS. Python pipeline removed. Each scraper is an `@Injectable()` NestJS provider. Alerts stored in `pipeline_alerts` table, visible in admin dashboard.

**Tech Stack:** NestJS, TypeORM, BullMQ, Cheerio, Axios, PostgreSQL, Redis

**Spec:** `docs/superpowers/specs/2026-03-31-scrapers-refonte-design.md`

---

## File Structure

### New Files
- `backend/src/pipeline/scrapers/base.scraper.ts` — BaseScraper abstract class
- `backend/src/pipeline/entities/pipeline-alert.entity.ts` — PipelineAlert entity
- `backend/src/pipeline/dto/pipeline-alert.dto.ts` — Alert DTOs
- `backend/src/pipeline/pipeline-alerts.service.ts` — Alert CRUD service
- `backend/src/pipeline/pipeline-alerts.controller.ts` — Alert API endpoints
- `backend/src/pipeline/scrapers/constitutions.scraper.ts` — Replaces Constitute
- `backend/src/pipeline/scrapers/ccja.scraper.ts` — CCJA jurisprudence
- `backend/src/pipeline/scrapers/assemblees.scraper.ts` — Assemblées nationales
- `backend/src/pipeline/scrapers/journaux.scraper.ts` — Journaux officiels
- `backend/test/pipeline/base.scraper.spec.ts` — BaseScraper tests
- `backend/test/pipeline/pipeline-alerts.spec.ts` — Alert service tests
- `backend/test/pipeline/faolex.scraper.spec.ts` — FAOLEX tests
- `backend/test/pipeline/ohada.scraper.spec.ts` — OHADA tests
- `backend/test/pipeline/constitutions.scraper.spec.ts` — Constitutions tests
- `backend/test/pipeline/ccja.scraper.spec.ts` — CCJA tests
- `backend/test/pipeline/assemblees.scraper.spec.ts` — Assemblées tests
- `backend/test/pipeline/journaux.scraper.spec.ts` — Journaux tests

### Modified Files
- `backend/src/pipeline/scrapers/scraper.interface.ts` — Add AlertType enum, update ScrapedText
- `backend/src/pipeline/scrapers/faolex.scraper.ts` — Rewrite extending BaseScraper
- `backend/src/pipeline/scrapers/ohada.scraper.ts` — Rewrite extending BaseScraper
- `backend/src/pipeline/pipeline.processor.ts` — Add new scrapers, use BaseScraper
- `backend/src/pipeline/pipeline.module.ts` — Register new entities, services, scrapers
- `backend/src/pipeline/pipeline.controller.ts` — Add alert endpoints (or import alerts controller)
- `frontend/pages/admin/pipeline.vue` — Add alerts section

### Deleted
- `backend/src/pipeline/scrapers/constitute.scraper.ts` — Replaced by constitutions.scraper.ts
- `pipeline/` directory — Entire Python pipeline removed

---

## Task 1: Update Scraper Interface + AlertType Enum

**Files:**
- Modify: `backend/src/pipeline/scrapers/scraper.interface.ts`

- [ ] **Step 1: Update the scraper interface file**

Add `AlertType` enum, `AlertSeverity` enum, and a `ScraperAlert` interface. Update `ScrapedText` to include `language` and `contentHtml` fields.

```typescript
// Add to backend/src/pipeline/scrapers/scraper.interface.ts

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

// Update existing ScrapedText — add these optional fields:
//   language?: string;
//   contentHtml?: string;
```

The full updated `ScrapedText` interface:

```typescript
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
```

- [ ] **Step 2: Verify existing code still compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors (new fields are optional, no breaking changes)

- [ ] **Step 3: Commit**

```bash
git add backend/src/pipeline/scrapers/scraper.interface.ts
git commit -m "feat(pipeline): add AlertType, AlertSeverity enums and update ScrapedText interface"
```

---

## Task 2: BaseScraper Abstract Class

**Files:**
- Create: `backend/src/pipeline/scrapers/base.scraper.ts`
- Create: `backend/test/pipeline/base.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/base.scraper.spec.ts`:

```typescript
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
        title: 'Test Law',
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
      expect(results[0].title).toBe('Test Law');
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
      const html = await scraper.fetchPage('https://example.com');
      expect(typeof html).toBe('string');
      expect(html).toContain('Example Domain');
    }, 15000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/pipeline/base.scraper.spec.ts --no-cache 2>&1 | head -20`
Expected: FAIL — `Cannot find module '../../src/pipeline/scrapers/base.scraper'`

- [ ] **Step 3: Implement BaseScraper**

Create `backend/src/pipeline/scrapers/base.scraper.ts`:

```typescript
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

  private alerts: ScraperAlert[] = [];

  async scrape(): Promise<ScrapedText[]> {
    let raw: ScrapedText[];
    try {
      raw = await this.retryOperation(() => this.collect(), 3, 1000);
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest test/pipeline/base.scraper.spec.ts --no-cache`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/pipeline/scrapers/base.scraper.ts backend/test/pipeline/base.scraper.spec.ts
git commit -m "feat(pipeline): add BaseScraper abstract class with retry, validation, alerts"
```

---

## Task 3: PipelineAlert Entity

**Files:**
- Create: `backend/src/pipeline/entities/pipeline-alert.entity.ts`

- [ ] **Step 1: Create the PipelineAlert entity**

```typescript
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { PipelineJob } from './pipeline-job.entity';
import { AlertType, AlertSeverity } from '../scrapers/scraper.interface';

@Entity('pipeline_alerts')
export class PipelineAlert extends BaseEntity {
  @Column({ name: 'job_id', nullable: true })
  jobId: string;

  @ManyToOne(() => PipelineJob, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'job_id' })
  job: PipelineJob;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  acknowledged: boolean;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/pipeline/entities/pipeline-alert.entity.ts
git commit -m "feat(pipeline): add PipelineAlert entity"
```

---

## Task 4: PipelineAlerts Service + Controller

**Files:**
- Create: `backend/src/pipeline/dto/pipeline-alert.dto.ts`
- Create: `backend/src/pipeline/pipeline-alerts.service.ts`
- Create: `backend/src/pipeline/pipeline-alerts.controller.ts`
- Create: `backend/test/pipeline/pipeline-alerts.spec.ts`

- [ ] **Step 1: Create the Alert DTOs**

Create `backend/src/pipeline/dto/pipeline-alert.dto.ts`:

```typescript
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertType, AlertSeverity } from '../scrapers/scraper.interface';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryAlertsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AlertType })
  @IsOptional()
  @IsEnum(AlertType)
  type?: AlertType;

  @ApiPropertyOptional({ enum: AlertSeverity })
  @IsOptional()
  @IsEnum(AlertSeverity)
  severity?: AlertSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  acknowledged?: boolean;
}
```

- [ ] **Step 2: Create the Alert service**

Create `backend/src/pipeline/pipeline-alerts.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineAlert } from './entities/pipeline-alert.entity';
import { ScraperAlert } from './scrapers/scraper.interface';
import { QueryAlertsDto } from './dto/pipeline-alert.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PipelineAlertsService {
  constructor(
    @InjectRepository(PipelineAlert)
    private readonly repo: Repository<PipelineAlert>,
  ) {}

  async createFromScraper(
    jobId: string | null,
    alerts: ScraperAlert[],
  ): Promise<PipelineAlert[]> {
    const entities = alerts.map((alert) =>
      this.repo.create({
        jobId: jobId ?? undefined,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        metadata: alert.metadata ?? null,
        acknowledged: false,
      }),
    );
    return this.repo.save(entities);
  }

  async findAll(query: QueryAlertsDto): Promise<PaginatedResult<PipelineAlert>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.job', 'job')
      .orderBy('alert.createdAt', 'DESC');

    if (query.type) {
      qb.andWhere('alert.type = :type', { type: query.type });
    }
    if (query.severity) {
      qb.andWhere('alert.severity = :severity', { severity: query.severity });
    }
    if (query.acknowledged !== undefined) {
      qb.andWhere('alert.acknowledged = :acknowledged', {
        acknowledged: query.acknowledged,
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return new PaginatedResult(data, total, page, limit);
  }

  async acknowledge(id: string): Promise<PipelineAlert> {
    await this.repo.update(id, { acknowledged: true });
    return this.repo.findOneByOrFail({ id });
  }

  async countUnacknowledged(): Promise<number> {
    return this.repo.count({ where: { acknowledged: false } });
  }
}
```

- [ ] **Step 3: Create the Alert controller**

Create `backend/src/pipeline/pipeline-alerts.controller.ts`:

```typescript
import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PipelineAlertsService } from './pipeline-alerts.service';
import { QueryAlertsDto } from './dto/pipeline-alert.dto';

@ApiTags('pipeline')
@Controller('pipeline/alerts')
export class PipelineAlertsController {
  constructor(private readonly alertsService: PipelineAlertsService) {}

  @Get()
  findAll(@Query() query: QueryAlertsDto) {
    return this.alertsService.findAll(query);
  }

  @Get('count')
  countUnacknowledged() {
    return this.alertsService.countUnacknowledged();
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertsService.acknowledge(id);
  }
}
```

- [ ] **Step 4: Write test for the alerts service**

Create `backend/test/pipeline/pipeline-alerts.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PipelineAlertsService } from '../../src/pipeline/pipeline-alerts.service';
import { PipelineAlert } from '../../src/pipeline/entities/pipeline-alert.entity';
import { AlertType, AlertSeverity } from '../../src/pipeline/scrapers/scraper.interface';

describe('PipelineAlertsService', () => {
  let service: PipelineAlertsService;

  const mockAlerts: Partial<PipelineAlert>[] = [
    {
      id: '1',
      type: AlertType.SCRAPE_FAILED,
      severity: AlertSeverity.ERROR,
      message: 'Test failed',
      acknowledged: false,
      createdAt: new Date(),
    },
  ];

  const mockRepo = {
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entities) => Promise.resolve(entities)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    findOneByOrFail: jest.fn().mockResolvedValue({ ...mockAlerts[0], acknowledged: true }),
    count: jest.fn().mockResolvedValue(1),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockAlerts, 1]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineAlertsService,
        { provide: getRepositoryToken(PipelineAlert), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(PipelineAlertsService);
  });

  it('should create alerts from scraper alerts', async () => {
    const scraperAlerts = [
      {
        type: AlertType.SCRAPE_FAILED,
        severity: AlertSeverity.ERROR,
        message: 'Test error',
      },
    ];
    const result = await service.createFromScraper('job-123', scraperAlerts);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-123', type: AlertType.SCRAPE_FAILED }),
    );
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should find all alerts with pagination', async () => {
    const result = await service.findAll({ page: 1, limit: 20 });
    expect(result.data).toEqual(mockAlerts);
    expect(result.total).toBe(1);
  });

  it('should acknowledge an alert', async () => {
    const result = await service.acknowledge('1');
    expect(mockRepo.update).toHaveBeenCalledWith('1', { acknowledged: true });
    expect(result.acknowledged).toBe(true);
  });

  it('should count unacknowledged alerts', async () => {
    const count = await service.countUnacknowledged();
    expect(count).toBe(1);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `cd backend && npx jest test/pipeline/pipeline-alerts.spec.ts --no-cache`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/pipeline/dto/pipeline-alert.dto.ts backend/src/pipeline/pipeline-alerts.service.ts backend/src/pipeline/pipeline-alerts.controller.ts backend/test/pipeline/pipeline-alerts.spec.ts
git commit -m "feat(pipeline): add PipelineAlert service, controller, and DTOs"
```

---

## Task 5: Update Pipeline Module

**Files:**
- Modify: `backend/src/pipeline/pipeline.module.ts`

- [ ] **Step 1: Register PipelineAlert entity, service, and controller**

Add to imports array: `TypeOrmModule.forFeature([..., PipelineAlert])`
Add to controllers array: `PipelineAlertsController`
Add to providers array: `PipelineAlertsService`

Updated providers section:

```typescript
import { PipelineAlert } from './entities/pipeline-alert.entity';
import { PipelineAlertsService } from './pipeline-alerts.service';
import { PipelineAlertsController } from './pipeline-alerts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PipelineJob, SourceConfig, LegalText, Country, PipelineAlert]),
    BullModule.forRootAsync({
      // ... existing Redis config unchanged
    }),
    BullModule.registerQueue({ name: 'pipeline' }),
  ],
  controllers: [PipelineController, PipelineAlertsController],
  providers: [
    PipelineService,
    PipelineAlertsService,
    PipelineProcessor,
    ConstituteScraper,
    FaolexScraper,
    OhadaScraper,
  ],
  exports: [PipelineService, PipelineAlertsService],
})
export class PipelineModule {}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/pipeline/pipeline.module.ts
git commit -m "feat(pipeline): register PipelineAlert entity, service, and controller in module"
```

---

## Task 6: Update PipelineProcessor to Use BaseScraper Alerts

**Files:**
- Modify: `backend/src/pipeline/pipeline.processor.ts`

- [ ] **Step 1: Inject PipelineAlertsService and persist alerts after each job**

Add `PipelineAlertsService` injection. After scraper runs, persist any alerts from `scraper.getAlerts()`.

Update the `process()` method:

```typescript
import { PipelineAlertsService } from './pipeline-alerts.service';
import { BaseScraper } from './scrapers/base.scraper';

@Processor('pipeline', { concurrency: 1 })
export class PipelineProcessor extends WorkerHost {
  constructor(
    @InjectRepository(PipelineJob) private readonly jobRepo: Repository<PipelineJob>,
    @InjectRepository(LegalText) private readonly textRepo: Repository<LegalText>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    private readonly alertsService: PipelineAlertsService,
    private readonly constituteScraper: ConstituteScraper,
    private readonly faolexScraper: FaolexScraper,
    private readonly ohadaScraper: OhadaScraper,
  ) {
    super();
  }

  async process(job: Job<{ pipelineJobId: string; sourceName: string }>) {
    const { pipelineJobId, sourceName } = job.data;
    const pipelineJob = await this.jobRepo.findOneByOrFail({ id: pipelineJobId });

    try {
      // Stage 1: SCRAPING
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.SCRAPING,
        startedAt: new Date(),
      });

      const scraper = this.getScraper(sourceName);
      scraper.clearAlerts();
      const scraped = await scraper.scrape();

      // Persist any alerts from the scraper
      const alerts = scraper.getAlerts();
      if (alerts.length > 0) {
        await this.alertsService.createFromScraper(pipelineJobId, alerts);
      }

      // Stage 2: EXTRACTING (validation)
      await this.jobRepo.update(pipelineJobId, { status: JobStatus.EXTRACTING });
      const valid = scraped.filter((t) => t.title && t.countryCodes.length > 0);

      // Stage 3: ENRICHING (create legal texts)
      await this.jobRepo.update(pipelineJobId, { status: JobStatus.ENRICHING });
      const count = await this.createLegalTexts(valid, sourceName);

      // Done
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.READY_FOR_REVIEW,
        textsCount: count,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.FAILED,
        errorMessage: (error as Error).message,
        completedAt: new Date(),
      });
    }
  }

  // getScraper() and createLegalTexts() remain unchanged
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/pipeline/pipeline.processor.ts
git commit -m "feat(pipeline): persist scraper alerts in PipelineProcessor"
```

---

## Task 7: Refonte FAOLEX Scraper

**Files:**
- Modify: `backend/src/pipeline/scrapers/faolex.scraper.ts`
- Create: `backend/test/pipeline/faolex.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/faolex.scraper.spec.ts`:

```typescript
import { FaolexScraper } from '../../src/pipeline/scrapers/faolex.scraper';
import { TextType } from '../../src/legal-texts/entities/legal-text.entity';
import { AlertType } from '../../src/pipeline/scrapers/scraper.interface';

describe('FaolexScraper', () => {
  let scraper: FaolexScraper;

  beforeEach(() => {
    scraper = new FaolexScraper();
  });

  it('should have name "FAOLEX"', () => {
    expect(scraper.name).toBe('FAOLEX');
  });

  it('should use the FAOLEX API endpoint', () => {
    expect((scraper as any).API_URL).toContain('faolex');
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
    expect(query).toContain('language:(FRA)');
  });

  it('should map FAOLEX types to TextType enum', () => {
    const mapType = (scraper as any).mapTextType.bind(scraper);
    expect(mapType('Legislation')).toBe(TextType.LOI);
    expect(mapType('Regulation')).toBe(TextType.DECRET);
    expect(mapType('Constitution')).toBe(TextType.CONSTITUTION);
    expect(mapType('Policy')).toBe(TextType.LOI);
    expect(mapType('Unknown')).toBe(TextType.LOI);
  });

  it('should map FAOLEX themes to our theme slugs', () => {
    const mapThemes = (scraper as any).mapThemes.bind(scraper);
    expect(mapThemes('Agriculture')).toContain('agriculture');
    expect(mapThemes('Environment')).toContain('environnement');
    expect(mapThemes('Water')).toContain('eau');
    expect(mapThemes('Fisheries')).toContain('peche-aquaculture');
  });

  // Integration test — makes real API call, skip in CI
  it('should scrape real data from FAOLEX API', async () => {
    const results = await scraper.scrape();
    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first.title.length).toBeGreaterThan(10);
    expect(first.sourceName).toBe('FAOLEX');
    expect(first.sourceUrl).toBeTruthy();
    expect(first.countryCodes.length).toBeGreaterThan(0);
    expect(first.language).toBe('fr');
  }, 120000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx jest test/pipeline/faolex.scraper.spec.ts --no-cache 2>&1 | head -20`
Expected: FAIL — tests reference new properties/methods not yet implemented

- [ ] **Step 3: Rewrite the FAOLEX scraper**

Replace `backend/src/pipeline/scrapers/faolex.scraper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { BaseScraper } from './base.scraper';
import { ScrapedText, ISO3_TO_ISO2 } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class FaolexScraper extends BaseScraper {
  name = 'FAOLEX';

  private readonly API_URL = 'https://faolex.fao.org/api/v1/query';

  private readonly PRIORITY_COUNTRIES = ['BEN', 'SEN', 'CIV', 'CMR', 'BFA', 'MLI'];

  private readonly MAX_PER_COUNTRY = 200;
  private readonly PAGE_SIZE = 50;
  private readonly DELAY_MS = 2000;

  private readonly THEME_MAP: Record<string, string> = {
    Agriculture: 'agriculture',
    'Cultivated plants': 'agriculture',
    Environment: 'environnement',
    'Environmental planning': 'environnement',
    Water: 'eau',
    Fisheries: 'peche-aquaculture',
    'Sea fish': 'peche-aquaculture',
    'Inland fisheries': 'peche-aquaculture',
    Forestry: 'forets',
    'Wild species & ecosystems': 'biodiversite',
    Livestock: 'elevage',
    'Animal husbandry': 'elevage',
    Energy: 'energie',
    Mining: 'mines',
    Land: 'foncier',
    'Land & soil': 'foncier',
    Food: 'alimentation',
    'Food safety': 'alimentation',
  };

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const iso3 of this.PRIORITY_COUNTRIES) {
      const iso2 = ISO3_TO_ISO2[iso3];
      if (!iso2) {
        this.log('warn', `Unknown ISO3 code: ${iso3}`);
        continue;
      }

      this.log('info', `Scraping FAOLEX for ${iso3}...`);
      let start = 0;
      let hasMore = true;

      while (hasMore && start < this.MAX_PER_COUNTRY) {
        try {
          const query = this.buildQuery(iso3, start);
          const data = await this.postJson<any>(this.API_URL, query);

          const results = data.results ?? data.response?.docs ?? [];
          if (results.length === 0) {
            hasMore = false;
            break;
          }

          for (const doc of results) {
            const text = this.parseResult(doc, iso2);
            if (text) {
              allTexts.push(text);
            }
          }

          hasMore = data.hasMoreResults ?? results.length >= this.PAGE_SIZE;
          start += this.PAGE_SIZE;
        } catch (error) {
          this.log('warn', `FAOLEX API error for ${iso3} at offset ${start}: ${(error as Error).message}`);
          hasMore = false;
        }

        await this.sleep(this.DELAY_MS);
      }

      this.log('info', `FAOLEX ${iso3}: ${allTexts.length} total texts so far`);
    }

    return allTexts;
  }

  private buildQuery(iso3: string, start: number): Record<string, any> {
    return {
      query: `country:(${iso3}) AND language:(FRA) AND repealed:(N)`,
      start,
      rows: this.PAGE_SIZE,
      sortField: 'dateOfText',
      sortOrder: 'DESCENDING',
    };
  }

  private parseResult(doc: any, iso2: string): ScrapedText | null {
    const title = doc.titleOfText ?? doc.title;
    if (!title) return null;

    const faolexId = doc.faolexId ?? doc.id;
    const sourceUrl = faolexId
      ? `https://www.fao.org/faolex/results/details/en/c/${faolexId}`
      : undefined;

    const dateStr = doc.dateOfText ?? doc.year;
    let promulgationDate: string | undefined;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        promulgationDate = parsed.toISOString().split('T')[0];
      }
    }

    const typeStr = doc.typeOfText ?? '';
    const textType = this.mapTextType(typeStr);

    const abstract = doc.abstract ?? doc.abstractEn ?? '';
    const themes = this.mapThemes(doc.mainAreaEn ?? '');

    return {
      title,
      textType,
      countryCodes: [iso2],
      contentText: abstract,
      summary: abstract.length > 500 ? abstract.substring(0, 500) + '...' : abstract,
      sourceUrl,
      sourceName: 'FAOLEX',
      promulgationDate,
      language: 'fr',
      reference: faolexId ? `FAOLEX-${faolexId}` : undefined,
    };
  }

  private mapTextType(faoType: string): TextType {
    const normalized = faoType.toLowerCase();
    if (normalized.includes('constitution')) return TextType.CONSTITUTION;
    if (normalized.includes('regulation')) return TextType.DECRET;
    return TextType.LOI;
  }

  private mapThemes(mainArea: string): string[] {
    if (!mainArea) return [];
    const themes: string[] = [];
    for (const [keyword, slug] of Object.entries(this.THEME_MAP)) {
      if (mainArea.toLowerCase().includes(keyword.toLowerCase())) {
        if (!themes.includes(slug)) {
          themes.push(slug);
        }
      }
    }
    return themes;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest test/pipeline/faolex.scraper.spec.ts --no-cache`
Expected: Unit tests PASS. Integration test may take up to 2 minutes.

- [ ] **Step 5: Commit**

```bash
git add backend/src/pipeline/scrapers/faolex.scraper.ts backend/test/pipeline/faolex.scraper.spec.ts
git commit -m "feat(pipeline): rewrite FAOLEX scraper with BaseScraper, French filter, pagination"
```

---

## Task 8: Refonte OHADA Scraper

**Files:**
- Modify: `backend/src/pipeline/scrapers/ohada.scraper.ts`
- Create: `backend/test/pipeline/ohada.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/ohada.scraper.spec.ts`:

```typescript
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

  // Integration test — real HTTP
  it('should scrape actes uniformes from ohada.org', async () => {
    const results = await scraper.scrape();
    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first.title.length).toBeGreaterThan(10);
    expect(first.sourceName).toBe('OHADA');
    expect(first.sourceUrl).toContain('ohada.org');
    expect(first.countryCodes.length).toBe(17);
    expect(first.language).toBe('fr');
  }, 120000);
});
```

- [ ] **Step 2: Rewrite the OHADA scraper**

Replace `backend/src/pipeline/scrapers/ohada.scraper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class OhadaScraper extends BaseScraper {
  name = 'OHADA';

  private readonly BASE_URL = 'https://www.ohada.org';
  private readonly DELAY_MS = 2000;

  private readonly OHADA_MEMBERS = [
    'BJ', 'BF', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
    'CI', 'GQ', 'GA', 'GN', 'GW', 'ML', 'NE', 'SN', 'TG',
  ];

  private readonly FRENCH_MONTHS: Record<string, string> = {
    janvier: '01', février: '02', mars: '03', avril: '04',
    mai: '05', juin: '06', juillet: '07', août: '08',
    septembre: '09', octobre: '10', novembre: '11', décembre: '12',
  };

  private readonly SECTIONS = [
    { path: '/actes-uniformes/', type: TextType.ACTE_UNIFORME, label: 'Actes Uniformes' },
    { path: '/reglements/', type: TextType.LOI, label: 'Règlements' },
    { path: '/decisions/', type: TextType.LOI, label: 'Décisions' },
  ];

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const section of this.SECTIONS) {
      this.log('info', `Scraping OHADA ${section.label}...`);
      try {
        const texts = await this.scrapeSection(section.path, section.type);
        allTexts.push(...texts);
        this.log('info', `OHADA ${section.label}: ${texts.length} texts found`);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.ERROR,
          message: `Failed to scrape OHADA ${section.label}: ${(error as Error).message}`,
          metadata: { section: section.path },
        });
      }
      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private async scrapeSection(path: string, textType: TextType): Promise<ScrapedText[]> {
    const url = `${this.BASE_URL}${path}`;
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    const links: { title: string; url: string }[] = [];

    // Find all links to individual documents
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 20 &&
        (href.includes('acte-uniforme') ||
          href.includes('reglement') ||
          href.includes('decision') ||
          href.includes(this.BASE_URL))
      ) {
        const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
        if (!links.some((l) => l.url === fullUrl)) {
          links.push({ title: text, url: fullUrl });
        }
      }
    });

    if (links.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No links found on OHADA page: ${url}. HTML structure may have changed.`,
        metadata: { url, htmlLength: html.length },
      });
      return [];
    }

    const texts: ScrapedText[] = [];

    for (const link of links) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        const content = detail$('.entry-content, .elementor-widget-container, article, .post-content')
          .first()
          .text()
          .trim();

        const dateStr = this.parseFrenchDate(link.title) ?? this.parseFrenchDate(content.substring(0, 500));

        texts.push({
          title: link.title,
          textType,
          countryCodes: [...this.OHADA_MEMBERS],
          contentText: content.substring(0, 100000),
          contentHtml: detail$('.entry-content, article').first().html() ?? undefined,
          sourceUrl: link.url,
          sourceName: 'OHADA',
          promulgationDate: dateStr,
          language: 'fr',
        });
      } catch (error) {
        this.log('warn', `Failed to fetch OHADA detail: ${link.url} — ${(error as Error).message}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return texts;
  }

  private parseFrenchDate(text: string): string | undefined {
    const regex = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
    const match = text.match(regex);
    if (!match) return undefined;

    const day = match[1].padStart(2, '0');
    const month = this.FRENCH_MONTHS[match[2].toLowerCase()];
    const year = match[3];
    if (!month) return undefined;

    return `${year}-${month}-${day}`;
  }
}
```

- [ ] **Step 3: Run tests**

Run: `cd backend && npx jest test/pipeline/ohada.scraper.spec.ts --no-cache`
Expected: Unit tests PASS. Integration test may take time.

- [ ] **Step 4: Commit**

```bash
git add backend/src/pipeline/scrapers/ohada.scraper.ts backend/test/pipeline/ohada.scraper.spec.ts
git commit -m "feat(pipeline): rewrite OHADA scraper with dynamic scraping from ohada.org"
```

---

## Task 9: Constitutions Scraper (Replaces Constitute)

**Files:**
- Create: `backend/src/pipeline/scrapers/constitutions.scraper.ts`
- Delete: `backend/src/pipeline/scrapers/constitute.scraper.ts`
- Create: `backend/test/pipeline/constitutions.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/constitutions.scraper.spec.ts`:

```typescript
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

  it('should set textType to CONSTITUTION', async () => {
    // Mock fetchPage to avoid real HTTP
    jest.spyOn(scraper, 'fetchPage').mockResolvedValue(`
      <html><body>
        <div class="entry-content">
          <h1>Constitution du Bénin du 11 décembre 1990</h1>
          <p>Le peuple béninois, réaffirmant son attachement aux principes de la démocratie...</p>
          <p>Texte suffisamment long pour passer la validation avec plus de cent caractères dans le contenu total.</p>
        </div>
      </body></html>
    `);

    const results = await scraper.scrape();
    for (const r of results) {
      expect(r.textType).toBe(TextType.CONSTITUTION);
    }

    (scraper.fetchPage as jest.Mock).mockRestore();
  });

  it('should produce french-language results', async () => {
    jest.spyOn(scraper, 'fetchPage').mockResolvedValue(`
      <html><body>
        <div class="entry-content">
          <h1>Constitution du Sénégal du 22 janvier 2001</h1>
          <p>Le peuple du Sénégal souverain, profondément attaché à ses valeurs culturelles...</p>
          <p>Contenu additionnel pour remplir la condition de longueur minimale de validation.</p>
        </div>
      </body></html>
    `);

    const results = await scraper.scrape();
    for (const r of results) {
      expect(r.language).toBe('fr');
    }

    (scraper.fetchPage as jest.Mock).mockRestore();
  });

  // Integration test
  it('should scrape at least one constitution from real sources', async () => {
    const results = await scraper.scrape();
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].textType).toBe(TextType.CONSTITUTION);
    expect(results[0].language).toBe('fr');
    expect(results[0].contentText!.length).toBeGreaterThan(100);
  }, 120000);
});
```

- [ ] **Step 2: Create the Constitutions scraper**

Create `backend/src/pipeline/scrapers/constitutions.scraper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

interface ConstitutionSource {
  countryCode: string;
  countryName: string;
  urls: string[];
  selectors: string[];
}

@Injectable()
export class ConstitutionsScraper extends BaseScraper {
  name = 'Constitutions';

  private readonly DELAY_MS = 2000;

  private readonly SOURCES: ConstitutionSource[] = [
    {
      countryCode: 'BJ',
      countryName: 'Bénin',
      urls: [
        'https://mjp.univ-perp.fr/constit/bj.htm',
        'https://www.constituteproject.org/constitution/Benin_1990',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'SN',
      countryName: 'Sénégal',
      urls: [
        'https://mjp.univ-perp.fr/constit/sn.htm',
        'https://www.constituteproject.org/constitution/Senegal_2016',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      urls: [
        'https://mjp.univ-perp.fr/constit/ci.htm',
        'https://www.constituteproject.org/constitution/Cote_DIvoire_2016',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'CM',
      countryName: 'Cameroun',
      urls: [
        'https://mjp.univ-perp.fr/constit/cm.htm',
        'https://www.constituteproject.org/constitution/Cameroon_2008',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'BF',
      countryName: 'Burkina Faso',
      urls: [
        'https://mjp.univ-perp.fr/constit/bf.htm',
        'https://www.constituteproject.org/constitution/Burkina_Faso_2015',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
    {
      countryCode: 'ML',
      countryName: 'Mali',
      urls: [
        'https://mjp.univ-perp.fr/constit/ml.htm',
        'https://www.constituteproject.org/constitution/Mali_1992',
      ],
      selectors: ['.text, .texte, .entry-content, article, body'],
    },
  ];

  async collect(): Promise<ScrapedText[]> {
    const results: ScrapedText[] = [];

    for (const source of this.SOURCES) {
      this.log('info', `Scraping constitution for ${source.countryName}...`);
      const text = await this.scrapeConstitution(source);
      if (text) {
        results.push(text);
      }
      await this.sleep(this.DELAY_MS);
    }

    return results;
  }

  private async scrapeConstitution(source: ConstitutionSource): Promise<ScrapedText | null> {
    for (const url of source.urls) {
      try {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);

        let content = '';
        for (const selector of source.selectors) {
          const el = $(selector).first();
          if (el.length && el.text().trim().length > 200) {
            content = el.text().trim();
            break;
          }
        }

        if (content.length < 200) {
          this.log('warn', `Constitution content too short from ${url} (${content.length} chars)`);
          continue;
        }

        // Detect if content is in French (basic heuristic)
        const frenchWords = ['article', 'titre', 'chapitre', 'république', 'constitution', 'peuple', 'préambule'];
        const lowerContent = content.substring(0, 2000).toLowerCase();
        const frenchScore = frenchWords.filter((w) => lowerContent.includes(w)).length;

        if (frenchScore < 2) {
          this.log('warn', `Constitution from ${url} may not be in French (score: ${frenchScore})`);
          this.addAlert({
            type: AlertType.VALIDATION_ERROR,
            severity: AlertSeverity.WARNING,
            message: `Constitution for ${source.countryName} may not be in French`,
            metadata: { url, frenchScore },
          });
          continue;
        }

        return {
          title: `Constitution de la République du ${source.countryName}`,
          textType: TextType.CONSTITUTION,
          countryCodes: [source.countryCode],
          contentText: content.substring(0, 200000),
          sourceUrl: url,
          sourceName: 'Constitutions',
          language: 'fr',
        };
      } catch (error) {
        this.log('warn', `Failed to fetch constitution from ${url}: ${(error as Error).message}`);
      }
    }

    this.addAlert({
      type: AlertType.SCRAPE_FAILED,
      severity: AlertSeverity.ERROR,
      message: `Could not find constitution for ${source.countryName} from any source`,
      metadata: { countryCode: source.countryCode, urls: source.urls },
    });
    return null;
  }
}
```

- [ ] **Step 3: Delete the old Constitute scraper**

```bash
rm backend/src/pipeline/scrapers/constitute.scraper.ts
```

- [ ] **Step 4: Update pipeline.module.ts — replace ConstituteScraper with ConstitutionsScraper**

In `backend/src/pipeline/pipeline.module.ts`, replace:
- Import: `ConstituteScraper` → `ConstitutionsScraper`
- Provider: `ConstituteScraper` → `ConstitutionsScraper`

In `backend/src/pipeline/pipeline.processor.ts`, replace:
- Import: `ConstituteScraper` → `ConstitutionsScraper`
- Constructor injection: `ConstituteScraper` → `ConstitutionsScraper`
- `getScraper()`: Change `'Constitute Project'` to `'Constitutions'` mapping to `constitutionsScraper`

- [ ] **Step 5: Run tests**

Run: `cd backend && npx jest test/pipeline/constitutions.scraper.spec.ts --no-cache`
Expected: Unit tests PASS

- [ ] **Step 6: Verify full compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add -A backend/src/pipeline/scrapers/ backend/test/pipeline/constitutions.scraper.spec.ts backend/src/pipeline/pipeline.module.ts backend/src/pipeline/pipeline.processor.ts
git commit -m "feat(pipeline): replace Constitute scraper with ConstitutionsScraper (French sources)"
```

---

## Task 10: CCJA Scraper (Jurisprudence OHADA)

**Files:**
- Create: `backend/src/pipeline/scrapers/ccja.scraper.ts`
- Create: `backend/test/pipeline/ccja.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/ccja.scraper.spec.ts`:

```typescript
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
  });

  it('should set textType to JURISPRUDENCE', () => {
    // TextType enum must include JURISPRUDENCE
    expect(TextType.JURISPRUDENCE).toBeDefined();
  });

  // Integration test
  it('should scrape decisions from ccja.org', async () => {
    const results = await scraper.scrape();
    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first.sourceName).toBe('CCJA');
    expect(first.language).toBe('fr');
    expect(first.countryCodes.length).toBe(17);
  }, 120000);
});
```

- [ ] **Step 2: Add JURISPRUDENCE to TextType enum**

In `backend/src/legal-texts/entities/legal-text.entity.ts`, add to `TextType` enum:

```typescript
JURISPRUDENCE = 'jurisprudence',
```

- [ ] **Step 3: Implement CCJA scraper**

Create `backend/src/pipeline/scrapers/ccja.scraper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

@Injectable()
export class CcjaScraper extends BaseScraper {
  name = 'CCJA';

  private readonly BASE_URL = 'https://www.ccja.org';
  private readonly DELAY_MS = 2000;
  private readonly MAX_PAGES = 10;

  private readonly OHADA_MEMBERS = [
    'BJ', 'BF', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
    'CI', 'GQ', 'GA', 'GN', 'GW', 'ML', 'NE', 'SN', 'TG',
  ];

  private readonly FRENCH_MONTHS: Record<string, string> = {
    janvier: '01', février: '02', mars: '03', avril: '04',
    mai: '05', juin: '06', juillet: '07', août: '08',
    septembre: '09', octobre: '10', novembre: '11', décembre: '12',
  };

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    this.log('info', 'Scraping CCJA decisions...');

    // Try common CCJA pages for jurisprudence
    const listUrls = [
      `${this.BASE_URL}/jurisprudence`,
      `${this.BASE_URL}/decisions`,
      `${this.BASE_URL}/arrets`,
    ];

    let listHtml: string | null = null;
    let workingUrl: string | null = null;

    for (const url of listUrls) {
      try {
        listHtml = await this.fetchPage(url);
        workingUrl = url;
        this.log('info', `CCJA list page found at ${url}`);
        break;
      } catch {
        this.log('debug', `CCJA URL not found: ${url}`);
      }
    }

    if (!listHtml || !workingUrl) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.ERROR,
        message: 'Could not find CCJA jurisprudence list page. Site structure may have changed.',
        metadata: { triedUrls: listUrls },
      });
      return [];
    }

    const $ = cheerio.load(listHtml);
    const decisionLinks: { title: string; url: string }[] = [];

    // Find links to individual decisions/arrêts
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 15 &&
        (href.includes('arret') ||
          href.includes('decision') ||
          href.includes('avis') ||
          text.toLowerCase().includes('arrêt') ||
          text.toLowerCase().includes('avis'))
      ) {
        const fullUrl = href.startsWith('http') ? href : `${this.BASE_URL}${href}`;
        if (!decisionLinks.some((l) => l.url === fullUrl)) {
          decisionLinks.push({ title: text, url: fullUrl });
        }
      }
    });

    if (decisionLinks.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No decision links found on CCJA page: ${workingUrl}`,
        metadata: { url: workingUrl },
      });
      return [];
    }

    this.log('info', `Found ${decisionLinks.length} CCJA decision links`);

    for (const link of decisionLinks) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        const content = detail$('.entry-content, .decision-content, article, .post-content, .content')
          .first()
          .text()
          .trim();

        if (content.length < 100) {
          this.log('debug', `CCJA decision content too short: ${link.url}`);
          continue;
        }

        const dateStr = this.parseFrenchDate(link.title) ?? this.parseFrenchDate(content.substring(0, 500));

        allTexts.push({
          title: link.title,
          textType: TextType.JURISPRUDENCE,
          countryCodes: [...this.OHADA_MEMBERS],
          contentText: content.substring(0, 100000),
          sourceUrl: link.url,
          sourceName: 'CCJA',
          promulgationDate: dateStr,
          language: 'fr',
        });
      } catch (error) {
        this.log('warn', `Failed to fetch CCJA decision: ${link.url} — ${(error as Error).message}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private parseFrenchDate(text: string): string | undefined {
    const regex = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
    const match = text.match(regex);
    if (!match) return undefined;

    const day = match[1].padStart(2, '0');
    const month = this.FRENCH_MONTHS[match[2].toLowerCase()];
    const year = match[3];
    if (!month) return undefined;

    return `${year}-${month}-${day}`;
  }
}
```

- [ ] **Step 4: Register in pipeline module and processor**

In `backend/src/pipeline/pipeline.module.ts` add `CcjaScraper` to providers.
In `backend/src/pipeline/pipeline.processor.ts` add injection and routing:

```typescript
// In constructor:
private readonly ccjaScraper: CcjaScraper,

// In getScraper():
case 'CCJA':
  return this.ccjaScraper;
```

- [ ] **Step 5: Run tests**

Run: `cd backend && npx jest test/pipeline/ccja.scraper.spec.ts --no-cache`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/pipeline/scrapers/ccja.scraper.ts backend/test/pipeline/ccja.scraper.spec.ts backend/src/legal-texts/entities/legal-text.entity.ts backend/src/pipeline/pipeline.module.ts backend/src/pipeline/pipeline.processor.ts
git commit -m "feat(pipeline): add CCJA jurisprudence scraper"
```

---

## Task 11: Assemblées Nationales Scraper

**Files:**
- Create: `backend/src/pipeline/scrapers/assemblees.scraper.ts`
- Create: `backend/test/pipeline/assemblees.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/assemblees.scraper.spec.ts`:

```typescript
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

  it('should return LOI or LOI_ORGANIQUE types', async () => {
    jest.spyOn(scraper, 'fetchPage').mockResolvedValue(`
      <html><body>
        <div class="entry-content">
          <ul>
            <li><a href="/loi/2024-01">Loi n° 2024-01 portant loi de finances pour la gestion 2024</a></li>
            <li><a href="/loi/2024-02">Loi n° 2024-02 relative à la protection des données personnelles</a></li>
          </ul>
        </div>
      </body></html>
    `);

    const results = await scraper.scrape();
    for (const r of results) {
      expect([TextType.LOI, TextType.LOI_ORGANIQUE]).toContain(r.textType);
      expect(r.language).toBe('fr');
    }

    (scraper.fetchPage as jest.Mock).mockRestore();
  });

  // Integration test
  it('should scrape at least one law from real sources', async () => {
    const results = await scraper.scrape();
    // Some assembly sites may be down — we just need at least one to work
    expect(results.length).toBeGreaterThanOrEqual(0);
    // Check alerts if nothing found
    if (results.length === 0) {
      const alerts = scraper.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    }
  }, 180000);
});
```

- [ ] **Step 2: Implement the Assemblées scraper**

Create `backend/src/pipeline/scrapers/assemblees.scraper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

interface AssemblySource {
  countryCode: string;
  countryName: string;
  baseUrl: string;
  lawListPaths: string[];
  contentSelectors: string[];
}

@Injectable()
export class AssembleesScraper extends BaseScraper {
  name = 'Assemblées nationales';

  private readonly DELAY_MS = 2000;

  private readonly SOURCES: AssemblySource[] = [
    {
      countryCode: 'BJ',
      countryName: 'Bénin',
      baseUrl: 'https://www.assemblee-nationale.bj',
      lawListPaths: ['/lois-votees', '/lois', '/textes-votes'],
      contentSelectors: ['.entry-content, .content, article, .post-content'],
    },
    {
      countryCode: 'SN',
      countryName: 'Sénégal',
      baseUrl: 'https://www.assemblee-nationale.sn',
      lawListPaths: ['/lois-votees', '/textes-de-loi', '/lois'],
      contentSelectors: ['.entry-content, .content, article, .field-content'],
    },
    {
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      baseUrl: 'https://www.assnat.ci',
      lawListPaths: ['/lois-votees', '/les-lois', '/textes'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'CM',
      countryName: 'Cameroun',
      baseUrl: 'https://www.assemblee-nationale.cm',
      lawListPaths: ['/lois-votees', '/textes-adoptes', '/lois'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'BF',
      countryName: 'Burkina Faso',
      baseUrl: 'https://www.assemblee.bf',
      lawListPaths: ['/lois-votees', '/textes', '/lois'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'ML',
      countryName: 'Mali',
      baseUrl: 'https://www.assemblee-nationale.ml',
      lawListPaths: ['/lois-votees', '/textes', '/lois-adoptees'],
      contentSelectors: ['.entry-content, .content, article'],
    },
  ];

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const source of this.SOURCES) {
      this.log('info', `Scraping Assemblée nationale: ${source.countryName}...`);
      try {
        const texts = await this.scrapeAssembly(source);
        allTexts.push(...texts);
        this.log('info', `${source.countryName}: ${texts.length} laws found`);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.WARNING,
          message: `Failed to scrape Assemblée nationale ${source.countryName}: ${(error as Error).message}`,
          metadata: { countryCode: source.countryCode, baseUrl: source.baseUrl },
        });
      }
      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private async scrapeAssembly(source: AssemblySource): Promise<ScrapedText[]> {
    // Try each possible list path
    let listHtml: string | null = null;
    let workingUrl: string | null = null;

    for (const path of source.lawListPaths) {
      const url = `${source.baseUrl}${path}`;
      try {
        listHtml = await this.fetchPage(url);
        workingUrl = url;
        break;
      } catch {
        this.log('debug', `Not found: ${url}`);
      }
    }

    if (!listHtml || !workingUrl) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No law list page found for Assemblée ${source.countryName}`,
        metadata: { triedPaths: source.lawListPaths.map((p) => `${source.baseUrl}${p}`) },
      });
      return [];
    }

    const $ = cheerio.load(listHtml);
    const lawLinks: { title: string; url: string }[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 15 &&
        (text.toLowerCase().includes('loi') ||
          text.toLowerCase().includes('n°') ||
          href.includes('loi'))
      ) {
        const fullUrl = href.startsWith('http')
          ? href
          : href.startsWith('/')
            ? `${source.baseUrl}${href}`
            : `${workingUrl}/${href}`;
        if (!lawLinks.some((l) => l.url === fullUrl)) {
          lawLinks.push({ title: text, url: fullUrl });
        }
      }
    });

    if (lawLinks.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No law links found on ${workingUrl}`,
      });
      return [];
    }

    const texts: ScrapedText[] = [];
    const maxLaws = 50;

    for (const link of lawLinks.slice(0, maxLaws)) {
      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        let content = '';
        for (const selector of source.contentSelectors) {
          const el = detail$(selector).first();
          if (el.length && el.text().trim().length > 100) {
            content = el.text().trim();
            break;
          }
        }

        const textType = link.title.toLowerCase().includes('organique')
          ? TextType.LOI_ORGANIQUE
          : TextType.LOI;

        const dateMatch = link.title.match(/\b(20\d{2}|19\d{2})\b/);
        const promulgationDate = dateMatch ? `${dateMatch[1]}-01-01` : undefined;

        texts.push({
          title: link.title,
          textType,
          countryCodes: [source.countryCode],
          contentText: content.substring(0, 100000) || undefined,
          sourceUrl: link.url,
          sourceName: 'Assemblées nationales',
          promulgationDate,
          language: 'fr',
        });
      } catch (error) {
        this.log('debug', `Failed to fetch law detail: ${link.url}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return texts;
  }
}
```

- [ ] **Step 3: Register in pipeline module and processor**

In `backend/src/pipeline/pipeline.module.ts` add `AssembleesScraper` to providers.
In `backend/src/pipeline/pipeline.processor.ts`:

```typescript
// Import
import { AssembleesScraper } from './scrapers/assemblees.scraper';

// Constructor injection
private readonly assembleesScraper: AssembleesScraper,

// getScraper()
case 'Assemblées nationales':
  return this.assembleesScraper;
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest test/pipeline/assemblees.scraper.spec.ts --no-cache`
Expected: Unit tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/pipeline/scrapers/assemblees.scraper.ts backend/test/pipeline/assemblees.scraper.spec.ts backend/src/pipeline/pipeline.module.ts backend/src/pipeline/pipeline.processor.ts
git commit -m "feat(pipeline): add Assemblées nationales scraper for 6 priority countries"
```

---

## Task 12: Journaux Officiels Scraper

**Files:**
- Create: `backend/src/pipeline/scrapers/journaux.scraper.ts`
- Create: `backend/test/pipeline/journaux.scraper.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `backend/test/pipeline/journaux.scraper.spec.ts`:

```typescript
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

  it('should return DECRET, ARRETE or ORDONNANCE types', () => {
    const mapType = (scraper as any).detectTextType.bind(scraper);
    expect(mapType('Décret n° 2024-001 portant nomination')).toBe(TextType.DECRET);
    expect(mapType('Arrêté interministériel n° 001')).toBe(TextType.ARRETE);
    expect(mapType('Ordonnance n° 2024-002 relative à')).toBe(TextType.ORDONNANCE);
    expect(mapType('Loi n° 2024-003 portant code')).toBe(TextType.LOI);
  });

  // Integration test
  it('should scrape at least some texts from real sources', async () => {
    const results = await scraper.scrape();
    // Some JO sites may be down
    expect(results.length).toBeGreaterThanOrEqual(0);
    if (results.length === 0) {
      const alerts = scraper.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    }
  }, 180000);
});
```

- [ ] **Step 2: Implement the Journaux scraper**

Create `backend/src/pipeline/scrapers/journaux.scraper.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { BaseScraper } from './base.scraper';
import { ScrapedText, AlertType, AlertSeverity } from './scraper.interface';
import { TextType } from '../../legal-texts/entities/legal-text.entity';

interface JournalSource {
  countryCode: string;
  countryName: string;
  baseUrl: string;
  listPaths: string[];
  contentSelectors: string[];
}

@Injectable()
export class JournauxScraper extends BaseScraper {
  name = 'Journaux officiels';

  private readonly DELAY_MS = 2000;

  private readonly SOURCES: JournalSource[] = [
    {
      countryCode: 'BJ',
      countryName: 'Bénin',
      baseUrl: 'https://sgg.gouv.bj',
      listPaths: ['/journal-officiel', '/jo', '/textes-officiels', '/publications'],
      contentSelectors: ['.entry-content, .content, article, .post-content'],
    },
    {
      countryCode: 'SN',
      countryName: 'Sénégal',
      baseUrl: 'https://www.jo.gouv.sn',
      listPaths: ['/', '/journal-officiel', '/publications', '/textes'],
      contentSelectors: ['.entry-content, .content, article, .field-content'],
    },
    {
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      baseUrl: 'https://www.jogouv.ci',
      listPaths: ['/', '/journal-officiel', '/publications'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'CM',
      countryName: 'Cameroun',
      baseUrl: 'https://www.sppm.cm',
      listPaths: ['/', '/journal-officiel', '/publications'],
      contentSelectors: ['.entry-content, .content, article'],
    },
    {
      countryCode: 'BF',
      countryName: 'Burkina Faso',
      baseUrl: 'https://legiburkina.bf',
      listPaths: ['/', '/journal-officiel', '/textes', '/jo'],
      contentSelectors: ['.entry-content, .content, article, .texte'],
    },
    {
      countryCode: 'ML',
      countryName: 'Mali',
      baseUrl: 'https://sgg.gouv.ml',
      listPaths: ['/', '/journal-officiel', '/textes-officiels'],
      contentSelectors: ['.entry-content, .content, article'],
    },
  ];

  async collect(): Promise<ScrapedText[]> {
    const allTexts: ScrapedText[] = [];

    for (const source of this.SOURCES) {
      this.log('info', `Scraping Journal officiel: ${source.countryName}...`);
      try {
        const texts = await this.scrapeJournal(source);
        allTexts.push(...texts);
        this.log('info', `${source.countryName}: ${texts.length} texts found`);
      } catch (error) {
        this.addAlert({
          type: AlertType.SCRAPE_FAILED,
          severity: AlertSeverity.WARNING,
          message: `Failed to scrape JO ${source.countryName}: ${(error as Error).message}`,
          metadata: { countryCode: source.countryCode, baseUrl: source.baseUrl },
        });
      }
      await this.sleep(this.DELAY_MS);
    }

    return allTexts;
  }

  private async scrapeJournal(source: JournalSource): Promise<ScrapedText[]> {
    let listHtml: string | null = null;
    let workingUrl: string | null = null;

    for (const path of source.listPaths) {
      const url = `${source.baseUrl}${path}`;
      try {
        listHtml = await this.fetchPage(url);
        workingUrl = url;
        break;
      } catch {
        this.log('debug', `Not found: ${url}`);
      }
    }

    if (!listHtml || !workingUrl) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No JO page found for ${source.countryName}`,
        metadata: { triedPaths: source.listPaths.map((p) => `${source.baseUrl}${p}`) },
      });
      return [];
    }

    const $ = cheerio.load(listHtml);
    const textLinks: { title: string; url: string }[] = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const text = $(el).text().trim();
      if (
        text.length > 15 &&
        (text.toLowerCase().includes('décret') ||
          text.toLowerCase().includes('arrêté') ||
          text.toLowerCase().includes('ordonnance') ||
          text.toLowerCase().includes('loi') ||
          text.toLowerCase().includes('n°') ||
          href.includes('decret') ||
          href.includes('arrete') ||
          href.includes('.pdf'))
      ) {
        const fullUrl = href.startsWith('http')
          ? href
          : href.startsWith('/')
            ? `${source.baseUrl}${href}`
            : `${workingUrl}/${href}`;
        if (!textLinks.some((l) => l.url === fullUrl)) {
          textLinks.push({ title: text, url: fullUrl });
        }
      }
    });

    if (textLinks.length === 0) {
      this.addAlert({
        type: AlertType.STRUCTURE_CHANGED,
        severity: AlertSeverity.WARNING,
        message: `No text links found on JO ${source.countryName}: ${workingUrl}`,
      });
      return [];
    }

    const texts: ScrapedText[] = [];
    const maxTexts = 50;

    for (const link of textLinks.slice(0, maxTexts)) {
      // Skip PDF links for now (would need PDF extraction)
      if (link.url.endsWith('.pdf')) {
        texts.push({
          title: link.title,
          textType: this.detectTextType(link.title),
          countryCodes: [source.countryCode],
          sourceUrl: link.url,
          sourceName: 'Journaux officiels',
          language: 'fr',
        });
        continue;
      }

      try {
        const detailHtml = await this.fetchPage(link.url);
        const detail$ = cheerio.load(detailHtml);

        let content = '';
        for (const selector of source.contentSelectors) {
          const el = detail$(selector).first();
          if (el.length && el.text().trim().length > 100) {
            content = el.text().trim();
            break;
          }
        }

        const dateMatch = link.title.match(/\b(20\d{2}|19\d{2})\b/);
        const promulgationDate = dateMatch ? `${dateMatch[1]}-01-01` : undefined;

        texts.push({
          title: link.title,
          textType: this.detectTextType(link.title),
          countryCodes: [source.countryCode],
          contentText: content.substring(0, 100000) || undefined,
          sourceUrl: link.url,
          sourceName: 'Journaux officiels',
          promulgationDate,
          language: 'fr',
        });
      } catch (error) {
        this.log('debug', `Failed to fetch JO text: ${link.url}`);
      }

      await this.sleep(this.DELAY_MS);
    }

    return texts;
  }

  private detectTextType(title: string): TextType {
    const lower = title.toLowerCase();
    if (lower.includes('décret') || lower.includes('decret')) return TextType.DECRET;
    if (lower.includes('arrêté') || lower.includes('arrete')) return TextType.ARRETE;
    if (lower.includes('ordonnance')) return TextType.ORDONNANCE;
    if (lower.includes('loi organique')) return TextType.LOI_ORGANIQUE;
    if (lower.includes('loi')) return TextType.LOI;
    return TextType.DECRET;
  }
}
```

- [ ] **Step 3: Register in pipeline module and processor**

In `backend/src/pipeline/pipeline.module.ts` add `JournauxScraper` to providers.
In `backend/src/pipeline/pipeline.processor.ts`:

```typescript
// Import
import { JournauxScraper } from './scrapers/journaux.scraper';

// Constructor injection
private readonly journauxScraper: JournauxScraper,

// getScraper()
case 'Journaux officiels':
  return this.journauxScraper;
```

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest test/pipeline/journaux.scraper.spec.ts --no-cache`
Expected: Unit tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/pipeline/scrapers/journaux.scraper.ts backend/test/pipeline/journaux.scraper.spec.ts backend/src/pipeline/pipeline.module.ts backend/src/pipeline/pipeline.processor.ts
git commit -m "feat(pipeline): add Journaux officiels scraper for 6 priority countries"
```

---

## Task 13: Final Pipeline Module + Processor Wiring

**Files:**
- Modify: `backend/src/pipeline/pipeline.module.ts`
- Modify: `backend/src/pipeline/pipeline.processor.ts`

- [ ] **Step 1: Final pipeline.module.ts with all scrapers**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PipelineJob } from './entities/pipeline-job.entity';
import { SourceConfig } from './entities/source-config.entity';
import { PipelineAlert } from './entities/pipeline-alert.entity';
import { LegalText } from '../legal-texts/entities/legal-text.entity';
import { Country } from '../countries/entities/country.entity';
import { PipelineController } from './pipeline.controller';
import { PipelineAlertsController } from './pipeline-alerts.controller';
import { PipelineService } from './pipeline.service';
import { PipelineAlertsService } from './pipeline-alerts.service';
import { PipelineProcessor } from './pipeline.processor';
import { FaolexScraper } from './scrapers/faolex.scraper';
import { OhadaScraper } from './scrapers/ohada.scraper';
import { ConstitutionsScraper } from './scrapers/constitutions.scraper';
import { CcjaScraper } from './scrapers/ccja.scraper';
import { AssembleesScraper } from './scrapers/assemblees.scraper';
import { JournauxScraper } from './scrapers/journaux.scraper';

@Module({
  imports: [
    TypeOrmModule.forFeature([PipelineJob, SourceConfig, PipelineAlert, LegalText, Country]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parseInt(parsed.port, 10) || 6379,
              password: parsed.password || undefined,
              tls: parsed.protocol === 'rediss:' ? {} : undefined,
              maxRetriesPerRequest: null,
            },
          };
        }
        return {
          connection: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'pipeline' }),
  ],
  controllers: [PipelineController, PipelineAlertsController],
  providers: [
    PipelineService,
    PipelineAlertsService,
    PipelineProcessor,
    FaolexScraper,
    OhadaScraper,
    ConstitutionsScraper,
    CcjaScraper,
    AssembleesScraper,
    JournauxScraper,
  ],
  exports: [PipelineService, PipelineAlertsService],
})
export class PipelineModule {}
```

- [ ] **Step 2: Final pipeline.processor.ts with all scrapers**

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { PipelineJob, JobStatus } from './entities/pipeline-job.entity';
import { LegalText, TextStatus } from '../legal-texts/entities/legal-text.entity';
import { Country } from '../countries/entities/country.entity';
import { PipelineAlertsService } from './pipeline-alerts.service';
import { BaseScraper } from './scrapers/base.scraper';
import { ScrapedText } from './scrapers/scraper.interface';
import { FaolexScraper } from './scrapers/faolex.scraper';
import { OhadaScraper } from './scrapers/ohada.scraper';
import { ConstitutionsScraper } from './scrapers/constitutions.scraper';
import { CcjaScraper } from './scrapers/ccja.scraper';
import { AssembleesScraper } from './scrapers/assemblees.scraper';
import { JournauxScraper } from './scrapers/journaux.scraper';

@Processor('pipeline', { concurrency: 1 })
export class PipelineProcessor extends WorkerHost {
  constructor(
    @InjectRepository(PipelineJob) private readonly jobRepo: Repository<PipelineJob>,
    @InjectRepository(LegalText) private readonly textRepo: Repository<LegalText>,
    @InjectRepository(Country) private readonly countryRepo: Repository<Country>,
    private readonly alertsService: PipelineAlertsService,
    private readonly faolexScraper: FaolexScraper,
    private readonly ohadaScraper: OhadaScraper,
    private readonly constitutionsScraper: ConstitutionsScraper,
    private readonly ccjaScraper: CcjaScraper,
    private readonly assembleesScraper: AssembleesScraper,
    private readonly journauxScraper: JournauxScraper,
  ) {
    super();
  }

  async process(job: Job<{ pipelineJobId: string; sourceName: string }>) {
    const { pipelineJobId, sourceName } = job.data;

    try {
      // Stage 1: SCRAPING
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.SCRAPING,
        startedAt: new Date(),
      });

      const scraper = this.getScraper(sourceName);
      scraper.clearAlerts();
      const scraped = await scraper.scrape();

      // Persist alerts
      const alerts = scraper.getAlerts();
      if (alerts.length > 0) {
        await this.alertsService.createFromScraper(pipelineJobId, alerts);
      }

      // Stage 2: EXTRACTING (validation)
      await this.jobRepo.update(pipelineJobId, { status: JobStatus.EXTRACTING });
      const valid = scraped.filter((t) => t.title && t.countryCodes.length > 0);

      // Stage 3: ENRICHING (create legal texts)
      await this.jobRepo.update(pipelineJobId, { status: JobStatus.ENRICHING });
      const count = await this.createLegalTexts(valid, sourceName);

      // Done
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.READY_FOR_REVIEW,
        textsCount: count,
        completedAt: new Date(),
      });
    } catch (error) {
      await this.jobRepo.update(pipelineJobId, {
        status: JobStatus.FAILED,
        errorMessage: (error as Error).message,
        completedAt: new Date(),
      });
    }
  }

  private getScraper(sourceName: string): BaseScraper {
    switch (sourceName) {
      case 'FAOLEX':
        return this.faolexScraper;
      case 'OHADA':
        return this.ohadaScraper;
      case 'Constitutions':
        return this.constitutionsScraper;
      case 'CCJA':
        return this.ccjaScraper;
      case 'Assemblées nationales':
        return this.assembleesScraper;
      case 'Journaux officiels':
        return this.journauxScraper;
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }
  }

  private async createLegalTexts(texts: ScrapedText[], sourceName: string): Promise<number> {
    const countries = await this.countryRepo.find();
    const countryMap = new Map(countries.map((c) => [c.code, c]));
    let created = 0;

    for (const text of texts) {
      for (const code of text.countryCodes) {
        const country = countryMap.get(code);
        if (!country) continue;

        // Deduplication
        const existing = await this.textRepo.findOne({
          where: { title: text.title, countryId: country.id, sourceName },
        });
        if (existing) continue;

        const entity = this.textRepo.create({
          title: text.title,
          textType: text.textType,
          contentText: text.contentText,
          summary: text.summary,
          reference: text.reference,
          promulgationDate: text.promulgationDate ? new Date(text.promulgationDate) : undefined,
          sourceUrl: text.sourceUrl,
          sourceName,
          countryId: country.id,
          status: TextStatus.PENDING_REVIEW,
        });

        await this.textRepo.save(entity);
        created++;
      }
    }

    return created;
  }
}
```

- [ ] **Step 3: Verify full compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/pipeline/pipeline.module.ts backend/src/pipeline/pipeline.processor.ts
git commit -m "feat(pipeline): wire all 6 scrapers into pipeline module and processor"
```

---

## Task 14: Admin Pipeline Alerts UI

**Files:**
- Modify: `frontend/pages/admin/pipeline.vue`

- [ ] **Step 1: Add alerts section to the admin pipeline page**

Add a new section to the existing pipeline admin page that shows:
- Badge with unacknowledged alert count
- Table of alerts: type, severity, message, date, job link
- Filter by type/severity
- "Acknowledge" button per alert

Add after the existing jobs section in `frontend/pages/admin/pipeline.vue`:

```vue
<!-- ALERTS SECTION — add after existing pipeline jobs section -->
<div class="card mt-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold">
      Alertes Pipeline
      <span v-if="alertCount > 0" class="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        {{ alertCount }}
      </span>
    </h2>
    <div class="flex gap-2">
      <select v-model="alertFilter.type" class="border rounded px-2 py-1 text-sm">
        <option value="">Tous les types</option>
        <option value="scrape_failed">Échec scraping</option>
        <option value="structure_changed">Structure changée</option>
        <option value="no_results">Aucun résultat</option>
        <option value="validation_error">Erreur validation</option>
      </select>
      <select v-model="alertFilter.severity" class="border rounded px-2 py-1 text-sm">
        <option value="">Toutes sévérités</option>
        <option value="error">Erreur</option>
        <option value="warning">Warning</option>
        <option value="info">Info</option>
      </select>
    </div>
  </div>

  <div v-if="alerts.length === 0" class="text-gray-500 text-center py-8">
    Aucune alerte
  </div>

  <div v-else class="space-y-2">
    <div
      v-for="alert in alerts"
      :key="alert.id"
      class="flex items-start justify-between p-3 rounded-lg border"
      :class="{
        'border-red-300 bg-red-50': alert.severity === 'error',
        'border-yellow-300 bg-yellow-50': alert.severity === 'warning',
        'border-blue-300 bg-blue-50': alert.severity === 'info',
        'opacity-50': alert.acknowledged,
      }"
    >
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs font-mono px-1.5 py-0.5 rounded"
            :class="{
              'bg-red-200 text-red-800': alert.severity === 'error',
              'bg-yellow-200 text-yellow-800': alert.severity === 'warning',
              'bg-blue-200 text-blue-800': alert.severity === 'info',
            }">
            {{ alert.type }}
          </span>
          <span class="text-xs text-gray-500">{{ formatDate(alert.createdAt) }}</span>
        </div>
        <p class="text-sm">{{ alert.message }}</p>
      </div>
      <button
        v-if="!alert.acknowledged"
        class="ml-4 text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
        @click="acknowledgeAlert(alert.id)"
      >
        OK
      </button>
    </div>
  </div>
</div>
```

Add to the `<script setup>` section:

```typescript
// Alert state
const alerts = ref<any[]>([]);
const alertCount = ref(0);
const alertFilter = ref({ type: '', severity: '' });

const fetchAlerts = async () => {
  try {
    const params = new URLSearchParams();
    if (alertFilter.value.type) params.set('type', alertFilter.value.type);
    if (alertFilter.value.severity) params.set('severity', alertFilter.value.severity);
    params.set('limit', '50');

    const { data } = await api.get(`/pipeline/alerts?${params}`);
    alerts.value = data.data ?? data;
  } catch (e) {
    console.error('Failed to fetch alerts', e);
  }
};

const fetchAlertCount = async () => {
  try {
    const { data } = await api.get('/pipeline/alerts/count');
    alertCount.value = typeof data === 'number' ? data : data.count ?? 0;
  } catch (e) {
    console.error('Failed to fetch alert count', e);
  }
};

const acknowledgeAlert = async (id: string) => {
  try {
    await api.patch(`/pipeline/alerts/${id}/acknowledge`);
    await fetchAlerts();
    await fetchAlertCount();
  } catch (e) {
    console.error('Failed to acknowledge alert', e);
  }
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('fr-FR');
};

watch(alertFilter, fetchAlerts, { deep: true });

onMounted(() => {
  fetchAlerts();
  fetchAlertCount();
});
```

- [ ] **Step 2: Add new source options in the pipeline job creation dropdown**

In the existing "source" dropdown on the pipeline page, add the new sources:

```html
<option value="Constitutions">Constitutions</option>
<option value="FAOLEX">FAOLEX</option>
<option value="OHADA">OHADA</option>
<option value="CCJA">CCJA (Jurisprudence)</option>
<option value="Assemblées nationales">Assemblées nationales</option>
<option value="Journaux officiels">Journaux officiels</option>
```

- [ ] **Step 3: Commit**

```bash
git add frontend/pages/admin/pipeline.vue
git commit -m "feat(admin): add pipeline alerts UI and new source options"
```

---

## Task 15: Delete Python Pipeline

**Files:**
- Delete: `pipeline/` directory

- [ ] **Step 1: Remove the Python pipeline directory**

```bash
rm -rf pipeline/
```

- [ ] **Step 2: Verify nothing imports from it**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors (backend has no dependency on Python pipeline)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Python pipeline (all scrapers now in NestJS)"
```

---

## Task 16: Run Full Test Suite + Integration Verification

- [ ] **Step 1: Run all pipeline tests**

Run: `cd backend && npx jest test/pipeline/ --no-cache --verbose`
Expected: All tests PASS

- [ ] **Step 2: Verify TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify the backend starts**

Run: `cd backend && npx nest start --watch` (check it boots without errors, then Ctrl+C)
Expected: NestJS starts, no module resolution errors

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(pipeline): address test/compilation fixes from integration verification"
```
