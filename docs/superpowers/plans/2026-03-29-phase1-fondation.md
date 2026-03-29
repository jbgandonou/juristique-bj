# Phase 1 — Fondation : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the full project structure (NestJS + Nuxt.js + Pipeline Python), create the database schema, build the data pipeline, and populate the database with ~500-1000 verified legal texts from FAOLEX, OHADA, and national constitutions.

**Architecture:** Three independent services orchestrated via Docker Compose — a NestJS API backend, a Nuxt.js frontend (skeleton only in Phase 1), and a Python data pipeline. PostgreSQL is the shared data store. Redis handles caching and job queues. Typesense handles full-text search indexing.

**Tech Stack:** NestJS 10, Nuxt.js 3, Python 3.12, Celery, PostgreSQL 16, Redis 7, Typesense 27, TypeORM, Docker Compose, PyMuPDF, BeautifulSoup, Claude API

---

## File Structure

```
juristique.bj/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
│
├── backend/                          # NestJS API
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── database.config.ts
│   │   ├── common/
│   │   │   ├── entities/
│   │   │   │   └── base.entity.ts
│   │   │   └── dto/
│   │   │       └── pagination.dto.ts
│   │   ├── countries/
│   │   │   ├── countries.module.ts
│   │   │   ├── countries.controller.ts
│   │   │   ├── countries.service.ts
│   │   │   ├── entities/
│   │   │   │   └── country.entity.ts
│   │   │   └── dto/
│   │   │       └── create-country.dto.ts
│   │   ├── themes/
│   │   │   ├── themes.module.ts
│   │   │   ├── themes.controller.ts
│   │   │   ├── themes.service.ts
│   │   │   ├── entities/
│   │   │   │   └── theme.entity.ts
│   │   │   └── dto/
│   │   │       └── create-theme.dto.ts
│   │   ├── legal-texts/
│   │   │   ├── legal-texts.module.ts
│   │   │   ├── legal-texts.controller.ts
│   │   │   ├── legal-texts.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── legal-text.entity.ts
│   │   │   │   ├── text-reference.entity.ts
│   │   │   │   └── text-version.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-legal-text.dto.ts
│   │   │       └── query-legal-text.dto.ts
│   │   ├── pipeline/
│   │   │   ├── pipeline.module.ts
│   │   │   ├── pipeline.controller.ts
│   │   │   ├── pipeline.service.ts
│   │   │   ├── entities/
│   │   │   │   ├── pipeline-job.entity.ts
│   │   │   │   └── source-config.entity.ts
│   │   │   └── dto/
│   │   │       └── create-pipeline-job.dto.ts
│   │   └── seed/
│   │       ├── seed.module.ts
│   │       ├── seed.service.ts
│   │       ├── data/
│   │       │   ├── countries.json
│   │       │   └── themes.json
│   │       └── seed.command.ts
│   └── test/
│       ├── jest-e2e.json
│       ├── countries.e2e-spec.ts
│       ├── themes.e2e-spec.ts
│       ├── legal-texts.e2e-spec.ts
│       └── pipeline.e2e-spec.ts
│
├── frontend/                         # Nuxt.js 3 (skeleton)
│   ├── Dockerfile
│   ├── package.json
│   ├── nuxt.config.ts
│   ├── app.vue
│   └── pages/
│       └── index.vue
│
├── pipeline/                         # Python data pipeline
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── .env.example
│   ├── src/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── config.py
│   │   ├── api_client.py
│   │   ├── scrapers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── faolex.py
│   │   │   ├── ohada.py
│   │   │   └── constitutions.py
│   │   ├── extraction/
│   │   │   ├── __init__.py
│   │   │   ├── pdf_extractor.py
│   │   │   ├── html_extractor.py
│   │   │   └── ocr.py
│   │   ├── enrichment/
│   │   │   ├── __init__.py
│   │   │   ├── metadata_extractor.py
│   │   │   └── theme_classifier.py
│   │   └── tasks/
│   │       ├── __init__.py
│   │       ├── scrape_tasks.py
│   │       ├── extract_tasks.py
│   │       └── enrich_tasks.py
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_scrapers/
│       │   ├── __init__.py
│       │   ├── test_faolex.py
│       │   ├── test_ohada.py
│       │   └── test_constitutions.py
│       ├── test_extraction/
│       │   ├── __init__.py
│       │   ├── test_pdf_extractor.py
│       │   └── test_ocr.py
│       └── test_enrichment/
│           ├── __init__.py
│           └── test_theme_classifier.py
│
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-03-29-juristique-bj-design.md
        └── plans/
            └── 2026-03-29-phase1-fondation.md
```

---

## Task 1: Project Bootstrap & Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `docker-compose.dev.yml`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj
git init
```

- [ ] **Step 2: Create .gitignore**

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/

# Environment
.env
.env.local
.env.production

# Build
dist/
.nuxt/
.output/
build/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Docker
*.log

# S3 local
minio-data/

# Test coverage
coverage/
htmlcov/
.pytest_cache/
```

- [ ] **Step 3: Create .env.example**

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=juristique
POSTGRES_PASSWORD=juristique_dev
POSTGRES_DB=juristique

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Typesense
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_API_KEY=juristique_dev_key

# MinIO (S3 local)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=juristique-raw
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Claude API
ANTHROPIC_API_KEY=your_key_here

# NestJS
BACKEND_PORT=4000
JWT_SECRET=dev_jwt_secret_change_in_prod

# Nuxt
FRONTEND_PORT=3000
API_BASE_URL=http://localhost:4000
```

- [ ] **Step 4: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "${REDIS_PORT}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  typesense:
    image: typesense/typesense:27.1
    environment:
      TYPESENSE_API_KEY: ${TYPESENSE_API_KEY}
      TYPESENSE_DATA_DIR: /data
    ports:
      - "${TYPESENSE_PORT}:8108"
    volumes:
      - typesense_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  typesense_data:
  minio_data:
```

- [ ] **Step 5: Create docker-compose.dev.yml (extends with app services)**

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "${BACKEND_PORT}:4000"
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - TYPESENSE_HOST=typesense
      - TYPESENSE_PORT=8108
      - TYPESENSE_API_KEY=${TYPESENSE_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      typesense:
        condition: service_started
    command: npm run start:dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "${FRONTEND_PORT}:3000"
    environment:
      - API_BASE_URL=http://backend:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev

  pipeline:
    build:
      context: ./pipeline
      dockerfile: Dockerfile
    environment:
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - S3_ENDPOINT=http://minio:9000
      - S3_BUCKET=${S3_BUCKET}
      - S3_ACCESS_KEY=${MINIO_ROOT_USER}
      - S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - API_BASE_URL=http://backend:4000
    volumes:
      - ./pipeline:/app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_started

  celery-beat:
    build:
      context: ./pipeline
      dockerfile: Dockerfile
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - API_BASE_URL=http://backend:4000
      - S3_ENDPOINT=http://minio:9000
      - S3_BUCKET=${S3_BUCKET}
      - S3_ACCESS_KEY=${MINIO_ROOT_USER}
      - S3_SECRET_KEY=${MINIO_ROOT_PASSWORD}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis
      - pipeline
    command: celery -A src.celery_app beat --loglevel=info
```

- [ ] **Step 6: Verify Docker services start**

```bash
cp .env.example .env
docker compose up -d
docker compose ps
```

Expected: All 4 services (postgres, redis, typesense, minio) running and healthy.

- [ ] **Step 7: Stop services and commit**

```bash
docker compose down
git add .gitignore .env.example docker-compose.yml docker-compose.dev.yml
git commit -m "chore: project bootstrap with Docker Compose (postgres, redis, typesense, minio)"
```

---

## Task 2: NestJS Backend Setup

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/nest-cli.json`
- Create: `backend/src/main.ts`
- Create: `backend/src/app.module.ts`
- Create: `backend/src/config/database.config.ts`

- [ ] **Step 1: Scaffold NestJS project**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj
npx @nestjs/cli new backend --package-manager npm --skip-git
```

- [ ] **Step 2: Install dependencies**

```bash
cd backend
npm install @nestjs/typeorm typeorm pg @nestjs/config @nestjs/swagger swagger-ui-express class-validator class-transformer @nestjs/throttler @nestjs/bull bullmq helmet
npm install -D @types/node
```

- [ ] **Step 3: Create database config**

Create `backend/src/config/database.config.ts`:

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER || 'juristique',
  password: process.env.POSTGRES_PASSWORD || 'juristique_dev',
  database: process.env.POSTGRES_DB || 'juristique',
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
}));
```

- [ ] **Step 4: Update app.module.ts**

Replace `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
  ],
})
export class AppModule {}
```

- [ ] **Step 5: Update main.ts**

Replace `backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Juristique.bj API')
    .setDescription('API de la plateforme de droit africain francophone')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(4000);
}
bootstrap();
```

- [ ] **Step 6: Create Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4000
CMD ["npm", "run", "start:dev"]
```

- [ ] **Step 7: Verify backend starts with Docker**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj
docker compose up -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml up backend -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
```

Expected: NestJS starts on port 4000, connects to PostgreSQL.

- [ ] **Step 8: Verify Swagger is accessible**

```bash
curl -s http://localhost:4000/api/docs-json | head -20
```

Expected: JSON swagger spec returned.

- [ ] **Step 9: Stop and commit**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
git add backend/
git commit -m "feat(backend): NestJS setup with TypeORM, Swagger, validation, helmet"
```

---

## Task 3: Base Entity & Pagination DTO

**Files:**
- Create: `backend/src/common/entities/base.entity.ts`
- Create: `backend/src/common/dto/pagination.dto.ts`

- [ ] **Step 1: Create base entity**

Create `backend/src/common/entities/base.entity.ts`:

```typescript
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 2: Create pagination DTO**

Create `backend/src/common/dto/pagination.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/common/
git commit -m "feat(backend): add base entity and pagination DTO"
```

---

## Task 4: Countries Module

**Files:**
- Create: `backend/src/countries/entities/country.entity.ts`
- Create: `backend/src/countries/dto/create-country.dto.ts`
- Create: `backend/src/countries/countries.service.ts`
- Create: `backend/src/countries/countries.controller.ts`
- Create: `backend/src/countries/countries.module.ts`
- Create: `backend/test/countries.e2e-spec.ts`

- [ ] **Step 1: Write e2e test**

Create `backend/test/countries.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CountriesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /countries should return empty array initially', () => {
    return request(app.getHttpServer())
      .get('/countries')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toEqual([]);
        expect(res.body.total).toBe(0);
      });
  });

  it('POST /countries should create a country', () => {
    return request(app.getHttpServer())
      .post('/countries')
      .send({
        name: 'République du Bénin',
        code: 'BJ',
        region: "Afrique de l'Ouest",
        legalSystem: 'Civil law',
        officialLang: 'Français',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('République du Bénin');
        expect(res.body.code).toBe('BJ');
        expect(res.body.id).toBeDefined();
      });
  });

  it('GET /countries/:id should return the created country', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/countries')
      .send({
        name: 'République du Sénégal',
        code: 'SN',
        region: "Afrique de l'Ouest",
        legalSystem: 'Civil law',
        officialLang: 'Français',
      });

    return request(app.getHttpServer())
      .get(`/countries/${createRes.body.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.name).toBe('République du Sénégal');
      });
  });

  it('GET /countries/by-code/BJ should return country by code', async () => {
    return request(app.getHttpServer())
      .get('/countries/by-code/BJ')
      .expect(200)
      .expect((res) => {
        expect(res.body.code).toBe('BJ');
      });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/backend
npm run test:e2e -- --testPathPattern=countries
```

Expected: FAIL — CountriesController not found.

- [ ] **Step 3: Create country entity**

Create `backend/src/countries/entities/country.entity.ts`:

```typescript
import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('countries')
export class Country extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column({ type: 'char', length: 2 })
  code: string;

  @Column({ name: 'flag_url', nullable: true })
  flagUrl: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'legal_system', nullable: true })
  legalSystem: string;

  @Column({ name: 'official_lang', default: 'Français' })
  officialLang: string;
}
```

- [ ] **Step 4: Create country DTO**

Create `backend/src/countries/dto/create-country.dto.ts`:

```typescript
import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ example: 'République du Bénin' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'BJ' })
  @IsString()
  @Length(2, 2)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  flagUrl?: string;

  @ApiPropertyOptional({ example: "Afrique de l'Ouest" })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'Civil law' })
  @IsOptional()
  @IsString()
  legalSystem?: string;

  @ApiPropertyOptional({ example: 'Français' })
  @IsOptional()
  @IsString()
  officialLang?: string;
}
```

- [ ] **Step 5: Create countries service**

Create `backend/src/countries/countries.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,
  ) {}

  async create(dto: CreateCountryDto): Promise<Country> {
    const country = this.repo.create(dto);
    return this.repo.save(country);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Country>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<Country> {
    const country = await this.repo.findOne({ where: { id } });
    if (!country) throw new NotFoundException(`Country ${id} not found`);
    return country;
  }

  async findByCode(code: string): Promise<Country> {
    const country = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!country) throw new NotFoundException(`Country with code ${code} not found`);
    return country;
  }
}
```

- [ ] **Step 6: Create countries controller**

Create `backend/src/countries/countries.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly service: CountriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a country' })
  create(@Body() dto: CreateCountryDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all countries' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Get country by ISO code' })
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

