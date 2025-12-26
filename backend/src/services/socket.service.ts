import type { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';

import { logger } from '../utils/logger.js';

let io: SocketServer | null = null;

/**
 * Socket.IO events
 */
export const SocketEvents = {
  // Client -> Server
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',
  USER_TYPING: 'user_typing',
  
  // Server -> Client
  AI_TYPING: 'ai_typing',
  AI_STREAM_CHUNK: 'ai_stream_chunk',
  AI_STREAM_END: 'ai_stream_end',
  AI_STREAM_START: 'ai_stream_start',
  ERROR: 'error',
  MESSAGE_RECEIVED: 'message_received',
} as const;

/**
 * Initialize Socket.IO server
 */
export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      credentials: true,
      origin: process.env['NODE_ENV'] === 'production' 
        ? process.env['FRONTEND_URL'] 
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    },
    pingTimeout: 60000,
  });

  io.on('connection', handleConnection);

  logger.info('Socket.IO server initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
export function getSocketServer(): SocketServer | null {
  return io;
}

/**
 * Handle new socket connection
 */
function handleConnection(socket: Socket): void {
  logger.debug('Client connected', { socketId: socket.id });

  // Join conversation room
  socket.on(SocketEvents.JOIN_CONVERSATION, (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    logger.debug('Client joined conversation', { conversationId, socketId: socket.id });
  });

  // Leave conversation room
  socket.on(SocketEvents.LEAVE_CONVERSATION, (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    logger.debug('Client left conversation', { conversationId, socketId: socket.id });
  });

  // User typing indicator
  socket.on(SocketEvents.USER_TYPING, (conversationId: string) => {
    socket.to(`conversation:${conversationId}`).emit(SocketEvents.USER_TYPING);
  });

  socket.on('disconnect', () => {
    logger.debug('Client disconnected', { socketId: socket.id });
  });
}

/**
 * Emit AI typing start to conversation
 */
export function emitAiTypingStart(conversationId: string): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(SocketEvents.AI_TYPING, true);
  }
}

/**
 * Emit AI typing stop to conversation
 */
export function emitAiTypingStop(conversationId: string): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(SocketEvents.AI_TYPING, false);
  }
}

/**
 * Emit stream start
 */
export function emitStreamStart(conversationId: string, messageId: string): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(SocketEvents.AI_STREAM_START, { messageId });
  }
}

/**
 * Emit stream chunk
 */
export function emitStreamChunk(conversationId: string, messageId: string, chunk: string): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(SocketEvents.AI_STREAM_CHUNK, { chunk, messageId });
  }
}

/**
 * Emit stream end
 */
export function emitStreamEnd(conversationId: string, messageId: string, suggestions?: string[]): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(SocketEvents.AI_STREAM_END, { 
      messageId,
      suggestions: suggestions ?? [],
    });
  }
}

/**
 * Emit message received (for non-streaming)
 */
export function emitMessageReceived(conversationId: string, message: {
  content: string;
  createdAt: string;
  id: string;
  sender: string;
  suggestions?: string[];
}): void {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(SocketEvents.MESSAGE_RECEIVED, message);
  }
}

