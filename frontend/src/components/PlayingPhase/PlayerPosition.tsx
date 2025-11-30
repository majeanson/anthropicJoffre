/**
 * PlayerPosition Component
 * Renders player name badge and bot difficulty indicator (with click-to-toggle thinking)
 *
 * Extracted from PlayingPhase.tsx (lines 517-599, 908-1014)
 * Part of Sprint: PlayingPhase.tsx split into focused components
 */

import { memo } from 'react';
import { Player } from '../../types/game';
import { MoveSuggestionButton } from '../MoveSuggestionButton';
import { GameTooltip } from '../ui';
import type { MoveSuggestion } from '../../utils/moveSuggestion';
import { colors } from '../../design-system';

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
  // Helper: Get bot difficulty badge (now with bot thinking on click toggle)
  const getBotDifficultyBadge = (): JSX.Element | null => {
    if (!player?.isBot || !player.botDifficulty) return null;

    const badges = {
      easy: { color: 'bg-green-500/90 text-white', icon: '🤖', label: 'Easy' },
      medium: { color: 'bg-yellow-500/90 text-white', icon: '🤖', label: 'Med' },
      hard: { color: 'bg-red-500/90 text-white', icon: '🤖', label: 'Hard' },
    };

    const badge = badges[player.botDifficulty];

    // If bot has thinking info, make badge clickable (toggle)
    if (botThinking) {
      return (
        <>
          <button
            onClick={onToggleBotThinking}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs md:text-[10px] font-bold ${badge.color} ml-1 shadow-lg transition-all active:scale-95 cursor-pointer hover:brightness-110 ${
              botThinkingOpen ? 'ring-2 ring-white scale-105' : ''
            }`}
            title={`Click to see what ${player.name} is thinking`}
            aria-expanded={botThinkingOpen}
            aria-label={botThinkingOpen ? `Hide ${player.name}'s thinking` : `Show ${player.name}'s thinking`}
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
          </button>

          {/* Bot Thinking Tooltip - Using GameTooltip for proper z-index and mobile positioning */}
          <GameTooltip
            isOpen={botThinkingOpen}
            onClose={onToggleBotThinking}
            title={player.name}
            icon="🤖"
            variant="bot"
            testId="bot-thinking-tooltip"
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-white/70">
                {badge.label} difficulty
              </p>
              <p className="text-base font-bold">{botThinking}</p>
            </div>
          </GameTooltip>
        </>
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
        'text-gray-200 border-2 border-dashed border-gray-500';
    } else if (player.teamId === 1) {
      colorClasses = 'text-white';
    } else {
      colorClasses = 'text-white';
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

  const getSuggestionAlternatives = (): string | undefined => {
    if (!suggestion) return undefined;
    return suggestion.alternatives;
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
          alternatives={getSuggestionAlternatives()}
          isOpen={suggestionOpen}
          onToggle={onToggleSuggestion}
          position={tooltipPosition}
          showTutorial={!suggestionOpen}
        />
      )}

      <div className={getBadgeClasses()} style={(player && !player.isEmpty) ? (player.teamId === 1 ? { background: colors.gradients.team1 } : { background: colors.gradients.team2 }) : {}}>
        <span className="flex items-center justify-center relative">
          {player?.isEmpty && <span aria-hidden="true">💺 </span>}
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
