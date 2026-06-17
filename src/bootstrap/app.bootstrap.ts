import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from '@/app.module.js';
import { setupPosthog } from '@/bootstrap/posthog.bootstrap';
import { setupSwagger } from '@/bootstrap/swagger.bootstrap';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
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

  setupPosthog(app);
  setupSwagger(app);

  const port = env.PORT ?? 3000;

  await app.listen(port);

  const logger = app.get(Logger);

  logger.log(`🚀 Application running on port ${port}`);
}
