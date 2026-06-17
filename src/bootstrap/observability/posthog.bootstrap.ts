import { INestApplication } from '@nestjs/common';
import { PostHog } from 'posthog-node';
import { PostHogInterceptor } from 'posthog-node/nestjs';

import { EnvService } from '@/config/env/env.service';

export function setupPosthog(app: INestApplication, env: EnvService): void {
  const posthog = new PostHog(env.posthogKey, {
    host: env.posthogHost,
  });

  app.useGlobalInterceptors(new PostHogInterceptor(posthog));

  process.on('SIGTERM', () => {
    void (async () => {
      await posthog.shutdown();

      process.exit(0);
    })();
  });

  process.on('SIGINT', () => {
    void (async () => {
      await posthog.shutdown();

      process.exit(0);
    })();
  });
}
