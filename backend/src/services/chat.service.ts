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
    
    // Get or create conversation
    const conversation = conversationRepository.getOrCreate(sessionId);
    const isNewConversation = sessionId !== conversation.id;
    
    logger.info('Processing message', {
      conversationId: conversation.id,
      isNew: isNewConversation,
      contentLength: content.length,
    });

    // Persist user message first (source of truth)
    const userMessage = messageRepository.create(conversation.id, content, 'user');

    // Signal AI is working
    emitAiTypingStart(conversation.id);

    try {
      // Get conversation context
      const history = messageRepository.findByConversationId(
        conversation.id,
        ChatService.MAX_HISTORY_CONTEXT,
      );

      // Create placeholder for streaming
      const aiMessageId = messageRepository.createPlaceholder(conversation.id);
      emitStreamStart(conversation.id, aiMessageId);

      // Generate response with streaming
      const llmResponse = await this.generateWithStreaming(
        conversation.id,
        aiMessageId,
        history,
        content,
      );

      // Finalize message
      const aiMessage = messageRepository.updatePlaceholder(
        aiMessageId, 
        llmResponse.content,
        llmResponse.suggestions,
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
      
      logger.error('Message processing failed', {
        conversationId: conversation.id,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      
      throw error;
    }
  }

  /**
   * Stream LLM response with real-time updates
   */
  private async generateWithStreaming(
    conversationId: string,
    messageId: string,
    history: Message[],
    userMessage: string,
  ): Promise<LLMResponse> {
    return llmService.generateReplyStream(
      history,
      userMessage,
      (chunk) => {
        emitStreamChunk(conversationId, messageId, chunk);
      },
    );
  }

  /**
   * Get full conversation history
   */
  getConversationHistory(sessionId: string): { 
    conversation: Conversation; 
    messages: Message[];
  } | null {
    const conversation = conversationRepository.findById(sessionId);
    
    if (!conversation) {
      return null;
    }

    const messages = messageRepository.findByConversationId(sessionId);
    return { conversation, messages };
  }
}

// Singleton export
export const chatService = new ChatService();
