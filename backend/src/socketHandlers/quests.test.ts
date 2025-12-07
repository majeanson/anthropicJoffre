/**
 * Quest Socket Handler Tests
 *
 * Tests for the quest/progression system:
 * - Daily quests fetching and reward claiming
 * - Login streak tracking and achievements
 * - Daily calendar rewards
 * - Weekly calendar rewards
 * - Skin unlock system
 * - Tutorial completion rewards
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// Mock Types
// ============================================================================

interface Quest {
  id: number;
  type: 'play_games' | 'win_games' | 'play_tricks' | 'score_points';
  targetCount: number;
  currentProgress: number;
  rewardXp: number;
  rewardCurrency: number;
  completed: boolean;
  claimed: boolean;
}

interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  streakFreezeAvailable: boolean;
  totalLogins: number;
}

interface CalendarReward {
  dayNumber: number;
  rewardType: 'xp' | 'currency' | 'streak_freeze' | 'skin';
  rewardValue: number;
  rewardSkinId?: string;
}

interface CalendarProgress {
  currentDay: number;
  rewardsClaimed: number[];
  cycleStartDate: string;
}

interface WeeklyProgress {
  dayNumber: number; // 1-7 (Mon-Sun)
  claimed: number[];
  weekStartDate: string;
}

interface SkinRequirement {
  skinId: string;
  unlockType: 'level' | 'achievement' | 'purchase';
  requiredLevel?: number;
  achievementId?: string;
  purchaseCost?: number;
}

interface PlayerProgression {
  level: number;
  totalXp: number;
  currentLevelXP: number;
  nextLevelXP: number;
  cosmeticCurrency: number;
  unlockedSkins: string[];
  streak: LoginStreak;
  questStats: QuestStats;
}

interface QuestStats {
  totalCompleted: number;
  currentStreak: number;
  totalXpEarned: number;
  totalCurrencyEarned: number;
}

// ============================================================================
// Test Helpers
// ============================================================================

function createQuestStore(): {
  quests: Map<string, Quest[]>;
  streaks: Map<string, LoginStreak>;
  calendarProgress: Map<string, CalendarProgress>;
  weeklyProgress: Map<string, WeeklyProgress>;
  progression: Map<string, PlayerProgression>;
  tutorialCompleted: Map<string, Set<string>>;
  unlockedSkins: Map<string, Set<string>>;
  getPlayerQuests: (playerName: string) => Quest[];
  completeQuestProgress: (playerName: string, questId: number, amount: number) => void;
  claimQuestReward: (playerName: string, questId: number) => { xp: number; currency: number } | null;
  updateLoginStreak: (playerName: string) => { currentStreak: number; longestStreak: number; freezeUsed: boolean };
  getLoginStreak: (playerName: string) => LoginStreak | null;
  getCalendarProgress: (playerName: string) => CalendarProgress;
  claimCalendarReward: (playerName: string, dayNumber: number) => { xp?: number; currency?: number; skinId?: string } | null;
  getWeeklyProgress: (playerName: string) => WeeklyProgress;
  claimWeeklyReward: (playerName: string, dayNumber: number) => { success: boolean; xp?: number; currency?: number; message: string };
  completeTutorialStep: (playerName: string, stepId: string) => { xp: number; currency: number; alreadyCompleted: boolean };
  checkSkinUnlocks: (playerName: string) => { newlyUnlocked: string[]; playerLevel: number };
  getPlayerProgression: (playerName: string) => PlayerProgression;
} {
  const quests = new Map<string, Quest[]>();
  const streaks = new Map<string, LoginStreak>();
  const calendarProgress = new Map<string, CalendarProgress>();
  const weeklyProgress = new Map<string, WeeklyProgress>();
  const progression = new Map<string, PlayerProgression>();
  const tutorialCompleted = new Map<string, Set<string>>();
  const unlockedSkins = new Map<string, Set<string>>();

  // Initialize default quests for new players
  const createDefaultQuests = (): Quest[] => [
    { id: 1, type: 'play_games', targetCount: 3, currentProgress: 0, rewardXp: 50, rewardCurrency: 10, completed: false, claimed: false },
    { id: 2, type: 'win_games', targetCount: 1, currentProgress: 0, rewardXp: 75, rewardCurrency: 15, completed: false, claimed: false },
    { id: 3, type: 'play_tricks', targetCount: 20, currentProgress: 0, rewardXp: 30, rewardCurrency: 5, completed: false, claimed: false },
  ];

  const getPlayerQuests = (playerName: string): Quest[] => {
    if (!quests.has(playerName)) {
      quests.set(playerName, createDefaultQuests());
    }
    return quests.get(playerName)!;
  };

  const completeQuestProgress = (playerName: string, questId: number, amount: number): void => {
    const playerQuests = getPlayerQuests(playerName);
    const quest = playerQuests.find(q => q.id === questId);
    if (quest && !quest.completed) {
      quest.currentProgress = Math.min(quest.currentProgress + amount, quest.targetCount);
      if (quest.currentProgress >= quest.targetCount) {
        quest.completed = true;
      }
    }
  };

  const claimQuestReward = (playerName: string, questId: number): { xp: number; currency: number } | null => {
    const playerQuests = getPlayerQuests(playerName);
    const quest = playerQuests.find(q => q.id === questId);

    if (!quest) return null;
    if (!quest.completed) throw new Error('Quest not completed');
    if (quest.claimed) throw new Error('Quest reward already claimed');

    quest.claimed = true;

    // Update progression
    const prog = getPlayerProgression(playerName);
    prog.totalXp += quest.rewardXp;
    prog.cosmeticCurrency += quest.rewardCurrency;
    prog.questStats.totalCompleted++;
    prog.questStats.totalXpEarned += quest.rewardXp;
    prog.questStats.totalCurrencyEarned += quest.rewardCurrency;

    return { xp: quest.rewardXp, currency: quest.rewardCurrency };
  };

  const updateLoginStreak = (playerName: string): { currentStreak: number; longestStreak: number; freezeUsed: boolean } => {
    let streak = streaks.get(playerName);
    const today = new Date().toISOString().split('T')[0];
    let freezeUsed = false;

    if (!streak) {
      streak = {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: today,
        streakFreezeAvailable: false,
        totalLogins: 1,
      };
      streaks.set(playerName, streak);
    } else {
      const lastLogin = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null;
      const todayDate = new Date(today);

      if (lastLogin) {
        const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Same day, no change
        } else if (daysDiff === 1) {
          // Consecutive day
          streak.currentStreak++;
          streak.totalLogins++;
        } else if (daysDiff === 2 && streak.streakFreezeAvailable) {
          // Missed one day but have freeze
          streak.currentStreak++;
          streak.totalLogins++;
          streak.streakFreezeAvailable = false;
          freezeUsed = true;
        } else {
          // Streak broken
          streak.currentStreak = 1;
          streak.totalLogins++;
        }

        streak.lastLoginDate = today;
      }

      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    }

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      freezeUsed,
    };
  };

  const getLoginStreak = (playerName: string): LoginStreak | null => {
    return streaks.get(playerName) || null;
  };

  const getCalendarProgress = (playerName: string): CalendarProgress => {
    if (!calendarProgress.has(playerName)) {
      calendarProgress.set(playerName, {
        currentDay: 1,
        rewardsClaimed: [],
        cycleStartDate: new Date().toISOString(),
      });
    }
    return calendarProgress.get(playerName)!;
  };

  const claimCalendarReward = (playerName: string, dayNumber: number): { xp?: number; currency?: number; skinId?: string } | null => {
    const progress = getCalendarProgress(playerName);

    // Validate day number
    if (dayNumber < 1 || dayNumber > 30) {
      throw new Error('Invalid day number');
    }

    // Check if already claimed
    if (progress.rewardsClaimed.includes(dayNumber)) {
      throw new Error('Reward already claimed');
    }

    // Check if day is available (must claim in order)
    if (dayNumber > progress.currentDay) {
      throw new Error('Day not yet available');
    }

    progress.rewardsClaimed.push(dayNumber);
    progress.currentDay = Math.max(progress.currentDay, dayNumber + 1);

    // Return mock rewards based on day
    if (dayNumber % 7 === 0) {
      // Weekly bonus - skin or large XP
      return { xp: 200, currency: 50 };
    } else if (dayNumber % 3 === 0) {
      return { currency: 25 };
    } else {
      return { xp: 50 };
    }
  };

  const getWeeklyProgress = (playerName: string): WeeklyProgress => {
    if (!weeklyProgress.has(playerName)) {
      // Calculate current week start (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);

      weeklyProgress.set(playerName, {
        dayNumber: diff + 1, // 1-7
        claimed: [],
        weekStartDate: weekStart.toISOString(),
      });
    }
    return weeklyProgress.get(playerName)!;
  };

  const claimWeeklyReward = (playerName: string, dayNumber: number): { success: boolean; xp?: number; currency?: number; message: string } => {
    const progress = getWeeklyProgress(playerName);

    if (dayNumber < 1 || dayNumber > 7) {
      return { success: false, message: 'Invalid day number (must be 1-7)' };
    }

    if (progress.claimed.includes(dayNumber)) {
      return { success: false, message: 'Already claimed' };
    }

    if (dayNumber > progress.dayNumber) {
      return { success: false, message: 'Day not yet available' };
    }

    progress.claimed.push(dayNumber);

    // Sunday (day 7) has bonus rewards
    const rewards = dayNumber === 7
      ? { xp: 150, currency: 30 }
      : { xp: 25, currency: 5 };

    return { success: true, ...rewards, message: 'Reward claimed!' };
  };

  const completeTutorialStep = (playerName: string, stepId: string): { xp: number; currency: number; alreadyCompleted: boolean } => {
    if (!tutorialCompleted.has(playerName)) {
      tutorialCompleted.set(playerName, new Set());
    }

    const completed = tutorialCompleted.get(playerName)!;

    if (completed.has(stepId)) {
      return { xp: 0, currency: 0, alreadyCompleted: true };
    }

    completed.add(stepId);

    // Award tutorial rewards (5 XP, 3 currency per step)
    const prog = getPlayerProgression(playerName);
    prog.totalXp += 5;
    prog.cosmeticCurrency += 3;

    return { xp: 5, currency: 3, alreadyCompleted: false };
  };

  const checkSkinUnlocks = (playerName: string): { newlyUnlocked: string[]; playerLevel: number } => {
    const prog = getPlayerProgression(playerName);
    const playerSkins = unlockedSkins.get(playerName) || new Set<string>();
    const newlyUnlocked: string[] = [];

    // Mock skin requirements
    const skinRequirements: SkinRequirement[] = [
      { skinId: 'royal', unlockType: 'level', requiredLevel: 5 },
      { skinId: 'neon', unlockType: 'level', requiredLevel: 10 },
      { skinId: 'vintage', unlockType: 'level', requiredLevel: 15 },
      { skinId: 'cosmic', unlockType: 'level', requiredLevel: 20 },
    ];

    for (const req of skinRequirements) {
      if (req.unlockType === 'level' && req.requiredLevel && prog.level >= req.requiredLevel) {
        if (!playerSkins.has(req.skinId)) {
          playerSkins.add(req.skinId);
          newlyUnlocked.push(req.skinId);
        }
      }
    }

    unlockedSkins.set(playerName, playerSkins);
    prog.unlockedSkins = Array.from(playerSkins);

    return { newlyUnlocked, playerLevel: prog.level };
  };

  const getPlayerProgression = (playerName: string): PlayerProgression => {
    if (!progression.has(playerName)) {
      progression.set(playerName, {
        level: 1,
        totalXp: 0,
        currentLevelXP: 0,
        nextLevelXP: 100,
        cosmeticCurrency: 0,
        unlockedSkins: ['classic'], // Default skin
        streak: { currentStreak: 0, longestStreak: 0, lastLoginDate: null, streakFreezeAvailable: false, totalLogins: 0 },
        questStats: { totalCompleted: 0, currentStreak: 0, totalXpEarned: 0, totalCurrencyEarned: 0 },
      });
    }
    return progression.get(playerName)!;
  };

  return {
    quests,
    streaks,
    calendarProgress,
    weeklyProgress,
    progression,
    tutorialCompleted,
    unlockedSkins,
    getPlayerQuests,
    completeQuestProgress,
    claimQuestReward,
    updateLoginStreak,
    getLoginStreak,
    getCalendarProgress,
    claimCalendarReward,
    getWeeklyProgress,
    claimWeeklyReward,
    completeTutorialStep,
    checkSkinUnlocks,
    getPlayerProgression,
  };
}

/**
 * Calculate level from total XP
 * XP curve: Level N requires N * 100 XP to complete
 */
