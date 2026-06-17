export type NodeEnv = 'development' | 'production';

export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  SENTRY_DSN: string;
  POSTHOG_KEY: string;
  POSTHOG_HOST: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  QSTASH_URL: string;
  QSTASH_TOKEN: string;
  QSTASH_CURRENT_SIGNING_KEY: string;
  QSTASH_NEXT_SIGNING_KEY: string;
}