- [ ] **Step 7: Create countries module**

Create `backend/src/countries/countries.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
```

- [ ] **Step 8: Register module in app.module.ts**

Update `backend/src/app.module.ts` — add to imports array:

```typescript
import { CountriesModule } from './countries/countries.module';

@Module({
  imports: [
    // ... existing imports
    CountriesModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 9: Run tests**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/backend
npm run test:e2e -- --testPathPattern=countries
```

Expected: All 4 tests PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/src/countries/ backend/test/countries.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): countries module with CRUD and e2e tests"
```

---

## Task 5: Themes Module

**Files:**
- Create: `backend/src/themes/entities/theme.entity.ts`
- Create: `backend/src/themes/dto/create-theme.dto.ts`
- Create: `backend/src/themes/themes.service.ts`
- Create: `backend/src/themes/themes.controller.ts`
- Create: `backend/src/themes/themes.module.ts`
- Create: `backend/test/themes.e2e-spec.ts`

- [ ] **Step 1: Write e2e test**

Create `backend/test/themes.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ThemesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /themes should return empty array initially', () => {
    return request(app.getHttpServer())
      .get('/themes')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toEqual([]);
      });
  });

  it('POST /themes should create a theme', () => {
    return request(app.getHttpServer())
      .post('/themes')
      .send({
        name: 'Énergie électrique',
        slug: 'energie-electrique',
        description: "Textes relatifs à l'énergie électrique",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('Énergie électrique');
        expect(res.body.slug).toBe('energie-electrique');
      });
  });

  it('POST /themes should create a sub-theme', async () => {
    const parent = await request(app.getHttpServer())
      .post('/themes')
      .send({ name: 'Environnement', slug: 'environnement' });

    return request(app.getHttpServer())
      .post('/themes')
      .send({
        name: 'Biodiversité',
        slug: 'biodiversite',
        parentId: parent.body.id,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.parentId).toBe(parent.body.id);
      });
  });

  it('GET /themes/tree should return hierarchical themes', () => {
    return request(app.getHttpServer())
      .get('/themes/tree')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/backend
npm run test:e2e -- --testPathPattern=themes
```

Expected: FAIL — ThemesController not found.

- [ ] **Step 3: Create theme entity**

Create `backend/src/themes/entities/theme.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('themes')
export class Theme extends BaseEntity {
  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'text_count', default: 0 })
  textCount: number;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Theme, (theme) => theme.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Theme;

  @OneToMany(() => Theme, (theme) => theme.parent)
  children: Theme[];
}
```

- [ ] **Step 4: Create theme DTO**

Create `backend/src/themes/dto/create-theme.dto.ts`:

```typescript
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateThemeDto {
  @ApiProperty({ example: 'Énergie électrique' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'energie-electrique' })
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}
```

- [ ] **Step 5: Create themes service**

Create `backend/src/themes/themes.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Theme } from './entities/theme.entity';
import { CreateThemeDto } from './dto/create-theme.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private readonly repo: Repository<Theme>,
  ) {}

  async create(dto: CreateThemeDto): Promise<Theme> {
    const theme = this.repo.create(dto);
    return this.repo.save(theme);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<Theme>> {
    const { page, limit } = pagination;
    const [data, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<Theme> {
    const theme = await this.repo.findOne({ where: { id }, relations: ['children'] });
    if (!theme) throw new NotFoundException(`Theme ${id} not found`);
    return theme;
  }

  async findBySlug(slug: string): Promise<Theme> {
    const theme = await this.repo.findOne({ where: { slug }, relations: ['children'] });
    if (!theme) throw new NotFoundException(`Theme ${slug} not found`);
    return theme;
  }

  async getTree(): Promise<Theme[]> {
    return this.repo.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { name: 'ASC' },
    });
  }
}
```

- [ ] **Step 6: Create themes controller**

Create `backend/src/themes/themes.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ThemesService } from './themes.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('themes')
@Controller('themes')
export class ThemesController {
  constructor(private readonly service: ThemesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a theme' })
  create(@Body() dto: CreateThemeDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all themes (flat)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get themes as hierarchical tree' })
  getTree() {
    return this.service.getTree();
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get theme by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get theme by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

- [ ] **Step 7: Create themes module and register in app**

Create `backend/src/themes/themes.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theme } from './entities/theme.entity';
import { ThemesService } from './themes.service';
import { ThemesController } from './themes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Theme])],
  controllers: [ThemesController],
  providers: [ThemesService],
  exports: [ThemesService],
})
export class ThemesModule {}
```

Update `backend/src/app.module.ts` — add `ThemesModule` to imports:

```typescript
import { ThemesModule } from './themes/themes.module';

@Module({
  imports: [
    // ... existing
    CountriesModule,
    ThemesModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Run tests**

```bash
npm run test:e2e -- --testPathPattern=themes
```

Expected: All 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/src/themes/ backend/test/themes.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): themes module with hierarchy tree and e2e tests"
```

---

## Task 6: Legal Texts Module

**Files:**
- Create: `backend/src/legal-texts/entities/legal-text.entity.ts`
- Create: `backend/src/legal-texts/entities/text-reference.entity.ts`
- Create: `backend/src/legal-texts/entities/text-version.entity.ts`
- Create: `backend/src/legal-texts/dto/create-legal-text.dto.ts`
- Create: `backend/src/legal-texts/dto/query-legal-text.dto.ts`
- Create: `backend/src/legal-texts/legal-texts.service.ts`
- Create: `backend/src/legal-texts/legal-texts.controller.ts`
- Create: `backend/src/legal-texts/legal-texts.module.ts`
- Create: `backend/test/legal-texts.e2e-spec.ts`

- [ ] **Step 1: Write e2e test**

Create `backend/test/legal-texts.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LegalTextsController (e2e)', () => {
  let app: INestApplication;
  let countryId: string;
  let themeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const countryRes = await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'République du Bénin', code: 'BJ' });
    countryId = countryRes.body.id;

    const themeRes = await request(app.getHttpServer())
      .post('/themes')
      .send({ name: 'Constitution', slug: 'constitution' });
    themeId = themeRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /legal-texts should create a legal text', () => {
    return request(app.getHttpServer())
      .post('/legal-texts')
      .send({
        title: 'Constitution de la République du Bénin',
        reference: 'Constitution du 11 décembre 1990',
        textType: 'constitution',
        hierarchyRank: 1,
        contentText: 'Le peuple béninois... (texte intégral)',
        countryId,
        themeIds: [themeId],
        isInForce: true,
        status: 'published',
        promulgationDate: '1990-12-11',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toContain('Constitution');
        expect(res.body.country.code).toBe('BJ');
      });
  });

  it('GET /legal-texts should list texts with pagination', () => {
    return request(app.getHttpServer())
      .get('/legal-texts')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.total).toBeGreaterThan(0);
      });
  });

  it('GET /legal-texts?countryCode=BJ should filter by country', () => {
    return request(app.getHttpServer())
      .get('/legal-texts?countryCode=BJ')
      .expect(200)
      .expect((res) => {
        res.body.data.forEach((text: any) => {
          expect(text.country.code).toBe('BJ');
        });
      });
  });

  it('GET /legal-texts?themeSlug=constitution should filter by theme', () => {
    return request(app.getHttpServer())
      .get('/legal-texts?themeSlug=constitution')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:e2e -- --testPathPattern=legal-texts
```

Expected: FAIL.

- [ ] **Step 3: Create legal text entity**

Create `backend/src/legal-texts/entities/legal-text.entity.ts`:

```typescript
import {
  Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn, Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../../countries/entities/country.entity';
import { Theme } from '../../themes/entities/theme.entity';

export enum TextType {
  CONSTITUTION = 'constitution',
  LOI_ORGANIQUE = 'loi_organique',
  LOI = 'loi',
  ORDONNANCE = 'ordonnance',
  DECRET = 'decret',
  ARRETE = 'arrete',
  TRAITE = 'traite',
  ACTE_UNIFORME = 'acte_uniforme',
}

export enum TextStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  VERIFIED = 'verified',
  PUBLISHED = 'published',
}

@Entity('legal_texts')
export class LegalText extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ name: 'text_type', type: 'enum', enum: TextType })
  textType: TextType;

  @Column({ name: 'hierarchy_rank', default: 5 })
  hierarchyRank: number;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ name: 'promulgation_date', type: 'date', nullable: true })
  promulgationDate: Date;

  @Column({ name: 'publication_date', type: 'date', nullable: true })
  publicationDate: Date;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'enum', enum: TextStatus, default: TextStatus.DRAFT })
  status: TextStatus;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ name: 'source_name', nullable: true })
  sourceName: string;

  @Column({ name: 'pdf_s3_key', nullable: true })
  pdfS3Key: string;

  @Column({ name: 'ocr_quality', type: 'float', nullable: true })
  ocrQuality: number;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'parent_text_id', nullable: true })
  parentTextId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'parent_text_id' })
  parentText: LegalText;

  @Column({ name: 'replaces_id', nullable: true })
  replacesId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'replaces_id' })
  replaces: LegalText;

  @Column({ name: 'is_in_force', default: true })
  isInForce: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'country_id' })
  countryId: string;

  @ManyToOne(() => Country, { eager: true })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  @ManyToMany(() => Theme)
  @JoinTable({
    name: 'text_themes',
    joinColumn: { name: 'text_id' },
    inverseJoinColumn: { name: 'theme_id' },
  })
  themes: Theme[];
}
```

- [ ] **Step 4: Create text-reference entity**

Create `backend/src/legal-texts/entities/text-reference.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { LegalText } from './legal-text.entity';

export enum ReferenceType {
  CITE = 'cite',
  MODIFIE = 'modifie',
  ABROGE = 'abroge',
  APPLIQUE = 'applique',
}

@Entity('text_references')
export class TextReference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_text_id' })
  sourceTextId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'source_text_id' })
  sourceText: LegalText;

  @Column({ name: 'target_text_id' })
  targetTextId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'target_text_id' })
  targetText: LegalText;

  @Column({ name: 'ref_type', type: 'enum', enum: ReferenceType })
  refType: ReferenceType;
}
```

- [ ] **Step 5: Create text-version entity**

Create `backend/src/legal-texts/entities/text-version.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from './legal-text.entity';

@Entity('text_versions')
export class TextVersion extends BaseEntity {
  @Column({ name: 'text_id' })
  textId: string;

  @ManyToOne(() => LegalText)
  @JoinColumn({ name: 'text_id' })
  text: LegalText;

  @Column()
  version: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string;

  @Column({ name: 'changed_by', nullable: true })
  changedBy: string;
}
```

- [ ] **Step 6: Create DTOs**

Create `backend/src/legal-texts/dto/create-legal-text.dto.ts`:

```typescript
import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TextType, TextStatus } from '../entities/legal-text.entity';

export class CreateLegalTextDto {
  @ApiProperty({ example: 'Constitution de la République du Bénin' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Loi n°2023-15' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ enum: TextType })
  @IsEnum(TextType)
  textType: TextType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  hierarchyRank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty()
  @IsString()
  countryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  themeIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  promulgationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ enum: TextStatus })
  @IsOptional()
  @IsEnum(TextStatus)
  status?: TextStatus;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isInForce?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pdfS3Key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ocrQuality?: number;
}
```

Create `backend/src/legal-texts/dto/query-legal-text.dto.ts`:

```typescript
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TextType, TextStatus } from '../entities/legal-text.entity';

export class QueryLegalTextDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'BJ' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 'constitution' })
  @IsOptional()
  @IsString()
  themeSlug?: string;

  @ApiPropertyOptional({ enum: TextType })
  @IsOptional()
  @IsEnum(TextType)
  textType?: TextType;

  @ApiPropertyOptional({ enum: TextStatus })
  @IsOptional()
  @IsEnum(TextStatus)
  status?: TextStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isInForce?: boolean;
}
```

- [ ] **Step 7: Create legal texts service**

Create `backend/src/legal-texts/legal-texts.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LegalText } from './entities/legal-text.entity';
import { CreateLegalTextDto } from './dto/create-legal-text.dto';
import { QueryLegalTextDto } from './dto/query-legal-text.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { Theme } from '../themes/entities/theme.entity';

@Injectable()
export class LegalTextsService {
  constructor(
    @InjectRepository(LegalText)
    private readonly repo: Repository<LegalText>,
    @InjectRepository(Theme)
    private readonly themeRepo: Repository<Theme>,
  ) {}

  async create(dto: CreateLegalTextDto): Promise<LegalText> {
    const { themeIds, ...rest } = dto;
    const text = this.repo.create(rest);

    if (themeIds?.length) {
      text.themes = await this.themeRepo.findByIds(themeIds);
    }

    return this.repo.save(text);
  }

  async findAll(query: QueryLegalTextDto): Promise<PaginatedResult<LegalText>> {
    const { page, limit, countryCode, themeSlug, textType, status, isInForce } = query;

    const qb = this.repo
      .createQueryBuilder('text')
      .leftJoinAndSelect('text.country', 'country')
      .leftJoinAndSelect('text.themes', 'theme');

    if (countryCode) {
      qb.andWhere('country.code = :countryCode', { countryCode: countryCode.toUpperCase() });
    }
    if (themeSlug) {
      qb.andWhere('theme.slug = :themeSlug', { themeSlug });
    }
    if (textType) {
      qb.andWhere('text.textType = :textType', { textType });
    }
    if (status) {
      qb.andWhere('text.status = :status', { status });
    }
    if (isInForce !== undefined) {
      qb.andWhere('text.isInForce = :isInForce', { isInForce });
    }

    qb.orderBy('text.promulgationDate', 'DESC', 'NULLS LAST')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return new PaginatedResult(data, total, page, limit);
  }

  async findOne(id: string): Promise<LegalText> {
    const text = await this.repo.findOne({
      where: { id },
      relations: ['country', 'themes', 'parentText', 'replaces'],
    });
    if (!text) throw new NotFoundException(`LegalText ${id} not found`);

    await this.repo.increment({ id }, 'viewCount', 1);
    return text;
  }
}
```

- [ ] **Step 8: Create legal texts controller**

Create `backend/src/legal-texts/legal-texts.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LegalTextsService } from './legal-texts.service';
import { CreateLegalTextDto } from './dto/create-legal-text.dto';
import { QueryLegalTextDto } from './dto/query-legal-text.dto';

@ApiTags('legal-texts')
@Controller('legal-texts')
export class LegalTextsController {
  constructor(private readonly service: LegalTextsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a legal text' })
  create(@Body() dto: CreateLegalTextDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List legal texts with filters' })
  findAll(@Query() query: QueryLegalTextDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a legal text by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

- [ ] **Step 9: Create legal texts module and register**

Create `backend/src/legal-texts/legal-texts.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalText } from './entities/legal-text.entity';
import { TextReference } from './entities/text-reference.entity';
import { TextVersion } from './entities/text-version.entity';
import { Theme } from '../themes/entities/theme.entity';
import { LegalTextsService } from './legal-texts.service';
import { LegalTextsController } from './legal-texts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalText, TextReference, TextVersion, Theme]),
  ],
  controllers: [LegalTextsController],
  providers: [LegalTextsService],
  exports: [LegalTextsService],
})
export class LegalTextsModule {}
```

Update `backend/src/app.module.ts` — add `LegalTextsModule`:

```typescript
import { LegalTextsModule } from './legal-texts/legal-texts.module';

