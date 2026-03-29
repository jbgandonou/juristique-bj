import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let textId: string;
  let commentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Register a user
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `comment-test-${Date.now()}@juristique.bj`,
        password: 'TestPassword123!',
        fullName: 'Comment Tester',
      });
    accessToken = userRes.body.accessToken;

    // Create a country and text
    const countryRes = await request(app.getHttpServer())
      .post('/countries')
      .send({ name: 'Comment Test Country', code: 'YY' });

    const textRes = await request(app.getHttpServer())
      .post('/legal-texts')
      .send({
        title: 'Texte pour test commentaires',
        textType: 'loi',
        countryId: countryRes.body.id,
        status: 'published',
      });
    textId = textRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /comments should create a comment (authenticated)', () => {
    return request(app.getHttpServer())
      .post('/comments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        textId,
        content: 'Excellent texte, très bien structuré.',
        type: 'comment',
        articleRef: 'Art. 1',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.content).toContain('Excellent');
        expect(res.body.articleRef).toBe('Art. 1');
        commentId = res.body.id;
      });
  });

  it('POST /comments should reject without auth', () => {
    return request(app.getHttpServer())
      .post('/comments')
      .send({ textId, content: 'No auth comment' })
      .expect(401);
  });

  it('GET /comments/by-text/:textId should return comments', () => {
    return request(app.getHttpServer())
      .get(`/comments/by-text/${textId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });

  it('PATCH /comments/:id/upvote should increment upvotes', () => {
    return request(app.getHttpServer())
      .patch(`/comments/${commentId}/upvote`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.upvotes).toBe(1);
      });
  });

  it('GET /comments/my should return my comments', () => {
    return request(app.getHttpServer())
      .get('/comments/my')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.length).toBeGreaterThan(0);
      });
  });

  it('DELETE /comments/:id should delete my comment', () => {
    return request(app.getHttpServer())
      .delete(`/comments/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
