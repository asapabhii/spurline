import { queryOne, runStatement } from '../config/database.js';
import { Conversation, type ConversationRow } from '../types/domain.types.js';
import { generateId } from '../utils/id.js';

/**
 * Validate channel value
 */
function isValidChannel(value: string): value is Conversation['channel'] {
  return value === 'instagram' || value === 'web' || value === 'whatsapp';
}

export class ConversationRepository {
  /**
   * Create a new conversation
   */
  create(channel: string = 'web', metadata: Record<string, unknown> | null = null): Conversation {
    const id = generateId();
    const createdAt = new Date().toISOString();
    const validChannel = isValidChannel(channel) ? channel : 'web';

    let metadataJson: string | null = null;
    if (metadata) {
      try {
        metadataJson = JSON.stringify(metadata);
      } catch (error) {
        // If JSON.stringify fails (e.g., circular reference), store null
        // Log but don't crash - metadata is optional
      }
    }

    runStatement(
      'INSERT INTO conversations (id, created_at, channel, metadata) VALUES (?, ?, ?, ?)',
      [id, createdAt, validChannel, metadataJson]
    );

    return new Conversation(id, validChannel, new Date(createdAt), metadata);
  }

  /**
   * Find conversation by ID
   */
  findById(id: string): Conversation | null {
    const row = queryOne<ConversationRow>('SELECT * FROM conversations WHERE id = ?', [id]);

    if (!row) {
      return null;
    }

    return Conversation.fromRow(row);
  }

  /**
   * Check if conversation exists
   */
  exists(id: string): boolean {
    const result = queryOne<{ id: string }>('SELECT id FROM conversations WHERE id = ?', [id]);
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
