import { RATE_LIMIT_CONFIGS } from '@/config/rate-limit/constant/rate-limit.constant';

export type RateLimitContext = keyof typeof RATE_LIMIT_CONFIGS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}
