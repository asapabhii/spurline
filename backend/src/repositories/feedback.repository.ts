import { queryOne, runStatement } from '../config/database.js';
import { generateId } from '../utils/id.js';

export type FeedbackRating = 'down' | 'up';

export interface Feedback {
  conversationId: string;
  createdAt: Date;
  id: string;
  messageId: string;
  rating: FeedbackRating;
}

interface FeedbackRow {
  conversation_id: string;
  created_at: string;
  id: string;
  message_id: string;
  rating: string;
}

export class FeedbackRepository {
  /**
   * Create or update feedback for a message
   */
  upsert(messageId: string, conversationId: string, rating: FeedbackRating): Feedback {
    // Check if feedback already exists
    const existing = queryOne<FeedbackRow>(
      'SELECT * FROM feedback WHERE message_id = ?',
      [messageId]
    );

    if (existing) {
      // Update existing feedback
      runStatement(
        'UPDATE feedback SET rating = ? WHERE message_id = ?',
        [rating, messageId]
      );
      return {
        conversationId: existing.conversation_id,
        createdAt: new Date(existing.created_at),
        id: existing.id,
        messageId: existing.message_id,
        rating,
      };
    }

    // Create new feedback
    const id = generateId();
    const createdAt = new Date().toISOString();

    runStatement(
      'INSERT INTO feedback (id, message_id, conversation_id, rating, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, messageId, conversationId, rating, createdAt]
    );

    return {
      conversationId,
      createdAt: new Date(createdAt),
      id,
      messageId,
      rating,
    };
  }

  /**
   * Get feedback for a message
   */
  findByMessageId(messageId: string): Feedback | null {
    const row = queryOne<FeedbackRow>(
      'SELECT * FROM feedback WHERE message_id = ?',
      [messageId]
    );

    if (!row) {
      return null;
    }

    return {
      conversationId: row.conversation_id,
      createdAt: new Date(row.created_at),
      id: row.id,
      messageId: row.message_id,
      rating: row.rating as FeedbackRating,
    };
  }

  /**
   * Delete feedback for a message
   */
  delete(messageId: string): void {
    runStatement('DELETE FROM feedback WHERE message_id = ?', [messageId]);
  }
}

// Singleton instance
export const feedbackRepository = new FeedbackRepository();

