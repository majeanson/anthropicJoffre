/**
 * Player Helper Utilities
 * Sprint 3 Phase 4: Extracted from index.ts
 *
 * Provides helper functions for finding and validating players in games.
 * Uses player names as stable identifiers (survive reconnections).
 */

import { GameState, Player } from '../types/game';

/**
 * Find player by socket ID or name (stable across reconnections)
 * Prefers socket ID for speed, falls back to name if ID not found
 *
 * @param game - Current game state
 * @param socketId - Player's socket ID
 * @param playerName - Optional player name for fallback
 * @returns Player object if found, undefined otherwise
 */
export function findPlayer(
  game: GameState,
  socketId: string,
  playerName?: string
): Player | undefined {
  // First try by socket ID (fast path)
  let player = game.players.find(p => p.id === socketId);

  // If not found and we have a name, try by name (reconnection case)
  if (!player && playerName) {
    player = game.players.find(p => p.name === playerName);
  }

  return player;
}

/**
 * Find player index by socket ID or name
 * Used for array operations (splice, etc.)
 *
 * @param game - Current game state
 * @param socketId - Player's socket ID
 * @param playerName - Optional player name for fallback
 * @returns Player index if found, -1 otherwise
 */
export function findPlayerIndex(
  game: GameState,
  socketId: string,
  playerName?: string
): number {
  // First try by socket ID
  let index = game.players.findIndex(p => p.id === socketId);

  // If not found and we have a name, try by name
  if (index === -1 && playerName) {
    index = game.players.findIndex(p => p.name === playerName);
  }

  return index;
}

/**
 * Check if at least 1 human player remains in the game
 * Used to prevent creating all-bot games
 *
 * @param game - Current game state
 * @returns True if at least one human player exists
 */
export function hasAtLeastOneHuman(game: GameState): boolean {
  const humanCount = game.players.filter(p => !p.isBot).length;
  return humanCount >= 1;
}
