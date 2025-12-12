/**
 * WhoIsHere - Online players in the lounge
 *
 * Shows who's currently in the lounge with their status.
 * Allows quick social actions: wave, invite, message, view profile.
 */

import { LoungePlayer, PlayerStatus } from '../../types/game';

interface WhoIsHereProps {
  players: LoungePlayer[];
  playerName: string;
  onWave: (targetName: string) => void;
  onViewProfile: (playerName: string) => void;
  onMessage: (playerName: string) => void;
  onAddFriend?: (targetName: string) => void;
  onInviteToTable?: (targetName: string) => void;
  /** Whether current user is authenticated (enables friend requests) */
  isAuthenticated?: boolean;
  /** Whether current user is at a table (enables invite action) */
  isAtTable?: boolean;
}

const statusConfig: Record<PlayerStatus, { icon: string; label: string; color: string }> = {
  in_lounge: { icon: '🟢', label: 'In Lounge', color: 'text-green-500' },
  at_table: { icon: '🎴', label: 'At Table', color: 'text-blue-500' },
  playing: { icon: '🃏', label: 'Playing', color: 'text-purple-500' },
  spectating: { icon: '👁️', label: 'Spectating', color: 'text-yellow-500' },
  away: { icon: '🔇', label: 'Away', color: 'text-gray-500' },
  looking_for_game: { icon: '🔍', label: 'Looking for Game', color: 'text-orange-500' },
};

export function WhoIsHere({
  players,
  playerName,
  onWave,
  onViewProfile,
  onMessage,
  onAddFriend,
  onInviteToTable,
  isAuthenticated = false,
  isAtTable = false,
}: WhoIsHereProps) {
  // Sort: LFG first, then by status, then alphabetically
  const sortedPlayers = [...players].sort((a, b) => {
    // Self first
    if (a.playerName === playerName) return -1;
    if (b.playerName === playerName) return 1;
    // LFG priority
    if (a.status === 'looking_for_game' && b.status !== 'looking_for_game') return -1;
    if (b.status === 'looking_for_game' && a.status !== 'looking_for_game') return 1;
    // Then alphabetically
    return a.playerName.localeCompare(b.playerName);
  });

  const lfgCount = players.filter(p => p.status === 'looking_for_game').length;

  return (
    <div className="bg-skin-secondary rounded-xl border-2 border-skin-default p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">👥</span>
          <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
            Who's Here
          </h3>
        </div>
        <div className="text-xs text-skin-muted">
          {players.length} online
          {lfgCount > 0 && (
            <span className="ml-2 text-orange-500">({lfgCount} LFG)</span>
          )}
        </div>
      </div>

      {/* Player List */}
      {players.length === 0 ? (
        <div className="text-center py-6 text-skin-muted text-sm">
          <div className="text-2xl mb-2">🦗</div>
          <p>No one else here yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {sortedPlayers.map((player) => {
            const isSelf = player.playerName === playerName;
            const status = statusConfig[player.status] || statusConfig.in_lounge;

            return (
              <div
                key={player.socketId}
                className={`
                  flex items-center gap-2 p-2 rounded-lg transition-colors
                  ${isSelf ? 'bg-skin-accent/20 border border-skin-accent' : 'bg-skin-tertiary hover:bg-skin-primary/50'}
                  ${player.status === 'looking_for_game' ? 'ring-2 ring-orange-500/50' : ''}
                `}
              >
                {/* Status icon */}
                <span className="text-base" title={status.label}>
                  {status.icon}
                </span>

                {/* Name and status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium truncate ${isSelf ? 'text-skin-accent' : 'text-skin-primary'}`}>
                      {player.playerName}
                      {isSelf && ' (you)'}
                    </span>
                    {player.isFriend && (
                      <span className="text-xs" title="Friend">⭐</span>
                    )}
                  </div>
                  <span className={`text-xs ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                {/* Actions (not for self) */}
                {!isSelf && (
                  <div className="flex gap-0.5 sm:gap-1">
                    <button
                      onClick={() => onWave(player.playerName)}
                      className="p-2 sm:p-1.5 rounded hover:bg-skin-primary active:bg-skin-accent/20 transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      title="Wave"
                      aria-label={`Wave to ${player.playerName}`}
                    >
                      <span className="text-base sm:text-sm">👋</span>
                    </button>
                    <button
                      onClick={() => onMessage(player.playerName)}
                      className="p-2 sm:p-1.5 rounded hover:bg-skin-primary active:bg-skin-accent/20 transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      title="Message"
                      aria-label={`Message ${player.playerName}`}
                    >
                      <span className="text-base sm:text-sm">💬</span>
                    </button>
                    {/* Add Friend button - only for non-friends when authenticated */}
                    {isAuthenticated && !player.isFriend && onAddFriend && (
                      <button
                        onClick={() => onAddFriend(player.playerName)}
                        className="p-2 sm:p-1.5 rounded hover:bg-green-500/20 active:bg-green-500/30 transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                        title="Add Friend"
                        aria-label={`Add ${player.playerName} as friend`}
                      >
                        <span className="text-base sm:text-sm">➕</span>
                      </button>
                    )}
                    {/* Invite to Table button - only when at a table */}
                    {isAtTable && onInviteToTable && (
                      <button
                        onClick={() => onInviteToTable(player.playerName)}
                        className="p-2 sm:p-1.5 rounded hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                        title="Invite to Table"
                        aria-label={`Invite ${player.playerName} to table`}
                      >
                        <span className="text-base sm:text-sm">🎴</span>
                      </button>
                    )}
                    <button
                      onClick={() => onViewProfile(player.playerName)}
                      className="p-2 sm:p-1.5 rounded hover:bg-skin-primary active:bg-skin-accent/20 transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      title="View Profile"
                      aria-label={`View ${player.playerName}'s profile`}
                    >
                      <span className="text-base sm:text-sm">👤</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WhoIsHere;
