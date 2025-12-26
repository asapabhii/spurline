import { env } from '../config/environment.js';
import { LLMError } from '../middleware/error-handler.js';
import type { Message } from '../types/domain.types.js';
import { logger } from '../utils/logger.js';

/**
 * Domain knowledge injected into system prompt
 */
const DOMAIN_KNOWLEDGE = `
DOMAIN KNOWLEDGE:
- Shipping: Free shipping on orders over $50. Standard delivery 5-7 business days. International shipping available (10-14 business days).
- Returns: 30-day return policy. Items must be unused with original tags attached. Refunds processed within 5-7 business days.
- Support Hours: Monday-Friday 9AM-6PM EST. Email support available 24/7 with response within 24 hours.
- Payment: We accept all major credit cards, PayPal, and Apple Pay.
- Order Tracking: Tracking numbers sent via email within 24 hours of shipment.
`.trim();

/**
 * System prompt for the support agent
 */
const SYSTEM_PROMPT = `You are a helpful AI agent for "Spurline".
Answer clearly, concisely, and accurately.
If you do not know something, say so honestly.
Do not hallucinate policies or make up information.
Be friendly but professional.
Keep responses brief - aim for 1-3 sentences when possible.

${DOMAIN_KNOWLEDGE}`;

/**
 * LLM Service interface for abstraction
 * Allows swapping providers (OpenAI, Anthropic, local) with minimal changes
 */
export interface LLMService {
  generateReply(history: Message[], userMessage: string): Promise<string>;
}

/**
 * OpenAI-compatible message format
 */
interface ChatMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * OpenAI-compatible response format
 */
interface ChatCompletionResponse {
  choices: Array<{
    finish_reason: string;
    index: number;
    message: {
      content: string;
      role: string;
    };
  }>;
  created: number;
  id: string;
  model: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Hugging Face Inference API implementation
 * Uses the new router.huggingface.co OpenAI-compatible endpoint
 */
export class HuggingFaceLLMService implements LLMService {
  private readonly apiUrl = 'https://router.huggingface.co/v1/chat/completions';
  private readonly model = 'meta-llama/Llama-3.2-3B-Instruct';
  private readonly timeoutMs = 30000; // 30 second timeout
  private readonly maxHistoryMessages = 10;

  async generateReply(history: Message[], userMessage: string): Promise<string> {
    const messages = this.buildMessages(history, userMessage);

    try {
      const response = await this.callHuggingFace(messages);
      return this.extractReply(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private buildMessages(history: Message[], userMessage: string): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // System prompt
    messages.push({
      content: SYSTEM_PROMPT,
      role: 'system',
    });

    // Add recent conversation history
    const recentHistory = history.slice(-this.maxHistoryMessages);
    for (const msg of recentHistory) {
      messages.push({
        content: msg.content,
        role: msg.sender === 'user' ? 'user' : 'assistant',
      });
    }

    // Add current user message
    messages.push({
      content: userMessage,
      role: 'user',
    });

    return messages;
  }

  private async callHuggingFace(messages: ChatMessage[]): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        body: JSON.stringify({
          max_tokens: 256,
          messages,
          model: this.model,
          temperature: 0.7,
          top_p: 0.9,
        }),
        headers: {
          'Authorization': `Bearer ${env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle rate limiting (429) and service unavailable (503)
      if (response.status === 429) {
        logger.warn('HuggingFace rate limited');
        throw LLMError.rateLimited();
      }

      if (response.status === 503) {
        logger.warn('HuggingFace service unavailable (model loading)');
        throw LLMError.serviceUnavailable();
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('HuggingFace API error', { 
          error: errorText,
          status: response.status, 
        });
        throw new Error(`HuggingFace API error: ${response.status}`);
      }

      return await response.json() as ChatCompletionResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LLMError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('HuggingFace request timed out');
        throw LLMError.timeout();
      }

      throw error;
    }
  }

  private extractReply(response: ChatCompletionResponse): string {
    const firstChoice = response.choices?.[0];
    
    if (firstChoice?.message?.content) {
      const reply = firstChoice.message.content.trim();
      
      if (!reply) {
        return this.getFallbackMessage();
      }
      
      return reply;
    }

    logger.warn('Unexpected HuggingFace response format', { response });
    return this.getFallbackMessage();
  }

  private handleError(error: unknown): never {
    if (error instanceof LLMError) {
      throw error;
    }

    logger.error('LLM service error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw LLMError.serviceUnavailable();
  }

  private getFallbackMessage(): string {
    return "I'm sorry, I'm having trouble understanding right now. Could you please rephrase your question?";
  }
}

// Singleton instance
export const llmService: LLMService = new HuggingFaceLLMService();
