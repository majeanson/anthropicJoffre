/**
 * Broadcast Manager Utilities
 * Sprint 4 Phase 2: Extracted from index.ts
 *
 * Manages game state broadcasting to players and spectators:
 * - Delta compression for bandwidth optimization (80-90% reduction)
 * - Spectator-safe broadcasts (hides player hands)
 * - Database persistence debouncing
 */

import { Server } from 'socket.io';
import { GameState, Player, LiveGame } from '../types/game';
import {
  generateStateDelta,
  calculateDeltaSize,
  isSignificantChange,
} from './stateDelta';
import { Logger } from 'winston';

/**
 * Broadcast manager dependencies
 * Uses dependency injection for testability and separation of concerns
 */
export interface BroadcastManagerDeps {
  io: Server;
  previousGameStates: Map<string, GameState>;
  gameSaveTimeouts: Map<string, NodeJS.Timeout>;
  logger: Logger;
  saveGame: (gameState: GameState) => Promise<void>;
  /** Optional callback to update live games in lounge */
  onLiveGameUpdate?: (game: LiveGame) => void;
  /** Optional callback to remove live game from lounge when game ends */
  onLiveGameRemove?: (gameId: string) => void;
}

/**
 * Convert GameState to LiveGame for lounge display
 */
function gameStateToLiveGame(gameState: GameState, spectatorCount: number = 0): LiveGame {
  const team1Players = gameState.players
    .filter(p => p.teamId === 1)
    .map(p => p.name);
  const team2Players = gameState.players
    .filter(p => p.teamId === 2)
    .map(p => p.name);

  return {
    gameId: gameState.id,
    team1Players,
    team2Players,
    team1Score: gameState.teamScores.team1,
    team2Score: gameState.teamScores.team2,
    phase: gameState.phase,
    currentTrick: gameState.currentTrick.length,
    totalTricks: 8, // Jaffre has 8 tricks per round
    spectatorCount,
  };
}

/**
 * Emit game update with delta compression and database persistence
 *
 * Features:
 * - Sends delta updates to reduce payload size by 80-90%
 * - Falls back to full state on phase changes or first send
 * - Debounces database saves (100ms) to prevent race conditions
 *
 * @param gameId - Game room ID
 * @param gameState - Current game state
 * @param forceFull - Force sending full state (e.g., player joined, phase change)
 * @param deps - Broadcast manager dependencies
 */
