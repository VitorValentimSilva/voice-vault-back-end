import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import { setupPosthog } from '@/bootstrap/posthog.bootstrap';
import { setupSwagger } from '@/bootstrap/swagger.bootstrap';
import { AllExceptionsFilter } from '@/common/errors/all-exceptions.filter';
import { AppExceptionFilter } from '@/common/errors/app-exception.filter';
import { AppConfigModule } from '@/config/config.module';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppConfigModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.enableShutdownHooks();

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(new ZodValidationPipe());

  const env = process.env;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1,
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1,
  });

  const logger = app.get(Logger);

  app.useGlobalFilters(new AllExceptionsFilter(logger), new AppExceptionFilter(logger));

  setupPosthog(app);
  setupSwagger(app);

  const port = env.PORT ?? 5000;

  await app.listen(port);

  logger.log(`🚀 Application running on port ${port}`);
}
