import { TrickResult, Player, CardColor } from '../types/game';
import { Card as CardComponent } from './Card';

interface TrickHistoryProps {
  tricks: TrickResult[];
  players: Player[];
  trump: CardColor | null;
  currentTrickIndex?: number;
  compact?: boolean;
  showWinner?: boolean;
  className?: string;
}

export function TrickHistory({
  tricks,
  players,
  currentTrickIndex,
  compact = false,
  showWinner = true,
  className = ''
}: TrickHistoryProps) {
  if (!tricks || tricks.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No tricks played yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {tricks.map((trick, trickIndex) => {
        const isCurrentTrick = currentTrickIndex !== undefined && trickIndex === currentTrickIndex;

        // Find winner's team for color coding
        const winner = players.find(p => p.name === trick.winnerName);
        const winnerTeamColor = winner?.teamId === 1
          ? 'bg-orange-500 text-white border-2 border-orange-700'
          : 'bg-purple-500 text-white border-2 border-purple-700';

        return (
          <div
            key={trickIndex}
            className={`rounded-lg p-3 border-2 ${
              isCurrentTrick
                ? 'border-yellow-400 ring-2 ring-yellow-500 bg-gray-800 dark:bg-gray-700'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
            } ${compact ? 'p-2' : 'p-3'}`}
          >
            {/* Trick Header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`font-bold text-gray-800 dark:text-gray-200 ${compact ? 'text-xs' : 'text-sm'}`}>
                Trick {trickIndex + 1}
              </span>
              {showWinner && (
                <span className={`px-3 py-1 rounded-full font-semibold ${compact ? 'text-xs' : 'text-xs'} ${winnerTeamColor}`}>
                  👑 {trick.winnerName || 'Unknown'} ({trick.points >= 0 ? '+' : ''}{trick.points} pts)
                </span>
              )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-4 gap-2">
              {trick.trick.map((trickCard, cardIndex) => {
                const isWinner = trickCard.playerName === trick.winnerName;

                return (
                  <div key={cardIndex} className="text-center">
                    <div className={`mb-1 inline-block ${isWinner ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}>
                      <CardComponent
                        card={trickCard.card}
                        size={compact ? "tiny" : "small"}
                        disabled={true}
                      />
                    </div>
                    <p className={`font-medium text-gray-700 dark:text-gray-300 truncate ${compact ? 'text-xs' : 'text-xs'}`}>
                      {trickCard.playerName || 'Unknown'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