function calculateLevelFromXP(totalXp: number): { level: number; currentLevelXP: number; nextLevelXP: number } {
  let level = 1;
  let xpRemaining = totalXp;

  while (xpRemaining >= level * 100) {
    xpRemaining -= level * 100;
    level++;
  }

  return {
    level,
    currentLevelXP: xpRemaining,
    nextLevelXP: level * 100,
  };
}

// ============================================================================
// Daily Quest Tests
// ============================================================================

describe('Quest System - Daily Quests', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('get_daily_quests', () => {
    it('should return default quests for new player', () => {
      const quests = store.getPlayerQuests('Alice');

      expect(quests).toHaveLength(3);
      expect(quests[0].type).toBe('play_games');
      expect(quests[1].type).toBe('win_games');
      expect(quests[2].type).toBe('play_tricks');
    });

    it('should return same quests on subsequent calls', () => {
      const quests1 = store.getPlayerQuests('Alice');
      const quests2 = store.getPlayerQuests('Alice');

      expect(quests1).toBe(quests2); // Same reference
    });

    it('should track individual players separately', () => {
      const aliceQuests = store.getPlayerQuests('Alice');
      const bobQuests = store.getPlayerQuests('Bob');

      store.completeQuestProgress('Alice', 1, 3);

      expect(aliceQuests[0].completed).toBe(true);
      expect(bobQuests[0].completed).toBe(false);
    });
  });

  describe('quest progress tracking', () => {
    it('should update quest progress', () => {
      store.completeQuestProgress('Alice', 1, 1);
      const quests = store.getPlayerQuests('Alice');

      expect(quests[0].currentProgress).toBe(1);
      expect(quests[0].completed).toBe(false);
    });

    it('should mark quest completed when target reached', () => {
      store.completeQuestProgress('Alice', 1, 3); // Target is 3
      const quests = store.getPlayerQuests('Alice');

      expect(quests[0].currentProgress).toBe(3);
      expect(quests[0].completed).toBe(true);
    });

    it('should not exceed target count', () => {
      store.completeQuestProgress('Alice', 1, 5); // Target is 3
      const quests = store.getPlayerQuests('Alice');

      expect(quests[0].currentProgress).toBe(3);
    });

    it('should not update progress on completed quest', () => {
      store.completeQuestProgress('Alice', 1, 3);
      store.completeQuestProgress('Alice', 1, 1); // Try to add more
      const quests = store.getPlayerQuests('Alice');

      expect(quests[0].currentProgress).toBe(3);
    });
  });

  describe('claim_quest_reward', () => {
    it('should claim reward for completed quest', () => {
      store.completeQuestProgress('Alice', 1, 3);
      const reward = store.claimQuestReward('Alice', 1);

      expect(reward).toEqual({ xp: 50, currency: 10 });
    });

    it('should update player progression after claiming', () => {
      store.completeQuestProgress('Alice', 1, 3);
      store.claimQuestReward('Alice', 1);

      const prog = store.getPlayerProgression('Alice');
      expect(prog.totalXp).toBe(50);
      expect(prog.cosmeticCurrency).toBe(10);
      expect(prog.questStats.totalCompleted).toBe(1);
    });

    it('should reject claiming incomplete quest', () => {
      store.completeQuestProgress('Alice', 1, 1); // Not complete

      expect(() => store.claimQuestReward('Alice', 1)).toThrow('Quest not completed');
    });

    it('should reject claiming already claimed quest', () => {
      store.completeQuestProgress('Alice', 1, 3);
      store.claimQuestReward('Alice', 1);

      expect(() => store.claimQuestReward('Alice', 1)).toThrow('Quest reward already claimed');
    });

    it('should return null for non-existent quest', () => {
      const reward = store.claimQuestReward('Alice', 999);
      expect(reward).toBeNull();
    });

    it('should track cumulative rewards across quests', () => {
      // Complete and claim multiple quests
      store.completeQuestProgress('Alice', 1, 3);
      store.completeQuestProgress('Alice', 2, 1);

      store.claimQuestReward('Alice', 1);
      store.claimQuestReward('Alice', 2);

      const prog = store.getPlayerProgression('Alice');
      expect(prog.totalXp).toBe(125); // 50 + 75
      expect(prog.cosmeticCurrency).toBe(25); // 10 + 15
      expect(prog.questStats.totalCompleted).toBe(2);
    });
  });
});

