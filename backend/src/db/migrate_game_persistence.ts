import { query } from './index';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('Running game persistence migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '003_game_persistence.sql'),
      'utf8'
    );

    await query(migrationSQL);

    console.log('✅ Game persistence migration completed successfully!');
    console.log('   Created tables: game_sessions, active_games, player_presence');
    console.log('   Created functions: cleanup_expired_sessions(), cleanup_abandoned_games()');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
