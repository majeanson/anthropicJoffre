import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  query,
  saveOrUpdateGame,
  markGameFinished,
  updateGameStats,
  updateRoundStats,
  getPlayerStats,
  getLeaderboard,
  getPlayerGameHistory,
} from './index';

describe('Database Stats Functions', () => {
  const testPlayerName = 'TestPlayer_' + Date.now();
  const testGameId = 'TEST_' + Date.now();

  // Clean up test data after all tests
  afterAll(async () => {
    await query('DELETE FROM player_stats WHERE player_name LIKE $1', ['TestPlayer_%']);
    await query('DELETE FROM game_history WHERE game_id LIKE $1', ['TEST_%']);
  });

  describe('Player Stats Initialization', () => {
    it('should initialize player_stats record on first game stat update', async () => {
      // Verify player doesn't exist yet
      const beforeStats = await getPlayerStats(testPlayerName);
      expect(beforeStats).toBeNull();

      // Update game stats (should initialize player)
      await updateGameStats(
        testPlayerName,
        {
          won: true,
          gameRounds: 5,
          gameDurationMinutes: 10,
        },
        25 // ELO change
      );

      // Verify player was created
      const afterStats = await getPlayerStats(testPlayerName);
      expect(afterStats).not.toBeNull();
      expect(afterStats?.player_name).toBe(testPlayerName);
      expect(afterStats?.games_played).toBe(1);
      expect(afterStats?.games_won).toBe(1);
      expect(afterStats?.is_bot).toBe(false);
    });

    it('should initialize player_stats record on first round stat update', async () => {
      const playerName = 'TestPlayer_Round_' + Date.now();

      // Verify player doesn't exist yet
      const beforeStats = await getPlayerStats(playerName);
      expect(beforeStats).toBeNull();

      // Update round stats (should initialize player)
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 2,
      });

      // Verify player was created
      const afterStats = await getPlayerStats(playerName);
      expect(afterStats).not.toBeNull();
      expect(afterStats?.player_name).toBe(playerName);
      expect(afterStats?.total_bets_made).toBe(1);
      expect(afterStats?.bets_won).toBe(1);
    });
  });

  describe('Game Stats Recording', () => {
    it('should record game win correctly', async () => {
      const playerName = 'TestPlayer_Win_' + Date.now();

      await updateGameStats(
        playerName,
        {
          won: true,
          gameRounds: 6,
          gameDurationMinutes: 12,
        },
        30 // ELO change
      );

      const stats = await getPlayerStats(playerName);
      expect(stats?.games_played).toBe(1);
      expect(stats?.games_won).toBe(1);
      expect(stats?.games_lost).toBe(0);
      expect(stats?.win_percentage).toBe(100.00);
      expect(stats?.elo_rating).toBe(1230); // 1200 default + 30
      expect(stats?.current_win_streak).toBe(1);
      expect(stats?.current_loss_streak).toBe(0);
      expect(stats?.best_win_streak).toBe(1);
    });

    it('should record game loss correctly', async () => {
      const playerName = 'TestPlayer_Loss_' + Date.now();

      await updateGameStats(
        playerName,
        {
          won: false,
          gameRounds: 4,
          gameDurationMinutes: 8,
        },
        -20 // ELO change
      );

      const stats = await getPlayerStats(playerName);
      expect(stats?.games_played).toBe(1);
      expect(stats?.games_won).toBe(0);
      expect(stats?.games_lost).toBe(1);
      expect(stats?.win_percentage).toBe(0.00);
      expect(stats?.elo_rating).toBe(1180); // 1200 default - 20
      expect(stats?.current_win_streak).toBe(0);
      expect(stats?.current_loss_streak).toBe(1);
      expect(stats?.worst_loss_streak).toBe(1);
    });

    it('should track consecutive wins (win streak)', async () => {
      const playerName = 'TestPlayer_WinStreak_' + Date.now();

      // Win 1
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      let stats = await getPlayerStats(playerName);
      expect(stats?.current_win_streak).toBe(1);
      expect(stats?.best_win_streak).toBe(1);

      // Win 2
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.current_win_streak).toBe(2);
      expect(stats?.best_win_streak).toBe(2);

      // Win 3
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.current_win_streak).toBe(3);
      expect(stats?.best_win_streak).toBe(3);

      // Loss (resets current streak)
      await updateGameStats(playerName, { won: false, gameRounds: 5, gameDurationMinutes: 10 }, -20);
      stats = await getPlayerStats(playerName);
      expect(stats?.current_win_streak).toBe(0);
      expect(stats?.best_win_streak).toBe(3); // Best streak preserved
    });

    it('should track consecutive losses (loss streak)', async () => {
      const playerName = 'TestPlayer_LossStreak_' + Date.now();

      // Loss 1
      await updateGameStats(playerName, { won: false, gameRounds: 5, gameDurationMinutes: 10 }, -20);
      let stats = await getPlayerStats(playerName);
      expect(stats?.current_loss_streak).toBe(1);
      expect(stats?.worst_loss_streak).toBe(1);

      // Loss 2
      await updateGameStats(playerName, { won: false, gameRounds: 5, gameDurationMinutes: 10 }, -20);
      stats = await getPlayerStats(playerName);
      expect(stats?.current_loss_streak).toBe(2);
      expect(stats?.worst_loss_streak).toBe(2);

      // Win (resets current streak)
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.current_loss_streak).toBe(0);
      expect(stats?.worst_loss_streak).toBe(2); // Worst streak preserved
    });

    it('should track fastest win', async () => {
      const playerName = 'TestPlayer_FastestWin_' + Date.now();

      // First win - 5 rounds
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      let stats = await getPlayerStats(playerName);
      expect(stats?.fastest_win).toBe(5);

      // Faster win - 3 rounds
      await updateGameStats(playerName, { won: true, gameRounds: 3, gameDurationMinutes: 6 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.fastest_win).toBe(3);

      // Slower win - should not update fastest
      await updateGameStats(playerName, { won: true, gameRounds: 7, gameDurationMinutes: 14 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.fastest_win).toBe(3);

      // Loss - should not affect fastest win
      await updateGameStats(playerName, { won: false, gameRounds: 2, gameDurationMinutes: 4 }, -20);
      stats = await getPlayerStats(playerName);
      expect(stats?.fastest_win).toBe(3);
    });

    it('should track longest game', async () => {
      const playerName = 'TestPlayer_LongestGame_' + Date.now();

      // First game - 5 rounds
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      let stats = await getPlayerStats(playerName);
      expect(stats?.longest_game).toBe(5);

      // Longer game - 8 rounds
      await updateGameStats(playerName, { won: false, gameRounds: 8, gameDurationMinutes: 16 }, -20);
      stats = await getPlayerStats(playerName);
      expect(stats?.longest_game).toBe(8);

      // Shorter game - should not update longest
      await updateGameStats(playerName, { won: true, gameRounds: 4, gameDurationMinutes: 8 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.longest_game).toBe(8);
    });

    it('should calculate average game duration', async () => {
      const playerName = 'TestPlayer_AvgDuration_' + Date.now();

      // Game 1 - 10 minutes
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 25);
      let stats = await getPlayerStats(playerName);
      expect(stats?.avg_game_duration_minutes).toBeCloseTo(10.00, 1);

      // Game 2 - 20 minutes (avg should be 15)
      await updateGameStats(playerName, { won: false, gameRounds: 6, gameDurationMinutes: 20 }, -20);
      stats = await getPlayerStats(playerName);
      expect(stats?.avg_game_duration_minutes).toBeCloseTo(15.00, 1);

      // Game 3 - 12 minutes (avg should be ~14)
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 12 }, 25);
      stats = await getPlayerStats(playerName);
      expect(stats?.avg_game_duration_minutes).toBeCloseTo(14.00, 1);
    });

    it('should update highest and lowest ELO ratings', async () => {
      const playerName = 'TestPlayer_ELO_' + Date.now();

      // Initial game (1200 + 50 = 1250)
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 50);
      let stats = await getPlayerStats(playerName);
      expect(stats?.elo_rating).toBe(1250);
      expect(stats?.highest_rating).toBe(1250);
      expect(stats?.lowest_rating).toBe(1250);

      // Win again (1250 + 30 = 1280)
      await updateGameStats(playerName, { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 30);
      stats = await getPlayerStats(playerName);
      expect(stats?.elo_rating).toBe(1280);
      expect(stats?.highest_rating).toBe(1280);
      expect(stats?.lowest_rating).toBe(1250);

      // Lose (1280 - 40 = 1240)
      await updateGameStats(playerName, { won: false, gameRounds: 5, gameDurationMinutes: 10 }, -40);
      stats = await getPlayerStats(playerName);
      expect(stats?.elo_rating).toBe(1240);
      expect(stats?.highest_rating).toBe(1280); // Preserved
      expect(stats?.lowest_rating).toBe(1240); // Updated
    });
  });

  describe('Round Stats Recording', () => {
    it('should record successful bet', async () => {
      const playerName = 'TestPlayer_BetSuccess_' + Date.now();

      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 2,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.total_bets_made).toBe(1);
      expect(stats?.bets_won).toBe(1);
      expect(stats?.bets_lost).toBe(0);
      expect(stats?.total_tricks_won).toBe(9);
      expect(stats?.total_points_earned).toBe(10);
      expect(stats?.avg_bet_amount).toBeCloseTo(8.00, 1);
      expect(stats?.highest_bet).toBe(8);
    });

    it('should record failed bet', async () => {
      const playerName = 'TestPlayer_BetFail_' + Date.now();

      await updateRoundStats(playerName, {
        betMade: false,
        betAmount: 10,
        withoutTrump: false,
        tricksWon: 8,
        pointsEarned: 9,
        trumpsPlayed: 1,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.total_bets_made).toBe(1);
      expect(stats?.bets_won).toBe(0);
      expect(stats?.bets_lost).toBe(1);
      expect(stats?.avg_bet_amount).toBeCloseTo(10.00, 1);
    });

    it('should track without trump bets', async () => {
      const playerName = 'TestPlayer_WithoutTrump_' + Date.now();

      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: true,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 0,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.without_trump_bets).toBe(1);
    });

    it('should track trump cards played', async () => {
      const playerName = 'TestPlayer_TrumpCards_' + Date.now();

      // Round 1 - 2 trump cards
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 2,
      });
      let stats = await getPlayerStats(playerName);
      expect(stats?.trump_cards_played).toBe(2);

      // Round 2 - 3 more trump cards
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 9,
        withoutTrump: false,
        tricksWon: 10,
        pointsEarned: 11,
        trumpsPlayed: 3,
      });
      stats = await getPlayerStats(playerName);
      expect(stats?.trump_cards_played).toBe(5);
    });

    it('should track red zeros collected', async () => {
      const playerName = 'TestPlayer_RedZero_' + Date.now();

      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 15, // 10 base + 5 from red zero
        trumpsPlayed: 2,
        redZerosCollected: 1,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.red_zeros_collected).toBe(1);
    });

    it('should track brown zeros received', async () => {
      const playerName = 'TestPlayer_BrownZero_' + Date.now();

      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 8, // 10 base - 2 from brown zero
        trumpsPlayed: 2,
        brownZerosReceived: 1,
      });

      const stats = await getPlayerStats(playerName);
      expect(stats?.brown_zeros_received).toBe(1);
    });

    it('should calculate average tricks per game', async () => {
      const playerName = 'TestPlayer_AvgTricks_' + Date.now();

      // Round 1 - 9 tricks
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 2,
      });
      let stats = await getPlayerStats(playerName);
      expect(stats?.avg_tricks_per_game).toBeCloseTo(9.00, 1);

      // Round 2 - 7 tricks (avg should be 8)
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 7,
        withoutTrump: false,
        tricksWon: 7,
        pointsEarned: 8,
        trumpsPlayed: 1,
      });
      stats = await getPlayerStats(playerName);
      expect(stats?.avg_tricks_per_game).toBeCloseTo(8.00, 1);
    });

    it('should update highest bet', async () => {
      const playerName = 'TestPlayer_HighestBet_' + Date.now();

      // Bet 8
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 2,
      });
      let stats = await getPlayerStats(playerName);
      expect(stats?.highest_bet).toBe(8);

      // Bet 11 (higher)
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 11,
        withoutTrump: false,
        tricksWon: 12,
        pointsEarned: 13,
        trumpsPlayed: 3,
      });
      stats = await getPlayerStats(playerName);
      expect(stats?.highest_bet).toBe(11);

      // Bet 7 (lower - should not update)
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 7,
        withoutTrump: false,
        tricksWon: 8,
        pointsEarned: 9,
        trumpsPlayed: 1,
      });
      stats = await getPlayerStats(playerName);
      expect(stats?.highest_bet).toBe(11);
    });
  });

  describe.skip('Game History Recording', () => {
    it('should create game history record', async () => {
      const gameId = 'TEST_GAME_' + Date.now();

      await saveOrUpdateGame(gameId, ['Player1', 'Player2', 'Player3', 'Player4'], [1, 1, 2, 2]);

      const result = await query('SELECT * FROM game_history WHERE game_id = $1', [gameId]);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].game_id).toBe(gameId);
      expect(result.rows[0].is_finished).toBe(false);
    });

    it('should mark game as finished', async () => {
      const gameId = 'TEST_GAME_FINISH_' + Date.now();

      await createGame(gameId, ['Player1', 'Player2', 'Player3', 'Player4'], [1, 1, 2, 2]);
      await markGameFinished(gameId, 1);

      const result = await query('SELECT * FROM game_history WHERE game_id = $1', [gameId]);
      expect(result.rows[0].is_finished).toBe(true);
      expect(result.rows[0].winning_team).toBe(1);
      expect(result.rows[0].finished_at).toBeDefined();
    });
  });

  describe.skip('Leaderboard & Player History', () => {
    it('should retrieve leaderboard with top players', async () => {
      // Create multiple players with different stats
      await updateGameStats('Leader_1_' + Date.now(), { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 50);
      await updateGameStats('Leader_2_' + Date.now(), { won: true, gameRounds: 5, gameDurationMinutes: 10 }, 30);
      await updateGameStats('Leader_3_' + Date.now(), { won: false, gameRounds: 5, gameDurationMinutes: 10 }, -20);

      const leaderboard = await getLeaderboard(100);
      expect(Array.isArray(leaderboard)).toBe(true);
      expect(leaderboard.length).toBeGreaterThan(0);

      // Check that results are ordered by ELO rating descending
      for (let i = 0; i < leaderboard.length - 1; i++) {
        expect(leaderboard[i].elo_rating).toBeGreaterThanOrEqual(leaderboard[i + 1].elo_rating);
      }
    });

    it('should retrieve player history', async () => {
      const playerName = 'TestPlayer_History_' + Date.now();
      const gameId = 'TEST_HISTORY_' + Date.now();

      await createGame(gameId, [playerName, 'Bot1', 'Bot2', 'Bot3'], [1, 1, 2, 2]);
      await markGameFinished(gameId, 1);

      const history = await getPlayerGameHistory(playerName);
      expect(Array.isArray(history)).toBe(true);
      const playerGames = history.filter((g: any) => g.game_id === gameId);
      expect(playerGames.length).toBe(1);
    });
  });

  describe.skip('Integration: Complete Game Flow', () => {
    it('should record all stats for a complete game', async () => {
      const playerName = 'TestPlayer_CompleteFlow_' + Date.now();
      const gameId = 'TEST_COMPLETE_' + Date.now();

      // 1. Create game
      await createGame(gameId, [playerName, 'Bot1', 'Bot2', 'Bot3'], [1, 1, 2, 2]);

      // 2. Record round stats (simulate 3 rounds)
      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 8,
        withoutTrump: false,
        tricksWon: 9,
        pointsEarned: 10,
        trumpsPlayed: 2,
      });

      await updateRoundStats(playerName, {
        betMade: false,
        betAmount: 10,
        withoutTrump: true,
        tricksWon: 8,
        pointsEarned: 9,
        trumpsPlayed: 1,
        redZerosCollected: 1,
      });

      await updateRoundStats(playerName, {
        betMade: true,
        betAmount: 9,
        withoutTrump: false,
        tricksWon: 10,
        pointsEarned: 11,
        trumpsPlayed: 3,
        brownZerosReceived: 1,
      });

      // 3. Record game stats (win)
      await updateGameStats(
        playerName,
        {
          won: true,
          gameRounds: 3,
          gameDurationMinutes: 15,
        },
        35 // ELO change
      );

      // 4. Mark game as finished
      await markGameFinished(gameId, 1);

      // 5. Verify all stats were recorded
      const stats = await getPlayerStats(playerName);
      expect(stats).not.toBeNull();

      // Game stats
      expect(stats?.games_played).toBe(1);
      expect(stats?.games_won).toBe(1);
      expect(stats?.elo_rating).toBe(1235); // 1200 + 35

      // Round stats
      expect(stats?.total_bets_made).toBe(3);
      expect(stats?.bets_won).toBe(2);
      expect(stats?.bets_lost).toBe(1);
      expect(stats?.total_tricks_won).toBe(27); // 9 + 8 + 10
      expect(stats?.total_points_earned).toBe(30); // 10 + 9 + 11
      expect(stats?.without_trump_bets).toBe(1);
      expect(stats?.trump_cards_played).toBe(6); // 2 + 1 + 3
      expect(stats?.red_zeros_collected).toBe(1);
      expect(stats?.brown_zeros_received).toBe(1);

      // Game history
      const history = await getPlayerGameHistory(playerName);
      const game = history.find((g: any) => g.game_id === gameId);
      expect(game).toBeDefined();
      expect(game?.is_finished).toBe(true);
      expect(game?.winning_team).toBe(1);
    });
  });
});
