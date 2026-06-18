import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';
import { getLoggerToken } from 'nestjs-pino';

import { PrismaService } from '@/config/prisma/prisma.service';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('PrismaService (Integration)', () => {
  let prismaService: PrismaService;

  const loggerMock: {
    info: jest.Mock;
    error: jest.Mock;
  } = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: getLoggerToken(PrismaService.name),
          useValue: loggerMock,
        },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (prismaService) {
      await prismaService.onModuleDestroy();
    }
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
    expect(prismaService.user).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should successfully connect to the database', async () => {
      await expect(prismaService.onModuleInit()).resolves.not.toThrow();

      expect(loggerMock.info).toHaveBeenCalledWith('Connecting to the Neon database...');
      expect(loggerMock.info).toHaveBeenCalledWith(
        'Connection to the database established successfully.'
      );
    });

    it('should catch error and report to Sentry if connection fails', async () => {
      const moduleFail: TestingModule = await Test.createTestingModule({
        providers: [
          PrismaService,
          {
            provide: getLoggerToken(PrismaService.name),
            useValue: loggerMock,
          },
        ],
      }).compile();

      const failingPrismaService = moduleFail.get<PrismaService>(PrismaService);
      const dbError = new Error('Neon Connection Timeout');

      jest.spyOn(failingPrismaService['_prisma'], '$connect').mockRejectedValueOnce(dbError);

      await failingPrismaService.onModuleInit();

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: dbError }),
        'Failed to connect to the database'
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
    });
  });
});
