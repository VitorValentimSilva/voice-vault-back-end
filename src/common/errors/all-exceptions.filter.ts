import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { ZodError } from 'zod';

import { AppException } from '@/common/errors/app.exception';
import { ERROR_CODE } from '@/common/errors/code/error.code';
import { ErrorCode } from '@/common/errors/code/error.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json({ error: exception.code });

      return;
    }

    if (exception instanceof ZodError) {
      const fields = exception.issues.map((e: ZodError['issues'][number]) => ({
        path: e.path.join('.'),
        message: e.message,
      }));

      this.logger.warn(
        {
          errorCode: ERROR_CODE.COMMON_ZOD_ERROR,
          fields,
          method: request.method,
          path: request.url,
        },
        'The ZodError was not caught by AllExceptionsFilter.'
      );

      response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        error: ERROR_CODE.COMMON_ZOD_ERROR,
        fields,
      });

      return;
    }

    if (exception instanceof HttpException) {
      const statusMap: Partial<Record<number, ErrorCode>> = {
        [HttpStatus.NOT_FOUND]: ERROR_CODE.COMMON_HTTP_NOT_FOUND,
        [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODE.RATE_LIMIT_EXECUTION_FAILED,
        [HttpStatus.INTERNAL_SERVER_ERROR]: ERROR_CODE.COMMON_HTTP_INTERNAL_ERROR,
      };

      const status = exception.getStatus();

      const code = statusMap[status] ?? ERROR_CODE.COMMON_HTTP_INVALID_INPUT;

      this.logger.warn(
        {
          errorCode: code,
          httpStatus: status,
          method: request.method,
          path: request.url,
          originalMessage: exception.message,
        },
        `Unmapped HttpException [${status}]`
      );

      if (code >= ERROR_CODE.COMMON_HTTP_INTERNAL_ERROR) {
        Sentry.captureException(exception, {
          tags: { path: request.url, method: request.method },
        });
      }

      response.status(status).json({ error: code });

      return;
    }

    const error = exception instanceof Error ? exception : new Error(String(exception));

    this.logger.error(
      {
        errorCode: ERROR_CODE.COMMON_INTERNAL_ERROR,
        method: request.method,
        path: request.url,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      },
      'Unhandled error caught by AllExceptionsFilter'
    );

    Sentry.captureException(error, {
      tags: {
        errorCode: ERROR_CODE.COMMON_INTERNAL_ERROR,
        path: request.url,
        method: request.method,
      },
    });

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: ERROR_CODE.COMMON_INTERNAL_ERROR });
  }
}
