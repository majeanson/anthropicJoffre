/**
 * PlayerPosition Component
 * Renders player name badge, bot difficulty indicator, and swap button
 *
 * Extracted from PlayingPhase.tsx (lines 517-599, 908-1014)
 * Part of Sprint: PlayingPhase.tsx split into focused components
 */

import { memo } from 'react';
import { Player } from '../../types/game';

export interface PlayerPositionProps {
  player: Player | null;
  isYou: boolean;
  isWinner: boolean;
  canSwap: boolean;
  isThinking: boolean;
  onSwap: () => void;
  currentPlayerTeamId?: number | null;
  onClickPlayer?: (playerName: string) => void;
}

export const PlayerPosition = memo(function PlayerPosition({
  player,
  isYou,
  isWinner,
  canSwap,
  isThinking,
  onSwap,
  currentPlayerTeamId,
  onClickPlayer,
}: PlayerPositionProps) {
  // Helper: Get bot difficulty badge
  const getBotDifficultyBadge = (): JSX.Element | null => {
    if (!player?.isBot || !player.botDifficulty) return null;

    const badges = {
      easy: { color: 'bg-green-500/90 text-white', icon: '🤖', label: 'Easy' },
      medium: { color: 'bg-yellow-500/90 text-white', icon: '🤖', label: 'Med' },
      hard: { color: 'bg-red-500/90 text-white', icon: '🤖', label: 'Hard' },
    };

    const badge = badges[player.botDifficulty];

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs md:text-[10px] font-bold ${badge.color} ml-1 shadow-lg`}
        title={`Bot (${badge.label} difficulty)${isThinking ? ' - Thinking...' : ''}`}
      >
        <span className={isThinking ? 'animate-pulse' : ''}>{badge.icon}</span>
        <span className="hidden md:inline">{badge.label}</span>
        {isThinking && (
          <span className="flex gap-0.5 text-base md:text-xs">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
              .
            </span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
              .
            </span>
          </span>
        )}
      </span>
    );
  };

  // Helper: Get player display name
  const getDisplayName = (): string => {
    if (!player) return 'Empty Seat';
    if (player.isEmpty) return player.emptySlotName || 'Empty Seat';
    return player.name;
  };

  // Helper: Get badge CSS classes
  const getBadgeClasses = (): string => {
    const baseClasses =
      'max-w-[180px] px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg';

    let colorClasses = '';
    if (!player || player.isEmpty) {
      colorClasses =
        'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500';
    } else if (player.teamId === 1) {
      colorClasses = 'bg-gradient-to-br from-orange-500 to-orange-700 text-white';
    } else {
      colorClasses = 'bg-gradient-to-br from-purple-500 to-purple-700 text-white';
    }

    const winnerRing = isWinner ? 'ring-2 md:ring-3 ring-yellow-400' : '';

    return `${baseClasses} ${colorClasses} ${winnerRing}`;
  };

  // Helper: Get swap button title
  const getSwapTitle = (): string => {
    if (!player) return '';
    const changesTeams =
      currentPlayerTeamId !== null &&
      currentPlayerTeamId !== undefined &&
      player.teamId !== currentPlayerTeamId;
    return `Swap positions with ${player.name}${changesTeams ? ' (changes teams!)' : ''}`;
  };

  // Handle player name click
  const handleNameClick = () => {
    if (player && !player.isEmpty && !player.isBot && onClickPlayer) {
      onClickPlayer(player.name);
    }
  };

  const isClickable = player && !player.isEmpty && !player.isBot && onClickPlayer;

  return (
    <div className="flex items-center">
      <div className={getBadgeClasses()}>
        <span className="flex items-center justify-center">
          {player?.isEmpty && '💺 '}
          {isClickable ? (
            <button
              onClick={handleNameClick}
              className="hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded px-1 -mx-1"
              title={`View ${player.name}'s profile`}
            >
              {getDisplayName()}
            </button>
          ) : (
            getDisplayName()
          )}
          {isYou && ' (You)'}
          {getBotDifficultyBadge()}
        </span>
      </div>
      {canSwap && player && (
        <button
          onClick={onSwap}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-2 py-1 rounded text-xs font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
          title={getSwapTitle()}
        >
          ↔
        </button>
      )}
    </div>
  );
});
