/**
 * BettingHistory Component
 * IMPROVEMENT #12: Betting history visualization
 *
 * Shows the betting timeline for the current round with visual indicators
 * Displays: Player name, bet amount, without trump indicator, skip indicator
 */

import { Bet, Player } from '../types/game';
import { UICard, UIBadge, Button } from './ui';

interface BettingHistoryProps {
  players: Player[];
  currentBets: Bet[];
  dealerIndex: number;
  onClickPlayer?: (playerName: string) => void;
}

export function BettingHistory({
  players,
  currentBets,
  dealerIndex,
  onClickPlayer,
}: BettingHistoryProps) {
  // Determine betting order (player after dealer goes first)
  const bettingOrder = [...Array(4)].map((_, i) => (dealerIndex + 1 + i) % 4);

  // Map bets by player index
  const betsByPlayerIndex = new Map<number, Bet>();
  currentBets.forEach((bet) => {
    const playerIndex = players.findIndex((p) => p.name === bet.playerName);
    if (playerIndex !== -1) {
      betsByPlayerIndex.set(playerIndex, bet);
    }
  });

  // Find highest bet
  const validBets = currentBets.filter((b) => !b.skipped);
  const highestBet =
    validBets.length > 0
      ? validBets.reduce((highest, current) => {
          if (current.amount > highest.amount) return current;
          if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump)
            return current;
          return highest;
        })
      : null;

  // Helper to get background class based on bet status
  const getBetBackgroundClass = (
    bet: Bet | undefined,
    isHighestBet: boolean,
    teamId: 1 | 2
  ): string => {
    if (!bet) {
      return 'bg-skin-tertiary border-dashed-default';
    }
    if (bet.skipped) {
      return 'bg-skin-tertiary opacity-60';
    }
    if (isHighestBet) {
      return 'bg-gradient-highest-bet text-white';
    }
    return teamId === 1 ? 'bg-team1 text-skin-team1-text' : 'bg-team2 text-skin-team2-text';
  };

  return (
    <UICard variant="bordered" size="md" className="shadow-md bg-gradient-betting-card">
      <div className="font-bold text-sm mb-3 flex items-center gap-2 text-skin-primary">
        <span className="text-lg">📜</span>
        <span>Betting History</span>
      </div>

      <div className="space-y-2">
        {bettingOrder.map((playerIndex, orderIndex) => {
          const player = players[playerIndex];
          const bet = betsByPlayerIndex.get(playerIndex);
          const isDealer = playerIndex === dealerIndex;
          const isHighestBet = !!(
            bet &&
            highestBet &&
            bet.playerName === highestBet.playerName &&
            !bet.skipped
          );

          if (!player) return null;

          return (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-2 rounded-lg transition-all border-l-4
                ${player.teamId === 1 ? 'border-l-team1' : 'border-l-team2'}
                ${getBetBackgroundClass(bet, isHighestBet, player.teamId)}
              `}
            >
              {/* Left side: Order number + Player name + Team badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`
                    flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                    ${bet && !bet.skipped ? 'bg-white/20' : 'bg-skin-tertiary text-skin-secondary'}
                  `}
                >
                  {orderIndex + 1}
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    {/* Player name - clickable if not a bot and onClickPlayer is provided */}
                    {!player.isBot && onClickPlayer ? (
                      <Button
                        onClick={() => onClickPlayer(player.name)}
                        variant="link"
                        size="sm"
                        className="font-bold text-sm !p-0 !px-1 !-mx-1"
                        title={`View ${player.name}'s profile`}
                      >
                        {player.name}
                      </Button>
                    ) : (
                      <span className="font-bold text-sm">{player.name}</span>
                    )}
                    {/* Team color badge - ALWAYS visible */}
                    <span title={`Team ${player.teamId}`}>
                      <UIBadge
                        variant="solid"
                        color={player.teamId === 1 ? 'team1' : 'team2'}
                        size="xs"
                      >
                        T{player.teamId}
                      </UIBadge>
                    </span>
                    {isDealer && (
                      <span title="Dealer">
                        <UIBadge variant="subtle" color="gray" size="xs">
                          🎴
                        </UIBadge>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Bet info */}
              <div className="flex items-center gap-2">
                {bet ? (
                  bet.skipped ? (
                    <UIBadge variant="outline" color="gray" size="sm">
                      SKIP
                    </UIBadge>
                  ) : (
                    <>
                      <span className="text-xl font-black">{bet.amount}</span>
                      {bet.withoutTrump && (
                        <span title="Without Trump (2x points)">
                          <UIBadge variant="subtle" color="gray" size="xs">
                            ×2
                          </UIBadge>
                        </span>
                      )}
                      {isHighestBet && (
                        <span className="text-sm" title="Highest Bet">
                          👑
                        </span>
                      )}
                    </>
                  )
                ) : (
                  <span className="text-xs italic text-skin-muted">Waiting...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t-skin-default">
        <div className="text-xs space-y-1 text-skin-muted">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded inline-block bg-gradient-highest-bet"></span>
            <span>Highest Bet</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">×2</span>
            <span>Without Trump (double points)</span>
          </div>
        </div>
      </div>
    </UICard>
  );
}
