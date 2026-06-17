import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { EnvService } from '@/config/env/env.service';

export function setupSentry(env: EnvService): void {
  Sentry.init({
    dsn: env.sentryDsn,
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: env.isProduction ? 0.2 : 1,
    profilesSampleRate: env.isProduction ? 0.2 : 1,
  });
}
