/**
 * Database Reset Script
 *
 * This script will:
 * 1. Drop all existing tables
 * 2. Recreate tables with proper schema
 * 3. Add necessary indexes for performance
 * 4. Initialize with clean state
 *
 * Run with: npm run db:reset
 */

import { query } from './index';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const localEnvPath = resolve(__dirname, '../../.env.local');
if (existsSync(localEnvPath)) {
  console.log('📝 Using local environment (.env.local)');
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config({ path: resolve(__dirname, '../../.env') });
}

async function resetDatabase() {
  console.log('🗑️  Starting database reset...\n');

  try {
    // Step 1: Drop existing tables (in correct order due to foreign keys)
    console.log('📦 Dropping existing tables...');

    const dropTables = [
      'DROP TABLE IF EXISTS game_participants CASCADE',
      'DROP TABLE IF EXISTS game_history CASCADE',
      'DROP TABLE IF EXISTS player_stats CASCADE',
      'DROP TABLE IF EXISTS active_games CASCADE',
      'DROP TABLE IF EXISTS player_sessions CASCADE',
      'DROP TABLE IF EXISTS player_presence CASCADE',
    ];

    for (const sql of dropTables) {
      await query(sql);
      console.log(`   ✓ ${sql.match(/DROP TABLE IF EXISTS (\w+)/)?.[1]}`);
    }

    console.log('\n📋 Creating tables...');

    // Step 2: Create player_stats table
    await query(`
      CREATE TABLE IF NOT EXISTS player_stats (
        player_name VARCHAR(50) PRIMARY KEY,

        -- Game-level stats
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        games_lost INTEGER DEFAULT 0,
        games_abandoned INTEGER DEFAULT 0,
        win_percentage DECIMAL(5, 2) DEFAULT 0,
        elo_rating INTEGER DEFAULT 1200,
        highest_rating INTEGER DEFAULT 1200,
        lowest_rating INTEGER DEFAULT 1200,
        current_win_streak INTEGER DEFAULT 0,
        best_win_streak INTEGER DEFAULT 0,
        current_loss_streak INTEGER DEFAULT 0,
        worst_loss_streak INTEGER DEFAULT 0,
        fastest_win INTEGER,
        longest_game INTEGER,
        avg_game_duration_minutes DECIMAL(10, 2) DEFAULT 0,

        -- Round-level stats
        total_rounds_played INTEGER DEFAULT 0,
        rounds_won INTEGER DEFAULT 0,
        rounds_lost INTEGER DEFAULT 0,
        rounds_win_percentage DECIMAL(5, 2) DEFAULT 0,

        -- Trick and point stats
        total_tricks_won INTEGER DEFAULT 0,
        avg_tricks_per_round DECIMAL(10, 2) DEFAULT 0,
        most_tricks_in_round INTEGER DEFAULT 0,
        zero_trick_rounds INTEGER DEFAULT 0,
        total_points_earned INTEGER DEFAULT 0,
        avg_points_per_round DECIMAL(10, 2) DEFAULT 0,
        highest_points_in_round INTEGER DEFAULT 0,

        -- Betting stats
        total_bets_made INTEGER DEFAULT 0,
        total_bet_amount INTEGER DEFAULT 0,
        bets_won INTEGER DEFAULT 0,
        bets_lost INTEGER DEFAULT 0,
        bet_success_rate DECIMAL(5, 2) DEFAULT 0,
        avg_bet_amount DECIMAL(10, 2) DEFAULT 0,
        highest_bet INTEGER DEFAULT 0,
        without_trump_bets INTEGER DEFAULT 0,

        -- Special cards
        trump_cards_played INTEGER DEFAULT 0,
        red_zeros_collected INTEGER DEFAULT 0,
        brown_zeros_received INTEGER DEFAULT 0,

        -- Bot flag
        is_bot BOOLEAN DEFAULT FALSE,

        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ player_stats');

    // Step 3: Create game_history table
    await query(`
      CREATE TABLE IF NOT EXISTS game_history (
        game_id VARCHAR(10) PRIMARY KEY,
        winning_team INTEGER,
        team1_score INTEGER DEFAULT 0,
        team2_score INTEGER DEFAULT 0,
        rounds INTEGER DEFAULT 0,
        round_history JSONB,
        is_finished BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP
      )
    `);
    console.log('   ✓ game_history');

    // Step 4: Create game_participants table
    await query(`
      CREATE TABLE IF NOT EXISTS game_participants (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(10) REFERENCES game_history(game_id) ON DELETE CASCADE,
        player_name VARCHAR(50),
        team_id INTEGER,
        tricks_won INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0,
        bet_amount INTEGER,
        bet_won BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, player_name)
      )
    `);
    console.log('   ✓ game_participants');

    // Step 5: Create active_games table
    await query(`
      CREATE TABLE IF NOT EXISTS active_games (
        game_id VARCHAR(10) PRIMARY KEY,
        status VARCHAR(20) DEFAULT 'waiting',
        player_count INTEGER DEFAULT 0,
        phase VARCHAR(20) DEFAULT 'team_selection',
        round_number INTEGER DEFAULT 1,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        game_state JSONB NOT NULL
      )
    `);
    console.log('   ✓ active_games');

    // Step 6: Create player_sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS player_sessions (
        token VARCHAR(255) PRIMARY KEY,
        game_id VARCHAR(10) NOT NULL,
        player_id VARCHAR(255) NOT NULL,
        player_name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ player_sessions');

    // Step 7: Create player_presence table
    await query(`
      CREATE TABLE IF NOT EXISTS player_presence (
        player_name VARCHAR(50) PRIMARY KEY,
        socket_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'online',
        current_game_id VARCHAR(10),
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ player_presence');

    console.log('\n🔍 Creating indexes for performance...');

    // Create indexes for better query performance
    const indexes = [
      // player_stats indexes
      'CREATE INDEX IF NOT EXISTS idx_player_stats_elo ON player_stats(elo_rating DESC)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_games_won ON player_stats(games_won DESC)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_win_percentage ON player_stats(win_percentage DESC)',
      'CREATE INDEX IF NOT EXISTS idx_player_stats_is_bot ON player_stats(is_bot)',

      // game_history indexes
      'CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_game_history_is_finished ON game_history(is_finished)',

      // game_participants indexes
      'CREATE INDEX IF NOT EXISTS idx_game_participants_game_id ON game_participants(game_id)',
      'CREATE INDEX IF NOT EXISTS idx_game_participants_player_name ON game_participants(player_name)',

      // active_games indexes
      'CREATE INDEX IF NOT EXISTS idx_active_games_status ON active_games(status)',
      'CREATE INDEX IF NOT EXISTS idx_active_games_created_at ON active_games(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_active_games_is_public ON active_games(is_public)',

      // player_sessions indexes
      'CREATE INDEX IF NOT EXISTS idx_player_sessions_game_id ON player_sessions(game_id)',
      'CREATE INDEX IF NOT EXISTS idx_player_sessions_expires_at ON player_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_player_sessions_player_name ON player_sessions(player_name)',

      // player_presence indexes
      'CREATE INDEX IF NOT EXISTS idx_player_presence_status ON player_presence(status)',
      'CREATE INDEX IF NOT EXISTS idx_player_presence_last_activity ON player_presence(last_activity DESC)',
    ];

    for (const sql of indexes) {
      await query(sql);
      const indexName = sql.match(/CREATE INDEX IF NOT EXISTS (\w+)/)?.[1];
      console.log(`   ✓ ${indexName}`);
    }

    console.log('\n🧹 Cleaning up old data...');

    // Step 8: Clean up any orphaned data (shouldn't be any after drop, but just in case)
    await query('DELETE FROM player_sessions WHERE expires_at < NOW()');
    console.log('   ✓ Expired sessions removed');

    await query(`DELETE FROM player_presence WHERE last_activity < NOW() - INTERVAL '24 hours'`);
    console.log('   ✓ Stale presence data removed');

    console.log('\n✅ Database reset complete!');
    console.log('\n📊 Database Statistics:');

    // Show table counts
    const tables = ['player_stats', 'game_history', 'game_participants', 'active_games', 'player_sessions', 'player_presence'];
    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${result.rows[0].count} rows`);
    }

    console.log('\n🎉 Database is now clean and ready for use!');
    console.log('   All tables created with proper indexes');
    console.log('   No corrupted data remaining');
    console.log('   Ready for production use\n');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset if this file is executed directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('📊 Neon Database Usage Note:');
      console.log('   - Tables are now optimized with indexes');
      console.log('   - This reduces compute time for queries');
      console.log('   - Connection pooling will further reduce usage');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default resetDatabase;