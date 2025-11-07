/**
 * Bot Helpers Tests
 * Sprint 7 Task 4: Utility Module Tests
 */

import { describe, it, expect } from 'vitest';
import { getNextBotName, canAddBot, areTeammates } from './botHelpers';
import type { GameState } from '../types/game';

function createTestGame(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    players: [],
    phase: 'team_selection',
    currentPlayerId: '',
    currentBets: [],
    trumpColor: null,
    currentRound: 0,
    roundNumber: 0,
    scores: { team1: 0, team2: 0 },
    currentTrick: [],
    dealerIndex: 0,
    bettingPlayerIndex: 0,
    ...overrides,
  } as GameState;
}

describe('botHelpers', () => {
  describe('getNextBotName', () => {
    it('should return Bot 1 for empty game', () => {
      const game = createTestGame();
      expect(getNextBotName(game)).toBe('Bot 1');
    });

    it('should return Bot 2 when Bot 1 exists', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Bot 1', hand: [], teamId: 1, isBot: true, isConnected: true },
        ],
      });
      expect(getNextBotName(game)).toBe('Bot 2');
    });

    it('should fill gaps in bot numbering', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Bot 1', hand: [], teamId: 1, isBot: true, isConnected: true },
          { id: '2', name: 'Bot 3', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });
      expect(getNextBotName(game)).toBe('Bot 2');
    });

    it('should return Bot 3 when Bot 1 and 2 exist', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Bot 1', hand: [], teamId: 1, isBot: true, isConnected: true },
          { id: '2', name: 'Bot 2', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });
      expect(getNextBotName(game)).toBe('Bot 3');
    });

    it('should ignore non-bot players', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'Bot 1', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });
      expect(getNextBotName(game)).toBe('Bot 2');
    });
  });

  describe('canAddBot', () => {
    it('should allow adding bots when less than 3 exist', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Human', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'Bot 1', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });
      expect(canAddBot(game)).toBe(true);
    });

    it('should reject adding bots when 3 already exist', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Human', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'Bot 1', hand: [], teamId: 1, isBot: true, isConnected: true },
          { id: '3', name: 'Bot 2', hand: [], teamId: 2, isBot: true, isConnected: true },
          { id: '4', name: 'Bot 3', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });
      expect(canAddBot(game)).toBe(false);
    });

    it('should allow adding bots to empty game', () => {
      const game = createTestGame();
      expect(canAddBot(game)).toBe(true);
    });
  });

  describe('areTeammates', () => {
    it('should return true for teammates', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'Player2', hand: [], teamId: 1, isBot: false, isConnected: true },
        ],
      });
      expect(areTeammates(game, 'Player1', 'Player2')).toBe(true);
    });

    it('should return false for non-teammates', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'Player2', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });
      expect(areTeammates(game, 'Player1', 'Player2')).toBe(false);
    });

    it('should return false when player not found', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
        ],
      });
      expect(areTeammates(game, 'Player1', 'NonExistent')).toBe(false);
    });

    it('should return false when both players not found', () => {
      const game = createTestGame();
      expect(areTeammates(game, 'Player1', 'Player2')).toBe(false);
    });
  });
});
