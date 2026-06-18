import { Global, Module } from '@nestjs/common';

import { RateLimitService } from '@/config/rate-limit/rate-limit.service';

@Global()
@Module({
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
