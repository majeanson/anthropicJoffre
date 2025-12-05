/**
 * Stats Tracking Integration Tests
 *
 * Tests for updateRoundStats and updateGameStats functions
 * to ensure player statistics are correctly updated in the database.
 *
 * Sprint 20: Data Integrity Fix
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  query,
  closePool,
  updateRoundStats,
  updateGameStats,
  getPlayerStats,
} from './index';

const TEST_PLAYER_PREFIX = 'test_stats_player_';

// Clean up test players before and after tests
async function cleanupTestPlayers(): Promise<void> {
  try {
    await query(`DELETE FROM player_stats WHERE player_name LIKE $1`, [
      `${TEST_PLAYER_PREFIX}%`,
    ]);
  } catch (error) {
    // Ignore errors during cleanup
  }
}

describe('Stats Tracking Integration Tests', () => {
  beforeAll(async () => {
    await cleanupTestPlayers();
  });

  afterAll(async () => {
    await cleanupTestPlayers();
    await closePool();
  });

  beforeEach(async () => {
    await cleanupTestPlayers();
  });

  describe('updateRoundStats', () => {
    it('should create player record if not exists', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}new_player`;

      await updateRoundStats(playerName, {
        roundWon: true,
        tricksWon: 3,
        pointsEarned: 5,
        wasBidder: false,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats).not.toBeNull();
      expect(stats?.player_name).toBe(playerName);
    });

    it('should increment total_rounds_played', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}rounds`;

      await updateRoundStats(playerName, {
        roundWon: true,
        tricksWon: 2,
        pointsEarned: 4,
        wasBidder: false,
      });

      const stats1 = await getPlayerStats(playerName);
      expect(stats1?.total_rounds_played).toBe(1);

      await updateRoundStats(playerName, {
        roundWon: false,
        tricksWon: 1,
        pointsEarned: 2,
        wasBidder: false,
      });

      const stats2 = await getPlayerStats(playerName);
      expect(stats2?.total_rounds_played).toBe(2);
    });

    it('should track rounds_won and rounds_lost', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}winloss`;

      // Win 2, lose 1
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 5, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 4, pointsEarned: 6, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: false, tricksWon: 1, pointsEarned: 2, wasBidder: false });

      const stats = await getPlayerStats(playerName);
      expect(stats?.rounds_won).toBe(2);
      expect(stats?.rounds_lost).toBe(1);
    });

    it('should calculate rounds_win_percentage correctly', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}percentage`;

      // Win 3 out of 4 = 75%
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 5, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 5, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 5, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: false, tricksWon: 1, pointsEarned: 2, wasBidder: false });

      const stats = await getPlayerStats(playerName);
      expect(stats?.rounds_win_percentage).toBe(75);
    });

    it('should track tricks and points', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}tricks`;

      await updateRoundStats(playerName, { roundWon: true, tricksWon: 5, pointsEarned: 10, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 6, wasBidder: false });

      const stats = await getPlayerStats(playerName);
      expect(stats?.total_tricks_won).toBe(8);
      expect(stats?.total_points_earned).toBe(16);
    });

    it('should track most_tricks_in_round', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}most_tricks`;

      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 5, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 6, pointsEarned: 10, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 4, pointsEarned: 7, wasBidder: false });

      const stats = await getPlayerStats(playerName);
      expect(stats?.most_tricks_in_round).toBe(6);
    });

    it('should track zero_trick_rounds', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}zero_tricks`;

      await updateRoundStats(playerName, { roundWon: false, tricksWon: 0, pointsEarned: 0, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 3, pointsEarned: 5, wasBidder: false });
      await updateRoundStats(playerName, { roundWon: false, tricksWon: 0, pointsEarned: 0, wasBidder: false });

      const stats = await getPlayerStats(playerName);
      expect(stats?.zero_trick_rounds).toBe(2);
    });

    it('should track betting stats when player is bidder', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}bidder`;

      // Bidder wins bet of 8
      await updateRoundStats(playerName, {
        roundWon: true,
        tricksWon: 5,
        pointsEarned: 8,
        wasBidder: true,
        betAmount: 8,
        betMade: true,
        withoutTrump: false,
      });

      // Bidder loses bet of 10 without trump
      await updateRoundStats(playerName, {
        roundWon: false,
        tricksWon: 3,
        pointsEarned: 5,
        wasBidder: true,
        betAmount: 10,
        betMade: false,
        withoutTrump: true,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.total_bets_placed).toBe(2);
      expect(stats?.bets_made).toBe(1);
      expect(stats?.bets_failed).toBe(1);
      expect(stats?.highest_bet).toBe(10);
      expect(stats?.without_trump_bets).toBe(1);
    });

    it('should calculate bet_success_rate correctly', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}bet_rate`;

      // Win 2 out of 4 bets = 50%
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 5, pointsEarned: 8, wasBidder: true, betAmount: 8, betMade: true });
      await updateRoundStats(playerName, { roundWon: true, tricksWon: 5, pointsEarned: 9, wasBidder: true, betAmount: 9, betMade: true });
      await updateRoundStats(playerName, { roundWon: false, tricksWon: 3, pointsEarned: 5, wasBidder: true, betAmount: 10, betMade: false });
      await updateRoundStats(playerName, { roundWon: false, tricksWon: 2, pointsEarned: 4, wasBidder: true, betAmount: 11, betMade: false });

      const stats = await getPlayerStats(playerName);
      expect(stats?.bet_success_rate).toBe(50);
    });

    it('should track special cards', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}special`;

      await updateRoundStats(playerName, {
        roundWon: true,
        tricksWon: 5,
        pointsEarned: 11,
        wasBidder: false,
        redZerosCollected: 1,
        brownZerosReceived: 0,
        trumpsPlayed: 3,
      });

      await updateRoundStats(playerName, {
        roundWon: false,
        tricksWon: 2,
        pointsEarned: 0,
        wasBidder: false,
        redZerosCollected: 0,
        brownZerosReceived: 1,
        trumpsPlayed: 2,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.red_zeros_collected).toBe(1);
      expect(stats?.brown_zeros_received).toBe(1);
      expect(stats?.trump_cards_played).toBe(5);
    });
  });

  describe('updateGameStats', () => {
    it('should increment games_played', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}games`;

      await updateGameStats(playerName, {
        won: true,
        gameRounds: 5,
        gameDurationMinutes: 10,
      }, 20);

      const stats1 = await getPlayerStats(playerName);
      expect(stats1?.games_played).toBe(1);

      await updateGameStats(playerName, {
        won: false,
        gameRounds: 7,
        gameDurationMinutes: 15,
      }, -15);

      const stats2 = await getPlayerStats(playerName);
      expect(stats2?.games_played).toBe(2);
    });

    it('should track games_won and games_lost', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}game_winloss`;

      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 20);
      await updateGameStats(playerName, { won: true, gameRounds: 6, gameDurationMinutes: 12 }, 18);
      await updateGameStats(playerName, { won: false, gameRounds: 8, gameDurationMinutes: 16 }, -15);

      const stats = await getPlayerStats(playerName);
      expect(stats?.games_won).toBe(2);
      expect(stats?.games_lost).toBe(1);
    });

    it('should update ELO rating', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}elo`;

      // Start with default 1200, win +25
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);

      const stats1 = await getPlayerStats(playerName);
      expect(stats1?.elo_rating).toBe(1225);
      expect(stats1?.highest_rating).toBe(1225);

      // Lose -20
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 12 }, -20);

      const stats2 = await getPlayerStats(playerName);
      expect(stats2?.elo_rating).toBe(1205);
      expect(stats2?.highest_rating).toBe(1225); // Should stay at peak
    });

    it('should track win streaks', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}streak`;

      // Win 3 in a row
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 20);
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 20);
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 20);

      const stats1 = await getPlayerStats(playerName);
      expect(stats1?.current_win_streak).toBe(3);
      expect(stats1?.best_win_streak).toBe(3);
      expect(stats1?.current_loss_streak).toBe(0);

      // Lose 1
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 12 }, -15);

      const stats2 = await getPlayerStats(playerName);
      expect(stats2?.current_win_streak).toBe(0);
      expect(stats2?.best_win_streak).toBe(3); // Best should be preserved
      expect(stats2?.current_loss_streak).toBe(1);
    });

    it('should track loss streaks', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}loss_streak`;

      // Lose 4 in a row
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 12 }, -15);
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 12 }, -15);
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 12 }, -15);
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 12 }, -15);

      const stats1 = await getPlayerStats(playerName);
      expect(stats1?.current_loss_streak).toBe(4);
      expect(stats1?.worst_loss_streak).toBe(4);

      // Win 1
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 20);

      const stats2 = await getPlayerStats(playerName);
      expect(stats2?.current_loss_streak).toBe(0);
      expect(stats2?.worst_loss_streak).toBe(4); // Worst should be preserved
    });

    it('should track game duration stats', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}duration`;

      // Win in 5 minutes
      await updateGameStats(playerName, { won: true, gameRounds: 3, gameDurationMinutes: 5 }, 20);

      const stats1 = await getPlayerStats(playerName);
      expect(stats1?.fastest_win).toBe(3); // Game rounds, not minutes

      // Win in 8 minutes (longer)
      await updateGameStats(playerName, { won: true, gameRounds: 6, gameDurationMinutes: 8 }, 20);

      const stats2 = await getPlayerStats(playerName);
      expect(stats2?.fastest_win).toBe(3); // Should stay at fastest
      expect(stats2?.longest_game).toBe(6);
    });
  });

  describe('getPlayerStats', () => {
    it('should return null for non-existent player', async () => {
      const stats = await getPlayerStats(`${TEST_PLAYER_PREFIX}nonexistent_12345`);
      expect(stats).toBeNull();
    });

    it('should include ranking tier based on ELO', async () => {
      const playerName = `${TEST_PLAYER_PREFIX}tier`;

      // Default ELO is 1200 = Gold
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 0);

      const stats = await getPlayerStats(playerName);
      expect(stats?.ranking_tier).toBe('Gold');
    });
  });
});
