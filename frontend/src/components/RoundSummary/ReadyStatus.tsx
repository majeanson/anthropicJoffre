/**
 * ReadyStatus Component
 *
 * Displays player ready status for next round.
 */

import React from 'react';
import { Player } from '../../types/game';
import { UICard, Button } from '../ui';

interface ReadyStatusProps {
  players: Player[];
  playersReady: string[];
  onReady: () => void;
}

export const ReadyStatus: React.FC<ReadyStatusProps> = ({
  players,
  playersReady,
  onReady,
}) => {
  return (
    <>
      {/* Player Ready Status */}
      <div className="space-y-3 animate-fadeInUp delay-[550ms]">
        <h3 className="font-bold text-lg sm:text-xl text-skin-primary text-center">
          👥 Ready Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-3xl mx-auto">
          {players.map((player) => {
            const isReady = playersReady.includes(player.name);
            return (
              <UICard
                key={player.id}
                variant="bordered"
                size="sm"
                className={`transition-all ${
                  isReady
                    ? 'bg-skin-success border-skin-success'
                    : 'bg-skin-secondary border-skin-default'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{isReady ? '✓' : '⏳'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-skin-primary truncate">
                      {player.name}
                    </div>
                    <div
                      className={`text-xs ${isReady ? 'text-skin-success' : 'text-skin-muted'}`}
                    >
                      {isReady ? 'Ready' : 'Waiting...'}
                    </div>
                  </div>
                </div>
              </UICard>
            );
          })}
        </div>
      </div>

      {/* Ready Button */}
      <div className="flex justify-center pt-4 animate-fadeInUp delay-[600ms]">
        <Button
          onClick={onReady}
          variant="primary"
          size="lg"
          className="px-8 py-4 text-lg transform hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          Ready for Next Round
        </Button>
      </div>
    </>
  );
};
