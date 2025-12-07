/**
 * ActiveBetsSection Component
 * Displays active bets in progress
 */

import type { SideBet } from '../../types/game';
import { BetCard } from './BetCard';

interface ActiveBetsSectionProps {
  activeBets: SideBet[];
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
  onClaimWin: (betId: number) => void;
  onDispute: (betId: number) => void;
  onConfirmResolution: (betId: number, confirmed: boolean) => void;
}

export function ActiveBetsSection({
  activeBets,
  playerName,
  playerTeamId,
  isSpectator,
  onClaimWin,
  onDispute,
  onConfirmResolution,
}: ActiveBetsSectionProps) {
  if (activeBets.length === 0) return null;

  return (
    <section>
      <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
        Active Bets ({activeBets.length})
      </h3>
      <div className="space-y-2">
        {activeBets.map((bet) => (
          <BetCard
            key={bet.id}
            bet={bet}
            playerName={playerName}
            playerTeamId={playerTeamId}
            isSpectator={isSpectator}
            onClaimWin={onClaimWin}
            onDispute={onDispute}
            onConfirmResolution={onConfirmResolution}
            variant="active"
          />
        ))}
      </div>
    </section>
  );
}
