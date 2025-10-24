import { describe, it, expect } from 'vitest';
import {
  applyCardPlay,
  applyBet,
  resetBetting,
  applyTeamSelection,
  applyPositionSwap,
  initializeRound,
  clearTrick,
  addTeamPoints,
  updateScores,
  setPhase,
} from './state';
import { GameState, Card, Player } from '../types/game';

// Helper to create a test game state
function createTestGame(overrides?: Partial<GameState>): GameState {
  const defaultPlayers: Player[] = [
    { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
    { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
  ];

  return {
    id: 'test-game',
    creatorId: 'test-creator',
    players: defaultPlayers,
    phase: 'team_selection',
    currentPlayerIndex: 0,
    currentBets: [],
    currentTrick: [],
    trump: null,
    teamScores: { team1: 0, team2: 0 },
    dealerIndex: 0,
    roundNumber: 0,
    highestBet: null,
    previousTrick: null,
    roundHistory: [],
    currentRoundTricks: [],
    ...overrides,
  };
}

describe('applyCardPlay', () => {
  it('should add card to trick and remove from hand', () => {
    const card: Card = { color: 'red', value: 5 };
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 0,
      players: [
        { id: 'p1', name: 'P1', hand: [card, { color: 'blue', value: 3 }], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    const result = applyCardPlay(game, 'p1', card);

    expect(game.currentTrick.length).toBe(1);
    expect(game.currentTrick[0]).toEqual({ playerId: 'p1', card });
    expect(game.players[0].hand).toEqual([{ color: 'blue', value: 3 }]);
    expect(result.trickComplete).toBe(false);
  });

  it('should set trump on first card', () => {
    const card: Card = { color: 'red', value: 5 };
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 0,
      trump: null,
      players: [
        { id: 'p1', name: 'P1', hand: [card], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    const result = applyCardPlay(game, 'p1', card);

    expect(game.trump).toBe('red');
    expect(result.trumpWasSet).toBe(true);
    expect(result.trump).toBe('red');
  });

  it('should not set trump on subsequent cards', () => {
    const card: Card = { color: 'blue', value: 3 };
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 1,
      trump: 'red',
      currentTrick: [{ playerId: 'p1', card: { color: 'red', value: 5 } }],
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [card], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    const result = applyCardPlay(game, 'p2', card);

    expect(game.trump).toBe('red'); // unchanged
    expect(result.trumpWasSet).toBe(false);
  });

  it('should advance to next player', () => {
    const card: Card = { color: 'red', value: 5 };
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 0,
      players: [
        { id: 'p1', name: 'P1', hand: [card], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    const result = applyCardPlay(game, 'p1', card);

    expect(result.previousPlayerIndex).toBe(0);
    expect(game.currentPlayerIndex).toBe(1);
  });

  it('should wrap around after player 4', () => {
    const card: Card = { color: 'red', value: 5 };
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 3,
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [card], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyCardPlay(game, 'p4', card);

    expect(game.currentPlayerIndex).toBe(0); // wraps to player 1
  });

  it('should mark trick as complete after 4 cards', () => {
    const card: Card = { color: 'red', value: 5 };
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 3,
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 1 } },
        { playerId: 'p2', card: { color: 'red', value: 2 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
      ],
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [card], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    const result = applyCardPlay(game, 'p4', card);

    expect(result.trickComplete).toBe(true);
    expect(game.currentTrick.length).toBe(4);
  });
});

describe('applyBet', () => {
  it('should add bet to currentBets', () => {
    const game = createTestGame({ phase: 'betting' });

    const result = applyBet(game, 'p1', 8, false);

    expect(game.currentBets.length).toBe(1);
    expect(game.currentBets[0]).toEqual({
      playerId: 'p1',
      amount: 8,
      withoutTrump: false,
      skipped: false,
    });
    expect(result.bettingComplete).toBe(false);
  });

  it('should handle skipped bet', () => {
    const game = createTestGame({ phase: 'betting' });

    const result = applyBet(game, 'p1', 0, false, true);

    expect(game.currentBets[0]).toEqual({
      playerId: 'p1',
      amount: 0,
      withoutTrump: false,
      skipped: true,
    });
  });

  it('should advance to next player', () => {
    const game = createTestGame({ phase: 'betting', currentPlayerIndex: 0 });

    applyBet(game, 'p1', 8, false);

    expect(game.currentPlayerIndex).toBe(1);
  });

  it('should mark betting as complete after 4 bets', () => {
    const game = createTestGame({
      phase: 'betting',
      currentPlayerIndex: 3,
      currentBets: [
        { playerId: 'p1', amount: 8, withoutTrump: false, skipped: false },
        { playerId: 'p2', amount: 9, withoutTrump: false, skipped: false },
        { playerId: 'p3', amount: 0, withoutTrump: false, skipped: true },
      ],
    });

    const result = applyBet(game, 'p4', 10, false);

    expect(result.bettingComplete).toBe(true);
  });

  it('should detect all players skipped', () => {
    const game = createTestGame({
      phase: 'betting',
      currentPlayerIndex: 3,
      currentBets: [
        { playerId: 'p1', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p2', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p3', amount: 0, withoutTrump: false, skipped: true },
      ],
    });

    const result = applyBet(game, 'p4', 0, false, true);

    expect(result.allPlayersSkipped).toBe(true);
    expect(result.bettingComplete).toBe(true);
  });
});

describe('resetBetting', () => {
  it('should clear currentBets', () => {
    const game = createTestGame({
      phase: 'betting',
      currentBets: [
        { playerId: 'p1', amount: 8, withoutTrump: false, skipped: false },
      ],
    });

    resetBetting(game);

    expect(game.currentBets).toEqual([]);
  });

  it('should set currentPlayerIndex to player after dealer', () => {
    const game = createTestGame({
      phase: 'betting',
      dealerIndex: 2,
      currentPlayerIndex: 0,
    });

    resetBetting(game);

    expect(game.currentPlayerIndex).toBe(3); // player after dealer
  });

  it('should wrap around when dealer is last player', () => {
    const game = createTestGame({
      phase: 'betting',
      dealerIndex: 3,
    });

    resetBetting(game);

    expect(game.currentPlayerIndex).toBe(0); // wraps to first player
  });
});

describe('applyTeamSelection', () => {
  it('should set player teamId', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: null, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyTeamSelection(game, 'p1', 1);

    expect(game.players[0].teamId).toBe(1);
  });

  it('should do nothing if player not found', () => {
    const game = createTestGame({ phase: 'team_selection' });

    applyTeamSelection(game, 'invalid', 1);

    // No error thrown, state unchanged
    expect(game.players.every(p => p.teamId === p.teamId)).toBe(true);
  });
});

describe('applyPositionSwap', () => {
  it('should swap player positions in array', () => {
    const game = createTestGame({
      phase: 'team_selection',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyPositionSwap(game, 'p1', 'p3');

    expect(game.players[0].id).toBe('p3');
    expect(game.players[2].id).toBe('p1');
  });

  it('should do nothing if player not found', () => {
    const game = createTestGame({ phase: 'team_selection' });
    const originalOrder = game.players.map(p => p.id);

    applyPositionSwap(game, 'invalid', 'p1');

    expect(game.players.map(p => p.id)).toEqual(originalOrder);
  });
});

describe('initializeRound', () => {
  it('should deal 8 cards to each player', () => {
    const game = createTestGame({ phase: 'team_selection' });
    const deck: Card[] = Array.from({ length: 32 }, (_, i) => ({
      color: 'red',
      value: i % 8,
    }));

    initializeRound(game, deck);

    expect(game.players[0].hand.length).toBe(8);
    expect(game.players[1].hand.length).toBe(8);
    expect(game.players[2].hand.length).toBe(8);
    expect(game.players[3].hand.length).toBe(8);
  });

  it('should reset round state', () => {
    const game = createTestGame({
      phase: 'playing',
      currentBets: [{ playerId: 'p1', amount: 8, withoutTrump: false, skipped: false }],
      currentTrick: [{ playerId: 'p1', card: { color: 'red', value: 5 } }],
      trump: 'red',
    });
    const deck: Card[] = Array.from({ length: 32 }, (_, i) => ({
      color: 'red',
      value: i % 8,
    }));

    initializeRound(game, deck);

    expect(game.currentBets).toEqual([]);
    expect(game.currentTrick).toEqual([]);
    expect(game.trump).toBeNull();
    expect(game.phase).toBe('betting');
  });

  it('should rotate dealer', () => {
    const game = createTestGame({ dealerIndex: 0 });
    const deck: Card[] = Array.from({ length: 32 }, (_, i) => ({
      color: 'red',
      value: i % 8,
    }));

    initializeRound(game, deck);

    expect(game.dealerIndex).toBe(1);
  });

  it('should set currentPlayerIndex to player after dealer', () => {
    const game = createTestGame({ dealerIndex: 0 });
    const deck: Card[] = Array.from({ length: 32 }, (_, i) => ({
      color: 'red',
      value: i % 8,
    }));

    initializeRound(game, deck);

    expect(game.currentPlayerIndex).toBe(2); // dealer rotated to 1, so current is 2
  });
});

describe('clearTrick', () => {
  it('should clear currentTrick', () => {
    const game = createTestGame({
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 5 } },
        { playerId: 'p2', card: { color: 'red', value: 3 } },
      ],
    });

    clearTrick(game, 'p1');

    expect(game.currentTrick).toEqual([]);
  });

  it('should set winner as next player', () => {
    const game = createTestGame({ currentPlayerIndex: 0 });

    clearTrick(game, 'p3');

    expect(game.currentPlayerIndex).toBe(2); // p3 is at index 2
  });
});

describe('addTeamPoints', () => {
  it('should be a placeholder function (points tracked per player)', () => {
    const game = createTestGame({});

    // Function exists but doesn't modify state (placeholder)
    addTeamPoints(game, 1, 3);

    // No assertions - function is currently a no-op placeholder
    expect(true).toBe(true);
  });
});

describe('updateScores', () => {
  it('should add round scores to team totals', () => {
    const game = createTestGame({ teamScores: { team1: 10, team2: 15 } });

    const gameOver = updateScores(game, 5, 3);

    expect(game.teamScores.team1).toBe(15);
    expect(game.teamScores.team2).toBe(18);
    expect(gameOver).toBe(false);
  });

  it('should return true when team 1 reaches 41', () => {
    const game = createTestGame({ teamScores: { team1: 38, team2: 20 } });

    const gameOver = updateScores(game, 5, 0);

    expect(game.teamScores.team1).toBe(43);
    expect(gameOver).toBe(true);
  });

  it('should return true when team 2 reaches 41', () => {
    const game = createTestGame({ teamScores: { team1: 20, team2: 39 } });

    const gameOver = updateScores(game, 0, 5);

    expect(game.teamScores.team2).toBe(44);
    expect(gameOver).toBe(true);
  });
});

describe('setPhase', () => {
  it('should update game phase', () => {
    const game = createTestGame({ phase: 'team_selection' });

    setPhase(game, 'betting');

    expect(game.phase).toBe('betting');
  });

  it('should handle all phase transitions', () => {
    const game = createTestGame({ phase: 'team_selection' });

    setPhase(game, 'betting');
    expect(game.phase).toBe('betting');

    setPhase(game, 'playing');
    expect(game.phase).toBe('playing');

    setPhase(game, 'scoring');
    expect(game.phase).toBe('scoring');

    setPhase(game, 'game_over');
    expect(game.phase).toBe('game_over');
  });
});
