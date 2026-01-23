import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string().url(),

  AMAZON_ACCESS_KEY_ID: z.string().optional(),
  AMAZON_SECRET_ACCESS_KEY: z.string().optional(),
  AMAZON_ASSOCIATE_TAG: z.string().optional(),
  AMAZON_REGION: z.string().optional(),
  // Legacy support
  AMAZON_ACCESS_KEY: z.string().optional(),
  AMAZON_SECRET_KEY: z.string().optional(),

  WALMART_API_KEY: z.string().optional(),
  WALMART_PARTNER_ID: z.string().optional(),
  TARGET_API_KEY: z.string().optional(),
  SERP_API_KEY: z.string().optional(),
  
  // Scraping Services (for development - no approvals needed)
  BRIGHT_DATA_USERNAME: z.string().optional(),
  BRIGHT_DATA_PASSWORD: z.string().optional(),
  BRIGHT_DATA_ZONE: z.string().optional(),
  APIFY_API_KEY: z.string().optional(), // Apify actors API (for gas prices, etc.)
  SERPAPI_KEY: z.string().optional(), // Google Shopping API & Google Maps API
  OILPRICEAPI_KEY: z.string().optional(), // Fuel price API
  SCRAPINGBEE_API_KEY: z.string().optional(), // Web scraping API (for GasBuddy, etc.)
  
  // eBay API
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
  
  // Best Buy API
  BESTBUY_API_KEY: z.string().optional(),

  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  CORS_ORIGIN: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_PASSWORD: z.string().optional(),

  FRONTEND_URL: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

