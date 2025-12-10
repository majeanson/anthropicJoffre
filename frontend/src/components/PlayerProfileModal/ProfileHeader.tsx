/**
 * ProfileHeader - Player avatar, name, tier, and ELO
 */

import Avatar from '../Avatar';
import { getTierColor, getTierIcon } from '../../utils/tierBadge';
import type { ProfileHeaderProps } from './types';

export function ProfileHeader({ playerName, stats }: ProfileHeaderProps) {
  const tierColor = getTierColor(stats.ranking_tier);
  const tierIcon = getTierIcon(stats.ranking_tier);

  return (
    <div className="flex items-center gap-4">
      <Avatar username={playerName} size="lg" />
      <div className="flex-1">
        <h3 className="text-xl font-bold text-skin-primary">{playerName}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-lg ${tierColor}`} aria-hidden="true">
            {tierIcon}
          </span>
          <span className={`font-semibold ${tierColor}`}>{stats.ranking_tier}</span>
          <span className="text-skin-muted" aria-hidden="true">
            •
          </span>
          <span className="text-skin-secondary">{stats.elo_rating} ELO</span>
        </div>
      </div>
    </div>
  );
}
