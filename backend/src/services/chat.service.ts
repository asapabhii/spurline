import { conversationRepository } from '../repositories/conversation.repository.js';
import { messageRepository } from '../repositories/message.repository.js';
import type { Conversation, Message } from '../types/domain.types.js';
import { logger } from '../utils/logger.js';

import { llmService } from './llm.service.js';
import { typingService } from './typing.service.js';

export interface SendMessageResult {
  aiMessage: Message;
  conversation: Conversation;
  userMessage: Message;
}

/**
 * Chat orchestration service
 * Coordinates message persistence, LLM calls, and typing indicators
 */
export class ChatService {
  private readonly maxHistoryForLLM = 10;

  /**
   * Process an incoming user message and generate AI response
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

    // Set typing indicator
    await typingService.setTyping(conversation.id);

    try {
      // Get conversation history for context
      const history = messageRepository.findByConversationId(
        conversation.id,
        this.maxHistoryForLLM,
      );

      // Generate AI response
      const aiReply = await llmService.generateReply(history, content);

      // Clear typing indicator
      await typingService.clearTyping(conversation.id);

      // Persist AI message
      const aiMessage = messageRepository.create(conversation.id, aiReply, 'ai');

      logger.debug('Message processed successfully', {
        aiMessageId: aiMessage.id,
        conversationId: conversation.id,
        userMessageId: userMessage.id,
      });

      return {
        aiMessage,
        conversation,
        userMessage,
      };
    } catch (error) {
      // Always clear typing on error
      await typingService.clearTyping(conversation.id);
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

