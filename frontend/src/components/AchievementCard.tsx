/**
 * AchievementCard Component
 * Sprint 2 Phase 1
 *
 * Displays a single achievement with progress
 */

import { AchievementProgress, AchievementTier } from '../types/achievements';
import { UICard, ProgressBar } from './ui';

interface AchievementCardProps {
  achievement: AchievementProgress;
  size?: 'small' | 'medium' | 'large';
}

export function AchievementCard({ achievement, size = 'medium' }: AchievementCardProps) {
  const getTierColor = (tier: AchievementTier): string => {
    switch (tier) {
      case 'bronze': return 'from-amber-500 to-orange-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-purple-500 to-pink-600';
      case 'platinum': return 'from-blue-400 to-cyan-500';
    }
  };

  const getTierBorder = (tier: AchievementTier): string => {
    switch (tier) {
      case 'bronze': return 'border-amber-700';
      case 'silver': return 'border-gray-500';
      case 'gold': return 'border-yellow-500';
      case 'platinum': return 'border-cyan-500';
    }
  };

  const isLocked = !achievement.is_unlocked;
  const hasProgress = achievement.max_progress > 1;

  // Map achievement size to UICard size
  const uiCardSize = size === 'small' ? 'sm' : size === 'large' ? 'lg' : 'md';

  const iconSizes = {
    small: 'text-3xl',
    medium: 'text-4xl',
    large: 'text-5xl',
  };

  const titleSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-xl',
  };

  return (
    <UICard
      variant="bordered"
      size={uiCardSize}
      className={`relative border-2 ${getTierBorder(achievement.tier)} transition-all ${
        isLocked
          ? 'bg-gray-300 dark:bg-gray-800 opacity-60 grayscale'
          : `bg-gradient-to-br ${getTierColor(achievement.tier)} shadow-lg hover:scale-105 motion-safe:transition-transform`
      }`}
    >
      {/* Locked overlay */}
      {isLocked && achievement.is_secret && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl" aria-hidden="true">
          <span className="text-4xl">🔒</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${iconSizes[size]} flex-shrink-0 ${isLocked && !achievement.is_secret ? 'opacity-40' : ''}`}>
          {achievement.is_secret && isLocked ? '❓' : achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={`${titleSizes[size]} font-bold truncate ${isLocked ? 'text-gray-700 dark:text-gray-300' : 'text-white'}`}>
            {achievement.is_secret && isLocked ? '???' : achievement.achievement_name}
          </div>
          <div className={`text-xs mt-1 ${isLocked ? 'text-gray-600 dark:text-gray-400' : 'text-white/80'}`}>
            {achievement.is_secret && isLocked ? 'Secret achievement' : achievement.description}
          </div>

          {/* Progress bar for incremental achievements */}
          {hasProgress && !isLocked && (
            <div className="mt-2">
              <ProgressBar
                value={achievement.progress}
                max={achievement.max_progress}
                label="Progress"
                showValue
                valueFormatter={(v, max) => `${v}/${max}`}
                variant="default"
                color="gray"
                size="sm"
                className="[&_.bg-gray-200]:bg-black/30 [&_.bg-gray-500]:bg-white/80"
              />
            </div>
          )}

          {/* Points and tier */}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isLocked ? 'bg-gray-400/30 text-gray-700 dark:bg-gray-600/30 dark:text-gray-300' : 'bg-white/20 text-white'}`}>
              {achievement.points} pts
            </span>
            <span className={`text-xs uppercase tracking-wider ${isLocked ? 'text-gray-500 dark:text-gray-500' : 'text-white/60'}`}>
              {achievement.tier}
            </span>
            {achievement.is_unlocked && achievement.unlocked_at && (
              <span className="text-xs text-white/60 ml-auto">
                ✓
              </span>
            )}
          </div>
        </div>
      </div>
    </UICard>
  );
}
