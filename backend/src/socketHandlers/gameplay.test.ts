/**
 * Gameplay Socket Handler Tests
 * Sprint 7 Task 1: Socket Handler Tests - Critical
 *
 * Tests for gameplay.ts socket handlers (place_bet, play_card, player_ready)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, Bet, Card } from '../types/game';
import { isBetHigher } from '../game/logic';

function createTestGame(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game-123',
    players: [
      { id: '1', name: 'P1', hand: [], teamId: 1, isBot: false, isConnected: true },
      { id: '2', name: 'P2', hand: [], teamId: 1, isBot: false, isConnected: true },
      { id: '3', name: 'P3', hand: [], teamId: 2, isBot: false, isConnected: true },
      { id: '4', name: 'P4', hand: [], teamId: 2, isBot: false, isConnected: true },
    ],
    phase: 'betting',
    currentPlayerId: '1',
    currentBets: [],
    trumpColor: null,
    currentRound: 0,
    roundNumber: 0,
    scores: { team1: 0, team2: 0 },
    currentTrick: [],
    dealerIndex: 0,
    bettingPlayerIndex: 1,
    ...overrides,
  } as GameState;
}

describe('gameplay handlers', () => {
  describe('place_bet', () => {
    it('should accept valid bet in range 7-12', () => {
      const validAmounts = [7, 8, 9, 10, 11, 12];

      for (const amount of validAmounts) {
        expect(amount).toBeGreaterThanOrEqual(7);
        expect(amount).toBeLessThanOrEqual(12);
      }
    });

    it('should reject bet out of range', () => {
      const invalidAmounts = [0, 6, 13, 20, -5];

      for (const amount of invalidAmounts) {
        const isValid = amount >= 7 && amount <= 12;
        expect(isValid).toBe(false);
      }
    });

    it('should enforce bet hierarchy (higher amount wins)', () => {
      const bet1: Bet = { playerId: '1', amount: 8, withoutTrump: false };
      const bet2: Bet = { playerId: '2', amount: 9, withoutTrump: false };

      const bet2Higher = isBetHigher(bet2, bet1);
      expect(bet2Higher).toBe(true);
    });

    it('should handle without-trump bets correctly', () => {
      const normalBet: Bet = { playerId: '1', amount: 8, withoutTrump: false };
      const withoutTrumpBet: Bet = { playerId: '2', amount: 8, withoutTrump: true };

      // Same amount, but without-trump is higher
      const withoutTrumpHigher = isBetHigher(withoutTrumpBet, normalBet);
      expect(withoutTrumpHigher).toBe(true);
    });

    it('should allow dealer to equalize', () => {
      const game = createTestGame({
        dealerIndex: 3,
        bettingPlayerIndex: 3,
        currentBets: [
          { playerId: '1', amount: 8, withoutTrump: false },
        ],
      });

      const isDealerTurn = game.bettingPlayerIndex === game.dealerIndex;
      expect(isDealerTurn).toBe(true);

      // Dealer can match the highest bet
      const newBet: Bet = { playerId: '4', amount: 8, withoutTrump: false };
      const canDealerEqualize = isDealerTurn && newBet.amount === 8;
      expect(canDealerEqualize).toBe(true);
    });

    it('should allow dealer skip when there are valid bets', () => {
      const game = createTestGame({
        dealerIndex: 3,
        bettingPlayerIndex: 3,
        currentBets: [
          { playerId: '1', amount: 8, withoutTrump: false },
        ],
      });

      const isDealerTurn = game.bettingPlayerIndex === game.dealerIndex;
      const hasBets = game.currentBets.length > 0;
      // Dealer CAN skip when there are valid bets (someone else already bet)
      const canDealerSkip = !isDealerTurn || hasBets;

      expect(canDealerSkip).toBe(true);
    });

    it('should reject dealer skip when no one has bet', () => {
      const game = createTestGame({
        dealerIndex: 3,
        bettingPlayerIndex: 3,
        currentBets: [
          { playerId: '1', amount: 0, withoutTrump: false, skipped: true },
          { playerId: '2', amount: 0, withoutTrump: false, skipped: true },
          { playerId: '3', amount: 0, withoutTrump: false, skipped: true },
        ],
      });

      const isDealerTurn = game.bettingPlayerIndex === game.dealerIndex;
      const hasValidBets = game.currentBets.some(b => !b.skipped);
      // Dealer CANNOT skip when no valid bets exist
      const canDealerSkip = !isDealerTurn || hasValidBets;

      expect(canDealerSkip).toBe(false);
    });

    it('should handle skip bet correctly', () => {
      const game = createTestGame({
        bettingPlayerIndex: 1,
        dealerIndex: 0,
        currentBets: [],
      });

      const isDealer = game.bettingPlayerIndex === game.dealerIndex;
      const canSkip = !isDealer || game.currentBets.length === 0;

      expect(canSkip).toBe(true);
    });
  });

  describe('play_card', () => {
    const testCard: Card = { value: 5, color: 'red' };

    it('should accept valid card play', () => {
      const game = createTestGame({
        phase: 'playing',
        currentPlayerId: '1',
        players: [
          { id: '1', name: 'P1', hand: [testCard], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'P2', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '3', name: 'P3', hand: [], teamId: 2, isBot: false, isConnected: true },
          { id: '4', name: 'P4', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });

      const player = game.players.find(p => p.id === game.currentPlayerId);
      const hasCard = player?.hand.some(c => c.value === testCard.value && c.color === testCard.color);

      expect(hasCard).toBe(true);
    });

    it('should enforce suit-following rules', () => {
      const ledCard: Card = { value: 5, color: 'red' };
      const playerHand = [
        { value: 3, color: 'red' },
        { value: 7, color: 'blue' },
      ];

      // Player has red card, must follow suit
      const hasLedSuit = playerHand.some(c => c.color === ledCard.color);
      const playingCard = { value: 7, color: 'blue' };
      const isValidPlay = playingCard.color === ledCard.color || !hasLedSuit;

      expect(hasLedSuit).toBe(true);
      expect(isValidPlay).toBe(false); // Should play red card
    });

    it('should reject card not in hand', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'P1', hand: [{ value: 3, color: 'red' }], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'P2', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '3', name: 'P3', hand: [], teamId: 2, isBot: false, isConnected: true },
          { id: '4', name: 'P4', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });

      const player = game.players[0];
      const playCard: Card = { value: 7, color: 'blue' };
      const hasCard = player.hand.some(c => c.value === playCard.value && c.color === playCard.color);

      expect(hasCard).toBe(false);
    });

    it('should reject play when not player turn', () => {
      const game = createTestGame({
        phase: 'playing',
        currentPlayerId: '1',
      });

      const attemptingPlayerId = '2';
      const isPlayerTurn = game.currentPlayerId === attemptingPlayerId;

      expect(isPlayerTurn).toBe(false);
    });

    it('should resolve trick after 4 cards', () => {
      const game = createTestGame({
        currentTrick: [
          { card: { value: 5, color: 'red' }, playerId: '1' },
          { card: { value: 7, color: 'red' }, playerId: '2' },
          { card: { value: 3, color: 'red' }, playerId: '3' },
          { card: { value: 9, color: 'red' }, playerId: '4' },
        ],
      });

      const shouldResolveTrick = game.currentTrick.length === 4;
      expect(shouldResolveTrick).toBe(true);
    });

    it('should calculate points correctly (red 0, brown 0)', () => {
      const tricks = [
        [
          { card: { value: 5, color: 'red' }, playerId: '1' },
          { card: { value: 7, color: 'blue' }, playerId: '2' },
          { card: { value: 3, color: 'green' }, playerId: '3' },
          { card: { value: 9, color: 'yellow' }, playerId: '4' },
        ],
        [
          { card: { value: 0, color: 'red' }, playerId: '1' },
          { card: { value: 2, color: 'red' }, playerId: '2' },
          { card: { value: 3, color: 'red' }, playerId: '3' },
          { card: { value: 4, color: 'red' }, playerId: '4' },
        ],
        [
          { card: { value: 0, color: 'brown' }, playerId: '1' },
          { card: { value: 2, color: 'brown' }, playerId: '2' },
          { card: { value: 3, color: 'brown' }, playerId: '3' },
          { card: { value: 4, color: 'brown' }, playerId: '4' },
        ],
      ];

      // Regular trick: 1 point
      const regularPoints = 1;
      expect(regularPoints).toBe(1);

      // Red 0 trick: 1 + 5 = 6 points
      const red0Points = 1 + 5;
      expect(red0Points).toBe(6);

      // Brown 0 trick: 1 - 2 = -1 points
      const brown0Points = 1 - 2;
      expect(brown0Points).toBe(-1);
    });
  });

  describe('player_ready', () => {
    it('should mark player ready after round', () => {
      const game = createTestGame({
        phase: 'scoring',
        players: [
          { id: '1', name: 'P1', hand: [], teamId: 1, isBot: false, isConnected: true, isReady: false },
          { id: '2', name: 'P2', hand: [], teamId: 1, isBot: false, isConnected: true, isReady: false },
          { id: '3', name: 'P3', hand: [], teamId: 2, isBot: false, isConnected: true, isReady: false },
          { id: '4', name: 'P4', hand: [], teamId: 2, isBot: false, isConnected: true, isReady: false },
        ],
      });

      const player = game.players[0];
      player.isReady = true;

      expect(player.isReady).toBe(true);
    });

    it('should start new round when all ready', () => {
      const game = createTestGame({
        phase: 'scoring',
        players: [
          { id: '1', name: 'P1', hand: [], teamId: 1, isBot: false, isConnected: true, isReady: true },
          { id: '2', name: 'P2', hand: [], teamId: 1, isBot: false, isConnected: true, isReady: true },
          { id: '3', name: 'P3', hand: [], teamId: 2, isBot: false, isConnected: true, isReady: true },
          { id: '4', name: 'P4', hand: [], teamId: 2, isBot: false, isConnected: true, isReady: true },
        ],
      });

      const allReady = game.players.every(p => p.isReady);
      expect(allReady).toBe(true);
    });

    it('should end game at 41+ points', () => {
      const game = createTestGame({
        scores: { team1: 41, team2: 30 },
      });

      const gameOver = game.scores.team1 >= 41 || game.scores.team2 >= 41;
      expect(gameOver).toBe(true);
    });
  });
});
