/**
 * HighlightCard Component
 *
 * Displays a single round highlight stat.
 */

import React from 'react';
import { UICard } from '../ui';
import { StatValue } from './types';
import {
  hasContribution,
  hasRedZeros,
  hasPointsEarned,
  hasTricksWon,
  hasSevensCount,
  hasCount,
  hasTrumpCount,
  hasTrumpsPlayed,
  hasAvgValue,
  hasSuit,
  hasBetAmount,
} from './typeGuards';

interface HighlightCardProps {
  title: string;
  icon: string;
  stat: StatValue;
  index: number;
}

export const HighlightCard: React.FC<HighlightCardProps> = ({
  title,
  icon,
  stat,
  index,
}) => {
  if (!stat) return null;

  // Build description based on stat type
  let description = '';
  if (hasTricksWon(stat)) description = `${stat.tricksWon} tricks`;
  else if (hasPointsEarned(stat)) description = `${stat.pointsEarned} points`;
  else if (hasBetAmount(stat)) description = `Exact ${stat.betAmount}`;
  else if (hasContribution(stat)) description = `${stat.contribution}% of team`;
  else if (hasTrumpsPlayed(stat)) description = `${stat.trumpsPlayed} trumps`;
  else if (hasRedZeros(stat))
    description = `${stat.redZeros} red 0${stat.redZeros > 1 ? 's' : ''}`;
  else if (hasSuit(stat) && hasCount(stat)) description = `${stat.count} ${stat.suit}`;
  else if (hasSevensCount(stat)) description = `${stat.sevensCount}× 7s`;
  else if (hasAvgValue(stat)) description = `Avg: ${stat.avgValue}`;
  else if (hasTrumpCount(stat)) description = `${stat.trumpCount} trumps`;
  else if (title === 'Monochrome') description = 'No red cards';
  else if (title === 'Rainbow') description = 'All 4 suits';

  return (
    <div style={{ animationDelay: `${index * 150}ms` }} className="animate-fadeInUp">
      <UICard
        variant="bordered"
        className="flex items-center gap-3 bg-skin-tertiary border-2 border-skin-accent transform hover:scale-105 transition-transform"
      >
        <span className="text-3xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-skin-accent uppercase tracking-wide">
            {title}
          </div>
          <div className="font-bold text-base text-skin-primary truncate">
            {stat.playerName}
          </div>
          <div className="text-sm text-skin-secondary">{description}</div>
        </div>
      </UICard>
    </div>
  );
};
