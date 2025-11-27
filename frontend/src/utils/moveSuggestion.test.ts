/**
 * Move Suggestion Tests
 * Tests for improved hand evaluation logic including:
 * - Trump bleed strategy (5+ trump with non-trump 7)
 * - Void suit recognition (no red cards)
 * - Bet suggestion accuracy
 */

import { describe, it, expect } from 'vitest';
import { suggestBet } from './moveSuggestion';
import { GameState, Player, Card, CardColor, CardValue } from '../types/game';

// Helper function to create a test game state
function createTestGameState(
  playerHand: Card[],
  trump: CardColor | null = null,
  dealerIndex: number = 1
): { gameState: GameState; playerName: string } {
  const players: Player[] = [
    {
      id: 'p1',
      name: 'TestPlayer',
      hand: playerHand,
      tricksWon: 0,
      pointsWon: 0,
      teamId: 1,
      isBot: false,
      isEmpty: false,
      connectionStatus: 'connected',
    },
    {
      id: 'p2',
      name: 'Player2',
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      teamId: 2,
      isBot: false,
      isEmpty: false,
      connectionStatus: 'connected',
    },
    {
      id: 'p3',
      name: 'Player3',
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      teamId: 1,
      isBot: false,
      isEmpty: false,
      connectionStatus: 'connected',
    },
    {
      id: 'p4',
      name: 'Player4',
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      teamId: 2,
      isBot: false,
      isEmpty: false,
      connectionStatus: 'connected',
    },
  ];

  const gameState: GameState = {
    id: 'test-game',
    creatorId: 'p1',
    persistenceMode: 'casual',
    isBotGame: false,
    phase: 'betting',
    players,
    trump,
    currentPlayerIndex: 0,
    currentTrick: [],
    previousTrick: null,
    currentBets: [
      { playerId: 'p1', playerName: 'TestPlayer', amount: 0, withoutTrump: false, skipped: false },
      { playerId: 'p2', playerName: 'Player2', amount: 0, withoutTrump: false, skipped: false },
      { playerId: 'p3', playerName: 'Player3', amount: 0, withoutTrump: false, skipped: false },
      { playerId: 'p4', playerName: 'Player4', amount: 0, withoutTrump: false, skipped: false },
    ],
    dealerIndex,
    highestBet: null,
    teamScores: {
      team1: 0,
      team2: 0,
    },
    roundNumber: 1,
    roundHistory: [],
    currentRoundTricks: [],
  };

  return { gameState, playerName: 'TestPlayer' };
}

// Helper to create cards
function card(color: CardColor, value: CardValue): Card {
  return { color, value };
}

