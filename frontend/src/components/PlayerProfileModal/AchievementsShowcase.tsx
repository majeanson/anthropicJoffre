/**
 * AchievementsShowcase - Unlocked achievements display
 */

import { UICard } from '../ui/UICard';
import type { AchievementsShowcaseProps } from './types';

export function AchievementsShowcase({ achievements, achievementPoints }: AchievementsShowcaseProps) {
  const unlockedAchievements = achievements.filter((a) => a.is_unlocked);

  if (achievements.length === 0) {
    return null;
  }

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-purple-300';
      case 'gold':
        return 'bg-gradient-to-br from-yellow-500 to-amber-600 ring-2 ring-yellow-300';
      case 'silver':
        return 'bg-gradient-to-br from-slate-300 to-slate-500 ring-2 ring-slate-200';
      default: // bronze
        return 'bg-gradient-to-br from-amber-600 to-amber-800 ring-2 ring-amber-400';
    }
  };

  return (
    <UICard variant="bordered" size="md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-yellow-400">
          <span aria-hidden="true">🏆</span> Achievements
        </h4>
        <span className="text-xs text-skin-muted">
          {unlockedAchievements.length}/{achievements.length} • {achievementPoints} pts
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {unlockedAchievements.slice(0, 8).map((achievement) => (
          <div
            key={achievement.achievement_key}
            className="relative group"
            title={`${achievement.achievement_name}: ${achievement.description}`}
          >
            <div
              className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-xl
                ${getTierStyle(achievement.tier)}
                shadow-lg transform transition-transform hover:scale-110
              `}
            >
              {achievement.icon}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-skin-primary text-skin-primary text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {achievement.achievement_name}
            </div>
          </div>
        ))}

        {unlockedAchievements.length > 8 && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold bg-skin-tertiary text-skin-secondary">
            +{unlockedAchievements.length - 8}
          </div>
        )}

        {unlockedAchievements.length === 0 && (
          <p className="text-sm text-skin-muted italic">No achievements yet</p>
        )}
      </div>
    </UICard>
  );
}
