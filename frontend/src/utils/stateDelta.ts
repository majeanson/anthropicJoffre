/**
 * Game State Delta Utilities (Frontend)
 *
 * Applies delta updates from backend to reduce WebSocket payload size by 80-90%.
 * Mirrors backend/src/utils/stateDelta.ts
 *
 * Sprint 2 Task #3: Optimize game state updates
 */

import { GameState, Player } from '../types/game';

/**
 * Delta update representing only changed fields
 */
export interface GameStateDelta {
  id: string; // Game ID (always included for routing)

  // Changed primitive fields
  phase?: GameState['phase'];
  currentPlayerIndex?: number;
  dealerIndex?: number;
  trump?: GameState['trump'];
  roundNumber?: number;
  roundEndTimestamp?: number;

  // Changed nested objects
  teamScores?: GameState['teamScores'];
  highestBet?: GameState['highestBet'];
  previousTrick?: GameState['previousTrick'];

  // Changed arrays (send full array if changed)
  currentTrick?: GameState['currentTrick'];
  currentBets?: GameState['currentBets'];
  playersReady?: string[];
  rematchVotes?: string[];

  // Player updates (only changed players)
  playerUpdates?: {
    index: number; // Player index in players array
    changes: Partial<Player>; // Only changed fields
  }[];

  // Round history updates (only new entries)
  newRoundHistory?: GameState['roundHistory'];

  // Current round tricks (only new entries)
  newCurrentRoundTricks?: GameState['currentRoundTricks'];

  // Metadata
  _isDelta: true; // Flag to identify delta vs full state
  _timestamp: number; // When delta was generated
}

/**
 * Apply delta to existing game state (client-side)
 */
export function applyStateDelta(currentState: GameState, delta: GameStateDelta): GameState {
  // Create shallow copy
  const newState: GameState = { ...currentState };

  // Apply primitive field changes
  if (delta.phase !== undefined) newState.phase = delta.phase;
  if (delta.currentPlayerIndex !== undefined)
    newState.currentPlayerIndex = delta.currentPlayerIndex;
  if (delta.dealerIndex !== undefined) newState.dealerIndex = delta.dealerIndex;
  if (delta.trump !== undefined) newState.trump = delta.trump;
  if (delta.roundNumber !== undefined) newState.roundNumber = delta.roundNumber;
  if (delta.roundEndTimestamp !== undefined) newState.roundEndTimestamp = delta.roundEndTimestamp;

  // Apply nested object changes
  if (delta.teamScores !== undefined) newState.teamScores = delta.teamScores;
  if (delta.highestBet !== undefined) newState.highestBet = delta.highestBet;
  if (delta.previousTrick !== undefined) newState.previousTrick = delta.previousTrick;

  // Apply array changes
  if (delta.currentTrick !== undefined) newState.currentTrick = delta.currentTrick;
  if (delta.currentBets !== undefined) newState.currentBets = delta.currentBets;
  if (delta.playersReady !== undefined) newState.playersReady = delta.playersReady;
  if (delta.rematchVotes !== undefined) newState.rematchVotes = delta.rematchVotes;

  // Apply player updates
  if (delta.playerUpdates && delta.playerUpdates.length > 0) {
    // Clone players array to avoid mutation
    newState.players = [...currentState.players];

    for (const update of delta.playerUpdates) {
      const { index, changes } = update;
      if (newState.players[index]) {
        // Merge changes into player
        newState.players[index] = {
          ...newState.players[index],
          ...changes,
        };
      }
    }
  }

  // Apply round history additions
  if (delta.newRoundHistory && delta.newRoundHistory.length > 0) {
    newState.roundHistory = [...currentState.roundHistory, ...delta.newRoundHistory];
  }

  // Apply current round tricks additions
  if (delta.newCurrentRoundTricks && delta.newCurrentRoundTricks.length > 0) {
    newState.currentRoundTricks = [
      ...currentState.currentRoundTricks,
      ...delta.newCurrentRoundTricks,
    ];
  }

  return newState;
}
