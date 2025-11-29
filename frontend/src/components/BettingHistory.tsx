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

export function BettingHistory({ players, currentBets, dealerIndex, onClickPlayer }: BettingHistoryProps) {
  // Determine betting order (player after dealer goes first)
  const bettingOrder = [...Array(4)].map((_, i) => (dealerIndex + 1 + i) % 4);

  // Map bets by player index
  const betsByPlayerIndex = new Map<number, Bet>();
  currentBets.forEach(bet => {
    const playerIndex = players.findIndex(p => p.name === bet.playerName);
    if (playerIndex !== -1) {
      betsByPlayerIndex.set(playerIndex, bet);
    }
  });

  // Find highest bet
  const validBets = currentBets.filter(b => !b.skipped);
  const highestBet = validBets.length > 0
    ? validBets.reduce((highest, current) => {
        if (current.amount > highest.amount) return current;
        if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) return current;
        return highest;
      })
    : null;

  return (
    <UICard variant="bordered" size="md" className="bg-gradient-to-br from-parchment-100 to-parchment-200 dark:from-gray-800 dark:to-gray-900 shadow-md">
      <div className="text-umber-800 dark:text-gray-300 font-bold text-sm mb-3 flex items-center gap-2">
        <span className="text-lg">📜</span>
        <span>Betting History</span>
      </div>

      <div className="space-y-2">
        {bettingOrder.map((playerIndex, orderIndex) => {
          const player = players[playerIndex];
          const bet = betsByPlayerIndex.get(playerIndex);
          const isDealer = playerIndex === dealerIndex;
          const isHighestBet = bet && highestBet && bet.playerName === highestBet.playerName && !bet.skipped;

          if (!player) return null;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-all border-l-4 ${
                // Team color border (ALWAYS visible)
                player.teamId === 1
                  ? 'border-l-orange-600 dark:border-l-orange-500'
                  : 'border-l-purple-600 dark:border-l-purple-500'
              } ${
                // Background color based on bet status
                bet
                  ? bet.skipped
                    ? 'bg-gray-300 dark:bg-gray-700 opacity-60'
                    : isHighestBet
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 dark:from-yellow-600 dark:to-amber-700 text-white shadow-lg ring-2 ring-yellow-300 dark:ring-yellow-500'
                    : player.teamId === 1
                    ? 'bg-orange-400 dark:bg-orange-600 text-white'
                    : 'bg-purple-400 dark:bg-purple-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 border border-dashed border-gray-400 dark:border-gray-500'
              }`}
            >
              {/* Left side: Order number + Player name + Team badge */}
              <div className="flex items-center gap-2">
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  bet && !bet.skipped
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-400 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
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
                      <span className="font-bold text-sm">
                        {player.name}
                      </span>
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
                        <UIBadge
                          variant="subtle"
                          color="gray"
                          size="xs"
                        >
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
                      <span className="text-xl font-black">
                        {bet.amount}
                      </span>
                      {bet.withoutTrump && (
                        <span title="Without Trump (2x points)">
                          <UIBadge
                            variant="subtle"
                            color="gray"
                            size="xs"
                          >
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
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Waiting...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-umber-300 dark:border-gray-600">
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-gradient-to-r from-yellow-400 to-amber-500 inline-block"></span>
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
