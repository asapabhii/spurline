import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase, SqlValue } from 'sql.js';

import { env } from './environment.js';
import { logger } from '../utils/logger.js';

let db: SqlJsDatabase | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

/**
 * Initialize sql.js and load/create database
 */
export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) {
    return db;
  }

  try {
    // Initialize SQL.js
    SQL = await initSqlJs();

    const dbPath = env.DATABASE_PATH;
    const dbDir = path.dirname(dbPath);

    // Ensure data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    return db;
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get database instance (must be initialized first)
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save database to file (with error handling)
 * Note: Called after every write operation (consider batching in production)
 */
export function saveDatabase(): void {
  if (!db) return;

  try {
    const dbPath = env.DATABASE_PATH;
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    logger.error('Failed to save database', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - allow app to continue even if save fails
  }
}

/**
 * Close database and save to file
 */
export function closeDatabase(): void {
  if (db) {
    try {
      saveDatabase();
      db.close();
    } catch (error) {
      logger.error('Error closing database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      db = null;
    }
  }
}

/**
 * Helper to run a query and get results as array of objects
 */
export function queryAll<T>(sql: string, params: SqlValue[] = []): T[] {
  try {
    const database = getDatabase();
    const stmt = database.prepare(sql);
    stmt.bind(params);

    const results: T[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as T);
    }
    stmt.free();
    return results;
  } catch (error) {
    logger.error('Database query failed', {
      sql,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Database query failed');
  }
}

/**
 * Run a query and return the first result, or undefined if none
 */
export function queryOne<T>(sql: string, params: SqlValue[] = []): T | undefined {
  try {
    const results = queryAll<T>(sql, params);
    return results[0];
  } catch (error) {
    logger.error('Database query failed', {
      sql,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Database query failed');
  }
}

/**
 * Helper to run a statement (INSERT, UPDATE, DELETE)
 * Automatically saves database after write
 */
export function runStatement(sql: string, params: SqlValue[] = []): void {
  try {
    const database = getDatabase();
    database.run(sql, params);
    // Auto-save after writes
    saveDatabase();
  } catch (error) {
    logger.error('Database statement failed', {
      sql,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Database operation failed');
  }
}
