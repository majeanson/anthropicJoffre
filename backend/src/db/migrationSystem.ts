/**
 * Database Migration System
 * Sprint 5: Database Integration Completion
 *
 * Provides versioned migration tracking and execution.
 * Migrations are applied in order and tracked in schema_migrations table.
 *
 * Features:
 * - Automatic migration tracking
 * - Sequential execution
 * - Rollback support (future)
 * - Migration history logging
 */

import { query, closePool } from './index';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Migration metadata
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
  applied_at?: Date;
}

/**
 * Ensure schema_migrations table exists
 * This table tracks which migrations have been applied
 */
async function ensureMigrationsTable(): Promise<void> {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64)
    );
  `;

  await query(createTableSql);
  console.log('✅ schema_migrations table ready');
}

/**
 * Get list of applied migrations from database
 */
async function getAppliedMigrations(): Promise<Set<number>> {
  const result = await query('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(result.rows.map(row => row.version));
}

/**
 * Load migration files from migrations directory
 * Files should be named: 001_description.sql, 002_description.sql, etc.
 */
function loadMigrationFiles(migrationsDir: string): Migration[] {
  const files = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Alphabetical sort ensures 001, 002, 003 order

  const migrations: Migration[] = files.map(file => {
    // Extract version from filename (e.g., "003_game_persistence.sql" -> 3)
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}. Expected format: 001_description.sql`);
    }

    const [, versionStr, name] = match;
    const version = parseInt(versionStr, 10);
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');

    return {
      version,
      name,
      sql,
    };
  });

  return migrations;
}

/**
 * Apply a single migration
 */
async function applyMigration(migration: Migration): Promise<void> {
  console.log(`🔄 Applying migration ${migration.version}: ${migration.name}`);

  // Execute migration SQL
  await query(migration.sql);

  // Record migration in schema_migrations table
  await query(
    'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
    [migration.version, migration.name]
  );

  console.log(`✅ Applied migration ${migration.version}: ${migration.name}`);
}

/**
 * Run all pending migrations
 *
 * @param migrationsDir - Path to migrations directory
 * @param dryRun - If true, only shows which migrations would run without applying them
 */
export async function runMigrations(migrationsDir: string, dryRun: boolean = false): Promise<void> {
  try {
    console.log('🔄 Running database migrations...\n');

    // Ensure migrations table exists
    await ensureMigrationsTable();

    // Get applied migrations
    const appliedVersions = await getAppliedMigrations();
    console.log(`📝 ${appliedVersions.size} migration(s) already applied`);

    // Load migration files
    const migrations = loadMigrationFiles(migrationsDir);
    console.log(`📁 Found ${migrations.length} migration file(s)\n`);

    // Filter pending migrations
    const pendingMigrations = migrations.filter(m => !appliedVersions.has(m.version));

    if (pendingMigrations.length === 0) {
      console.log('✨ Database is up to date! No pending migrations.');
      return;
    }

    console.log(`🔄 ${pendingMigrations.length} pending migration(s) to apply:\n`);
    pendingMigrations.forEach(m => {
      console.log(`  - ${m.version}: ${m.name}`);
    });
    console.log('');

    if (dryRun) {
      console.log('🔍 Dry run mode - no migrations applied');
      return;
    }

    // Apply pending migrations in order
    for (const migration of pendingMigrations) {
      await applyMigration(migration);
    }

    console.log(`\n✨ Successfully applied ${pendingMigrations.length} migration(s)!`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Get migration status - shows which migrations are applied and pending
 */
export async function getMigrationStatus(migrationsDir: string): Promise<{
  applied: Migration[];
  pending: Migration[];
}> {
  await ensureMigrationsTable();

  const appliedVersions = await getAppliedMigrations();
  const migrations = loadMigrationFiles(migrationsDir);

  const applied = migrations.filter(m => appliedVersions.has(m.version));
  const pending = migrations.filter(m => !appliedVersions.has(m.version));

  return { applied, pending };
}

/**
 * CLI command to run migrations
 */
if (require.main === module) {
  const migrationsDir = join(__dirname, 'migrations');
  const isDryRun = process.argv.includes('--dry-run');

  runMigrations(migrationsDir, isDryRun)
    .then(() => {
      closePool();
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      closePool();
      process.exit(1);
    });
}
