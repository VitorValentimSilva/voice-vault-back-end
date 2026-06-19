import { ErrorSeverity } from '@/common/errors/code/error.type';

export const REDIS_ERROR_CODE = {
  REDIS_INVALID_TTL_DURATION: 'REDIS_INVALID_TTL_DURATION',
  REDIS_INVALID_SECONDS_DURATION: 'REDIS_INVALID_SECONDS_DURATION',
} as const;

export const REDIS_ERROR_METADATA: Record<
  keyof typeof REDIS_ERROR_CODE,
  { status: number; severity: ErrorSeverity }
> = {
  REDIS_INVALID_TTL_DURATION: { status: 400, severity: 'expected' },
  REDIS_INVALID_SECONDS_DURATION: { status: 400, severity: 'expected' },
};
