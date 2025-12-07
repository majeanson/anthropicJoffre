/**
 * PlayerPerformanceTable Component
 *
 * Displays detailed player statistics for the round.
 */

import React from 'react';
import { Player, RoundHistory } from '../../types/game';
import { UICard } from '../ui';

interface PlayerPerformanceTableProps {
  players: Player[];
  lastRound: RoundHistory;
}

export const PlayerPerformanceTable: React.FC<PlayerPerformanceTableProps> = ({
  players,
  lastRound,
}) => {
  return (
    <div className="space-y-3 animate-fadeInUp delay-[400ms]">
      <h3 className="font-bold text-lg sm:text-xl text-skin-primary">
        📊 Player Performance
      </h3>
      <UICard
        variant="bordered"
        className="bg-skin-secondary overflow-hidden border-2 border-skin-accent"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-[500px]">
            <thead className="bg-skin-tertiary">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-skin-accent uppercase tracking-wider">
                  Player
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-skin-accent uppercase tracking-wider">
                  Tricks
                </th>
                <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-skin-accent uppercase tracking-wider">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-skin-default">
              {players.map((player) => {
                const redZeros =
                  lastRound.playerStats?.find((ps) => ps.playerName === player.name)
                    ?.redZerosCollected || 0;
                const brownZeros =
                  lastRound.playerStats?.find((ps) => ps.playerName === player.name)
                    ?.brownZerosReceived || 0;

                return (
                  <tr
                    key={player.id}
                    className="hover:bg-skin-tertiary transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3 text-sm font-semibold text-skin-primary">
                      <div className="flex items-center gap-2">
                        <span>{player.name}</span>
                        {redZeros > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-xs"
                            title={`${redZeros} Red 0 card${redZeros > 1 ? 's' : ''} collected`}
                          >
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            <span className="font-bold text-skin-success">×{redZeros}</span>
                          </span>
                        )}
                        {brownZeros > 0 && (
                          <span
                            className="inline-flex items-center gap-1 text-xs"
                            title={`${brownZeros} Brown 0 card${brownZeros > 1 ? 's' : ''} received`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-800"></span>
                            <span className="font-bold text-skin-error">×{brownZeros}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-center font-medium text-skin-primary">
                      {player.tricksWon}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-center font-bold text-skin-primary">
                      {player.pointsWon}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </UICard>
    </div>
  );
};
