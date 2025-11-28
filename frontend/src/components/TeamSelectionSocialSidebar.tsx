/**
 * Team Selection Social Sidebar
 * Shows friends, online players, and recent players for easy game invites
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { FriendWithStatus } from '../types/friends';
import { OnlinePlayer } from '../types/game';
import { RecentPlayer } from '../utils/recentPlayers';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../design-system';

interface TeamSelectionSocialSidebarProps {
  socket: Socket | null;
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TeamSelectionSocialSidebar({
  socket,
  gameId,
  isOpen,
  onClose
}: TeamSelectionSocialSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'online' | 'recent'>('friends');
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [invitedPlayers, setInvitedPlayers] = useState<Set<string>>(new Set());

  // Fetch friends list
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    socket.emit('get_friends_list');

    const handleFriendsList = (data: { friends: FriendWithStatus[] }) => {
      setFriends(data.friends);
    };

    socket.on('friends_list', handleFriendsList);
    socket.on('friends_list_updated', handleFriendsList);

    return () => {
      socket.off('friends_list', handleFriendsList);
      socket.off('friends_list_updated', handleFriendsList);
    };
  }, [socket, isAuthenticated]);

  // Fetch online players
  useEffect(() => {
    if (!socket) return;

    socket.emit('get_online_players');

    const handleOnlinePlayers = (data: { players: OnlinePlayer[] }) => {
      setOnlinePlayers(data.players);
    };

    socket.on('online_players', handleOnlinePlayers);
    socket.on('online_players_updated', handleOnlinePlayers);

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      socket.emit('get_online_players');
    }, 10000);

    return () => {
      socket.off('online_players', handleOnlinePlayers);
      socket.off('online_players_updated', handleOnlinePlayers);
      clearInterval(interval);
    };
  }, [socket]);

  // Fetch recent players
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('get_recent_players', { limit: 10 });

    const handleRecentPlayers = (data: { players: RecentPlayer[] }) => {
      setRecentPlayers(data.players);
    };

    socket.on('recent_players', handleRecentPlayers);

    return () => {
      socket.off('recent_players', handleRecentPlayers);
    };
  }, [socket, user]);

  const handleInvitePlayer = (playerName: string) => {
    if (!socket) return;

    // Copy game link to clipboard
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    navigator.clipboard.writeText(gameUrl);

    // Mark as invited
    setInvitedPlayers(prev => new Set([...prev, playerName]));

    // TODO: Send notification to player via socket
    // socket.emit('send_game_invite', { gameId, toPlayer: playerName });

    // Show feedback
    alert(`Invite link copied! Share it with ${playerName}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-parchment-50 dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto border-l-4 border-amber-700 dark:border-gray-600">
      {/* Header */}
      <div className="sticky top-0 p-4 border-b-2 border-amber-800 dark:border-gray-600" style={{ background: colors.gradients.warning }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">Find Players</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-3 rounded font-bold text-sm transition-all ${
              activeTab === 'friends'
                ? 'bg-white text-amber-800 dark:bg-gray-700 dark:text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            👥 Friends
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-2 px-3 rounded font-bold text-sm transition-all ${
              activeTab === 'online'
                ? 'bg-white text-amber-800 dark:bg-gray-700 dark:text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🟢 Online
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 px-3 rounded font-bold text-sm transition-all ${
              activeTab === 'recent'
                ? 'bg-white text-amber-800 dark:bg-gray-700 dark:text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            🕐 Recent
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-2">
            {!isAuthenticated ? (
              <div className="text-center py-8 text-umber-600 dark:text-gray-400">
                <p className="mb-2">Please login to view friends</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-umber-600 dark:text-gray-400">
                <p className="mb-2">No friends yet</p>
                <p className="text-sm">Add friends to see them here!</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.player_name}
                  className="p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-amber-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-gray-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          friend.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="font-medium text-umber-900 dark:text-gray-100">
                        {friend.player_name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleInvitePlayer(friend.player_name)}
                      disabled={invitedPlayers.has(friend.player_name)}
                      className={`text-xs px-3 py-1 rounded font-bold transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${
                        invitedPlayers.has(friend.player_name)
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'text-white'
                      }`}
                      style={invitedPlayers.has(friend.player_name) ? {} : { background: colors.gradients.success }}
                    >
                      {invitedPlayers.has(friend.player_name) ? 'Invited' : 'Invite'}
                    </button>
                  </div>
                  {friend.status !== 'offline' && (
                    <div className="mt-1 text-xs text-umber-600 dark:text-gray-400">
                      {friend.status === 'in_game' && '🎮 In game'}
                      {friend.status === 'in_team_selection' && '👥 In team selection'}
                      {friend.status === 'in_lobby' && '🏠 In lobby'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Online Players Tab */}
        {activeTab === 'online' && (
          <div className="space-y-2">
            {onlinePlayers.filter(p => p.playerName !== user?.username && !p.playerName.startsWith('Bot ')).length === 0 ? (
              <div className="text-center py-8 text-umber-600 dark:text-gray-400">
                <p className="mb-2">No other players online</p>
                <p className="text-sm">Invite your friends to play!</p>
              </div>
            ) : (
              onlinePlayers
                .filter(p => p.playerName !== user?.username && !p.playerName.startsWith('Bot '))
                .map((player) => (
                  <div
                    key={player.socketId}
                    className="p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-green-200 dark:border-gray-600 hover:border-green-400 dark:hover:border-gray-500 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-medium text-umber-900 dark:text-gray-100">
                          {player.playerName}
                        </span>
                      </div>
                      <button
                        onClick={() => handleInvitePlayer(player.playerName)}
                        disabled={invitedPlayers.has(player.playerName)}
                        className={`text-xs px-3 py-1 rounded font-bold transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 ${
                          invitedPlayers.has(player.playerName)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'text-white'
                        }`}
                        style={invitedPlayers.has(player.playerName) ? {} : { background: colors.gradients.success }}
                      >
                        {invitedPlayers.has(player.playerName) ? 'Invited' : 'Invite'}
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-umber-600 dark:text-gray-400">
                      {player.status === 'in_game' && '🎮 In game'}
                      {player.status === 'in_team_selection' && '👥 In team selection'}
                      {player.status === 'in_lobby' && '🏠 Available'}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* Recent Players Tab */}
        {activeTab === 'recent' && (
          <div className="space-y-2">
            {recentPlayers.filter(p => p.name !== user?.username && !p.name.startsWith('Bot ')).length === 0 ? (
              <div className="text-center py-8 text-umber-600 dark:text-gray-400">
                <p className="mb-2">No recent players</p>
                <p className="text-sm">Play some games to see recent players!</p>
              </div>
            ) : (
              recentPlayers
                .filter(p => p.name !== user?.username && !p.name.startsWith('Bot '))
                .map((player) => {
                  const isOnline = onlinePlayers.some(op => op.playerName === player.name);
                  return (
                    <div
                      key={player.name}
                      className="p-3 bg-white dark:bg-gray-700 rounded-lg border-2 border-purple-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-gray-500 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          <span className="font-medium text-umber-900 dark:text-gray-100">
                            {player.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleInvitePlayer(player.name)}
                          disabled={invitedPlayers.has(player.name)}
                          className={`text-xs px-3 py-1 rounded font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 ${
                            invitedPlayers.has(player.name)
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'text-white'
                          }`}
                          style={invitedPlayers.has(player.name) ? {} : { background: colors.gradients.secondary }}
                        >
                          {invitedPlayers.has(player.name) ? 'Invited' : 'Invite'}
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-umber-600 dark:text-gray-400">
                        {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} together
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* Quick Copy Link Button */}
      <div className="sticky bottom-0 p-4 bg-parchment-100 dark:bg-gray-900 border-t-2 border-amber-700 dark:border-gray-600">
        <button
          onClick={() => {
            const gameUrl = `${window.location.origin}?join=${gameId}`;
            navigator.clipboard.writeText(gameUrl);
            alert('Game link copied! Share it with anyone.');
          }}
          className="w-full text-white py-3 rounded-lg font-bold transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          style={{ background: colors.gradients.warning }}
        >
          <span aria-hidden="true">📋</span> Copy Game Link
        </button>
      </div>
    </div>
  );
}
