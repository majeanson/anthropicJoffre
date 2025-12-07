/**
 * AchievementsTab Component
 *
 * Shows achievement list with filters for category, tier, and unlock status.
 * Part of ProfileProgressModal.
 */

import { useState } from 'react';
import { AchievementCard } from '../AchievementCard';
import {
  ProgressBar,
  UICard,
  Select,
  Checkbox,
  LoadingState,
  EmptyState,
} from '../ui';
import { AchievementProgress, AchievementCategory, AchievementTier } from '../../types/achievements';

interface AchievementsTabProps {
  achievements: AchievementProgress[];
  achievementPoints: number;
  isLoading: boolean;
}

export function AchievementsTab({
  achievements,
  achievementPoints,
  isLoading,
}: AchievementsTabProps) {
  const [filterCategory, setFilterCategory] = useState<AchievementCategory | 'all'>('all');
  const [filterTier, setFilterTier] = useState<AchievementTier | 'all'>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;
  const totalCount = achievements.length;
  const completionPercent =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredAchievements = achievements.filter((achievement) => {
    if (filterCategory !== 'all' && achievement.category !== filterCategory) return false;
    if (filterTier !== 'all' && achievement.tier !== filterTier) return false;
    if (showUnlockedOnly && !achievement.is_unlocked) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Achievements summary */}
      <div className="p-4 rounded-lg bg-skin-secondary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-skin-primary">🏆 Achievement Progress</h3>
          <span className="text-sm font-bold text-skin-accent">
            {unlockedCount}/{totalCount} ({completionPercent}%) • {achievementPoints} pts
          </span>
        </div>
        <ProgressBar
          value={completionPercent}
          max={100}
          variant="gradient"
          color="warning"
          size="md"
        />
      </div>

      {/* Filters */}
      <UICard variant="bordered" size="sm">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            label="Category"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as AchievementCategory | 'all')}
            size="sm"
            options={[
              { value: 'all', label: 'All' },
              { value: 'gameplay', label: 'Gameplay' },
              { value: 'milestone', label: 'Milestone' },
              { value: 'social', label: 'Social' },
              { value: 'special', label: 'Special' },
            ]}
          />
          <Select
            label="Tier"
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as AchievementTier | 'all')}
            size="sm"
            options={[
              { value: 'all', label: 'All' },
              { value: 'bronze', label: 'Bronze' },
              { value: 'silver', label: 'Silver' },
              { value: 'gold', label: 'Gold' },
              { value: 'platinum', label: 'Platinum' },
            ]}
          />
          <Checkbox
            label="Unlocked only"
            checked={showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(e.target.checked)}
            size="sm"
          />
        </div>
      </UICard>

      {/* Achievements grid */}
      {isLoading ? (
        <LoadingState message="Loading achievements..." card />
      ) : filteredAchievements.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No achievements found"
          description="No achievements match your current filters"
          card
          compact
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.achievement_id}
              achievement={achievement}
              size="medium"
            />
          ))}
        </div>
      )}
    </div>
  );
}
