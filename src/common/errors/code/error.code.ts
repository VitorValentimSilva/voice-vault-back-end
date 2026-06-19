import { ErrorCode, ErrorSeverity } from '@/common/errors/code/error.type';
import {
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_ERROR_METADATA,
} from '@/common/errors/code/rate-limit.code';
import { REDIS_ERROR_CODE, REDIS_ERROR_METADATA } from '@/common/errors/code/redis.code';

export const ERROR_CODE = {
  ...REDIS_ERROR_CODE,
  ...RATE_LIMIT_ERROR_CODE,
} as const;

export const ERROR_METADATA: Record<ErrorCode, { status: number; severity: ErrorSeverity }> = {
  ...REDIS_ERROR_METADATA,
  ...RATE_LIMIT_ERROR_METADATA,
};
