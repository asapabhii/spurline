import type { Server } from 'socket.io';

import { logger } from '../utils/logger.js';

/**
 * Socket event constants - single source of truth
 */
export const SocketEvents = {
  AI_STREAM_CHUNK: 'ai_stream_chunk',
  AI_STREAM_END: 'ai_stream_end',
  AI_STREAM_START: 'ai_stream_start',
  AI_TYPING: 'ai_typing',
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
} as const;

let io: Server | null = null;

/**
 * Initialize Socket.IO server
 */
export function initSocketService(server: Server): void {
  io = server;

  io.on('connection', (socket) => {
    logger.debug('Client connected', { socketId: socket.id });

    socket.on(SocketEvents.JOIN_CONVERSATION, (conversationId: string) => {
      socket.join(conversationId);
      logger.debug('Client joined conversation', { 
        conversationId, 
        socketId: socket.id,
      });
    });

    socket.on(SocketEvents.LEAVE_CONVERSATION, (conversationId: string) => {
      socket.leave(conversationId);
      logger.debug('Client left conversation', { 
        conversationId, 
        socketId: socket.id,
      });
    });

    socket.on('disconnect', () => {
      logger.debug('Client disconnected', { socketId: socket.id });
    });
  });

  logger.info('Socket.IO server initialized');
}

/**
 * Emit to conversation room
 */
function emit(conversationId: string, event: string, data: unknown): void {
  io?.to(conversationId).emit(event, data);
}

/**
 * Signal AI typing started
 */
export function emitAiTypingStart(conversationId: string): void {
  emit(conversationId, SocketEvents.AI_TYPING, { isTyping: true });
}

/**
 * Signal AI typing stopped
 */
export function emitAiTypingStop(conversationId: string): void {
  emit(conversationId, SocketEvents.AI_TYPING, { isTyping: false });
}

/**
 * Signal stream started
 */
export function emitStreamStart(conversationId: string, messageId: string): void {
  emit(conversationId, SocketEvents.AI_STREAM_START, { messageId });
}

/**
 * Send stream chunk
 */
export function emitStreamChunk(conversationId: string, messageId: string, chunk: string): void {
  emit(conversationId, SocketEvents.AI_STREAM_CHUNK, { messageId, chunk });
}

/**
 * Signal stream ended
 */
export function emitStreamEnd(
  conversationId: string, 
  messageId: string, 
  suggestions: string[],
): void {
  emit(conversationId, SocketEvents.AI_STREAM_END, { messageId, suggestions });
}
