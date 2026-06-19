import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

import { AppException } from '@/common/errors/app.exception';
import { ERROR_METADATA } from '@/common/errors/code/error.code';
import { ErrorResponse } from '@/common/errors/code/error.type';

@Catch(AppException)
export class AppExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: AppException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const code = exception.code;
    const status = exception.getStatus();
    const meta = ERROR_METADATA[code];

    const logPayload = {
      errorCode: code,
      httpStatus: status,
      method: request.method,
      path: request.url,
      ...(exception.context ? { errorContext: exception.context } : {}),
    };

    if (meta.severity === 'unexpected') {
      this.logger.error(logPayload, `AppException [${code}]`);
    } else {
      this.logger.warn(logPayload, `AppException [${code}]`);
    }

    if (meta.severity === 'unexpected') {
      Sentry.captureException(exception, {
        tags: {
          errorCode: code,
          path: request.url,
          method: request.method,
        },
        extra: exception.context,
      });
    }

    response.status(status).json({ error: code } satisfies ErrorResponse);
  }
}
