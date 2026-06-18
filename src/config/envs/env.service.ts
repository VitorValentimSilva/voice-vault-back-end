import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '@/config/envs/dto/env.dto';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv() {
    return this.configService.get('NODE_ENV', {
      infer: true,
    });
  }

  get isDevelopment() {
    return this.nodeEnv === 'development';
  }

  get isTest() {
    return this.nodeEnv === 'test';
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get port() {
    return this.configService.get('PORT', {
      infer: true,
    });
  }

  get databaseUrl() {
    return this.configService.get('DATABASE_URL', {
      infer: true,
    });
  }

  get sentryDsn() {
    return this.configService.get('SENTRY_DSN', {
      infer: true,
    });
  }

  get posthogKey() {
    return this.configService.get('POSTHOG_KEY', {
      infer: true,
    });
  }

  get posthogHost() {
    return this.configService.get('POSTHOG_HOST', {
      infer: true,
    });
  }

  get upstashRedisUrl() {
    return this.configService.get('UPSTASH_REDIS_REST_URL', {
      infer: true,
    });
  }

  get upstashRedisToken() {
    return this.configService.get('UPSTASH_REDIS_REST_TOKEN', {
      infer: true,
    });
  }

  get qstashUrl() {
    return this.configService.get('QSTASH_URL', {
      infer: true,
    });
  }

  get qstashToken() {
    return this.configService.get('QSTASH_TOKEN', {
      infer: true,
    });
  }

  get qstashCurrentSigningKey() {
    return this.configService.get('QSTASH_CURRENT_SIGNING_KEY', {
      infer: true,
    });
  }

  get qstashNextSigningKey() {
    return this.configService.get('QSTASH_NEXT_SIGNING_KEY', {
      infer: true,
    });
  }

  get clerkWebhookSecret(): string {
    return this.configService.getOrThrow<string>('CLERK_WEBHOOK_SECRET');
  }
}
