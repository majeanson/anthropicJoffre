import { query } from './index';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('Running round stats migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'schema_round_stats.sql'),
      'utf8'
    );

    await query(migrationSQL);

    console.log('✅ Round stats migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
