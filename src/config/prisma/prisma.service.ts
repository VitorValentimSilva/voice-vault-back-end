import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import retry from 'async-retry';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { EnvService } from '@/config/envs/env.service';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  protected readonly prisma: PrismaClient;

  readonly user: PrismaClient['user'];

  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,

    private readonly envService: EnvService
  ) {
    const adapter = new PrismaNeon({
      connectionString: this.envService.databaseUrl,
    });

    this.prisma = new PrismaClient({
      adapter,
      log: this.envService.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });

    this.user = this.prisma.user;
  }

  get prismaClient(): PrismaClient {
    return this.prisma;
  }

  async onModuleInit(): Promise<void> {
    this.logger.info('Connecting to the Neon database...');

    try {
      await retry(
        async (bail) => {
          try {
            await this.prisma.$connect();
          } catch (error) {
            const pgCode = (error as { code?: string }).code;
            const permanentCodes = ['28P01', '3D000', '28000', '42501'];

            if (pgCode && permanentCodes.includes(pgCode)) {
              bail(error instanceof Error ? error : new Error(String(error)));

              return;
            }

            throw error;
          }
        },
        {
          retries: 4,
          factor: 2,
          minTimeout: 1_000,
          maxTimeout: 10_000,
          onRetry: (error, attempt) => {
            this.logger.warn(
              { attempt, error: (error as Error).message },
              'Database connection attempt failed. Retrying...'
            );
          },
        }
      );

      this.logger.info('Connection to the database established successfully.');
    } catch (error) {
      this.logger.error({ error }, 'Failed to connect to the database after all retry attempts.');

      Sentry.captureException(error, {
        tags: {
          context: 'PrismaService',
          lifecycle: 'onModuleInit',
        },
      });

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.info('Disconnecting from the database...');

    await this.prisma.$disconnect();
  }
}
