import { Inject, Injectable } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { REDIS_CLIENT } from '@/config/redis/constant/redis.constant';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    readonly client: Redis,

    @InjectPinoLogger(RedisService.name)
    private readonly logger: PinoLogger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    return this.client.get<T>(key);
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined && ttlSeconds <= 0) {
      throw new Error('ttlSeconds must be greater than zero');
    }

    if (ttlSeconds !== undefined) {
      await this.client.set(key, value, { ex: ttlSeconds });

      return;
    }

    await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<void> {
    await this.client.del(...keys);
  }

  async exists(...keys: string[]): Promise<number> {
    return this.client.exists(...keys);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (seconds <= 0) {
      throw new Error('seconds must be greater than zero');
    }

    return this.client.expire(key, seconds);
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === 'PONG';
    } catch (error) {
      this.logger.warn({ error }, 'Redis health check failed');

      return false;
    }
  }
}
