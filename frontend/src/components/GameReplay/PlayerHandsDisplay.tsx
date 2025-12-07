/**
 * PlayerHandsDisplay Component
 * Displays starting hands for all players
 */

import { Card } from '../Card';
import type { Card as CardType } from '../../types/game';
import type { PlayerHandsDisplayProps } from './types';

export function PlayerHandsDisplay({
  startingHands,
  playerNames,
  playerTeams,
  playedCards,
}: PlayerHandsDisplayProps) {
  if (Object.keys(startingHands).length === 0) return null;

  return (
    <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg border border-skin-default">
      <h3 className="text-lg md:text-xl font-black text-skin-primary mb-4 flex items-center gap-2">
        <span className="text-xl md:text-2xl">🃏</span>
        Player Hands (Round Start)
      </h3>
      <div className="space-y-4">
        {Object.entries(startingHands).map(([playerName, cards]) => {
          const playerIndex = playerNames.indexOf(playerName);
          const teamId = playerTeams[playerIndex];

          return (
            <div key={playerName} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <span
                className={`font-bold text-sm md:w-24 flex-shrink-0 ${
                  teamId === 1 ? 'text-team1' : 'text-team2'
                }`}
              >
                {playerName}:
              </span>
              <div className="flex gap-1.5 md:gap-2 flex-wrap overflow-x-auto">
                {cards.map((card: CardType, idx: number) => {
                  const cardKey = `${card.color}-${card.value}`;
                  const isPlayed = playedCards.has(cardKey);

                  return (
                    <div key={idx} className={isPlayed ? 'opacity-30' : 'opacity-100'}>
                      <Card card={card} size="tiny" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
