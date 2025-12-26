import { getDatabase } from '../config/database.js';
import { Conversation, type ConversationRow } from '../types/domain.types.js';
import { generateId } from '../utils/id.js';

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  create(channel: string = 'web', metadata: Record<string, unknown> | null = null): Conversation {
    const db = getDatabase();
    const id = generateId();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO conversations (id, created_at, channel, metadata)
      VALUES (?, ?, ?, ?)
    `).run(id, createdAt, channel, metadata ? JSON.stringify(metadata) : null);

    return new Conversation(
      id,
      channel as Conversation['channel'],
      new Date(createdAt),
      metadata,
    );
  }

  /**
   * Find conversation by ID
   */
  findById(id: string): Conversation | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as ConversationRow | undefined;

    if (!row) {
      return null;
    }

    return Conversation.fromRow(row);
  }

  /**
   * Check if conversation exists
   */
  exists(id: string): boolean {
    const db = getDatabase();
    const result = db
      .prepare('SELECT 1 FROM conversations WHERE id = ?')
      .get(id);
    
    return result !== undefined;
  }

  /**
   * Get or create conversation by ID
   * If ID is provided and exists, return it; otherwise create new
   */
  getOrCreate(sessionId?: string): Conversation {
    if (sessionId) {
      const existing = this.findById(sessionId);
      if (existing) {
        return existing;
      }
    }
    
    return this.create();
  }
}

// Singleton instance
export const conversationRepository = new ConversationRepository();