@Module({
  imports: [
    // ... existing
    CountriesModule,
    ThemesModule,
    LegalTextsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 10: Run tests**

```bash
npm run test:e2e -- --testPathPattern=legal-texts
```

Expected: All 4 tests PASS.

- [ ] **Step 11: Commit**

```bash
git add backend/src/legal-texts/ backend/test/legal-texts.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): legal-texts module with filtering, versions, references"
```

---

## Task 7: Pipeline Jobs Module

**Files:**
- Create: `backend/src/pipeline/entities/pipeline-job.entity.ts`
- Create: `backend/src/pipeline/entities/source-config.entity.ts`
- Create: `backend/src/pipeline/dto/create-pipeline-job.dto.ts`
- Create: `backend/src/pipeline/pipeline.service.ts`
- Create: `backend/src/pipeline/pipeline.controller.ts`
- Create: `backend/src/pipeline/pipeline.module.ts`
- Create: `backend/test/pipeline.e2e-spec.ts`

- [ ] **Step 1: Write e2e test**

Create `backend/test/pipeline.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PipelineController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /pipeline/jobs should create a pipeline job', () => {
    return request(app.getHttpServer())
      .post('/pipeline/jobs')
      .send({
        sourceName: 'FAOLEX',
        sourceUrl: 'https://www.fao.org/faolex/results/details/en/c/LEX-FAOC123456/',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.sourceName).toBe('FAOLEX');
        expect(res.body.status).toBe('queued');
      });
  });

  it('GET /pipeline/jobs should list jobs', () => {
    return request(app.getHttpServer())
      .get('/pipeline/jobs')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });

  it('POST /pipeline/sources should create a source config', () => {
    return request(app.getHttpServer())
      .post('/pipeline/sources')
      .send({
        name: 'FAOLEX',
        scraperType: 'api',
        baseUrl: 'https://www.fao.org/faolex/',
        schedule: 'daily',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('FAOLEX');
        expect(res.body.isActive).toBe(true);
      });
  });

  it('GET /pipeline/sources should list source configs', () => {
    return request(app.getHttpServer())
      .get('/pipeline/sources')
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeGreaterThan(0);
      });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test:e2e -- --testPathPattern=pipeline
```

Expected: FAIL.

- [ ] **Step 3: Create pipeline job entity**

Create `backend/src/pipeline/entities/pipeline-job.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalText } from '../../legal-texts/entities/legal-text.entity';

export enum JobStatus {
  QUEUED = 'queued',
  SCRAPING = 'scraping',
  EXTRACTING = 'extracting',
  ENRICHING = 'enriching',
  READY_FOR_REVIEW = 'ready_for_review',
  FAILED = 'failed',
}

@Entity('pipeline_jobs')
export class PipelineJob extends BaseEntity {
  @Column({ name: 'source_name' })
  sourceName: string;

  @Column({ name: 'source_url', nullable: true })
  sourceUrl: string;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.QUEUED })
  status: JobStatus;

  @Column({ name: 'raw_s3_key', nullable: true })
  rawS3Key: string;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string;

  @Column({ name: 'ocr_method', nullable: true })
  ocrMethod: string;

  @Column({ name: 'ocr_quality', type: 'float', nullable: true })
  ocrQuality: number;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson: Record<string, any>;

  @Column({ name: 'legal_text_id', nullable: true })
  legalTextId: string;

  @ManyToOne(() => LegalText, { nullable: true })
  @JoinColumn({ name: 'legal_text_id' })
  legalText: LegalText;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}
```

- [ ] **Step 4: Create source config entity**

Create `backend/src/pipeline/entities/source-config.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('source_configs')
export class SourceConfig extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'scraper_type' })
  scraperType: string;

  @Column({ name: 'base_url' })
  baseUrl: string;

  @Column({ default: 'daily' })
  schedule: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_run_at', type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @Column({ name: 'last_success_at', type: 'timestamp', nullable: true })
  lastSuccessAt: Date;

  @Column({ name: 'config_json', type: 'jsonb', nullable: true })
  configJson: Record<string, any>;
}
```

- [ ] **Step 5: Create pipeline job DTO**

Create `backend/src/pipeline/dto/create-pipeline-job.dto.ts`:

```typescript
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePipelineJobDto {
  @ApiProperty({ example: 'FAOLEX' })
  @IsString()
  sourceName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sourceUrl?: string;
}

export class CreateSourceConfigDto {
  @ApiProperty({ example: 'FAOLEX' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'api' })
  @IsString()
  scraperType: string;

  @ApiProperty({ example: 'https://www.fao.org/faolex/' })
  @IsString()
  baseUrl: string;

  @ApiPropertyOptional({ example: 'daily' })
  @IsOptional()
  @IsString()
  schedule?: string;
}
```

- [ ] **Step 6: Create pipeline service**

Create `backend/src/pipeline/pipeline.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineJob } from './entities/pipeline-job.entity';
import { SourceConfig } from './entities/source-config.entity';
import { CreatePipelineJobDto, CreateSourceConfigDto } from './dto/create-pipeline-job.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PipelineService {
  constructor(
    @InjectRepository(PipelineJob)
    private readonly jobRepo: Repository<PipelineJob>,
    @InjectRepository(SourceConfig)
    private readonly sourceRepo: Repository<SourceConfig>,
  ) {}

  async createJob(dto: CreatePipelineJobDto): Promise<PipelineJob> {
    const job = this.jobRepo.create(dto);
    return this.jobRepo.save(job);
  }

  async findAllJobs(pagination: PaginationDto): Promise<PaginatedResult<PipelineJob>> {
    const { page, limit } = pagination;
    const [data, total] = await this.jobRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return new PaginatedResult(data, total, page, limit);
  }

  async updateJobStatus(id: string, status: string, extra?: Partial<PipelineJob>): Promise<PipelineJob> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    Object.assign(job, { status, ...extra });
    return this.jobRepo.save(job);
  }

  async createSource(dto: CreateSourceConfigDto): Promise<SourceConfig> {
    const source = this.sourceRepo.create(dto);
    return this.sourceRepo.save(source);
  }

  async findAllSources(): Promise<SourceConfig[]> {
    return this.sourceRepo.find({ order: { name: 'ASC' } });
  }
}
```

- [ ] **Step 7: Create pipeline controller**

Create `backend/src/pipeline/pipeline.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { CreatePipelineJobDto, CreateSourceConfigDto } from './dto/create-pipeline-job.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly service: PipelineService) {}

  @Post('jobs')
  @ApiOperation({ summary: 'Create a pipeline job' })
  createJob(@Body() dto: CreatePipelineJobDto) {
    return this.service.createJob(dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List pipeline jobs' })
  findAllJobs(@Query() pagination: PaginationDto) {
    return this.service.findAllJobs(pagination);
  }

  @Post('sources')
  @ApiOperation({ summary: 'Create a source config' })
  createSource(@Body() dto: CreateSourceConfigDto) {
    return this.service.createSource(dto);
  }

  @Get('sources')
  @ApiOperation({ summary: 'List source configs' })
  findAllSources() {
    return this.service.findAllSources();
  }
}
```

- [ ] **Step 8: Create pipeline module and register**

Create `backend/src/pipeline/pipeline.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineJob } from './entities/pipeline-job.entity';
import { SourceConfig } from './entities/source-config.entity';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PipelineJob, SourceConfig])],
  controllers: [PipelineController],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
```

Update `backend/src/app.module.ts` — add `PipelineModule`:

```typescript
import { PipelineModule } from './pipeline/pipeline.module';

@Module({
  imports: [
    // ... existing
    CountriesModule,
    ThemesModule,
    LegalTextsModule,
    PipelineModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 9: Run tests**

```bash
npm run test:e2e -- --testPathPattern=pipeline
```

Expected: All 4 tests PASS.

- [ ] **Step 10: Commit**

```bash
git add backend/src/pipeline/ backend/test/pipeline.e2e-spec.ts backend/src/app.module.ts
git commit -m "feat(backend): pipeline module with jobs tracking and source configs"
```

---

## Task 8: Seed Data (26 Countries + 42 Themes)

**Files:**
- Create: `backend/src/seed/data/countries.json`
- Create: `backend/src/seed/data/themes.json`
- Create: `backend/src/seed/seed.service.ts`
- Create: `backend/src/seed/seed.module.ts`
- Create: `backend/src/seed/seed.command.ts`

- [ ] **Step 1: Create countries seed data**

Create `backend/src/seed/data/countries.json`:

```json
[
  { "name": "République du Bénin", "code": "BJ", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "Burkina Faso", "code": "BF", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République du Burundi", "code": "BI", "region": "Afrique de l'Est", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République du Cameroun", "code": "CM", "region": "Afrique Centrale", "legalSystem": "Mixed (Civil/Common)", "officialLang": "Français" },
  { "name": "République Centrafricaine", "code": "CF", "region": "Afrique Centrale", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République des Comores", "code": "KM", "region": "Océan Indien", "legalSystem": "Mixed (Civil/Islamic)", "officialLang": "Français" },
  { "name": "République du Congo", "code": "CG", "region": "Afrique Centrale", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République Démocratique du Congo", "code": "CD", "region": "Afrique Centrale", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République de Côte d'Ivoire", "code": "CI", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République de Djibouti", "code": "DJ", "region": "Afrique de l'Est", "legalSystem": "Mixed (Civil/Islamic)", "officialLang": "Français" },
  { "name": "République Gabonaise", "code": "GA", "region": "Afrique Centrale", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République de Guinée", "code": "GN", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République de Guinée Équatoriale", "code": "GQ", "region": "Afrique Centrale", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République d'Haïti", "code": "HT", "region": "Caraïbes", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République de Madagascar", "code": "MG", "region": "Océan Indien", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République du Mali", "code": "ML", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République Islamique de Mauritanie", "code": "MR", "region": "Afrique de l'Ouest", "legalSystem": "Mixed (Civil/Islamic)", "officialLang": "Français" },
  { "name": "République du Niger", "code": "NE", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République Rwandaise", "code": "RW", "region": "Afrique de l'Est", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République du Sénégal", "code": "SN", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République des Seychelles", "code": "SC", "region": "Océan Indien", "legalSystem": "Mixed (Civil/Common)", "officialLang": "Français" },
  { "name": "République du Tchad", "code": "TD", "region": "Afrique Centrale", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République Togolaise", "code": "TG", "region": "Afrique de l'Ouest", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République Tunisienne", "code": "TN", "region": "Afrique du Nord", "legalSystem": "Mixed (Civil/Islamic)", "officialLang": "Français" },
  { "name": "Principauté de Monaco", "code": "MC", "region": "Europe", "legalSystem": "Civil law", "officialLang": "Français" },
  { "name": "République du Vanuatu", "code": "VU", "region": "Pacifique", "legalSystem": "Mixed (Civil/Common)", "officialLang": "Français" }
]
```

- [ ] **Step 2: Create themes seed data**

Create `backend/src/seed/data/themes.json`:

```json
[
  { "name": "Constitution & droit constitutionnel", "slug": "constitution", "icon": "scroll" },
  { "name": "Droit des affaires (OHADA)", "slug": "droit-affaires-ohada", "icon": "briefcase" },
  { "name": "Droit commercial", "slug": "droit-commercial", "icon": "shopping-cart" },
  { "name": "Droit du travail", "slug": "droit-travail", "icon": "hard-hat" },
  { "name": "Droit pénal", "slug": "droit-penal", "icon": "gavel" },
  { "name": "Droit de la famille", "slug": "droit-famille", "icon": "users" },
  { "name": "Droit foncier & immobilier", "slug": "droit-foncier", "icon": "map" },
  { "name": "Droit fiscal & douanier", "slug": "droit-fiscal", "icon": "calculator" },
  { "name": "Droit bancaire & financier", "slug": "droit-bancaire", "icon": "landmark" },
  { "name": "Droit des assurances", "slug": "droit-assurances", "icon": "shield" },
  { "name": "Droit des marchés publics", "slug": "marches-publics", "icon": "file-contract" },
  { "name": "Droit minier & ressources naturelles", "slug": "mines-ressources", "icon": "mountain" },
  { "name": "Énergie électrique", "slug": "energie-electrique", "icon": "bolt" },
  { "name": "Énergie renouvelable", "slug": "energie-renouvelable", "icon": "sun" },
  { "name": "Pétrole & gaz", "slug": "petrole-gaz", "icon": "oil-can" },
  { "name": "Agriculture", "slug": "agriculture", "icon": "seedling" },
  { "name": "Élevage & production animale", "slug": "elevage", "icon": "cow" },
  { "name": "Pêche & aquaculture", "slug": "peche-aquaculture", "icon": "fish" },
  { "name": "Environnement & climat", "slug": "environnement", "icon": "leaf" },
  { "name": "Forêts & biodiversité", "slug": "forets-biodiversite", "icon": "tree" },
  { "name": "Eau & assainissement", "slug": "eau-assainissement", "icon": "tint" },
  { "name": "Numérique & télécommunications", "slug": "numerique-telecoms", "icon": "wifi" },
  { "name": "Protection des données personnelles", "slug": "donnees-personnelles", "icon": "lock" },
  { "name": "Commerce électronique", "slug": "commerce-electronique", "icon": "globe" },
  { "name": "Cybersécurité", "slug": "cybersecurite", "icon": "shield-alt" },
  { "name": "Droit de la santé", "slug": "droit-sante", "icon": "heartbeat" },
  { "name": "Éducation & recherche", "slug": "education-recherche", "icon": "graduation-cap" },
  { "name": "Transport & mobilité", "slug": "transport", "icon": "truck" },
  { "name": "Urbanisme & construction", "slug": "urbanisme-construction", "icon": "building" },
  { "name": "Médias & communication", "slug": "medias-communication", "icon": "newspaper" },
  { "name": "Droits de l'homme", "slug": "droits-homme", "icon": "hand-holding-heart" },
  { "name": "Droit électoral", "slug": "droit-electoral", "icon": "vote-yea" },
  { "name": "Décentralisation & collectivités", "slug": "decentralisation", "icon": "sitemap" },
  { "name": "Fonction publique", "slug": "fonction-publique", "icon": "id-badge" },
  { "name": "Sécurité & défense", "slug": "securite-defense", "icon": "shield-virus" },
  { "name": "Propriété intellectuelle", "slug": "propriete-intellectuelle", "icon": "lightbulb" },
  { "name": "Droit maritime", "slug": "droit-maritime", "icon": "ship" },
  { "name": "Droit aérien", "slug": "droit-aerien", "icon": "plane" },
  { "name": "Investissements & PPP", "slug": "investissements-ppp", "icon": "handshake" },
  { "name": "Zones économiques spéciales", "slug": "zones-economiques", "icon": "industry" },
  { "name": "Coopération internationale", "slug": "cooperation-internationale", "icon": "globe-africa" },
  { "name": "Traités & accords internationaux", "slug": "traites-internationaux", "icon": "file-signature" }
]
```

- [ ] **Step 3: Create seed service**

Create `backend/src/seed/seed.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { CountriesService } from '../countries/countries.service';
import { ThemesService } from '../themes/themes.service';
import * as countriesData from './data/countries.json';
import * as themesData from './data/themes.json';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly countriesService: CountriesService,
    private readonly themesService: ThemesService,
  ) {}

  async run(): Promise<void> {
    await this.seedCountries();
    await this.seedThemes();
    this.logger.log('Seed completed successfully');
  }

  private async seedCountries(): Promise<void> {
    for (const data of countriesData) {
      try {
        await this.countriesService.findByCode(data.code);
        this.logger.log(`Country ${data.code} already exists, skipping`);
      } catch {
        await this.countriesService.create(data);
        this.logger.log(`Created country: ${data.name}`);
      }
    }
  }

  private async seedThemes(): Promise<void> {
    for (const data of themesData) {
      try {
        await this.themesService.findBySlug(data.slug);
        this.logger.log(`Theme ${data.slug} already exists, skipping`);
      } catch {
        await this.themesService.create(data);
        this.logger.log(`Created theme: ${data.name}`);
      }
    }
  }
}
```

- [ ] **Step 4: Create seed module**

Create `backend/src/seed/seed.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CountriesModule } from '../countries/countries.module';
import { ThemesModule } from '../themes/themes.module';
import { SeedService } from './seed.service';

@Module({
  imports: [CountriesModule, ThemesModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
```

- [ ] **Step 5: Create seed command**

Create `backend/src/seed/seed.command.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);
  await seedService.run();
  await app.close();
  process.exit(0);
}
bootstrap();
```

Register `SeedModule` in `backend/src/app.module.ts`:

```typescript
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    // ... existing
    CountriesModule,
    ThemesModule,
    LegalTextsModule,
    PipelineModule,
    SeedModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Add seed script to package.json**

Add to `backend/package.json` scripts:

```json
{
  "scripts": {
    "seed": "ts-node -r tsconfig-paths/register src/seed/seed.command.ts"
  }
}
```

- [ ] **Step 7: Run seed and verify**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/backend
npm run seed
```

Expected: 26 countries and 42 themes created, logs showing each creation.

- [ ] **Step 8: Verify via API**

```bash
curl -s http://localhost:4000/countries | python3 -m json.tool | head -20
curl -s http://localhost:4000/themes | python3 -m json.tool | head -20
```

Expected: Countries and themes returned with data.

- [ ] **Step 9: Commit**

```bash
git add backend/src/seed/ backend/src/app.module.ts backend/package.json
git commit -m "feat(backend): seed 26 francophone countries and 42 legal themes"
```

---

## Task 9: Python Pipeline Setup

**Files:**
- Create: `pipeline/Dockerfile`
- Create: `pipeline/pyproject.toml`
- Create: `pipeline/requirements.txt`
- Create: `pipeline/.env.example`
- Create: `pipeline/src/__init__.py`
- Create: `pipeline/src/config.py`
- Create: `pipeline/src/celery_app.py`
- Create: `pipeline/src/api_client.py`

- [ ] **Step 1: Create requirements.txt**

Create `pipeline/requirements.txt`:

```
celery[redis]==5.4.0
httpx==0.27.0
beautifulsoup4==4.12.3
lxml==5.2.0
pymupdf==1.24.0
feedparser==6.0.11
boto3==1.34.0
anthropic==0.40.0
python-dotenv==1.0.1
pytest==8.2.0
pytest-asyncio==0.23.0
pytest-httpx==0.30.0
```

- [ ] **Step 2: Create pyproject.toml**

Create `pipeline/pyproject.toml`:

```toml
[project]
name = "juristique-pipeline"
version = "0.1.0"
requires-python = ">=3.12"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

- [ ] **Step 3: Create config.py**

Create `pipeline/src/config.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    REDIS_URL = f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/0"
    API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:4000")
    S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_BUCKET = os.getenv("S3_BUCKET", "juristique-raw")
    S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
    S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
```

- [ ] **Step 4: Create celery_app.py**

Create `pipeline/src/celery_app.py`:

```python
from celery import Celery
from celery.schedules import crontab
from src.config import Config

app = Celery("juristique_pipeline", broker=Config.REDIS_URL)

app.conf.update(
    result_backend=Config.REDIS_URL,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)

app.conf.beat_schedule = {
    "scrape-faolex-daily": {
        "task": "src.tasks.scrape_tasks.scrape_faolex",
        "schedule": crontab(hour=2, minute=0),
    },
    "scrape-ohada-daily": {
        "task": "src.tasks.scrape_tasks.scrape_ohada",
        "schedule": crontab(hour=3, minute=0),
    },
}

app.autodiscover_tasks(["src.tasks"])
```

- [ ] **Step 5: Create api_client.py**

Create `pipeline/src/api_client.py`:

```python
import httpx
from src.config import Config


class ApiClient:
    def __init__(self):
        self.base_url = Config.API_BASE_URL

    async def create_pipeline_job(self, source_name: str, source_url: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/pipeline/jobs",
                json={"sourceName": source_name, "sourceUrl": source_url},
            )
            response.raise_for_status()
            return response.json()

    async def update_pipeline_job(self, job_id: str, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.base_url}/pipeline/jobs/{job_id}",
                json=data,
            )
            response.raise_for_status()
            return response.json()

    async def create_legal_text(self, data: dict) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/legal-texts",
                json=data,
            )
            response.raise_for_status()
            return response.json()

    async def get_country_by_code(self, code: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/countries/by-code/{code}",
            )
            response.raise_for_status()
            return response.json()

    async def get_theme_by_slug(self, slug: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/themes/by-slug/{slug}",
            )
            response.raise_for_status()
            return response.json()
```

- [ ] **Step 6: Create __init__.py files**

Create `pipeline/src/__init__.py`, `pipeline/src/scrapers/__init__.py`, `pipeline/src/extraction/__init__.py`, `pipeline/src/enrichment/__init__.py`, `pipeline/src/tasks/__init__.py`, `pipeline/tests/__init__.py`, `pipeline/tests/test_scrapers/__init__.py`, `pipeline/tests/test_extraction/__init__.py`, `pipeline/tests/test_enrichment/__init__.py`:

All files contain:

```python
```

(Empty files)

- [ ] **Step 7: Create Dockerfile**

Create `pipeline/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-fra \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["celery", "-A", "src.celery_app", "worker", "--loglevel=info"]
```

- [ ] **Step 8: Create .env.example**

Create `pipeline/.env.example`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
API_BASE_URL=http://localhost:4000
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=juristique-raw
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 9: Commit**

```bash
git add pipeline/
git commit -m "feat(pipeline): Python pipeline setup with Celery, config, API client"
```

---

## Task 10: Base Scraper & FAOLEX Scraper

**Files:**
- Create: `pipeline/src/scrapers/base.py`
- Create: `pipeline/src/scrapers/faolex.py`
- Create: `pipeline/tests/test_scrapers/test_faolex.py`
- Create: `pipeline/tests/conftest.py`

- [ ] **Step 1: Write FAOLEX scraper test**

Create `pipeline/tests/conftest.py`:

```python
import pytest


@pytest.fixture
def faolex_search_html():
    return """
    <div class="result-item">
        <h3><a href="/faolex/results/details/en/c/LEX-FAOC123456/">
            Loi n°2020-15 relative à l'élevage au Bénin
        </a></h3>
        <div class="field-country">Benin</div>
        <div class="field-date">2020</div>
        <div class="field-type">Legislation</div>
    </div>
    <div class="result-item">
        <h3><a href="/faolex/results/details/en/c/LEX-FAOC789012/">
            Décret sur la pêche au Sénégal
        </a></h3>
        <div class="field-country">Senegal</div>
        <div class="field-date">2019</div>
        <div class="field-type">Legislation</div>
    </div>
    """


@pytest.fixture
def faolex_detail_html():
    return """
    <div class="faolex-detail">
        <h1>Loi n°2020-15 relative à l'élevage au Bénin</h1>
        <div class="field-country">Benin</div>
        <div class="field-date-of-text">2020-06-15</div>
        <div class="field-type-of-text">Legislation</div>
        <div class="field-subject">Élevage, production animale</div>
        <div class="field-abstract">
            Cette loi régit les activités d'élevage sur le territoire national.
        </div>
        <a class="pdf-link" href="/docs/pdf/ben123456.pdf">PDF</a>
    </div>
    """
```

Create `pipeline/tests/test_scrapers/test_faolex.py`:

```python
import pytest
from src.scrapers.faolex import FaolexScraper


class TestFaolexScraper:
    def setup_method(self):
        self.scraper = FaolexScraper()

    def test_parse_search_results(self, faolex_search_html):
        results = self.scraper.parse_search_results(faolex_search_html)
        assert len(results) == 2
        assert results[0]["title"] == "Loi n°2020-15 relative à l'élevage au Bénin"
        assert "LEX-FAOC123456" in results[0]["url"]

    def test_parse_detail_page(self, faolex_detail_html):
        detail = self.scraper.parse_detail_page(faolex_detail_html)
        assert detail["title"] == "Loi n°2020-15 relative à l'élevage au Bénin"
        assert detail["date"] == "2020-06-15"
        assert "élevage" in detail["summary"].lower()
        assert detail["pdf_url"] is not None

    def test_country_code_mapping(self):
        assert self.scraper.map_country("Benin") == "BJ"
        assert self.scraper.map_country("Senegal") == "SN"
        assert self.scraper.map_country("Côte d'Ivoire") == "CI"
        assert self.scraper.map_country("Unknown") is None

    def test_theme_mapping(self):
        themes = self.scraper.map_themes("Élevage, production animale")
        assert "elevage" in themes
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/pipeline
python -m pytest tests/test_scrapers/test_faolex.py -v
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create base scraper**

Create `pipeline/src/scrapers/base.py`:

```python
import hashlib
import httpx
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class RawDocument:
    title: str
    source_url: str
    country_code: str
    source_name: str
    date: str | None = None
    text_type: str | None = None
    summary: str | None = None
    pdf_url: str | None = None
    content_html: str | None = None
    themes: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    @property
    def content_hash(self) -> str:
        content = f"{self.title}{self.source_url}{self.country_code}"
        return hashlib.md5(content.encode()).hexdigest()


class BaseScraper(ABC):
    BASE_URL: str = ""
    SOURCE_NAME: str = ""

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Juristique.bj Legal Data Collector/1.0",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
            },
        )

    async def fetch(self, url: str) -> str:
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text

    async def fetch_bytes(self, url: str) -> bytes:
        response = await self.client.get(url)
        response.raise_for_status()
        return response.content

    @abstractmethod
    async def collect(self) -> list[RawDocument]:
        pass

    async def close(self):
        await self.client.aclose()
```

- [ ] **Step 4: Create FAOLEX scraper**

Create `pipeline/src/scrapers/faolex.py`:

```python
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from src.scrapers.base import BaseScraper, RawDocument

FAOLEX_COUNTRY_MAP = {
    "Benin": "BJ", "Burkina Faso": "BF", "Burundi": "BI",
    "Cameroon": "CM", "Central African Republic": "CF",
    "Comoros": "KM", "Congo": "CG",
    "Democratic Republic of the Congo": "CD",
    "Côte d'Ivoire": "CI", "Djibouti": "DJ",
    "Gabon": "GA", "Guinea": "GN",
    "Equatorial Guinea": "GQ", "Haiti": "HT",
    "Madagascar": "MG", "Mali": "ML",
    "Mauritania": "MR", "Niger": "NE",
    "Rwanda": "RW", "Senegal": "SN",
    "Seychelles": "SC", "Chad": "TD",
    "Togo": "TG", "Tunisia": "TN",
    "Monaco": "MC", "Vanuatu": "VU",
}

FAOLEX_THEME_MAP = {
    "livestock": "elevage",
    "élevage": "elevage",
    "production animale": "elevage",
    "fisheries": "peche-aquaculture",
    "pêche": "peche-aquaculture",
    "aquaculture": "peche-aquaculture",
    "land & soil": "droit-foncier",
    "terres": "droit-foncier",
    "water": "eau-assainissement",
    "eau": "eau-assainissement",
    "forestry": "forets-biodiversite",
    "forêts": "forets-biodiversite",
    "environment": "environnement",
    "environnement": "environnement",
    "mineral resources": "mines-ressources",
    "energy": "energie-electrique",
    "énergie": "energie-electrique",
    "food": "droit-sante",
    "alimentation": "droit-sante",
    "wild species": "forets-biodiversite",
    "sea": "droit-maritime",
    "agriculture": "agriculture",
    "cultivated plants": "agriculture",
}


class FaolexScraper(BaseScraper):
    BASE_URL = "https://www.fao.org/faolex"
    SOURCE_NAME = "FAOLEX"

    def parse_search_results(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        results = []
        for item in soup.select(".result-item"):
            link = item.select_one("h3 a")
            if not link:
                continue
            results.append({
                "title": link.text.strip(),
                "url": urljoin(self.BASE_URL, link["href"]),
                "country": item.select_one(".field-country").text.strip()
                if item.select_one(".field-country") else None,
                "date": item.select_one(".field-date").text.strip()
                if item.select_one(".field-date") else None,
            })
        return results

    def parse_detail_page(self, html: str) -> dict:
        soup = BeautifulSoup(html, "lxml")
        detail = soup.select_one(".faolex-detail")
        if not detail:
            return {}

        pdf_link = detail.select_one("a.pdf-link")
        return {
            "title": detail.select_one("h1").text.strip()
            if detail.select_one("h1") else "",
            "country": detail.select_one(".field-country").text.strip()
            if detail.select_one(".field-country") else "",
            "date": detail.select_one(".field-date-of-text").text.strip()
            if detail.select_one(".field-date-of-text") else None,
            "text_type": detail.select_one(".field-type-of-text").text.strip()
            if detail.select_one(".field-type-of-text") else None,
            "subject": detail.select_one(".field-subject").text.strip()
            if detail.select_one(".field-subject") else "",
            "summary": detail.select_one(".field-abstract").text.strip()
            if detail.select_one(".field-abstract") else "",
            "pdf_url": urljoin(self.BASE_URL, pdf_link["href"])
            if pdf_link else None,
        }

    def map_country(self, country_name: str) -> str | None:
        return FAOLEX_COUNTRY_MAP.get(country_name)

    def map_themes(self, subject: str) -> list[str]:
        themes = []
        subject_lower = subject.lower()
        for keyword, slug in FAOLEX_THEME_MAP.items():
            if keyword.lower() in subject_lower and slug not in themes:
                themes.append(slug)
        return themes

    async def collect(self) -> list[RawDocument]:
        documents = []
        for country_name, country_code in FAOLEX_COUNTRY_MAP.items():
            search_url = f"{self.BASE_URL}/results/fr/?search=adv&country={country_name}"
            try:
                html = await self.fetch(search_url)
                results = self.parse_search_results(html)

                for result in results:
                    detail_html = await self.fetch(result["url"])
                    detail = self.parse_detail_page(detail_html)

                    documents.append(RawDocument(
                        title=detail.get("title", result["title"]),
                        source_url=result["url"],
                        country_code=country_code,
                        source_name=self.SOURCE_NAME,
                        date=detail.get("date"),
                        summary=detail.get("summary"),
                        pdf_url=detail.get("pdf_url"),
                        themes=self.map_themes(detail.get("subject", "")),
                    ))
            except Exception as e:
                print(f"Error scraping FAOLEX for {country_name}: {e}")
                continue

        return documents
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/pipeline
python -m pytest tests/test_scrapers/test_faolex.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add pipeline/src/scrapers/ pipeline/tests/
git commit -m "feat(pipeline): base scraper and FAOLEX scraper with parsing and mapping"
```

---

## Task 11: OHADA & Constitutions Scrapers

**Files:**
- Create: `pipeline/src/scrapers/ohada.py`
- Create: `pipeline/src/scrapers/constitutions.py`
- Create: `pipeline/tests/test_scrapers/test_ohada.py`
- Create: `pipeline/tests/test_scrapers/test_constitutions.py`

- [ ] **Step 1: Write OHADA scraper test**

Create `pipeline/tests/test_scrapers/test_ohada.py`:

```python
import pytest
from src.scrapers.ohada import OhadaScraper


class TestOhadaScraper:
    def setup_method(self):
        self.scraper = OhadaScraper()

    def test_parse_actes_list(self):
        html = """
        <div class="acte-item">
            <a href="/actes-uniformes/acte-uniforme-droit-commercial">
                Acte uniforme relatif au droit commercial général
            </a>
            <span class="date">2010-12-15</span>
            <a class="pdf" href="/docs/AUDCG-2010.pdf">PDF</a>
        </div>
        <div class="acte-item">
            <a href="/actes-uniformes/acte-uniforme-societes">
                Acte uniforme relatif au droit des sociétés commerciales
            </a>
            <span class="date">2014-01-30</span>
            <a class="pdf" href="/docs/AUSCGIE-2014.pdf">PDF</a>
        </div>
        """
        results = self.scraper.parse_actes_list(html)
        assert len(results) == 2
        assert "droit commercial" in results[0]["title"].lower()
        assert results[0]["pdf_url"] is not None

    def test_ohada_covers_17_countries(self):
        assert len(self.scraper.OHADA_COUNTRIES) == 17
        assert "BJ" in self.scraper.OHADA_COUNTRIES
        assert "SN" in self.scraper.OHADA_COUNTRIES
```

- [ ] **Step 2: Write constitutions scraper test**

Create `pipeline/tests/test_scrapers/test_constitutions.py`:

```python
import pytest
from src.scrapers.constitutions import ConstitutionsScraper


class TestConstitutionsScraper:
    def setup_method(self):
        self.scraper = ConstitutionsScraper()

    def test_has_26_countries(self):
        assert len(self.scraper.CONSTITUTIONS) == 26

    def test_each_entry_has_required_fields(self):
        for entry in self.scraper.CONSTITUTIONS:
            assert "country_code" in entry
            assert "title" in entry
            assert "source_url" in entry
            assert "date" in entry

    def test_benin_constitution(self):
        bj = next(c for c in self.scraper.CONSTITUTIONS if c["country_code"] == "BJ")
        assert "1990" in bj["date"] or "2019" in bj["date"]
        assert "constitution" in bj["title"].lower()
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
python -m pytest tests/test_scrapers/test_ohada.py tests/test_scrapers/test_constitutions.py -v
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Create OHADA scraper**

Create `pipeline/src/scrapers/ohada.py`:

```python
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from src.scrapers.base import BaseScraper, RawDocument


class OhadaScraper(BaseScraper):
    BASE_URL = "https://www.ohada.com"
    SOURCE_NAME = "OHADA"

    OHADA_COUNTRIES = [
        "BJ", "BF", "CM", "CF", "KM", "CG", "CD", "CI",
        "GA", "GN", "GQ", "ML", "NE", "SN", "TD", "TG", "MR",
    ]

    def parse_actes_list(self, html: str) -> list[dict]:
        soup = BeautifulSoup(html, "lxml")
        results = []
        for item in soup.select(".acte-item"):
            link = item.select_one("a:not(.pdf)")
            pdf_link = item.select_one("a.pdf")
            date_el = item.select_one(".date")
            if not link:
                continue
            results.append({
                "title": link.text.strip(),
                "url": urljoin(self.BASE_URL, link["href"]),
                "date": date_el.text.strip() if date_el else None,
                "pdf_url": urljoin(self.BASE_URL, pdf_link["href"])
                if pdf_link else None,
            })
        return results

    async def collect(self) -> list[RawDocument]:
        documents = []
        try:
            html = await self.fetch(f"{self.BASE_URL}/actes-uniformes")
            actes = self.parse_actes_list(html)

            for acte in actes:
                for country_code in self.OHADA_COUNTRIES:
                    documents.append(RawDocument(
                        title=acte["title"],
                        source_url=acte["url"],
                        country_code=country_code,
                        source_name=self.SOURCE_NAME,
                        date=acte.get("date"),
                        pdf_url=acte.get("pdf_url"),
                        themes=["droit-affaires-ohada"],
                        metadata={"supranational": True},
                    ))
        except Exception as e:
            print(f"Error scraping OHADA: {e}")

        return documents
```

- [ ] **Step 5: Create constitutions scraper**

Create `pipeline/src/scrapers/constitutions.py`:

```python
from src.scrapers.base import BaseScraper, RawDocument


class ConstitutionsScraper(BaseScraper):
    SOURCE_NAME = "Constitutions"

    CONSTITUTIONS = [
        {"country_code": "BJ", "title": "Constitution de la République du Bénin", "date": "1990-12-11", "source_url": "https://www.constituteproject.org/constitution/Benin_2019"},
        {"country_code": "BF", "title": "Constitution du Burkina Faso", "date": "1991-06-02", "source_url": "https://www.constituteproject.org/constitution/Burkina_Faso_2015"},
        {"country_code": "BI", "title": "Constitution de la République du Burundi", "date": "2018-06-07", "source_url": "https://www.constituteproject.org/constitution/Burundi_2018"},
        {"country_code": "CM", "title": "Constitution de la République du Cameroun", "date": "1996-01-18", "source_url": "https://www.constituteproject.org/constitution/Cameroon_2008"},
        {"country_code": "CF", "title": "Constitution de la République Centrafricaine", "date": "2016-03-30", "source_url": "https://www.constituteproject.org/constitution/Central_African_Republic_2016"},
        {"country_code": "KM", "title": "Constitution de l'Union des Comores", "date": "2018-07-30", "source_url": "https://www.constituteproject.org/constitution/Comoros_2018"},
        {"country_code": "CG", "title": "Constitution de la République du Congo", "date": "2015-11-06", "source_url": "https://www.constituteproject.org/constitution/Congo_2015"},
        {"country_code": "CD", "title": "Constitution de la RDC", "date": "2006-02-18", "source_url": "https://www.constituteproject.org/constitution/Democratic_Republic_of_the_Congo_2011"},
        {"country_code": "CI", "title": "Constitution de la République de Côte d'Ivoire", "date": "2016-11-08", "source_url": "https://www.constituteproject.org/constitution/Cote_dIvoire_2016"},
        {"country_code": "DJ", "title": "Constitution de la République de Djibouti", "date": "1992-09-15", "source_url": "https://www.constituteproject.org/constitution/Djibouti_2010"},
        {"country_code": "GA", "title": "Constitution de la République Gabonaise", "date": "1991-03-26", "source_url": "https://www.constituteproject.org/constitution/Gabon_2011"},
        {"country_code": "GN", "title": "Constitution de la République de Guinée", "date": "2020-03-22", "source_url": "https://www.constituteproject.org/constitution/Guinea_2020"},
        {"country_code": "GQ", "title": "Constitución de Guinea Ecuatorial", "date": "1991-11-17", "source_url": "https://www.constituteproject.org/constitution/Equatorial_Guinea_2012"},
        {"country_code": "HT", "title": "Constitution de la République d'Haïti", "date": "1987-03-29", "source_url": "https://www.constituteproject.org/constitution/Haiti_2012"},
        {"country_code": "MG", "title": "Constitution de la République de Madagascar", "date": "2010-11-11", "source_url": "https://www.constituteproject.org/constitution/Madagascar_2010"},
        {"country_code": "ML", "title": "Constitution de la République du Mali", "date": "2023-06-22", "source_url": "https://www.constituteproject.org/constitution/Mali_2023"},
        {"country_code": "MR", "title": "Constitution de la République Islamique de Mauritanie", "date": "1991-07-12", "source_url": "https://www.constituteproject.org/constitution/Mauritania_2012"},
        {"country_code": "NE", "title": "Constitution de la République du Niger", "date": "2010-11-25", "source_url": "https://www.constituteproject.org/constitution/Niger_2017"},
        {"country_code": "RW", "title": "Constitution de la République du Rwanda", "date": "2003-06-04", "source_url": "https://www.constituteproject.org/constitution/Rwanda_2015"},
        {"country_code": "SN", "title": "Constitution de la République du Sénégal", "date": "2001-01-22", "source_url": "https://www.constituteproject.org/constitution/Senegal_2016"},
        {"country_code": "SC", "title": "Constitution of the Republic of Seychelles", "date": "1993-06-18", "source_url": "https://www.constituteproject.org/constitution/Seychelles_2017"},
        {"country_code": "TD", "title": "Constitution de la République du Tchad", "date": "2018-05-04", "source_url": "https://www.constituteproject.org/constitution/Chad_2018"},
        {"country_code": "TG", "title": "Constitution de la République Togolaise", "date": "2024-05-06", "source_url": "https://www.constituteproject.org/constitution/Togo_2024"},
        {"country_code": "TN", "title": "Constitution de la République Tunisienne", "date": "2022-07-25", "source_url": "https://www.constituteproject.org/constitution/Tunisia_2022"},
        {"country_code": "MC", "title": "Constitution de la Principauté de Monaco", "date": "1962-12-17", "source_url": "https://www.constituteproject.org/constitution/Monaco_2002"},
        {"country_code": "VU", "title": "Constitution of the Republic of Vanuatu", "date": "1980-07-30", "source_url": "https://www.constituteproject.org/constitution/Vanuatu_2013"},
    ]

    async def collect(self) -> list[RawDocument]:
        documents = []
        for entry in self.CONSTITUTIONS:
            documents.append(RawDocument(
                title=entry["title"],
                source_url=entry["source_url"],
                country_code=entry["country_code"],
                source_name=self.SOURCE_NAME,
                date=entry["date"],
                themes=["constitution"],
                metadata={"text_type": "constitution", "hierarchy_rank": 1},
            ))
        return documents
```

- [ ] **Step 6: Run tests**

```bash
python -m pytest tests/test_scrapers/ -v
```

Expected: All tests PASS (FAOLEX + OHADA + Constitutions).

- [ ] **Step 7: Commit**

```bash
git add pipeline/src/scrapers/ pipeline/tests/
git commit -m "feat(pipeline): OHADA scraper (17 countries) and constitutions scraper (26 countries)"
```

---

## Task 12: PDF Extraction & OCR

**Files:**
- Create: `pipeline/src/extraction/pdf_extractor.py`
- Create: `pipeline/src/extraction/html_extractor.py`
- Create: `pipeline/src/extraction/ocr.py`
- Create: `pipeline/tests/test_extraction/test_pdf_extractor.py`

- [ ] **Step 1: Write PDF extractor test**

Create `pipeline/tests/test_extraction/test_pdf_extractor.py`:

```python
import pytest
from src.extraction.pdf_extractor import PdfExtractor


class TestPdfExtractor:
    def setup_method(self):
        self.extractor = PdfExtractor()

    def test_quality_score_good_text(self):
        good_text = "Loi n°2020-15 relative à l'élevage. " * 50
        score = self.extractor.quality_score(good_text)
        assert score > 0.8

    def test_quality_score_bad_text(self):
        bad_text = "a$#@ bx!! 123 ??? &&& %%% @@@ " * 50
        score = self.extractor.quality_score(bad_text)
        assert score < 0.5

    def test_quality_score_empty(self):
        score = self.extractor.quality_score("")
        assert score == 0.0

    def test_clean_text(self):
        dirty = "  Loi  n°2020-15  \n\n\n  relative   à   l'élevage.  \n"
        cleaned = self.extractor.clean(dirty)
        assert "\n\n\n" not in cleaned
        assert "  " not in cleaned.replace("\n", " ").strip()
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest tests/test_extraction/test_pdf_extractor.py -v
```

Expected: FAIL.

- [ ] **Step 3: Create PDF extractor**

Create `pipeline/src/extraction/pdf_extractor.py`:

```python
import re
import fitz  # PyMuPDF


class PdfExtractor:
    def extract_text(self, pdf_path: str) -> str:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text

    def quality_score(self, text: str) -> float:
        if not text or len(text.strip()) == 0:
            return 0.0

        total_chars = len(text)
        alpha_chars = sum(1 for c in text if c.isalpha() or c.isspace())
        alpha_ratio = alpha_chars / total_chars if total_chars > 0 else 0

        words = text.split()
        if not words:
            return 0.0

        avg_word_len = sum(len(w) for w in words) / len(words)
        word_len_score = min(avg_word_len / 6.0, 1.0) if avg_word_len > 1 else 0.0

        french_common = ["le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "à", "est", "que", "qui", "dans", "pour", "par", "sur", "au", "aux"]
        words_lower = [w.lower() for w in words[:200]]
        french_hits = sum(1 for w in words_lower if w in french_common)
        french_ratio = french_hits / min(len(words_lower), 200) if words_lower else 0

        return (alpha_ratio * 0.4) + (word_len_score * 0.3) + (french_ratio * 0.3)

    def clean(self, text: str) -> str:
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        lines = [line.strip() for line in text.split('\n')]
        return '\n'.join(lines).strip()
```

- [ ] **Step 4: Create HTML extractor**

Create `pipeline/src/extraction/html_extractor.py`:

```python
import re
from bs4 import BeautifulSoup


class HtmlExtractor:
    REMOVE_TAGS = ["script", "style", "nav", "footer", "header", "aside"]

    def extract_text(self, html: str) -> str:
        soup = BeautifulSoup(html, "lxml")

        for tag in self.REMOVE_TAGS:
            for el in soup.find_all(tag):
                el.decompose()

        text = soup.get_text(separator="\n")
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        lines = [line.strip() for line in text.split('\n')]
        return '\n'.join(line for line in lines if line).strip()
```

- [ ] **Step 5: Create OCR module**

Create `pipeline/src/extraction/ocr.py`:

```python
from src.extraction.pdf_extractor import PdfExtractor


class OcrPipeline:
    QUALITY_THRESHOLD_DIRECT = 0.85
    QUALITY_THRESHOLD_ACCEPTABLE = 0.70

    def __init__(self):
        self.pdf_extractor = PdfExtractor()

    async def process(self, pdf_path: str) -> dict:
        direct_text = self.pdf_extractor.extract_text(pdf_path)
        direct_score = self.pdf_extractor.quality_score(direct_text)

        if direct_score > self.QUALITY_THRESHOLD_DIRECT:
            return {
                "text": self.pdf_extractor.clean(direct_text),
                "method": "direct",
                "quality": direct_score,
            }

        # Fallback: Tesseract OCR
        try:
            import subprocess
            result = subprocess.run(
                ["tesseract", pdf_path, "stdout", "-l", "fra"],
                capture_output=True, text=True, timeout=120,
            )
            ocr_text = result.stdout
            ocr_score = self.pdf_extractor.quality_score(ocr_text)

            return {
                "text": self.pdf_extractor.clean(ocr_text),
                "method": "tesseract",
                "quality": ocr_score,
                "needs_review": ocr_score < self.QUALITY_THRESHOLD_ACCEPTABLE,
            }
        except Exception as e:
            return {
                "text": self.pdf_extractor.clean(direct_text),
                "method": "direct_fallback",
                "quality": direct_score,
                "needs_review": True,
                "error": str(e),
            }
```

- [ ] **Step 6: Run tests**

```bash
python -m pytest tests/test_extraction/ -v
```

Expected: All 4 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add pipeline/src/extraction/ pipeline/tests/test_extraction/
git commit -m "feat(pipeline): PDF/HTML extraction and OCR pipeline with quality scoring"
```

---

## Task 13: Theme Classifier (Claude API)

**Files:**
- Create: `pipeline/src/enrichment/metadata_extractor.py`
- Create: `pipeline/src/enrichment/theme_classifier.py`
- Create: `pipeline/tests/test_enrichment/test_theme_classifier.py`

- [ ] **Step 1: Write theme classifier test**

Create `pipeline/tests/test_enrichment/test_theme_classifier.py`:

```python
import pytest
from src.enrichment.theme_classifier import ThemeClassifier

VALID_SLUGS = [
    "constitution", "droit-affaires-ohada", "droit-commercial",
    "droit-travail", "droit-penal", "droit-famille", "droit-foncier",
    "droit-fiscal", "droit-bancaire", "droit-assurances",
    "marches-publics", "mines-ressources", "energie-electrique",
    "energie-renouvelable", "petrole-gaz", "agriculture", "elevage",
    "peche-aquaculture", "environnement", "forets-biodiversite",
    "eau-assainissement", "numerique-telecoms", "donnees-personnelles",
    "commerce-electronique", "cybersecurite", "droit-sante",
    "education-recherche", "transport", "urbanisme-construction",
    "medias-communication", "droits-homme", "droit-electoral",
    "decentralisation", "fonction-publique", "securite-defense",
    "propriete-intellectuelle", "droit-maritime", "droit-aerien",
    "investissements-ppp", "zones-economiques",
    "cooperation-internationale", "traites-internationaux",
]


class TestThemeClassifier:
    def setup_method(self):
        self.classifier = ThemeClassifier()

    def test_build_prompt_includes_title(self):
        prompt = self.classifier.build_prompt(
            title="Loi sur l'élevage",
            text="Texte relatif à l'élevage bovin.",
        )
        assert "élevage" in prompt.lower()
        assert "slug" in prompt.lower()

    def test_parse_response_valid_json(self):
        response = '{"themes": ["elevage", "agriculture"]}'
        themes = self.classifier.parse_response(response)
        assert themes == ["elevage", "agriculture"]

    def test_parse_response_filters_invalid(self):
        response = '{"themes": ["elevage", "invalid-theme-xyz"]}'
        themes = self.classifier.parse_response(response)
        assert "elevage" in themes
        assert "invalid-theme-xyz" not in themes

    def test_parse_response_handles_bad_json(self):
        response = "not valid json"
        themes = self.classifier.parse_response(response)
        assert themes == []
```

- [ ] **Step 2: Run test to verify it fails**

```bash
python -m pytest tests/test_enrichment/test_theme_classifier.py -v
```

Expected: FAIL.

- [ ] **Step 3: Create theme classifier**

Create `pipeline/src/enrichment/theme_classifier.py`:

```python
import json
import anthropic
from src.config import Config

VALID_THEME_SLUGS = [
    "constitution", "droit-affaires-ohada", "droit-commercial",
    "droit-travail", "droit-penal", "droit-famille", "droit-foncier",
    "droit-fiscal", "droit-bancaire", "droit-assurances",
    "marches-publics", "mines-ressources", "energie-electrique",
    "energie-renouvelable", "petrole-gaz", "agriculture", "elevage",
    "peche-aquaculture", "environnement", "forets-biodiversite",
    "eau-assainissement", "numerique-telecoms", "donnees-personnelles",
    "commerce-electronique", "cybersecurite", "droit-sante",
    "education-recherche", "transport", "urbanisme-construction",
    "medias-communication", "droits-homme", "droit-electoral",
    "decentralisation", "fonction-publique", "securite-defense",
    "propriete-intellectuelle", "droit-maritime", "droit-aerien",
    "investissements-ppp", "zones-economiques",
    "cooperation-internationale", "traites-internationaux",
]


class ThemeClassifier:
    def build_prompt(self, title: str, text: str) -> str:
        text_preview = text[:2000] if text else ""
        slugs_list = "\n".join(f"- {s}" for s in VALID_THEME_SLUGS)
        return f"""Classify this legal text into one or more themes.

Title: {title}

Text (preview):
{text_preview}

Available theme slugs:
{slugs_list}

Return ONLY a JSON object with a "themes" key containing an array of matching slug strings.
Example: {{"themes": ["elevage", "agriculture"]}}

Be precise. Only assign themes that are clearly relevant to the text."""

    def parse_response(self, response: str) -> list[str]:
        try:
            data = json.loads(response)
            themes = data.get("themes", [])
            return [t for t in themes if t in VALID_THEME_SLUGS]
        except (json.JSONDecodeError, AttributeError):
            return []

    async def classify(self, title: str, text: str) -> list[str]:
        client = anthropic.AsyncAnthropic(api_key=Config.ANTHROPIC_API_KEY)
        prompt = self.build_prompt(title, text)

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text
        return self.parse_response(response_text)
```

- [ ] **Step 4: Create metadata extractor**

Create `pipeline/src/enrichment/metadata_extractor.py`:

```python
import json
import anthropic
from src.config import Config


class MetadataExtractor:
    def build_prompt(self, title: str, text: str) -> str:
        text_preview = text[:3000] if text else ""
        return f"""Extract metadata from this legal text.

Title: {title}

Text (preview):
{text_preview}

Return ONLY a JSON object with these fields:
- "reference": the official reference number (e.g., "Loi n°2020-15")
- "text_type": one of: constitution, loi_organique, loi, ordonnance, decret, arrete, traite, acte_uniforme
- "promulgation_date": date in YYYY-MM-DD format if found, null otherwise
- "summary": a 2-3 sentence summary in French

Example:
{{"reference": "Loi n°2020-15", "text_type": "loi", "promulgation_date": "2020-06-15", "summary": "Cette loi..."}}"""

    def parse_response(self, response: str) -> dict:
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {}

    async def extract(self, title: str, text: str) -> dict:
        client = anthropic.AsyncAnthropic(api_key=Config.ANTHROPIC_API_KEY)
        prompt = self.build_prompt(title, text)

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text
        return self.parse_response(response_text)
```

- [ ] **Step 5: Run tests**

```bash
python -m pytest tests/test_enrichment/ -v
```

Expected: All 4 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add pipeline/src/enrichment/ pipeline/tests/test_enrichment/
git commit -m "feat(pipeline): Claude API theme classifier and metadata extractor"
```

---

## Task 14: Celery Tasks (Scrape → Extract → Enrich)

**Files:**
- Create: `pipeline/src/tasks/scrape_tasks.py`
- Create: `pipeline/src/tasks/extract_tasks.py`
- Create: `pipeline/src/tasks/enrich_tasks.py`

- [ ] **Step 1: Create scrape tasks**

Create `pipeline/src/tasks/scrape_tasks.py`:

```python
import asyncio
import boto3
from src.celery_app import app
from src.config import Config
from src.api_client import ApiClient
from src.scrapers.faolex import FaolexScraper
from src.scrapers.ohada import OhadaScraper
from src.scrapers.constitutions import ConstitutionsScraper


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=Config.S3_ENDPOINT,
        aws_access_key_id=Config.S3_ACCESS_KEY,
        aws_secret_access_key=Config.S3_SECRET_KEY,
    )


@app.task(name="src.tasks.scrape_tasks.scrape_faolex")
def scrape_faolex():
    asyncio.run(_scrape_faolex())


async def _scrape_faolex():
    scraper = FaolexScraper()
    api = ApiClient()
    s3 = get_s3_client()

    try:
        documents = await scraper.collect()
        for doc in documents:
            job = await api.create_pipeline_job(
                source_name=scraper.SOURCE_NAME,
                source_url=doc.source_url,
            )

            if doc.pdf_url:
                pdf_bytes = await scraper.fetch_bytes(doc.pdf_url)
                s3_key = f"raw/{doc.country_code}/{doc.content_hash}.pdf"
                s3.put_object(
                    Bucket=Config.S3_BUCKET,
                    Key=s3_key,
                    Body=pdf_bytes,
                )
                extract_pdf.delay(job["id"], s3_key, doc.__dict__)
            else:
                enrich_text.delay(job["id"], doc.__dict__)
    finally:
        await scraper.close()


@app.task(name="src.tasks.scrape_tasks.scrape_ohada")
def scrape_ohada():
    asyncio.run(_scrape_ohada())


async def _scrape_ohada():
    scraper = OhadaScraper()
    api = ApiClient()

    try:
        documents = await scraper.collect()
        for doc in documents:
            job = await api.create_pipeline_job(
                source_name=scraper.SOURCE_NAME,
                source_url=doc.source_url,
            )
            enrich_text.delay(job["id"], doc.__dict__)
    finally:
        await scraper.close()


@app.task(name="src.tasks.scrape_tasks.scrape_constitutions")
def scrape_constitutions():
    asyncio.run(_scrape_constitutions())


async def _scrape_constitutions():
    scraper = ConstitutionsScraper()
    api = ApiClient()

    try:
        documents = await scraper.collect()
        for doc in documents:
            job = await api.create_pipeline_job(
                source_name=scraper.SOURCE_NAME,
                source_url=doc.source_url,
            )
            enrich_text.delay(job["id"], doc.__dict__)
    finally:
        await scraper.close()


# Import deferred to avoid circular imports
from src.tasks.extract_tasks import extract_pdf
from src.tasks.enrich_tasks import enrich_text
```

- [ ] **Step 2: Create extract tasks**

Create `pipeline/src/tasks/extract_tasks.py`:

```python
import asyncio
import tempfile
import boto3
from src.celery_app import app
from src.config import Config
from src.extraction.ocr import OcrPipeline


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=Config.S3_ENDPOINT,
        aws_access_key_id=Config.S3_ACCESS_KEY,
        aws_secret_access_key=Config.S3_SECRET_KEY,
    )


@app.task(name="src.tasks.extract_tasks.extract_pdf")
def extract_pdf(job_id: str, s3_key: str, doc_data: dict):
    asyncio.run(_extract_pdf(job_id, s3_key, doc_data))


async def _extract_pdf(job_id: str, s3_key: str, doc_data: dict):
    s3 = get_s3_client()
    ocr = OcrPipeline()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as tmp:
        s3.download_fileobj(Config.S3_BUCKET, s3_key, tmp)
        tmp.flush()

        result = await ocr.process(tmp.name)

        doc_data["content_text"] = result["text"]
        doc_data["ocr_method"] = result["method"]
        doc_data["ocr_quality"] = result["quality"]

        from src.tasks.enrich_tasks import enrich_text
        enrich_text.delay(job_id, doc_data)
```

- [ ] **Step 3: Create enrich tasks**

Create `pipeline/src/tasks/enrich_tasks.py`:

```python
import asyncio
from src.celery_app import app
from src.api_client import ApiClient
from src.enrichment.theme_classifier import ThemeClassifier
from src.enrichment.metadata_extractor import MetadataExtractor


@app.task(name="src.tasks.enrich_tasks.enrich_text")
def enrich_text(job_id: str, doc_data: dict):
    asyncio.run(_enrich_text(job_id, doc_data))


async def _enrich_text(job_id: str, doc_data: dict):
    api = ApiClient()
    classifier = ThemeClassifier()
    extractor = MetadataExtractor()

    title = doc_data.get("title", "")
    text = doc_data.get("content_text") or doc_data.get("summary", "")

    # Classify themes (use existing if from scraper, else use Claude)
    theme_slugs = doc_data.get("themes", [])
    if not theme_slugs and text:
        theme_slugs = await classifier.classify(title, text)

    # Extract metadata if not already present
    metadata = doc_data.get("metadata", {})
    if not metadata.get("text_type") and text:
        extracted = await extractor.extract(title, text)
        metadata.update(extracted)

    # Resolve country and theme IDs
    country = await api.get_country_by_code(doc_data["country_code"])
    theme_ids = []
    for slug in theme_slugs:
        try:
            theme = await api.get_theme_by_slug(slug)
            theme_ids.append(theme["id"])
        except Exception:
            continue

    # Create the legal text
    text_type = metadata.get("text_type", "loi")
    hierarchy_map = {
        "constitution": 1, "loi_organique": 2, "loi": 3,
        "ordonnance": 4, "decret": 5, "arrete": 6,
        "traite": 2, "acte_uniforme": 2,
    }

    legal_text_data = {
        "title": title,
        "reference": metadata.get("reference", doc_data.get("reference")),
        "textType": text_type,
        "hierarchyRank": hierarchy_map.get(text_type, 5),
        "contentText": text,
        "summary": metadata.get("summary", doc_data.get("summary")),
        "countryId": country["id"],
        "themeIds": theme_ids,
        "promulgationDate": metadata.get("promulgation_date", doc_data.get("date")),
        "sourceUrl": doc_data.get("source_url"),
        "sourceName": doc_data.get("source_name"),
        "pdfS3Key": doc_data.get("pdf_s3_key"),
        "ocrQuality": doc_data.get("ocr_quality"),
        "isInForce": True,
        "status": "pending_review",
    }

    # Remove None values
    legal_text_data = {k: v for k, v in legal_text_data.items() if v is not None}

    await api.create_legal_text(legal_text_data)
```

- [ ] **Step 4: Commit**

```bash
git add pipeline/src/tasks/
git commit -m "feat(pipeline): Celery tasks for scraping, extraction, and enrichment"
```

---

## Task 15: Nuxt.js Frontend Skeleton

**Files:**
- Create: `frontend/Dockerfile`
- Create: `frontend/package.json`
- Create: `frontend/nuxt.config.ts`
- Create: `frontend/app.vue`
- Create: `frontend/pages/index.vue`

- [ ] **Step 1: Scaffold Nuxt project**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj
npx nuxi@latest init frontend --no-install
cd frontend
npm install
```

- [ ] **Step 2: Update nuxt.config.ts**

Replace `frontend/nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:4000',
    },
  },

  app: {
    head: {
      title: 'Juristique.bj — Droit africain francophone',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Plateforme de textes juridiques des 26 pays africains francophones. Recherche, commentaires et analyses par des juristes professionnels.',
        },
      ],
      htmlAttrs: { lang: 'fr' },
    },
  },

  compatibilityDate: '2025-01-01',
});
```

- [ ] **Step 3: Create app.vue**

Replace `frontend/app.vue`:

```vue
<template>
  <div>
    <NuxtPage />
  </div>
