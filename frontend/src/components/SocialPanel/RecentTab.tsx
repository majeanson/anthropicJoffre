/**
 * RecentTab Component
 *
 * Shows recently played-with human players.
 * Part of SocialPanel.
 */

import { PlayerNameButton } from '../PlayerNameButton';
import { RecentPlayer } from '../../utils/recentPlayers';

interface RecentTabProps {
  recentPlayers: RecentPlayer[];
  onViewProfile: (playerName: string) => void;
}

export function RecentTab({ recentPlayers, onViewProfile }: RecentTabProps) {
  // Filter out bots (names starting with "Bot ")
  const humanPlayers = recentPlayers.filter((p) => !p.name.startsWith('Bot '));

  if (humanPlayers.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-16">
        <p className="text-2xl mb-2">📭</p>
        <p className="text-lg font-semibold">No recent players yet</p>
        <p className="text-sm mt-2">Players you've played with will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {humanPlayers.map((player) => (
        <div
          key={player.name}
          className="bg-skin-tertiary rounded-lg p-3 border-2 border-skin-default hover:border-skin-accent transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <PlayerNameButton
                playerName={player.name}
                onClick={() => onViewProfile(player.name)}
                variant="plain"
                className="font-bold"
              />
              <p className="text-xs text-[var(--color-text-secondary)]">
                {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} •{' '}
                {new Date(player.lastPlayed).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
