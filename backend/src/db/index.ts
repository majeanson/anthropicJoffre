import { Pool } from 'pg';
import dotenv from 'dotenv';
import type { GameState } from '../types/game';

dotenv.config();

let pool: Pool | null = null;

const getPool = () => {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
};

export const query = (text: string, params?: any[]) => {
  const dbPool = getPool();
  if (!dbPool) {
    throw new Error('Database not configured. Set DATABASE_URL environment variable.');
  }
  return dbPool.query(text, params);
};

// ============= GAME HISTORY FUNCTIONS =============

/**
 * Save or update game state after each round (incremental saves)
 * Uses UPSERT pattern to update existing games
 */
export const saveOrUpdateGame = async (gameState: GameState, createdAt: Date) => {
  const playerNames = gameState.players.map(p => p.name);
  const playerTeams = gameState.players.map(p => p.teamId || 0);
  const isBotGame = gameState.players.some(p => p.isBot);
  const gameDuration = Math.floor((Date.now() - createdAt.getTime()) / 1000);

  const text = `
    INSERT INTO game_history (
      game_id, team1_score, team2_score, rounds, player_names, player_teams,
      round_history, game_duration_seconds, trump_suit, is_bot_game, is_finished
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (game_id) DO UPDATE SET
      team1_score = EXCLUDED.team1_score,
      team2_score = EXCLUDED.team2_score,
      rounds = EXCLUDED.rounds,
      round_history = EXCLUDED.round_history,
      game_duration_seconds = EXCLUDED.game_duration_seconds,
      last_updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const values = [
    gameState.id,
    gameState.teamScores.team1,
    gameState.teamScores.team2,
    gameState.roundNumber,
    playerNames,
    playerTeams,
    JSON.stringify(gameState.roundHistory),
    gameDuration,
    gameState.trump,
    isBotGame,
    false // is_finished defaults to false for incremental saves
  ];

  const result = await query(text, values);
  return result.rows[0];
};

/**
 * Mark game as finished when someone wins
 */
export const markGameFinished = async (gameId: string, winningTeam: 1 | 2) => {
  const text = `
    UPDATE game_history
    SET is_finished = TRUE,
        winning_team = $2,
        finished_at = CURRENT_TIMESTAMP,
        last_updated_at = CURRENT_TIMESTAMP
    WHERE game_id = $1
    RETURNING *
  `;
  const result = await query(text, [gameId, winningTeam]);
  return result.rows[0];
};

/**
 * Save/update game participants (player performance in this game)
 */
export const saveGameParticipants = async (gameId: string, players: any[]) => {
  // Delete existing participants for this game, then insert fresh data
  await query('DELETE FROM game_participants WHERE game_id = $1', [gameId]);

  const insertText = `
    INSERT INTO game_participants (
      game_id, player_name, team_id, tricks_won, points_earned,
      rounds_played, bet_amount, bet_won, is_bot
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;

  for (const player of players) {
    await query(insertText, [
      gameId,
      player.name,
      player.teamId || 0,
      player.tricksWon || 0,
      player.pointsWon || 0,
      0, // rounds_played (we can track this later)
      null, // bet_amount (if player was the bidder)
      null, // bet_won
      player.isBot || false
    ]);
  }
};

// ============= PLAYER STATS FUNCTIONS =============

interface PlayerStatsUpdate {
  won: boolean;
  tricksWon: number;
  pointsEarned: number;
  betAmount?: number;
  betMade?: boolean;
  withoutTrump?: boolean;
  trumpsPlayed?: number;
  redZerosCollected?: number;
  brownZerosReceived?: number;
}

/**
 * Calculate ELO rating change
 * K-factor = 32 (standard chess rating)
 */
export const calculateEloChange = (
  playerRating: number,
  opponentAvgRating: number,
  won: boolean
): number => {
  const K = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentAvgRating - playerRating) / 400));
  const actualScore = won ? 1 : 0;
  return Math.round(K * (actualScore - expectedScore));
};

/**
 * Update player statistics after a game
 */
