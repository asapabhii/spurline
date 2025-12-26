import { env } from '../config/environment.js';
import { LLMError } from '../middleware/error-handler.js';
import type { Message } from '../types/domain.types.js';
import { logger } from '../utils/logger.js';

/**
 * Domain knowledge embedded in system prompt
 * TODO: Externalize to database or config file in production
 */
const DOMAIN_KNOWLEDGE = `
COMPANY INFO:
- Company: Spurline
- Email: support@spurline.com
- Hours: Monday-Friday 9AM-6PM EST

POLICIES:
- Shipping: Free on orders $50+. Standard delivery 5-7 business days. International 10-14 days.
- Returns: 30-day return policy. Items must be unused with tags attached. Refunds processed in 5-7 business days.
- Payment: We accept Visa, Mastercard, Amex, PayPal, and Apple Pay.
- Tracking: Tracking number sent via email within 24 hours of shipment.
`.trim();

const SYSTEM_PROMPT = `You are a helpful customer support agent for Spurline.

RULES:
1. Be concise - keep responses to 1-3 sentences max.
2. Only use information from the knowledge base below.
3. If you don't know something, say "I don't have that information, but you can email us at support@spurline.com"
4. NEVER use placeholders like [insert X] or [X]. Only give real information.
5. NEVER make up policies, prices, or contact details.
6. Match the user's language.

${DOMAIN_KNOWLEDGE}`;

const SUGGESTION_PROMPT = `Generate exactly 3 short follow-up questions (max 5 words each) based on the conversation. Return ONLY a JSON array with no explanation. Example: ["Track my order?","Return policy?","Shipping cost?"]`;

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
  private static readonly MAX_TOKENS = 200;

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
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];

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
    const timeoutId = setTimeout(() => controller.abort(), HuggingFaceLLMService.TIMEOUT_MS);

    try {
      let requestBody: string;
      try {
        requestBody = JSON.stringify({
          model: HuggingFaceLLMService.MODEL,
          messages,
          max_tokens: HuggingFaceLLMService.MAX_TOKENS,
          temperature: 0.7,
          stream: true,
        });
      } catch (error) {
        logger.error('Failed to stringify LLM request body', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        throw new Error('Failed to prepare request');
      }

      const response = await fetch(HuggingFaceLLMService.API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
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
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        try {
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
        } catch (error) {
          logger.warn('Error processing stream chunk', {
            error: error instanceof Error ? error.message : 'Unknown',
          });
          // Continue processing - don't fail entire stream on one bad chunk
        }
      }
    } catch (error) {
      logger.error('Stream processing failed', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Ignore errors releasing lock
      }
    }

    return content.trim();
  }

  private parseSSELine(line: string): string | null {
    if (!line.startsWith('data: ')) return null;

    const data = line.slice(6);
    if (data === '[DONE]') return null;

    try {
      const parsed = JSON.parse(data);
      // Validate structure before accessing
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.choices) &&
        parsed.choices[0] &&
        typeof parsed.choices[0] === 'object' &&
        parsed.choices[0].delta &&
        typeof parsed.choices[0].delta === 'object'
      ) {
        const content = parsed.choices[0].delta.content;
        return typeof content === 'string' ? content : null;
      }
    } catch {
      return null;
    }

    return null;
  }

  private async generateSuggestions(context: string): Promise<string[]> {
    try {
      let requestBody: string;
      try {
        requestBody = JSON.stringify({
          model: HuggingFaceLLMService.MODEL,
          messages: [
            { role: 'system', content: SUGGESTION_PROMPT },
            { role: 'user', content: `Context: "${context.slice(0, 100)}"` },
          ],
          max_tokens: 60,
          temperature: 0.5,
        });
      } catch (error) {
        logger.warn('Failed to stringify suggestions request body', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        return [];
      }

      const response = await fetch(HuggingFaceLLMService.API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) return [];

      let data: {
        choices?: Array<{ message?: { content?: string } }>;
      };

      try {
        data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
      } catch (error) {
        logger.warn('Failed to parse suggestions response JSON', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        return [];
      }

      const text = data.choices?.[0]?.message?.content ?? '';
      const match = text.match(/\[[\s\S]*?\]/);

      if (match) {
        // Safely parse JSON array from LLM response
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
            return parsed.slice(0, 3).map((s) => String(s).slice(0, 35));
          }
        } catch {
          // Invalid JSON - return empty suggestions
        }
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
