/**
 * Login Streak Badge Component
 * Sprint 19: Daily Engagement System
 *
 * Displays player's current login streak with freeze indicator
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { UICard, Button } from './ui';

interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  streakFreezeAvailable: boolean;
  totalLogins: number;
}

interface LoginStreakBadgeProps {
  socket: Socket | null;
  playerName: string;
  onClick?: () => void;
}

export function LoginStreakBadge({
  socket,
  playerName,
  onClick,
}: LoginStreakBadgeProps) {
  const [streak, setStreak] = useState<LoginStreak | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [freezeUsedNotification, setFreezeUsedNotification] = useState(false);

  useEffect(() => {
    if (!socket || !playerName) return;

    // Fetch login streak
    socket.emit('get_login_streak', { playerName });

    // Listen for streak data
    const handleLoginStreak = (data: LoginStreak) => {
      setStreak(data);
    };

    // Listen for streak updates
    const handleLoginStreakUpdated = (data: {
      currentStreak: number;
      longestStreak: number;
      freezeUsed: boolean;
    }) => {
      setStreak((prev) => ({
        ...prev!,
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak,
      }));

      if (data.freezeUsed) {
        setFreezeUsedNotification(true);
        setTimeout(() => setFreezeUsedNotification(false), 5000);
      }
    };

    // Listen for freeze used notification
    const handleStreakFreezeUsed = () => {
      setFreezeUsedNotification(true);
      setTimeout(() => setFreezeUsedNotification(false), 5000);
    };

    socket.on('login_streak', handleLoginStreak);
    socket.on('login_streak_updated', handleLoginStreakUpdated);
    socket.on('streak_freeze_used', handleStreakFreezeUsed);

    return () => {
      socket.off('login_streak', handleLoginStreak);
      socket.off('login_streak_updated', handleLoginStreakUpdated);
      socket.off('streak_freeze_used', handleStreakFreezeUsed);
    };
  }, [socket, playerName]);

  if (!streak) return null;

  const getStreakColor = (currentStreak: number) => {
    if (currentStreak === 0) return 'from-gray-400 to-gray-500';
    if (currentStreak < 3) return 'from-blue-500 to-indigo-600';
    if (currentStreak < 7) return 'from-gray-500 to-gray-700';
    if (currentStreak < 14) return 'from-purple-500 to-indigo-600';
    return 'from-amber-500 to-orange-600'; // 14+ days = legendary
  };

  const getStreakEmoji = (currentStreak: number) => {
    if (currentStreak === 0) return '😴';
    if (currentStreak < 3) return '🔥';
    if (currentStreak < 7) return '🔥🔥';
    if (currentStreak < 14) return '🔥🔥🔥';
    return '🔥💎'; // Legendary streak
  };

  return (
    <>
      {/* Freeze Used Notification */}
      {freezeUsedNotification && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <UICard variant="gradient" gradient="info" size="sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden="true">🛡️</span>
              <div>
                <p className="text-white font-bold">Streak Freeze Used!</p>
                <p className="text-blue-200 text-sm">Your streak continues</p>
              </div>
            </div>
          </UICard>
        </div>
      )}

      {/* Badge */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Button
          onClick={onClick}
          variant="primary"
          size="md"
          className={`bg-gradient-to-r ${getStreakColor(
            streak.currentStreak
          )} hover:scale-105`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">{getStreakEmoji(streak.currentStreak)}</span>
            <div className="text-left">
              <div className="text-xs opacity-80">Login Streak</div>
              <div className="text-lg leading-none">
                {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
            {streak.streakFreezeAvailable && (
              <span className="text-blue-200 text-sm ml-1" title="Freeze Available" aria-hidden="true">
                🛡️
              </span>
            )}
          </div>
        </Button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full mt-2 left-0 z-50 min-w-[280px]">
            <UICard variant="elevated" size="sm">
              <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <span className="text-gray-300 text-sm">Current Streak</span>
                <span className="text-white font-bold">
                  {streak.currentStreak} days
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <span className="text-gray-300 text-sm">Longest Streak</span>
                <span className="text-yellow-400 font-bold">
                  {streak.longestStreak} days <span aria-hidden="true">🏆</span>
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <span className="text-gray-300 text-sm">Total Logins</span>
                <span className="text-white font-bold">{streak.totalLogins}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Streak Freeze</span>
                <span
                  className={`font-bold ${
                    streak.streakFreezeAvailable ? 'text-blue-400' : 'text-gray-500'
                  }`}
                >
                  {streak.streakFreezeAvailable ? '✓ Available' : '✗ Used'}
                </span>
              </div>

              {streak.streakFreezeAvailable && (
                <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-200">
                  💡 Miss a day? Your streak freeze will protect you once per week!
                </div>
              )}
              </div>
            </UICard>
          </div>
        )}
      </div>
    </>
  );
}
