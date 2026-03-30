# Pipeline Worker System — Design Spec

## Overview

Implement a real pipeline worker that scrapes legal texts from 3 sources (Constitute Project, FAOLEX, OHADA), processes them through status stages, and creates LegalText entries in the database for editorial review.

## Architecture

```
POST /pipeline/jobs {sourceName}
  → PipelineService.createJob()
  → BullMQ Queue "pipeline"
  → PipelineProcessor (worker)
      ├── "Constitute Project" → ConstituteScraper (REST API)
      ├── "FAOLEX"             → FaolexScraper (CSV download + parse)
      └── "OHADA"              → OhadaScraper (HTML scraping)
  → Creates LegalText entries (status: pending_review)
  → Updates PipelineJob status through stages
```

## Job Status Flow

```
queued → scraping → extracting → enriching → ready_for_review
                                           → failed (on error)
```

- **queued**: Job created, waiting in BullMQ queue
- **scraping**: Fetching data from source (HTTP/CSV/HTML)
- **extracting**: Parsing and cleaning raw data into structured format
- **enriching**: Matching countries/themes, deduplication, creating LegalText entries
- **ready_for_review**: Done — texts created with status pending_review

## Components

### 1. BullMQ Configuration

- Register BullModule in PipelineModule with Redis connection
- Redis URL from env var `REDIS_URL` (for Render/Upstash) with fallback to `REDIS_HOST:REDIS_PORT`
- Single queue: `pipeline`
- Concurrency: 1 job at a time (avoid overwhelming external sources)
- Job timeout: 5 minutes

### 2. PipelineProcessor

NestJS `@Processor('pipeline')` class that:
1. Receives job from queue
2. Updates PipelineJob status at each stage
3. Dispatches to correct scraper based on `sourceName`
4. Catches errors and marks job as `failed` with `errorMessage`
5. Returns count of texts created

### 3. Scrapers

#### ConstituteScraper
- **Method**: REST API at `https://www.constituteproject.org/service/`
- **Steps**:
  1. `GET /service/constitutions?region=Africa` → list of constitutions
  2. Filter to 26 francophone country codes
  3. For each constitution: `GET /service/html?cons_id=X` → full HTML content
- **Output**: title, countryCode, contentText (HTML→text), promulgationDate, sourceUrl
- **TextType**: `constitution`
- **Dedup**: by countryCode + title

#### FaolexScraper
- **Method**: CSV bulk download from `https://www.fao.org/faolex/opendata/en/`
- **Steps**:
  1. Download CSV (complete collection or specific dataset)
  2. Parse CSV with `csv-parse`
  3. Filter rows to francophone African country ISO-3 codes
  4. Map to LegalText fields
- **Output**: title, countryCode (ISO-3→ISO-2 mapping), textType (from FAOLEX type field), promulgationDate, sourceUrl
- **TextType**: mapped from FAOLEX categories (Legislation→loi, Regulation→decret, etc.)
- **Dedup**: by title + countryCode + sourceUrl

#### OhadaScraper
- **Method**: HTML scraping of `https://www.ohada.org/actes-uniformes/`
- **Steps**:
  1. Fetch main page listing Actes Uniformes
  2. For each Acte: fetch detail page, extract title, date, content
  3. Parse with cheerio
- **Output**: title, contentText, promulgationDate, sourceUrl
- **TextType**: `acte_uniforme`
- **Countries**: all 17 OHADA member states get the same text
- **Dedup**: by title + sourceUrl

### 4. Scraper Output Interface

```typescript
interface ScrapedText {
  title: string;
  textType: TextType;
  countryCodes: string[];      // ISO-2 codes — one text can apply to multiple countries
  contentText?: string;
  summary?: string;
  reference?: string;
  promulgationDate?: string;   // ISO date
  sourceUrl?: string;
  sourceName: string;          // "FAOLEX" | "OHADA" | "Constitute Project"
}
```

### 5. LegalText Creation

For each ScrapedText:
1. Resolve countryCodes → countryIds via CountriesService
2. Check for existing LegalText with same title + countryId + sourceName (dedup)
3. If new: create LegalText with status `pending_review`
4. Update PipelineJob: increment textsCount, set completedAt

### 6. Dependencies to Install

- `axios` — HTTP requests
- `cheerio` — HTML parsing (OHADA)
- `csv-parse` — CSV parsing (FAOLEX)

Already available: `@nestjs/bull`, `bullmq`, `ioredis`

### 7. Environment Variables

- `REDIS_URL` — full Redis connection string (Upstash/Render)
- Fallback: `REDIS_HOST` (default: localhost) + `REDIS_PORT` (default: 6379)

### 8. Files to Create/Modify

**New files:**
- `backend/src/pipeline/pipeline.processor.ts` — BullMQ processor
- `backend/src/pipeline/scrapers/constitute.scraper.ts`
- `backend/src/pipeline/scrapers/faolex.scraper.ts`
- `backend/src/pipeline/scrapers/ohada.scraper.ts`
- `backend/src/pipeline/scrapers/scraper.interface.ts` — shared interface

**Modified files:**
- `backend/src/pipeline/pipeline.module.ts` — add BullModule, scrapers, processor
- `backend/src/pipeline/pipeline.service.ts` — add queue dispatch on createJob
- `backend/src/pipeline/entities/pipeline-job.entity.ts` — add textsCount column
- `backend/package.json` — add axios, cheerio, csv-parse

### 9. Frontend Updates

- Pipeline page already connected to API (previous fix)
- Jobs table will show real status progression
- No additional frontend changes needed

## Error Handling

- Each scraper wrapped in try/catch
- On failure: job status → `failed`, errorMessage set
- Retry: user clicks "Relancer" which creates a new job
- Network errors: logged with source URL for debugging

## Rate Limiting

- Constitute API: 1 request/second delay between calls
- FAOLEX: single CSV download, no rate concern
- OHADA: 2 second delay between page fetches

## Limitations

- Constitute API returns English content only; French versions require HTML scraping of website (future improvement)
- FAOLEX CSV may not include full text content, only metadata + PDF links
- OHADA site structure may change; scraper needs maintenance
