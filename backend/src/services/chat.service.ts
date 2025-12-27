import { AppError } from '../middleware/error-handler.js';
import { conversationRepository } from '../repositories/conversation.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import type { Conversation, Message } from '../types/domain.types.js';
import { logger } from '../utils/logger.js';

import { llmService, type LLMResponse } from './llm.service.js';
import {
  emitAiTypingStart,
  emitAiTypingStop,
  emitStreamChunk,
  emitStreamEnd,
  emitStreamStart,
} from './socket.service.js';

/**
 * Result of sending a message
 */
export interface SendMessageResult {
  aiMessage: Message;
  conversation: Conversation;
  suggestions: string[];
  userMessage: Message;
}

/**
 * Chat orchestration service
 * Handles the complete message flow: persist → stream → respond
 */
export class ChatService {
  private static readonly MAX_HISTORY_CONTEXT = 8;

  /**
   * Process user message and generate AI response
   */
  async sendMessage(sessionId: string | undefined, content: string): Promise<SendMessageResult> {
    const startTime = Date.now();

    try {
      // Get or create conversation
      const conversation = await conversationRepository.getOrCreate(sessionId);
      const isNewConversation = sessionId !== conversation.id;

      logger.info('Processing message', {
        conversationId: conversation.id,
        isNew: isNewConversation,
        contentLength: content.length,
      });

      // Persist user message first (source of truth)
      const userMessage = await messageRepository.create(conversation.id, content, 'user');

      // Signal AI is working
      emitAiTypingStart(conversation.id);

      try {
        // Get conversation context
        const history = await messageRepository.findByConversationId(
          conversation.id,
          ChatService.MAX_HISTORY_CONTEXT
        );

        // Create placeholder message for streaming (updated with content as chunks arrive)
        const aiMessageId = await messageRepository.createPlaceholder(conversation.id);
        emitStreamStart(conversation.id, aiMessageId);

        // Generate response with streaming
        const llmResponse = await this.generateWithStreaming(
          conversation.id,
          aiMessageId,
          history,
          content
        );

        // Finalize placeholder with actual content
        const aiMessage = await messageRepository.updatePlaceholder(
          aiMessageId,
          llmResponse.content,
          llmResponse.suggestions
        );

        emitStreamEnd(conversation.id, aiMessageId, llmResponse.suggestions);
        emitAiTypingStop(conversation.id);

        logger.info('Message processed', {
          conversationId: conversation.id,
          durationMs: Date.now() - startTime,
          responseLength: llmResponse.content.length,
        });

        return {
          aiMessage,
          conversation,
          suggestions: llmResponse.suggestions,
          userMessage,
        };
      } catch (error) {
        emitAiTypingStop(conversation.id);

        // Re-throw LLM errors as-is (they're already user-friendly)
        if (error instanceof AppError) {
          throw error;
        }

        // Wrap unexpected errors
        logger.error('Message processing failed', {
          conversationId: conversation.id,
          durationMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown',
        });

        throw new AppError(
          500,
          'Failed to process your message. Please try again.',
          'PROCESSING_ERROR'
        );
      }
    } catch (error) {
      // If it's already an AppError, re-throw
      if (error instanceof AppError) {
        throw error;
      }

      // Database or other unexpected errors
      logger.error('Unexpected error in sendMessage', {
        error: error instanceof Error ? error.message : 'Unknown',
      });

      throw new AppError(500, 'Something went wrong. Please try again.', 'INTERNAL_ERROR');
    }
  }

  /**
   * Stream LLM response with real-time updates
   */
  private async generateWithStreaming(
    conversationId: string,
    messageId: string,
    history: Message[],
    userMessage: string
  ): Promise<LLMResponse> {
    return llmService.generateReplyStream(history, userMessage, (chunk) => {
      emitStreamChunk(conversationId, messageId, chunk);
    });
  }

  /**
   * Get full conversation history
   */
  async getConversationHistory(sessionId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  } | null> {
    try {
      const conversation = await conversationRepository.findById(sessionId);

      if (!conversation) {
        return null;
      }

      const messages = await messageRepository.findByConversationId(sessionId);
      return { conversation, messages };
    } catch (error) {
      logger.error('Failed to get conversation history', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  }
}

// Singleton export
export const chatService = new ChatService();
