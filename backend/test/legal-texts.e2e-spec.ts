import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LegalTextsController (e2e)', () => {
  let app: INestApplication;
  let countryId: string;
  let themeId: string;
  let textId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Create test country
    const countryRes = await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Test Country', code: 'ZZ', region: 'Test' });
    countryId = countryRes.body.id;

    // Create test theme
    const themeRes = await request(app.getHttpServer())
      .post('/themes')
      .send({ name: 'Test Theme', slug: `test-theme-${Date.now()}` });
    themeId = themeRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /legal-texts should create a legal text', () => {
    return request(app.getHttpServer())
      .post('/legal-texts')
      .send({
        title: 'Loi test sur le numérique',
        reference: 'Loi n°2024-TEST',
        textType: 'loi',
        hierarchyRank: 3,
        contentText: 'Article 1. Le présent texte est un test.',
        summary: 'Loi test pour les tests e2e.',
        countryId,
        themeIds: [themeId],
        isInForce: true,
        status: 'published',
        promulgationDate: '2024-01-15',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toContain('numérique');
        expect(res.body.country.code).toBe('ZZ');
        textId = res.body.id;
      });
  });

  it('GET /legal-texts should list texts with pagination', () => {
    return request(app.getHttpServer())
      .get('/legal-texts')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.total).toBeGreaterThan(0);
        expect(res.body.page).toBe(1);
      });
  });

  it('GET /legal-texts?countryCode=ZZ should filter by country', () => {
    return request(app.getHttpServer())
      .get('/legal-texts?countryCode=ZZ')
      .expect(200)
      .expect((res) => {
        res.body.data.forEach((text: any) => {
          expect(text.country.code).toBe('ZZ');
        });
      });
  });

  it('GET /legal-texts/:id should return the text with relations', () => {
    return request(app.getHttpServer())
      .get(`/legal-texts/${textId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.title).toContain('numérique');
        expect(res.body.themes).toBeDefined();
        expect(res.body.country).toBeDefined();
      });
  });

  it('GET /legal-texts/:id/citation should return formatted citation', () => {
    return request(app.getHttpServer())
      .get(`/legal-texts/${textId}/citation`)
      .expect(200)
      .expect((res) => {
        expect(res.body.citation).toContain('Juristique.bj');
      });
  });

  it('GET /legal-texts/compare should compare texts by theme', () => {
    return request(app.getHttpServer())
      .get(`/legal-texts/compare?themeSlug=test-theme-${Date.now()}&countryCodes=ZZ`)
      .expect(200)
      .expect((res) => {
        expect(typeof res.body).toBe('object');
      });
  });
});