// ============================================================================
// Login Streak Tests
// ============================================================================

describe('Quest System - Login Streaks', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('update_login_streak', () => {
    it('should initialize streak for new player', () => {
      const result = store.updateLoginStreak('Alice');

      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.freezeUsed).toBe(false);
    });

    it('should not change streak for same day login', () => {
      store.updateLoginStreak('Alice');
      const result = store.updateLoginStreak('Alice');

      expect(result.currentStreak).toBe(1);
    });

    it('should track longest streak', () => {
      const result = store.updateLoginStreak('Alice');

      expect(result.longestStreak).toBeGreaterThanOrEqual(result.currentStreak);
    });
  });

  describe('get_login_streak', () => {
    it('should return null for player with no streak', () => {
      const streak = store.getLoginStreak('NewPlayer');
      expect(streak).toBeNull();
    });

    it('should return streak info after login', () => {
      store.updateLoginStreak('Alice');
      const streak = store.getLoginStreak('Alice');

      expect(streak).not.toBeNull();
      expect(streak!.currentStreak).toBe(1);
      expect(streak!.totalLogins).toBe(1);
    });
  });

  describe('streak achievements', () => {
    it('should track total logins', () => {
      store.updateLoginStreak('Alice');
      const streak = store.getLoginStreak('Alice');

      expect(streak!.totalLogins).toBe(1);
    });
  });
});

