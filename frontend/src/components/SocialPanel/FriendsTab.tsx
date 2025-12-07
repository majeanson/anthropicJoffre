/**
 * FriendsTab Component
 *
 * Shows friend search, pending requests, friends list, and suggestions.
 * Part of SocialPanel.
 */

import { Button } from '../ui/Button';
import { PlayerNameButton } from '../PlayerNameButton';
import { sounds } from '../../utils/sounds';
import { OnlinePlayer } from '../../types/game';
import { FriendWithStatus, FriendRequest } from '../../types/friends';
import { User } from '../../types/auth';

interface FriendsTabProps {
  user: User | null;
  friends: FriendWithStatus[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendSuggestions: string[];
  onlinePlayers: OnlinePlayer[];
  playerName: string;
  isLoading: boolean;
  error: string | null;
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Array<{ player_name: string; games_played: number; games_won: number }>;
  isSearching: boolean;
  onSearch: () => void;
  // Actions
  onSendFriendRequest: (name: string) => void;
  onAcceptRequest: (requestId: number) => void;
  onRejectRequest: (requestId: number) => void;
  onRemoveFriend: (name: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onViewProfile: (name: string) => void;
  onRetry: () => void;
  setPlayerName: (name: string) => void;
  setSearchResults: (results: Array<{ player_name: string; games_played: number; games_won: number }>) => void;
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

export function FriendsTab({
  user,
  friends,
  pendingRequests,
  sentRequests,
  friendSuggestions,
  onlinePlayers,
  playerName,
  isLoading,
  error,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  onSearch,
  onSendFriendRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onJoinGame,
  onViewProfile,
  onRetry,
  setPlayerName,
  setSearchResults,
}: FriendsTabProps) {
  if (!user) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-16">
        <p className="text-2xl mb-2">🔒</p>
        <p className="text-lg font-semibold">Login Required</p>
        <p className="text-sm mt-2">Please log in to view your friends</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-16">
        <p className="text-2xl mb-2">⏳</p>
        <p className="text-lg font-semibold">Loading friends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="text-lg font-semibold text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Find Friends Search */}
      <div className="mb-4">
        <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">
          🔍 Find Friends
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Search by name..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border-2 border-skin-default bg-skin-primary text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <Button
            onClick={onSearch}
            disabled={searchQuery.trim().length < 2 || isSearching}
            variant="primary"
            size="sm"
          >
            {isSearching ? '...' : '🔍'}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.slice(0, 5).map((player) => {
              const isAlreadyFriend = friends.some((f) => f.player_name === player.player_name);
              const isPending = sentRequests.some((r) => r.to_player === player.player_name);
              const isSelf = player.player_name === user?.username;

              if (isSelf) return null;

              return (
                <div
                  key={player.player_name}
                  className="bg-team2/20 rounded-lg p-2 border border-team2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <PlayerNameButton
                        playerName={player.player_name}
                        onClick={() => onViewProfile(player.player_name)}
                        variant="plain"
                        className="font-semibold text-sm truncate text-left"
                      />
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {player.games_played} games • {player.games_won} wins
                      </p>
                    </div>
                    {isAlreadyFriend ? (
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-bold">
                        Friends
                      </span>
                    ) : isPending ? (
                      <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded font-bold">
                        Pending
                      </span>
                    ) : (
                      <Button
                        onClick={() => {
                          onSendFriendRequest(player.player_name);
                          setSearchResults(
                            searchResults.filter((p) => p.player_name !== player.player_name)
                          );
                        }}
                        variant="success"
                        size="sm"
                      >
                        ➕ Add
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)] text-center">
            No players found matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">
            Friend Requests ({pendingRequests.length})
          </h4>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-skin-info/20 rounded-lg p-3 border-2 border-skin-info"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {request.from_player}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => onAcceptRequest(request.id)} variant="success" size="sm">
                      ✓ Accept
                    </Button>
                    <Button onClick={() => onRejectRequest(request.id)} variant="danger" size="sm">
                      × Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Friend Requests */}
      {sentRequests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">
            Sent Requests ({sentRequests.length})
          </h4>
          <div className="space-y-2">
            {sentRequests.map((request) => (
              <div
                key={request.id}
                className="bg-skin-warning/20 rounded-lg p-3 border-2 border-skin-warning"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">
                      {request.to_player}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-600 text-white text-xs rounded font-bold">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">
            Your Friends ({friends.length})
          </h4>
          <div className="space-y-2">
            {friends.map((friend) => {
              const isOnline = friend.is_online;
              const onlinePlayer = isOnline
                ? onlinePlayers.find((p) => p.playerName === friend.player_name)
                : null;

              return (
                <div
                  key={friend.player_name}
                  className="bg-skin-tertiary rounded-lg p-2 border border-skin-default hover:border-skin-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={`text-sm flex-shrink-0 ${isOnline ? 'text-green-500' : 'text-skin-muted'}`}
                      >
                        {isOnline ? '🟢' : '⚫'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <PlayerNameButton
                          playerName={friend.player_name}
                          onClick={() => onViewProfile(friend.player_name)}
                          variant="plain"
                          className="font-semibold text-sm truncate text-left"
                        />
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {isOnline
                            ? onlinePlayer?.status
                              ? getStatusLabel(onlinePlayer.status)
                              : 'Online'
                            : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {isOnline && onlinePlayer?.gameId && onlinePlayer.status !== 'in_lobby' && (
                        <Button
                          data-keyboard-nav={`join-friend-${friend.player_name}`}
                          onClick={() => {
                            sounds.buttonClick();
                            const nameToUse =
                              playerName.trim() || window.prompt('Enter your name to join:');
                            if (nameToUse && nameToUse.trim()) {
                              if (!playerName.trim()) {
                                setPlayerName(nameToUse.trim());
                              }
                              onJoinGame(onlinePlayer.gameId!, nameToUse.trim());
                            }
                          }}
                          variant="secondary"
                          size="sm"
                          title="Join their game"
                        >
                          🎮
                        </Button>
                      )}
                      <Button
                        onClick={() => onRemoveFriend(friend.player_name)}
                        variant="danger"
                        size="sm"
                        title="Remove friend"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friend Suggestions */}
      {friendSuggestions.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-[var(--color-text-secondary)] mb-2 uppercase">
            ✨ Suggested Friends
          </h4>
          <div className="space-y-2">
            {friendSuggestions.slice(0, 3).map((suggestion) => (
              <div
                key={suggestion}
                className="bg-skin-tertiary rounded-lg p-2 border border-skin-default hover:border-skin-success transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <PlayerNameButton
                      playerName={suggestion}
                      onClick={() => onViewProfile(suggestion)}
                      variant="plain"
                      className="font-semibold text-sm truncate text-left"
                    />
                    <p className="text-xs text-skin-success">Played together recently</p>
                  </div>
                  <Button onClick={() => onSendFriendRequest(suggestion)} variant="success" size="sm">
                    ➕ Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {friends.length === 0 && friendSuggestions.length === 0 && (
        <div className="text-center text-[var(--color-text-secondary)] py-12">
          <p className="text-2xl mb-2">👥</p>
          <p className="text-sm font-semibold">No friends yet</p>
          <p className="text-xs mt-2">Play some games to get friend suggestions!</p>
        </div>
      )}
    </div>
  );
}
