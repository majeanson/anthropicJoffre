/**
 * Quest System Migration Runner
 * Sprint 19: Daily Engagement System
 *
 * Runs migration 022_daily_engagement_system.sql
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import pool from './index';
import { config } from 'dotenv';

// Load environment variables
config();

const runQuestMigration = async () => {
  console.log('🔄 Running Quest System migration (022_daily_engagement_system.sql)...');

  try {
    // Read the migration SQL file
    const migrationPath = resolve(__dirname, 'migrations/022_daily_engagement_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📖 Loaded migration file:', migrationPath);

    if (!pool) {
      console.error('❌ Database pool not initialized');
      process.exit(1);
    }

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Quest System migration completed successfully!');
    console.log('');
    console.log('Created tables:');
    console.log('  - quest_templates (10 default quests)');
    console.log('  - player_daily_quests');
    console.log('  - login_streaks');
    console.log('  - daily_rewards_calendar (30-day progression)');
    console.log('  - player_calendar_progress');
    console.log('  - quest_progress_events');
    console.log('');
    console.log('Added functions:');
    console.log('  - assign_daily_quests(player_name)');
    console.log('  - update_login_streak(player_name)');
    console.log('');
    console.log('Updated player_stats with XP columns:');
    console.log('  - total_xp');
    console.log('  - current_level');
    console.log('  - cosmetic_currency');

    process.exit(0);
  } catch (error: any) {
    // Check if error is due to tables already existing
    if (error.message && error.message.includes('already exists')) {
      console.log('⚠️  Quest System tables already exist. Skipping migration.');
      process.exit(0);
    }

    console.error('❌ Quest System migration failed:', error);
    process.exit(1);
  }
};

runQuestMigration();
