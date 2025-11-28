/**
 * Friends Panel Component
 * Sprint 2 Phase 2 | Refactored Sprint 19B
 *
 * Features:
 * - View friends list with online status
 * - Send/accept/reject friend requests
 * - Search for players
 * - Remove friends
 *
 * Uses unified UI components:
 * - Modal for panel structure
 * - Button for all actions
 * - SocialListItem for friend list items
 * - OnlineStatusBadge for status display
 * - UnreadBadge for request count
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { FriendWithStatus, FriendRequest, FriendRequestNotification } from '../types/friends';
import { Modal, Button, SocialListItem, UnreadBadge } from './ui';
import type { PlayerStatus } from './ui/OnlineStatusBadge';

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

  const pendingRequestsCount = pendingRequests.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Friends"
      icon={<span className="text-3xl">👥</span>}
      theme="purple"
      size="lg"
    >
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 -mt-4 mb-4">
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
            <UnreadBadge
              count={pendingRequestsCount}
              variant="red"
              size="sm"
              position="absolute"
              className="top-2 right-2"
            />
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
      <div className="space-y-4">

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
                <SocialListItem
                  key={friend.player_name}
                  playerName={friend.player_name}
                  status={friend.status as PlayerStatus}
                  actions={
                    <div className="flex items-center gap-2">
                      {friend.is_online && friend.game_id && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => socket?.emit('spectate_game', { gameId: friend.game_id, spectatorName: currentPlayer })}
                        >
                          Watch
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveFriend(friend.player_name)}
                      >
                        Remove
                      </Button>
                    </div>
                  }
                />
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
                    <SocialListItem
                      key={request.id}
                      playerName={request.from_player}
                      metadata={new Date(request.created_at).toLocaleDateString()}
                      actions={
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700 border-green-700"
                          >
                            Accept
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      }
                    />
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
                    <SocialListItem
                      key={request.id}
                      playerName={request.to_player}
                      metadata={`Sent ${new Date(request.created_at).toLocaleDateString()}`}
                      actions={
                        <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded font-semibold">
                          Pending
                        </span>
                      }
                    />
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
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={searchQuery.trim().length < 2}
                className="bg-purple-600 hover:bg-purple-700 border-purple-700"
              >
                Search
              </Button>
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
                  <SocialListItem
                    key={player.player_name}
                    playerName={player.player_name}
                    metadata={`${player.games_played} games • ${player.games_won} wins`}
                    actions={
                      alreadyFriend ? (
                        <span className="px-3 py-1 bg-green-600 text-white text-sm rounded font-semibold">
                          Friends
                        </span>
                      ) : alreadySent ? (
                        <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded font-semibold">
                          Pending
                        </span>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendFriendRequest(player.player_name)}
                          className="bg-purple-600 hover:bg-purple-700 border-purple-700"
                        >
                          Add Friend
                        </Button>
                      )
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
