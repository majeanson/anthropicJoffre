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
import Avatar from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { AchievementProgress } from '../types/achievements';

interface QuickStats {
  player_name: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  elo_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
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
}

export function PlayerProfileModal({
  playerName,
  socket,
  isOpen,
  onClose,
  onViewFullStats
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
      playerName: responseName
    }: {
      stats: QuickStats | null;
      playerName: string;
    }) => {
      if (responseName === playerName) {
        setStats(receivedStats);
        setLoading(false);
      }
    };

    const handleError = (errorData: { message?: string; correlationId?: string; correlation_id?: string; context?: string }) => {
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

    socket.emit('get_player_achievements', { playerName }, (response: {
      success: boolean;
      achievements?: AchievementProgress[];
      points?: number;
    }) => {
      if (response.success && response.achievements) {
        setAchievements(response.achievements);
        setAchievementPoints(response.points || 0);
      }
    });
  }, [socket, isOpen, playerName]);

  // Fetch user profile
  useEffect(() => {
    if (!socket || !isOpen || !playerName) return;

    socket.emit('get_user_profile', { username: playerName });

    const handleProfileResponse = ({
      username,
      profile: receivedProfile
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
      const isFriend = friends.some(f => f.friend_name === playerName);
      setFriendStatus(isFriend ? 'friends' : 'none');
    };

    socket.on('friends_list', handleFriendsList);

    return () => {
      socket.off('friends_list', handleFriendsList);
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

  // Tier badge styling
  const tierColor = stats ? getTierColor(stats.ranking_tier) : 'gray';
  const tierIcon = stats ? getTierIcon(stats.ranking_tier) : '🏅';

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-orange-500/30 p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-orange-400">Player Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-2">⏳</div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
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
                  <span className={`text-lg ${tierColor}`}>{tierIcon}</span>
                  <span className={`font-semibold ${tierColor}`}>
                    {stats.ranking_tier}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">{stats.elo_rating} ELO</span>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            {profile && (
              <div className="space-y-3">
                {/* Bio */}
                {profile.bio && (
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-xs font-semibold text-gray-400 mb-1">BIO</div>
                    <p className="text-sm text-gray-200">{profile.bio}</p>
                  </div>
                )}

                {/* Country and Favorite Team */}
                <div className="flex gap-3">
                  {profile.country && (
                    <div className="flex-1 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="text-xs font-semibold text-gray-400 mb-1">COUNTRY</div>
                      <div className="text-sm text-gray-200">
                        {profile.country === 'US' && '🇺🇸 United States'}
                        {profile.country === 'CA' && '🇨🇦 Canada'}
                        {profile.country === 'GB' && '🇬🇧 United Kingdom'}
                        {profile.country === 'FR' && '🇫🇷 France'}
                        {profile.country === 'DE' && '🇩🇪 Germany'}
                        {profile.country === 'ES' && '🇪🇸 Spain'}
                        {profile.country === 'IT' && '🇮🇹 Italy'}
                        {profile.country === 'JP' && '🇯🇵 Japan'}
                        {profile.country === 'AU' && '🇦🇺 Australia'}
                        {profile.country === 'BR' && '🇧🇷 Brazil'}
                        {profile.country === 'MX' && '🇲🇽 Mexico'}
                        {profile.country === 'IN' && '🇮🇳 India'}
                        {profile.country === 'CN' && '🇨🇳 China'}
                        {profile.country === 'KR' && '🇰🇷 South Korea'}
                        {!['US', 'CA', 'GB', 'FR', 'DE', 'ES', 'IT', 'JP', 'AU', 'BR', 'MX', 'IN', 'CN', 'KR'].includes(profile.country) && profile.country}
                      </div>
                    </div>
                  )}
                  {profile.favorite_team && (
                    <div className="flex-1 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="text-xs font-semibold text-gray-400 mb-1">FAVORITE TEAM</div>
                      <div className={`text-sm font-semibold ${profile.favorite_team === 1 ? 'text-orange-400' : 'text-purple-400'}`}>
                        Team {profile.favorite_team}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-2xl font-bold text-orange-400">
                  {stats.games_played}
                </div>
                <div className="text-sm text-gray-400">Games Played</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-2xl font-bold text-green-400">
                  {stats.games_won}
                </div>
                <div className="text-sm text-gray-400">Games Won</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 col-span-2">
                <div className="text-2xl font-bold text-blue-400">
                  {stats.win_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">Win Rate</div>
              </div>
            </div>

            {/* Achievements Showcase */}
            {achievements.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                    🏆 Achievements
                  </h4>
                  <span className="text-xs text-gray-400">
                    {achievements.filter(a => a.is_unlocked).length}/{achievements.length} • {achievementPoints} pts
                  </span>
                </div>
                {/* Show unlocked achievements as icons */}
                <div className="flex flex-wrap gap-2">
                  {achievements
                    .filter(a => a.is_unlocked)
                    .slice(0, 8)
                    .map(achievement => (
                      <div
                        key={achievement.achievement_key}
                        className="relative group"
                        title={`${achievement.achievement_name}: ${achievement.description}`}
                      >
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center text-xl
                          ${achievement.tier === 'platinum' ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-purple-300' :
                            achievement.tier === 'gold' ? 'bg-gradient-to-br from-yellow-500 to-amber-600 ring-2 ring-yellow-300' :
                            achievement.tier === 'silver' ? 'bg-gradient-to-br from-gray-300 to-gray-500 ring-2 ring-gray-200' :
                            'bg-gradient-to-br from-amber-600 to-amber-800 ring-2 ring-amber-400'}
                          shadow-lg transform transition-transform hover:scale-110
                        `}>
                          {achievement.icon}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                          {achievement.achievement_name}
                        </div>
                      </div>
                    ))}
                  {achievements.filter(a => a.is_unlocked).length > 8 && (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold bg-gray-700 text-gray-300">
                      +{achievements.filter(a => a.is_unlocked).length - 8}
                    </div>
                  )}
                  {achievements.filter(a => a.is_unlocked).length === 0 && (
                    <p className="text-sm text-gray-500 italic">No achievements yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {/* View Full Stats Button */}
              {onViewFullStats && (
                <button
                  onClick={onViewFullStats}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors"
                >
                  📊 View Full Statistics
                </button>
              )}

              {/* Friend Actions - Only show if authenticated and not own profile */}
              {isAuthenticated && !isOwnProfile && (
                <>
                  {friendStatus === 'none' && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={sendingRequest}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                    >
                      {sendingRequest ? '⏳ Sending...' : '➕ Add Friend'}
                    </button>
                  )}
                  {friendStatus === 'pending' && (
                    <button
                      disabled
                      className="w-full py-2 bg-gray-600 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                    >
                      ⏳ Friend Request Pending
                    </button>
                  )}
                  {friendStatus === 'friends' && (
                    <button
                      onClick={handleRemoveFriend}
                      className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
                    >
                      🗑️ Remove Friend
                    </button>
                  )}
                </>
              )}

              {/* Guest prompt */}
              {!isAuthenticated && !isOwnProfile && (
                <div className="text-center py-2 px-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    Sign in to add friends and send messages
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
