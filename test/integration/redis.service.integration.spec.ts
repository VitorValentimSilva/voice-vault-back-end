import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Redis } from '@upstash/redis';
import { getLoggerToken } from 'nestjs-pino';

import { EnvModule } from '@/config/envs/env.module';
import { EnvService } from '@/config/envs/env.service';
import { REDIS_CLIENT } from '@/config/redis/constant/redis.constant';
import { RedisService } from '@/config/redis/redis.service';

describe('RedisService (Integration)', () => {
  let service: RedisService;
  let redisClient: Redis;

  const loggerMock = {
    warn: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EnvModule],
      providers: [
        RedisService,
        {
          provide: REDIS_CLIENT,
          inject: [EnvService],
          useFactory: (env: EnvService): Redis => {
            return new Redis({
              url: env.upstashRedisUrl,
              token: env.upstashRedisToken,
              retry: false,
            });
          },
        },
        {
          provide: getLoggerToken(RedisService.name),
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get(RedisService);
    redisClient = module.get<Redis>(REDIS_CLIENT);
  });

  afterAll(async () => {
    if (redisClient) {
      await redisClient.del('integration:test', 'counter', 'ttl:test');
    }
  });

  it('should set and get a value', async () => {
    await service.set('integration:test', {
      hello: 'world',
    });

    const value = await service.get<{ hello: string }>('integration:test');

    expect(value).toEqual({
      hello: 'world',
    });
  });

  it('should increment a counter', async () => {
    await service.del('counter');

    const value1 = await service.incr('counter');
    const value2 = await service.incr('counter');

    expect(value1).toBe(1);
    expect(value2).toBe(2);
  });

  it('should set ttl', async () => {
    await service.set('ttl:test', 'value');
    await service.expire('ttl:test', 60);

    const ttl = await service.ttl('ttl:test');

    expect(ttl).toBeGreaterThan(0);
  });

  it('should respond to ping', async () => {
    const result = await service.ping();

    expect(result).toBe(true);
  });
});
