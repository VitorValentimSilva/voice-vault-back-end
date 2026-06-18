import { Pool } from '@neondatabase/serverless';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { EnvService } from '@/config/envs/env.service';
import { NeonPoolClient } from '@/config/prisma/dto/prisma.dto';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _prisma: PrismaClient;

  readonly user: PrismaClient['user'];

  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,

    private readonly envService: EnvService
  ) {
    const pool = new Pool({ connectionString: this.envService.databaseUrl });
    const adapter = new PrismaNeon(pool as any as NeonPoolClient);

    this._prisma = new PrismaClient({
      adapter,
      log:
        this.envService.nodeEnv === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });

    this.user = this._prisma.user;
  }

  async onModuleInit() {
    try {
      this.logger.info('Connecting to the Neon database...');

      await this._prisma.$connect();

      this.logger.info('Connection to the database established successfully.');
    } catch (error) {
      this.logger.error({ error }, 'Failed to connect to the database');

      Sentry.captureException(error, {
        tags: {
          context: 'PrismaService',
          lifecycle: 'onModuleInit',
        },
      });
    }
  }

  async onModuleDestroy() {
    this.logger.info('Disconnecting from the database...');

    await this._prisma.$disconnect();
  }
}
