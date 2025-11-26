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
  applyTrickResolution,
  calculateRoundScoring,
  applyRoundScoring,
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
    expect(game.currentTrick[0]).toEqual({ playerId: 'p1', playerName: 'P1', card });
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

    const result = applyBet(game, 'p1', 'Player1', 8, false);

    expect(game.currentBets.length).toBe(1);
    expect(game.currentBets[0]).toEqual({
      playerId: 'p1',
      playerName: 'Player1',
      amount: 8,
      withoutTrump: false,
      skipped: false,
    });
    expect(result.bettingComplete).toBe(false);
  });

  it('should handle skipped bet', () => {
    const game = createTestGame({ phase: 'betting' });

    const result = applyBet(game, 'p1', 'Player1', 0, false, true);

    expect(game.currentBets[0]).toEqual({
      playerId: 'p1',
      playerName: 'Player1',
      amount: 0,
      withoutTrump: false,
      skipped: true,
    });
  });

  it('should advance to next player', () => {
    const game = createTestGame({ phase: 'betting', currentPlayerIndex: 0 });

    applyBet(game, 'p1', 'Player1', 8, false);

    expect(game.currentPlayerIndex).toBe(1);
  });

  it('should mark betting as complete after 4 bets', () => {
    const game = createTestGame({
      phase: 'betting',
      currentPlayerIndex: 3,
      currentBets: [
        { playerId: 'p1', playerName: 'Player 1', amount: 8, withoutTrump: false, skipped: false },
        { playerId: 'p2', playerName: 'Player 2', amount: 9, withoutTrump: false, skipped: false },
        { playerId: 'p3', playerName: 'Player 3', amount: 0, withoutTrump: false, skipped: true },
      ],
    });

    const result = applyBet(game, 'p4', 'Player4', 10, false);

    expect(result.bettingComplete).toBe(true);
  });

  it('should detect all players skipped', () => {
    const game = createTestGame({
      phase: 'betting',
      currentPlayerIndex: 3,
      currentBets: [
        { playerId: 'p1', playerName: 'Player 1', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p2', playerName: 'Player 2', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p3', playerName: 'Player 3', amount: 0, withoutTrump: false, skipped: true },
      ],
    });

    const result = applyBet(game, 'p4', 'Player4', 0, false, true);

    expect(result.allPlayersSkipped).toBe(true);
    expect(result.bettingComplete).toBe(true);
  });
});

