import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

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
 * Initialize Socket.IO server from HTTP server
 */
export function initSocketServer(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: {
      origin: process.env['NODE_ENV'] === 'production' ? process.env['FRONTEND_URL'] : true,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug('Client connected', { socketId: socket.id });

    socket.on(SocketEvents.JOIN_CONVERSATION, (conversationId: unknown) => {
      try {
        if (typeof conversationId !== 'string' || !conversationId.trim()) {
          logger.warn('Invalid conversationId in JOIN_CONVERSATION', { socketId: socket.id });
          return;
        }
        socket.join(conversationId);
        logger.debug('Client joined conversation', {
          conversationId,
          socketId: socket.id,
        });
      } catch (error) {
        logger.error('Error joining conversation', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    });

    socket.on(SocketEvents.LEAVE_CONVERSATION, (conversationId: unknown) => {
      try {
        if (typeof conversationId !== 'string' || !conversationId.trim()) {
          logger.warn('Invalid conversationId in LEAVE_CONVERSATION', { socketId: socket.id });
          return;
        }
        socket.leave(conversationId);
        logger.debug('Client left conversation', {
          conversationId,
          socketId: socket.id,
        });
      } catch (error) {
        logger.error('Error leaving conversation', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Client disconnected', { socketId: socket.id });
    });

    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    });
  });

  logger.info('Socket.IO server initialized');
}

/**
 * Emit socket event to all clients in a conversation room
 * Wraps emit in try/catch to prevent crashes if connection is closed
 */
function emit(conversationId: string, event: string, data: unknown): void {
  if (!io) return;

  try {
    io.to(conversationId).emit(event, data);
  } catch (error) {
    logger.error('Failed to emit socket event', {
      conversationId,
      event,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
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
  suggestions: string[]
): void {
  emit(conversationId, SocketEvents.AI_STREAM_END, { messageId, suggestions });
}
