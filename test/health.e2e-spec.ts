import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Health Endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return basic health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('service', 'a-nest-template');
        });
    });
  });

  describe('/health/db (GET)', () => {
    it('should return not_configured when DATABASE_URL is not set', () => {
      // Clear DATABASE_URL for this test
      delete process.env.DATABASE_URL;

      return request(app.getHttpServer())
        .get('/health/db')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual({
            status: 'not_configured',
            message: 'DATABASE_URL environment variable is not set',
            timestamp: expect.any(String),
          });
        });
    });

    it('should return healthy status when database connection succeeds', async () => {
      const databaseUrl = process.env.DATABASE_URL;

      if (!databaseUrl) {
        console.warn('Skipping database health check test: DATABASE_URL not set');
        return;
      }

      return request(app.getHttpServer())
        .get('/health/db')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('message', 'Database connection successful');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('database');
          expect(res.body.database).toHaveProperty('connected', true);
        });
    });
  });
});
