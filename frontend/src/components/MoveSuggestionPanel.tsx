/**
 * Move Suggestion Panel for Beginner Mode
 * Shows suggested moves with explanations
 */

import { useState } from 'react';
import { GameState, Card } from '../types/game';
import { suggestMove, suggestBet } from '../utils/moveSuggestion';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

interface MoveSuggestionPanelProps {
  gameState: GameState;
  currentPlayerId: string;
  isMyTurn: boolean;
}

export function MoveSuggestionPanel({
  gameState,
  currentPlayerId,
  isMyTurn,
}: MoveSuggestionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isMyTurn) return null;

  // Check if there's a suggestion to show
  const hasSuggestion =
    gameState.phase === 'betting' ||
    (gameState.phase === 'playing' && suggestMove(gameState, currentPlayerId) !== null);

  if (!hasSuggestion) return null;

  const renderBettingSuggestion = () => {
    const suggestion = suggestBet(gameState, currentPlayerId);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            💡
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">
              {suggestion.skip ? 'Consider Skipping' : `Suggested Bet: ${suggestion.amount} points`}
            </p>
            <p className="text-xs text-blue-600 mt-1">{suggestion.reason}</p>
            {isExpanded && suggestion.alternatives && (
              <p className="text-xs text-blue-700 mt-2 italic">
                {suggestion.alternatives}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPlayingSuggestion = () => {
    const suggestion = suggestMove(gameState, currentPlayerId);
    if (!suggestion) return null;

    const getPriorityColor = () => {
      switch (suggestion.priority) {
        case 'high':
          return 'text-green-600';
        case 'medium':
          return 'text-yellow-600';
        case 'low':
          return 'text-gray-600';
      }
    };

    const getCardDisplay = (card: Card) => {
      const colorEmoji: Record<string, string> = {
        red: '🔴',
        blue: '🔵',
        green: '🟢',
        brown: '🟤',
      };

      return `${card.value} ${colorEmoji[card.color]}`;
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🎯
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">
              Suggested:{' '}
              <span className={getPriorityColor()}>{getCardDisplay(suggestion.card)}</span>
            </p>
            <p className="text-xs text-blue-600">{suggestion.reason}</p>
            {isExpanded && (
              <>
                <p className="text-xs text-blue-700 mt-1">
                  {suggestion.explanation}
                </p>
                {suggestion.alternatives && (
                  <p className="text-xs text-blue-700 mt-2 italic">
                    {suggestion.alternatives}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <UICard
      variant="gradient"
      gradient="info"
      size="sm"
      className="border-2 border-blue-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {gameState.phase === 'betting' && renderBettingSuggestion()}
          {gameState.phase === 'playing' && renderPlayingSuggestion()}
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 p-1"
          title={isExpanded ? 'Show less' : 'Show more'}
          aria-label={isExpanded ? 'Show less' : 'Show more'}
        >
          {isExpanded ? '▲' : '▼'}
        </Button>
      </div>
    </UICard>
  );
}
