import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../middleware/error-handler.js';
import { sanitizeInput, validateMessageContent } from '../middleware/validation.js';
import { messageRepository } from '../repositories/message.repository.js';
import { chatService } from '../services/chat.service.js';
import {
  type ConversationHistoryResponse,
  sendMessageRequestSchema,
  type SendMessageResponse,
} from '../types/api.types.js';
import { logger } from '../utils/logger.js';

/**
 * Extended response with suggestions
 */
interface ChatResponse extends SendMessageResponse {
  suggestions: string[];
}

/**
 * Chat Controller
 * Handles HTTP request/response cycle for chat operations
 */
export class ChatController {
  /**
   * POST /api/chat/message
   * Send message and receive streaming AI response
   */
  async sendMessage(
    req: Request,
    res: Response<ChatResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Validate request schema
      const validation = sendMessageRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        const error = validation.error.errors[0];
        throw new AppError(400, error?.message ?? 'Invalid request', 'VALIDATION_ERROR');
      }

      const { sessionId } = validation.data;
      
      // Sanitize and validate content
      const content = sanitizeInput(validation.data.message);
      const contentCheck = validateMessageContent(content);
      
      if (!contentCheck.isValid) {
        throw new AppError(400, contentCheck.error ?? 'Invalid message', 'VALIDATION_ERROR');
      }

      // Process message
      const result = await chatService.sendMessage(sessionId, content);

      // Return response
      res.status(200).json({
        createdAt: result.aiMessage.createdAt.toISOString(),
        messageId: result.aiMessage.id,
        reply: result.aiMessage.content,
        sessionId: result.conversation.id,
        suggestions: result.suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/:sessionId
   * Retrieve conversation history
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

      // Get messages with suggestions
      const messagesWithSuggestions = messageRepository.findByConversationIdWithSuggestions(sessionId);

      res.status(200).json({
        messages: messagesWithSuggestions.map((msg) => ({
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          id: msg.id,
          sender: msg.sender,
          suggestions: msg.suggestions,
        })),
        sessionId: result.conversation.id,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/:sessionId/status
   * Get conversation status (for polling fallback)
   */
  async getStatus(
    req: Request<{ sessionId: string }>,
    res: Response<{ isTyping: boolean }>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        throw new AppError(400, 'Session ID is required', 'VALIDATION_ERROR');
      }

      // Status is primarily handled via WebSocket
      // This endpoint exists as a fallback
      res.status(200).json({ isTyping: false });
    } catch (error) {
      next(error);
    }
  }
}

// Singleton export
export const chatController = new ChatController();