export function emitGameUpdate(
  gameId: string,
  gameState: GameState,
  forceFull: boolean = false,
  deps: BroadcastManagerDeps
): void {
  const { io, previousGameStates, gameSaveTimeouts, logger, saveGame } = deps;
  const previousState = previousGameStates.get(gameId);

  // Send full state if forced, no previous state, or phase changed
  const shouldSendFull = forceFull || !previousState || previousState.phase !== gameState.phase;

  if (shouldSendFull) {
    // Send full game state
    console.log(`📡 emitGameUpdate: Sending FULL state to room ${gameId} (phase: ${gameState.phase}, trick: ${gameState.currentTrick.length} cards)`);
    io.to(gameId).emit('game_updated', gameState);
    console.log(`📡 emitGameUpdate: Full state emitted`);

    if (process.env.NODE_ENV === 'development') {
      const fullSize = JSON.stringify(gameState).length;
      logger.debug('Sent full game state', {
        gameId,
        phase: gameState.phase,
        sizeBytes: fullSize,
      });
    }
  } else {
    // Generate and send delta update
    console.log(`📡 emitGameUpdate: Generating DELTA for room ${gameId} (phase: ${gameState.phase}, trick: ${gameState.currentTrick.length} cards)`);
    const delta = generateStateDelta(previousState, gameState);

    if (isSignificantChange(delta)) {
      console.log(`📡 emitGameUpdate: Sending DELTA to room ${gameId}`);
      io.to(gameId).emit('game_updated_delta', delta);
      console.log(`📡 emitGameUpdate: Delta emitted`);

      if (process.env.NODE_ENV === 'development') {
        const { deltaSize, estimatedFullSize, reduction } = calculateDeltaSize(delta);
        logger.debug('Sent delta game state', {
          gameId,
          phase: gameState.phase,
          deltaSize,
          estimatedFullSize,
          reduction,
        });
      }
    } else {
      console.log(`📡 emitGameUpdate: Delta NOT significant, skipping emit`);
    }
  }

  // Store current state as previous for next delta
  previousGameStates.set(gameId, JSON.parse(JSON.stringify(gameState))); // Deep clone

  // **OPTIMIZATION: Only save to database on significant events**
  // This reduces DB calls from ~50+ per game to ~5 (phase transitions only)
  //
  // Save triggers:
  // 1. Phase changes (team_selection → betting → playing → scoring → game_over)
  // 2. Force-saved events (player join, game creation, etc.)
  //
  // Skipped: Card plays, bets within same phase (saved at round/game end anyway)
  const shouldSaveToDatabase = shouldSendFull; // Phase change or forced

  if (shouldSaveToDatabase) {
    // Clear any pending save for this game
    const existingSaveTimeout = gameSaveTimeouts.get(gameId);
    if (existingSaveTimeout) {
      clearTimeout(existingSaveTimeout);
      gameSaveTimeouts.delete(gameId);
    }

    // Debounce database save (wait 100ms for any additional updates)
    const saveTimeout = setTimeout(() => {
      saveGame(gameState).catch(err => {
        console.error(`Failed to persist game ${gameId}:`, err);
      });
      gameSaveTimeouts.delete(gameId);
    }, 100);

    gameSaveTimeouts.set(gameId, saveTimeout);

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Scheduled DB save', {
        gameId,
        phase: gameState.phase,
        reason: forceFull ? 'forced' : 'phase_change',
      });
    }
  }

  // Update live games in lounge (for spectator list)
  // Only update on phase changes or score changes to avoid spam
  if (shouldSendFull && deps.onLiveGameUpdate && deps.onLiveGameRemove) {
    if (gameState.phase === 'game_over') {
      // Game ended - remove from live games
      deps.onLiveGameRemove(gameId);
    } else if (gameState.phase !== 'team_selection') {
      // Game is in progress - update live games list
      // Count spectators in the spectator room
      const spectatorRoom = io.sockets.adapter.rooms.get(`${gameId}-spectators`);
      const spectatorCount = spectatorRoom?.size || 0;
      const liveGame = gameStateToLiveGame(gameState, spectatorCount);
      deps.onLiveGameUpdate(liveGame);
    }
  }
}

/**
 * Broadcast event to both players and spectators
 *
 * Players receive full data, spectators receive data with hidden hands.
 * This ensures spectators can watch without seeing private information.
 *
 * @param gameId - Game room ID
 * @param event - Socket.io event name
 * @param data - Event payload (GameState or event-specific data)
 * @param io - Socket.io server instance
 */
export function broadcastGameUpdate(
  gameId: string,
  event: string,
  data: GameState | { winnerId: string; winnerName: string; points: number; gameState: GameState } | { winningTeam: 1 | 2; gameState: GameState },
  io: Server
): void {
  // Send full data to players
  io.to(gameId).emit(event, data);

  // Send spectator-safe data to spectators (hide player hands)
  if (data && 'players' in data) {
    const spectatorData = {
      ...data,
      players: data.players.map((player: Player) => ({
        id: player.id,
        name: player.name,
        teamId: player.teamId,
        hand: [], // Hide hands from spectators
        tricksWon: player.tricksWon,
        pointsWon: player.pointsWon,
      }))
    };
    io.to(`${gameId}-spectators`).emit(event, spectatorData);
  } else {
    io.to(`${gameId}-spectators`).emit(event, data);
  }
}
