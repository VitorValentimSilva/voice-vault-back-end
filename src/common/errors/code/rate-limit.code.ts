import { ErrorSeverity } from '@/common/errors/code/error.type';

export const RATE_LIMIT_ERROR_CODE = {
  RATE_LIMIT_INVALID_IDENTIFIER_CONTENT: 'RATE_LIMIT_INVALID_IDENTIFIER_CONTENT',
  RATE_LIMIT_INVALID_CONTEXT: 'RATE_LIMIT_INVALID_CONTEXT',
  RATE_LIMIT_EXECUTION_FAILED: 'RATE_LIMIT_EXECUTION_FAILED',
} as const;

export const RATE_LIMIT_ERROR_METADATA: Record<
  keyof typeof RATE_LIMIT_ERROR_CODE,
  { status: number; severity: ErrorSeverity }
> = {
  RATE_LIMIT_INVALID_IDENTIFIER_CONTENT: { status: 400, severity: 'expected' },
  RATE_LIMIT_INVALID_CONTEXT: { status: 500, severity: 'unexpected' },
  RATE_LIMIT_EXECUTION_FAILED: { status: 503, severity: 'unexpected' },
};
