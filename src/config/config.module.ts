import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';

import { EnvModule } from '@/config/env/env.module';
import { envValidationSchema } from '@/config/env/env.validation';
import { PrismaModule } from '@/config/prisma/prisma.module';
import { ClerkWebhookModule } from '@/modules/webhooks/clerk-webhook/clerk-webhook.module';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationSchema: envValidationSchema,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProd ? 'info' : 'debug',
        transport: isProd
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.newPassword',
            'req.body.currentPassword',
            'req.body.token',
          ],
          remove: true,
        },
      },
    }),
    SentryModule.forRoot(),
    EnvModule,
    PrismaModule,
    ClerkWebhookModule,
  ],
})
export class AppConfigModule {}
