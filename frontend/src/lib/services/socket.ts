import { io, Socket } from 'socket.io-client';
import { env } from '$env/dynamic/public';
import { SocketEvents } from '$lib/types';

const BACKEND_URL = env.PUBLIC_BACKEND_URL || 'http://localhost:3001';

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
 * Initialize Socket.IO connection with event handlers
 */
export function initSocket(callbacks: SocketCallbacks): void {
  if (socket?.connected) return;

  socket = io(BACKEND_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.debug('[Socket] Connected');
  });

  socket.on('disconnect', () => {
    console.debug('[Socket] Disconnected');
  });

  socket.on(SocketEvents.AI_TYPING, (data: { isTyping: boolean }) => {
    callbacks.onAiTyping?.(data.isTyping);
  });

  socket.on(SocketEvents.AI_STREAM_START, (data: { messageId: string }) => {
    callbacks.onStreamStart?.(data);
  });

  socket.on(SocketEvents.AI_STREAM_CHUNK, (data: StreamChunk) => {
    callbacks.onStreamChunk?.(data);
  });

  socket.on(SocketEvents.AI_STREAM_END, (data: StreamEnd) => {
    callbacks.onStreamEnd?.(data);
  });
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
 * Disconnect socket
 */
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
