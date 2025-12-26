import { Router } from 'express';

import { chatController } from '../controllers/chat.controller.js';

/**
 * Chat routes - HTTP contracts only
 * No business logic here, just route definitions
 */
export function createChatRouter(): Router {
  const router = Router();

  // POST /api/chat/message - Send message and get AI reply
  router.post('/message', (req, res, next) => 
    chatController.sendMessage(req, res, next),
  );

  // GET /api/chat/:sessionId - Get conversation history
  router.get('/:sessionId', (req, res, next) => 
    chatController.getConversation(req, res, next),
  );

  // GET /api/chat/:sessionId/status - Get typing status
  router.get('/:sessionId/status', (req, res, next) => 
    chatController.getStatus(req, res, next),
  );

  return router;
}

