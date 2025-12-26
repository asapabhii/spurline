import { writable, derived, get } from 'svelte/store';
import { api } from '$lib/services/api';
import type { Message } from '$lib/types';

/**
 * Session ID management - persisted to localStorage
 */
function createSessionStore() {
  const STORAGE_KEY = 'spurline_session_id';
  
  // Initialize from localStorage if available
  const initial = typeof window !== 'undefined' 
    ? localStorage.getItem(STORAGE_KEY) 
    : null;
  
  const { subscribe, set } = writable<string | null>(initial);

  return {
    subscribe,
    set: (value: string | null) => {
      if (typeof window !== 'undefined') {
        if (value) {
          localStorage.setItem(STORAGE_KEY, value);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
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

/**
 * Messages store
 */
export const messages = writable<Message[]>([]);

/**
 * Loading state
 */
export const isLoading = writable(false);

/**
 * Error state
 */
export const error = writable<string | null>(null);

/**
 * Typing indicator state
 */
export const isTyping = writable(false);

/**
 * Derived store: whether chat is empty
 */
export const isEmpty = derived(messages, ($messages) => $messages.length === 0);

/**
 * Chat actions
 */
export const chatActions = {
  /**
   * Load existing conversation from backend
   */
  async loadConversation(): Promise<void> {
    const currentSessionId = get(sessionId);
    if (!currentSessionId) return;

    try {
      isLoading.set(true);
      error.set(null);
      
      const response = await api.getConversation(currentSessionId);
      messages.set(response.messages);
    } catch (e) {
      // Conversation not found is not an error - just means new session
      console.debug('No existing conversation found');
      messages.set([]);
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Send a message and get AI response
   */
  async sendMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    const currentSessionId = get(sessionId);
    
    // Optimistically add user message
    const tempUserMessage: Message = {
      content,
      createdAt: new Date().toISOString(),
      id: `temp-${Date.now()}`,
      sender: 'user',
    };
    
    messages.update((msgs) => [...msgs, tempUserMessage]);
    isTyping.set(true);
    error.set(null);

    try {
      const response = await api.sendMessage({
        message: content,
        sessionId: currentSessionId ?? undefined,
      });

      // Update session ID if new
      if (!currentSessionId || currentSessionId !== response.sessionId) {
        sessionId.set(response.sessionId);
      }

      // Replace temp message and add AI response
      messages.update((msgs) => {
        const filtered = msgs.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          {
            content,
            createdAt: tempUserMessage.createdAt,
            id: `user-${Date.now()}`,
            sender: 'user' as const,
          },
          {
            content: response.reply,
            createdAt: response.createdAt,
            id: response.messageId,
            sender: 'ai' as const,
          },
        ];
      });
    } catch (e) {
      // Remove optimistic message on error
      messages.update((msgs) => msgs.filter((m) => m.id !== tempUserMessage.id));
      error.set(e instanceof Error ? e.message : 'Failed to send message. Please try again.');
    } finally {
      isTyping.set(false);
    }
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
    sessionId.clear();
    messages.set([]);
    error.set(null);
  },
};

