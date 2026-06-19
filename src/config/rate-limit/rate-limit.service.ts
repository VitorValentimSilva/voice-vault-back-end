import { Inject, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { err, ok, Result } from 'neverthrow';

import { AppException } from '@/common/errors/app.exception';
import { ERROR_CODE } from '@/common/errors/code/error.code';
import { RATE_LIMIT_CONFIGS } from '@/config/rate-limit/constant/rate-limit.constant';
import { RateLimitContext, RateLimitResult } from '@/config/rate-limit/dto/rate-limit.dto';
import { REDIS_CLIENT } from '@/config/redis/constant/redis.constant';

@Injectable()
export class RateLimitService {
  private readonly limiters = new Map<RateLimitContext, Ratelimit>();

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,

    @InjectPinoLogger(RateLimitService.name)
    private readonly logger: PinoLogger
  ) {
    for (const [context, config] of Object.entries(RATE_LIMIT_CONFIGS) as [
      RateLimitContext,
      (typeof RATE_LIMIT_CONFIGS)[RateLimitContext],
    ][]) {
      this.limiters.set(
        context,
        new Ratelimit({
          redis: this.redis,
          limiter: config.limiter,
          analytics: config.analytics,
          prefix: config.prefix,
        })
      );

      this.logger.debug({ context }, 'Rate limit context initialized');
    }
  }

  async limit(
    context: RateLimitContext,
    identifier: string
  ): Promise<Result<RateLimitResult, AppException>> {
    if (!identifier.trim()) {
      throw new AppException(ERROR_CODE.RATE_LIMIT_INVALID_IDENTIFIER_CONTENT, {
        context: { field: 'identifier', reason: 'must not be empty' },
      });
    }

    const limiter = this.limiters.get(context);

    if (!limiter) {
      this.logger.error({ context }, 'Rate limit context not found — misconfiguration');

      throw new AppException(ERROR_CODE.RATE_LIMIT_INVALID_CONTEXT, {
        context: { rateLimitContext: context, reason: 'limiter not found' },
      });
    }

    try {
      const result = await limiter.limit(identifier);

      return ok({
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      });
    } catch (error) {
      this.logger.error({ context, identifier, error }, 'Rate limit execution failed');

      Sentry.captureException(error, {
        tags: {
          context: 'RateLimitService',
          rateLimitContext: context,
        },
      });

      return err(
        new AppException(ERROR_CODE.RATE_LIMIT_EXECUTION_FAILED, {
          cause: error instanceof Error ? error : new Error(String(error)),
          context: { rateLimitContext: context, identifier },
        })
      );
    }
  }
}
