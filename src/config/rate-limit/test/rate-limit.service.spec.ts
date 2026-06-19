import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';

import { AppException } from '@/common/errors/app.exception';
import { ERROR_CODE } from '@/common/errors/code/error.code';
import { RateLimitResult } from '@/config/rate-limit/dto/rate-limit.dto';
import { RateLimitService } from '@/config/rate-limit/rate-limit.service';
import { REDIS_CLIENT } from '@/config/redis/constant/redis.constant';

const mockLimit = jest.fn<(identifier: string) => Promise<RateLimitResult>>();

jest.mock('@upstash/ratelimit', () => {
  return {
    Ratelimit: Object.assign(
      jest.fn().mockImplementation(() => ({
        limit: mockLimit,
      })),
      {
        slidingWindow: jest.fn().mockReturnValue({}),
        fixedWindow: jest.fn().mockReturnValue({}),
        tokenBucket: jest.fn().mockReturnValue({}),
      }
    ),
  };
});

describe('RateLimitService', () => {
  let service: RateLimitService;

  const loggerMock = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitService,
        {
          provide: REDIS_CLIENT,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(RateLimitService.name),
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get(RateLimitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('limit', () => {
    it('should return Ok with mapped rate limit result on success', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 30,
        remaining: 29,
        reset: 123456,
      });

      const result = await service.limit('clerkWebhook', 'user-1');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        success: true,
        limit: 30,
        remaining: 29,
        reset: 123456,
      });

      expect(mockLimit).toHaveBeenCalledWith('user-1');
    });

    it('should return Ok with success: false when rate limit is exceeded', async () => {
      mockLimit.mockResolvedValue({
        success: false,
        limit: 30,
        remaining: 0,
        reset: 999999,
      });

      const result = await service.limit('clerkWebhook', 'user-2');

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().success).toBe(false);
    });

    it('should throw AppException RATE_LIMIT_INVALID_IDENTIFIER_CONTENT when identifier contains only spaces', async () => {
      const rejectPromise = service.limit('clerkWebhook', '   ');

      await expect(rejectPromise).rejects.toThrow(AppException);
      await expect(rejectPromise).rejects.toHaveProperty(
        'code',
        ERROR_CODE.RATE_LIMIT_INVALID_IDENTIFIER_CONTENT
      );
    });

    it('should throw AppException RATE_LIMIT_INVALID_CONTEXT when context does not exist', async () => {
      type LimitContext = Parameters<typeof service.limit>[0];

      const rejectPromise = service.limit('invalid-context' as unknown as LimitContext, 'user-1');

      await expect(rejectPromise).rejects.toThrow(AppException);
      await expect(rejectPromise).rejects.toHaveProperty(
        'code',
        ERROR_CODE.RATE_LIMIT_INVALID_CONTEXT
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        { context: 'invalid-context' },
        'Rate limit context not found — misconfiguration'
      );
    });

    it('should return Err with RATE_LIMIT_EXECUTION_FAILED when Upstash fails', async () => {
      const upstashError = new Error('Upstash unavailable');

      mockLimit.mockRejectedValueOnce(upstashError);

      const result = await service.limit('clerkWebhook', 'user-1');

      expect(result.isErr()).toBe(true);

      const error = result._unsafeUnwrapErr();

      expect(error).toBeInstanceOf(AppException);
      expect(error.code).toBe(ERROR_CODE.RATE_LIMIT_EXECUTION_FAILED);

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({ context: 'clerkWebhook', identifier: 'user-1' }),
        'Rate limit execution failed'
      );
    });
  });
});
