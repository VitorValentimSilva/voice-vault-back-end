import { ErrorSeverity } from '@/common/errors/code/error.type';

export const COMMON_ERROR_CODE = {
  COMMON_ZOD_ERROR: 'COMMON_ZOD_ERROR',
  COMMON_HTTP_NOT_FOUND: 'COMMON_HTTP_NOT_FOUND',
  COMMON_HTTP_INTERNAL_ERROR: 'COMMON_HTTP_INTERNAL_ERROR',
  COMMON_HTTP_INVALID_INPUT: 'COMMON_HTTP_INVALID_INPUT',
  COMMON_INTERNAL_ERROR: 'COMMON_INTERNAL_ERROR',
} as const;

export const COMMON_ERROR_METADATA: Record<
  keyof typeof COMMON_ERROR_CODE,
  { status: number; severity: ErrorSeverity }
> = {
  COMMON_ZOD_ERROR: { status: 422, severity: 'expected' },
  COMMON_HTTP_NOT_FOUND: { status: 404, severity: 'expected' },
  COMMON_HTTP_INTERNAL_ERROR: { status: 500, severity: 'unexpected' },
  COMMON_HTTP_INVALID_INPUT: { status: 400, severity: 'expected' },
  COMMON_INTERNAL_ERROR: { status: 500, severity: 'unexpected' },
};
