import { Router } from 'express';

import { chatController } from '../controllers/chat.controller.js';
import { rateLimiter } from '../middleware/rate-limiter.js';

/**
 * Chat API Routes
 * 
 * POST /api/chat/message    - Send message, get AI response (rate limited)
 * GET  /api/chat/:sessionId - Get conversation history
 * GET  /api/chat/:sessionId/status - Get status (fallback)
 */
export function createChatRouter(): Router {
  const router = Router();

  // Rate limit message sending to prevent abuse
  router.post('/message', rateLimiter, (req, res, next) => 
    chatController.sendMessage(req, res, next),
  );

  router.get('/:sessionId', (req, res, next) => 
    chatController.getConversation(req, res, next),
  );

  router.get('/:sessionId/status', (req, res, next) => 
    chatController.getStatus(req, res, next),
  );

  return router;
}
