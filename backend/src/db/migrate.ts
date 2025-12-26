import { getDatabase, closeDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import * as migration001 from './migrations/001_initial.js';

interface Migration {
  down: (db: ReturnType<typeof getDatabase>) => void;
  name: string;
  up: (db: ReturnType<typeof getDatabase>) => void;
}

const migrations: Migration[] = [
  { name: '001_initial', ...migration001 },
];

function runMigrations(): void {
  const db = getDatabase();

  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedMigrations = db
    .prepare('SELECT name FROM migrations')
    .all() as Array<{ name: string }>;
  
  const appliedSet = new Set(appliedMigrations.map((m) => m.name));

  for (const migration of migrations) {
    if (appliedSet.has(migration.name)) {
      logger.info(`Migration ${migration.name} already applied, skipping`);
      continue;
    }

    logger.info(`Running migration: ${migration.name}`);
    
    try {
      db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)').run(
          migration.name,
          new Date().toISOString(),
        );
      })();
      
      logger.info(`Migration ${migration.name} applied successfully`);
    } catch (error) {
      logger.error(`Migration ${migration.name} failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  logger.info('All migrations completed');
  closeDatabase();
}

// Run if executed directly
runMigrations();

