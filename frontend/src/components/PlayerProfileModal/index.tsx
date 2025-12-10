/**
 * PlayerProfileModal Component
 * Sprint 16 Task 3.1
 *
 * Lightweight player profile modal for quick access to player info and actions.
 * Opens when clicking on player names throughout the app.
 *
 * Features:
 * - Quick stats summary (ELO, tier, win rate, games played)
 * - Achievements showcase (unlocked achievements)
 * - Friend actions (add/remove friend, send message)
 * - "View Full Stats" button to open PlayerStatsModal
 * - Works for both authenticated and guest players
 *
 * Refactored to use sub-components for better maintainability.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AchievementProgress } from '../../types/achievements';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

// Sub-components
import { ProfileHeader } from './ProfileHeader';
import { XPDisplay } from './XPDisplay';
import { ProfileInfo } from './ProfileInfo';
import { QuickStatsGrid } from './QuickStatsGrid';
import { SideBetsSection } from './SideBetsSection';
import { AchievementsShowcase } from './AchievementsShowcase';
import { MutualFriendsSection } from './MutualFriendsSection';
import { ProfileActions } from './ProfileActions';

// Types
import type {
  PlayerProfileModalProps,
  QuickStats,
  UserProfile,
  FriendStatus,
  BlockStatus,
} from './types';

export function PlayerProfileModal({
  playerName,
  socket,
  isOpen,
  onClose,
  onViewFullStats,
  onShowWhyRegister,
}: PlayerProfileModalProps) {
  // Early return BEFORE hooks
  if (!isOpen || !playerName) return null;

  // State
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [achievementPoints, setAchievementPoints] = useState(0);
  const [mutualFriends, setMutualFriends] = useState<string[]>([]);
  const [blockStatus, setBlockStatus] = useState<BlockStatus>({
    isBlocked: false,
    blockedByThem: false,
  });
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const isOwnProfile = isAuthenticated && user?.username === playerName;

  // Fetch quick stats
  useEffect(() => {
    if (!socket || !isOpen || !playerName) return;

    setLoading(true);
    setError(null);

    socket.emit('get_player_stats', { playerName });

    const handleStatsResponse = ({
      stats: receivedStats,
      playerName: responseName,
    }: {
      stats: QuickStats | null;
      playerName: string;
    }) => {
      if (responseName === playerName) {
        setStats(receivedStats);
        setLoading(false);
      }
    };

    const handleError = (errorData: {
      message?: string;
      context?: string;
    }) => {
      if (errorData?.context === 'get_player_stats') {
        setError(errorData.message || 'Failed to load player profile');
        setLoading(false);
      }
    };

    socket.on('player_stats_response', handleStatsResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('player_stats_response', handleStatsResponse);
      socket.off('error', handleError);
    };
  }, [socket, isOpen, playerName]);

  // Fetch achievements
  useEffect(() => {
    if (!socket || !isOpen || !playerName) return;

    socket.emit(
      'get_player_achievements',
      { playerName },
      (response: { success: boolean; achievements?: AchievementProgress[]; points?: number }) => {
        if (response.success && response.achievements) {
          setAchievements(response.achievements);
          setAchievementPoints(response.points || 0);
        }
      }
    );
  }, [socket, isOpen, playerName]);

  // Fetch user profile
  useEffect(() => {
    if (!socket || !isOpen || !playerName) return;

    socket.emit('get_user_profile', { username: playerName });

    const handleProfileResponse = ({
      username,
      profile: receivedProfile,
    }: {
      username: string;
      profile: UserProfile | null;
    }) => {
      if (username === playerName) {
        setProfile(receivedProfile);
      }
    };

    socket.on('user_profile_response', handleProfileResponse);

    return () => {
      socket.off('user_profile_response', handleProfileResponse);
    };
  }, [socket, isOpen, playerName]);

  // Check friend status
  useEffect(() => {
    if (!socket || !isAuthenticated || isOwnProfile) return;

    socket.emit('get_friends_list');

    const handleFriendsList = ({ friends }: { friends: Array<{ friend_name: string }> }) => {
      const isFriend = friends.some((f) => f.friend_name === playerName);
      setFriendStatus(isFriend ? 'friends' : 'none');
    };

    socket.on('friends_list', handleFriendsList);

    return () => {
      socket.off('friends_list', handleFriendsList);
    };
  }, [socket, isAuthenticated, isOwnProfile, playerName]);

  // Fetch mutual friends
  useEffect(() => {
    if (!socket || !isAuthenticated || isOwnProfile || !playerName) return;

    socket.emit('get_mutual_friends', { otherUsername: playerName });

    const handleMutualFriends = ({
      otherUsername,
      mutualFriends: friends,
    }: {
      otherUsername: string;
      mutualFriends: string[];
    }) => {
      if (otherUsername === playerName) {
        setMutualFriends(friends);
      }
    };

    socket.on('mutual_friends', handleMutualFriends);

    return () => {
      socket.off('mutual_friends', handleMutualFriends);
    };
  }, [socket, isAuthenticated, isOwnProfile, playerName]);

  // Check block status
  useEffect(() => {
    if (!socket || !isAuthenticated || isOwnProfile || !playerName) return;

    socket.emit('check_block_status', { playerName });

    const handleBlockStatus = (data: {
      playerName: string;
      isBlocked: boolean;
      blockedByThem: boolean;
    }) => {
      if (data.playerName === playerName) {
        setBlockStatus({ isBlocked: data.isBlocked, blockedByThem: data.blockedByThem });
      }
    };

    socket.on('block_status', handleBlockStatus);

    return () => {
      socket.off('block_status', handleBlockStatus);
    };
  }, [socket, isAuthenticated, isOwnProfile, playerName]);

  // Handlers
  const handleSendFriendRequest = () => {
    if (!socket || !isAuthenticated) return;

    setSendingRequest(true);
    socket.emit('send_friend_request', { toPlayer: playerName });

    const handleSent = () => {
      setFriendStatus('pending');
      setSendingRequest(false);
    };

    const handleError = () => {
      setSendingRequest(false);
    };

    socket.once('friend_request_sent', handleSent);
    socket.once('error', handleError);
  };

  const handleRemoveFriend = () => {
    if (!socket || !isAuthenticated) return;

    socket.emit('remove_friend', { friendName: playerName });

    const handleRemoved = () => {
      setFriendStatus('none');
    };

    socket.once('friend_removed', handleRemoved);
  };

  const handleBlockPlayer = () => {
    if (!socket || !isAuthenticated) return;

    setBlockingInProgress(true);
    socket.emit('block_player', { blockedName: playerName });

    const handleBlocked = () => {
      setBlockStatus({ isBlocked: true, blockedByThem: false });
      setFriendStatus('none');
      setBlockingInProgress(false);
    };

    const handleError = () => {
      setBlockingInProgress(false);
    };

    socket.once('player_blocked', handleBlocked);
    socket.once('block_player_error', handleError);
  };

  const handleUnblockPlayer = () => {
    if (!socket || !isAuthenticated) return;

    setBlockingInProgress(true);
    socket.emit('unblock_player', { blockedName: playerName });

    const handleUnblocked = () => {
      setBlockStatus({ ...blockStatus, isBlocked: false });
      setBlockingInProgress(false);
    };

    const handleError = () => {
      setBlockingInProgress(false);
    };

    socket.once('player_unblocked', handleUnblocked);
    socket.once('unblock_player_error', handleError);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Player Profile"
      theme="blue"
      size="lg"
      testId="player-profile-modal"
    >
      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-2" aria-hidden="true">
            ⏳
          </div>
          <p className="text-skin-muted">Loading profile...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      )}

      {/* Profile Content */}
      {!loading && !error && stats && (
        <div className="space-y-6">
          <ProfileHeader playerName={playerName} stats={stats} />

          {stats.total_xp !== undefined && <XPDisplay totalXp={stats.total_xp || 0} />}

          {profile && <ProfileInfo profile={profile} />}

          <QuickStatsGrid stats={stats} />

          <SideBetsSection stats={stats} />

          <AchievementsShowcase
            achievements={achievements}
            achievementPoints={achievementPoints}
          />

          <MutualFriendsSection mutualFriends={mutualFriends} />

          <ProfileActions
            isAuthenticated={isAuthenticated}
            isOwnProfile={isOwnProfile}
            friendStatus={friendStatus}
            blockStatus={blockStatus}
            sendingRequest={sendingRequest}
            blockingInProgress={blockingInProgress}
            onSendFriendRequest={handleSendFriendRequest}
            onRemoveFriend={handleRemoveFriend}
            onBlockPlayer={handleBlockPlayer}
            onUnblockPlayer={handleUnblockPlayer}
            onViewFullStats={onViewFullStats}
            onShowWhyRegister={onShowWhyRegister}
            onClose={onClose}
          />
        </div>
      )}
    </Modal>
  );
}

// Re-export types
export type { PlayerProfileModalProps, QuickStats, UserProfile } from './types';
