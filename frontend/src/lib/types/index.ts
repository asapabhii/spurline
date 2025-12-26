/**
 * Shared types for the frontend
 */

export interface Message {
  content: string;
  createdAt: string;
  feedback?: 'down' | 'up';
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

export interface ConversationStatusResponse {
  isTyping: boolean;
}

export interface FeedbackRequest {
  messageId: string;
  rating: 'down' | 'up';
  sessionId: string;
}

export interface ApiError {
  error: string;
  message: string;
}

/**
 * Socket events
 */
export const SocketEvents = {
  AI_STREAM_CHUNK: 'ai_stream_chunk',
  AI_STREAM_END: 'ai_stream_end',
  AI_STREAM_START: 'ai_stream_start',
  AI_TYPING: 'ai_typing',
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  MESSAGE_RECEIVED: 'message_received',
  USER_TYPING: 'user_typing',
} as const;
