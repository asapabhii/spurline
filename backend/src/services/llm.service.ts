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
IMPORTANT: Respond in the SAME LANGUAGE as the user's message.

${DOMAIN_KNOWLEDGE}`;

/**
 * LLM Service interface for abstraction
 */
export interface LLMService {
  generateReply(history: Message[], userMessage: string): Promise<string>;
  generateReplyStream(
    history: Message[], 
    userMessage: string, 
    onChunk: (chunk: string) => void
  ): Promise<{ content: string; suggestions: string[] }>;
  generateSuggestions(history: Message[], lastResponse: string): Promise<string[]>;
}

/**
 * OpenAI-compatible message format
 */
interface ChatMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * Hugging Face Inference API implementation with streaming
 */
export class HuggingFaceLLMService implements LLMService {
  private readonly apiUrl = 'https://router.huggingface.co/v1/chat/completions';
  private readonly model = 'meta-llama/Llama-3.2-3B-Instruct';
  private readonly timeoutMs = 60000; // 60 second timeout for streaming
  private readonly maxHistoryMessages = 10;

  async generateReply(history: Message[], userMessage: string): Promise<string> {
    const result = await this.generateReplyStream(history, userMessage, () => {});
    return result.content;
  }

  async generateReplyStream(
    history: Message[], 
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<{ content: string; suggestions: string[] }> {
    const messages = this.buildMessages(history, userMessage);

    try {
      const content = await this.callHuggingFaceStream(messages, onChunk);
      
      // Generate suggestions after main response
      const suggestions = await this.generateSuggestions(history, content);
      
      return { content, suggestions };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async generateSuggestions(history: Message[], lastResponse: string): Promise<string[]> {
    try {
      const suggestionPrompt: ChatMessage[] = [
        {
          content: `Based on this conversation, generate exactly 3 brief follow-up questions the user might ask. 
Return ONLY a JSON array of 3 strings, nothing else. Example: ["Question 1?", "Question 2?", "Question 3?"]`,
          role: 'system',
        },
        {
          content: `Last AI response: "${lastResponse.slice(0, 200)}"`,
          role: 'user',
        },
      ];

      const response = await this.callHuggingFace(suggestionPrompt, false);
      
      // Parse JSON array from response
      const match = response.match(/\[[\s\S]*?\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as string[];
        return parsed.slice(0, 3);
      }
      
      return [];
    } catch (error) {
      logger.warn('Failed to generate suggestions', { 
        error: error instanceof Error ? error.message : 'Unknown' 
      });
      return [];
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

  private async callHuggingFace(messages: ChatMessage[], stream: boolean = false): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        body: JSON.stringify({
          max_tokens: 256,
          messages,
          model: this.model,
          stream,
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
      this.handleResponseErrors(response);

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async callHuggingFaceStream(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        body: JSON.stringify({
          max_tokens: 512,
          messages,
          model: this.model,
          stream: true,
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
      this.handleResponseErrors(response);

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data) as {
                choices: Array<{ delta: { content?: string } }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullContent.trim();
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

  private handleResponseErrors(response: Response): void {
    if (response.status === 429) {
      logger.warn('HuggingFace rate limited');
      throw LLMError.rateLimited();
    }

    if (response.status === 503) {
      logger.warn('HuggingFace service unavailable');
      throw LLMError.serviceUnavailable();
    }

    if (!response.ok) {
      logger.error('HuggingFace API error', { status: response.status });
      throw new Error(`HuggingFace API error: ${response.status}`);
    }
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
}

// Singleton instance
export const llmService: LLMService = new HuggingFaceLLMService();
