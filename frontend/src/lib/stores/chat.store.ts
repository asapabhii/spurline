import { writable, derived, get } from 'svelte/store';
import { api } from '$lib/services/api';
import { initSocket, joinConversation, leaveConversation, type StreamChunk, type StreamEnd } from '$lib/services/socket';
import type { Message } from '$lib/types';

/**
 * Session ID management - persisted to localStorage
 */
function createSessionStore() {
  const STORAGE_KEY = 'spurline_session_id';
  
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
 * Current streaming message ID
 */
export const streamingMessageId = writable<string | null>(null);

/**
 * Current suggestions
 */
export const suggestions = writable<string[]>([]);

/**
 * Derived store: whether chat is empty
 */
export const isEmpty = derived(messages, ($messages) => $messages.length === 0);

/**
 * Initialize socket and set up event handlers
 */
export function initChatSocket(): void {
  initSocket({
    onAiTyping: (typing) => {
      isTyping.set(typing);
    },
    onStreamStart: ({ messageId }) => {
      streamingMessageId.set(messageId);
      // Add placeholder message
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
    onStreamChunk: ({ messageId, chunk }) => {
      messages.update((msgs) => 
        msgs.map((msg) => 
          msg.id === messageId 
            ? { ...msg, content: msg.content + chunk }
            : msg
        )
      );
    },
    onStreamEnd: ({ messageId, suggestions: newSuggestions }) => {
      streamingMessageId.set(null);
      isTyping.set(false);
      suggestions.set(newSuggestions);
      
      // Update message with suggestions
      messages.update((msgs) => 
        msgs.map((msg) => 
          msg.id === messageId 
            ? { ...msg, suggestions: newSuggestions }
            : msg
        )
      );
    },
  });
}

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
      
      // Join socket room
      joinConversation(currentSessionId);
      
      // Set suggestions from last AI message
      const lastAiMessage = [...response.messages].reverse().find(m => m.sender === 'ai');
      if (lastAiMessage?.suggestions) {
        suggestions.set(lastAiMessage.suggestions);
      }
    } catch {
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
    
    // Clear suggestions
    suggestions.set([]);
    
    // Add user message immediately
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
        joinConversation(response.sessionId);
      }

      // Update temp message with real ID
      messages.update((msgs) => 
        msgs.map((msg) => 
          msg.id === tempUserMessage.id 
            ? { ...msg, id: `user-${Date.now()}` }
            : msg
        )
      );

      // Note: AI message comes via socket streaming
      // But if streaming didn't work, add the response
      const currentMsgs = get(messages);
      const hasAiResponse = currentMsgs.some(m => m.id === response.messageId);
      
      if (!hasAiResponse) {
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
      messages.update((msgs) => msgs.filter((m) => m.id !== tempUserMessage.id));
      error.set(e instanceof Error ? e.message : 'Failed to send message. Please try again.');
    } finally {
      isTyping.set(false);
    }
  },

  /**
   * Submit feedback on an AI message
   */
  async submitFeedback(messageId: string, rating: 'up' | 'down'): Promise<void> {
    const currentSessionId = get(sessionId);
    if (!currentSessionId) return;

    try {
      await api.submitFeedback({
        messageId,
        rating,
        sessionId: currentSessionId,
      });

      messages.update((msgs) =>
        msgs.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: rating } : msg
        )
      );
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Failed to submit feedback.');
    }
  },

  /**
   * Remove feedback from a message
   */
  async removeFeedback(messageId: string): Promise<void> {
    try {
      await api.removeFeedback(messageId);

      messages.update((msgs) =>
        msgs.map((msg) =>
          msg.id === messageId ? { ...msg, feedback: undefined } : msg
        )
      );
    } catch (e) {
      error.set(e instanceof Error ? e.message : 'Failed to remove feedback.');
    }
  },

  /**
   * Send a suggested question
   */
  async sendSuggestion(suggestion: string): Promise<void> {
    await this.sendMessage(suggestion);
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
    const currentSessionId = get(sessionId);
    if (currentSessionId) {
      leaveConversation(currentSessionId);
    }
    sessionId.clear();
    messages.set([]);
    suggestions.set([]);
    error.set(null);
  },
};