</template>
```

- [ ] **Step 4: Create landing page**

Create `frontend/pages/index.vue`:

```vue
<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <h1 class="text-4xl font-bold mb-4">Juristique.bj</h1>
    <p class="text-xl text-gray-600 mb-8">
      Droit africain francophone — 26 pays · 42 thèmes
    </p>
    <div class="w-full max-w-2xl">
      <input
        type="text"
        placeholder="Rechercher un texte juridique..."
        class="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
      />
    </div>
    <p class="mt-8 text-gray-400">
      Phase 1 — Fondation en cours
    </p>
  </div>
</template>
```

- [ ] **Step 5: Create Dockerfile**

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

- [ ] **Step 6: Verify frontend starts**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj/frontend
npm run dev
```

Expected: Nuxt.js dev server starts on http://localhost:3000, showing the landing page.

- [ ] **Step 7: Commit**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj
git add frontend/
git commit -m "feat(frontend): Nuxt.js 3 skeleton with SSR and landing page"
```

---

## Task 16: Final Integration Test

**Files:** No new files.

- [ ] **Step 1: Start all services**

```bash
cd /Users/jean-baptistegandonou/Documents/perso/juristique.bj
cp .env.example .env
docker compose up -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Expected: All services running (postgres, redis, typesense, minio, backend, frontend, pipeline).

- [ ] **Step 2: Run seed**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run seed
```

Expected: 26 countries + 42 themes created.

- [ ] **Step 3: Verify API endpoints**

```bash
curl -s http://localhost:4000/countries?limit=5 | python3 -m json.tool
curl -s http://localhost:4000/themes?limit=5 | python3 -m json.tool
curl -s http://localhost:4000/legal-texts | python3 -m json.tool
curl -s http://localhost:4000/api/docs-json | python3 -c "import sys,json; print(json.load(sys.stdin)['info']['title'])"
```

Expected: Countries, themes, empty legal texts returned. Swagger title "Juristique.bj API".

- [ ] **Step 4: Verify frontend**

Open http://localhost:3000 in browser.
Expected: Landing page with "Juristique.bj" title and search bar.

- [ ] **Step 5: Run all backend tests**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:e2e
```

Expected: All e2e tests pass.

- [ ] **Step 6: Run all pipeline tests**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec pipeline python -m pytest tests/ -v
```

Expected: All pipeline tests pass.

- [ ] **Step 7: Stop services and commit**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
git add -A
git commit -m "feat: Phase 1 complete — backend API, pipeline, frontend skeleton, all tests passing"
```
