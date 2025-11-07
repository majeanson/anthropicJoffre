/**
 * Game State Delta Utilities
 *
 * Generates delta updates for GameState to reduce WebSocket payload size by 80-90%.
 * Instead of sending full game state (~5-10KB), send only what changed (~500B-1KB).
 *
 * Sprint 2 Task #3: Optimize game state updates
 */

import { GameState, Player, Bet, TrickCard, TrickResult, RoundHistory } from '../types/game';

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
  currentTrick?: TrickCard[];
  currentBets?: Bet[];
  playersReady?: string[];
  rematchVotes?: string[];

  // Player updates (only changed players)
  playerUpdates?: {
    index: number; // Player index in players array
    changes: Partial<Player>; // Only changed fields
  }[];

  // Round history updates (only new entries)
  newRoundHistory?: RoundHistory[];

  // Current round tricks (only new entries)
  newCurrentRoundTricks?: TrickResult[];

  // Metadata
  _isDelta: true; // Flag to identify delta vs full state
  _timestamp: number; // When delta was generated
}

/**
 * Configuration for delta generation
 */
interface DeltaConfig {
  // Always include these fields even if unchanged (for critical state)
  alwaysInclude?: (keyof GameState)[];

  // Skip diffing for these fields (always send full value if changed)
  skipDeepDiff?: (keyof GameState)[];
}

const DEFAULT_CONFIG: DeltaConfig = {
  alwaysInclude: ['id', 'phase'], // Always include game ID and phase
  skipDeepDiff: ['roundHistory', 'currentRoundTricks'], // Large arrays - track additions only
};

/**
 * Deep equality check for primitive values and simple objects
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  // For objects, do shallow comparison (primitives only)
  if (typeof a === 'object' && !Array.isArray(a)) {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => objA[key] === objB[key]);
  }

  // For arrays, compare length and elements
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => isEqual(item, b[i]));
  }

  return false;
}

/**
 * Generate player field deltas (only changed fields)
 */
function diffPlayer(oldPlayer: Player, newPlayer: Player): Partial<Player> | null {
  const changes: Partial<Player> = {};
  let hasChanges = false;

  // Check primitive fields
  const primitiveFields: (keyof Player)[] = [
    'id', 'name', 'teamId', 'tricksWon', 'pointsWon',
    'isBot', 'botDifficulty', 'connectionStatus',
    'disconnectedAt', 'reconnectTimeLeft'
  ];

  for (const field of primitiveFields) {
    if (oldPlayer[field] !== newPlayer[field]) {
      (changes as Record<string, unknown>)[field] = newPlayer[field];
      hasChanges = true;
    }
  }

  // Check hand array (cards)
  if (!isEqual(oldPlayer.hand, newPlayer.hand)) {
    changes.hand = newPlayer.hand;
    hasChanges = true;
  }

  return hasChanges ? changes : null;
}

/**
 * Generate delta between two game states
 */
export function generateStateDelta(
  oldState: GameState,
  newState: GameState,
  config: DeltaConfig = DEFAULT_CONFIG
): GameStateDelta {
  const delta: GameStateDelta = {
    id: newState.id,
    _isDelta: true,
    _timestamp: Date.now(),
  };

  // Always include configured fields
  if (config.alwaysInclude) {
    for (const field of config.alwaysInclude) {
      if (field === 'id') continue; // Already included
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (delta as any)[field] = (newState as any)[field];
    }
  }

  // Check primitive fields
  if (oldState.currentPlayerIndex !== newState.currentPlayerIndex) {
    delta.currentPlayerIndex = newState.currentPlayerIndex;
  }

  if (oldState.dealerIndex !== newState.dealerIndex) {
    delta.dealerIndex = newState.dealerIndex;
  }

  if (oldState.trump !== newState.trump) {
    delta.trump = newState.trump;
  }

  if (oldState.roundNumber !== newState.roundNumber) {
    delta.roundNumber = newState.roundNumber;
  }

  if (oldState.roundEndTimestamp !== newState.roundEndTimestamp) {
    delta.roundEndTimestamp = newState.roundEndTimestamp;
  }

  // Check nested objects (shallow comparison)
  if (!isEqual(oldState.teamScores, newState.teamScores)) {
    delta.teamScores = newState.teamScores;
  }

  if (!isEqual(oldState.highestBet, newState.highestBet)) {
    delta.highestBet = newState.highestBet;
  }

  if (!isEqual(oldState.previousTrick, newState.previousTrick)) {
    delta.previousTrick = newState.previousTrick;
  }

  // Check arrays that change frequently
  if (!isEqual(oldState.currentTrick, newState.currentTrick)) {
    delta.currentTrick = newState.currentTrick;
  }

  if (!isEqual(oldState.currentBets, newState.currentBets)) {
    delta.currentBets = newState.currentBets;
  }

  if (!isEqual(oldState.playersReady, newState.playersReady)) {
    delta.playersReady = newState.playersReady;
  }

  if (!isEqual(oldState.rematchVotes, newState.rematchVotes)) {
    delta.rematchVotes = newState.rematchVotes;
  }

  // Check players array (per-player diffing)
  const playerUpdates: GameStateDelta['playerUpdates'] = [];

  for (let i = 0; i < newState.players.length; i++) {
    const oldPlayer = oldState.players[i];
    const newPlayer = newState.players[i];

    if (oldPlayer && newPlayer) {
      const changes = diffPlayer(oldPlayer, newPlayer);
      if (changes) {
        playerUpdates.push({ index: i, changes });
      }
    }
  }

  if (playerUpdates.length > 0) {
    delta.playerUpdates = playerUpdates;
  }

  // Check round history (track only new additions)
  if (newState.roundHistory.length > oldState.roundHistory.length) {
    delta.newRoundHistory = newState.roundHistory.slice(oldState.roundHistory.length);
  }

  // Check current round tricks (track only new additions)
  if (newState.currentRoundTricks.length > oldState.currentRoundTricks.length) {
    delta.newCurrentRoundTricks = newState.currentRoundTricks.slice(oldState.currentRoundTricks.length);
  }

  return delta;
}

/**
 * Apply delta to existing game state (client-side)
 */
export function applyStateDelta(currentState: GameState, delta: GameStateDelta): GameState {
  // Create shallow copy
  const newState: GameState = { ...currentState };

  // Apply primitive field changes
  if (delta.phase !== undefined) newState.phase = delta.phase;
  if (delta.currentPlayerIndex !== undefined) newState.currentPlayerIndex = delta.currentPlayerIndex;
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
    newState.currentRoundTricks = [...currentState.currentRoundTricks, ...delta.newCurrentRoundTricks];
  }

  return newState;
}

/**
 * Calculate size reduction from using delta updates
 */
export function calculateDeltaSize(delta: GameStateDelta): {
  deltaSize: number;
  estimatedFullSize: number;
  reduction: string;
} {
  const deltaJson = JSON.stringify(delta);
  const deltaSize = new Blob([deltaJson]).size;

  // Estimate full state size (conservative estimate: 5KB average)
  const estimatedFullSize = 5 * 1024;

  const reductionPercent = ((1 - deltaSize / estimatedFullSize) * 100).toFixed(1);

  return {
    deltaSize,
    estimatedFullSize,
    reduction: `${reductionPercent}%`,
  };
}

/**
 * Check if state change is significant enough to warrant update
 */
export function isSignificantChange(delta: GameStateDelta): boolean {
  // Count number of changed fields (excluding metadata)
  const changedFields = Object.keys(delta).filter(
    key => !key.startsWith('_') && key !== 'id'
  );

  // Consider significant if any field changed
  return changedFields.length > 0;
}
