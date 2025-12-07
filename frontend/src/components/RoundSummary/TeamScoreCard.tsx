/**
 * TeamScoreCard Component
 *
 * Displays team score for the round with bet result.
 */

import React from 'react';
import { UICard } from '../ui';

interface TeamScoreCardProps {
  teamId: 1 | 2;
  roundScore: number;
  totalScore: number;
  isOffensiveTeam: boolean;
  betMade: boolean;
}

export const TeamScoreCard: React.FC<TeamScoreCardProps> = ({
  teamId,
  roundScore,
  totalScore,
  isOffensiveTeam,
  betMade,
}) => {
  const teamColorClass = teamId === 1 ? 'text-team1' : 'text-team2';
  const gradient = teamId === 1 ? 'team1' : 'team2';
  const borderColorVar = teamId === 1 ? 'var(--color-team1-primary)' : 'var(--color-team2-primary)';

  return (
    <UICard
      variant="bordered"
      gradient={gradient}
      className={`border-4 transition-all ${
        isOffensiveTeam ? `border-[${borderColorVar}] shadow-lg` : 'border-skin-subtle'
      }`}
      style={isOffensiveTeam ? { borderColor: borderColorVar } : undefined}
    >
      <h3 className={`font-bold text-lg sm:text-xl ${teamColorClass} mb-2`}>
        Team {teamId}
      </h3>

      {/* Round Points - Main Focus */}
      <div className="mb-3">
        <div className="text-sm text-skin-secondary mb-1">This Round</div>
        <div className={`text-5xl sm:text-6xl font-black ${teamColorClass}`}>
          {roundScore >= 0 ? '+' : ''}
          {roundScore}
        </div>
      </div>

      {isOffensiveTeam && (
        <div
          className={`text-sm sm:text-base mb-2 font-semibold ${
            betMade ? 'text-skin-success' : 'text-skin-error'
          }`}
        >
          {betMade ? '✓ Made bet!' : '✗ Missed bet'}
        </div>
      )}

      {/* Total Score - Less Prominent */}
      <div className="text-base sm:text-lg text-skin-secondary mt-3 pt-3 border-t-2 border-skin-subtle">
        Total Score: <span className="font-bold">{totalScore}</span>
      </div>
    </UICard>
  );
};
