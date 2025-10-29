import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Prioritize .env.local for local development (avoids Neon quota usage)
// Path: backend/src/db -> backend/.env.local (need to go up 2 levels)
const localEnvPath = resolve(__dirname, '../../.env.local');
if (existsSync(localEnvPath)) {
  console.log('📝 Using local environment (.env.local)');
  dotenv.config({ path: localEnvPath, override: true });
} else {
  console.log('⚠️  Using default .env (Neon database)');
  dotenv.config();
}

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schema);
    console.log('✅ Database tables created successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