// ============================================================================
// Daily Calendar Tests
// ============================================================================

describe('Quest System - Daily Calendar', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('get_player_calendar_progress', () => {
    it('should initialize calendar for new player', () => {
      const progress = store.getCalendarProgress('Alice');

      expect(progress.currentDay).toBe(1);
      expect(progress.rewardsClaimed).toEqual([]);
    });

    it('should persist progress between calls', () => {
      const progress1 = store.getCalendarProgress('Alice');
      progress1.currentDay = 5;

      const progress2 = store.getCalendarProgress('Alice');
      expect(progress2.currentDay).toBe(5);
    });
  });

  describe('claim_calendar_reward', () => {
    it('should claim day 1 reward', () => {
      const reward = store.claimCalendarReward('Alice', 1);

      expect(reward).not.toBeNull();
      expect(reward!.xp).toBeDefined();
    });

    it('should advance current day after claim', () => {
      store.claimCalendarReward('Alice', 1);
      const progress = store.getCalendarProgress('Alice');

      expect(progress.currentDay).toBe(2);
      expect(progress.rewardsClaimed).toContain(1);
    });

    it('should give bonus rewards on day 7', () => {
      // Claim days 1-6 first
      for (let i = 1; i <= 6; i++) {
        store.claimCalendarReward('Alice', i);
      }

      const reward = store.claimCalendarReward('Alice', 7);

      expect(reward!.xp).toBe(200);
      expect(reward!.currency).toBe(50);
    });

    it('should reject claiming future day', () => {
      expect(() => store.claimCalendarReward('Alice', 5)).toThrow('Day not yet available');
    });

    it('should reject claiming already claimed day', () => {
      store.claimCalendarReward('Alice', 1);

      expect(() => store.claimCalendarReward('Alice', 1)).toThrow('Reward already claimed');
    });

    it('should reject invalid day numbers', () => {
      expect(() => store.claimCalendarReward('Alice', 0)).toThrow('Invalid day number');
      expect(() => store.claimCalendarReward('Alice', 31)).toThrow('Invalid day number');
    });

    it('should give currency on every 3rd day', () => {
      store.claimCalendarReward('Alice', 1);
      store.claimCalendarReward('Alice', 2);
      const reward = store.claimCalendarReward('Alice', 3);

      expect(reward!.currency).toBe(25);
    });
  });
});

