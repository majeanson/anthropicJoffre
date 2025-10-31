/**
 * Tests for immutable state transition functions
 *
 * These tests verify the pure, immutable state transformations
 * that form the core of the refactored game logic.
 */

import { describe, it, expect } from 'vitest';
import { resolveTrick, scoreRound, selectTeam, placeBet } from './stateTransitions';
import { GameState, Player, Card, TrickCard } from '../types/game';

// Helper to create minimal test game state
function createTestGame(overrides?: Partial<GameState>): GameState {
  const defaultPlayers: Player[] = [
    { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
    { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
  ];

  return {
    id: 'test-game',
    creatorId: 'creator',
    players: defaultPlayers,
    phase: 'team_selection',
    currentPlayerIndex: 0,
    currentBets: [],
    currentTrick: [],
    trump: null,
    teamScores: { team1: 0, team2: 0 },
    dealerIndex: 0,
    roundNumber: 1,
    highestBet: null,
    previousTrick: null,
    roundHistory: [],
    currentRoundTricks: [],
    ...overrides,
  };
}

describe('stateTransitions - resolveTrick', () => {
  it('should return new GameState (immutability)', () => {
    const originalGame = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(originalGame);

    // Should return a different object
    expect(newGame).not.toBe(originalGame);
    // Original should be unchanged
    expect(originalGame.currentTrick.length).toBe(4);
    expect(originalGame.players[0].tricksWon).toBe(0);
  });

  it('should award trick to winner with correct points', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    // Player 1 played highest card (7), should win
    expect(newGame.players[0].tricksWon).toBe(1);
    expect(newGame.players[0].pointsWon).toBe(1); // Base point for winning trick

    // Other players should have 0
    expect(newGame.players[1].tricksWon).toBe(0);
    expect(newGame.players[2].tricksWon).toBe(0);
    expect(newGame.players[3].tricksWon).toBe(0);
  });

  it('should handle Red 0 special card (+5 points)', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 0 } }, // Red 0 = +5
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    // Player 1 wins (highest card)
    expect(newGame.players[0].tricksWon).toBe(1);
    expect(newGame.players[0].pointsWon).toBe(6); // 1 base + 5 for red 0
  });

  it('should handle Brown 0 special card (-3 points)', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'brown', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'brown', value: 0 } }, // Brown 0 = -3
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'brown', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'brown', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    // Player 1 wins (highest card)
    expect(newGame.players[0].tricksWon).toBe(1);
    expect(newGame.players[0].pointsWon).toBe(-2); // 1 base - 3 for brown 0
  });

  it('should clear current trick after resolution', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    expect(newGame.currentTrick.length).toBe(0);
  });

  it('should set previousTrick with winner info', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    expect(newGame.previousTrick).toBeDefined();
    expect(newGame.previousTrick?.winnerId).toBe('p1');
    expect(newGame.previousTrick?.winnerName).toBe('Player 1');
    expect(newGame.previousTrick?.trick.length).toBe(4);
  });

  it('should set winner as next player', () => {
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 0,
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 5 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 7 } }, // Winner
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    // Player 2 (index 1) should be next player
    expect(newGame.currentPlayerIndex).toBe(1);
  });

  it('should transition to scoring phase when round is over', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 }, // Empty hand
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    expect(newGame.phase).toBe('scoring');
  });

  it('should stay in playing phase when cards remain', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'Player 1', hand: [{ color: 'blue', value: 1 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [{ color: 'blue', value: 2 }], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [{ color: 'blue', value: 3 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [{ color: 'blue', value: 4 }], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ],
      trump: 'blue',
    });

    const newGame = resolveTrick(game);

    expect(newGame.phase).toBe('playing');
  });

  it('should throw error if trick is incomplete', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
      ],
    });

    expect(() => resolveTrick(game)).toThrow('Trick must have 4 cards to resolve');
  });
});

describe('stateTransitions - immutability guarantees', () => {
  it('should never mutate original game state', () => {
    const originalGame = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'P1', hand: [{ color: 'red', value: 1 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [{ color: 'red', value: 2 }], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [{ color: 'red', value: 3 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [{ color: 'red', value: 4 }], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
      currentTrick: [
        { playerId: 'p1', playerName: 'P1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'P2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'P3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'P4', card: { color: 'red', value: 1 } },
      ],
    });

    // Create snapshot of original state
    const originalSnapshot = JSON.parse(JSON.stringify(originalGame));

    // Apply transformation
    const newGame = resolveTrick(originalGame);

    // Original should be completely unchanged
    expect(JSON.stringify(originalGame)).toBe(JSON.stringify(originalSnapshot));

    // New game should be different
    expect(newGame.currentTrick.length).toBe(0);
    expect(originalGame.currentTrick.length).toBe(4);
  });
});
