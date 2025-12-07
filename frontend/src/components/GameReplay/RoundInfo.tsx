/**
 * RoundInfo Component
 * Displays current round and trick information
 */

import type { RoundInfoProps } from './types';

export function RoundInfo({
  currentRound,
  currentRoundIndex,
  totalRounds,
  currentTrickIndex,
  totalTricks,
}: RoundInfoProps) {
  const currentBet = currentRound?.highestBet;

  return (
    <div className="bg-skin-secondary px-4 md:px-8 py-3 md:py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
          <div>
            <p className="text-xs text-skin-muted font-semibold">Round</p>
            <p className="text-xl md:text-2xl font-black text-skin-accent">
              {currentRoundIndex + 1} / {totalRounds}
            </p>
          </div>

          {currentBet && (
            <>
              <div className="hidden md:block w-px h-8 bg-skin-tertiary" />
              <div>
                <p className="text-xs text-skin-muted font-semibold">Bet</p>
                <p className="text-sm md:text-lg font-bold text-skin-secondary">
                  {currentBet.amount} {currentBet.withoutTrump && '(NT)'}
                </p>
              </div>
            </>
          )}

          <div className="hidden md:block w-px h-8 bg-skin-tertiary" />
          <div>
            <p className="text-xs text-skin-muted font-semibold">Trick</p>
            <p className="text-xl md:text-2xl font-black text-team2">
              {currentTrickIndex + 1} / {totalTricks}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm md:text-base">
          <span className="text-xs text-skin-muted">Score:</span>
          <span className="font-bold text-team1">T1: {currentRound.roundScore?.team1 || 0}</span>
          <span className="text-skin-muted">/</span>
          <span className="font-bold text-team2">T2: {currentRound.roundScore?.team2 || 0}</span>
        </div>
      </div>
    </div>
  );
}