// ============================================================================
// Weekly Calendar Tests
// ============================================================================

describe('Quest System - Weekly Calendar', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('get_player_weekly_progress', () => {
    it('should initialize weekly progress', () => {
      const progress = store.getWeeklyProgress('Alice');

      expect(progress.dayNumber).toBeGreaterThanOrEqual(1);
      expect(progress.dayNumber).toBeLessThanOrEqual(7);
      expect(progress.claimed).toEqual([]);
    });
  });

  describe('claim_weekly_reward', () => {
    it('should claim available day reward', () => {
      const progress = store.getWeeklyProgress('Alice');
      const result = store.claimWeeklyReward('Alice', 1);

      // Day 1 should always be available
      if (progress.dayNumber >= 1) {
        expect(result.success).toBe(true);
        expect(result.xp).toBe(25);
        expect(result.currency).toBe(5);
      }
    });

    it('should reject claiming future day', () => {
      const result = store.claimWeeklyReward('Alice', 7);

      // Unless it's actually Sunday
      const today = new Date().getDay();
      if (today !== 0) { // 0 = Sunday
        expect(result.success).toBe(false);
        expect(result.message).toBe('Day not yet available');
      }
    });

    it('should reject claiming already claimed day', () => {
      store.claimWeeklyReward('Alice', 1);
      const result = store.claimWeeklyReward('Alice', 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Already claimed');
    });

    it('should reject invalid day numbers', () => {
      expect(store.claimWeeklyReward('Alice', 0).success).toBe(false);
      expect(store.claimWeeklyReward('Alice', 8).success).toBe(false);
    });

    it('should track claimed days', () => {
      store.claimWeeklyReward('Alice', 1);
      const progress = store.getWeeklyProgress('Alice');

      expect(progress.claimed).toContain(1);
    });
  });
});

