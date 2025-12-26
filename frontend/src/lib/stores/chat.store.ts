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
// STORES
// ============================================================

/**
 * Session ID with localStorage persistence
 */
function createSessionStore() {
  const STORAGE_KEY = 'spurline_session';
  
  const initial = typeof window !== 'undefined' 
    ? localStorage.getItem(STORAGE_KEY) 
    : null;
  
  const { subscribe, set } = writable<string | null>(initial);

  return {
    subscribe,
    set: (value: string | null) => {
      if (typeof window !== 'undefined') {
        value ? localStorage.setItem(STORAGE_KEY, value) : localStorage.removeItem(STORAGE_KEY);
      }
      set(value);
    },
    clear: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
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
    onAiTyping: (typing) => isTyping.set(typing),
    
    onStreamStart: ({ messageId }) => {
      streamingMessageId.set(messageId);
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
      messages.update((msgs) => 
        msgs.map((m) => m.id === messageId ? { ...m, content: m.content + chunk } : m)
      );
    },
    
    onStreamEnd: ({ messageId, suggestions: newSuggestions }: StreamEnd) => {
      streamingMessageId.set(null);
      isTyping.set(false);
      suggestions.set(newSuggestions);
      messages.update((msgs) => 
        msgs.map((m) => m.id === messageId ? { ...m, suggestions: newSuggestions } : m)
      );
    },
  });
}

// ============================================================
// ACTIONS
// ============================================================

export const chatActions = {
  /**
   * Load existing conversation
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
      
      // Set suggestions from last AI message
      const lastAi = [...response.messages].reverse().find(m => m.sender === 'ai');
      if (lastAi?.suggestions?.length) {
        suggestions.set(lastAi.suggestions);
      }
    } catch {
      messages.set([]);
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Send a message
   */
  async sendMessage(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) return;

    const sid = get(sessionId);
    
    // Clear previous suggestions
    suggestions.set([]);
    
    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      content: trimmed,
      createdAt: new Date().toISOString(),
      id: tempId,
      sender: 'user',
    };
    
    messages.update((msgs) => [...msgs, userMsg]);
    isTyping.set(true);
    error.set(null);

    try {
      const response = await api.sendMessage({
        message: trimmed,
        sessionId: sid ?? undefined,
      });

      // Update session if new
      if (!sid || sid !== response.sessionId) {
        sessionId.set(response.sessionId);
        joinConversation(response.sessionId);
      }

      // Update temp message ID
      messages.update((msgs) => 
        msgs.map((m) => m.id === tempId ? { ...m, id: `user-${Date.now()}` } : m)
      );

      // If streaming didn't add the AI message, add it now
      const currentMsgs = get(messages);
      if (!currentMsgs.some(m => m.id === response.messageId)) {
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
      messages.update((msgs) => msgs.filter((m) => m.id !== tempId));
      error.set(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      isTyping.set(false);
    }
  },

  /**
   * Send a suggested question
   */
  sendSuggestion(text: string): Promise<void> {
    return this.sendMessage(text);
  },

  /**
   * Clear error
   */
  clearError(): void {
    error.set(null);
  },

  /**
   * Start new conversation
   */
  newConversation(): void {
    const sid = get(sessionId);
    if (sid) leaveConversation(sid);
    
    sessionId.clear();
    messages.set([]);
    suggestions.set([]);
    error.set(null);
  },
};
