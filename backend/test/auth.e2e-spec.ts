import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

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

  const testUser = {
    email: `test-${Date.now()}@juristique.bj`,
    password: 'TestPassword123!',
    fullName: 'Test User',
    profession: 'Avocat',
  };

  it('POST /auth/register should create a user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
        expect(res.body.user.fullName).toBe(testUser.fullName);
        accessToken = res.body.accessToken;
      });
  });

  it('POST /auth/register should reject duplicate email', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('POST /auth/login should return tokens', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.user.email).toBe(testUser.email);
      });
  });

  it('POST /auth/login should reject wrong password', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword!' })
      .expect(401);
  });

  it('GET /auth/profile should return user when authenticated', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.email).toBe(testUser.email);
        expect(res.body.passwordHash).toBeUndefined();
      });
  });

  it('GET /auth/profile should reject without token', () => {
    return request(app.getHttpServer())
      .get('/auth/profile')
      .expect(401);
  });

  it('POST /auth/forgot-password should accept valid email', () => {
    return request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: testUser.email })
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toContain('sent');
      });
  });
});