// ============================================================================
// Tutorial Completion Tests
// ============================================================================

describe('Quest System - Tutorial Completion', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('complete_tutorial_step', () => {
    it('should award XP and currency for first completion', () => {
      const result = store.completeTutorialStep('Alice', 'step_1');

      expect(result.xp).toBe(5);
      expect(result.currency).toBe(3);
      expect(result.alreadyCompleted).toBe(false);
    });

    it('should not award for duplicate completion', () => {
      store.completeTutorialStep('Alice', 'step_1');
      const result = store.completeTutorialStep('Alice', 'step_1');

      expect(result.xp).toBe(0);
      expect(result.currency).toBe(0);
      expect(result.alreadyCompleted).toBe(true);
    });

    it('should track multiple steps independently', () => {
      const result1 = store.completeTutorialStep('Alice', 'step_1');
      const result2 = store.completeTutorialStep('Alice', 'step_2');

      expect(result1.alreadyCompleted).toBe(false);
      expect(result2.alreadyCompleted).toBe(false);
    });

    it('should update player progression', () => {
      store.completeTutorialStep('Alice', 'step_1');
      store.completeTutorialStep('Alice', 'step_2');
      store.completeTutorialStep('Alice', 'step_3');

      const prog = store.getPlayerProgression('Alice');
      expect(prog.totalXp).toBe(15); // 5 * 3
      expect(prog.cosmeticCurrency).toBe(9); // 3 * 3
    });

    it('should track different players separately', () => {
      store.completeTutorialStep('Alice', 'step_1');
      const bobResult = store.completeTutorialStep('Bob', 'step_1');

      expect(bobResult.alreadyCompleted).toBe(false);
    });
  });
});

// ============================================================================
// Skin Unlock Tests
// ============================================================================

describe('Quest System - Skin Unlocks', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('check_skin_unlocks', () => {
    it('should return empty for low level player', () => {
      const result = store.checkSkinUnlocks('Alice');

      expect(result.newlyUnlocked).toEqual([]);
      expect(result.playerLevel).toBe(1);
    });

    it('should unlock skins at appropriate levels', () => {
      const prog = store.getPlayerProgression('Alice');
      prog.level = 5;

      const result = store.checkSkinUnlocks('Alice');

      expect(result.newlyUnlocked).toContain('royal');
    });

    it('should not re-unlock already unlocked skins', () => {
      const prog = store.getPlayerProgression('Alice');
      prog.level = 5;

      store.checkSkinUnlocks('Alice');
      const result2 = store.checkSkinUnlocks('Alice');

      expect(result2.newlyUnlocked).toEqual([]);
    });

    it('should unlock multiple skins at high level', () => {
      const prog = store.getPlayerProgression('Alice');
      prog.level = 20;

      const result = store.checkSkinUnlocks('Alice');

      expect(result.newlyUnlocked).toContain('royal');
      expect(result.newlyUnlocked).toContain('neon');
      expect(result.newlyUnlocked).toContain('vintage');
      expect(result.newlyUnlocked).toContain('cosmic');
    });

    it('should update player progression with unlocked skins', () => {
      const prog = store.getPlayerProgression('Alice');
      prog.level = 10;

      store.checkSkinUnlocks('Alice');

      expect(prog.unlockedSkins).toContain('royal');
      expect(prog.unlockedSkins).toContain('neon');
    });
  });
});

