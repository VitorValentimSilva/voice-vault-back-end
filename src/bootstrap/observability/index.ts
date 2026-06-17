import { INestApplication } from '@nestjs/common';

import { EnvService } from '@/config/env/env.service.js';

import { setupPosthog } from './posthog.bootstrap.js';
import { setupSentry } from './sentry.bootstrap.js';

export function setupObservability(app: INestApplication): void {
  const env = app.get(EnvService);

  setupSentry(env);
  setupPosthog(app, env);
}