export const updatePlayerStats = async (
  playerName: string,
  update: PlayerStatsUpdate,
  eloChange: number
) => {
  // First, get or create player
  const getOrCreate = `
    INSERT INTO player_stats (player_name, is_bot)
    VALUES ($1, FALSE)
    ON CONFLICT (player_name) DO NOTHING
  `;
  await query(getOrCreate, [playerName]);

  // Then update stats
  const text = `
    UPDATE player_stats SET
      games_played = games_played + 1,
      games_won = games_won + CASE WHEN $2 THEN 1 ELSE 0 END,
      games_lost = games_lost + CASE WHEN $2 THEN 0 ELSE 1 END,
      total_tricks_won = total_tricks_won + $3,
      total_points_earned = total_points_earned + $4,
      total_bets_made = total_bets_made + CASE WHEN $5 IS NOT NULL THEN 1 ELSE 0 END,
      bets_won = bets_won + CASE WHEN $6 = TRUE THEN 1 ELSE 0 END,
      bets_lost = bets_lost + CASE WHEN $6 = FALSE THEN 1 ELSE 0 END,
      highest_bet = GREATEST(highest_bet, COALESCE($5, 0)),
      without_trump_bets = without_trump_bets + CASE WHEN $7 = TRUE THEN 1 ELSE 0 END,
      trump_cards_played = trump_cards_played + COALESCE($8, 0),
      red_zeros_collected = red_zeros_collected + COALESCE($9, 0),
      brown_zeros_received = brown_zeros_received + COALESCE($10, 0),
      elo_rating = elo_rating + $11,
      highest_rating = GREATEST(highest_rating, elo_rating + $11),
      updated_at = CURRENT_TIMESTAMP
    WHERE player_name = $1
    RETURNING *
  `;

  const result = await query(text, [
    playerName,
    update.won,
    update.tricksWon,
    update.pointsEarned,
    update.betAmount,
    update.betMade,
    update.withoutTrump,
    update.trumpsPlayed,
    update.redZerosCollected,
    update.brownZerosReceived,
    eloChange
  ]);

  // Update calculated fields (win percentage, averages)
  await query(`
    UPDATE player_stats SET
      win_percentage = ROUND((games_won::numeric / NULLIF(games_played, 0) * 100), 2),
      avg_tricks_per_game = ROUND((total_tricks_won::numeric / NULLIF(games_played, 0)), 2),
      avg_bet_amount = ROUND((
        SELECT AVG(bet_amount)::numeric
        FROM game_participants
        WHERE player_name = $1 AND bet_amount IS NOT NULL
      ), 2)
    WHERE player_name = $1
  `, [playerName]);

  return result.rows[0];
};

/**
 * Get player statistics by name
 */
export const getPlayerStats = async (playerName: string) => {
  const text = `
    SELECT * FROM player_stats
    WHERE player_name = $1 AND is_bot = FALSE
  `;
  const result = await query(text, [playerName]);
  return result.rows[0] || null;
};

/**
 * Get leaderboard (top players by ELO)
 */
export const getLeaderboard = async (limit: number = 100, excludeBots: boolean = true) => {
  const text = `
    SELECT
      player_name,
      games_played,
      games_won,
      games_lost,
      win_percentage,
      elo_rating,
      highest_rating,
      total_tricks_won,
      total_points_earned,
      CASE
        WHEN elo_rating >= 1600 THEN 'Diamond'
        WHEN elo_rating >= 1400 THEN 'Platinum'
        WHEN elo_rating >= 1200 THEN 'Gold'
        WHEN elo_rating >= 1000 THEN 'Silver'
        ELSE 'Bronze'
      END as ranking_tier
    FROM player_stats
    WHERE is_bot = FALSE ${excludeBots ? '' : 'OR is_bot = TRUE'}
    ORDER BY elo_rating DESC, win_percentage DESC
    LIMIT $1
  `;
  const result = await query(text, [limit]);
  return result.rows;
};

/**
 * Get player's game history
 */
export const getPlayerGameHistory = async (playerName: string, limit: number = 20) => {
  const text = `
    SELECT
      gh.game_id,
      gh.winning_team,
      gh.team1_score,
      gh.team2_score,
      gh.rounds,
      gh.is_finished,
      gh.created_at,
      gh.finished_at,
      gp.team_id,
      gp.tricks_won,
      gp.points_earned,
      gp.bet_amount,
      gp.bet_won,
      CASE
        WHEN gh.winning_team = gp.team_id THEN TRUE
        ELSE FALSE
      END as won_game
    FROM game_history gh
    JOIN game_participants gp ON gh.game_id = gp.game_id
    WHERE gp.player_name = $1
    ORDER BY gh.created_at DESC
    LIMIT $2
  `;
  const result = await query(text, [playerName, limit]);
  return result.rows;
};

/**
 * Clean up abandoned games (games not finished after 24 hours)
 */
export const cleanupAbandonedGames = async () => {
  const text = `
    UPDATE game_history
    SET is_finished = TRUE,
        finished_at = CURRENT_TIMESTAMP
    WHERE is_finished = FALSE
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING game_id
  `;
  const result = await query(text);
  return result.rows;
};

// ============= LEGACY FUNCTIONS (keeping for backwards compatibility) =============

export const saveGameHistory = async (
  gameId: string,
  winningTeam: 1 | 2,
  team1Score: number,
  team2Score: number,
  rounds: number
) => {
  // This is now handled by markGameFinished, but keeping for compatibility
  return markGameFinished(gameId, winningTeam);
};

export const getRecentGames = async (limit: number = 10) => {
  const text = `
    SELECT * FROM game_history
    WHERE is_finished = TRUE
    ORDER BY finished_at DESC
    LIMIT $1
  `;
  const result = await query(text, [limit]);
  return result.rows;
};

export default getPool();
