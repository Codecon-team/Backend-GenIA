import { z } from 'zod'

const envScheme = z.object({
  PORT: z.coerce.number().default(3000),
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),
  JWT_SECRET: z.string().min(32, "A chave JWT deve ter pelo menos 32 caracteres")
     .default('default-secret-with-32-chars-1234567890'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  API_MS_PIX: z.string().url().default('http://localhost:3001'),
  CLOUD_NAME: z.string(),
  CLOUD_API_KEY: z.string(),
  CLOUD_API_SECRET: z.string()
});

export const env = envScheme.parse(process.env)