/**
 * Player Helpers Tests
 * Sprint 7 Task 4: Utility Module Tests
 */

import { describe, it, expect } from 'vitest';
import { findPlayer, findPlayerIndex, hasAtLeastOneHuman } from './playerHelpers';
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

describe('playerHelpers', () => {
  describe('findPlayer', () => {
    it('should find player by socket ID', () => {
      const game = createTestGame({
        players: [
          { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: 'socket-2', name: 'Player2', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });

      const player = findPlayer(game, 'socket-1');
      expect(player).toBeDefined();
      expect(player?.name).toBe('Player1');
    });

    it('should find player by name when socket ID not found', () => {
      const game = createTestGame({
        players: [
          { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: 'socket-2', name: 'Player2', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });

      const player = findPlayer(game, 'wrong-socket', 'Player2');
      expect(player).toBeDefined();
      expect(player?.name).toBe('Player2');
      expect(player?.id).toBe('socket-2');
    });

    it('should return undefined if player not found', () => {
      const game = createTestGame({
        players: [
          { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
        ],
      });

      const player = findPlayer(game, 'wrong-socket', 'WrongName');
      expect(player).toBeUndefined();
    });

    it('should handle empty player array', () => {
      const game = createTestGame({ players: [] });
      const player = findPlayer(game, 'socket-1');
      expect(player).toBeUndefined();
    });
  });

  describe('findPlayerIndex', () => {
    it('should find player index by socket ID', () => {
      const game = createTestGame({
        players: [
          { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: 'socket-2', name: 'Player2', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });

      expect(findPlayerIndex(game, 'socket-1')).toBe(0);
      expect(findPlayerIndex(game, 'socket-2')).toBe(1);
    });

    it('should find player index by name when socket ID not found', () => {
      const game = createTestGame({
        players: [
          { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: 'socket-2', name: 'Player2', hand: [], teamId: 2, isBot: false, isConnected: true },
        ],
      });

      expect(findPlayerIndex(game, 'wrong-socket', 'Player2')).toBe(1);
    });

    it('should return -1 if player not found', () => {
      const game = createTestGame({
        players: [
          { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
        ],
      });

      expect(findPlayerIndex(game, 'wrong-socket', 'WrongName')).toBe(-1);
    });
  });

  describe('hasAtLeastOneHuman', () => {
    it('should return true when human players exist', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Human', hand: [], teamId: 1, isBot: false, isConnected: true },
          { id: '2', name: 'Bot1', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });

      expect(hasAtLeastOneHuman(game)).toBe(true);
    });

    it('should return false when only bots exist', () => {
      const game = createTestGame({
        players: [
          { id: '1', name: 'Bot1', hand: [], teamId: 1, isBot: true, isConnected: true },
          { id: '2', name: 'Bot2', hand: [], teamId: 2, isBot: true, isConnected: true },
        ],
      });

      expect(hasAtLeastOneHuman(game)).toBe(false);
    });

    it('should return false when no players exist', () => {
      const game = createTestGame({ players: [] });
      expect(hasAtLeastOneHuman(game)).toBe(false);
    });
  });
});
