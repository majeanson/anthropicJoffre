/**
 * Friends Panel Component
 * Sprint 2 Phase 2
 *
 * Features:
 * - View friends list with online status
 * - Send/accept/reject friend requests
 * - Search for players
 * - Remove friends
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { FriendWithStatus, FriendRequest, FriendRequestNotification } from '../types/friends';

interface FriendsPanelProps {
  socket: Socket | null;
  currentPlayer: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FriendsPanel({ socket, currentPlayer, isOpen, onClose }: FriendsPanelProps) {
  // Early returns BEFORE hooks
  if (!isOpen) return null;
  if (!socket || !currentPlayer) return null;

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ player_name: string; games_played: number; games_won: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch friends list on mount
  useEffect(() => {
    if (activeTab === 'friends') {
      socket.emit('get_friends_list');
    } else if (activeTab === 'requests') {
      socket.emit('get_friend_requests');
      socket.emit('get_sent_friend_requests');
    }
  }, [socket, activeTab]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleFriendsList = ({ friends: friendsList }: { friends: FriendWithStatus[] }) => {
      setFriends(friendsList);
      setIsLoading(false);
    };

    const handleFriendRequests = ({ requests }: { requests: FriendRequest[] }) => {
      setPendingRequests(requests);
      setIsLoading(false);
    };

    const handleSentFriendRequests = ({ requests }: { requests: FriendRequest[] }) => {
      setSentRequests(requests);
      setIsLoading(false);
    };

    const handleFriendsListUpdated = ({ friends: friendsList }: { friends: FriendWithStatus[] }) => {
      setFriends(friendsList);
      // Refresh requests when friends list updates
      socket.emit('get_friend_requests');
      socket.emit('get_sent_friend_requests');
    };

    const handleFriendRequestReceived = (_notification: FriendRequestNotification) => {
      // Refresh requests list
      socket.emit('get_friend_requests');
    };

    const handleFriendRequestSent = () => {
      setSearchQuery('');
      setSearchResults([]);
      // Refresh sent requests
      socket.emit('get_sent_friend_requests');
    };

    const handlePlayerSearchResults = ({ players }: { players: Array<{ player_name: string; games_played: number; games_won: number }> }) => {
      setSearchResults(players);
      setIsLoading(false);
    };

    socket.on('friends_list', handleFriendsList);
    socket.on('friend_requests', handleFriendRequests);
    socket.on('sent_friend_requests', handleSentFriendRequests);
    socket.on('friends_list_updated', handleFriendsListUpdated);
    socket.on('friend_request_received', handleFriendRequestReceived);
    socket.on('friend_request_sent', handleFriendRequestSent);
    socket.on('player_search_results', handlePlayerSearchResults);

    return () => {
      socket.off('friends_list', handleFriendsList);
      socket.off('friend_requests', handleFriendRequests);
      socket.off('sent_friend_requests', handleSentFriendRequests);
      socket.off('friends_list_updated', handleFriendsListUpdated);
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_sent', handleFriendRequestSent);
      socket.off('player_search_results', handlePlayerSearchResults);
    };
  }, [socket]);

  const handleSearch = () => {
    if (searchQuery.trim().length < 2) return;
    setIsLoading(true);
    socket?.emit('search_players', { searchQuery });
  };

  const handleSendFriendRequest = (toPlayer: string) => {
    socket?.emit('send_friend_request', { toPlayer });
  };

  const handleAcceptRequest = (requestId: number) => {
    socket?.emit('accept_friend_request', { requestId });
  };

  const handleRejectRequest = (requestId: number) => {
    socket?.emit('reject_friend_request', { requestId });
  };

  const handleRemoveFriend = (friendName: string) => {
    if (confirm(`Remove ${friendName} from your friends list?`)) {
      socket?.emit('remove_friend', { friendName });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_game': return '🎮';
      case 'in_lobby': return '🏠';
      case 'in_team_selection': return '👥';
      case 'offline': return '⚫';
      default: return '🟢';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_game': return 'In Game';
      case 'in_lobby': return 'In Lobby';
      case 'in_team_selection': return 'Team Selection';
      case 'offline': return 'Offline';
      default: return 'Online';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_game': return 'text-green-400';
      case 'in_lobby': return 'text-blue-400';
      case 'in_team_selection': return 'text-purple-400';
      case 'offline': return 'text-gray-500';
      default: return 'text-green-400';
    }
  };

  const pendingRequestsCount = pendingRequests.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500/30 w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <h2 className="text-2xl font-bold text-white">Friends</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'friends'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Requests
            {pendingRequestsCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 px-4 font-semibold transition-colors ${
              activeTab === 'search'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Add Friends
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg">No friends yet</p>
                  <p className="text-sm mt-2">Add some friends to get started!</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.player_name}
                    className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(friend.status)}</span>
                      <div>
                        <p className="text-white font-semibold">{friend.player_name}</p>
                        <p className={`text-sm ${getStatusColor(friend.status)}`}>
                          {getStatusText(friend.status)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {friend.is_online && friend.game_id && (
                        <button
                          onClick={() => socket.emit('spectate_game', { gameId: friend.game_id, spectatorName: currentPlayer })}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Watch
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFriend(friend.player_name)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Received Requests */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Received Requests</h3>
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No pending requests</p>
                  ) : (
                    pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-semibold">{request.from_player}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sent Requests */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Sent Requests</h3>
                <div className="space-y-3">
                  {sentRequests.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">No sent requests</p>
                  ) : (
                    sentRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white font-semibold">{request.to_player}</p>
                          <p className="text-sm text-gray-400">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded">
                          Pending
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for players..."
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={searchQuery.trim().length < 2}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Search
                </button>
              </div>

              {isLoading && (
                <p className="text-gray-400 text-center py-4">Searching...</p>
              )}

              {!isLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-gray-400 text-center py-4">No players found</p>
              )}

              <div className="space-y-3">
                {searchResults.map((player) => {
                  const alreadyFriend = friends.some(f => f.player_name === player.player_name);
                  const alreadySent = sentRequests.some(r => r.to_player === player.player_name);

                  return (
                    <div
                      key={player.player_name}
                      className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-semibold">{player.player_name}</p>
                        <p className="text-sm text-gray-400">
                          {player.games_played} games • {player.games_won} wins
                        </p>
                      </div>
                      {alreadyFriend ? (
                        <span className="px-3 py-1 bg-green-600 text-white text-sm rounded">
                          Friends
                        </span>
                      ) : alreadySent ? (
                        <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded">
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(player.player_name)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                        >
                          Add Friend
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
