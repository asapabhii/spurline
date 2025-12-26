import cors from 'cors';
import express from 'express';

import { errorHandler } from './middleware/error-handler.js';
import { validateJsonBody } from './middleware/validation.js';
import { createChatRouter } from './routes/chat.routes.js';

export function createApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env['NODE_ENV'] === 'production' 
      ? process.env['FRONTEND_URL'] 
      : true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10kb' })); // Limit payload size
  app.use(validateJsonBody); // Validate JSON parsing

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API routes
  app.use('/api/chat', createChatRouter());

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

