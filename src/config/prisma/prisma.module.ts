import { Module } from '@nestjs/common';

import { PrismaService } from '@/config/prisma/prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
