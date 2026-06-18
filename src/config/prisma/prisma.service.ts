import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { EnvService } from '@/config/envs/env.service';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _prisma: PrismaClient;

  readonly user: PrismaClient['user'];

  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,

    private readonly envService: EnvService
  ) {
    const adapter = new PrismaNeon({
      connectionString: this.envService.databaseUrl,
    });

    this._prisma = new PrismaClient({
      adapter,
      log: this.envService.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });

    this.user = this._prisma.user;
  }

  async onModuleInit(): Promise<void> {
    this.logger.info('Connecting to the Neon database...');

    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this._prisma.$connect();

        this.logger.info({ attempt }, 'Connection to the database established successfully.');

        return;
      } catch (error) {
        this.logger.warn({ attempt, error }, 'Database connection attempt failed.');

        if (attempt === maxAttempts) {
          this.logger.error(
            { error },
            'Failed to connect to the database after all retry attempts.'
          );

          Sentry.captureException(error, {
            tags: {
              context: 'PrismaService',
              lifecycle: 'onModuleInit',
            },
          });

          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.info('Disconnecting from the database...');

    await this._prisma.$disconnect();
  }
}
