/**
 * useFriendsState Hook
 *
 * Manages friends list, friend requests, and related socket listeners.
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { FriendWithStatus, FriendRequest } from '../../types/friends';
import { sounds } from '../../utils/sounds';
import { User } from '../../types/auth';
import { SocialPanelTabType } from './index';

interface UseFriendsStateOptions {
  socket: Socket | null;
  user: User | null;
  socialTab: SocialPanelTabType;
}

interface UseFriendsStateReturn {
  friends: FriendWithStatus[];
  isLoadingFriends: boolean;
  friendsError: string | null;
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  handleSendFriendRequest: (friendName: string) => void;
  handleAcceptRequest: (requestId: number) => void;
  handleRejectRequest: (requestId: number) => void;
  handleRemoveFriend: (friendName: string) => void;
  handleRetryFriends: () => void;
}

export function useFriendsState({
  socket,
  user,
  socialTab,
}: UseFriendsStateOptions): UseFriendsStateReturn {
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);

  // Fetch friends list and requests when friends or online tab is active
  useEffect(() => {
    if ((socialTab === 'friends' || socialTab === 'online') && socket && user) {
      setIsLoadingFriends(true);
      setFriendsError(null);
      socket.emit('get_friends_list');
      socket.emit('get_friend_requests');
      socket.emit('get_sent_friend_requests');

      // Timeout fallback
      const timeout = setTimeout(() => {
        if (isLoadingFriends) {
          setFriendsError('Request timed out. Please try again.');
          setIsLoadingFriends(false);
        }
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [socialTab, socket, user]);

  // Listen for friends list updates
  useEffect(() => {
    if (!socket) return;

    const handleFriendsList = ({ friends: friendsList }: { friends: FriendWithStatus[] }) => {
      setFriends(friendsList);
      setIsLoadingFriends(false);
      setFriendsError(null);
    };

    const handleFriendRequests = ({ requests }: { requests: FriendRequest[] }) => {
      setPendingRequests(requests);
    };

    const handleSentFriendRequests = ({ requests }: { requests: FriendRequest[] }) => {
      setSentRequests(requests);
    };

    const handleFriendsError = ({ message }: { message: string }) => {
      setFriendsError(message || 'Failed to load data');
      setIsLoadingFriends(false);
    };

    const handleFriendAdded = () => {
      if (socialTab === 'friends') {
        socket.emit('get_friends_list');
        socket.emit('get_friend_requests');
        socket.emit('get_sent_friend_requests');
      }
    };

    const handleFriendRemoved = () => {
      if (socialTab === 'friends') {
        socket.emit('get_friends_list');
      }
    };

    const handleFriendRequestReceived = () => {
      if (socialTab === 'friends') {
        socket.emit('get_friend_requests');
      }
    };

    const handleFriendRequestSent = () => {
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
    socket.on('friends_error', handleFriendsError);

    return () => {
      socket.off('friends_list', handleFriendsList);
      socket.off('friend_requests', handleFriendRequests);
      socket.off('sent_friend_requests', handleSentFriendRequests);
      socket.off('friend_added', handleFriendAdded);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_request_received', handleFriendRequestReceived);
      socket.off('friend_request_sent', handleFriendRequestSent);
      socket.off('friends_error', handleFriendsError);
    };
  }, [socket, socialTab]);

  const handleSendFriendRequest = useCallback(
    (friendName: string) => {
      if (!socket || !user) return;
      socket.emit('send_friend_request', { toPlayer: friendName });
      sounds.buttonClick();
    },
    [socket, user]
  );

  const handleAcceptRequest = useCallback(
    (requestId: number) => {
      if (!socket || !user) return;
      socket.emit('accept_friend_request', { requestId });
      sounds.buttonClick();
    },
    [socket, user]
  );

  const handleRejectRequest = useCallback(
    (requestId: number) => {
      if (!socket || !user) return;
      socket.emit('reject_friend_request', { requestId });
      sounds.buttonClick();
    },
    [socket, user]
  );

  const handleRemoveFriend = useCallback(
    (friendName: string) => {
      if (!socket || !user) return;
      if (confirm(`Remove ${friendName} from your friends list?`)) {
        socket.emit('remove_friend', { friendName });
        sounds.buttonClick();
      }
    },
    [socket, user]
  );

  const handleRetryFriends = useCallback(() => {
    setFriendsError(null);
    setIsLoadingFriends(true);
    socket?.emit('get_friends_list');
    socket?.emit('get_friend_requests');
    socket?.emit('get_sent_friend_requests');
  }, [socket]);

  return {
    friends,
    isLoadingFriends,
    friendsError,
    pendingRequests,
    sentRequests,
    handleSendFriendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleRemoveFriend,
    handleRetryFriends,
  };
}
