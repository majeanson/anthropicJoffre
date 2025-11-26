/**
 * SocialPanel Component
 * Enhanced Social Hub for Lobby
 *
 * Comprehensive social experience with:
 * - Messages tab: Direct messaging with conversation list
 * - Friends tab: Friends list with friend suggestions and recent players
 * - Online tab: Currently online players with join functionality
 *
 * Features:
 * - Direct message integration
 * - Friend management (add/remove)
 * - Friend suggestions based on recent games
 * - Recent players tracking
 * - Online player status
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { OnlinePlayer } from '../types/game';
import { RecentPlayer } from '../utils/recentPlayers';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { FriendWithStatus, FriendRequest } from '../types/friends';
import { DirectMessagesPanel } from './DirectMessagesPanel';
import { PlayerNameButton } from './PlayerNameButton';
import { PlayerProfileModal } from './PlayerProfileModal';
import { UnifiedChat } from './UnifiedChat';
import type { ChatMessage } from '../types/game';

interface SocialPanelProps {
  socialTab: 'recent' | 'online' | 'chat' | 'friends' | 'messages' | 'profile';
  setSocialTab: (tab: 'recent' | 'online' | 'chat' | 'friends' | 'messages' | 'profile') => void;
  onlinePlayers: OnlinePlayer[];
  recentPlayers: RecentPlayer[];
  playerName: string;
  setPlayerName: (name: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  socket: Socket | null;
  user: User | null;
  lobbyMessages?: ChatMessage[];
  sendLobbyMessage?: (message: string) => void;
}

export function SocialPanel({
  socialTab,
  setSocialTab,
  onlinePlayers,
  recentPlayers,
  playerName,
  setPlayerName,
  onJoinGame,
  socket,
  user,
  lobbyMessages = [],
  sendLobbyMessage = () => {},
}: SocialPanelProps) {
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [showDirectMessages, setShowDirectMessages] = useState(false);
  const [unreadDMCount, setUnreadDMCount] = useState(0);
  const [friendSuggestions, setFriendSuggestions] = useState<string[]>([]);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  // Fetch friends list and requests when friends or online tab is active
  useEffect(() => {
    if ((socialTab === 'friends' || socialTab === 'online') && socket && user) {
      setIsLoadingFriends(true);
      socket.emit('get_friends_list');
      socket.emit('get_friend_requests');
      socket.emit('get_sent_friend_requests');
    }
  }, [socialTab, socket, user]);

  // Load friend suggestions based on recent players
  useEffect(() => {
    if (socialTab === 'friends' && user) {
      // Get recent players who are not friends
      const suggestions = recentPlayers
        .filter(rp => !friends.some(f => f.player_name === rp.name))
        .filter(rp => !rp.name.startsWith('Bot ')) // Exclude bots
        .slice(0, 5)
        .map(rp => rp.name);
      setFriendSuggestions(suggestions);
    }
  }, [socialTab, recentPlayers, friends, user]);

  // Listen for friends list updates
  useEffect(() => {
    if (!socket) return;

    const handleFriendsList = ({ friends: friendsList }: { friends: FriendWithStatus[] }) => {
      setFriends(friendsList);
      setIsLoadingFriends(false);
    };

    const handleFriendRequests = ({ requests }: { requests: FriendRequest[] }) => {
      setPendingRequests(requests);
    };

    const handleSentFriendRequests = ({ requests }: { requests: FriendRequest[] }) => {
      setSentRequests(requests);
    };

    const handleFriendAdded = () => {
      // Refresh friends list when a new friend is added
      if (socialTab === 'friends') {
        socket.emit('get_friends_list');
        socket.emit('get_friend_requests');
        socket.emit('get_sent_friend_requests');
      }
    };

    const handleFriendRemoved = () => {
      // Refresh friends list when a friend is removed
      if (socialTab === 'friends') {
        socket.emit('get_friends_list');
      }
    };

    const handleFriendRequestReceived = () => {
      // Refresh requests when a new one is received
      if (socialTab === 'friends') {
        socket.emit('get_friend_requests');
      }
    };

    const handleFriendRequestSent = () => {
      // Refresh sent requests
      if (socialTab === 'friends') {
        socket.emit('get_sent_friend_requests');
      }
    };

    socket.on('friends_list', handleFriendsList);
    socket.on('friend_requests', handleFriendRequests);
    socket.on('sent_friend_requests', handleSentFriendRequests);
    socket.on('friend_added', handleFriendAdded);
    socket.on('friend_removed', handleFriendRemoved);
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_sent', handleFriendRequestSent);

    return () => {
      socket.off('friends_list', handleFriendsList);
      socket.off('friend_requests', handleFriendRequests);
      socket.off('sent_friend_requests', handleSentFriendRequests);
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_sent', handleFriendRequestSent);
    };
  }, [socket, socialTab]);

  // Listen for unread DM count
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('get_unread_count');

    const handleUnreadCount = ({ count }: { count: number }) => {
      setUnreadDMCount(count);
    };

    socket.on('unread_count', handleUnreadCount);

    return () => {
      socket.off('unread_count', handleUnreadCount);
    };
  }, [socket, user]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_lobby': return 'In Lobby';
      case 'in_game': return 'Playing';
      case 'in_team_selection': return 'Setting up';
      default: return status;
    }
  };

  const handleSendFriendRequest = (friendName: string) => {
    if (!socket || !user) return;
    socket.emit('send_friend_request', { toPlayer: friendName });
    sounds.buttonClick();
  };

  const handleAcceptRequest = (requestId: number) => {
    if (!socket || !user) return;
    socket.emit('accept_friend_request', { requestId });
    sounds.buttonClick();
  };

  const handleRejectRequest = (requestId: number) => {
    if (!socket || !user) return;
    socket.emit('reject_friend_request', { requestId });
    sounds.buttonClick();
  };

  const handleRemoveFriend = (friendName: string) => {
    if (!socket || !user) return;
    if (confirm(`Remove ${friendName} from your friends list?`)) {
      socket.emit('remove_friend', { friendName });
      sounds.buttonClick();
    }
  };

  return (
    <>
      {/* Sub-tabs for Social - Reordered: Messages | Friends | Online | Profile | Chat */}
      <div className="grid grid-cols-5 gap-1.5">
        <button
          data-keyboard-nav="social-messages"
          data-nav-subtab="messages"
          onClick={() => {
            sounds.buttonClick();
            if (!user) {
              alert('Please log in to view messages');
              return;
            }
            setSocialTab('messages');
          }}
          className={`py-2 rounded-lg font-bold transition-all duration-200 text-xs relative focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
            socialTab === 'messages'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg border-b-2 border-orange-400 dark:border-purple-400'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          💬
          {unreadDMCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
              {unreadDMCount}
            </span>
          )}
        </button>
        <button
          data-keyboard-nav="social-friends"
          data-nav-subtab="friends"
          onClick={() => {
            sounds.buttonClick();
            if (!user) {
              alert('Please log in to view friends');
              return;
            }
            setSocialTab('friends');
          }}
          className={`py-2 rounded-lg font-bold transition-all duration-200 text-xs focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
            socialTab === 'friends'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg border-b-2 border-orange-400 dark:border-purple-400'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          👥
        </button>
        <button
          data-keyboard-nav="social-online"
          data-nav-subtab="online"
          onClick={() => { sounds.buttonClick(); setSocialTab('online'); }}
          className={`py-2 rounded-lg font-bold transition-all duration-200 text-xs focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
            socialTab === 'online'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg border-b-2 border-orange-400 dark:border-purple-400'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          🟢 {onlinePlayers.length}
        </button>
        <button
          data-keyboard-nav="social-profile"
          data-nav-subtab="profile"
          onClick={() => {
            sounds.buttonClick();
            if (!user) {
              alert('Please log in to view your profile');
              return;
            }
            setSocialTab('profile');
          }}
          className={`py-2 rounded-lg font-bold transition-all duration-200 text-xs focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
            socialTab === 'profile'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg border-b-2 border-orange-400 dark:border-purple-400'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          👤
        </button>
        <button
          data-keyboard-nav="social-chat"
          data-nav-subtab="chat"
          onClick={() => { sounds.buttonClick(); setSocialTab('chat'); }}
          className={`py-2 rounded-lg font-bold transition-all duration-200 text-xs focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-1 ${
            socialTab === 'chat'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg border-b-2 border-orange-400 dark:border-purple-400'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          💭
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600 min-h-[320px] max-h-[320px] overflow-y-auto">
        {/* Messages Tab */}
        {socialTab === 'messages' && (
          <div className="space-y-2">
            {!user ? (
              <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-lg font-semibold">Login Required</p>
                <p className="text-sm mt-2">Please log in to view messages</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <button
                  onClick={() => {
                    sounds.buttonClick();
                    setShowDirectMessages(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold shadow-lg transition-all duration-200"
                >
                  💬 Open Direct Messages
                  {unreadDMCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {unreadDMCount} new
                    </span>
                  )}
                </button>
                <p className="text-sm text-umber-600 dark:text-gray-400 mt-4">
                  Send private messages to friends and recent players
                </p>
              </div>
            )}
          </div>
        )}

        {/* Online Tab */}
        {socialTab === 'online' && (
          <div className="space-y-2">
            {onlinePlayers.length === 0 ? (
              <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                <p className="text-2xl mb-2">😴</p>
                <p className="text-lg font-semibold">No players online</p>
                <p className="text-sm mt-2">Online players will appear here</p>
              </div>
            ) : (
              onlinePlayers.map(player => {
                const isBot = player.playerName?.startsWith('Bot ');
                const isSelf = player.playerName === playerName;
                const isFriend = friends.some(f => f.player_name === player.playerName);
                const showFriendButton = user && !isBot && !isSelf && !isFriend;

                return (
                  <div
                    key={player.socketId}
                    className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-500 hover:border-green-400 dark:hover:border-green-500 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-green-500 text-lg flex-shrink-0">🟢</span>
                        <div className="min-w-0 flex-1">
                          <PlayerNameButton
                            playerName={player.playerName || player.socketId || 'Unknown'}
                            onClick={() => setSelectedPlayerProfile(player.playerName || 'Unknown')}
                            variant="plain"
                            className="font-bold text-umber-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 truncate text-left"
                          />
                          <p className="text-xs text-umber-600 dark:text-gray-400">{getStatusLabel(player.status)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showFriendButton && (
                          <button
                            onClick={() => {
                              sounds.buttonClick();
                              handleSendFriendRequest(player.playerName!);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors"
                            title="Send friend request"
                          >
                            ➕
                          </button>
                        )}
                        {player.gameId && player.status !== 'in_lobby' && (
                          <button
                            data-keyboard-nav={`join-player-${player.socketId}`}
                            onClick={() => {
                              sounds.buttonClick();
                              const nameToUse = playerName.trim() || window.prompt('Enter your name to join:');
                              if (nameToUse && nameToUse.trim()) {
                                if (!playerName.trim()) {
                                  setPlayerName(nameToUse.trim());
                                }
                                onJoinGame(player.gameId!, nameToUse.trim());
                              }
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors"
                            title="Join their game"
                          >
                            🎮 Join
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {socialTab === 'recent' && (
          <div className="space-y-2">
            {(() => {
              // Filter out bots (names starting with "Bot ")
              const humanPlayers = recentPlayers.filter(p => !p.name.startsWith('Bot '));

              if (humanPlayers.length === 0) {
                return (
                  <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                    <p className="text-2xl mb-2">📭</p>
                    <p className="text-lg font-semibold">No recent players yet</p>
                    <p className="text-sm mt-2">Players you've played with will appear here</p>
                  </div>
                );
              }

              return humanPlayers.map(player => (
                <div
                  key={player.name}
                  className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <PlayerNameButton
                        playerName={player.name}
                        onClick={() => setSelectedPlayerProfile(player.name)}
                        variant="plain"
                        className="font-bold text-umber-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400"
                      />
                      <p className="text-xs text-umber-600 dark:text-gray-400">
                        {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} • {new Date(player.lastPlayed).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {socialTab === 'friends' && (
          <div className="space-y-3">
            {!user ? (
              <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-lg font-semibold">Login Required</p>
                <p className="text-sm mt-2">Please log in to view your friends</p>
              </div>
            ) : isLoadingFriends ? (
              <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                <p className="text-2xl mb-2">⏳</p>
                <p className="text-lg font-semibold">Loading friends...</p>
              </div>
            ) : (
              <>
                {/* Pending Friend Requests */}
                {pendingRequests.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-umber-700 dark:text-gray-300 mb-2 uppercase">
                      Friend Requests ({pendingRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {pendingRequests.map(request => (
                        <div
                          key={request.id}
                          className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-3 border-2 border-blue-300 dark:border-blue-600"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-umber-900 dark:text-gray-100">
                                {request.from_player}
                              </p>
                              <p className="text-xs text-umber-600 dark:text-gray-400">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors"
                              >
                                × Reject
                              </button>
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
                    <h4 className="text-xs font-bold text-umber-700 dark:text-gray-300 mb-2 uppercase">
                      Sent Requests ({sentRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {sentRequests.map(request => (
                        <div
                          key={request.id}
                          className="bg-yellow-100 dark:bg-yellow-900/40 rounded-lg p-3 border-2 border-yellow-300 dark:border-yellow-600"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-umber-900 dark:text-gray-100">
                                {request.to_player}
                              </p>
                              <p className="text-xs text-umber-600 dark:text-gray-400">
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
                    <h4 className="text-xs font-bold text-umber-700 dark:text-gray-300 mb-2 uppercase">
                      Your Friends ({friends.length})
                    </h4>
                    <div className="space-y-2">
                      {friends.map(friend => {
                        const isOnline = friend.is_online;
                        const onlinePlayer = isOnline ? onlinePlayers.find(p => p.playerName === friend.player_name) : null;

                        return (
                          <div
                            key={friend.player_name}
                            className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-2 border border-parchment-400 dark:border-gray-500 hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`text-sm flex-shrink-0 ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                  {isOnline ? '🟢' : '⚫'}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <PlayerNameButton
                                    playerName={friend.player_name}
                                    onClick={() => setSelectedPlayerProfile(friend.player_name)}
                                    variant="plain"
                                    className="font-semibold text-sm text-umber-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 truncate text-left"
                                  />
                                  <p className="text-xs text-umber-600 dark:text-gray-400">
                                    {isOnline ? (
                                      onlinePlayer?.status ? getStatusLabel(onlinePlayer.status) : 'Online'
                                    ) : (
                                      'Offline'
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {isOnline && onlinePlayer?.gameId && onlinePlayer.status !== 'in_lobby' && (
                                  <button
                                    data-keyboard-nav={`join-friend-${friend.player_name}`}
                                    onClick={() => {
                                      sounds.buttonClick();
                                      const nameToUse = playerName.trim() || window.prompt('Enter your name to join:');
                                      if (nameToUse && nameToUse.trim()) {
                                        if (!playerName.trim()) {
                                          setPlayerName(nameToUse.trim());
                                        }
                                        onJoinGame(onlinePlayer.gameId!, nameToUse.trim());
                                      }
                                    }}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                                    title="Join their game"
                                  >
                                    🎮
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveFriend(friend.player_name)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold transition-colors"
                                  title="Remove friend"
                                >
                                  ×
                                </button>
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
                    <h4 className="text-xs font-bold text-umber-700 dark:text-gray-300 mb-2 uppercase">
                      ✨ Suggested Friends
                    </h4>
                    <div className="space-y-2">
                      {friendSuggestions.slice(0, 3).map(suggestion => (
                        <div
                          key={suggestion}
                          className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-2 border border-parchment-400 dark:border-gray-500 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <PlayerNameButton
                                playerName={suggestion}
                                onClick={() => setSelectedPlayerProfile(suggestion)}
                                variant="plain"
                                className="font-semibold text-sm text-umber-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 truncate text-left"
                              />
                              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                Played together recently
                              </p>
                            </div>
                            <button
                              onClick={() => handleSendFriendRequest(suggestion)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex-shrink-0"
                            >
                              ➕ Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {friends.length === 0 && friendSuggestions.length === 0 && (
                  <div className="text-center text-umber-600 dark:text-gray-400 py-12">
                    <p className="text-2xl mb-2">👥</p>
                    <p className="text-sm font-semibold">No friends yet</p>
                    <p className="text-xs mt-2">Play some games to get friend suggestions!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {socialTab === 'chat' && (
          <div className="space-y-2 -m-4">
            <UnifiedChat
              mode="embedded"
              context="lobby"
              socket={socket}
              currentPlayerId={playerName}
              messages={lobbyMessages}
              onSendMessage={(message) => {
                if (!playerName.trim()) {
                  const name = window.prompt('Please enter your name to chat:');
                  if (name && name.trim()) {
                    setPlayerName(name.trim());
                    localStorage.setItem('playerName', name.trim());
                    // Try to send after setting name
                    setTimeout(() => sendLobbyMessage(message), 100);
                  }
                } else {
                  sendLobbyMessage(message);
                }
              }}
              placeholder={playerName.trim() ? "Type a message..." : "Click to enter your name..."}
              className="h-[328px]"
            />
          </div>
        )}

        {/* Profile Tab */}
        {socialTab === 'profile' && (
          <div className="space-y-3">
            {!user ? (
              <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-lg font-semibold">Login Required</p>
                <p className="text-sm mt-2">Please log in to view your profile</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Profile Header */}
                <div className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👤</div>
                    <h3 className="text-lg font-bold text-umber-900 dark:text-gray-100">
                      {user.username}
                    </h3>
                    {user.is_verified && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-center gap-1">
                        <span>✓</span>
                        <span>Verified Account</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      sounds.buttonClick();
                      setShowDirectMessages(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>💬</span>
                    <span>View Messages</span>
                    {unreadDMCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {unreadDMCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      sounds.buttonClick();
                      setSocialTab('friends');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>👥</span>
                    <span>View Friends ({friends.length})</span>
                  </button>
                </div>

                {/* Profile Info */}
                <div className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border border-parchment-400 dark:border-gray-500">
                  <h4 className="text-xs font-bold text-umber-700 dark:text-gray-300 mb-2 uppercase">
                    Account Info
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-umber-600 dark:text-gray-400">Email:</span>
                      <span className="text-umber-900 dark:text-gray-100 font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-umber-600 dark:text-gray-400">Member Since:</span>
                      <span className="text-umber-900 dark:text-gray-100 font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Messages Modal */}
      {user && (
        <DirectMessagesPanel
          isOpen={showDirectMessages}
          onClose={() => {
            setShowDirectMessages(false);
            // Refresh unread count
            if (socket) {
              socket.emit('get_unread_count');
            }
          }}
          socket={socket}
          currentUsername={user.username}
        />
      )}

      {/* Player Profile Modal */}
      {selectedPlayerProfile && socket && (
        <PlayerProfileModal
          playerName={selectedPlayerProfile}
          socket={socket}
          isOpen={!!selectedPlayerProfile}
          onClose={() => setSelectedPlayerProfile(null)}
        />
      )}
    </>
  );
}
