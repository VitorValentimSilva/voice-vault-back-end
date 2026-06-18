import { Global, Module } from '@nestjs/common';
import { Redis } from '@upstash/redis';

import { EnvService } from '@/config/envs/env.service';
import { REDIS_CLIENT } from '@/config/redis/constant/redis.constant';
import { RedisService } from '@/config/redis/redis.service';

@Global()
@Module({
  providers: [
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
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
