import { Router } from 'express';

import { chatController } from '../controllers/chat.controller.js';

/**
 * Chat API Routes
 * 
 * POST /api/chat/message    - Send message, get AI response
 * GET  /api/chat/:sessionId - Get conversation history
 * GET  /api/chat/:sessionId/status - Get status (fallback)
 */
export function createChatRouter(): Router {
  const router = Router();

  router.post('/message', (req, res, next) => 
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
