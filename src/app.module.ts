import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AppConfigModule } from '@/config/config.module';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { ClerkWebhookModule } from '@/modules/webhooks/clerk-webhook/clerk-webhook.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRoot(),
    SentryModule.forRoot(),
    PrismaModule,
    ClerkWebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
