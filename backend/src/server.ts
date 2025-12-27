import { createServer } from 'http';

import { createApp } from './app.js';
import { closeDatabase, initDatabase } from './config/database.js';
import { env } from './config/environment.js';
import { closeRedis, getRedisClient } from './config/redis.js';
import { initSocketServer } from './services/socket.service.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const app = createApp();
  const httpServer = createServer(app);

  // Initialize Socket.IO
  initSocketServer(httpServer);

  // Initialize connections
  try {
    await initDatabase();
    logger.info('Database connected');

    // Redis is optional - don't fail if unavailable
    try {
      getRedisClient();
    } catch (error) {
      logger.warn('Redis initialization failed (continuing without Redis)', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  } catch (error) {
    logger.error('Failed to initialize database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }

  // Start server
  httpServer.listen(env.PORT, () => {
    try {
      logger.info(`Server started on port ${env.PORT}`, {
        environment: env.NODE_ENV,
      });
    } catch (error) {
      logger.error('Error in server listen callback', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  });

  // Handle server errors
  httpServer.on('error', (error) => {
    logger.error('HTTP server error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down gracefully`);

    httpServer.close(() => {
      try {
        logger.info('HTTP server closed');
      } catch (error) {
        logger.error('Error in server close callback', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    });

    try {
      await closeRedis();
      await closeDatabase();
      logger.info('All connections closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, _promise) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

main().catch((error) => {
  logger.error('Unhandled error in main', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
