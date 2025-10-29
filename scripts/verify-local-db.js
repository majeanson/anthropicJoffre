#!/usr/bin/env node

/**
 * Verify local database connection and readiness
 */

const { resolve } = require('path');
const { existsSync } = require('fs');

// Load pg from backend node_modules
const backendPath = resolve(__dirname, '../backend/node_modules/pg');
if (!existsSync(backendPath)) {
  console.error('❌ PostgreSQL module not found. Run: cd backend && npm install');
  process.exit(1);
}

const { Client } = require(backendPath);

// Load .env.local if exists
const dotenvPath = resolve(__dirname, '../backend/node_modules/dotenv');
if (existsSync(dotenvPath)) {
  const dotenv = require(dotenvPath);
  const envLocalPath = resolve(__dirname, '../backend/.env.local');
  if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trickgame';

async function verifyDatabase() {
  console.log('🔍 Verifying local database connection...');
  console.log(`📍 Database URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');

    // Check if tables exist
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = result.rows.map(row => row.table_name);

    if (tables.length === 0) {
      console.warn('⚠️  No tables found. Run: cd backend && npm run db:init');
      process.exit(1);
    }

    console.log(`✅ Found ${tables.length} tables: ${tables.join(', ')}`);

    // Verify critical tables
    const criticalTables = ['game_history', 'player_stats', 'game_participants', 'active_games'];
    const missing = criticalTables.filter(t => !tables.includes(t));

    if (missing.length > 0) {
      console.warn(`⚠️  Missing critical tables: ${missing.join(', ')}`);
      console.warn('   Run: cd backend && npm run db:init');
      process.exit(1);
    }

    console.log('✅ All critical tables present');
    console.log('\n🎉 Local database is ready for testing!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Start local database: npm run db:local');
    console.error('   2. Check if container is running: docker ps');
    console.error('   3. View logs: npm run db:local:logs');
    console.error('   4. Reset database: npm run db:local:reset\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDatabase();
