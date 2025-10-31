/**
 * Bot Helper Utilities
 * Sprint 3 Phase 4: Extracted from index.ts
 *
 * Provides helper functions for bot management:
 * - Bot naming (Bot 1, Bot 2, Bot 3)
 * - Bot count validation (max 3 bots per game)
 * - Teammate checking
 */

import { GameState } from '../types/game';

/**
 * Get the next available bot name (Bot 1, Bot 2, or Bot 3)
 * Scans existing players and finds the first available bot number
 *
 * @param game - Current game state
 * @returns Next available bot name (e.g., "Bot 2")
 */
export function getNextBotName(game: GameState): string {
  const existingBotNumbers = game.players
    .filter(p => p.name.startsWith('Bot '))
    .map(p => parseInt(p.name.split(' ')[1]))
    .filter(n => !isNaN(n));

  for (let i = 1; i <= 3; i++) {
    if (!existingBotNumbers.includes(i)) {
      return `Bot ${i}`;
    }
  }

  // Fallback (should never happen with validation)
  return `Bot ${Date.now() % 1000}`;
}

/**
 * Check if game can add another bot (max 3 bots per game)
 * Rule: Maximum of 3 bots allowed, at least 1 human required
 *
 * @param game - Current game state
 * @returns True if another bot can be added
 */
export function canAddBot(game: GameState): boolean {
  const botCount = game.players.filter(p => p.isBot).length;
  return botCount < 3;
}

/**
 * Check if two players are teammates (same team ID)
 * Used for bot replacement validation (only teammates can replace)
 *
 * @param game - Current game state
 * @param player1Name - First player's name
 * @param player2Name - Second player's name
 * @returns True if players are on the same team
 */
export function areTeammates(
  game: GameState,
  player1Name: string,
  player2Name: string
): boolean {
  const p1 = game.players.find(p => p.name === player1Name);
  const p2 = game.players.find(p => p.name === player2Name);

  if (!p1 || !p2) return false;

  return p1.teamId === p2.teamId;
}
