/**
 * Core domain types for Spurline Agent
 */

export interface Message {
  content: string;
  createdAt: string;
  id: string;
  sender: 'ai' | 'user';
  suggestions?: string[];
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
  suggestions: string[];
}

export interface ConversationHistoryResponse {
  messages: Message[];
  sessionId: string;
}

export interface ApiError {
  error: string;
  message: string;
}

/**
 * WebSocket event constants
 */
export const SocketEvents = {
  AI_STREAM_CHUNK: 'ai_stream_chunk',
  AI_STREAM_END: 'ai_stream_end',
  AI_STREAM_START: 'ai_stream_start',
  AI_TYPING: 'ai_typing',
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
} as const;

export type SocketEventType = typeof SocketEvents[keyof typeof SocketEvents];
