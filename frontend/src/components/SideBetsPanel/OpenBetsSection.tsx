/**
 * OpenBetsSection Component
 * Displays open bets from others and user's own open bets
 */

import type { SideBet } from '../../types/game';
import { BetCard } from './BetCard';

interface OpenBetsSectionProps {
  openBets: SideBet[];
  myOpenBets: SideBet[];
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
  balance: number;
  onAccept: (betId: number) => void;
  onCancel: (betId: number) => void;
}

export function OpenBetsSection({
  openBets,
  myOpenBets,
  playerName,
  playerTeamId,
  isSpectator,
  balance,
  onAccept,
  onCancel,
}: OpenBetsSectionProps) {
  return (
    <>
      {/* Open bets to accept */}
      {openBets.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Open Bets ({openBets.length})
          </h3>
          <div className="space-y-2">
            {openBets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                playerName={playerName}
                playerTeamId={playerTeamId}
                isSpectator={isSpectator}
                balance={balance}
                onAccept={onAccept}
                variant="open"
              />
            ))}
          </div>
        </section>
      )}

      {/* My open bets */}
      {myOpenBets.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Your Open Bets ({myOpenBets.length})
          </h3>
          <div className="space-y-2">
            {myOpenBets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                playerName={playerName}
                playerTeamId={playerTeamId}
                isSpectator={isSpectator}
                onCancel={onCancel}
                variant="myOpen"
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
