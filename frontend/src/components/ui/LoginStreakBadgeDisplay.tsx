/**
 * Login Streak Badge Display Component
 * Sprint 21: Presentational component for Storybook
 *
 * Pure presentational version of LoginStreakBadge without Socket.io dependency
 */

import { useState } from 'react';

interface LoginStreak {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string | null;
  streakFreezeAvailable: boolean;
  totalLogins: number;
}

interface LoginStreakBadgeDisplayProps {
  streak: LoginStreak;
  onClick?: () => void;
  showFreezeNotification?: boolean;
}

export function LoginStreakBadgeDisplay({
  streak,
  onClick,
  showFreezeNotification = false,
}: LoginStreakBadgeDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStreakColor = (currentStreak: number) => {
    if (currentStreak === 0) return 'from-gray-600 to-gray-500';
    if (currentStreak < 3) return 'from-blue-600 to-blue-500';
    if (currentStreak < 7) return 'from-purple-600 to-purple-500';
    if (currentStreak < 14) return 'from-pink-600 to-pink-500';
    return 'from-orange-600 to-orange-500'; // 14+ days = legendary
  };

  const getStreakEmoji = (currentStreak: number) => {
    if (currentStreak === 0) return '😴';
    if (currentStreak < 3) return '🔥';
    if (currentStreak < 7) return '🔥🔥';
    if (currentStreak < 14) return '🔥🔥🔥';
    return '🔥💎'; // Legendary streak
  };

  const getStreakLabel = (currentStreak: number) => {
    if (currentStreak === 0) return 'No Streak';
    if (currentStreak < 3) return 'Getting Started';
    if (currentStreak < 7) return 'On Fire';
    if (currentStreak < 14) return 'Dedicated';
    return 'Legendary'; // 14+ days
  };

  return (
    <>
      {/* Freeze Used Notification */}
      {showFreezeNotification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-900/90 border-2 border-blue-500 rounded-lg p-4 shadow-xl animate-bounce-once">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <p className="text-white font-bold">Streak Freeze Used!</p>
              <p className="text-blue-200 text-sm">Your streak continues</p>
            </div>
          </div>
        </div>
      )}

      {/* Badge */}
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          onClick={onClick}
          className={`bg-gradient-to-r ${getStreakColor(
            streak.currentStreak
          )} text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
          aria-label={`Login streak: ${streak.currentStreak} days`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {getStreakEmoji(streak.currentStreak)}
            </span>
            <div className="text-left">
              <div className="text-xs opacity-80">{getStreakLabel(streak.currentStreak)}</div>
              <div className="text-lg leading-none">
                {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>
            {streak.streakFreezeAvailable && (
              <span
                className="text-blue-200 text-sm ml-1"
                title="Freeze Available"
                aria-label="Freeze available"
              >
                🛡️
              </span>
            )}
          </div>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div
            className="absolute top-full mt-2 left-0 bg-gray-800 dark:bg-gray-900 border border-gray-600 rounded-lg p-4 shadow-xl z-50 min-w-[280px]"
            role="tooltip"
          >
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <span className="text-gray-300 text-sm">Current Streak</span>
                <span className="text-white font-bold">{streak.currentStreak} days</span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <span className="text-gray-300 text-sm">Longest Streak</span>
                <span className="text-yellow-400 font-bold">{streak.longestStreak} days 🏆</span>
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
          </div>
        )}
      </div>
    </>
  );
}
