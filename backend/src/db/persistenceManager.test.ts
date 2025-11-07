/**
 * Persistence Manager Tests
 * Sprint 7 Task 3: Database Layer Tests - Conditional Persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveOrUpdateGame,
  saveGameParticipants,
  markGameFinished,
  updateRoundStats,
  updateGameStats,
  createSession,
  deletePlayerSessions,
  updatePlayerPresence,
  calculateEloChangesForGame,
} from './persistenceManager';
import type { GameState, Player } from '../types/game';
import * as db from './index';
import * as sessions from './sessions';
import * as presence from './presence';

// Mock all database modules
vi.mock('./index', () => ({
  saveOrUpdateGame: vi.fn(),
  saveGameParticipants: vi.fn(),
  markGameFinished: vi.fn(),
  updateRoundStats: vi.fn(),
  updateGameStats: vi.fn(),
  getPlayerStats: vi.fn(),
  calculateEloChange: vi.fn(),
}));

vi.mock('./sessions', () => ({
  createSession: vi.fn(),
  deletePlayerSessions: vi.fn(),
}));

vi.mock('./presence', () => ({
  updatePlayerPresence: vi.fn(),
}));

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'TestPlayer',
    hand: [],
    teamId: 1,
    isBot: false,
    isConnected: true,
    ...overrides,
  };
}

function createTestGame(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game-123',
    players: [createTestPlayer()],
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
    persistenceMode: 'elo',
    ...overrides,
  } as GameState;
}

describe('persistenceManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveOrUpdateGame', () => {
    it('should skip save for casual mode', async () => {
      const game = createTestGame({ persistenceMode: 'casual' });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await saveOrUpdateGame(game, new Date());

      expect(db.saveOrUpdateGame).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped game save')
      );

      consoleSpy.mockRestore();
    });

    it('should save for elo mode', async () => {
      const game = createTestGame({ persistenceMode: 'elo' });
      const createdAt = new Date();
      vi.mocked(db.saveOrUpdateGame).mockResolvedValue(undefined);

      await saveOrUpdateGame(game, createdAt);

      expect(db.saveOrUpdateGame).toHaveBeenCalledWith(game, createdAt);
    });

    it('should handle database errors gracefully', async () => {
      const game = createTestGame({ persistenceMode: 'elo' });
      const error = new Error('DB connection failed');
      vi.mocked(db.saveOrUpdateGame).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw
      await expect(saveOrUpdateGame(game, new Date())).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB] Failed to save game'),
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveGameParticipants', () => {
    it('should skip for casual mode', async () => {
      const players = [createTestPlayer()];
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await saveGameParticipants('game-123', players, 'casual');

      expect(db.saveGameParticipants).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped participants save')
      );

      consoleSpy.mockRestore();
    });

    it('should save for elo mode', async () => {
      const players = [createTestPlayer()];
      vi.mocked(db.saveGameParticipants).mockResolvedValue(undefined);

      await saveGameParticipants('game-123', players, 'elo');

      expect(db.saveGameParticipants).toHaveBeenCalledWith('game-123', players);
    });
  });

  describe('markGameFinished', () => {
    it('should skip for casual mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await markGameFinished('game-123', 1, 'casual');

      expect(db.markGameFinished).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped finish marker')
      );

      consoleSpy.mockRestore();
    });

    it('should mark for elo mode', async () => {
      vi.mocked(db.markGameFinished).mockResolvedValue(undefined);

      await markGameFinished('game-123', 2, 'elo');

      expect(db.markGameFinished).toHaveBeenCalledWith('game-123', 2);
    });
  });

  describe('updateRoundStats', () => {
    const mockStats = {
      bet_amount: 10,
      points_won: 12,
      bet_result: 'won' as const,
      without_trump: false,
    };

    it('should skip for casual mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await updateRoundStats('TestPlayer', mockStats, 'casual');

      expect(db.updateRoundStats).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped round stats')
      );

      consoleSpy.mockRestore();
    });

    it('should update for elo mode', async () => {
      vi.mocked(db.updateRoundStats).mockResolvedValue(undefined);

      await updateRoundStats('TestPlayer', mockStats, 'elo');

      expect(db.updateRoundStats).toHaveBeenCalledWith('TestPlayer', mockStats);
    });
  });

  describe('updateGameStats', () => {
    const mockStats = {
      is_winner: true,
      team: 1,
    };

    it('should skip for casual mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await updateGameStats('TestPlayer', mockStats, 25, 'casual');

      expect(db.updateGameStats).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped game stats')
      );

      consoleSpy.mockRestore();
    });

    it('should update for elo mode', async () => {
      vi.mocked(db.updateGameStats).mockResolvedValue(undefined);

      await updateGameStats('TestPlayer', mockStats, 25, 'elo');

      expect(db.updateGameStats).toHaveBeenCalledWith('TestPlayer', mockStats, 25);
    });
  });

  describe('createSession', () => {
    it('should skip for bots', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await createSession('Bot 1', 'socket-1', 'game-123', 'elo', true);

      expect(sessions.createSession).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Session] Skipped session for bot')
      );

      consoleSpy.mockRestore();
    });

    it('should skip for casual mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await createSession('TestPlayer', 'socket-1', 'game-123', 'casual', false);

      expect(sessions.createSession).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped session')
      );

      consoleSpy.mockRestore();
    });

    it('should create for elo mode + human players', async () => {
      const mockSession = { token: 'session-token-123', playerName: 'TestPlayer' };
      vi.mocked(sessions.createSession).mockResolvedValue(mockSession);

      const result = await createSession('TestPlayer', 'socket-1', 'game-123', 'elo', false);

      expect(sessions.createSession).toHaveBeenCalledWith('TestPlayer', 'socket-1', 'game-123');
      expect(result).toEqual(mockSession);
    });

    it('should handle database errors and return null', async () => {
      const error = new Error('DB error');
      vi.mocked(sessions.createSession).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createSession('TestPlayer', 'socket-1', 'game-123', 'elo', false);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB] Failed to create session'),
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deletePlayerSessions', () => {
    it('should skip for casual mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await deletePlayerSessions('TestPlayer', 'game-123', 'casual');

      expect(sessions.deletePlayerSessions).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Casual] Skipped session deletion')
      );

      consoleSpy.mockRestore();
    });

    it('should delete for elo mode', async () => {
      vi.mocked(sessions.deletePlayerSessions).mockResolvedValue(undefined);

      await deletePlayerSessions('TestPlayer', 'game-123', 'elo');

      expect(sessions.deletePlayerSessions).toHaveBeenCalledWith('TestPlayer', 'game-123');
    });
  });

  describe('updatePlayerPresence', () => {
    it('should skip for casual mode', async () => {
      await updatePlayerPresence('TestPlayer', 'online', 'casual', 'socket-1', 'game-123');

      expect(presence.updatePlayerPresence).not.toHaveBeenCalled();
    });

    it('should update for elo mode', async () => {
      vi.mocked(presence.updatePlayerPresence).mockResolvedValue(undefined);

      await updatePlayerPresence('TestPlayer', 'online', 'elo', 'socket-1', 'game-123');

      expect(presence.updatePlayerPresence).toHaveBeenCalledWith(
        'TestPlayer',
        'online',
        'socket-1',
        'game-123'
      );
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('DB error');
      vi.mocked(presence.updatePlayerPresence).mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await updatePlayerPresence('TestPlayer', 'online', 'elo', 'socket-1');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB] Failed to update presence'),
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe('calculateEloChangesForGame', () => {
    it('should return 0 for casual mode', async () => {
      const players = [
        createTestPlayer({ name: 'P1', teamId: 1 }),
        createTestPlayer({ name: 'P2', teamId: 2 }),
      ];

      const result = await calculateEloChangesForGame(players, 1, 'casual');

      expect(result.get('P1')).toBe(0);
      expect(result.get('P2')).toBe(0);
      expect(db.getPlayerStats).not.toHaveBeenCalled();
    });

    it('should return 0 for bots', async () => {
      const players = [
        createTestPlayer({ name: 'P1', teamId: 1, isBot: false }),
        createTestPlayer({ name: 'Bot 1', teamId: 2, isBot: true }),
      ];
      vi.mocked(db.getPlayerStats).mockResolvedValue({
        player_name: 'P1',
        elo_rating: 1200,
      } as any);
      vi.mocked(db.calculateEloChange).mockReturnValue(25);

      const result = await calculateEloChangesForGame(players, 1, 'elo');

      // Bot should not be in results
      expect(result.has('Bot 1')).toBe(false);
      // Human player should have ELO change
      expect(result.get('P1')).toBe(25);
    });

    it('should calculate real ELO changes for elo mode', async () => {
      const players = [
        createTestPlayer({ name: 'P1', teamId: 1, isBot: false }),
        createTestPlayer({ name: 'P2', teamId: 1, isBot: false }),
        createTestPlayer({ name: 'P3', teamId: 2, isBot: false }),
        createTestPlayer({ name: 'P4', teamId: 2, isBot: false }),
      ];

      vi.mocked(db.getPlayerStats)
        .mockResolvedValueOnce({ player_name: 'P1', elo_rating: 1200 } as any)
        .mockResolvedValueOnce({ player_name: 'P3', elo_rating: 1300 } as any)
        .mockResolvedValueOnce({ player_name: 'P4', elo_rating: 1300 } as any)
        .mockResolvedValueOnce({ player_name: 'P2', elo_rating: 1200 } as any)
        .mockResolvedValueOnce({ player_name: 'P3', elo_rating: 1300 } as any)
        .mockResolvedValueOnce({ player_name: 'P4', elo_rating: 1300 } as any);

      vi.mocked(db.calculateEloChange)
        .mockReturnValueOnce(28) // P1 won
        .mockReturnValueOnce(28) // P2 won
        .mockReturnValueOnce(-28) // P3 lost
        .mockReturnValueOnce(-28); // P4 lost

      const result = await calculateEloChangesForGame(players, 1, 'elo');

      expect(result.get('P1')).toBe(28);
      expect(result.get('P2')).toBe(28);
      expect(result.get('P3')).toBe(-28);
      expect(result.get('P4')).toBe(-28);
    });

    it('should use default ELO 1200 for new players', async () => {
      const players = [
        createTestPlayer({ name: 'NewPlayer', teamId: 1, isBot: false }),
        createTestPlayer({ name: 'Veteran', teamId: 2, isBot: false }),
      ];

      vi.mocked(db.getPlayerStats)
        .mockResolvedValueOnce(null) // NewPlayer has no stats
        .mockResolvedValueOnce({ player_name: 'Veteran', elo_rating: 1500 } as any)
        .mockResolvedValueOnce({ player_name: 'Veteran', elo_rating: 1500 } as any);

      vi.mocked(db.calculateEloChange)
        .mockReturnValueOnce(30) // NewPlayer won
        .mockReturnValueOnce(-30); // Veteran lost

      const result = await calculateEloChangesForGame(players, 1, 'elo');

      // Should calculate using 1200 default ELO for NewPlayer
      expect(db.calculateEloChange).toHaveBeenCalledWith(1200, 1500, true);
      expect(result.get('NewPlayer')).toBe(30);
    });

    it('should handle database errors gracefully', async () => {
      const players = [
        createTestPlayer({ name: 'P1', teamId: 1, isBot: false }),
      ];

      vi.mocked(db.getPlayerStats).mockRejectedValue(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await calculateEloChangesForGame(players, 1, 'elo');

      expect(result.get('P1')).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB] Failed to calculate ELO'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
