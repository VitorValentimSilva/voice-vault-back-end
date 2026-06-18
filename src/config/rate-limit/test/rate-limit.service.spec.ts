import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';

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
    it('should return mapped rate limit result', async () => {
      mockLimit.mockResolvedValue({
        success: true,
        limit: 30,
        remaining: 29,
        reset: 123456,
      });

      const result = await service.limit('clerkWebhook', 'user-1');

      expect(result).toEqual({
        success: true,
        limit: 30,
        remaining: 29,
        reset: 123456,
      });

      expect(mockLimit).toHaveBeenCalledWith('user-1');
    });

    it('should throw when identifier is empty', async () => {
      await expect(service.limit('clerkWebhook', '')).rejects.toThrow(
        'identifier must not be empty'
      );
    });

    it('should throw when identifier contains only spaces', async () => {
      await expect(service.limit('clerkWebhook', '   ')).rejects.toThrow(
        'identifier must not be empty'
      );
    });

    it('should throw when context does not exist', async () => {
      await expect(service.limit('invalid-context' as never, 'user-1')).rejects.toThrow(
        'Rate limit context not found: invalid-context'
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        { context: 'invalid-context' },
        'Rate limit context not found'
      );
    });

    it('should propagate errors from Upstash', async () => {
      const error = new Error('Upstash unavailable');

      mockLimit.mockRejectedValueOnce(error);

      await expect(service.limit('clerkWebhook', 'user-1')).rejects.toThrow('Upstash unavailable');
    });
  });
});
