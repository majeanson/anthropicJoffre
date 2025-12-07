/**
 * HistorySection Component
 * Displays resolved, disputed, and cancelled bets
 */

import type { SideBet } from '../../types/game';
import { BetCard } from './BetCard';

interface HistorySectionProps {
  resolvedBets: SideBet[];
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
}

export function HistorySection({
  resolvedBets,
  playerName,
  playerTeamId,
  isSpectator,
}: HistorySectionProps) {
  if (resolvedBets.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-text-secondary)]">
        <span className="text-4xl mb-2 block">📜</span>
        <p className="text-sm">No bet history</p>
        <p className="text-xs mt-1">Completed bets will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {resolvedBets.map((bet) => (
        <BetCard
          key={bet.id}
          bet={bet}
          playerName={playerName}
          playerTeamId={playerTeamId}
          isSpectator={isSpectator}
          variant="history"
        />
      ))}
    </div>
  );
}