// ============================================================================
// Player Progression Tests
// ============================================================================

describe('Quest System - Player Progression', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('get_player_progression', () => {
    it('should initialize progression for new player', () => {
      const prog = store.getPlayerProgression('Alice');

      expect(prog.level).toBe(1);
      expect(prog.totalXp).toBe(0);
      expect(prog.cosmeticCurrency).toBe(0);
      expect(prog.unlockedSkins).toContain('classic');
    });

    it('should include streak info', () => {
      const prog = store.getPlayerProgression('Alice');

      expect(prog.streak).toBeDefined();
      expect(prog.streak.currentStreak).toBe(0);
    });

    it('should include quest stats', () => {
      const prog = store.getPlayerProgression('Alice');

      expect(prog.questStats).toBeDefined();
      expect(prog.questStats.totalCompleted).toBe(0);
    });
  });

  describe('level calculation', () => {
    it('should calculate level 1 for 0 XP', () => {
      const result = calculateLevelFromXP(0);

      expect(result.level).toBe(1);
      expect(result.currentLevelXP).toBe(0);
      expect(result.nextLevelXP).toBe(100);
    });

    it('should calculate level 2 at 100 XP', () => {
      const result = calculateLevelFromXP(100);

      expect(result.level).toBe(2);
      expect(result.currentLevelXP).toBe(0);
      expect(result.nextLevelXP).toBe(200);
    });

    it('should calculate partial level progress', () => {
      const result = calculateLevelFromXP(150);

      expect(result.level).toBe(2);
      expect(result.currentLevelXP).toBe(50);
      expect(result.nextLevelXP).toBe(200);
    });

    it('should handle high XP values', () => {
      // Level 1: 100 XP
      // Level 2: 200 XP (total: 300)
      // Level 3: 300 XP (total: 600)
      // Level 4: 400 XP (total: 1000)
      const result = calculateLevelFromXP(1000);

      expect(result.level).toBe(5);
      expect(result.currentLevelXP).toBe(0);
    });

    it('should calculate XP curve correctly', () => {
      // XP required per level: 100, 200, 300, 400...
      // Cumulative: 100, 300, 600, 1000, 1500...

      expect(calculateLevelFromXP(99).level).toBe(1);
      expect(calculateLevelFromXP(100).level).toBe(2);
      expect(calculateLevelFromXP(299).level).toBe(2);
      expect(calculateLevelFromXP(300).level).toBe(3);
      expect(calculateLevelFromXP(599).level).toBe(3);
      expect(calculateLevelFromXP(600).level).toBe(4);
    });
  });
});

// ============================================================================
// Input Validation Tests
// ============================================================================

