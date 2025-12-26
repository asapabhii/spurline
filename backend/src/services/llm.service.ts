import { env } from '../config/environment.js';
import { LLMError } from '../middleware/error-handler.js';
import type { Message } from '../types/domain.types.js';
import { logger } from '../utils/logger.js';

/**
 * Domain knowledge constants - externalize in production
 */
const DOMAIN_KNOWLEDGE = `
KNOWLEDGE BASE:
- Shipping: Free on orders $50+. Standard: 5-7 days. International: 10-14 days.
- Returns: 30 days. Unused, tags attached. Refund in 5-7 days.
- Hours: Mon-Fri 9AM-6PM EST. Email 24/7, reply within 24h.
- Payment: Visa, Mastercard, Amex, PayPal, Apple Pay.
- Tracking: Email within 24h of shipment.
`.trim();

const SYSTEM_PROMPT = `You are a helpful AI assistant for Spurline.
Be concise, accurate, and friendly. Keep responses to 1-2 sentences.
If unsure, say so. Never fabricate information.
Match the user's language in your response.

${DOMAIN_KNOWLEDGE}`;

const SUGGESTION_PROMPT = `Generate exactly 3 short follow-up questions (max 6 words each) based on the conversation context. Return only a JSON array. Example: ["Track my order?","Return policy?","Delivery time?"]`;

/**
 * LLM Service contract
 */
export interface ILLMService {
  generateReply(history: Message[], userMessage: string): Promise<string>;
  generateReplyStream(
    history: Message[], 
    userMessage: string, 
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse>;
}

export interface LLMResponse {
  content: string;
  suggestions: string[];
}

interface ChatMessage {
  content: string;
  role: 'assistant' | 'system' | 'user';
}

/**
 * Hugging Face LLM implementation
 * Production-ready with proper error handling, timeouts, and logging
 */
export class HuggingFaceLLMService implements ILLMService {
  private static readonly API_URL = 'https://router.huggingface.co/v1/chat/completions';
  private static readonly MODEL = 'meta-llama/Llama-3.2-3B-Instruct';
  private static readonly TIMEOUT_MS = 45_000;
  private static readonly MAX_HISTORY = 8;
  private static readonly MAX_TOKENS = 256;

  async generateReply(history: Message[], userMessage: string): Promise<string> {
    const result = await this.generateReplyStream(history, userMessage, () => {});
    return result.content;
  }

  async generateReplyStream(
    history: Message[], 
    userMessage: string,
    onChunk: (chunk: string) => void
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const messages = this.buildMessages(history, userMessage);

    try {
      logger.debug('LLM request started', { 
        historyLength: history.length,
        messageLength: userMessage.length,
      });

      const content = await this.streamCompletion(messages, onChunk);
      const suggestions = await this.generateSuggestions(content);

      logger.info('LLM request completed', { 
        durationMs: Date.now() - startTime,
        responseLength: content.length,
        suggestionsCount: suggestions.length,
      });

      return { content, suggestions };
    } catch (error) {
      logger.error('LLM request failed', {
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw this.normalizeError(error);
    }
  }

  private buildMessages(history: Message[], userMessage: string): ChatMessage[] {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Include limited history for context
    const recentHistory = history.slice(-HuggingFaceLLMService.MAX_HISTORY);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    messages.push({ role: 'user', content: userMessage });
    return messages;
  }

  private async streamCompletion(
    messages: ChatMessage[], 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(), 
      HuggingFaceLLMService.TIMEOUT_MS
    );

    try {
      const response = await fetch(HuggingFaceLLMService.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: HuggingFaceLLMService.MODEL,
          messages,
          max_tokens: HuggingFaceLLMService.MAX_TOKENS,
          temperature: 0.7,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.validateResponse(response);

      return await this.processStream(response, onChunk);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async processStream(
    response: Response, 
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body unavailable');
    }

    const decoder = new TextDecoder();
    let content = '';
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const chunk = this.parseSSELine(line);
          if (chunk) {
            content += chunk;
            onChunk(chunk);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return content.trim();
  }

  private parseSSELine(line: string): string | null {
    if (!line.startsWith('data: ')) return null;
    
    const data = line.slice(6);
    if (data === '[DONE]') return null;

    try {
      const parsed = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      return parsed.choices?.[0]?.delta?.content ?? null;
    } catch {
      return null;
    }
  }

  private async generateSuggestions(context: string): Promise<string[]> {
    try {
      const response = await fetch(HuggingFaceLLMService.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: HuggingFaceLLMService.MODEL,
          messages: [
            { role: 'system', content: SUGGESTION_PROMPT },
            { role: 'user', content: `Context: "${context.slice(0, 150)}"` },
          ],
          max_tokens: 80,
          temperature: 0.5,
        }),
      });

      if (!response.ok) return [];

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const text = data.choices?.[0]?.message?.content ?? '';
      const match = text.match(/\[[\s\S]*?\]/);
      
      if (match) {
        const parsed = JSON.parse(match[0]) as string[];
        return parsed.slice(0, 3).map(s => s.slice(0, 40));
      }
    } catch (error) {
      logger.warn('Failed to generate suggestions', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
    
    return [];
  }

  private validateResponse(response: Response): void {
    if (response.status === 429) {
      throw LLMError.rateLimited();
    }
    if (response.status === 503) {
      throw LLMError.serviceUnavailable();
    }
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
  }

  private normalizeError(error: unknown): LLMError {
    if (error instanceof LLMError) return error;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return LLMError.timeout();
      }
    }
    
    return LLMError.serviceUnavailable();
  }
}

// Singleton export
export const llmService: ILLMService = new HuggingFaceLLMService();
