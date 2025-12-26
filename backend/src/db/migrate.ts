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

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`);

  // Record migration
  const applied = queryAll<{ name: string }>('SELECT name FROM migrations WHERE name = ?', ['001_initial']);
  if (applied.length === 0) {
    runStatement(
      'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
      ['001_initial', new Date().toISOString()]
    );
    logger.info('Migration 001_initial applied');
  } else {
    logger.info('Migration 001_initial already applied');
  }

  logger.info('All migrations completed');
  closeDatabase();
}

runMigrations().catch((error) => {
  logger.error('Migration failed', { error: error instanceof Error ? error.message : 'Unknown error' });
  process.exit(1);
});
