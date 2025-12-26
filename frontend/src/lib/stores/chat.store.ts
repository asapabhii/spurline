import { writable, derived, get } from 'svelte/store';
import { api } from '$lib/services/api';
import {
  initSocket,
  joinConversation,
  leaveConversation,
  type StreamChunk,
  type StreamEnd,
} from '$lib/services/socket';
import type { Message } from '$lib/types';

// ============================================================
// SESSION STORAGE
// ============================================================

const SESSION_KEY = 'spurline_session';

function loadSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveSession(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(SESSION_KEY, id);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Silent fail for storage errors
  }
}

// ============================================================
// STORES
// ============================================================

function createSessionStore() {
  const { subscribe, set } = writable<string | null>(loadSession());

  return {
    subscribe,
    set: (value: string | null) => {
      saveSession(value);
      set(value);
    },
    clear: () => {
      saveSession(null);
      set(null);
    },
  };
}

export const sessionId = createSessionStore();
export const messages = writable<Message[]>([]);
export const isLoading = writable(false);
export const error = writable<string | null>(null);
export const isTyping = writable(false);
export const streamingMessageId = writable<string | null>(null);
export const suggestions = writable<string[]>([]);

// Derived stores
export const isEmpty = derived(messages, ($m) => $m.length === 0);
export const isStreaming = derived(streamingMessageId, ($id) => $id !== null);

// ============================================================
// SOCKET INITIALIZATION
// ============================================================

export function initChatSocket(): void {
  initSocket({
    onAiTyping: (typing) => {
      isTyping.set(typing);
    },

    onStreamStart: ({ messageId }) => {
      streamingMessageId.set(messageId);
      isTyping.set(false); // Stop typing indicator when streaming starts

      // Add placeholder message for streaming
      messages.update((msgs) => [
        ...msgs,
        {
          content: '',
          createdAt: new Date().toISOString(),
          id: messageId,
          sender: 'ai',
        },
      ]);
    },

    onStreamChunk: ({ messageId, chunk }: StreamChunk) => {
      // Append chunk to existing message
      messages.update((msgs) =>
        msgs.map((m) => (m.id === messageId ? { ...m, content: m.content + chunk } : m))
      );
    },

    onStreamEnd: ({ messageId, suggestions: newSuggestions }: StreamEnd) => {
      streamingMessageId.set(null);
      isTyping.set(false);
      suggestions.set(newSuggestions);

      // Update message with suggestions
      messages.update((msgs) =>
        msgs.map((m) => (m.id === messageId ? { ...m, suggestions: newSuggestions } : m))
      );
    },
  });
}

// ============================================================
// ACTIONS
// ============================================================

export const chatActions = {
  /**
   * Load existing conversation from server
   */
  async loadConversation(): Promise<void> {
    const sid = get(sessionId);
    if (!sid) return;

    try {
      isLoading.set(true);
      error.set(null);

      const response = await api.getConversation(sid);
      messages.set(response.messages);
      joinConversation(sid);

      // Restore suggestions from last AI message
      const lastAiMsg = [...response.messages].reverse().find((m) => m.sender === 'ai');

      if (lastAiMsg?.suggestions?.length) {
        suggestions.set(lastAiMsg.suggestions);
      }
    } catch {
      // Session expired or not found - start fresh
      sessionId.clear();
      messages.set([]);
      suggestions.set([]);
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Send a message to the agent
   */
  async sendMessage(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    const sid = get(sessionId);

    // Clear previous suggestions
    suggestions.set([]);
    error.set(null);

    // Add optimistic user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      content: trimmed,
      createdAt: new Date().toISOString(),
      id: tempId,
      sender: 'user',
    };

    messages.update((msgs) => [...msgs, userMsg]);
    isTyping.set(true);

    try {
      const response = await api.sendMessage({
        message: trimmed,
        sessionId: sid ?? undefined,
      });

      // Update session if new or different
      if (!sid || sid !== response.sessionId) {
        sessionId.set(response.sessionId);
        joinConversation(response.sessionId);
      }

      // Update temp message with real ID
      messages.update((msgs) =>
        msgs.map((m) => (m.id === tempId ? { ...m, id: `user-${Date.now()}` } : m))
      );

      // If streaming didn't add the AI message, add it now (fallback)
      const currentMsgs = get(messages);
      const hasAiMessage = currentMsgs.some((m) => m.id === response.messageId);

      if (!hasAiMessage) {
        messages.update((msgs) => [
          ...msgs,
          {
            content: response.reply,
            createdAt: response.createdAt,
            id: response.messageId,
            sender: 'ai',
            suggestions: response.suggestions,
          },
        ]);
        suggestions.set(response.suggestions);
      }
    } catch (e) {
      // Remove optimistic message on error
      messages.update((msgs) => msgs.filter((m) => m.id !== tempId));
      error.set(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      isTyping.set(false);
    }
  },

  /**
   * Send a suggested follow-up question
   */
  sendSuggestion(text: string): Promise<void> {
    return this.sendMessage(text);
  },

  /**
   * Clear error message
   */
  clearError(): void {
    error.set(null);
  },

  /**
   * Start a new conversation
   */
  newConversation(): void {
    const sid = get(sessionId);
    if (sid) leaveConversation(sid);

    sessionId.clear();
    messages.set([]);
    suggestions.set([]);
    error.set(null);
    isTyping.set(false);
    streamingMessageId.set(null);
  },
};