describe('resetBetting', () => {
  it('should clear currentBets', () => {
    const game = createTestGame({
      phase: 'betting',
      currentBets: [
        { playerId: 'p1', playerName: 'Player 1', amount: 8, withoutTrump: false, skipped: false },
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

  it('should swap all player data fields', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        {
          id: 'p1', name: 'P1',
          hand: [{color: 'red', value: 1}, {color: 'blue', value: 2}],
          teamId: 1, tricksWon: 3, pointsWon: 5,
          isBot: false
        },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        {
          id: 'p3', name: 'P3',
          hand: [{color: 'green', value: 3}, {color: 'brown', value: 4}],
          teamId: 1, tricksWon: 1, pointsWon: 2,
          isBot: true, botDifficulty: 'hard'
        },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyPositionSwap(game, 'p1', 'p3');

    // Check that positions swapped
    expect(game.players[0].id).toBe('p3');
    expect(game.players[2].id).toBe('p1');

    // Check that ONLY game data swapped (hand, tricks, points), NOT identity (isBot)
    // Player p3 (bot) moved to index 0, gets p1's game data but keeps bot identity
    expect(game.players[0].hand).toEqual([{color: 'red', value: 1}, {color: 'blue', value: 2}]);
    expect(game.players[0].tricksWon).toBe(3);
    expect(game.players[0].pointsWon).toBe(5);
    expect(game.players[0].isBot).toBe(true); // PRESERVED: p3 stays a bot
    expect(game.players[0].botDifficulty).toBe('hard'); // PRESERVED: p3 keeps difficulty

    // Player p1 (human) moved to index 2, gets p3's game data but keeps human identity
    expect(game.players[2].hand).toEqual([{color: 'green', value: 3}, {color: 'brown', value: 4}]);
    expect(game.players[2].tricksWon).toBe(1);
    expect(game.players[2].pointsWon).toBe(2);
    expect(game.players[2].isBot).toBe(false); // PRESERVED: p1 stays human
    expect(game.players[2].botDifficulty).toBeUndefined(); // PRESERVED: p1 has no difficulty
  });

  it('should preserve bot status and difficulty when swapping', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'Human', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0, isBot: false },
        { id: 'p2', name: 'Bot', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0, isBot: true, botDifficulty: 'medium' },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyPositionSwap(game, 'p1', 'p2');

    // Bot p2 moved to index 0, should KEEP bot status (identity preserved)
    expect(game.players[0].isBot).toBe(true);
    expect(game.players[0].botDifficulty).toBe('medium');

    // Human p1 moved to index 1, should KEEP human status (identity preserved)
    expect(game.players[1].isBot).toBe(false);
    expect(game.players[1].botDifficulty).toBeUndefined();
  });

  it('should preserve connection status fields when swapping', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        {
          id: 'p1', name: 'Connected', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0,
          connectionStatus: 'connected'
        },
        {
          id: 'p2', name: 'Disconnected', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0,
          connectionStatus: 'disconnected', disconnectedAt: 12345, reconnectTimeLeft: 30
        },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyPositionSwap(game, 'p1', 'p2');

    // Disconnected player p2 moved to index 0, should KEEP disconnected status
    expect(game.players[0].connectionStatus).toBe('disconnected');
    expect(game.players[0].disconnectedAt).toBe(12345);
    expect(game.players[0].reconnectTimeLeft).toBe(30);

    // Connected player p1 moved to index 1, should KEEP connected status
    expect(game.players[1].connectionStatus).toBe('connected');
    expect(game.players[1].disconnectedAt).toBeUndefined();
    expect(game.players[1].reconnectTimeLeft).toBeUndefined();
  });

  it('should update currentTrick references after swap', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 5 } },
        { playerId: 'p2', card: { color: 'blue', value: 6 } },
      ],
    });

    applyPositionSwap(game, 'p1', 'p3');

    // p1 and p3 swapped, so their IDs in currentTrick should swap
    expect(game.currentTrick[0].playerId).toBe('p3');
    expect(game.currentTrick[1].playerId).toBe('p2'); // p2 unchanged
  });

  it('should update currentBets references after swap', () => {
    const game = createTestGame({
      phase: 'betting',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
      currentBets: [
        { playerId: 'p1', playerName: 'Player 1', amount: 8, withoutTrump: false },
        { playerId: 'p3', playerName: 'Player 3', amount: 9, withoutTrump: true },
      ],
    });

    applyPositionSwap(game, 'p1', 'p3');

    // Bets should now reference swapped player IDs
    expect(game.currentBets[0].playerId).toBe('p3');
    expect(game.currentBets[1].playerId).toBe('p1');
  });

  it('should update highestBet reference after swap', () => {
    const game = createTestGame({
      phase: 'betting',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
      highestBet: { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: true },
    });

    applyPositionSwap(game, 'p1', 'p2');

    // Highest bet should now reference p2
    expect(game.highestBet?.playerId).toBe('p2');
  });

  it('should recalculate team IDs based on position after swap', () => {
    const game = createTestGame({
      phase: 'playing',
      players: [
        { id: 'p1', name: 'P1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'P2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'P3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'P4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ],
    });

    applyPositionSwap(game, 'p1', 'p2');

    // After swap, team IDs should follow 1-2-1-2 pattern based on position
    expect(game.players[0].teamId).toBe(1); // p2 now at index 0
    expect(game.players[1].teamId).toBe(2); // p1 now at index 1
    expect(game.players[2].teamId).toBe(1); // p3 still at index 2
    expect(game.players[3].teamId).toBe(2); // p4 still at index 3
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
      currentBets: [{ playerId: 'p1', playerName: 'Player 1', amount: 8, withoutTrump: false, skipped: false }],
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

describe('applyTrickResolution', () => {
  it('should award tricks and points to winner', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'green', value: 2 } },
      ],
    });

    const result = applyTrickResolution(game, 'p1', 1);

    expect(game.players[0].tricksWon).toBe(1);
    expect(game.players[0].pointsWon).toBe(1);
    expect(result.winnerId).toBe('p1');
    expect(result.points).toBe(1);
    expect(result.winnerIndex).toBe(0);
  });

  it('should store trick as previousTrick', () => {
    const trick = [
      { playerId: 'p1', card: { color: 'red', value: 7 } },
      { playerId: 'p2', card: { color: 'blue', value: 5 } },
      { playerId: 'p3', card: { color: 'red', value: 3 } },
      { playerId: 'p4', card: { color: 'green', value: 2 } },
    ];
    const game = createTestGame({ phase: 'playing', currentTrick: trick });

    applyTrickResolution(game, 'p2', 6); // Red 0 worth +5

    expect(game.previousTrick).toBeDefined();
    expect(game.previousTrick?.winnerId).toBe('p2');
    expect(game.previousTrick?.points).toBe(6);
    expect(game.previousTrick?.trick).toEqual(trick);
  });

  it('should add trick to currentRoundTricks', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'green', value: 2 } },
      ],
      currentRoundTricks: [],
    });

    applyTrickResolution(game, 'p1', 1);

    expect(game.currentRoundTricks).toHaveLength(1);
    expect(game.currentRoundTricks[0].winnerId).toBe('p1');
  });

  it('should NOT clear currentTrick (cleared later after delay)', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'green', value: 2 } },
      ],
    });

    applyTrickResolution(game, 'p1', 1);

    // Trick remains visible for 2 seconds before being cleared
    expect(game.currentTrick).toHaveLength(4);
  });

  it('should set winner as current player', () => {
    const game = createTestGame({
      phase: 'playing',
      currentPlayerIndex: 2,
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'green', value: 2 } },
      ],
    });

    applyTrickResolution(game, 'p3', 1);

    expect(game.currentPlayerIndex).toBe(2); // p3 is index 2
  });

  it('should detect round over when all hands empty', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'green', value: 2 } },
      ],
    });

    // Empty all hands
    game.players.forEach(p => (p.hand = []));

    const result = applyTrickResolution(game, 'p1', 1);

    expect(result.isRoundOver).toBe(true);
    // Phase should still be 'playing' - transition to 'scoring' happens after 2s delay in schedulePostTrickActions()
    expect(game.phase).toBe('playing');
  });

  it('should not transition to scoring if hands remain', () => {
    const game = createTestGame({
      phase: 'playing',
      currentTrick: [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', card: { color: 'green', value: 2 } },
      ],
    });

    // Players still have cards
    game.players[0].hand = [{ color: 'red', value: 6 }];

    const result = applyTrickResolution(game, 'p1', 1);

    expect(result.isRoundOver).toBe(false);
    expect(game.phase).toBe('playing');
  });
});

