import { AppError } from '../middleware/error-handler.js';
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
  async create(conversationId: string, content: string, sender: MessageSender): Promise<Message> {
    const id = generateId();
    const createdAt = new Date().toISOString();

    await runStatement(
      'INSERT INTO messages (id, conversation_id, sender, content, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, conversationId, sender, content, createdAt]
    );

    return new Message(id, conversationId, content, new Date(createdAt), sender);
  }

  /**
   * Create a placeholder message (for streaming)
   * Creates empty message that will be updated as chunks arrive
   */
  async createPlaceholder(conversationId: string): Promise<string> {
    const id = generateId();
    const createdAt = new Date().toISOString();

    await runStatement(
      'INSERT INTO messages (id, conversation_id, sender, content, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, conversationId, 'ai', '', createdAt]
    );

    return id;
  }

  /**
   * Update placeholder message with final content after streaming completes
   * Note: Suggestions are ephemeral (sent via WebSocket, not persisted)
   */
  async updatePlaceholder(id: string, content: string, _suggestions?: string[]): Promise<Message> {
    await runStatement('UPDATE messages SET content = $1 WHERE id = $2', [content, id]);

    const row = await queryOne<MessageRow>('SELECT * FROM messages WHERE id = $1', [id]);

    if (!row) {
      throw new AppError(500, 'Failed to update message', 'DATABASE_ERROR');
    }

    return Message.fromRow(row);
  }

  /**
   * Get messages for a conversation, ordered by creation time
   */
  async findByConversationId(conversationId: string, limit?: number): Promise<Message[]> {
    let rows: MessageRow[];

    if (limit) {
      rows = await queryAll<MessageRow>(
        `SELECT * FROM (
          SELECT * FROM messages 
          WHERE conversation_id = $1 
          ORDER BY created_at DESC 
          LIMIT $2
        ) AS subquery ORDER BY created_at ASC`,
        [conversationId, limit]
      );
    } else {
      rows = await queryAll<MessageRow>(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
    }

    return rows.map((row) => Message.fromRow(row));
  }

  /**
   * Get messages with suggestions
   * Note: Suggestions are ephemeral (generated per-request, not stored in DB)
   */
  async findByConversationIdWithSuggestions(
    conversationId: string
  ): Promise<MessageWithSuggestions[]> {
    const rows = await queryAll<MessageRow>(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    return rows.map((row) => ({
      ...Message.fromRow(row),
      suggestions: [], // Suggestions are ephemeral, not stored
    }));
  }

  /**
   * Count messages in a conversation
   */
  async countByConversationId(conversationId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1',
      [conversationId]
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get the most recent message in a conversation
   */
  async findLatest(conversationId: string): Promise<Message | null> {
    const row = await queryOne<MessageRow>(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1',
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
