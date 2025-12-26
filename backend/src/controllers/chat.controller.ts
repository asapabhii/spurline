import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../middleware/error-handler.js';
import { chatService } from '../services/chat.service.js';
import {
  type ConversationHistoryResponse,
  type ConversationStatusResponse,
  sendMessageRequestSchema,
  type SendMessageResponse,
} from '../types/api.types.js';

/**
 * Chat controller - handles request orchestration
 * Business logic lives in services, not here
 */
export class ChatController {
  /**
   * POST /api/chat/message
   * Send a message and receive AI response
   */
  async sendMessage(
    req: Request,
    res: Response<SendMessageResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate request body
      const validationResult = sendMessageRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(400, firstError?.message ?? 'Invalid request', 'VALIDATION_ERROR');
      }

      const { message, sessionId } = validationResult.data;

      // Process message through chat service
      const result = await chatService.sendMessage(sessionId, message);

      // Return response
      res.status(200).json({
        createdAt: result.aiMessage.createdAt.toISOString(),
        messageId: result.aiMessage.id,
        reply: result.aiMessage.content,
        sessionId: result.conversation.id,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/:sessionId
   * Get conversation history
   */
  async getConversation(
    req: Request<{ sessionId: string }>,
    res: Response<ConversationHistoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        throw new AppError(400, 'Session ID is required', 'VALIDATION_ERROR');
      }

      const result = chatService.getConversationHistory(sessionId);

      if (!result) {
        throw new AppError(404, 'Conversation not found', 'NOT_FOUND');
      }

      res.status(200).json({
        messages: result.messages.map((msg) => ({
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          id: msg.id,
          sender: msg.sender,
        })),
        sessionId: result.conversation.id,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/:sessionId/status
   * Get conversation status (typing indicator, extensible for future)
   */
  async getStatus(
    req: Request<{ sessionId: string }>,
    res: Response<ConversationStatusResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        throw new AppError(400, 'Session ID is required', 'VALIDATION_ERROR');
      }

      const isTyping = await chatService.getTypingStatus(sessionId);

      res.status(200).json({
        isTyping,
        // Future: agentOnline, queuePosition, etc.
      });
    } catch (error) {
      next(error);
    }
  }
}

// Singleton instance
export const chatController = new ChatController();

