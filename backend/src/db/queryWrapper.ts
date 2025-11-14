/**
 * Database Query Wrapper
 * Sprint 10: Code Quality - Common database patterns and utilities
 *
 * Provides wrapper functions for common database operations with:
 * - Automatic error handling and logging
 * - Query performance tracking
 * - Connection pooling
 * - Transaction support
 * - SQL injection prevention
 */

import { query, getPool } from './index';
import { QueryResult } from 'pg';

/**
 * Query execution result with metadata
 */
export interface QueryResponse<T = any> {
  rows: T[];
  rowCount: number;
  executionTime: number;
  cached?: boolean;
}

/**
 * Simple in-memory cache for frequently accessed data
 */
class QueryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly DEFAULT_TTL = 60000; // 1 minute

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  // Periodic cleanup of expired entries
  startCleanup(interval: number = 60000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, interval);
  }
}

const queryCache = new QueryCache();
queryCache.startCleanup();

/**
 * Execute a query with automatic error handling and timing
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = [],
  options: {
    cache?: boolean;
    cacheTTL?: number;
    logSlow?: boolean;
    slowThreshold?: number;
  } = {}
): Promise<QueryResponse<T>> {
  const startTime = Date.now();
  const cacheKey = options.cache ? `${sql}:${JSON.stringify(params)}` : null;

  // Check cache
  if (cacheKey) {
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
        executionTime: Date.now() - startTime
      };
    }
  }

  try {
    const result = await query(sql, params);
    const executionTime = Date.now() - startTime;

    // Log slow queries
    if (options.logSlow && executionTime > (options.slowThreshold || 1000)) {
      console.warn(`[Slow Query] ${executionTime}ms:`, sql.substring(0, 100));
    }

    const response: QueryResponse<T> = {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      executionTime
    };

    // Cache result if requested
    if (cacheKey) {
      queryCache.set(cacheKey, response, options.cacheTTL);
    }

    return response;
  } catch (error) {
    console.error('[DB Error]', error);
    console.error('[Failed Query]', sql);
    console.error('[Parameters]', params);
    throw error;
  }
}

/**
 * Execute a single row query (returns first row or null)
 */
export async function queryOne<T = any>(
  sql: string,
  params: any[] = [],
  options = {}
): Promise<T | null> {
  const result = await executeQuery<T>(sql, params, options);
  return result.rows[0] || null;
}

/**
 * Execute a query expecting multiple rows
 */
export async function queryMany<T = any>(
  sql: string,
  params: any[] = [],
  options = {}
): Promise<T[]> {
  const result = await executeQuery<T>(sql, params, options);
  return result.rows;
}

/**
 * Insert a record and return the inserted row
 */
export async function insert<T = any>(
  table: string,
  data: Record<string, any>,
  returning: string = '*'
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

  const sql = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING ${returning}
  `;

  const result = await queryOne<T>(sql, values);
  if (!result) throw new Error('Insert failed to return data');
  return result;
}

/**
 * Update records and return affected rows
 */
export async function update<T = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>,
  returning: string = '*'
): Promise<T[]> {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);

  const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const whereClause = whereKeys.map((key, i) => `${key} = $${dataKeys.length + i + 1}`).join(' AND ');

  const sql = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING ${returning}
  `;

  return queryMany<T>(sql, [...dataValues, ...whereValues]);
}

/**
 * Delete records and return deleted rows
 */
export async function deleteRows<T = any>(
  table: string,
  where: Record<string, any>,
  returning: string = '*'
): Promise<T[]> {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  const whereClause = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const sql = `
    DELETE FROM ${table}
    WHERE ${whereClause}
    RETURNING ${returning}
  `;

  return queryMany<T>(sql, whereValues);
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  if (!pool) {
    throw new Error('Database not configured');
  }
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Batch insert multiple records efficiently
 */
export async function batchInsert<T = any>(
  table: string,
  records: Record<string, any>[],
  returning: string = '*',
  chunkSize: number = 1000
): Promise<T[]> {
  if (records.length === 0) return [];

  const results: T[] = [];
  const keys = Object.keys(records[0]);

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const values: any[] = [];
    const valueStrings: string[] = [];

    chunk.forEach((record, recordIndex) => {
      const placeholders = keys.map((key, keyIndex) => {
        const paramIndex = recordIndex * keys.length + keyIndex + 1;
        values.push(record[key]);
        return `$${paramIndex}`;
      });
      valueStrings.push(`(${placeholders.join(', ')})`);
    });

    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES ${valueStrings.join(', ')}
      RETURNING ${returning}
    `;

    const chunkResults = await queryMany<T>(sql, values);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Check if a record exists
 */
export async function exists(
  table: string,
  where: Record<string, any>
): Promise<boolean> {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  const whereClause = whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const sql = `
    SELECT EXISTS(
      SELECT 1 FROM ${table}
      WHERE ${whereClause}
    ) as exists
  `;

  const result = await queryOne<{ exists: boolean }>(sql, whereValues);
  return result?.exists || false;
}

/**
 * Count records matching criteria
 */
export async function count(
  table: string,
  where: Record<string, any> = {}
): Promise<number> {
  const whereKeys = Object.keys(where);
  const whereValues = Object.values(where);
  const whereClause = whereKeys.length > 0
    ? `WHERE ${whereKeys.map((key, i) => `${key} = $${i + 1}`).join(' AND ')}`
    : '';

  const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
  const result = await queryOne<{ count: string }>(sql, whereValues);
  return parseInt(result?.count || '0', 10);
}

/**
 * Upsert (insert or update) a record
 */
export async function upsert<T = any>(
  table: string,
  data: Record<string, any>,
  conflictKeys: string[],
  returning: string = '*'
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const updateClause = keys
    .filter(key => !conflictKeys.includes(key))
    .map(key => `${key} = EXCLUDED.${key}`)
    .join(', ');

  const sql = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictKeys.join(', ')})
    DO UPDATE SET ${updateClause}
    RETURNING ${returning}
  `;

  const result = await queryOne<T>(sql, values);
  if (!result) throw new Error('Upsert failed to return data');
  return result;
}

/**
 * Clear the query cache
 */
export function clearCache(): void {
  queryCache.clear();
}

export default {
  executeQuery,
  queryOne,
  queryMany,
  insert,
  update,
  deleteRows,
  transaction,
  batchInsert,
  exists,
  count,
  upsert,
  clearCache
};