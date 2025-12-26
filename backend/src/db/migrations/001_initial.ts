/**
 * Migration 001: Initial schema
 * Creates conversations and messages tables
 */

import type { Database as SqlJsDatabase } from 'sql.js';

export const up = (db: SqlJsDatabase): void => {
  // Create conversations table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'web',
      metadata TEXT
    );
  `);

  // Create messages table
  db.run(`
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
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
    ON messages(conversation_id);
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at 
    ON messages(created_at);
  `);

  // Create migrations tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);
};

export const down = (db: SqlJsDatabase): void => {
  db.run('DROP TABLE IF EXISTS messages;');
  db.run('DROP TABLE IF EXISTS conversations;');
  db.run('DROP TABLE IF EXISTS migrations;');
};
