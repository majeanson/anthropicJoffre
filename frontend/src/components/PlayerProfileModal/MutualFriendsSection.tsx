/**
 * MutualFriendsSection - Display mutual friends with another player
 */

import { UICard } from '../ui/UICard';
import Avatar from '../Avatar';
import type { MutualFriendsSectionProps } from './types';

export function MutualFriendsSection({ mutualFriends }: MutualFriendsSectionProps) {
  if (mutualFriends.length === 0) {
    return null;
  }

  return (
    <UICard variant="bordered" size="md">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-team2">
          <span aria-hidden="true">🤝</span> Mutual Friends
        </h4>
        <span className="text-xs text-skin-muted">{mutualFriends.length} in common</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {mutualFriends.slice(0, 6).map((friendName) => (
          <div
            key={friendName}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-team2-10 border border-team2"
          >
            <Avatar username={friendName} size="sm" />
            <span className="text-sm text-skin-secondary">{friendName}</span>
          </div>
        ))}
        {mutualFriends.length > 6 && (
          <div className="flex items-center px-3 py-1.5 rounded-full bg-skin-tertiary text-skin-secondary text-sm">
            +{mutualFriends.length - 6} more
          </div>
        )}
      </div>
    </UICard>
  );
}
