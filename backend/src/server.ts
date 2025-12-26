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

    getRedisClient();
    // Redis logs its own connection status
  } catch (error) {
    logger.error('Failed to initialize connections', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }

  // Start server
  httpServer.listen(env.PORT, () => {
    logger.info(`Server started on port ${env.PORT}`, {
      environment: env.NODE_ENV,
    });
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received, shutting down gracefully`);

    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    try {
      await closeRedis();
      closeDatabase();
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
}

main().catch((error) => {
  logger.error('Unhandled error in main', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
