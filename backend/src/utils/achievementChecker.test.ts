/**
 * Achievement Checker Unit Tests
 * Tests all achievement unlock conditions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAchievements, checkSecretAchievements } from './achievementChecker';
import * as achievementDb from '../db/achievements';
import * as db from '../db/index';
import { PlayerStats } from '../types/game';
import { Achievement } from '../types/achievements';

// Mock the database modules
vi.mock('../db/achievements');
vi.mock('../db/index');

// Helper to create mock achievement
function createMockAchievement(key: string, name: string): Achievement {
  return {
    achievement_id: Math.floor(Math.random() * 1000),
    achievement_key: key,
    achievement_name: name,
    description: `Description for ${name}`,
    icon: '🏆',
    tier: 'bronze',
    points: 10,
    is_secret: false,
    category: 'milestone',
    created_at: new Date(),
  };
}

// Helper to create mock player stats
function createMockStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    player_name: 'TestPlayer',
    games_played: 0,
    games_won: 0,
    games_lost: 0,
    bets_placed: 0,
    bets_won: 0,
    bets_lost: 0,
    total_points_scored: 0,
    highest_score: 0,
    red_zeros_collected: 0,
    brown_zeros_collected: 0,
    trump_cards_played: 0,
    perfect_bets: 0,
    win_streak: 0,
    current_win_streak: 0,
    achievement_points: 0,
    ...overrides,
  };
}

describe('Achievement Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Game Won Achievements', () => {
    it('should unlock first_win on first victory', async () => {
      const mockAchievement = createMockAchievement('first_win', 'First Victory');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 1 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'first_win');
      expect(result.unlocked).toHaveLength(1);
      expect(result.unlocked[0].achievement_key).toBe('first_win');
    });

    it('should still attempt to unlock first_win on second victory (idempotent)', async () => {
      // With >= check, we always try to unlock but the DB handles idempotency
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 2 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: createMockAchievement('first_win', 'First Victory'),
        isNewUnlock: false, // Already unlocked, so not a new unlock
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      // Achievement is attempted but isNewUnlock is false, so not added to unlocked array
      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'first_win');
      expect(result.unlocked).toHaveLength(0);
    });

    it('should unlock games_won_10 on 10th win', async () => {
      const mockAchievement = createMockAchievement('games_won_10', 'Rising Champion');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 10 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'games_won_10');
      expect(result.unlocked.some(a => a.achievement_key === 'games_won_10')).toBe(true);
    });

    it('should unlock games_won_50 on 50th win', async () => {
      const mockAchievement = createMockAchievement('games_won_50', 'Veteran Champion');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 50 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'games_won_50');
    });

    it('should unlock games_won_100 on 100th win', async () => {
      const mockAchievement = createMockAchievement('games_won_100', 'Legendary Master');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 100 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'games_won_100');
    });

    it('should unlock comeback_king when wasComeback is true', async () => {
      const mockAchievement = createMockAchievement('comeback_king', 'Comeback King');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 5 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
        eventData: { wasComeback: true },
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'comeback_king');
      expect(result.unlocked.some(a => a.achievement_key === 'comeback_king')).toBe(true);
    });

    it('should unlock perfect_game when perfectGame is true', async () => {
      const mockAchievement = createMockAchievement('perfect_game', 'Flawless Victory');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 5 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
        eventData: { perfectGame: true },
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'perfect_game');
      expect(result.unlocked.some(a => a.achievement_key === 'perfect_game')).toBe(true);
    });

    it('should unlock win_streak_5 on 5-game win streak', async () => {
      const mockAchievement = createMockAchievement('win_streak_5', 'Unstoppable');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 10 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
        eventData: { winStreak: 5 },
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'win_streak_5');
      expect(result.unlocked.some(a => a.achievement_key === 'win_streak_5')).toBe(true);
    });

    it('should unlock win_streak_5 on streak greater than 5', async () => {
      const mockAchievement = createMockAchievement('win_streak_5', 'Unstoppable');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 15 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
        eventData: { winStreak: 8 },
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'win_streak_5');
    });

    it('should NOT unlock win_streak_5 on 4-game streak', async () => {
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 10 }));

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
        eventData: { winStreak: 4 },
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalledWith('TestPlayer', 'win_streak_5');
    });
  });

  describe('Bet Won Achievements', () => {
    it('should unlock first_bet_won on first bet win', async () => {
      const mockAchievement = createMockAchievement('first_bet_won', 'Lucky Bettor');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ bets_won: 1 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'bet_won',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'first_bet_won');
      expect(result.unlocked).toHaveLength(1);
    });

    it('should update trump_master progress when hadTrump is true', async () => {
      const mockAchievement = createMockAchievement('trump_master', 'Trump Master');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ bets_won: 5 }));
      vi.mocked(achievementDb.updateAchievementProgress).mockResolvedValue({
        achievement: mockAchievement,
        progress: 3,
        unlocked: false,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'bet_won',
        eventData: { hadTrump: true },
      });

      expect(achievementDb.updateAchievementProgress).toHaveBeenCalledWith('TestPlayer', 'trump_master', 1);
      expect(result.progress).toHaveLength(1);
      expect(result.progress[0].progress).toBe(3);
      expect(result.progress[0].max_progress).toBe(5);
    });

    it('should unlock trump_master on 5th trump bet win', async () => {
      const mockAchievement = createMockAchievement('trump_master', 'Trump Master');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ bets_won: 10 }));
      vi.mocked(achievementDb.updateAchievementProgress).mockResolvedValue({
        achievement: mockAchievement,
        progress: 5,
        unlocked: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'bet_won',
        eventData: { hadTrump: true },
      });

      expect(result.unlocked.some(a => a.achievement_key === 'trump_master')).toBe(true);
    });

    it('should NOT update trump_master when hadTrump is false', async () => {
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ bets_won: 5 }));

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'bet_won',
        eventData: { hadTrump: false },
      });

      expect(achievementDb.updateAchievementProgress).not.toHaveBeenCalled();
    });
  });

  describe('Perfect Bet Achievement', () => {
    it('should unlock perfect_bet achievement', async () => {
      const mockAchievement = createMockAchievement('perfect_bet', 'Perfect Prediction');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats());
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'perfect_bet',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'perfect_bet');
      expect(result.unlocked).toHaveLength(1);
    });
  });

  describe('No Trump Achievements', () => {
    it('should update no_trump_master progress', async () => {
      const mockAchievement = createMockAchievement('no_trump_master', 'No Trump Master');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats());
      vi.mocked(achievementDb.updateAchievementProgress).mockResolvedValue({
        achievement: mockAchievement,
        progress: 5,
        unlocked: false,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'no_trump_bet_won',
      });

      expect(achievementDb.updateAchievementProgress).toHaveBeenCalledWith('TestPlayer', 'no_trump_master', 1);
      expect(result.progress).toHaveLength(1);
      expect(result.progress[0].max_progress).toBe(10);
    });

    it('should unlock no_trump_master on 10th no-trump win', async () => {
      const mockAchievement = createMockAchievement('no_trump_master', 'No Trump Master');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats());
      vi.mocked(achievementDb.updateAchievementProgress).mockResolvedValue({
        achievement: mockAchievement,
        progress: 10,
        unlocked: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'no_trump_bet_won',
      });

      expect(result.unlocked.some(a => a.achievement_key === 'no_trump_master')).toBe(true);
    });
  });

  describe('Red Zero Achievements', () => {
    it('should unlock red_zero_hunter at 20 red zeros', async () => {
      const mockAchievement = createMockAchievement('red_zero_hunter', 'Red Zero Hunter');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ red_zeros_collected: 20 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'red_zero_collected',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'red_zero_hunter');
      expect(result.unlocked).toHaveLength(1);
    });

    it('should unlock red_zero_hunter when over 20 red zeros', async () => {
      const mockAchievement = createMockAchievement('red_zero_hunter', 'Red Zero Hunter');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ red_zeros_collected: 25 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'red_zero_collected',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'red_zero_hunter');
    });

    it('should NOT unlock red_zero_hunter under 20 red zeros', async () => {
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ red_zeros_collected: 19 }));

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'red_zero_collected',
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalled();
      expect(result.unlocked).toHaveLength(0);
    });
  });

  describe('Game Completed Achievements', () => {
    it('should unlock games_played_10 on 10th game', async () => {
      const mockAchievement = createMockAchievement('games_played_10', 'Dedicated Player');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_played: 10 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_completed',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'games_played_10');
      expect(result.unlocked).toHaveLength(1);
    });

    it('should NOT unlock games_played_10 before 10 games', async () => {
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_played: 9 }));

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_completed',
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalled();
    });
  });

  describe('Secret Achievements', () => {
    it('should unlock brown_zero_avoider when winning with 0 brown zeros', async () => {
      const mockAchievement = createMockAchievement('brown_zero_avoider', 'Brown Zero Avoider');
      mockAchievement.is_secret = true;
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 0,
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'brown_zero_avoider');
      expect(result).toHaveLength(1);
      expect(result[0].achievement_key).toBe('brown_zero_avoider');
    });

    it('should NOT unlock brown_zero_avoider when losing', async () => {
      const result = await checkSecretAchievements('TestPlayer', {
        won: false,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 0,
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalledWith('TestPlayer', 'brown_zero_avoider');
    });

    it('should NOT unlock brown_zero_avoider when collected brown zeros', async () => {
      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 1,
        roundsAsLowestScorer: 0,
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalledWith('TestPlayer', 'brown_zero_avoider');
    });

    it('should unlock underdog_victory when winning after 3+ rounds as lowest scorer', async () => {
      const mockAchievement = createMockAchievement('underdog_victory', 'Underdog Victory');
      mockAchievement.is_secret = true;
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 2,
        roundsAsLowestScorer: 3,
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'underdog_victory');
      expect(result.some(a => a.achievement_key === 'underdog_victory')).toBe(true);
    });

    it('should unlock underdog_victory on more than 3 rounds as lowest', async () => {
      const mockAchievement = createMockAchievement('underdog_victory', 'Underdog Victory');
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: true,
      });

      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 5,
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledWith('TestPlayer', 'underdog_victory');
    });

    it('should NOT unlock underdog_victory when losing', async () => {
      const result = await checkSecretAchievements('TestPlayer', {
        won: false,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 5,
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalledWith('TestPlayer', 'underdog_victory');
    });

    it('should NOT unlock underdog_victory with only 2 rounds as lowest', async () => {
      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 2,
      });

      expect(achievementDb.unlockAchievement).not.toHaveBeenCalledWith('TestPlayer', 'underdog_victory');
    });

    it('should unlock both secret achievements when conditions met', async () => {
      const brownZeroAchievement = createMockAchievement('brown_zero_avoider', 'Brown Zero Avoider');
      const underdogAchievement = createMockAchievement('underdog_victory', 'Underdog Victory');

      vi.mocked(achievementDb.unlockAchievement)
        .mockResolvedValueOnce({ achievement: brownZeroAchievement, isNewUnlock: true })
        .mockResolvedValueOnce({ achievement: underdogAchievement, isNewUnlock: true });

      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 4,
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });

  describe('Already Unlocked Achievements', () => {
    it('should not add to unlocked array if achievement was already unlocked', async () => {
      const mockAchievement = createMockAchievement('first_win', 'First Victory');
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 1 }));
      vi.mocked(achievementDb.unlockAchievement).mockResolvedValue({
        achievement: mockAchievement,
        isNewUnlock: false, // Already had it
      });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      expect(achievementDb.unlockAchievement).toHaveBeenCalled();
      expect(result.unlocked).toHaveLength(0); // Should not be in unlocked array
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(db.getPlayerStats).mockRejectedValue(new Error('Database error'));

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
      });

      // Should return empty results instead of throwing
      expect(result.unlocked).toHaveLength(0);
      expect(result.progress).toHaveLength(0);
    });

    it('should handle secret achievement errors gracefully', async () => {
      vi.mocked(achievementDb.unlockAchievement).mockRejectedValue(new Error('Database error'));

      const result = await checkSecretAchievements('TestPlayer', {
        won: true,
        brownZerosCollected: 0,
        roundsAsLowestScorer: 0,
      });

      // Should return empty array instead of throwing
      expect(result).toHaveLength(0);
    });
  });

  describe('Multiple Achievements in Single Event', () => {
    it('should unlock multiple achievements on first win with comeback and perfect game', async () => {
      vi.mocked(db.getPlayerStats).mockResolvedValue(createMockStats({ games_won: 1 }));

      const firstWin = createMockAchievement('first_win', 'First Victory');
      const comeback = createMockAchievement('comeback_king', 'Comeback King');
      const perfectGame = createMockAchievement('perfect_game', 'Flawless Victory');

      vi.mocked(achievementDb.unlockAchievement)
        .mockResolvedValueOnce({ achievement: firstWin, isNewUnlock: true })
        .mockResolvedValueOnce({ achievement: comeback, isNewUnlock: true })
        .mockResolvedValueOnce({ achievement: perfectGame, isNewUnlock: true });

      const result = await checkAchievements({
        playerName: 'TestPlayer',
        eventType: 'game_won',
        eventData: { wasComeback: true, perfectGame: true },
      });

      expect(result.unlocked).toHaveLength(3);
      expect(result.unlocked.map(a => a.achievement_key)).toContain('first_win');
      expect(result.unlocked.map(a => a.achievement_key)).toContain('comeback_king');
      expect(result.unlocked.map(a => a.achievement_key)).toContain('perfect_game');
    });
  });
});
