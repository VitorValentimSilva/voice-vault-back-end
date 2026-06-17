import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').default('development'),
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
});
