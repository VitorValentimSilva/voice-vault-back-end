import { INestApplication } from '@nestjs/common';
import { PostHog } from 'posthog-node';
import { PostHogInterceptor } from 'posthog-node/nestjs';

export function setupPosthog(app: INestApplication): void {
  if (!process.env.POSTHOG_KEY || !process.env.POSTHOG_HOST) {
    return;
  }

  const posthog = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST,
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
