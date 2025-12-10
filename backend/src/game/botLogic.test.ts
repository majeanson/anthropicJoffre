/**
 * Bot Logic Tests
 * Tests for AI card selection algorithms
 */

import { describe, it, expect } from 'vitest';
import { selectBotCard } from './botLogic';
import { GameState, Card, Player, TrickCard } from '../types/game';

// Helper to create a test game state
function createTestGame(overrides: Partial<GameState> = {}): GameState {
  const defaultPlayers: Player[] = [
    { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
    { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
    { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
  ];

  return {
    id: 'test-game',
    creatorId: 'p1',
    players: defaultPlayers,
    phase: 'playing',
    currentPlayerIndex: 0,
    currentBets: [],
    currentTrick: [],
    trump: 'red',
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

// Helper to create cards
function card(color: Card['color'], value: Card['value']): Card {
  return { color, value };
}

describe('Bot Logic', () => {
  describe('selectBotCard', () => {
    it('should return null if player not found', () => {
      const game = createTestGame();
      const result = selectBotCard(game, 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return null if player has no cards', () => {
      const game = createTestGame();
      game.players[0].hand = [];
      const result = selectBotCard(game, 'p1');
      expect(result).toBeNull();
    });

    it('should return a card from player hand', () => {
      const game = createTestGame();
      game.players[0].hand = [card('red', 5), card('blue', 3)];
      const result = selectBotCard(game, 'p1');
      expect(result).not.toBeNull();
      expect(game.players[0].hand).toContainEqual(result);
    });

    it('should follow suit when led suit cards are available', () => {
      const game = createTestGame({
        trump: 'green',
        currentTrick: [{ playerId: 'p4', card: card('blue', 5) }],
      });
      game.players[0].hand = [card('red', 7), card('blue', 2), card('green', 4)];

      const result = selectBotCard(game, 'p1');
      expect(result?.color).toBe('blue'); // Must follow blue
    });

    it('should play any card when cannot follow suit', () => {
      const game = createTestGame({
        trump: 'green',
        currentTrick: [{ playerId: 'p4', card: card('blue', 5) }],
      });
      game.players[0].hand = [card('red', 7), card('green', 4)]; // No blue

      const result = selectBotCard(game, 'p1');
      expect(result).not.toBeNull();
      // Can play red or green
      expect(['red', 'green']).toContain(result?.color);
    });
  });

  describe('Brown 0 Strategy', () => {
    it('should try to get rid of brown 0 when not winning', () => {
      const game = createTestGame({
        trump: 'green',
        currentTrick: [{ playerId: 'p4', card: card('brown', 5) }],
      });
      game.players[0].hand = [card('brown', 0), card('brown', 3), card('brown', 7)];

      const result = selectBotCard(game, 'p1');
      // Bot should try to dump brown 0 since opponent is likely winning
      expect(result).toEqual(card('brown', 0));
    });
  });

  describe('Red 0 Strategy', () => {
    it('should try to win red 0 with minimal card', () => {
      const game = createTestGame({
        trump: 'green',
        currentTrick: [
          { playerId: 'p4', card: card('red', 0) }, // Red 0 is in play (+5 points)
        ],
      });
      game.players[0].hand = [card('red', 3), card('red', 7)];

      const result = selectBotCard(game, 'p1');
      // Should use lowest winning card to take red 0
      expect(result).toEqual(card('red', 3));
    });
  });

  describe('Partner Strategy', () => {
    it('should play low when partner is winning (position 3)', () => {
      const game = createTestGame({
        trump: 'green',
        currentTrick: [
          { playerId: 'p4', card: card('blue', 3) }, // Opponent led
          { playerId: 'p3', card: card('blue', 7) }, // Partner winning (p3 is p1's partner)
        ],
        currentPlayerIndex: 0,
      });
      // p1 and p3 are team 1 (partners)
      game.players[0].hand = [card('blue', 1), card('blue', 5)];

      const result = selectBotCard(game, 'p1');
      // Should dump low card since partner is winning
      expect(result).toEqual(card('blue', 1));
    });

    it('should try to win when opponent is winning (position 4)', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [
          { playerId: 'p3', card: card('blue', 3) }, // Partner led
          { playerId: 'p2', card: card('blue', 7) }, // Opponent winning
          { playerId: 'p4', card: card('blue', 4) }, // Opponent
        ],
        currentPlayerIndex: 0,
      });
      // No blue cards - can trump
      game.players[0].hand = [card('green', 2), card('red', 1)];

      const result = selectBotCard(game, 'p1');
      // Should trump to beat opponent's winning card (no blue to follow)
      expect(result).toEqual(card('red', 1));
    });
  });

  describe('Trump Strategy', () => {
    it('should use trump to win when cannot follow suit', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [{ playerId: 'p4', card: card('blue', 7) }],
      });
      game.players[0].hand = [card('green', 5), card('red', 2)]; // No blue, has trump

      const result = selectBotCard(game, 'p1');
      // Should use low trump to win
      expect(result).toEqual(card('red', 2));
    });

    it('should beat opponent trump with higher trump', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [
          { playerId: 'p4', card: card('blue', 5) },
          { playerId: 'p3', card: card('red', 3) }, // Partner trumped
        ],
      });
      // Opponent might overtrump, so check if we can beat existing trump
      game.players[0].hand = [card('blue', 2), card('red', 5)];

      const result = selectBotCard(game, 'p1');
      // Must follow blue since we have it
      expect(result?.color).toBe('blue');
    });
  });

  describe('Leading Strategy (Position 1)', () => {
    it('should lead from longest suit', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [], // Leading
      });
      game.players[0].hand = [
        card('blue', 3), card('blue', 5), card('blue', 7), // 3 blues
        card('green', 4), // 1 green
      ];

      const result = selectBotCard(game, 'p1');
      // Should lead from blue (longest suit)
      expect(result?.color).toBe('blue');
    });

    it('should avoid leading with trump unless necessary', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [],
      });
      game.players[0].hand = [
        card('red', 5), card('red', 7), // Trump
        card('blue', 4), // Non-trump
      ];

      const result = selectBotCard(game, 'p1');
      // Should prefer non-trump lead
      expect(result?.color).toBe('blue');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single card in hand', () => {
      const game = createTestGame();
      game.players[0].hand = [card('red', 0)];

      const result = selectBotCard(game, 'p1');
      expect(result).toEqual(card('red', 0));
    });

    it('should handle all trump hand', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [],
      });
      game.players[0].hand = [card('red', 1), card('red', 3), card('red', 5)];

      const result = selectBotCard(game, 'p1');
      expect(result?.color).toBe('red');
    });

    it('should handle no trump set (without trump bet)', () => {
      const game = createTestGame({
        trump: null, // No trump
        currentTrick: [],
      });
      game.players[0].hand = [card('red', 5), card('blue', 3)];

      const result = selectBotCard(game, 'p1');
      expect(result).not.toBeNull();
    });
  });

  describe('Trick Winner Detection', () => {
    it('should identify trump as winning over non-trump', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [
          { playerId: 'p4', card: card('blue', 7) }, // Led blue 7
          { playerId: 'p3', card: card('red', 1) },  // Trumped with red 1
        ],
      });
      game.players[0].hand = [card('blue', 5)]; // Must follow blue

      const result = selectBotCard(game, 'p1');
      // Partner (p3) is winning with trump
      expect(result).toEqual(card('blue', 5));
    });

    it('should identify higher trump as beating lower trump', () => {
      const game = createTestGame({
        trump: 'red',
        currentTrick: [
          { playerId: 'p4', card: card('blue', 7) },
          { playerId: 'p3', card: card('red', 2) }, // Partner trumped low
          { playerId: 'p2', card: card('red', 5) }, // Opponent overtrumped
        ],
      });
      game.players[0].hand = [card('blue', 3), card('red', 7)];

      const result = selectBotCard(game, 'p1');
      // Must follow blue, but p2 (opponent) is winning
      expect(result?.color).toBe('blue');
    });
  });

  describe('Suit Following Rules', () => {
    it('should return only led suit cards when available', () => {
      const game = createTestGame({
        currentTrick: [{ playerId: 'p4', card: card('green', 5) }],
      });
      game.players[0].hand = [
        card('green', 2),
        card('red', 7),
        card('blue', 3),
      ];

      const result = selectBotCard(game, 'p1');
      expect(result?.color).toBe('green');
    });

    it('should return all cards when cannot follow suit', () => {
      const game = createTestGame({
        currentTrick: [{ playerId: 'p4', card: card('green', 5) }],
      });
      game.players[0].hand = [
        card('red', 7),
        card('blue', 3),
      ];

      const result = selectBotCard(game, 'p1');
      // Can play any card
      expect(['red', 'blue']).toContain(result?.color);
    });
  });
});
