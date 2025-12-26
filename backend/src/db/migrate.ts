import { closeDatabase, getDatabase, initDatabase, runStatement, queryAll } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function runMigrations(): Promise<void> {
  await initDatabase();
  const db = getDatabase();

  // Ensure migrations table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  // Migration 001: Initial schema
  const applied001 = queryAll<{ name: string }>('SELECT name FROM migrations WHERE name = ?', ['001_initial']);
  if (applied001.length === 0) {
    // Create conversations table
    db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        channel TEXT NOT NULL DEFAULT 'web',
        metadata TEXT,
        language TEXT DEFAULT 'en'
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

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`);

    runStatement(
      'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
      ['001_initial', new Date().toISOString()]
    );
    logger.info('Migration 001_initial applied');
  }

  // Migration 002: Feedback table
  const applied002 = queryAll<{ name: string }>('SELECT name FROM migrations WHERE name = ?', ['002_feedback']);
  if (applied002.length === 0) {
    db.run(`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
        created_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);`);

    runStatement(
      'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
      ['002_feedback', new Date().toISOString()]
    );
    logger.info('Migration 002_feedback applied');
  }

  // Migration 003: Suggestions column
  const applied003 = queryAll<{ name: string }>('SELECT name FROM migrations WHERE name = ?', ['003_suggestions']);
  if (applied003.length === 0) {
    // Add suggestions column to messages (JSON array of suggested follow-ups)
    try {
      db.run(`ALTER TABLE messages ADD COLUMN suggestions TEXT;`);
    } catch {
      // Column might already exist
    }

    runStatement(
      'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
      ['003_suggestions', new Date().toISOString()]
    );
    logger.info('Migration 003_suggestions applied');
  }

  logger.info('All migrations completed');
  closeDatabase();
}

runMigrations().catch((error) => {
  logger.error('Migration failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  process.exit(1);
});
