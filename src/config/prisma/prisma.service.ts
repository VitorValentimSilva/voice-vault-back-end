import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _prisma: PrismaClient;

  readonly user: PrismaClient['user'];

  constructor() {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    this._prisma = new PrismaClient({ adapter });

    this.user = this._prisma.user;
  }

  async onModuleInit() {
    await this._prisma.$connect();
  }

  async onModuleDestroy() {
    await this._prisma.$disconnect();
  }
}