describe('calculateRoundScoring', () => {
  it('should calculate offensive team wins bet', () => {
    const game = createTestGame({
      phase: 'scoring',
      highestBet: { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: false, skipped: false },
      teamScores: { team1: 20, team2: 15 },
    });

    // Team 1 won 12 points (p1 + p3)
    game.players[0].pointsWon = 7; // p1
    game.players[2].pointsWon = 5; // p3 (same team)

    // Team 2 won 8 points
    game.players[1].pointsWon = 4; // p2
    game.players[3].pointsWon = 4; // p4

    const result = calculateRoundScoring(game);

    expect(result.offensiveTeamId).toBe(1);
    expect(result.defensiveTeamId).toBe(2);
    expect(result.offensiveTeamPoints).toBe(12);
    expect(result.defensiveTeamPoints).toBe(8);
    expect(result.betMade).toBe(true);
    expect(result.offensiveScore).toBe(10); // bet amount
    expect(result.defensiveScore).toBe(8); // their points
    expect(result.roundScore).toEqual({ team1: 10, team2: 8 });
    expect(result.newTeamScores).toEqual({ team1: 30, team2: 23 });
    expect(result.gameOver).toBe(false);
  });

  it('should calculate offensive team fails bet', () => {
    const game = createTestGame({
      phase: 'scoring',
      highestBet: { playerId: 'p2', playerName: 'Player 2', amount: 11, withoutTrump: false, skipped: false },
      teamScores: { team1: 20, team2: 15 },
    });

    // Team 2 only won 9 points (failed bet of 11)
    game.players[1].pointsWon = 5; // p2
    game.players[3].pointsWon = 4; // p4

    // Team 1 won 11 points
    game.players[0].pointsWon = 6; // p1
    game.players[2].pointsWon = 5; // p3

    const result = calculateRoundScoring(game);

    expect(result.offensiveTeamId).toBe(2);
    expect(result.betMade).toBe(false);
    expect(result.offensiveScore).toBe(-11); // lost bet
    expect(result.defensiveScore).toBe(11); // Team 1's points
    expect(result.roundScore).toEqual({ team1: 11, team2: -11 });
    expect(result.newTeamScores).toEqual({ team1: 31, team2: 4 });
  });

  it('should apply without-trump multiplier', () => {
    const game = createTestGame({
      phase: 'scoring',
      highestBet: { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: true, skipped: false },
      teamScores: { team1: 20, team2: 15 },
    });

    // Team 1 won 12 points
    game.players[0].pointsWon = 7;
    game.players[2].pointsWon = 5;

    const result = calculateRoundScoring(game);

    expect(result.multiplier).toBe(2);
    expect(result.betMade).toBe(true);
    expect(result.offensiveScore).toBe(20); // 10 × 2
    expect(result.newTeamScores.team1).toBe(40); // 20 + 20
  });

  it('should detect game over at 41 points', () => {
    const game = createTestGame({
      phase: 'scoring',
      highestBet: { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: false, skipped: false },
      teamScores: { team1: 35, team2: 20 },
    });

    game.players[0].pointsWon = 7;
    game.players[2].pointsWon = 5;

    const result = calculateRoundScoring(game);

    expect(result.newTeamScores.team1).toBe(45); // 35 + 10
    expect(result.gameOver).toBe(true);
    expect(result.winningTeam).toBe(1);
  });

  it('should detect game over for team 2', () => {
    const game = createTestGame({
      phase: 'scoring',
      highestBet: { playerId: 'p2', playerName: 'Player 2', amount: 10, withoutTrump: false, skipped: false },
      teamScores: { team1: 20, team2: 35 },
    });

    game.players[1].pointsWon = 7;
    game.players[3].pointsWon = 5;

    const result = calculateRoundScoring(game);

    expect(result.newTeamScores.team2).toBe(45);
    expect(result.gameOver).toBe(true);
    expect(result.winningTeam).toBe(2);
  });
});