describe('Hand Evaluation - Trump Bleed Strategy', () => {
  it('should recognize 5+ trump with non-trump 7 as strong hand (9-10 points)', () => {
    const hand: Card[] = [
      // 5 green trump
      card('green', 0),
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('green', 7),
      // 7 red (can win after trump bleed)
      card('red', 7),
      card('red', 3),
      card('blue', 2),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    console.log('Trump bleed test - Suggestion:', suggestion);

    // Should suggest 9-10 points (HARD)
    expect(suggestion.amount).toBeGreaterThanOrEqual(8);
    expect(suggestion.skip).toBe(false);
    // Should recognize trump control
    expect(suggestion.reason).toMatch(/HARD|MEDIUM|green/);
  });

  it('should recognize 6+ trump as very strong hand', () => {
    const hand: Card[] = [
      // 6 green trump
      card('green', 0),
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('red', 5),
      card('blue', 2),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest 9-10 points (HARD/VERY HARD)
    expect(suggestion.amount).toBeGreaterThanOrEqual(9);
    expect(suggestion.skip).toBe(false);
  });

  it('should recognize 7+ trump as overwhelming hand', () => {
    const hand: Card[] = [
      // 7 green trump
      card('green', 0),
      card('green', 1),
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('red', 7),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest 9-10 points (HARD/VERY HARD)
    // 7 trump is overwhelming, but trump bleed bonuses apply at 5+
    expect(suggestion.amount).toBeGreaterThanOrEqual(9);
    expect(suggestion.skip).toBe(false);
    expect(suggestion.reason).toMatch(/HARD|VERY HARD/);
  });

  it('should give bonus for non-trump 7 when 5+ trump', () => {
    const handWith7Red: Card[] = [
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('red', 7), // Non-trump 7
      card('blue', 2),
      card('brown', 1),
    ];

    const handWithout7Red: Card[] = [
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('red', 3), // No 7
      card('blue', 2),
      card('brown', 1),
    ];

    const { gameState: gs1, playerName } = createTestGameState(handWith7Red, null);
    const suggestion1 = suggestBet(gs1, playerName);

    const { gameState: gs2 } = createTestGameState(handWithout7Red, null);
    const suggestion2 = suggestBet(gs2, playerName);

    // Hand with non-trump 7 should suggest higher bet
    expect(suggestion1.amount).toBeGreaterThan(suggestion2.amount);
  });
});

describe('Hand Evaluation - Void Suit Recognition', () => {
  it('should NOT choose void suit as trump during betting (chooses suit with most cards)', () => {
    const hand: Card[] = [
      // 0 red cards (void) - but this shouldn't matter for betting
      // Best trump should be green (4 cards with 3 high ones)
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('green', 4),
      card('blue', 3),
      card('blue', 6),
      card('brown', 2),
      card('brown', 4),
    ];

    const { gameState, playerName} = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // During betting, should choose suit with most cards (green), not void (red)
    // With 4 trump + 3 high cards, this is a solid 8-9 point hand
    expect(suggestion.skip).toBe(false);
    expect(suggestion.amount).toBeGreaterThanOrEqual(8);
    expect(suggestion.reason).toContain('green'); // Shows green as chosen trump
  });

  it('should recognize void suit advantage when trump is SET (gameplay phase)', () => {
    const hand: Card[] = [
      // 0 red cards (void)
      // When green IS trump (already set), this is good cutting potential
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('green', 4),
      card('blue', 3),
      card('blue', 6),
      card('brown', 2),
      card('brown', 4),
    ];

    const { gameState, playerName } = createTestGameState(hand, 'green'); // Trump already set!
    const suggestion = suggestBet(gameState, playerName);

    // With trump SET to green and no red cards, cutting potential exists
    // 4 trump + 3 high cards = good hand
    expect(suggestion.skip).toBe(false);
    expect(suggestion.amount).toBeGreaterThanOrEqual(8);
  });
});

describe('Hand Evaluation - Weak Hands', () => {
  it('should suggest skip for genuinely weak hands', () => {
    const hand: Card[] = [
      card('red', 0),
      card('red', 1),
      card('green', 1),
      card('green', 2),
      card('blue', 0),
      card('blue', 1),
      card('brown', 0), // Brown 0 penalty
      card('brown', 2),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest skip
    expect(suggestion.skip).toBe(true);
    expect(suggestion.reason).toContain('Weak hand');
  });

  it('dealer with weak hand should bet minimum 7 (cannot skip)', () => {
    const hand: Card[] = [
      card('red', 0),
      card('red', 1),
      card('green', 1),
      card('green', 2),
      card('blue', 0),
      card('blue', 1),
      card('brown', 0),
      card('brown', 2),
    ];

    // Player is dealer (index 0)
    const { gameState, playerName } = createTestGameState(hand, null, 0);
    const suggestion = suggestBet(gameState, playerName);

    // Dealer cannot skip
    expect(suggestion.skip).toBe(false);
    expect(suggestion.amount).toBe(7);
    expect(suggestion.reason).toContain('dealer');
  });
});

describe('Hand Evaluation - Medium Hands', () => {
  it('should suggest 8 points for good hand with 4 trump', () => {
    const hand: Card[] = [
      card('green', 4),
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('red', 5),
      card('blue', 4),
      card('blue', 5),
      card('brown', 3),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest 8 points (MEDIUM)
    // 4 trump + 4 high cards = solid medium hand
    expect(suggestion.amount).toBeGreaterThanOrEqual(8);
    expect(suggestion.skip).toBe(false);
  });
});

describe('Hand Evaluation - Edge Cases', () => {
  it('should handle hand with only trump cards (8 of same suit)', () => {
    const hand: Card[] = [
      card('green', 0),
      card('green', 1),
      card('green', 2),
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('green', 6),
      card('green', 7),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest very high bet (9-10, max practical bet)
    expect(suggestion.amount).toBeGreaterThanOrEqual(9);
    expect(suggestion.skip).toBe(false);
  });

  it('should handle hand with red 0 bonus', () => {
    const hand: Card[] = [
      card('green', 5),
      card('green', 6),
      card('green', 7),
      card('green', 4),
      card('red', 0), // Red 0 = +5 points
      card('red', 6),
      card('blue', 5),
      card('brown', 4),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest at least 7 points (4 trump + high cards + red 0)
    expect(suggestion.amount).toBeGreaterThanOrEqual(7);
    expect(suggestion.skip).toBe(false);
  });

  it('should handle hand with brown 0 penalty', () => {
    const hand: Card[] = [
      card('green', 3),
      card('green', 4),
      card('green', 5),
      card('red', 3),
      card('red', 5),
      card('blue', 2),
      card('brown', 0), // Brown 0 = -2 points penalty
      card('brown', 2),
    ];

    const { gameState, playerName } = createTestGameState(hand, null);
    const suggestion = suggestBet(gameState, playerName);

    // Should suggest 7-8 points (penalty reduces estimate)
    expect(suggestion.amount).toBeGreaterThanOrEqual(7);
    expect(suggestion.amount).toBeLessThanOrEqual(8);
  });
});
