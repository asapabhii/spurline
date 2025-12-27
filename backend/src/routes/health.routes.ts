import { Router } from 'express';

import { getDatabase, queryOne } from '../config/database.js';
import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Health Check Routes
 *
 * GET /health       - Basic health check
 * GET /health/ready - Readiness check (DB + Redis)
 */
export function createHealthRouter(): Router {
  const router = Router();

  // Basic liveness check
  router.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness check - verifies database and Redis connectivity
  router.get('/ready', async (_req, res) => {
    const checks: Record<string, 'ok' | 'error'> = {
      database: 'error',
      redis: 'error',
    };

    // Check database
    try {
      const pool = getDatabase();
      await queryOne('SELECT 1');
      checks['database'] = 'ok';
    } catch (e) {
      logger.error('Health check: DB failed', {
        error: e instanceof Error ? e.message : 'Unknown',
      });
      checks['database'] = 'error';
    }

    // Check Redis (optional)
    try {
      const client = getRedisClient();
      if (client.status === 'ready') {
        await client.ping();
        checks['redis'] = 'ok';
      }
    } catch {
      // Redis is optional, log but don't fail
      checks['redis'] = 'error';
    }

    const allOk = checks['database'] === 'ok';

    res.status(allOk ? 200 : 503).json({
      status: allOk ? 'ready' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
