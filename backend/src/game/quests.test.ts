/**
 * Quest System - Game Logic Tests
 * Sprint 19: Daily Engagement System
 */

import { describe, it, expect } from 'vitest';
import {
  extractQuestContext,
  calculateQuestProgress,
  isQuestCompleted,
  calculateXPForLevel,
  calculateLevelFromXP,
  calculateTotalXPForLevel,
  canClaimQuestReward,
  getQuestDifficultyMultiplier,
  formatQuestProgress,
  getQuestProgressDisplay,
  QuestTemplate,
  PlayerQuest,
  GameQuestContext,
} from './quests';
import { GameState, Player } from '../types/game';

// Helper function to create a minimal game state for testing
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game-123',
    phase: 'game_over',
    players: [
      {
        id: 'player1',
        name: 'Alice',
        teamId: 1,
        hand: [],
        tricksWon: 5,
        pointsWon: 8,
        position: 0,
        isBot: false,
        botDifficulty: null,
      },
      {
        id: 'player2',
        name: 'Bob',
        teamId: 2,
        hand: [],
        tricksWon: 3,
        pointsWon: 3,
        position: 1,
        isBot: false,
        botDifficulty: null,
      },
      {
        id: 'player3',
        name: 'Charlie',
        teamId: 1,
        hand: [],
        tricksWon: 4,
        pointsWon: 4,
        position: 2,
        isBot: false,
        botDifficulty: null,
      },
      {
        id: 'player4',
        name: 'Diana',
        teamId: 2,
        hand: [],
        tricksWon: 1,
        pointsWon: 1,
        position: 3,
        isBot: false,
        botDifficulty: null,
      },
    ],
    team1Score: 42,
    team2Score: 25,
    winningTeam: 1,
    roundNumber: 5,
    dealerIndex: 0,
    currentTrick: [],
    roundHistory: [],
    createdAt: Date.now(),
    persistenceMode: 'casual',
    ...overrides,
  } as GameState;
}

// Helper function to create a quest template
function createQuestTemplate(overrides: Partial<QuestTemplate> = {}): QuestTemplate {
  return {
    id: 1,
    quest_key: 'test_quest',
    name: 'Test Quest',
    description: 'A test quest',
    quest_type: 'easy',
    objective_type: 'wins',
    target_value: 3,
    reward_xp: 10,
    reward_currency: 5,
    icon: '🎯',
    is_active: true,
    ...overrides,
  };
}

// Helper function to create a player quest
function createPlayerQuest(overrides: Partial<PlayerQuest> = {}): PlayerQuest {
  return {
    id: 1,
    player_name: 'Alice',
    quest_template_id: 1,
    progress: 0,
    completed: false,
    date_assigned: new Date().toISOString(),
    reward_claimed: false,
    template: createQuestTemplate(),
    ...overrides,
  };
}

