/**
 * Timeout Management Utilities
 * Sprint 3 Phase 4: Extracted from index.ts
 *
 * Manages player action timeouts for betting and playing phases.
 * Uses stable player names for timeout keys (survive reconnections).
 *
 * Note: Timeout handlers (handleBettingTimeout, handlePlayingTimeout) remain
 * in index.ts due to tight coupling with game logic (resolveTrick, emitGameUpdate, etc.)
 */

import { Server } from 'socket.io';
import { GameState } from '../types/game';

// Timeout durations
const BETTING_TIMEOUT = 30000; // 30 seconds for betting
const PLAYING_TIMEOUT = 45000; // 45 seconds for playing a card

/**
 * Clear timeout for a specific player
 * Clears both the action timeout and the countdown interval
 *
 * @param gameId - Game identifier
 * @param playerNameOrId - Player's name (stable) or socket ID
 * @param activeTimeouts - Timeout storage Map
 */
export function clearPlayerTimeout(
  gameId: string,
  playerNameOrId: string,
  activeTimeouts: Map<string, NodeJS.Timeout>
): void {
  const key = `${gameId}-${playerNameOrId}`;
  const timeout = activeTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(key);
  }

  // Clear countdown interval
  const intervalKey = `${key}-interval`;
  const interval = activeTimeouts.get(intervalKey);
  if (interval) {
    clearInterval(interval as NodeJS.Timeout);
    activeTimeouts.delete(intervalKey);
  }
}

/**
 * Start timeout for current player
 * Sets up both the action timeout and the countdown interval (updates every second)
 * Uses stable player names for keys (survive reconnections)
 *
 * @param gameId - Game identifier
 * @param playerNameOrId - Player's name (stable) or socket ID
 * @param phase - Current game phase ('betting' or 'playing')
 * @param games - Game storage Map
 * @param activeTimeouts - Timeout storage Map
 * @param io - Socket.io server instance
 * @param timeoutHandler - Callback function to execute on timeout
 */
export function startPlayerTimeout(
  gameId: string,
  playerNameOrId: string,
  phase: 'betting' | 'playing',
  games: Map<string, GameState>,
  activeTimeouts: Map<string, NodeJS.Timeout>,
  io: Server,
  timeoutHandler: (gameId: string, playerName: string) => void
): void {
  const game = games.get(gameId);
  if (!game) return;

  // Look up player by name (stable), fallback to ID
  let player = game.players.find(p => p.name === playerNameOrId);
  if (!player) {
    player = game.players.find(p => p.id === playerNameOrId);
  }
  if (!player) return;

  const playerName = player.name;
  const key = `${gameId}-${playerName}`; // Use stable playerName for key

  // Clear any existing timeout for this player
  clearPlayerTimeout(gameId, playerName, activeTimeouts);

  const timeoutDuration = phase === 'betting' ? BETTING_TIMEOUT : PLAYING_TIMEOUT;
  const startTime = Date.now();

  // Send countdown updates every second
  const countdownInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, Math.floor((timeoutDuration - elapsed) / 1000));

    const game = games.get(gameId);
    if (!game) {
      clearInterval(countdownInterval);
      return;
    }

    // Check if still current player's turn (use name for stable check)
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.name !== playerName || game.phase !== phase) {
      clearInterval(countdownInterval);
      return;
    }

    // Send countdown update to all players
    io.to(gameId).emit('timeout_countdown', {
      playerId: currentPlayer.id, // Current socket ID
      playerName: playerName, // Stable identifier
      secondsRemaining: remaining,
      phase
    });

    // Send warning at 15 seconds
    if (remaining === 15) {
      io.to(gameId).emit('timeout_warning', {
        playerId: currentPlayer.id,
        playerName: playerName,
        secondsRemaining: 15
      });
    }

    if (remaining === 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  const timeout = setTimeout(() => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find(p => p.name === playerName);
    if (!player) return;

    console.log(`⏰ Timeout: ${player.name} in ${phase} phase`);

    // Emit auto-action notification
    io.to(gameId).emit('auto_action_taken', {
      playerId: player.id,
      playerName: player.name,
      phase
    });

    // Call the timeout handler
    timeoutHandler(gameId, playerName);
  }, timeoutDuration);

  activeTimeouts.set(key, timeout);
  activeTimeouts.set(`${key}-interval`, countdownInterval);
}
