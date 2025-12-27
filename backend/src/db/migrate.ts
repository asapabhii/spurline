import { initDatabase, runStatement, queryAll, executeRaw } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function runMigrations(): Promise<void> {
  await initDatabase();

  // Ensure migrations table exists (PostgreSQL syntax)
  await executeRaw(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL
    );
  `);

  // Migration 001: Initial schema
  const applied001 = await queryAll<{ name: string }>(
    "SELECT name FROM migrations WHERE name = $1",
    ['001_initial']
  );
  if (applied001.length === 0) {
    // Create conversations table
    await executeRaw(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP NOT NULL,
        channel VARCHAR(50) NOT NULL DEFAULT 'web',
        metadata TEXT,
        language VARCHAR(10) DEFAULT 'en'
      );
    `);

    // Create messages table
    await executeRaw(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        conversation_id VARCHAR(255) NOT NULL,
        sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        suggestions TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await executeRaw(
      `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);`
    );
    await executeRaw(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);`);

    await runStatement(
      'INSERT INTO migrations (name, applied_at) VALUES ($1, $2)',
      ['001_initial', new Date().toISOString()]
    );
    logger.info('Migration 001_initial applied');
  }

  // Migration 002: Feedback table
  const applied002 = await queryAll<{ name: string }>(
    "SELECT name FROM migrations WHERE name = $1",
    ['002_feedback']
  );
  if (applied002.length === 0) {
    await executeRaw(`
      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(255) PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL,
        conversation_id VARCHAR(255) NOT NULL,
        rating VARCHAR(10) NOT NULL CHECK (rating IN ('up', 'down')),
        created_at TIMESTAMP NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);

    await executeRaw(
      `CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);`
    );

    await runStatement('INSERT INTO migrations (name, applied_at) VALUES ($1, $2)', [
      '002_feedback',
      new Date().toISOString(),
    ]);
    logger.info('Migration 002_feedback applied');
  }

  // Migration 003: Suggestions column (already added in 001, but keeping for compatibility)
  const applied003 = await queryAll<{ name: string }>(
    "SELECT name FROM migrations WHERE name = $1",
    ['003_suggestions']
  );
  if (applied003.length === 0) {
    // Check if column exists
    try {
      await executeRaw(`ALTER TABLE messages ADD COLUMN suggestions TEXT;`);
    } catch (error: unknown) {
      // Column might already exist - that's fine
      if (
        error instanceof Error &&
        !error.message.includes('already exists') &&
        !error.message.includes('duplicate column')
      ) {
        throw error;
      }
    }

    await runStatement('INSERT INTO migrations (name, applied_at) VALUES ($1, $2)', [
      '003_suggestions',
      new Date().toISOString(),
    ]);
    logger.info('Migration 003_suggestions applied');
  }

  logger.info('All migrations completed');
}

runMigrations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  });
