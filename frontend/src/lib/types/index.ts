/**
 * Shared types for the frontend
 */

export interface Message {
  content: string;
  createdAt: string;
  id: string;
  sender: 'ai' | 'user';
}

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
}

export interface SendMessageResponse {
  createdAt: string;
  messageId: string;
  reply: string;
  sessionId: string;
}

export interface ConversationHistoryResponse {
  messages: Message[];
  sessionId: string;
}

export interface ConversationStatusResponse {
  isTyping: boolean;
}

export interface ApiError {
  error: string;
  message: string;
}

