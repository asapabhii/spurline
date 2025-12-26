import { Router } from 'express';

import { chatController } from '../controllers/chat.controller.js';

/**
 * Chat routes
 */
export function createChatRouter(): Router {
  const router = Router();

  // POST /api/chat/message - Send message and get AI reply
  router.post('/message', (req, res, next) => 
    chatController.sendMessage(req, res, next),
  );

  // POST /api/chat/feedback - Submit feedback on AI message
  router.post('/feedback', (req, res, next) => 
    chatController.submitFeedback(req, res, next),
  );

  // DELETE /api/chat/feedback/:messageId - Remove feedback
  router.delete('/feedback/:messageId', (req, res, next) => 
    chatController.removeFeedback(req, res, next),
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
