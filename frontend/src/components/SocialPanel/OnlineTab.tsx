/**
 * OnlineTab Component
 *
 * Shows online players with LFG toggle and join functionality.
 * Part of SocialPanel.
 */

import { Button } from '../ui/Button';
import { PlayerNameButton } from '../PlayerNameButton';
import { sounds } from '../../utils/sounds';
import { OnlinePlayer } from '../../types/game';
import { FriendWithStatus } from '../../types/friends';
import { User } from '../../types/auth';

interface OnlineTabProps {
  onlinePlayers: OnlinePlayer[];
  friends: FriendWithStatus[];
  playerName: string;
  user: User | null;
  isLookingForGame: boolean;
  onToggleLfg: () => void;
  onSendFriendRequest: (friendName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onViewProfile: (playerName: string) => void;
  setPlayerName: (name: string) => void;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'in_lobby':
      return 'In Lobby';
    case 'in_game':
      return 'Playing';
    case 'in_team_selection':
      return 'Setting up';
    default:
      return status;
  }
}

export function OnlineTab({
  onlinePlayers,
  friends,
  playerName,
  user,
  isLookingForGame,
  onToggleLfg,
  onSendFriendRequest,
  onJoinGame,
  onViewProfile,
  setPlayerName,
}: OnlineTabProps) {
  return (
    <div className="space-y-2">
      {/* LFG Toggle */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 border-2 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">Looking for Game</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Let others know you're looking for teammates
            </p>
          </div>
          <Button
            onClick={onToggleLfg}
            variant={isLookingForGame ? 'success' : 'secondary'}
            size="sm"
          >
            {isLookingForGame ? '🔍 ON' : '🔍 OFF'}
          </Button>
        </div>
      </div>

      {onlinePlayers.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-16">
          <p className="text-2xl mb-2">😴</p>
          <p className="text-lg font-semibold">No players online</p>
          <p className="text-sm mt-2">Online players will appear here</p>
        </div>
      ) : (
        onlinePlayers.map((player) => {
          const isBot = player.playerName?.startsWith('Bot ');
          const isSelf = player.playerName === playerName;
          const isFriend = friends.some((f) => f.player_name === player.playerName);
          const showFriendButton = user && !isBot && !isSelf && !isFriend;
          const isLfg = player.lookingForGame === true;

          return (
            <div
              key={player.socketId}
              className={`rounded-lg p-3 border-2 transition-colors ${
                isLfg
                  ? 'border-team2 bg-team2/10'
                  : 'bg-skin-tertiary border-skin-default hover:border-skin-success'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-green-500 text-lg flex-shrink-0">🟢</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <PlayerNameButton
                        playerName={player.playerName || player.socketId || 'Unknown'}
                        onClick={() => onViewProfile(player.playerName || 'Unknown')}
                        variant="plain"
                        className="font-bold truncate text-left"
                      />
                      {isLfg && (
                        <span
                          className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse flex-shrink-0"
                          title="Looking for Game"
                        >
                          🔍 LFG
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {getStatusLabel(player.status)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {showFriendButton && (
                    <Button
                      onClick={() => {
                        sounds.buttonClick();
                        onSendFriendRequest(player.playerName!);
                      }}
                      variant="primary"
                      size="sm"
                      title="Send friend request"
                    >
                      ➕
                    </Button>
                  )}
                  {player.gameId && player.status !== 'in_lobby' && (
                    <Button
                      data-keyboard-nav={`join-player-${player.socketId}`}
                      onClick={() => {
                        sounds.buttonClick();
                        const nameToUse =
                          playerName.trim() || window.prompt('Enter your name to join:');
                        if (nameToUse && nameToUse.trim()) {
                          if (!playerName.trim()) {
                            setPlayerName(nameToUse.trim());
                          }
                          onJoinGame(player.gameId!, nameToUse.trim());
                        }
                      }}
                      variant="success"
                      size="sm"
                      title="Join their game"
                    >
                      🎮 Join
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
