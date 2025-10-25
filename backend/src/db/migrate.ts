import { query } from './index.js';
import { config } from 'dotenv';
config();

const runMigration = async () => {
  console.log('🔄 Running database migrations...');

  try {
    // Add game_state_snapshot column for crash recovery
    const addSnapshotColumn = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='game_history' AND column_name='game_state_snapshot') THEN
          ALTER TABLE game_history ADD COLUMN game_state_snapshot JSONB;
          RAISE NOTICE 'Added game_state_snapshot column';
        END IF;
      END $$;
    `;

    await query(addSnapshotColumn);
    console.log('✅ Migration: Added game_state_snapshot column');

    // Create indexes for better query performance
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_game_history_finished ON game_history(is_finished, created_at)",
      "CREATE INDEX IF NOT EXISTS idx_game_history_last_updated ON game_history(is_finished, last_updated_at)",
      "CREATE INDEX IF NOT EXISTS idx_game_history_game_id ON game_history(game_id)"
    ];

    for (const indexSql of indexes) {
      await query(indexSql);
    }
    console.log('✅ Migration: Added performance indexes');

    console.log('✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();