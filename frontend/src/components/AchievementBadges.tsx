/**
 * AchievementBadges Component
 *
 * Displays a player's top achievement badges inline.
 * Used in PlayerPosition to show off accomplishments during gameplay.
 */

import { memo } from 'react';
import { AchievementProgress } from '../types/achievements';
import { rarityColors, rarityGlow } from '../hooks/useAchievementCache';

interface AchievementBadgesProps {
  badges: AchievementProgress[];
  maxDisplay?: number;
  size?: 'sm' | 'md';
}

/**
 * Inline achievement badges display
 */
export const AchievementBadges = memo(function AchievementBadges({
  badges,
  maxDisplay = 3,
  size = 'sm',
}: AchievementBadgesProps) {
  if (!badges || badges.length === 0) return null;

  const displayBadges = badges.slice(0, maxDisplay);
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5 ml-1">
      {displayBadges.map((badge) => (
        <span
          key={badge.achievement_id}
          className={`${iconSize} ${sizeClasses} flex items-center justify-center rounded-sm`}
          style={{
            backgroundColor: rarityColors[badge.rarity],
            boxShadow: rarityGlow[badge.rarity],
          }}
          title={`${badge.name} (${badge.rarity})`}
        >
          {badge.icon}
        </span>
      ))}
    </div>
  );
});

/**
 * Achievement badge tooltip content
 */
export const AchievementBadgeTooltip = memo(function AchievementBadgeTooltip({
  badge,
}: {
  badge: AchievementProgress;
}) {
  return (
    <div className="text-xs">
      <div className="font-bold flex items-center gap-1">
        <span>{badge.icon}</span>
        <span>{badge.name}</span>
      </div>
      <div className="opacity-80 mt-1">{badge.description}</div>
      <div
        className="text-[10px] mt-1 uppercase font-bold"
        style={{ color: rarityColors[badge.rarity] }}
      >
        {badge.rarity}
      </div>
    </div>
  );
});
