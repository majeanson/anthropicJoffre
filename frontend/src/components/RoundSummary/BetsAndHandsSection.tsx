/**
 * BetsAndHandsSection Component
 *
 * Displays player bets and starting hands for the round.
 */

import React from 'react';
import { Player, Card } from '../../types/game';
import { Card as CardComponent } from '../Card';
import { UICard } from '../ui';
import { RoundStatistics } from './types';

interface BetsAndHandsSectionProps {
  players: Player[];
  statistics?: RoundStatistics;
}

export const BetsAndHandsSection: React.FC<BetsAndHandsSectionProps> = ({
  players,
  statistics,
}) => {
  const renderCard = (card: Card) => {
    return <CardComponent key={`${card.color}-${card.value}`} card={card} size="tiny" />;
  };

  const renderBet = (playerName: string) => {
    if (!statistics?.playerBets)
      return <span className="text-skin-muted">--</span>;

    const bet = statistics.playerBets[playerName];
    if (bet === null) {
      return <span className="text-skin-muted italic">Skipped</span>;
    }
    if (bet) {
      return (
        <span className="font-semibold text-skin-primary">
          Bet {bet.amount}
          {bet.withoutTrump && (
            <span className="ml-1 text-team2">⚡</span>
          )}
        </span>
      );
    }
    return <span className="text-skin-muted">--</span>;
  };

  const renderHand = (playerName: string) => {
    if (!statistics?.initialHands)
      return <span className="text-skin-muted">No hand data</span>;

    const hand = statistics.initialHands[playerName];
    if (!hand) return <span className="text-skin-muted">No hand data</span>;

    // Sort hand by suit then value
    const sortedHand = [...hand].sort((a, b) => {
      if (a.color !== b.color) {
        const suitOrder = ['red', 'blue', 'green', 'brown'];
        return suitOrder.indexOf(a.color) - suitOrder.indexOf(b.color);
      }
      return a.value - b.value;
    });

    return (
      <div className="flex flex-wrap gap-1">
        {sortedHand.map((card, idx) => (
          <div key={idx}>{renderCard(card)}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3 animate-fadeInUp delay-500">
      <h3 className="font-bold text-lg sm:text-xl text-skin-primary">
        🃏 Bets & Starting Hands
      </h3>
      <div className="space-y-3">
        {players.map((player) => (
          <UICard
            key={player.id}
            variant="bordered"
            className="bg-skin-tertiary border-skin-accent hover:shadow-md transition-shadow"
          >
            {/* Player Name and Team */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-base text-skin-primary">
                {player.name}
              </span>
              <span
                className={`px-2 py-1 rounded-md text-xs font-bold ${
                  player.teamId === 1 ? 'bg-team1' : 'bg-team2'
                }`}
              >
                Team {player.teamId}
              </span>
            </div>

            {/* Bet */}
            <div className="mb-3 text-sm">
              <span className="text-skin-secondary font-medium">Bet: </span>
              {renderBet(player.name)}
            </div>

            {/* Starting Hand */}
            <div className="text-sm">
              <span className="text-skin-secondary font-medium mb-1 block">
                Starting Hand:
              </span>
              {renderHand(player.name)}
            </div>
          </UICard>
        ))}
      </div>
    </div>
  );
};
