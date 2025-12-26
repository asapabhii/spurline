import type {
  ApiError,
  ConversationHistoryResponse,
  ConversationStatusResponse,
  FeedbackRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '$lib/types';

const API_BASE = '/api/chat';

/**
 * API client for chat backend
 */
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as ApiError;
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
   * Get conversation history
   */
  async getConversation(sessionId: string): Promise<ConversationHistoryResponse> {
    return this.request<ConversationHistoryResponse>(`/${sessionId}`);
  }

  /**
   * Get conversation status (typing indicator)
   */
  async getStatus(sessionId: string): Promise<ConversationStatusResponse> {
    return this.request<ConversationStatusResponse>(`/${sessionId}/status`);
  }

  /**
   * Submit feedback on an AI message
   */
  async submitFeedback(data: FeedbackRequest): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/feedback', {
      body: JSON.stringify(data),
      method: 'POST',
    });
  }

  /**
   * Remove feedback from a message
   */
  async removeFeedback(messageId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/feedback/${messageId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
