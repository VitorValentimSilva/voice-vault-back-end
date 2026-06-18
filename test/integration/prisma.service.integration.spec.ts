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
    it('should connect successfully on first attempt', async () => {
      await service.onModuleInit();

      expect(loggerMock.info).toHaveBeenCalledWith('Connecting to the Neon database...');

      expect(loggerMock.info).toHaveBeenCalledWith(
        { attempt: 1 },
        'Connection to the database established successfully.'
      );

      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it('should retry 5 times, report to Sentry and rethrow the error', async () => {
      jest.useFakeTimers();

      try {
        const moduleFail: TestingModule = await Test.createTestingModule({
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

        const failingPrismaService = moduleFail.get(PrismaService);

        const dbError = new Error('Neon Connection Timeout');

        const connectSpy = jest
          .spyOn(failingPrismaService.prismaClient, '$connect')
          .mockRejectedValue(dbError);

        const initPromise = expect(failingPrismaService.onModuleInit()).rejects.toThrow(
          'Neon Connection Timeout'
        );

        await jest.runAllTimersAsync();

        await initPromise;

        expect(connectSpy).toHaveBeenCalledTimes(5);

        expect(loggerMock.warn).toHaveBeenCalledTimes(5);

        expect(loggerMock.error).toHaveBeenCalledWith(
          {
            error: dbError,
          },
          'Failed to connect to the database after all retry attempts.'
        );

        expect(Sentry.captureException).toHaveBeenCalledWith(
          dbError,
          expect.objectContaining({
            tags: {
              context: 'PrismaService',
              lifecycle: 'onModuleInit',
            },
          })
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      const disconnectSpy = jest.spyOn(service.prismaClient, '$disconnect');

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);

      expect(loggerMock.info).toHaveBeenCalledWith('Disconnecting from the database...');
    });
  });
});
