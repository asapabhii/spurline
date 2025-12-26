/**
 * Core domain models for Spurline chat system
 */

export type MessageSender = 'ai' | 'user';

export type Channel = 'instagram' | 'web' | 'whatsapp';

export class Conversation {
  constructor(
    public readonly id: string,
    public readonly channel: Channel,
    public readonly createdAt: Date,
    public readonly metadata: Record<string, unknown> | null,
  ) {}

  static fromRow(row: ConversationRow): Conversation {
    return new Conversation(
      row.id,
      row.channel as Channel,
      new Date(row.created_at),
      row.metadata ? JSON.parse(row.metadata) : null,
    );
  }
}

export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly sender: MessageSender,
  ) {}

  static fromRow(row: MessageRow): Message {
    return new Message(
      row.id,
      row.conversation_id,
      row.content,
      new Date(row.created_at),
      row.sender as MessageSender,
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

