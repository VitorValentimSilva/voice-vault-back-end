import * as Joi from 'joi';

export type NodeEnv = 'development' | 'test' | 'production';

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
  CLERK_WEBHOOK_SECRET: string;
}

export const EnvSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').required(),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  SENTRY_DSN: Joi.string().uri().required(),
  POSTHOG_KEY: Joi.string().required(),
  POSTHOG_HOST: Joi.string().uri().required(),
  UPSTASH_REDIS_REST_URL: Joi.string().uri().required(),
  UPSTASH_REDIS_REST_TOKEN: Joi.string().required(),
  QSTASH_URL: Joi.string().uri().required(),
  QSTASH_TOKEN: Joi.string().required(),
  QSTASH_CURRENT_SIGNING_KEY: Joi.string().required(),
  QSTASH_NEXT_SIGNING_KEY: Joi.string().required(),
  CLERK_WEBHOOK_SECRET: Joi.string().required(),
});
