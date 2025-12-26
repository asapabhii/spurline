import { z } from 'zod';

/**
 * API Request/Response DTOs
 */

// POST /api/chat/message
export const sendMessageRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long. Please keep it under 2000 characters.'),
  sessionId: z.string().uuid().optional(),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export interface SendMessageResponse {
  createdAt: string;
  messageId: string;
  reply: string;
  sessionId: string;
  suggestions: string[];
}

// GET /api/chat/:sessionId
export interface ConversationHistoryResponse {
  messages: Array<{
    content: string;
    createdAt: string;
    id: string;
    sender: 'ai' | 'user';
    suggestions?: string[];
  }>;
  sessionId: string;
}

// GET /api/chat/:sessionId/status
export interface ConversationStatusResponse {
  isTyping: boolean;
  // Extensible for future: agentOnline, queuePosition, etc.
}

// Error response
export interface ApiErrorResponse {
  error: string;
  message: string;
}
