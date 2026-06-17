import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from '@/app.module.js';
import { setupObservability } from '@/bootstrap/observability';
import { setupSwagger } from '@/bootstrap/swagger.bootstrap';
import { setupValidation } from '@/bootstrap/validation.bootstrap';
import { EnvService } from '@/config/env/env.service';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const env = app.get(EnvService);

  app.enableShutdownHooks();

  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.use(compression());

  setupValidation(app);
  setupObservability(app);
  setupSwagger(app);

  await app.listen(env.port);

  const logger = app.get(Logger);

  logger.log(`🚀 Application running on port ${env.port}`);
}
