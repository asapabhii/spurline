import { Pool, PoolClient } from 'pg';

import { env } from './environment.js';
import { logger } from '../utils/logger.js';

let pool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool
 */
export async function initDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Test connection
    const client = await pool.connect();
    client.release();

    logger.info('Database connected successfully');
    return pool;
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get database pool (must be initialized first)
 */
export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      pool = null;
    }
  }
}

/**
 * Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
 */
function convertParams(sql: string, params: unknown[]): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Helper to run a query and get results as array of objects
 */
export async function queryAll<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    const database = getDatabase();
    const pgSql = convertParams(sql, params);
    const result = await database.query(pgSql, params);
    return result.rows as T[];
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
export async function queryOne<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  try {
    const results = await queryAll<T>(sql, params);
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
 */
export async function runStatement(sql: string, params: unknown[] = []): Promise<void> {
  try {
    const database = getDatabase();
    const pgSql = convertParams(sql, params);
    await database.query(pgSql, params);
  } catch (error) {
    logger.error('Database statement failed', {
      sql,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new Error('Database operation failed');
  }
}

/**
 * Execute a raw SQL query (for DDL statements like CREATE TABLE)
 */
export async function executeRaw(sql: string): Promise<void> {
  try {
    const database = getDatabase();
    await database.query(sql);
  } catch (error) {
    logger.error('Database raw query failed', {
      sql,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
