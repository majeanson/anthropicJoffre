/**
 * Migration Runner Script
 * Sprint 5: Database Integration Completion
 *
 * Usage:
 *   npm run migrate           - Run all pending migrations
 *   npm run migrate:dry-run   - Show which migrations would run
 *   npm run migrate:status    - Show migration status
 */

import { runMigrations, getMigrationStatus } from './migrationSystem';
import { closePool } from './index';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const migrationsDir = join(__dirname, 'migrations');

async function main() {
  const command = process.argv[2] || 'run';

  try {
    switch (command) {
      case 'run':
        await runMigrations(migrationsDir, false);
        break;

      case 'dry-run':
        await runMigrations(migrationsDir, true);
        break;

      case 'status':
        const { applied, pending } = await getMigrationStatus(migrationsDir);
        console.log('\n📊 Migration Status\n');
        console.log(`✅ Applied: ${applied.length} migration(s)`);
        applied.forEach(m => console.log(`   - ${m.version}: ${m.name}`));
        console.log(`\n⏳ Pending: ${pending.length} migration(s)`);
        pending.forEach(m => console.log(`   - ${m.version}: ${m.name}`));
        console.log('');
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log('\nUsage:');
        console.log('  npm run migrate           - Run all pending migrations');
        console.log('  npm run migrate:dry-run   - Show which migrations would run');
        console.log('  npm run migrate:status    - Show migration status');
        process.exit(1);
    }

    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration command failed:', error);
    await closePool();
    process.exit(1);
  }
}

main();
