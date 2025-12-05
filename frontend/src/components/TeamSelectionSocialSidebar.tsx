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
import { Button } from './ui/Button';
import { UICard } from './ui/UICard';

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

  // Listen for invite confirmation
  useEffect(() => {
    if (!socket) return;

    const handleInviteSent = ({ toPlayer }: { toPlayer: string }) => {
      console.log(`[Social] Game invite sent to ${toPlayer}`);
    };

    socket.on('game_invite_sent', handleInviteSent);

    return () => {
      socket.off('game_invite_sent', handleInviteSent);
    };
  }, [socket]);

  const handleInvitePlayer = (playerName: string) => {
    if (!socket) return;

    // Send socket-based invite notification
    socket.emit('send_game_invite', { gameId, toPlayer: playerName });

    // Also copy game link to clipboard as backup
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    navigator.clipboard.writeText(gameUrl);

    // Mark as invited
    setInvitedPlayers(prev => new Set([...prev, playerName]));
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-parchment-50 dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto border-l-4 border-amber-700 dark:border-gray-600">
      {/* Header */}
      <UICard variant="gradient" gradient="warning" size="md" className="sticky top-0 rounded-none border-b-2 border-amber-800 dark:border-gray-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white">Find Players</h2>
          <Button
            variant="danger"
            size="sm"
            onClick={onClose}
            className="!px-3 !py-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-xl font-bold"
            title="Close panel"
          >
            ✕
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'friends' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('friends')}
            className={`flex-1 ${activeTab !== 'friends' ? 'bg-white/20 text-white hover:bg-white/30' : ''}`}
          >
            👥 Friends
          </Button>
          <Button
            variant={activeTab === 'online' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('online')}
            className={`flex-1 ${activeTab !== 'online' ? 'bg-white/20 text-white hover:bg-white/30' : ''}`}
          >
            🟢 Online
          </Button>
          <Button
            variant={activeTab === 'recent' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('recent')}
            className={`flex-1 ${activeTab !== 'recent' ? 'bg-white/20 text-white hover:bg-white/30' : ''}`}
          >
            🕐 Recent
          </Button>
        </div>
      </UICard>

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
                    <Button
                      variant={invitedPlayers.has(friend.player_name) ? 'secondary' : 'success'}
                      size="sm"
                      onClick={() => handleInvitePlayer(friend.player_name)}
                      disabled={invitedPlayers.has(friend.player_name)}
                    >
                      {invitedPlayers.has(friend.player_name) ? 'Invited' : 'Invite'}
                    </Button>
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
                      <Button
                        variant={invitedPlayers.has(player.playerName) ? 'secondary' : 'success'}
                        size="sm"
                        onClick={() => handleInvitePlayer(player.playerName)}
                        disabled={invitedPlayers.has(player.playerName)}
                      >
                        {invitedPlayers.has(player.playerName) ? 'Invited' : 'Invite'}
                      </Button>
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
                        <Button
                          variant={invitedPlayers.has(player.name) ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleInvitePlayer(player.name)}
                          disabled={invitedPlayers.has(player.name)}
                        >
                          {invitedPlayers.has(player.name) ? 'Invited' : 'Invite'}
                        </Button>
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
        <Button
          variant="warning"
          size="lg"
          fullWidth
          onClick={() => {
            const gameUrl = `${window.location.origin}?join=${gameId}`;
            navigator.clipboard.writeText(gameUrl);
            alert('Game link copied! Share it with anyone.');
          }}
        >
          <span aria-hidden="true">📋</span> Copy Game Link
        </Button>
      </div>
      </div>
    </>
  );
}
