import { z } from 'zod';

const envSchema = z.object({
  DATABASE_PATH: z.string().default('./data/spurline.db'),
  HUGGINGFACE_API_TOKEN: z.string().min(1, 'HUGGINGFACE_API_TOKEN is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

export type Environment = z.infer<typeof envSchema>;

function loadEnvironment(): Environment {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnvironment();

