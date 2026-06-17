import { afterAll, beforeAll, describe, it } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';

import { AppModule } from '@/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    httpServer = app.getHttpServer() as Server;
  });

  it('/ (GET)', async () => {
    await request(httpServer).get('/').expect(200).expect('Hello World!');
  });

  afterAll(async () => {
    await app.close();
  });
});
