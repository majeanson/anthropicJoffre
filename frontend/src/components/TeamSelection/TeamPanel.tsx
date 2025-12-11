/**
 * TeamPanel Component
 *
 * Renders a team panel with its title and player slots.
 */

import { memo, RefObject } from 'react';
import { Player } from '../../types/game';
import { PlayerSlot } from './PlayerSlot';
import { Socket } from 'socket.io-client';

interface TeamPanelProps {
  /** Team ID (1 or 2) */
  teamId: 1 | 2;
  /** Players on this team */
  teamPlayers: Player[];
  /** Current player's ID */
  currentPlayerId: string;
  /** Current player object */
  currentPlayer: Player | undefined;
  /** Game creator ID */
  creatorId: string;
  /** All players in game */
  allPlayers: Player[];
  /** Game ID */
  gameId: string;
  /** Socket for fill seat action */
  socket: Socket | null | undefined;
  /** Refs for swap buttons (for keyboard navigation) */
  swapRefs: RefObject<(HTMLButtonElement | null)[]>;
  /** Callback when selecting a team */
  onSelectTeam: (teamId: 1 | 2) => void;
  /** Callback when swapping with a player */
  onSwapPosition: (targetPlayerId: string) => void;
  /** Callback when kicking a player (creator only) */
  onKickPlayer?: (playerId: string) => void;
}

function TeamPanelComponent({
  teamId,
  teamPlayers,
  currentPlayerId,
  currentPlayer,
  creatorId,
  allPlayers,
  gameId,
  socket,
  swapRefs,
  onSelectTeam,
  onSwapPosition,
  onKickPlayer,
}: TeamPanelProps) {
  return (
    <div
      className={`
        p-4 sm:p-6
        rounded-[var(--radius-lg)]
        border-2 ${teamId === 1 ? 'border-team1 bg-team1-10' : 'border-team2 bg-team2-10'}
      `}
      data-testid={`team-${teamId}-container`}
    >
      <h3
        className={`
          text-xl font-display uppercase tracking-wider mb-4 text-center
          ${teamId === 1 ? 'text-team1 text-shadow-team1' : 'text-team2 text-shadow-team2'}
        `}
      >
        Team {teamId}
      </h3>
      <div className="space-y-3">
        {[0, 1].map((position) => (
          <PlayerSlot
            key={`team${teamId}-${position}`}
            ref={(el) => {
              if (swapRefs.current) {
                swapRefs.current[position] = el;
              }
            }}
            player={teamPlayers[position]}
            position={position}
            teamId={teamId}
            currentPlayerId={currentPlayerId}
            currentPlayer={currentPlayer}
            creatorId={creatorId}
            players={allPlayers}
            gameId={gameId}
            socket={socket}
            onSelectTeam={onSelectTeam}
            onSwapPosition={onSwapPosition}
            onKickPlayer={onKickPlayer}
          />
        ))}
      </div>
    </div>
  );
}

export const TeamPanel = memo(TeamPanelComponent);
