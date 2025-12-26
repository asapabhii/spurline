import { conversationRepository } from '../repositories/conversation.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import type { Conversation, Message } from '../types/domain.types.js';
import { logger } from '../utils/logger.js';

import { llmService } from './llm.service.js';
import { 
  emitAiTypingStart, 
  emitAiTypingStop, 
  emitStreamChunk, 
  emitStreamEnd, 
  emitStreamStart 
} from './socket.service.js';
import { typingService } from './typing.service.js';

export interface SendMessageResult {
  aiMessage: Message;
  conversation: Conversation;
  suggestions: string[];
  userMessage: Message;
}

/**
 * Chat orchestration service
 * Coordinates message persistence, LLM calls, and real-time updates
 */
export class ChatService {
  private readonly maxHistoryForLLM = 10;

  /**
   * Process an incoming user message and generate AI response with streaming
   */
  async sendMessage(sessionId: string | undefined, content: string): Promise<SendMessageResult> {
    // Get or create conversation
    const conversation = conversationRepository.getOrCreate(sessionId);
    
    logger.debug('Processing message', {
      conversationId: conversation.id,
      isNewConversation: sessionId !== conversation.id,
    });

    // Persist user message
    const userMessage = messageRepository.create(conversation.id, content, 'user');

    // Set typing indicators (both Redis and Socket)
    await typingService.setTyping(conversation.id);
    emitAiTypingStart(conversation.id);

    try {
      // Get conversation history for context
      const history = messageRepository.findByConversationId(
        conversation.id,
        this.maxHistoryForLLM,
      );

      // Create placeholder for AI message
      const aiMessageId = messageRepository.createPlaceholder(conversation.id);
      emitStreamStart(conversation.id, aiMessageId);

      let fullContent = '';

      // Generate AI response with streaming
      const result = await llmService.generateReplyStream(
        history, 
        content,
        (chunk) => {
          fullContent += chunk;
          emitStreamChunk(conversation.id, aiMessageId, chunk);
        }
      );

      // Clear typing indicators
      await typingService.clearTyping(conversation.id);
      emitAiTypingStop(conversation.id);

      // Update placeholder with full content and suggestions
      const aiMessage = messageRepository.updatePlaceholder(
        aiMessageId, 
        result.content,
        result.suggestions
      );

      // Emit stream end with suggestions
      emitStreamEnd(conversation.id, aiMessageId, result.suggestions);

      logger.debug('Message processed successfully', {
        aiMessageId: aiMessage.id,
        conversationId: conversation.id,
        userMessageId: userMessage.id,
      });

      return {
        aiMessage,
        conversation,
        suggestions: result.suggestions,
        userMessage,
      };
    } catch (error) {
      // Always clear typing on error
      await typingService.clearTyping(conversation.id);
      emitAiTypingStop(conversation.id);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): { conversation: Conversation; messages: Message[] } | null {
    const conversation = conversationRepository.findById(sessionId);
    
    if (!conversation) {
      return null;
    }

    const messages = messageRepository.findByConversationId(sessionId);
    
    return { conversation, messages };
  }

  /**
   * Check if AI is currently typing for a conversation
   */
  async getTypingStatus(sessionId: string): Promise<boolean> {
    return typingService.isTyping(sessionId);
  }
}

// Singleton instance
export const chatService = new ChatService();
