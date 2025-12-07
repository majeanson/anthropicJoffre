/**
 * OverviewTab Component
 *
 * Shows player level, XP progress, quick stats, and quest summary.
 * Part of ProfileProgressModal.
 */

import { LevelProgressBar } from '../LevelProgressBar';
import { StatCard } from '../ui';
import { skinList } from '../../config/skins';

interface PlayerProgression {
  level: number;
  totalXp: number;
  currentLevelXP: number;
  nextLevelXP: number;
  cosmeticCurrency: number;
  unlockedSkins: string[];
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalLogins: number;
  };
  questStats: {
    totalQuestsCompleted: number;
    totalQuestsClaimed: number;
    questsCompletedToday: number;
    totalXpEarned: number;
    totalCurrencyEarned: number;
  };
}

interface OverviewTabProps {
  progression: PlayerProgression;
}

export function OverviewTab({ progression }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Level & XP */}
      <LevelProgressBar
        level={progression.level}
        currentLevelXP={progression.currentLevelXP}
        nextLevelXP={progression.nextLevelXP}
        totalXP={progression.totalXp}
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={progression.streak.currentStreak}
          suffix="days"
        />
        <StatCard
          icon="🏆"
          label="Best Streak"
          value={progression.streak.longestStreak}
          suffix="days"
        />
        <StatCard icon="💰" label="Coins" value={progression.cosmeticCurrency} />
        <StatCard
          icon="🎨"
          label="Skins"
          value={progression.unlockedSkins.length}
          suffix={`/ ${skinList.length}`}
        />
      </div>

      {/* Quest Summary */}
      <div className="p-4 rounded-lg bg-skin-secondary">
        <h3 className="font-semibold mb-3 text-skin-primary">Quest Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-skin-secondary">
            Quests Completed Today:{' '}
            <strong>{progression.questStats.questsCompletedToday}/3</strong>
          </div>
          <div className="text-skin-secondary">
            Total Completed:{' '}
            <strong>{progression.questStats.totalQuestsCompleted}</strong>
          </div>
          <div className="text-skin-secondary">
            XP from Quests: <strong>{progression.questStats.totalXpEarned}</strong>
          </div>
          <div className="text-skin-secondary">
            Coins from Quests:{' '}
            <strong>{progression.questStats.totalCurrencyEarned}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
