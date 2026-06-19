import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import { getLoggerToken } from 'nestjs-pino';

import { EnvService } from '@/config/envs/env.service';
import { PrismaService } from '@/config/prisma/prisma.service';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('PrismaService (Integration)', () => {
  let service: PrismaService;

  const loggerMock = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const envServiceMock = {
    databaseUrl: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/test',
    isDevelopment: false,
  } as EnvService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: getLoggerToken(PrismaService.name),
          useValue: loggerMock,
        },
        {
          provide: EnvService,
          useValue: envServiceMock,
        },
      ],
    }).compile();

    service = module.get(PrismaService);
  });

  afterAll(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.user).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect successfully and log without attempt number', async () => {
      await service.onModuleInit();

      expect(loggerMock.info).toHaveBeenCalledWith('Connecting to the Neon database...');

      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connection to the database established successfully.'
      );

      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should retry 4 times (onRetry hook), log warn per retry, then error and report to Sentry', async () => {
      jest.useFakeTimers();

      const loggerMockFail = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      try {
        const moduleFail = await Test.createTestingModule({
          providers: [
            PrismaService,
            {
              provide: getLoggerToken(PrismaService.name),
              useValue: loggerMockFail,
            },
            {
              provide: EnvService,
              useValue: envServiceMock,
            },
          ],
        }).compile();

        const failingService = moduleFail.get<PrismaService>(PrismaService);

        const dbError = new Error('Neon Connection Timeout');

        const connectSpy = jest
          .spyOn(failingService.prismaClient, '$connect')
          .mockRejectedValue(dbError);

        const promiseExpectation = expect(failingService.onModuleInit()).rejects.toThrow(
          'Neon Connection Timeout'
        );

        await jest.runAllTimersAsync();

        await Promise.resolve();
        await Promise.resolve();

        await promiseExpectation;

        expect(connectSpy).toHaveBeenCalledTimes(5);
        expect(loggerMockFail.warn).toHaveBeenCalledTimes(4);
      } finally {
        jest.useRealTimers();
      }
    }, 30000);

    it('should not retry on permanent Postgres errors (bail)', async () => {
      const loggerMockBail = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };

      const moduleBail: TestingModule = await Test.createTestingModule({
        providers: [
          PrismaService,
          {
            provide: getLoggerToken(PrismaService.name),
            useValue: loggerMockBail,
          },
          {
            provide: EnvService,
            useValue: envServiceMock,
          },
        ],
      }).compile();

      const bailService = moduleBail.get(PrismaService);

      const permanentError = Object.assign(new Error('password authentication failed for user'), {
        code: '28P01',
      });

      const connectSpy = jest
        .spyOn(bailService.prismaClient, '$connect')
        .mockRejectedValue(permanentError);

      await expect(bailService.onModuleInit()).rejects.toThrow(
        'password authentication failed for user'
      );

      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(loggerMockBail.warn).not.toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(
        permanentError,
        expect.objectContaining({
          tags: { context: 'PrismaService', lifecycle: 'onModuleInit' },
        })
      );
    });

    describe('onModuleDestroy', () => {
      it('should disconnect from database and log', async () => {
        const disconnectSpy = jest.spyOn(service.prismaClient, '$disconnect');

        await service.onModuleDestroy();

        expect(disconnectSpy).toHaveBeenCalledTimes(1);
        expect(loggerMock.info).toHaveBeenCalledWith('Disconnecting from the database...');
      });
    });
  });
});
