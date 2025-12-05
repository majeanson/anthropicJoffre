/**
 * Side Bets Database Operations
 *
 * CRUD operations for the side betting system.
 * Players and spectators can create coin bets on various game outcomes.
 */

import { query } from './index';
import type {
  SideBet,
  SideBetType,
  PresetBetType,
  SideBetStatus,
  SideBetResolution,
  ResolutionTiming,
} from '../types/game';

// ==================== SIDE BET CRUD ====================

/**
 * Create a new side bet
 */
export const createSideBet = async (
  gameId: string,
  creatorName: string,
  betType: SideBetType,
  amount: number,
  options: {
    presetType?: PresetBetType;
    customDescription?: string;
    resolutionTiming?: ResolutionTiming;
    prediction?: string;
    targetPlayer?: string;
    roundNumber?: number;
    trickNumber?: number;
  }
): Promise<SideBet | null> => {
  const text = `
    INSERT INTO side_bets (
      game_id, bet_type, preset_type, custom_description, resolution_timing,
      creator_name, amount, prediction, target_player, round_number, trick_number
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    gameId,
    betType,
    options.presetType || null,
    options.customDescription || null,
    options.resolutionTiming || 'manual',
    creatorName,
    amount,
    options.prediction || null,
    options.targetPlayer || null,
    options.roundNumber || null,
    options.trickNumber || null,
  ];

  const result = await query(text, values);
  return result.rows[0] ? mapRowToSideBet(result.rows[0]) : null;
};

/**
 * Get all side bets for a game
 */
export const getSideBetsByGame = async (gameId: string): Promise<SideBet[]> => {
  const text = `
    SELECT * FROM side_bets
    WHERE game_id = $1
    ORDER BY created_at DESC
  `;
  const result = await query(text, [gameId]);
  return result.rows.map(mapRowToSideBet);
};

/**
 * Get active (open or accepted) side bets for a game
 */
export const getActiveSideBets = async (gameId: string): Promise<SideBet[]> => {
  const text = `
    SELECT * FROM side_bets
    WHERE game_id = $1 AND status IN ('open', 'active')
    ORDER BY created_at DESC
  `;
  const result = await query(text, [gameId]);
  return result.rows.map(mapRowToSideBet);
};

/**
 * Get a specific side bet by ID
 */
export const getSideBetById = async (betId: number): Promise<SideBet | null> => {
  const text = `SELECT * FROM side_bets WHERE id = $1`;
  const result = await query(text, [betId]);
  return result.rows[0] ? mapRowToSideBet(result.rows[0]) : null;
};

/**
 * Accept a side bet
 */
export const acceptSideBet = async (
  betId: number,
  acceptorName: string
): Promise<SideBet | null> => {
  const text = `
    UPDATE side_bets
    SET acceptor_name = $1,
        status = 'active',
        accepted_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND status = 'open'
    RETURNING *
  `;
  const result = await query(text, [acceptorName, betId]);
  return result.rows[0] ? mapRowToSideBet(result.rows[0]) : null;
};

/**
 * Cancel a side bet (only creator can cancel, only while open)
 */
export const cancelSideBet = async (
  betId: number,
  creatorName: string
): Promise<boolean> => {
  const text = `
    UPDATE side_bets
    SET status = 'cancelled',
        resolved_at = CURRENT_TIMESTAMP,
        resolved_by = 'expired'
    WHERE id = $1 AND creator_name = $2 AND status = 'open'
    RETURNING id
  `;
  const result = await query(text, [betId, creatorName]);
  return result.rows.length > 0;
};

/**
 * Resolve a side bet (determine winner)
 */
export const resolveSideBet = async (
  betId: number,
  creatorWon: boolean,
  resolvedBy: SideBetResolution
): Promise<SideBet | null> => {
  const text = `
    UPDATE side_bets
    SET status = 'resolved',
        result = $1,
        resolved_by = $2,
        resolved_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND status = 'active'
    RETURNING *
  `;
  const result = await query(text, [creatorWon, resolvedBy, betId]);
  return result.rows[0] ? mapRowToSideBet(result.rows[0]) : null;
};

/**
 * Claim a win on a bet (sets status to pending_resolution)
 */
export const claimBetWin = async (
  betId: number,
  claimerName: string
): Promise<SideBet | null> => {
  const text = `
    UPDATE side_bets
    SET status = 'pending_resolution',
        claimed_winner = $1
    WHERE id = $2 AND status = 'active'
    RETURNING *
  `;
  const result = await query(text, [claimerName, betId]);
  return result.rows[0] ? mapRowToSideBet(result.rows[0]) : null;
};

/**
 * Mark a bet as disputed (refund both parties)
 * Works for both 'active' and 'pending_resolution' statuses
 */
export const disputeSideBet = async (betId: number): Promise<SideBet | null> => {
  const text = `
    UPDATE side_bets
    SET status = 'disputed',
        resolved_by = 'refunded',
        resolved_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND status IN ('active', 'pending_resolution')
    RETURNING *
  `;
  const result = await query(text, [betId]);
  return result.rows[0] ? mapRowToSideBet(result.rows[0]) : null;
};

/**
 * Expire all open bets for a game (called when game ends)
 */
export const expireOpenBets = async (gameId: string): Promise<number> => {
  const text = `
    UPDATE side_bets
    SET status = 'expired',
        resolved_by = 'expired',
        resolved_at = CURRENT_TIMESTAMP
    WHERE game_id = $1 AND status = 'open'
    RETURNING id
  `;
  const result = await query(text, [gameId]);
  return result.rows.length;
};

/**
 * Get active bets that need auto-resolution for a specific trigger
 */
export const getBetsForAutoResolution = async (
  gameId: string,
  presetType: PresetBetType,
  roundNumber?: number
): Promise<SideBet[]> => {
  let text = `
    SELECT * FROM side_bets
    WHERE game_id = $1
      AND status = 'active'
      AND bet_type = 'preset'
      AND preset_type = $2
  `;
  const params: unknown[] = [gameId, presetType];

  if (roundNumber !== undefined) {
    text += ` AND (round_number IS NULL OR round_number = $3)`;
    params.push(roundNumber);
  }

  const result = await query(text, params);
  return result.rows.map(mapRowToSideBet);
};

// ==================== COIN BALANCE OPERATIONS ====================

/**
 * Get player's cosmetic currency balance
 */
export const getPlayerBalance = async (playerName: string): Promise<number> => {
  const text = `
    SELECT COALESCE(cosmetic_currency, 100) as balance
    FROM player_stats
    WHERE player_name = $1
  `;
  const result = await query(text, [playerName]);
  return result.rows[0]?.balance ?? 100; // Default 100 coins for new players
};

/**
 * Ensure player exists in player_stats and has starting balance
 */
export const ensurePlayerExists = async (playerName: string): Promise<void> => {
  const text = `
    INSERT INTO player_stats (player_name, cosmetic_currency, is_bot)
    VALUES ($1, 100, FALSE)
    ON CONFLICT (player_name) DO NOTHING
  `;
  await query(text, [playerName]);
};

/**
 * Update player's coin balance (add or subtract)
 * Returns new balance or null if insufficient funds
 */
export const updatePlayerBalance = async (
  playerName: string,
  amount: number
): Promise<number | null> => {
  // Ensure player exists first
  await ensurePlayerExists(playerName);

  // Try to update balance (with check for sufficient funds when subtracting)
  const text = `
    UPDATE player_stats
    SET cosmetic_currency = cosmetic_currency + $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE player_name = $2
      AND cosmetic_currency + $1 >= 0
    RETURNING cosmetic_currency as balance
  `;
  const result = await query(text, [amount, playerName]);
  return result.rows[0]?.balance ?? null;
};

/**
 * Transfer coins from creator to acceptor when bet is resolved
 * Uses a transaction to ensure atomicity
 */
export const transferCoins = async (
  winnerName: string,
  loserName: string,
  amount: number
): Promise<boolean> => {
  try {
    // Deduct from loser
    const loserBalance = await updatePlayerBalance(loserName, -amount);
    if (loserBalance === null) {
      return false; // Insufficient funds
    }

    // Add to winner
    await updatePlayerBalance(winnerName, amount);

    return true;
  } catch (error) {
    console.error('[SideBets] Failed to transfer coins:', error);
    return false;
  }
};

/**
 * Update side bet statistics for a player
 * Also updates bet streak tracking
 */
export const updateSideBetStats = async (
  playerName: string,
  won: boolean,
  coinsWonOrLost: number
): Promise<{ currentStreak: number; bestStreak: number }> => {
  // First, update the streak: if won, increment; if lost, reset to 0
  // Also update best_bet_streak if current exceeds it
  const text = `
    UPDATE player_stats
    SET side_bets_won = side_bets_won + CASE WHEN $2 THEN 1 ELSE 0 END,
        side_bets_lost = side_bets_lost + CASE WHEN $2 THEN 0 ELSE 1 END,
        side_bets_coins_won = side_bets_coins_won + CASE WHEN $2 THEN $3 ELSE 0 END,
        side_bets_coins_lost = side_bets_coins_lost + CASE WHEN $2 THEN 0 ELSE $3 END,
        current_bet_streak = CASE WHEN $2 THEN current_bet_streak + 1 ELSE 0 END,
        best_bet_streak = CASE
          WHEN $2 AND current_bet_streak + 1 > best_bet_streak
          THEN current_bet_streak + 1
          ELSE best_bet_streak
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE player_name = $1
    RETURNING current_bet_streak, best_bet_streak
  `;
  const result = await query(text, [playerName, won, coinsWonOrLost]);
  return {
    currentStreak: result.rows[0]?.current_bet_streak ?? 0,
    bestStreak: result.rows[0]?.best_bet_streak ?? 0,
  };
};

/**
 * Get player's current bet streak for multiplier calculation
 */
export const getPlayerBetStreak = async (playerName: string): Promise<number> => {
  const text = `
    SELECT COALESCE(current_bet_streak, 0) as streak
    FROM player_stats
    WHERE player_name = $1
  `;
  const result = await query(text, [playerName]);
  return result.rows[0]?.streak ?? 0;
};

/**
 * Calculate streak multiplier
 * 1x for 0-2 streak, 1.25x for 3-4, 1.5x for 5-6, 2x for 7+
 */
export const calculateStreakMultiplier = (streak: number): number => {
  if (streak >= 7) return 2.0;
  if (streak >= 5) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Map database row to SideBet interface
 */
function mapRowToSideBet(row: Record<string, unknown>): SideBet {
  return {
    id: row.id as number,
    gameId: row.game_id as string,
    betType: row.bet_type as SideBetType,
    presetType: row.preset_type as PresetBetType | undefined,
    customDescription: row.custom_description as string | undefined,
    resolutionTiming: row.resolution_timing as ResolutionTiming | undefined,
    creatorName: row.creator_name as string,
    acceptorName: row.acceptor_name as string | undefined,
    amount: row.amount as number,
    prediction: row.prediction as string | undefined,
    targetPlayer: row.target_player as string | undefined,
    status: row.status as SideBetStatus,
    result: row.result as boolean | undefined,
    resolvedBy: row.resolved_by as SideBetResolution | undefined,
    roundNumber: row.round_number as number | undefined,
    trickNumber: row.trick_number as number | undefined,
    claimedWinner: row.claimed_winner as string | undefined,
    createdAt: new Date(row.created_at as string),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at as string) : undefined,
    resolvedAt: row.resolved_at ? new Date(row.resolved_at as string) : undefined,
  };
}