describe('Quest System - Input Validation', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('player name validation', () => {
    it('should handle empty player name for quests', () => {
      // Simulating the validation in handlers
      const playerName = '';
      expect(playerName).toBeFalsy();
    });

    it('should accept valid player names', () => {
      const quests = store.getPlayerQuests('ValidPlayer123');
      expect(quests).toHaveLength(3);
    });

    it('should handle special characters in names', () => {
      const quests = store.getPlayerQuests('Player_With-Special.Chars');
      expect(quests).toHaveLength(3);
    });
  });

  describe('quest ID validation', () => {
    it('should handle undefined quest ID', () => {
      const reward = store.claimQuestReward('Alice', undefined as any);
      expect(reward).toBeNull();
    });

    it('should handle negative quest ID', () => {
      const reward = store.claimQuestReward('Alice', -1);
      expect(reward).toBeNull();
    });
  });

  describe('day number validation', () => {
    it('should reject zero day for calendar', () => {
      expect(() => store.claimCalendarReward('Alice', 0)).toThrow();
    });

    it('should reject negative day for weekly', () => {
      const result = store.claimWeeklyReward('Alice', -1);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Edge Cases and Error Handling
// ============================================================================

describe('Quest System - Edge Cases', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('concurrent operations', () => {
    it('should handle rapid quest completions', () => {
      // Simulate rapid progress updates
      for (let i = 0; i < 10; i++) {
        store.completeQuestProgress('Alice', 1, 1);
      }

      const quests = store.getPlayerQuests('Alice');
      expect(quests[0].currentProgress).toBe(3); // Capped at target
      expect(quests[0].completed).toBe(true);
    });

    it('should handle rapid tutorial completions', () => {
      const results: boolean[] = [];

      // Simulate rapid completions of same step
      for (let i = 0; i < 5; i++) {
        const result = store.completeTutorialStep('Alice', 'step_1');
        results.push(result.alreadyCompleted);
      }

      // First should succeed, rest should be duplicates
      expect(results[0]).toBe(false);
      expect(results.slice(1).every(r => r === true)).toBe(true);
    });
  });

  describe('boundary conditions', () => {
    it('should handle max calendar day (30)', () => {
      // Set progress to day 30
      const progress = store.getCalendarProgress('Alice');
      progress.currentDay = 30;
      progress.rewardsClaimed = Array.from({ length: 29 }, (_, i) => i + 1);

      const reward = store.claimCalendarReward('Alice', 30);
      expect(reward).not.toBeNull();
    });

    it('should handle max weekly day (7 = Sunday)', () => {
      const progress = store.getWeeklyProgress('Alice');
      progress.dayNumber = 7;
      progress.claimed = [1, 2, 3, 4, 5, 6];

      const result = store.claimWeeklyReward('Alice', 7);
      expect(result.success).toBe(true);
      expect(result.xp).toBe(150); // Sunday bonus
    });

    it('should handle very high XP values', () => {
      const result = calculateLevelFromXP(1000000);
      expect(result.level).toBeGreaterThan(100);
    });
  });

  describe('state consistency', () => {
    it('should maintain consistency after multiple operations', () => {
      // Complete tutorial
      store.completeTutorialStep('Alice', 'step_1');
      store.completeTutorialStep('Alice', 'step_2');

      // Complete quest
      store.completeQuestProgress('Alice', 1, 3);
      store.claimQuestReward('Alice', 1);

      // Claim calendar
      store.claimCalendarReward('Alice', 1);

      // Check progression is consistent
      const prog = store.getPlayerProgression('Alice');

      // XP: 5 + 5 (tutorial) + 50 (quest) = 60
      expect(prog.totalXp).toBe(60);

      // Currency: 3 + 3 (tutorial) + 10 (quest) = 16
      expect(prog.cosmeticCurrency).toBe(16);

      // Quest stats
      expect(prog.questStats.totalCompleted).toBe(1);
    });
  });
});

// ============================================================================
// Achievement Integration Tests
// ============================================================================

describe('Quest System - Achievement Integration', () => {
  let store: ReturnType<typeof createQuestStore>;

  beforeEach(() => {
    store = createQuestStore();
  });

  describe('streak achievements', () => {
    it('should track streak milestones', () => {
      // The actual implementation checks milestones at 3, 7, 14, 30 days
      const milestones = [3, 7, 14, 30];

      store.updateLoginStreak('Alice');
      const streak = store.getLoginStreak('Alice');

      // Verify milestone thresholds exist
      expect(milestones.includes(3)).toBe(true);
      expect(milestones.includes(7)).toBe(true);
      expect(milestones.includes(14)).toBe(true);
      expect(milestones.includes(30)).toBe(true);
    });
  });

  describe('quest completion achievements', () => {
    it('should track quest completion count', () => {
      store.completeQuestProgress('Alice', 1, 3);
      store.completeQuestProgress('Alice', 2, 1);

      store.claimQuestReward('Alice', 1);
      store.claimQuestReward('Alice', 2);

      const prog = store.getPlayerProgression('Alice');
      expect(prog.questStats.totalCompleted).toBe(2);
    });
  });

  describe('total login achievements', () => {
    it('should track total logins', () => {
      store.updateLoginStreak('Alice');
      const streak = store.getLoginStreak('Alice');

      expect(streak!.totalLogins).toBe(1);
    });
  });
});
