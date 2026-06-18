import { RATE_LIMIT_CONFIGS } from '@/config/rate-limit/constant/rate-limit.constant';

export type RateLimitContext = keyof typeof RATE_LIMIT_CONFIGS;
