import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '$lib/types';

let socket: Socket | null = null;

export interface StreamChunk {
  chunk: string;
  messageId: string;
}

export interface StreamEnd {
  messageId: string;
  suggestions: string[];
}

export interface SocketCallbacks {
  onAiTyping?: (isTyping: boolean) => void;
  onStreamChunk?: (data: StreamChunk) => void;
  onStreamEnd?: (data: StreamEnd) => void;
  onStreamStart?: (data: { messageId: string }) => void;
}

/**
 * Initialize socket connection
 */
export function initSocket(callbacks: SocketCallbacks): Socket {
  if (socket?.connected) {
    return socket;
  }

  const socketUrl = import.meta.env.DEV 
    ? 'http://localhost:3001' 
    : window.location.origin;

  socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.debug('Socket connected');
  });

  socket.on('disconnect', () => {
    console.debug('Socket disconnected');
  });

  // AI typing indicator
  socket.on(SocketEvents.AI_TYPING, (isTyping: boolean) => {
    callbacks.onAiTyping?.(isTyping);
  });

  // Stream events
  socket.on(SocketEvents.AI_STREAM_START, (data: { messageId: string }) => {
    callbacks.onStreamStart?.(data);
  });

  socket.on(SocketEvents.AI_STREAM_CHUNK, (data: StreamChunk) => {
    callbacks.onStreamChunk?.(data);
  });

  socket.on(SocketEvents.AI_STREAM_END, (data: StreamEnd) => {
    callbacks.onStreamEnd?.(data);
  });

  return socket;
}

/**
 * Join a conversation room
 */
export function joinConversation(conversationId: string): void {
  socket?.emit(SocketEvents.JOIN_CONVERSATION, conversationId);
}

/**
 * Leave a conversation room
 */
export function leaveConversation(conversationId: string): void {
  socket?.emit(SocketEvents.LEAVE_CONVERSATION, conversationId);
}

/**
 * Emit user typing
 */
export function emitUserTyping(conversationId: string): void {
  socket?.emit(SocketEvents.USER_TYPING, conversationId);
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/**
 * Get socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

