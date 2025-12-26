import { getDatabase } from '../config/database.js';
import { Message, type MessageRow, type MessageSender } from '../types/domain.types.js';
import { generateId } from '../utils/id.js';

export class MessageRepository {
  /**
   * Create a new message
   */
  create(conversationId: string, content: string, sender: MessageSender): Message {
    const db = getDatabase();
    const id = generateId();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, conversationId, sender, content, createdAt);

    return new Message(id, conversationId, content, new Date(createdAt), sender);
  }

  /**
   * Get messages for a conversation, ordered by creation time
   * @param limit Maximum number of messages to return (most recent)
   */
  findByConversationId(conversationId: string, limit?: number): Message[] {
    const db = getDatabase();
    
    let query = `
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at ASC
    `;

    if (limit) {
      // Get the most recent N messages, but return in ASC order
      query = `
        SELECT * FROM (
          SELECT * FROM messages 
          WHERE conversation_id = ? 
          ORDER BY created_at DESC 
          LIMIT ?
        ) ORDER BY created_at ASC
      `;
    }

    const rows = limit
      ? (db.prepare(query).all(conversationId, limit) as MessageRow[])
      : (db.prepare(query).all(conversationId) as MessageRow[]);

    return rows.map((row) => Message.fromRow(row));
  }

  /**
   * Count messages in a conversation
   */
  countByConversationId(conversationId: string): number {
    const db = getDatabase();
    const result = db
      .prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?')
      .get(conversationId) as { count: number };
    
    return result.count;
  }

  /**
   * Get the most recent message in a conversation
   */
  findLatest(conversationId: string): Message | null {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(conversationId) as MessageRow | undefined;

    if (!row) {
      return null;
    }

    return Message.fromRow(row);
  }
}

// Singleton instance
export const messageRepository = new MessageRepository();

