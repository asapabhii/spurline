import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { AppError } from '../middleware/error-handler.js';
import { sanitizeInput, validateMessageContent } from '../middleware/validation.js';
import { feedbackRepository, type FeedbackRating } from '../repositories/feedback.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import { chatService } from '../services/chat.service.js';
import {
  type ConversationHistoryResponse,
  type ConversationStatusResponse,
  sendMessageRequestSchema,
  type SendMessageResponse,
} from '../types/api.types.js';

// Extended response with suggestions
interface SendMessageResponseWithSuggestions extends SendMessageResponse {
  suggestions: string[];
}

// Feedback request schema
const feedbackRequestSchema = z.object({
  messageId: z.string().uuid(),
  rating: z.enum(['up', 'down']),
  sessionId: z.string().uuid(),
});

/**
 * Chat controller - handles request orchestration
 */
export class ChatController {
  /**
   * POST /api/chat/message
   */
  async sendMessage(
    req: Request,
    res: Response<SendMessageResponseWithSuggestions>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validationResult = sendMessageRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(400, firstError?.message ?? 'Invalid request', 'VALIDATION_ERROR');
      }

      const { sessionId } = validationResult.data;
      
      const sanitizedMessage = sanitizeInput(validationResult.data.message);
      const contentValidation = validateMessageContent(sanitizedMessage);
      
      if (!contentValidation.isValid) {
        throw new AppError(400, contentValidation.error ?? 'Invalid message', 'VALIDATION_ERROR');
      }

      const result = await chatService.sendMessage(sessionId, sanitizedMessage);

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
   */
  async getConversation(
    req: Request<{ sessionId: string }>,
    res: Response<ConversationHistoryResponse & { messages: Array<{ feedback?: 'up' | 'down'; suggestions?: string[] }> }>,
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

      // Get feedback for each AI message
      const messagesWithFeedback = messagesWithSuggestions.map((msg) => {
        const feedback = msg.sender === 'ai' 
          ? feedbackRepository.findByMessageId(msg.id)
          : null;

        return {
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
          feedback: feedback?.rating,
          id: msg.id,
          sender: msg.sender,
          suggestions: msg.suggestions,
        };
      });

      res.status(200).json({
        messages: messagesWithFeedback,
        sessionId: result.conversation.id,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/:sessionId/status
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
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/chat/feedback
   */
  async submitFeedback(
    req: Request,
    res: Response<{ success: boolean }>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validationResult = feedbackRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new AppError(400, firstError?.message ?? 'Invalid request', 'VALIDATION_ERROR');
      }

      const { messageId, rating, sessionId } = validationResult.data;

      feedbackRepository.upsert(messageId, sessionId, rating as FeedbackRating);

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/chat/feedback/:messageId
   */
  async removeFeedback(
    req: Request<{ messageId: string }>,
    res: Response<{ success: boolean }>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        throw new AppError(400, 'Message ID is required', 'VALIDATION_ERROR');
      }

      feedbackRepository.delete(messageId);

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

// Singleton instance
export const chatController = new ChatController();
