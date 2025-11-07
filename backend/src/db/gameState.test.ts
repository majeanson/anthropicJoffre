/**
 * Game State Persistence Tests
 * Sprint 7 Task 3: Database Layer Tests - Persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveGameState,
  loadGameState,
  deleteGameState,
  listActiveGames,
  getPlayerGames,
  gameExists,
  cleanupAbandonedGamesDB,
} from './gameState';
import type { GameState, Player } from '../types/game';
import * as db from './index';

// Mock the database query function
vi.mock('./index', () => ({
  query: vi.fn(),
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
    creatorId: 'player-1',
    ...overrides,
  } as GameState;
}

describe('gameState persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveGameState', () => {
    it('should save new game with correct status', async () => {
      const game = createTestGame();
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await saveGameState(game);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO active_games'),
        expect.arrayContaining([
          'test-game-123',
          expect.any(String), // JSON.stringify(game)
          'team_selection',
          'waiting', // Status for team_selection with < 4 players
          1, // Player count
          'TestPlayer', // Creator name
          true, // is_public
        ])
      );
    });

    it('should set status to team_selection for 4 players in team_selection phase', async () => {
      const game = createTestGame({
        players: [
          createTestPlayer({ id: '1', name: 'P1' }),
          createTestPlayer({ id: '2', name: 'P2' }),
          createTestPlayer({ id: '3', name: 'P3' }),
          createTestPlayer({ id: '4', name: 'P4' }),
        ],
      });
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await saveGameState(game);

      const callArgs = vi.mocked(db.query).mock.calls[0][1];
      expect(callArgs?.[3]).toBe('team_selection'); // Status
      expect(callArgs?.[4]).toBe(4); // Player count
    });

    it('should set status to in_progress for gameplay phases', async () => {
      const game = createTestGame({ phase: 'betting' });
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await saveGameState(game);

      const callArgs = vi.mocked(db.query).mock.calls[0][1];
      expect(callArgs?.[3]).toBe('in_progress');
    });

    it('should set status to finished for game_over phase', async () => {
      const game = createTestGame({ phase: 'game_over' });
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await saveGameState(game);

      const callArgs = vi.mocked(db.query).mock.calls[0][1];
      expect(callArgs?.[3]).toBe('finished');
    });

    it('should convert Maps to objects for serialization', async () => {
      const game = createTestGame({
        afkWarnings: new Map([['player1', 1], ['player2', 2]]),
      });
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await saveGameState(game);

      const callArgs = vi.mocked(db.query).mock.calls[0][1];
      const serializedState = JSON.parse(callArgs?.[1] as string);
      expect(serializedState.afkWarnings).toEqual({ player1: 1, player2: 2 });
    });
  });

  describe('loadGameState', () => {
    it('should load existing game', async () => {
      const expectedGame = createTestGame();
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ game_state: expectedGame }],
        rowCount: 1,
      } as any);

      const result = await loadGameState('test-game-123');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT game_state'),
        ['test-game-123']
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-game-123');
    });

    it('should return null for non-existent game', async () => {
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await loadGameState('non-existent');

      expect(result).toBeNull();
    });

    it('should restore Map objects from plain objects', async () => {
      const gameWithMap = {
        ...createTestGame(),
        afkWarnings: { player1: 1, player2: 2 }, // Stored as plain object
      };
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ game_state: gameWithMap }],
        rowCount: 1,
      } as any);

      const result = await loadGameState('test-game-123');

      expect(result?.afkWarnings).toBeInstanceOf(Map);
      expect(result?.afkWarnings?.get('player1')).toBe(1);
      expect(result?.afkWarnings?.get('player2')).toBe(2);
    });

    it('should deep clone to prevent mutations', async () => {
      const originalGame = createTestGame();
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ game_state: originalGame }],
        rowCount: 1,
      } as any);

      const result = await loadGameState('test-game-123');

      // Mutate the result
      result!.phase = 'playing';

      // Verify original wasn't mutated (would need to reload from mock)
      const secondResult = await loadGameState('test-game-123');
      expect(secondResult?.phase).toBe('team_selection'); // Original phase
    });
  });

  describe('deleteGameState', () => {
    it('should delete existing game', async () => {
      vi.mocked(db.query).mockResolvedValue({ rows: [], rowCount: 1 } as any);

      await deleteGameState('test-game-123');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM active_games'),
        ['test-game-123']
      );
    });
  });

  describe('listActiveGames', () => {
    const mockGameRow = {
      game_id: 'game-123',
      phase: 'betting',
      status: 'in_progress',
      player_count: 4,
      creator_name: 'Creator',
      is_public: true,
      created_at: new Date(),
      game_state: {
        id: 'game-123',
        players: [
          createTestPlayer({ id: '1', name: 'P1', teamId: 1 }),
          createTestPlayer({ id: '2', name: 'P2', teamId: 2 }),
        ],
      },
    };

    it('should list all games by default', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [mockGameRow],
        rowCount: 1,
      } as any);

      const result = await listActiveGames();

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        []
      );
      expect(result).toHaveLength(1);
      expect(result[0].gameId).toBe('game-123');
      expect(result[0].playerNames).toEqual(['P1', 'P2']);
    });

    it('should filter by status', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [mockGameRow],
        rowCount: 1,
      } as any);

      await listActiveGames({ status: 'in_progress' });

      const callArgs = vi.mocked(db.query).mock.calls[0];
      expect(callArgs[0]).toContain('AND status = $1');
      expect(callArgs[1]).toEqual(['in_progress']);
    });

    it('should filter by isPublic', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [mockGameRow],
        rowCount: 1,
      } as any);

      await listActiveGames({ isPublic: false });

      const callArgs = vi.mocked(db.query).mock.calls[0];
      expect(callArgs[0]).toContain('AND is_public = $1');
      expect(callArgs[1]).toEqual([false]);
    });

    it('should apply limit', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [mockGameRow],
        rowCount: 1,
      } as any);

      await listActiveGames({ limit: 10 });

      const callArgs = vi.mocked(db.query).mock.calls[0];
      expect(callArgs[0]).toContain('LIMIT $1');
      expect(callArgs[1]).toEqual([10]);
    });

    it('should include team assignments in result', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [mockGameRow],
        rowCount: 1,
      } as any);

      const result = await listActiveGames();

      expect(result[0].teamAssignments).toEqual({
        P1: 1,
        P2: 2,
      });
    });
  });

  describe('getPlayerGames', () => {
    const mockGameRow = {
      game_id: 'game-123',
      phase: 'betting',
      status: 'in_progress',
      player_count: 4,
      creator_name: 'Creator',
      is_public: true,
      created_at: new Date(),
      game_state: {
        id: 'game-123',
        players: [
          createTestPlayer({ id: '1', name: 'TargetPlayer', teamId: 1 }),
          createTestPlayer({ id: '2', name: 'P2', teamId: 2 }),
        ],
      },
    };

    it('should return games containing player', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [mockGameRow],
        rowCount: 1,
      } as any);

      const result = await getPlayerGames('TargetPlayer');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('game_state @> jsonb_build_object'),
        ['TargetPlayer']
      );
      expect(result).toHaveLength(1);
      expect(result[0].gameId).toBe('game-123');
    });

    it('should return empty array if player has no games', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await getPlayerGames('NoGamesPlayer');

      expect(result).toHaveLength(0);
    });
  });

  describe('gameExists', () => {
    it('should return true for existing game', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ '?column?': 1 }],
        rowCount: 1,
      } as any);

      const result = await gameExists('test-game-123');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT 1 FROM active_games'),
        ['test-game-123']
      );
      expect(result).toBe(true);
    });

    it('should return false for non-existent game', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await gameExists('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('cleanupAbandonedGamesDB', () => {
    it('should call cleanup function and return count', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ cleanup_abandoned_games: 5 }],
        rowCount: 1,
      } as any);

      const result = await cleanupAbandonedGamesDB();

      expect(db.query).toHaveBeenCalledWith(
        'SELECT cleanup_abandoned_games()'
      );
      expect(result).toBe(5);
    });

    it('should return 0 if no games cleaned up', async () => {
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ cleanup_abandoned_games: 0 }],
        rowCount: 1,
      } as any);

      const result = await cleanupAbandonedGamesDB();

      expect(result).toBe(0);
    });
  });
});