describe('Quest System - Game Logic', () => {
  describe('extractQuestContext', () => {
    it('should extract basic quest context for winning player', () => {
      const game = createTestGameState();
      const context = extractQuestContext(game, 'Alice', 'game-123');

      expect(context).toEqual({
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 0, // No round history
        betAmount: undefined,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      });
    });

    it('should extract context for losing player', () => {
      const game = createTestGameState();
      const context = extractQuestContext(game, 'Bob', 'game-123');

      expect(context.won).toBe(false);
      expect(context.playerName).toBe('Bob');
      expect(context.tricksWon).toBe(3);
    });

    it('should detect comeback win', () => {
      const game = createTestGameState({
        team1Score: 42,
        team2Score: 35, // Within 10 points = comeback
        winningTeam: 1,
      });

      const context = extractQuestContext(game, 'Alice', 'game-123');
      expect(context.wasComeback).toBe(true);
    });

    it('should not detect comeback for easy win', () => {
      const game = createTestGameState({
        team1Score: 42,
        team2Score: 15, // More than 10 points ahead = not comeback
        winningTeam: 1,
      });

      const context = extractQuestContext(game, 'Alice', 'game-123');
      expect(context.wasComeback).toBe(false);
    });

    it('should detect red zero win in trick', () => {
      const game = createTestGameState({
        roundHistory: [
          {
            roundNumber: 1,
            bettingTeam: 1,
            betAmount: 8,
            withoutTrump: false,
            tricks: [
              {
                trickNumber: 1,
                winnerId: 'player1',
                cards: [
                  { playerId: 'player1', card: { color: 'red', value: 0 } },
                  { playerId: 'player2', card: { color: 'blue', value: 5 } },
                ],
              },
            ],
          },
        ],
      } as any);

      const context = extractQuestContext(game, 'Alice', 'game-123');
      expect(context.wonRedZero).toBe(true);
    });

    it('should detect brown zero defensive play', () => {
      const game = createTestGameState({
        roundHistory: [
          {
            roundNumber: 1,
            bettingTeam: 1,
            betAmount: 8,
            withoutTrump: false,
            tricks: [
              {
                trickNumber: 1,
                winnerId: 'player2', // Someone else won
                cards: [
                  { playerId: 'player1', card: { color: 'brown', value: 0 } },
                  { playerId: 'player2', card: { color: 'red', value: 5 } },
                ],
              },
            ],
          },
        ],
      } as any);

      const context = extractQuestContext(game, 'Alice', 'game-123');
      expect(context.usedBrownZeroDefensively).toBe(true);
    });

    it('should count bets made from round history', () => {
      const game = createTestGameState({
        roundHistory: [
          { roundNumber: 1 },
          { roundNumber: 2 },
          { roundNumber: 3 },
        ] as any,
      });

      const context = extractQuestContext(game, 'Alice', 'game-123');
      expect(context.betsMade).toBe(3);
    });

    it('should throw error for non-existent player', () => {
      const game = createTestGameState();
      expect(() => extractQuestContext(game, 'NonExistent', 'game-123')).toThrow(
        'Player NonExistent not found in game state'
      );
    });
  });

  describe('calculateQuestProgress', () => {
    it('should calculate progress for wins quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({ objective_type: 'wins', target_value: 3 }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 3,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(1);
    });

    it('should return 0 progress for wins quest when lost', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({ objective_type: 'wins' }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: false,
        tricksWon: 2,
        betsMade: 3,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 20,
        opponentScore: 42,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(0);
    });

    it('should calculate progress for games_played quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({ objective_type: 'games_played' }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: false, // Doesn't matter for games_played
        tricksWon: 0,
        betsMade: 0,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 20,
        opponentScore: 42,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(1);
    });

    it('should calculate progress for tricks_won quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({ objective_type: 'tricks_won' }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 7,
        betsMade: 3,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(7);
    });

    it('should calculate progress for bets_made quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({ objective_type: 'bets_made' }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 4,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(4);
    });

    it('should calculate progress for red zero special card quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({
          objective_type: 'special_cards',
          quest_key: 'win_red_zero',
        }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 3,
        wonRedZero: true,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(1);
    });

    it('should calculate progress for brown zero special card quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({
          objective_type: 'special_cards',
          quest_key: 'win_brown_zero',
        }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: false,
        tricksWon: 3,
        betsMade: 3,
        wonRedZero: false,
        usedBrownZeroDefensively: true,
        wasComeback: false,
        finalScore: 30,
        opponentScore: 42,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(1);
    });

    it('should calculate progress for bet_amount quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({
          objective_type: 'bet_amount',
          target_value: 11,
        }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 8,
        betsMade: 3,
        betAmount: 12,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(1);
    });

    it('should not give progress for bet_amount quest if lost', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({
          objective_type: 'bet_amount',
          target_value: 11,
        }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: false,
        tricksWon: 3,
        betsMade: 3,
        betAmount: 12,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 25,
        opponentScore: 42,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(0);
    });

    it('should calculate progress for comeback quest', () => {
      const quest = createPlayerQuest({
        template: createQuestTemplate({ objective_type: 'comeback' }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 4,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: true,
        finalScore: 42,
        opponentScore: 40,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(1);
    });

    it('should return 0 for already completed quest', () => {
      const quest = createPlayerQuest({
        completed: true,
        progress: 3,
        template: createQuestTemplate({ objective_type: 'wins', target_value: 3 }),
      });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 3,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(0);
    });

    it('should return 0 when template is missing', () => {
      const quest = createPlayerQuest({ template: undefined });
      const context: GameQuestContext = {
        playerName: 'Alice',
        gameId: 'game-123',
        won: true,
        tricksWon: 5,
        betsMade: 3,
        wonRedZero: false,
        usedBrownZeroDefensively: false,
        wasComeback: false,
        finalScore: 42,
        opponentScore: 25,
      };

      const progress = calculateQuestProgress(quest, context);
      expect(progress).toBe(0);
    });
  });

  describe('isQuestCompleted', () => {
    it('should return true when progress reaches target', () => {
      expect(isQuestCompleted(2, 1, 3)).toBe(true);
    });

    it('should return true when progress exceeds target', () => {
      expect(isQuestCompleted(2, 2, 3)).toBe(true);
    });

    it('should return false when progress is below target', () => {
      expect(isQuestCompleted(1, 1, 3)).toBe(false);
    });

    it('should return true for exact completion', () => {
      expect(isQuestCompleted(0, 3, 3)).toBe(true);
    });
  });

  describe('XP Calculation System', () => {
    describe('calculateXPForLevel', () => {
      it('should calculate correct XP for level 1', () => {
        expect(calculateXPForLevel(1)).toBe(100);
      });

      it('should calculate correct XP for level 2', () => {
        expect(calculateXPForLevel(2)).toBe(150);
      });

      it('should calculate correct XP for level 3', () => {
        expect(calculateXPForLevel(3)).toBe(225);
      });

      it('should calculate correct XP for level 5', () => {
        // 100 * 1.5^4 = 100 * 5.0625 = 506.25 -> 506
        expect(calculateXPForLevel(5)).toBe(506);
      });

      it('should calculate correct XP for level 10', () => {
        // 100 * 1.5^9 = 100 * 38.443... = 3844
        expect(calculateXPForLevel(10)).toBe(3844);
      });
    });

    describe('calculateTotalXPForLevel', () => {
      it('should return 0 for level 1', () => {
        expect(calculateTotalXPForLevel(1)).toBe(0);
      });

      it('should calculate total XP to reach level 2', () => {
        expect(calculateTotalXPForLevel(2)).toBe(100);
      });

      it('should calculate total XP to reach level 3', () => {
        // 100 + 150 = 250
        expect(calculateTotalXPForLevel(3)).toBe(250);
      });

      it('should calculate total XP to reach level 5', () => {
        // 100 + 150 + 225 + 337 = 812
        expect(calculateTotalXPForLevel(5)).toBe(812);
      });
    });

    describe('calculateLevelFromXP', () => {
      it('should return level 1 for 0 XP', () => {
        const result = calculateLevelFromXP(0);
        expect(result.level).toBe(1);
        expect(result.currentLevelXP).toBe(0);
        expect(result.nextLevelXP).toBe(100);
      });

      it('should return level 1 for 50 XP', () => {
        const result = calculateLevelFromXP(50);
        expect(result.level).toBe(1);
        expect(result.currentLevelXP).toBe(50);
        expect(result.nextLevelXP).toBe(100);
      });

      it('should return level 2 for 100 XP', () => {
        const result = calculateLevelFromXP(100);
        expect(result.level).toBe(2);
        expect(result.currentLevelXP).toBe(0);
        expect(result.nextLevelXP).toBe(150);
      });

      it('should return level 2 for 150 XP', () => {
        const result = calculateLevelFromXP(150);
        expect(result.level).toBe(2);
        expect(result.currentLevelXP).toBe(50);
        expect(result.nextLevelXP).toBe(150);
      });

      it('should return level 3 for 250 XP', () => {
        const result = calculateLevelFromXP(250);
        expect(result.level).toBe(3);
        expect(result.currentLevelXP).toBe(0);
        expect(result.nextLevelXP).toBe(225);
      });

      it('should reach high levels with extreme XP', () => {
        const result = calculateLevelFromXP(999999999);
        // With exponential curve, 999M XP reaches level 39
        // The cap at 50 in the implementation prevents infinite loops
        expect(result.level).toBeGreaterThanOrEqual(30);
        expect(result.level).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('canClaimQuestReward', () => {
    it('should allow claiming completed quest from today', () => {
      const quest = createPlayerQuest({
        completed: true,
        reward_claimed: false,
        date_assigned: new Date().toISOString(),
      });

      const result = canClaimQuestReward(quest);
      expect(result.canClaim).toBe(true);
    });

    it('should not allow claiming incomplete quest', () => {
      const quest = createPlayerQuest({
        completed: false,
        reward_claimed: false,
      });

      const result = canClaimQuestReward(quest);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Quest not completed');
    });

    it('should not allow claiming already claimed quest', () => {
      const quest = createPlayerQuest({
        completed: true,
        reward_claimed: true,
      });

      const result = canClaimQuestReward(quest);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Reward already claimed');
    });

    it('should not allow claiming expired quest from yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const quest = createPlayerQuest({
        completed: true,
        reward_claimed: false,
        date_assigned: yesterday.toISOString(),
      });

      const result = canClaimQuestReward(quest);
      expect(result.canClaim).toBe(false);
      expect(result.reason).toBe('Quest expired (not from today)');
    });
  });

  describe('Utility Functions', () => {
    it('should get correct difficulty multiplier for easy', () => {
      expect(getQuestDifficultyMultiplier('easy')).toBe(1.0);
    });

    it('should get correct difficulty multiplier for medium', () => {
      expect(getQuestDifficultyMultiplier('medium')).toBe(1.5);
    });

    it('should get correct difficulty multiplier for hard', () => {
      expect(getQuestDifficultyMultiplier('hard')).toBe(2.0);
    });

    it('should format quest progress as percentage', () => {
      expect(formatQuestProgress(2, 5)).toBe('40%');
      expect(formatQuestProgress(5, 5)).toBe('100%');
      expect(formatQuestProgress(6, 5)).toBe('100%'); // Capped at 100%
      expect(formatQuestProgress(0, 3)).toBe('0%');
    });

    it('should get quest progress display string', () => {
      expect(getQuestProgressDisplay(2, 5)).toBe('2/5');
      expect(getQuestProgressDisplay(5, 5)).toBe('5/5');
      expect(getQuestProgressDisplay(6, 5)).toBe('5/5'); // Capped at target
      expect(getQuestProgressDisplay(0, 3)).toBe('0/3');
    });
  });
});
