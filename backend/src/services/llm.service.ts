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
const SYSTEM_PROMPT = `You are a helpful customer support agent for a small e-commerce brand called "Spurline Shop".
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
 * Hugging Face Inference API implementation
 * Uses free tier - be mindful of rate limits
 */
export class HuggingFaceLLMService implements LLMService {
  private readonly apiUrl: string;
  private readonly model: string = 'mistralai/Mistral-7B-Instruct-v0.2';
  private readonly timeoutMs: number = 30000; // 30 second timeout
  private readonly maxHistoryMessages: number = 10;

  constructor() {
    this.apiUrl = `https://api-inference.huggingface.co/models/${this.model}`;
  }

  async generateReply(history: Message[], userMessage: string): Promise<string> {
    const prompt = this.buildPrompt(history, userMessage);

    try {
      const response = await this.callHuggingFace(prompt);
      return this.extractReply(response, prompt);
    } catch (error) {
      return this.handleError(error);
    }
  }

  private buildPrompt(history: Message[], userMessage: string): string {
    // Take only the most recent messages to avoid context overflow
    const recentHistory = history.slice(-this.maxHistoryMessages);

    // Build conversation history in Mistral instruct format
    let conversationHistory = '';
    for (const msg of recentHistory) {
      if (msg.sender === 'user') {
        conversationHistory += `[INST] ${msg.content} [/INST]\n`;
      } else {
        conversationHistory += `${msg.content}\n`;
      }
    }

    // Format: <s>[INST] System prompt + conversation [/INST]
    const prompt = `<s>[INST] ${SYSTEM_PROMPT}

${conversationHistory}[INST] ${userMessage} [/INST]`;

    return prompt;
  }

  private async callHuggingFace(prompt: string): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 256,
            return_full_text: false,
            temperature: 0.7,
            top_p: 0.9,
          },
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

      return await response.json();
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

  private extractReply(response: unknown, prompt: string): string {
    // HuggingFace returns array of generated texts
    if (Array.isArray(response) && response.length > 0) {
      const generated = response[0] as { generated_text?: string };
      if (generated.generated_text) {
        // Clean up the response - remove the prompt if included
        let reply = generated.generated_text;
        
        // Remove any remaining instruction tags
        reply = reply.replace(/\[INST\]|\[\/INST\]|<s>|<\/s>/g, '').trim();
        
        // If response is empty or just whitespace, return fallback
        if (!reply) {
          return this.getFallbackMessage();
        }
        
        return reply;
      }
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

