/**
 * PlayerPosition Component - Multi-Skin Edition
 *
 * Renders player name badge and bot difficulty indicator.
 * Uses CSS variables for skin compatibility.
 */

import { memo } from 'react';
import { Player } from '../../types/game';
import { MoveSuggestionButton } from '../MoveSuggestionButton';
import { GameTooltip } from '../ui';
import { AchievementBadges } from '../AchievementBadges';
import type { MoveSuggestion } from '../../utils/moveSuggestion';
import type { AchievementProgress } from '../../types/achievements';

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
  /** Optional achievement badges to display */
  achievementBadges?: AchievementProgress[];
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
  achievementBadges,
}: PlayerPositionProps) {
  // Helper: Get bot difficulty badge (with click-to-toggle thinking)
  const getBotDifficultyBadge = (): JSX.Element | null => {
    if (!player?.isBot || !player.botDifficulty) return null;

    const badges = {
      easy: { bgColor: 'var(--color-success)', label: 'Easy' },
      medium: { bgColor: 'var(--color-warning)', label: 'Med' },
      hard: { bgColor: 'var(--color-error)', label: 'Hard' },
    };

    const badge = badges[player.botDifficulty];

    // If bot has thinking info, make badge clickable (toggle)
    if (botThinking) {
      return (
        <>
          <button
            onClick={onToggleBotThinking}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs md:text-[10px] font-bold ml-1 transition-all active:scale-95 cursor-pointer hover:brightness-110 text-white ${
              botThinkingOpen ? 'ring-2 ring-white scale-105' : ''
            }`}
            style={{
              backgroundColor: badge.bgColor,
              boxShadow: `0 2px 8px ${badge.bgColor}`,
            }}
            title={`Click to see what ${player.name} is thinking`}
            aria-expanded={botThinkingOpen}
            aria-label={
              botThinkingOpen ? `Hide ${player.name}'s thinking` : `Show ${player.name}'s thinking`
            }
          >
            <span className={isThinking ? 'animate-pulse' : ''}>🤖</span>
            <span className="hidden md:inline">{badge.label}</span>
            {isThinking && (
              <span className="flex gap-0.5 text-base md:text-xs">
                <span className="animate-bounce delay-0">.</span>
                <span className="animate-bounce delay-150">.</span>
                <span className="animate-bounce delay-300">.</span>
              </span>
            )}
          </button>

          {/* Bot Thinking Tooltip */}
          <GameTooltip
            isOpen={botThinkingOpen}
            onClose={onToggleBotThinking}
            title={`${player.name}'s Move`}
            icon="🤖"
            variant="bot"
            testId="bot-thinking-tooltip"
          >
            <div className="space-y-3">
              {/* Bot difficulty indicator */}
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ backgroundColor: badge.bgColor }}
                >
                  {badge.label} Bot
                </span>
              </div>

              {/* Main action */}
              <div className="text-lg font-bold">{botThinking}</div>

              {/* Explanation based on action type */}
              <div className="text-sm opacity-90 space-y-2">
                {botThinking?.includes('Red 0') && (
                  <p>
                    💡 Red 0 adds +5 bonus points to the trick winner. Bots play it when their team
                    is winning the trick.
                  </p>
                )}
                {botThinking?.includes('Brown 0') && (
                  <p>
                    💡 Brown 0 gives -2 penalty points. Bots dump it when opponents are winning the
                    trick.
                  </p>
                )}
                {botThinking?.includes('trump') && (
                  <p>💡 Trump cards beat all non-trump cards. Higher trump beats lower trump.</p>
                )}
                {botThinking?.includes('Leading') && (
                  <p>
                    💡 The first card played sets the "led suit" that others must follow if they
                    have it.
                  </p>
                )}
                {botThinking?.includes('7 ') && (
                  <p>
                    💡 7 is the highest value card in any suit - it can only be beaten by trump.
                  </p>
                )}
                {botThinking?.includes('secure the win') && (
                  <p>💡 Playing a high card to guarantee winning this trick.</p>
                )}
              </div>
            </div>
          </GameTooltip>
        </>
      );
    }

    // No bot thinking - just show static badge
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs md:text-[10px] font-bold ml-1 text-white"
        style={{
          backgroundColor: badge.bgColor,
          boxShadow: `0 2px 8px ${badge.bgColor}`,
        }}
        title={`Bot (${badge.label} difficulty)${isThinking ? ' - Thinking...' : ''}`}
      >
        <span className={isThinking ? 'animate-pulse' : ''}>🤖</span>
        <span className="hidden md:inline">{badge.label}</span>
        {isThinking && (
          <span className="flex gap-0.5 text-base md:text-xs">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-150">.</span>
            <span className="animate-bounce delay-300">.</span>
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

  // Helper: Get badge style based on team
  const getBadgeStyle = (): React.CSSProperties => {
    if (!player || player.isEmpty) {
      return {
        backgroundColor: 'var(--color-bg-tertiary)',
        borderColor: 'var(--color-border-subtle)',
        borderWidth: '2px',
        borderStyle: 'dashed',
      };
    }

    const teamColor =
      player.teamId === 1 ? 'var(--color-team1-primary)' : 'var(--color-team2-primary)';
    const teamTextColor =
      player.teamId === 1 ? 'var(--color-team1-text)' : 'var(--color-team2-text)';

    return {
      background: teamColor,
      color: teamTextColor,
      boxShadow: isWinner ? '0 0 15px var(--color-warning)' : `0 4px 12px ${teamColor}`,
    };
  };

  // Handle player name click
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

      <div
        className={`max-w-[180px] px-3 md:px-4 py-1 md:py-1.5 rounded-[var(--radius-lg)] text-xs md:text-sm font-bold shadow-lg ${
          isWinner ? 'ring-2 md:ring-3' : ''
        }`}
        style={{
          ...getBadgeStyle(),
          ...(isWinner ? { ringColor: 'var(--color-warning)' } : {}),
        }}
      >
        <span
          className="flex items-center justify-center relative"
          style={{
            color:
              player && !player.isEmpty
                ? player.teamId === 1
                  ? 'var(--color-team1-text)'
                  : 'var(--color-team2-text)'
                : 'var(--color-text-muted)',
          }}
        >
          {player?.isEmpty && <span aria-hidden="true">💺 </span>}
          {isClickable ? (
            <button
              onClick={handleNameClick}
              className="hover:underline cursor-pointer focus:outline-none rounded px-1 -mx-1"
              title={`View ${player.name}'s profile`}
            >
              {getDisplayName()}
            </button>
          ) : (
            getDisplayName()
          )}
          {isYou && ' (You)'}
          {getBotDifficultyBadge()}
          {/* Achievement badges for human players */}
          {!player?.isBot && achievementBadges && achievementBadges.length > 0 && (
            <AchievementBadges badges={achievementBadges} size="sm" />
          )}
        </span>
      </div>
    </div>
  );
});
