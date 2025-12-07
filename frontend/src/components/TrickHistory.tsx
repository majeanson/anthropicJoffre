import { memo, useMemo } from 'react';
import { TrickResult, Player, CardColor } from '../types/game';
import { Card as CardComponent } from './Card';
import { UICard } from './ui/UICard';
import { UIBadge } from './ui/UIBadge';

interface TrickHistoryProps {
  tricks: TrickResult[];
  players: Player[];
  trump: CardColor | null;
  currentTrickIndex?: number;
  compact?: boolean;
  showWinner?: boolean;
  className?: string;
}

// Memoized single trick item to prevent re-renders
interface TrickItemProps {
  trick: TrickResult;
  trickIndex: number;
  isCurrentTrick: boolean;
  players: Player[];
  compact: boolean;
  showWinner: boolean;
}

const TrickItem = memo(function TrickItem({
  trick,
  trickIndex,
  isCurrentTrick,
  players,
  compact,
  showWinner,
}: TrickItemProps) {
  // Find winner's team for color coding
  const winner = players.find((p) => p.name === trick.winnerName);
  const winnerTeamColor = winner?.teamId === 1 ? 'team1' : 'team2';

  return (
    <UICard
      variant="bordered"
      size={compact ? 'sm' : 'md'}
      className={isCurrentTrick ? 'border-yellow-400 ring-2 ring-yellow-500' : ''}
    >
      {/* Trick Header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`font-bold text-skin-primary ${compact ? 'text-xs' : 'text-sm'}`}
        >
          Trick {trickIndex + 1}
        </span>
        {showWinner && (
          <UIBadge variant="solid" color={winnerTeamColor} size="xs" shape="pill">
            👑 {trick.winnerName || 'Unknown'} ({trick.points >= 0 ? '+' : ''}
            {trick.points} pts)
          </UIBadge>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-4 gap-2">
        {trick.trick.map((trickCard, cardIndex) => {
          const isWinner = trickCard.playerName === trick.winnerName;

          return (
            <div key={cardIndex} className="text-center">
              <div
                className={`mb-1 inline-block ${isWinner ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
              >
                <CardComponent
                  card={trickCard.card}
                  size={compact ? 'tiny' : 'small'}
                  disabled={true}
                />
              </div>
              <p
                className={`font-medium text-skin-secondary truncate ${compact ? 'text-xs' : 'text-xs'}`}
              >
                {trickCard.playerName || 'Unknown'}
              </p>
            </div>
          );
        })}
      </div>
    </UICard>
  );
});

export const TrickHistory = memo(function TrickHistory({
  tricks,
  players,
  currentTrickIndex,
  compact = false,
  showWinner = true,
  className = '',
}: TrickHistoryProps) {
  if (!tricks || tricks.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-skin-muted">No tricks played yet</p>
      </div>
    );
  }

  // Memoize the mapping to prevent re-computation
  const trickItems = useMemo(() => {
    return tricks.map((trick, trickIndex) => {
      const isCurrentTrick = currentTrickIndex !== undefined && trickIndex === currentTrickIndex;
      return (
        <TrickItem
          key={trickIndex}
          trick={trick}
          trickIndex={trickIndex}
          isCurrentTrick={isCurrentTrick}
          players={players}
          compact={compact}
          showWinner={showWinner}
        />
      );
    });
  }, [tricks, currentTrickIndex, players, compact, showWinner]);

  return <div className={`space-y-3 ${className}`}>{trickItems}</div>;
});
