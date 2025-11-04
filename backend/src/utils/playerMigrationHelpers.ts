import { GameState } from '../types/game';
import { RoundStatsData } from '../game/roundStatistics';

/**
 * Comprehensive player identity migration utility
 *
 * CRITICAL: When a player's identity changes (bot takeover, reconnection, replacement),
 * we must update ALL data structures that reference the old identity.
 *
 * This includes:
 * 1. roundStats Maps (6 Maps using playerName as keys)
 * 2. currentTrick.playerName (TrickCard[])
 * 3. currentRoundTricks (TrickResult[] with nested TrickCard[])
 * 4. afkWarnings Map (uses playerId as keys)
 *
 * Note: roundHistory, previousTrick, currentBets, and highestBet are already
 * migrated in the bot handler code (lines 335-399 in bots.ts)
 */

interface MigrationParams {
  gameState: GameState;
  roundStats: RoundStatsData | undefined;
  oldPlayerId: string; // Old socket.id
  newPlayerId: string; // New socket.id
  oldPlayerName: string;
  newPlayerName: string;
}

/**
 * Migrates all player identity data when a player is replaced/renamed
 *
 * @param params - Migration parameters
 * @returns void - Mutates gameState and roundStats in place
 */
export function migratePlayerIdentity(params: MigrationParams): void {
  const { gameState, roundStats, oldPlayerId, newPlayerId, oldPlayerName, newPlayerName } = params;

  // 1. Migrate roundStats Maps (current round data)
  if (roundStats) {
    migrateRoundStatsMaps(roundStats, oldPlayerName, newPlayerName);
  }

  // 2. Migrate currentTrick playerName (BUG FIX: currently only playerId is updated)
  migrateCurrentTrick(gameState, oldPlayerName, newPlayerName);

  // 3. Migrate currentRoundTricks (not migrated at all currently)
  migrateCurrentRoundTricks(gameState, oldPlayerId, newPlayerId, oldPlayerName, newPlayerName);

  // 4. Migrate afkWarnings Map if present
  migrateAfkWarnings(gameState, oldPlayerId, newPlayerId);
}

/**
 * Migrates roundStats Map keys from old player name to new player name
 */
function migrateRoundStatsMaps(
  stats: RoundStatsData,
  oldName: string,
  newName: string
): void {
  // Migrate each Map individually to preserve type safety

  // cardPlayTimes: Map<string, number[]>
  if (stats.cardPlayTimes.has(oldName)) {
    const value = stats.cardPlayTimes.get(oldName)!;
    stats.cardPlayTimes.set(newName, value);
    stats.cardPlayTimes.delete(oldName);
  }

  // trumpsPlayed: Map<string, number>
  if (stats.trumpsPlayed.has(oldName)) {
    const value = stats.trumpsPlayed.get(oldName)!;
    stats.trumpsPlayed.set(newName, value);
    stats.trumpsPlayed.delete(oldName);
  }

  // redZerosCollected: Map<string, number>
  if (stats.redZerosCollected.has(oldName)) {
    const value = stats.redZerosCollected.get(oldName)!;
    stats.redZerosCollected.set(newName, value);
    stats.redZerosCollected.delete(oldName);
  }

  // brownZerosReceived: Map<string, number>
  if (stats.brownZerosReceived.has(oldName)) {
    const value = stats.brownZerosReceived.get(oldName)!;
    stats.brownZerosReceived.set(newName, value);
    stats.brownZerosReceived.delete(oldName);
  }

  // initialHands: Map<string, Card[]>
  if (stats.initialHands.has(oldName)) {
    const value = stats.initialHands.get(oldName)!;
    stats.initialHands.set(newName, value);
    stats.initialHands.delete(oldName);
  }

  // playerBets: Map<string, { amount: number; withoutTrump: boolean } | null>
  if (stats.playerBets.has(oldName)) {
    const value = stats.playerBets.get(oldName)!;
    stats.playerBets.set(newName, value);
    stats.playerBets.delete(oldName);
  }
}

/**
 * Migrates currentTrick playerName field
 * Note: playerId is already updated in bot handler code
 */
function migrateCurrentTrick(
  gameState: GameState,
  oldName: string,
  newName: string
): void {
  gameState.currentTrick.forEach(tc => {
    if (tc.playerName === oldName) {
      tc.playerName = newName;
    }
  });
}

/**
 * Migrates currentRoundTricks array (TrickResult[] with nested TrickCard[])
 */
function migrateCurrentRoundTricks(
  gameState: GameState,
  oldPlayerId: string,
  newPlayerId: string,
  oldName: string,
  newName: string
): void {
  if (!gameState.currentRoundTricks) return;

  gameState.currentRoundTricks.forEach(trickResult => {
    // Migrate each card in the trick
    trickResult.trick.forEach(tc => {
      if (tc.playerName === oldName) {
        tc.playerName = newName;
        tc.playerId = newPlayerId;
      }
    });

    // Migrate winner identity
    if (trickResult.winnerName === oldName) {
      trickResult.winnerName = newName;
      trickResult.winnerId = newPlayerId;
    }
  });
}

/**
 * Migrates afkWarnings Map keys if present
 */
function migrateAfkWarnings(
  gameState: GameState,
  oldPlayerId: string,
  newPlayerId: string
): void {
  if (!gameState.afkWarnings) return;

  if (gameState.afkWarnings.has(oldPlayerId)) {
    const warningCount = gameState.afkWarnings.get(oldPlayerId);
    gameState.afkWarnings.set(newPlayerId, warningCount!);
    gameState.afkWarnings.delete(oldPlayerId);
  }
}
