/**
 * AchievementCard Component
 * Sprint 2 Phase 1
 *
 * Displays a single achievement with progress
 */

import { AchievementProgress, AchievementTier } from '../types/achievements';
import { designTokens } from '../styles/designTokens';

interface AchievementCardProps {
  achievement: AchievementProgress;
  size?: 'small' | 'medium' | 'large';
}

export function AchievementCard({ achievement, size = 'medium' }: AchievementCardProps) {
  const getTierColor = (tier: AchievementTier): string => {
    switch (tier) {
      case 'bronze': return designTokens.gradients.warning;
      case 'silver': return designTokens.gradients.secondary;
      case 'gold': return designTokens.gradients.special;
      case 'platinum': return designTokens.gradients.info;
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
  const progressPercent = hasProgress ? (achievement.progress / achievement.max_progress) * 100 : 0;

  // Size classes
  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

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
    <div
      className={`relative ${sizeClasses[size]} rounded-xl border-2 ${getTierBorder(achievement.tier)} transition-all ${
        isLocked
          ? 'bg-gray-800 dark:bg-gray-900 opacity-50 grayscale'
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
          <div className={`${titleSizes[size]} font-bold text-white truncate`}>
            {achievement.is_secret && isLocked ? '???' : achievement.achievement_name}
          </div>
          <div className="text-xs text-white/80 mt-1">
            {achievement.is_secret && isLocked ? 'Secret achievement' : achievement.description}
          </div>

          {/* Progress bar for incremental achievements */}
          {hasProgress && !isLocked && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                <span>Progress</span>
                <span>{achievement.progress}/{achievement.max_progress}</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Points and tier */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
              {achievement.points} pts
            </span>
            <span className="text-xs uppercase tracking-wider text-white/60">
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
    </div>
  );
}
