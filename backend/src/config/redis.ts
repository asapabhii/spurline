import Redis from 'ioredis';

import { env } from './environment.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 retries');
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    },
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error', { error: err.message });
  });

  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      logger.error('Error closing Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      redisClient = null;
    }
  }
}
