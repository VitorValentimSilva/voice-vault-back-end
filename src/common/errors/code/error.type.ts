import { ERROR_CODE } from '@/common/errors/code/error.code';

export type ErrorSeverity = 'expected' | 'unexpected';

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];
