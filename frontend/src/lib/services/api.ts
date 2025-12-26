import type {
  ApiError,
  ConversationHistoryResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '$lib/types';

const API_BASE = '/api/chat';

/**
 * HTTP API Client for chat backend
 * Handles REST communication with proper error handling
 */
class ChatApiClient {
  /**
   * Generic request handler with error normalization
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as ApiError;
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Send a message and receive AI response
   */
  async sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>('/message', {
      body: JSON.stringify(data),
      method: 'POST',
    });
  }

  /**
   * Retrieve conversation history
   */
  async getConversation(sessionId: string): Promise<ConversationHistoryResponse> {
    return this.request<ConversationHistoryResponse>(`/${sessionId}`);
  }
}

// Singleton export
export const api = new ChatApiClient();
