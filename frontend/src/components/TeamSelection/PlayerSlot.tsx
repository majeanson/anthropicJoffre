/**
 * PlayerSlot Component
 *
 * Renders a single player slot in the team selection grid.
 * Handles filled slots, empty slots, and bot slots.
 */

import { memo, forwardRef } from 'react';
import { Player } from '../../types/game';
import { PlayerConnectionIndicator } from '../PlayerConnectionIndicator';
import { sounds } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { Socket } from 'socket.io-client';

interface PlayerSlotProps {
  /** Player at this position (may be empty) */
  player: Player | undefined;
  /** Position index (0 or 1) */
  position: number;
  /** Team ID (1 or 2) */
  teamId: 1 | 2;
  /** Current player's ID */
  currentPlayerId: string;
  /** Current player object */
  currentPlayer: Player | undefined;
  /** Game creator ID */
  creatorId: string;
  /** All players in game */
  players: Player[];
  /** Game ID */
  gameId: string;
  /** Socket for fill seat action */
  socket: Socket | null | undefined;
  /** Callback when selecting a team */
  onSelectTeam: (teamId: 1 | 2) => void;
  /** Callback when swapping with a player */
  onSwapPosition: (targetPlayerId: string) => void;
  /** Callback when kicking a player (creator only) */
  onKickPlayer?: (playerId: string) => void;
}

const PlayerSlotComponent = forwardRef<HTMLButtonElement, PlayerSlotProps>(
  function PlayerSlot(
    {
      player,
      position: _position,
      teamId,
      currentPlayerId,
      currentPlayer,
      creatorId,
      players,
      gameId,
      socket,
      onSelectTeam,
      onSwapPosition,
      onKickPlayer,
    },
    ref
  ) {
    // _position is received but not used directly - kept for API compatibility
    const isCurrentPlayer = player?.id === currentPlayerId;
    const isEmptySeat = player?.isEmpty;

    return (
      <div
        className={`
          p-4 rounded-[var(--radius-md)]
          border-2 transition-all duration-[var(--duration-fast)]
          ${
            isCurrentPlayer
              ? teamId === 1
                ? 'bg-team1-20 border-team1 shadow-team1'
                : 'bg-team2-20 border-team2 shadow-team2'
              : player && !isEmptySeat
                ? 'bg-skin-secondary border-skin-default'
                : 'bg-skin-tertiary border-dashed border-skin-subtle'
          }
        `}
      >
        {player && !isEmptySeat ? (
          // Filled slot with player
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`font-display text-sm uppercase tracking-wider ${
                  isCurrentPlayer
                    ? teamId === 1
                      ? 'text-team1'
                      : 'text-team2'
                    : 'text-skin-primary'
                }`}
              >
                {player.name}
                {isCurrentPlayer && ' (You)'}
              </span>
              {player.isBot && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-skin-tertiary text-skin-muted">
                  Bot
                </span>
              )}
              {!player.isBot && (
                <PlayerConnectionIndicator
                  status={player.connectionStatus}
                  reconnectTimeLeft={player.reconnectTimeLeft}
                  small
                />
              )}
            </div>
            <div className="flex gap-2">
              {!isCurrentPlayer && currentPlayer && (
                <Button
                  ref={ref}
                  onClick={() => {
                    sounds.buttonClick();
                    onSwapPosition(player.id);
                  }}
                  variant={teamId === 1 ? 'warning' : 'secondary'}
                  size="xs"
                  title={
                    currentPlayer.teamId !== teamId
                      ? 'Swap with this player (changes teams!)'
                      : 'Swap positions'
                  }
                >
                  Swap
                </Button>
              )}
              {!isCurrentPlayer && currentPlayerId === creatorId && onKickPlayer && (
                <Button
                  onClick={() => {
                    sounds.buttonClick();
                    onKickPlayer(player.id);
                  }}
                  variant="danger"
                  size="xs"
                  title="Remove player from game"
                >
                  X
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Empty slot
          <div className="text-center">
            {isEmptySeat ? (
              <div className="space-y-2">
                <div className="text-skin-muted text-sm font-body italic">
                  {player?.emptySlotName || 'Empty Seat'}
                </div>
                {!currentPlayer && socket && (
                  <Button
                    onClick={() => {
                      const seatIndex = players.findIndex((p) => p.id === player?.id);
                      if (seatIndex !== -1) {
                        const playerName = prompt('Enter your name to fill this seat:');
                        if (playerName && playerName.trim()) {
                          socket.emit('fill_empty_seat', {
                            gameId,
                            playerName: playerName.trim(),
                            emptySlotIndex: seatIndex,
                          });
                        }
                      }
                    }}
                    variant="success"
                    size="xs"
                  >
                    Fill Seat
                  </Button>
                )}
              </div>
            ) : currentPlayer?.teamId !== teamId ? (
              <button
                ref={ref as React.Ref<HTMLButtonElement>}
                onClick={() => {
                  sounds.teamSwitch();
                  onSelectTeam(teamId);
                }}
                className={`
                  font-display text-sm uppercase tracking-wider
                  transition-all duration-[var(--duration-fast)]
                  hover:scale-105
                  ${teamId === 1 ? 'text-team1 text-shadow-team1' : 'text-team2 text-shadow-team2'}
                `}
              >
                Join Team {teamId}
              </button>
            ) : (
              <span className="text-skin-muted font-body">Empty Seat</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

export const PlayerSlot = memo(PlayerSlotComponent);
