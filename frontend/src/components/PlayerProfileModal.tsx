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
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getTierColor, getTierIcon } from '../utils/tierBadge';
import {
  getLevelProgress,
  getLevelTitle,
  getLevelColor,
  getLevelGradient,
  formatXp,
} from '../utils/xpSystem';
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { AchievementProgress } from '../types/achievements';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { UICard } from './ui/UICard';

interface QuickStats {
  player_name: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  elo_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  total_xp?: number;
  current_level?: number;
  cosmetic_currency?: number;
  // Side bet stats
  side_bets_won?: number;
  side_bets_lost?: number;
  side_bets_coins_won?: number;
  side_bets_coins_lost?: number;
  current_bet_streak?: number;
  best_bet_streak?: number;
}

interface UserProfile {
  bio: string | null;
  country: string | null;
  favorite_team: 1 | 2 | null;
  visibility: 'public' | 'friends_only' | 'private';
  show_online_status: boolean;
  allow_friend_requests: boolean;
}

interface PlayerProfileModalProps {
  playerName: string;
  socket: Socket | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullStats?: () => void; // Opens PlayerStatsModal
  onShowWhyRegister?: () => void; // Opens Why Register modal
}

export function PlayerProfileModal({
  playerName,
  socket,
  isOpen,
  onClose,
  onViewFullStats,
  onShowWhyRegister,
}: PlayerProfileModalProps) {
  // ✅ Early return BEFORE hooks
  if (!isOpen || !playerName) return null;

  // ✅ NOW safe to call hooks
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [achievements, setAchievements] = useState<AchievementProgress[]>([]);
  const [achievementPoints, setAchievementPoints] = useState(0);
  const [mutualFriends, setMutualFriends] = useState<string[]>([]);
  const [blockStatus, setBlockStatus] = useState<{ isBlocked: boolean; blockedByThem: boolean }>({
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
      correlationId?: string;
      correlation_id?: string;
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

  // Fetch mutual friends (Sprint 22C)
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

  // Handle friend request
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

  // Handle remove friend
  const handleRemoveFriend = () => {
    if (!socket || !isAuthenticated) return;

    socket.emit('remove_friend', { friendName: playerName });

    const handleRemoved = () => {
      setFriendStatus('none');
    };

    socket.once('friend_removed', handleRemoved);
  };

  // Handle block player
  const handleBlockPlayer = () => {
    if (!socket || !isAuthenticated) return;

    setBlockingInProgress(true);
    socket.emit('block_player', { blockedName: playerName });

    const handleBlocked = () => {
      setBlockStatus({ isBlocked: true, blockedByThem: false });
      setFriendStatus('none'); // Blocking removes friendship
      setBlockingInProgress(false);
    };

    const handleError = () => {
      setBlockingInProgress(false);
    };

    socket.once('player_blocked', handleBlocked);
    socket.once('block_player_error', handleError);
  };

  // Handle unblock player
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

  // Tier badge styling
  const tierColor = stats ? getTierColor(stats.ranking_tier) : 'gray';
  const tierIcon = stats ? getTierIcon(stats.ranking_tier) : '🏅';

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
          <p className="text-gray-400">Loading profile...</p>
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
          {/* Player Header */}
          <div className="flex items-center gap-4">
            <Avatar username={playerName} size="lg" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{playerName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-lg ${tierColor}`} aria-hidden="true">
                  {tierIcon}
                </span>
                <span className={`font-semibold ${tierColor}`}>{stats.ranking_tier}</span>
                <span className="text-gray-400" aria-hidden="true">
                  •
                </span>
                <span className="text-gray-300">{stats.elo_rating} ELO</span>
              </div>
            </div>
          </div>

          {/* XP and Level Display */}
          {stats.total_xp !== undefined &&
            (() => {
              const progress = getLevelProgress(stats.total_xp || 0);
              const levelTitle = getLevelTitle(progress.level);
              const levelColor = getLevelColor(progress.level);
              const levelGradient = getLevelGradient(progress.level);

              return (
                <UICard variant="bordered" size="sm">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Level Badge */}
                    <div
                      className={`
                        w-12 h-12 rounded-lg flex items-center justify-center
                        bg-gradient-to-br ${levelGradient}
                        shadow-lg
                      `}
                    >
                      <span className="text-white font-bold text-lg">{progress.level}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold ${levelColor}`}>{levelTitle}</span>
                        <span className="text-xs text-gray-400">
                          {formatXp(stats.total_xp || 0)} XP
                        </span>
                      </div>
                      {/* XP Progress Bar */}
                      <div className="mt-1">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${levelGradient} transition-all duration-500`}
                            style={{ width: `${progress.progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                          <span>Level {progress.level}</span>
                          <span>{formatXp(progress.xpToNextLevel)} XP to next</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </UICard>
              );
            })()}

          {/* Profile Information */}
          {profile && (
            <div className="space-y-3">
              {/* Bio */}
              {profile.bio && (
                <UICard variant="bordered" size="sm">
                  <div className="text-xs font-semibold text-gray-400 mb-1">BIO</div>
                  <p className="text-sm text-gray-200">{profile.bio}</p>
                </UICard>
              )}

              {/* Country and Favorite Team */}
              <div className="flex gap-3">
                {profile.country && (
                  <UICard variant="bordered" size="sm" className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 mb-1">COUNTRY</div>
                    <div className="text-sm text-gray-200">
                      {profile.country === 'US' && (
                        <>
                          <span aria-hidden="true">🇺🇸</span> United States
                        </>
                      )}
                      {profile.country === 'CA' && (
                        <>
                          <span aria-hidden="true">🇨🇦</span> Canada
                        </>
                      )}
                      {profile.country === 'GB' && (
                        <>
                          <span aria-hidden="true">🇬🇧</span> United Kingdom
                        </>
                      )}
                      {profile.country === 'FR' && (
                        <>
                          <span aria-hidden="true">🇫🇷</span> France
                        </>
                      )}
                      {profile.country === 'DE' && (
                        <>
                          <span aria-hidden="true">🇩🇪</span> Germany
                        </>
                      )}
                      {profile.country === 'ES' && (
                        <>
                          <span aria-hidden="true">🇪🇸</span> Spain
                        </>
                      )}
                      {profile.country === 'IT' && (
                        <>
                          <span aria-hidden="true">🇮🇹</span> Italy
                        </>
                      )}
                      {profile.country === 'JP' && (
                        <>
                          <span aria-hidden="true">🇯🇵</span> Japan
                        </>
                      )}
                      {profile.country === 'AU' && (
                        <>
                          <span aria-hidden="true">🇦🇺</span> Australia
                        </>
                      )}
                      {profile.country === 'BR' && (
                        <>
                          <span aria-hidden="true">🇧🇷</span> Brazil
                        </>
                      )}
                      {profile.country === 'MX' && (
                        <>
                          <span aria-hidden="true">🇲🇽</span> Mexico
                        </>
                      )}
                      {profile.country === 'IN' && (
                        <>
                          <span aria-hidden="true">🇮🇳</span> India
                        </>
                      )}
                      {profile.country === 'CN' && (
                        <>
                          <span aria-hidden="true">🇨🇳</span> China
                        </>
                      )}
                      {profile.country === 'KR' && (
                        <>
                          <span aria-hidden="true">🇰🇷</span> South Korea
                        </>
                      )}
                      {![
                        'US',
                        'CA',
                        'GB',
                        'FR',
                        'DE',
                        'ES',
                        'IT',
                        'JP',
                        'AU',
                        'BR',
                        'MX',
                        'IN',
                        'CN',
                        'KR',
                      ].includes(profile.country) && profile.country}
                    </div>
                  </UICard>
                )}
                {profile.favorite_team && (
                  <UICard variant="bordered" size="sm" className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 mb-1">FAVORITE TEAM</div>
                    <div
                      className={`text-sm font-semibold ${profile.favorite_team === 1 ? 'text-team1' : 'text-team2'}`}
                    >
                      Team {profile.favorite_team}
                    </div>
                  </UICard>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <UICard variant="bordered" size="sm">
              <div className="text-2xl font-bold text-yellow-400">{stats.games_played}</div>
              <div className="text-sm text-gray-400">Games Played</div>
            </UICard>
            <UICard variant="bordered" size="sm">
              <div className="text-2xl font-bold text-green-400">{stats.games_won}</div>
              <div className="text-sm text-gray-400">Games Won</div>
            </UICard>
            <UICard variant="bordered" size="sm" className="col-span-2">
              <div className="text-2xl font-bold text-blue-400">
                {stats.win_percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </UICard>
          </div>

          {/* Coins & Side Bets Section */}
          <UICard variant="bordered" size="md">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-yellow-400">
                <span aria-hidden="true">🪙</span> Coins & Side Bets
              </h4>
              <span className="text-lg font-bold text-yellow-400">
                {stats.cosmetic_currency ?? 100} coins
              </span>
            </div>

            {/* Only show detailed stats if player has made side bets */}
            {(stats.side_bets_won ?? 0) > 0 || (stats.side_bets_lost ?? 0) > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-lg font-bold text-green-400">{stats.side_bets_won ?? 0}</div>
                  <div className="text-xs text-gray-400">Bets Won</div>
                </div>
                <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-lg font-bold text-red-400">{stats.side_bets_lost ?? 0}</div>
                  <div className="text-xs text-gray-400">Bets Lost</div>
                </div>
                <div className="text-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-lg font-bold text-yellow-400">
                    +{stats.side_bets_coins_won ?? 0}
                  </div>
                  <div className="text-xs text-gray-400">Coins Won</div>
                </div>
                <div className="text-center p-2 bg-team1-10 rounded-lg border border-team1">
                  <div className="text-lg font-bold text-team1">
                    -{stats.side_bets_coins_lost ?? 0}
                  </div>
                  <div className="text-xs text-gray-400">Coins Lost</div>
                </div>
                {(stats.best_bet_streak ?? 0) > 0 && (
                  <div className="col-span-2 text-center p-2 bg-team2-10 rounded-lg border border-team2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg font-bold text-team2">
                        🔥 {stats.current_bet_streak ?? 0}
                      </span>
                      <span className="text-xs text-gray-400">current</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-lg font-bold text-team2">
                        {stats.best_bet_streak ?? 0}
                      </span>
                      <span className="text-xs text-gray-400">best streak</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-2">
                No side bets placed yet
              </p>
            )}
          </UICard>

          {/* Achievements Showcase */}
          {achievements.length > 0 && (
            <UICard variant="bordered" size="md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-yellow-400">
                  <span aria-hidden="true">🏆</span> Achievements
                </h4>
                <span className="text-xs text-gray-400">
                  {achievements.filter((a) => a.is_unlocked).length}/{achievements.length} •{' '}
                  {achievementPoints} pts
                </span>
              </div>
              {/* Show unlocked achievements as icons */}
              <div className="flex flex-wrap gap-2">
                {achievements
                  .filter((a) => a.is_unlocked)
                  .slice(0, 8)
                  .map((achievement) => (
                    <div
                      key={achievement.achievement_key}
                      className="relative group"
                      title={`${achievement.achievement_name}: ${achievement.description}`}
                    >
                      <div
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center text-xl
                          ${
                            achievement.tier === 'platinum'
                              ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-purple-300'
                              : achievement.tier === 'gold'
                                ? 'bg-gradient-to-br from-yellow-500 to-amber-600 ring-2 ring-yellow-300'
                                : achievement.tier === 'silver'
                                  ? 'bg-gradient-to-br from-gray-300 to-gray-500 ring-2 ring-gray-200'
                                  : 'bg-gradient-to-br from-amber-600 to-amber-800 ring-2 ring-amber-400'
                          }
                          shadow-lg transform transition-transform hover:scale-110
                        `}
                      >
                        {achievement.icon}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {achievement.achievement_name}
                      </div>
                    </div>
                  ))}
                {achievements.filter((a) => a.is_unlocked).length > 8 && (
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold bg-gray-700 text-gray-300">
                    +{achievements.filter((a) => a.is_unlocked).length - 8}
                  </div>
                )}
                {achievements.filter((a) => a.is_unlocked).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No achievements yet</p>
                )}
              </div>
            </UICard>
          )}

          {/* Mutual Friends Section (Sprint 22C) */}
          {mutualFriends.length > 0 && (
            <UICard variant="bordered" size="md">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-team2">
                  <span aria-hidden="true">🤝</span> Mutual Friends
                </h4>
                <span className="text-xs text-gray-400">{mutualFriends.length} in common</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mutualFriends.slice(0, 6).map((friendName) => (
                  <div
                    key={friendName}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-team2-10 border border-team2"
                  >
                    <Avatar username={friendName} size="sm" />
                    <span className="text-sm text-gray-200">{friendName}</span>
                  </div>
                ))}
                {mutualFriends.length > 6 && (
                  <div className="flex items-center px-3 py-1.5 rounded-full bg-gray-700 text-gray-300 text-sm">
                    +{mutualFriends.length - 6} more
                  </div>
                )}
              </div>
            </UICard>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {/* View Full Stats Button */}
            {onViewFullStats && (
              <Button
                variant="primary"
                fullWidth
                onClick={onViewFullStats}
                leftIcon={<span>📊</span>}
              >
                View Full Statistics
              </Button>
            )}

            {/* Friend Actions - Only show if authenticated and not own profile */}
            {isAuthenticated && !isOwnProfile && (
              <>
                {/* Show blocked by them notice */}
                {blockStatus.blockedByThem && (
                  <UICard variant="gradient" gradient="warning" size="sm" className="text-center">
                    <p className="text-sm text-yellow-100">This player has blocked you</p>
                  </UICard>
                )}

                {/* Friend buttons - only if not blocked either way */}
                {!blockStatus.isBlocked && !blockStatus.blockedByThem && (
                  <>
                    {friendStatus === 'none' && (
                      <Button
                        variant="success"
                        fullWidth
                        onClick={handleSendFriendRequest}
                        disabled={sendingRequest}
                        loading={sendingRequest}
                        leftIcon={!sendingRequest ? <span>➕</span> : undefined}
                      >
                        {sendingRequest ? 'Sending...' : 'Add Friend'}
                      </Button>
                    )}
                    {friendStatus === 'pending' && (
                      <Button variant="secondary" fullWidth disabled leftIcon={<span>⏳</span>}>
                        Friend Request Pending
                      </Button>
                    )}
                    {friendStatus === 'friends' && (
                      <Button
                        variant="danger"
                        fullWidth
                        onClick={handleRemoveFriend}
                        leftIcon={<span>🗑️</span>}
                      >
                        Remove Friend
                      </Button>
                    )}
                  </>
                )}

                {/* Block/Unblock Button */}
                <div className="pt-2 border-t border-gray-700">
                  {blockStatus.isBlocked ? (
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={handleUnblockPlayer}
                      disabled={blockingInProgress}
                      loading={blockingInProgress}
                      leftIcon={!blockingInProgress ? <span>🔓</span> : undefined}
                    >
                      {blockingInProgress ? 'Unblocking...' : 'Unblock Player'}
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={handleBlockPlayer}
                      disabled={blockingInProgress}
                      loading={blockingInProgress}
                      leftIcon={!blockingInProgress ? <span>🚫</span> : undefined}
                    >
                      {blockingInProgress ? 'Blocking...' : 'Block Player'}
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Guest prompt */}
            {!isAuthenticated && !isOwnProfile && (
              <UICard variant="gradient" gradient="info" size="sm" className="text-center">
                <p className="text-sm text-blue-100 mb-3">
                  Sign in to add friends and send messages
                </p>
                {onShowWhyRegister && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onShowWhyRegister();
                    }}
                    leftIcon={<span>🚀</span>}
                  >
                    Why should I register?
                  </Button>
                )}
              </UICard>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
