import { queryAll, queryOne, runStatement } from '../config/database.js';
import { Message, type MessageRow, type MessageSender } from '../types/domain.types.js';
import { generateId } from '../utils/id.js';

export interface MessageWithSuggestions extends Message {
  suggestions: string[];
}

export class MessageRepository {
  /**
   * Create a new message
   */
  create(conversationId: string, content: string, sender: MessageSender): Message {
    const id = generateId();
    const createdAt = new Date().toISOString();

    runStatement(
      'INSERT INTO messages (id, conversation_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, conversationId, sender, content, createdAt]
    );

    return new Message(id, conversationId, content, new Date(createdAt), sender);
  }

  /**
   * Create a placeholder message (for streaming)
   */
  createPlaceholder(conversationId: string): string {
    const id = generateId();
    const createdAt = new Date().toISOString();

    runStatement(
      'INSERT INTO messages (id, conversation_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, conversationId, 'ai', '', createdAt]
    );

    return id;
  }

  /**
   * Update placeholder with actual content
   */
  updatePlaceholder(id: string, content: string, suggestions?: string[]): Message {
    runStatement(
      'UPDATE messages SET content = ?, suggestions = ? WHERE id = ?',
      [content, suggestions ? JSON.stringify(suggestions) : null, id]
    );

    const row = queryOne<MessageRow & { suggestions?: string }>(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );

    if (!row) {
      throw new Error(`Message ${id} not found`);
    }

    return Message.fromRow(row);
  }

  /**
   * Get messages for a conversation, ordered by creation time
   */
  findByConversationId(conversationId: string, limit?: number): Message[] {
    let rows: (MessageRow & { suggestions?: string })[];

    if (limit) {
      rows = queryAll<MessageRow & { suggestions?: string }>(
        `SELECT * FROM (
          SELECT * FROM messages 
          WHERE conversation_id = ? 
          ORDER BY created_at DESC 
          LIMIT ?
        ) ORDER BY created_at ASC`,
        [conversationId, limit]
      );
    } else {
      rows = queryAll<MessageRow & { suggestions?: string }>(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
    }

    return rows.map((row) => Message.fromRow(row));
  }

  /**
   * Get messages with suggestions
   */
  findByConversationIdWithSuggestions(conversationId: string): MessageWithSuggestions[] {
    const rows = queryAll<MessageRow & { suggestions?: string }>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [conversationId]
    );

    return rows.map((row) => ({
      ...Message.fromRow(row),
      suggestions: row.suggestions ? JSON.parse(row.suggestions) as string[] : [],
    }));
  }

  /**
   * Count messages in a conversation
   */
  countByConversationId(conversationId: string): number {
    const result = queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    return result?.count ?? 0;
  }

  /**
   * Get the most recent message in a conversation
   */
  findLatest(conversationId: string): Message | null {
    const row = queryOne<MessageRow>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1',
      [conversationId]
    );

    if (!row) {
      return null;
    }

    return Message.fromRow(row);
  }
}

// Singleton instance
export const messageRepository = new MessageRepository();
