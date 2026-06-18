import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from '@upstash/redis';
import { getLoggerToken } from 'nestjs-pino';

import { REDIS_CLIENT } from '@/config/redis/constant/redis.constant';
import { RedisService } from '@/config/redis/redis.service';

describe('RedisService', () => {
  let service: RedisService;

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ping: jest.fn(),
  } as unknown as jest.Mocked<Redis>;

  const loggerMock = {
    warn: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          useValue: redisMock,
        },
        {
          provide: getLoggerToken(RedisService.name),
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get(RedisService);
  });

  describe('get', () => {
    it('should return value from redis', async () => {
      redisMock.get.mockResolvedValue({ id: 1 });

      const result = await service.get<{ id: number }>('user:1');

      expect(result).toEqual({ id: 1 });

      expect(redisMock.get).toHaveBeenCalledWith('user:1');
    });
  });

  describe('set', () => {
    it('should set value without ttl', async () => {
      await service.set('key', 'value');

      expect(redisMock.set).toHaveBeenCalledWith('key', 'value');
    });

    it('should set value with ttl', async () => {
      await service.set('key', 'value', 60);

      expect(redisMock.set).toHaveBeenCalledWith('key', 'value', { ex: 60 });
    });

    it('should throw when ttl is invalid', async () => {
      await expect(service.set('key', 'value', 0)).rejects.toThrow(
        'ttlSeconds must be greater than zero'
      );
    });
  });

  describe('del', () => {
    it('should delete keys', async () => {
      await service.del('a', 'b');

      expect(redisMock.del).toHaveBeenCalledWith('a', 'b');
    });
  });

  describe('exists', () => {
    it('should return exists count', async () => {
      redisMock.exists.mockResolvedValue(2);

      const result = await service.exists('a', 'b');

      expect(result).toBe(2);
    });
  });

  describe('ttl', () => {
    it('should return ttl', async () => {
      redisMock.ttl.mockResolvedValue(120);

      const result = await service.ttl('key');

      expect(result).toBe(120);
    });
  });

  describe('incr', () => {
    it('should increment key', async () => {
      redisMock.incr.mockResolvedValue(5);

      const result = await service.incr('counter');

      expect(result).toBe(5);
    });
  });

  describe('expire', () => {
    it('should expire key', async () => {
      redisMock.expire.mockResolvedValue(1);

      const result = await service.expire('key', 60);

      expect(result).toBe(1);
    });

    it('should throw when seconds is invalid', async () => {
      await expect(service.expire('key', 0)).rejects.toThrow('seconds must be greater than zero');
    });
  });

  describe('ping', () => {
    it('should return true when redis responds PONG', async () => {
      redisMock.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(result).toBe(true);
    });

    it('should return false and log warning when ping fails', async () => {
      const error = new Error('Redis Down');

      redisMock.ping.mockRejectedValue(error);

      const result = await service.ping();

      expect(result).toBe(false);

      expect(loggerMock.warn).toHaveBeenCalledWith({ error }, 'Redis health check failed');
    });
  });
});
