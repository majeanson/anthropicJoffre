import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Prioritize .env.local for local development (avoids Neon quota usage)
// Path: backend/src/db -> backend/.env.local (need to go up 2 levels)
const localEnvPath = resolve(__dirname, '../../.env.local');

if (existsSync(localEnvPath)) {
  console.log('📝 Using local environment (.env.local)');
  // Use override: true to replace DATABASE_URL that was already loaded
  dotenv.config({ path: localEnvPath, override: true });
} else {
  console.log('⚠️  .env.local not found, using default .env (Neon)');
  dotenv.config();
}

// Show which database we're connecting to
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
  console.log(`📍 Database: ${dbUrl}`);
}

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Initializing database...');

    // Create root user for CI/CD compatibility (ignore if exists)
    try {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'root') THEN
            CREATE USER root WITH SUPERUSER PASSWORD 'postgres';
          END IF;
        END $$;
      `);
      console.log('✅ Ensured root user exists');
    } catch (error) {
      console.log('ℹ️  Root user creation skipped (may already exist or insufficient privileges)');
    }

    // 1. Run main schema.sql first
    console.log('📋 Creating main tables from schema.sql...');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✅ Main tables created');

    // 2. Run all migration files in order
    const migrationsDir = join(__dirname, 'migrations');
    let migrationFiles: string[] = [];

    try {
      migrationFiles = readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ensure migrations run in order
    } catch (error) {
      console.log('ℹ️  No migrations directory found, skipping migrations');
    }

    if (migrationFiles.length > 0) {
      console.log(`📋 Running ${migrationFiles.length} migrations...`);

      for (const file of migrationFiles) {
        console.log(`  - Running migration: ${file}`);
        const migration = readFileSync(join(migrationsDir, file), 'utf-8');
        await pool.query(migration);
      }

      console.log('✅ All migrations completed');
    }

    // 3. Verify critical tables exist
    const criticalTables = ['game_history', 'player_stats', 'game_participants', 'active_games', 'game_sessions', 'player_presence'];
    console.log('🔍 Verifying critical tables...');

    for (const table of criticalTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = $1
        );
      `, [table]);

      if (result.rows[0].exists) {
        console.log(`  ✅ Table ${table} exists`);
      } else {
        console.error(`  ❌ Table ${table} is missing!`);
      }
    }

    // 4. Initialize sample data for development (skip in CI)
    if (process.env.NODE_ENV !== 'test' && process.env.CI !== 'true') {
      console.log('📊 Initializing sample data for development...');
      // Could add sample data here if needed
    }

    console.log('✅ Database initialization complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();