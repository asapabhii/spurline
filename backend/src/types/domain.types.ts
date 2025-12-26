/**
 * Core domain models for Spurline chat system
 */

export type MessageSender = 'ai' | 'user';

export type Channel = 'instagram' | 'web' | 'whatsapp';

/**
 * Validate channel value
 */
function isValidChannel(value: string): value is Channel {
  return value === 'instagram' || value === 'web' || value === 'whatsapp';
}

/**
 * Validate message sender value
 */
function isValidMessageSender(value: string): value is MessageSender {
  return value === 'ai' || value === 'user';
}

export class Conversation {
  constructor(
    public readonly id: string,
    public readonly channel: Channel,
    public readonly createdAt: Date,
    public readonly metadata: Record<string, unknown> | null
  ) {}

  /**
   * Create Conversation from database row
   * Validates enum values and safely parses JSON metadata
   */
  static fromRow(row: ConversationRow): Conversation {
    const channel = isValidChannel(row.channel) ? row.channel : 'web';
    let metadata: Record<string, unknown> | null = null;

    if (row.metadata) {
      try {
        const parsed = JSON.parse(row.metadata);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          metadata = parsed as Record<string, unknown>;
        }
      } catch {
        // Invalid JSON - leave as null
      }
    }

    return new Conversation(row.id, channel, new Date(row.created_at), metadata);
  }
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly sender: MessageSender
  ) {}

  /**
   * Create Message from database row
   * Validates enum values
   */
  static fromRow(row: MessageRow): Message {
    const sender = isValidMessageSender(row.sender) ? row.sender : 'user';

    return new Message(
      row.id,
      row.conversation_id,
      row.content,
      new Date(row.created_at),
      sender
    );
  }
}

// Database row types (snake_case to match SQLite)
export interface ConversationRow {
  channel: string;
  created_at: string;
  id: string;
  metadata: string | null;
}

export interface MessageRow {
  content: string;
  conversation_id: string;
  created_at: string;
  id: string;
  sender: string;
}
