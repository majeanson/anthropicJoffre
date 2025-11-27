/**
 * PlayerPosition Component
 * Renders player name badge and bot difficulty indicator (with press-to-show thinking)
 *
 * Extracted from PlayingPhase.tsx (lines 517-599, 908-1014)
 * Part of Sprint: PlayingPhase.tsx split into focused components
 */

import { memo } from 'react';
import { Player } from '../../types/game';
import { MoveSuggestionButton } from '../MoveSuggestionButton';
import type { MoveSuggestion } from '../../utils/moveSuggestion';

export interface PlayerPositionProps {
  player: Player | null;
  isYou: boolean;
  isWinner: boolean;
  isThinking: boolean;
  onClickPlayer?: (playerName: string) => void;
  botThinking: string | null;
  botThinkingOpen: boolean;
  onToggleBotThinking: () => void;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  showSuggestion: boolean;
  suggestion: MoveSuggestion | null;
  suggestionOpen: boolean;
  onToggleSuggestion: () => void;
}

export const PlayerPosition = memo(function PlayerPosition({
  player,
  isYou,
  isWinner,
  isThinking,
  onClickPlayer,
  botThinking,
  botThinkingOpen,
  onToggleBotThinking,
  tooltipPosition,
  showSuggestion,
  suggestion,
  suggestionOpen,
  onToggleSuggestion,
}: PlayerPositionProps) {
  // Helper: Get bot difficulty badge (now with bot thinking on click/press)
  const getBotDifficultyBadge = (): JSX.Element | null => {
    if (!player?.isBot || !player.botDifficulty) return null;

    const badges = {
      easy: { color: 'bg-green-500/90 text-white', icon: '🤖', label: 'Easy' },
      medium: { color: 'bg-yellow-500/90 text-white', icon: '🤖', label: 'Med' },
      hard: { color: 'bg-red-500/90 text-white', icon: '🤖', label: 'Hard' },
    };

    const badge = badges[player.botDifficulty];

    // If bot has thinking info, make badge pressable
    if (botThinking) {
      return (
        <button
          onMouseDown={onToggleBotThinking}
          onMouseUp={onToggleBotThinking}
          onMouseLeave={botThinkingOpen ? onToggleBotThinking : undefined}
          onTouchStart={onToggleBotThinking}
          onTouchEnd={onToggleBotThinking}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs md:text-[10px] font-bold ${badge.color} ml-1 shadow-lg transition-all active:scale-95 cursor-pointer hover:brightness-110 ${
            botThinkingOpen ? 'ring-2 ring-white scale-105' : ''
          }`}
          title={`Press to see what ${player.name} is thinking`}
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
          {/* Tooltip shown while pressed */}
          {botThinkingOpen && (
            <div
              className={`absolute z-[70] ${
                tooltipPosition === 'top'
                  ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
                  : tooltipPosition === 'bottom'
                  ? 'top-full left-1/2 -translate-x-1/2 mt-2'
                  : tooltipPosition === 'left'
                  ? 'right-full top-1/2 -translate-y-1/2 mr-2'
                  : 'left-full top-1/2 -translate-y-1/2 ml-2'
              } whitespace-nowrap pointer-events-none`}
              style={{ maxWidth: '90vw' }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-2xl border-2 border-blue-300">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex-shrink-0">
                    <span className="text-sm md:text-lg">🤖</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold opacity-90 truncate">{player.name}</div>
                    <div className="text-xs md:text-sm font-bold mt-0.5">{botThinking}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </button>
      );
    }

    // No bot thinking - just show static badge
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

  // Handle player name click (allow clicking on own profile and other real players, not bots)
  const handleNameClick = () => {
    if (player && !player.isEmpty && !player.isBot && onClickPlayer) {
      onClickPlayer(player.name);
    }
  };

  // Players can click on their own profile and other real players (not bots or empty seats)
  const isClickable = player && !player.isEmpty && !player.isBot && onClickPlayer;

  // Helper: Format suggestion details for display
  const getSuggestionDetails = (): string => {
    if (!suggestion) return '';
    return suggestion.explanation || suggestion.reason || '';
  };

  const getSuggestionSummary = (): string => {
    if (!suggestion) return '';
    const colorEmoji: Record<string, string> = {
      red: '🔴',
      blue: '🔵',
      green: '🟢',
      brown: '🟤',
    };
    return `${suggestion.card.value} ${colorEmoji[suggestion.card.color]}`;
  };

  return (
    <div className="flex items-center gap-1">
      {/* Move Suggestion Button - Show for human player when it's their turn */}
      {showSuggestion && suggestion && (
        <MoveSuggestionButton
          suggestion={getSuggestionSummary()}
          details={getSuggestionDetails()}
          isOpen={suggestionOpen}
          onToggle={onToggleSuggestion}
          position={tooltipPosition}
        />
      )}

      <div className={getBadgeClasses()}>
        <span className="flex items-center justify-center relative">
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
    </div>
  );
});