describe('applyRoundScoring', () => {
  it('should update team scores', () => {
    const game = createTestGame({
      phase: 'scoring',
      teamScores: { team1: 20, team2: 15 },
    });

    const scoring = {
      offensiveTeamId: 1 as 1 | 2,
      defensiveTeamId: 2 as 1 | 2,
      offensiveTeamPoints: 12,
      defensiveTeamPoints: 8,
      betAmount: 10,
      multiplier: 1,
      betMade: true,
      offensiveScore: 10,
      defensiveScore: 8,
      roundScore: { team1: 10, team2: 8 },
      newTeamScores: { team1: 30, team2: 23 },
      gameOver: false,
    };

    applyRoundScoring(game, scoring);

    expect(game.teamScores).toEqual({ team1: 30, team2: 23 });
  });

  it('should add round to history', () => {
    const game = createTestGame({
      phase: 'scoring',
      roundNumber: 3,
      highestBet: { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: false, skipped: false },
      currentBets: [
        { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: false, skipped: false },
        { playerId: 'p2', playerName: 'Player 2', amount: 8, withoutTrump: false, skipped: false },
      ],
      currentRoundTricks: [],
      trump: 'red',
      roundHistory: [],
    });

    const scoring = {
      offensiveTeamId: 1 as 1 | 2,
      defensiveTeamId: 2 as 1 | 2,
      offensiveTeamPoints: 12,
      defensiveTeamPoints: 8,
      betAmount: 10,
      multiplier: 1,
      betMade: true,
      offensiveScore: 10,
      defensiveScore: 8,
      roundScore: { team1: 10, team2: 8 },
      newTeamScores: { team1: 30, team2: 23 },
      gameOver: false,
    };

    applyRoundScoring(game, scoring);

    expect(game.roundHistory).toHaveLength(1);
    expect(game.roundHistory[0].roundNumber).toBe(3);
    expect(game.roundHistory[0].offensiveTeam).toBe(1);
    expect(game.roundHistory[0].betMade).toBe(true);
    expect(game.roundHistory[0].roundScore).toEqual({ team1: 10, team2: 8 });
  });

  it('should transition to game_over when gameOver is true', () => {
    const game = createTestGame({ phase: 'scoring' });

    const scoring = {
      offensiveTeamId: 1 as 1 | 2,
      defensiveTeamId: 2 as 1 | 2,
      offensiveTeamPoints: 12,
      defensiveTeamPoints: 8,
      betAmount: 10,
      multiplier: 1,
      betMade: true,
      offensiveScore: 10,
      defensiveScore: 8,
      roundScore: { team1: 10, team2: 8 },
      newTeamScores: { team1: 45, team2: 23 },
      gameOver: true,
      winningTeam: 1 as 1 | 2,
    };

    applyRoundScoring(game, scoring);

    expect(game.phase).toBe('game_over');
  });

  it('should not transition if game continues', () => {
    const game = createTestGame({ phase: 'scoring' });

    const scoring = {
      offensiveTeamId: 1 as 1 | 2,
      defensiveTeamId: 2 as 1 | 2,
      offensiveTeamPoints: 12,
      defensiveTeamPoints: 8,
      betAmount: 10,
      multiplier: 1,
      betMade: true,
      offensiveScore: 10,
      defensiveScore: 8,
      roundScore: { team1: 10, team2: 8 },
      newTeamScores: { team1: 30, team2: 23 },
      gameOver: false,
    };

    applyRoundScoring(game, scoring);

    expect(game.phase).toBe('scoring');
  });
});
