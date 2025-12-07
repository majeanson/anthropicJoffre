/**
 * TrickDisplay Component
 * Displays the current trick with cards
 */

import { Card } from '../Card';
import type { TrickDisplayProps } from './types';

export function TrickDisplay({ trick, playerNames, playerTeams, playedCards }: TrickDisplayProps) {
  return (
    <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg mb-4 md:mb-6 border border-skin-default">
      <h3 className="text-lg md:text-xl font-black text-skin-primary mb-3 md:mb-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl">🎴</span>
          <span>Current Trick</span>
        </div>
        {trick.winnerName && (
          <span className="md:ml-auto text-xs md:text-sm font-semibold text-skin-success">
            Won by {trick.winnerName} ({trick.points} pts)
          </span>
        )}
      </h3>

      {/* Cards in Trick */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {trick.trick.map((trickCard, idx) => {
          const isWinner = trickCard.playerName === trick.winnerName;
          const cardKey = `${trickCard.card.color}-${trickCard.card.value}`;
          const isPlayed = playedCards.has(cardKey);
          const playerIndex = playerNames.indexOf(trickCard.playerName);
          const teamId = playerTeams[playerIndex];

          return (
            <div
              key={idx}
              className={`relative flex flex-col items-center ${isWinner ? 'ring-4 ring-green-500 ring-offset-2 rounded-xl' : ''}`}
            >
              <div className="text-center mb-2">
                <p
                  className={`text-xs md:text-sm font-bold ${
                    teamId === 1 ? 'text-team1' : 'text-team2'
                  }`}
                >
                  {trickCard.playerName}
                </p>
              </div>
              <div className={isPlayed ? 'opacity-100' : 'opacity-30'}>
                <Card card={trickCard.card} size="small" />
              </div>
              {isWinner && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-sm md:text-lg z-10">
                  👑
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
