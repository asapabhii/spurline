import type Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  // Create conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'web',
      metadata TEXT
    );
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for efficient lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
    ON messages(conversation_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at 
    ON messages(created_at);
  `);

  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);
};

export const down = (db: Database.Database): void => {
  db.exec('DROP TABLE IF EXISTS messages;');
  db.exec('DROP TABLE IF EXISTS conversations;');
  db.exec('DROP TABLE IF EXISTS migrations;');
};

