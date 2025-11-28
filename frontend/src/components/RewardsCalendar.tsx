/**
 * Rewards Calendar Component
 * Sprint 19: Daily Engagement System
 *
 * 30-day progressive rewards calendar with special milestones
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface CalendarReward {
  dayNumber: number;
  rewardType: string;
  rewardAmount: number | null;
  rewardItemId: number | null;
  isSpecial: boolean;
  icon: string;
  description: string;
}

interface CalendarProgress {
  currentDay: number;
  rewardsClaimed: number[];
  monthStartDate: string;
  lastClaimedDate: string | null;
  calendarResets: number;
}

interface RewardsCalendarProps {
  socket: Socket | null;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RewardsCalendar({
  socket,
  playerName,
  isOpen,
  onClose,
}: RewardsCalendarProps) {
  const [calendar, setCalendar] = useState<CalendarReward[]>([]);
  const [progress, setProgress] = useState<CalendarProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingDay, setClaimingDay] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !playerName) return;

    // Fetch calendar data
    socket.emit('get_daily_calendar');
    socket.emit('get_player_calendar_progress', { playerName });

    // Listen for calendar data
    const handleDailyCalendar = (data: { calendar: CalendarReward[] }) => {
      setCalendar(data.calendar);
    };

    const handleCalendarProgress = (data: CalendarProgress) => {
      setProgress(data);
      setLoading(false);
    };

    // Listen for reward claimed
    const handleCalendarRewardClaimed = (data: {
      dayNumber: number;
      rewards: { xp?: number; currency?: number };
      currentDay: number;
      rewardsClaimed: number[];
    }) => {
      setProgress((prev) =>
        prev
          ? {
              ...prev,
              currentDay: data.currentDay,
              rewardsClaimed: data.rewardsClaimed,
              lastClaimedDate: new Date().toISOString(),
            }
          : null
      );

      const rewardText = [];
      if (data.rewards.xp) rewardText.push(`+${data.rewards.xp} XP`);
      if (data.rewards.currency) rewardText.push(`+${data.rewards.currency} coins`);

      setNotification(`✅ Day ${data.dayNumber} claimed: ${rewardText.join(', ')}!`);
      setTimeout(() => setNotification(null), 5000);
      setClaimingDay(null);
    };

    socket.on('daily_calendar', handleDailyCalendar);
    socket.on('calendar_progress', handleCalendarProgress);
    socket.on('calendar_reward_claimed', handleCalendarRewardClaimed);

    return () => {
      socket.off('daily_calendar', handleDailyCalendar);
      socket.off('calendar_progress', handleCalendarProgress);
      socket.off('calendar_reward_claimed', handleCalendarRewardClaimed);
    };
  }, [socket, playerName]);

  const handleClaimReward = (dayNumber: number) => {
    if (!socket || claimingDay || !progress) return;

    // Check if can claim (must be current day or earlier)
    if (dayNumber > progress.currentDay) {
      setNotification('❌ Cannot claim future rewards!');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Check if already claimed
    if (progress.rewardsClaimed.includes(dayNumber)) {
      setNotification('⚠️ Already claimed!');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setClaimingDay(dayNumber);
    socket.emit('claim_calendar_reward', { playerName, dayNumber });
  };

  const getDayStatus = (dayNumber: number) => {
    if (!progress) return 'locked';

    if (progress.rewardsClaimed.includes(dayNumber)) return 'claimed';
    if (dayNumber === progress.currentDay) return 'available';
    if (dayNumber < progress.currentDay) return 'missed';
    return 'locked';
  };

  const getDayClasses = (reward: CalendarReward) => {
    const status = getDayStatus(reward.dayNumber);

    const baseClasses =
      'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all';

    if (reward.isSpecial) {
      if (status === 'claimed') {
        return `${baseClasses} bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-500 opacity-60`;
      }
      if (status === 'available') {
        return `${baseClasses} bg-gradient-to-br from-purple-700 to-pink-700 border-purple-400 cursor-pointer hover:scale-105 shadow-lg shadow-purple-500/50 animate-pulse`;
      }
      return `${baseClasses} bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50`;
    }

    switch (status) {
      case 'claimed':
        return `${baseClasses} bg-gray-700 border-gray-600 opacity-60`;
      case 'available':
        return `${baseClasses} bg-gradient-to-br from-blue-700 to-purple-700 border-blue-400 cursor-pointer hover:scale-105 shadow-lg`;
      case 'missed':
        return `${baseClasses} bg-gray-800 border-gray-600 opacity-50`;
      case 'locked':
      default:
        return `${baseClasses} bg-gray-900 border-gray-700 opacity-40`;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">30-Day Rewards Calendar</h2>
              <p className="text-purple-100 mt-1">
                Login daily to unlock progressive rewards
              </p>
              {progress && (
                <p className="text-white mt-2 font-semibold">
                  Day {progress.currentDay} of 30 • {progress.calendarResets} cycles completed
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mx-6 mt-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-100 text-center">
            {notification}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-4">Loading calendar...</p>
            </div>
          ) : (
            <>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-700 to-purple-700 border-2 border-blue-400 rounded"></div>
                  <span className="text-gray-300 text-sm">Available to claim</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700 border-2 border-gray-600 rounded opacity-60"></div>
                  <span className="text-gray-300 text-sm">Claimed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-700 to-pink-700 border-2 border-purple-400 rounded"></div>
                  <span className="text-gray-300 text-sm">Special Milestone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-900 border-2 border-gray-700 rounded opacity-40"></div>
                  <span className="text-gray-300 text-sm">Locked</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
                {calendar.map((reward) => {
                  const status = getDayStatus(reward.dayNumber);

                  return (
                    <button
                      key={reward.dayNumber}
                      onClick={() =>
                        status === 'available' && handleClaimReward(reward.dayNumber)
                      }
                      disabled={status !== 'available' || claimingDay !== null}
                      className={getDayClasses(reward)}
                    >
                      {/* Day Number */}
                      <div className="text-xs text-gray-300 font-bold mb-1">
                        Day {reward.dayNumber}
                      </div>

                      {/* Icon */}
                      <div className="text-2xl mb-1">{reward.icon}</div>

                      {/* Description */}
                      <div className="text-xs text-gray-300 text-center leading-tight">
                        {reward.description}
                      </div>

                      {/* Status Indicator */}
                      {status === 'claimed' && (
                        <div className="absolute top-1 right-1 text-green-400">✓</div>
                      )}
                      {status === 'available' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                      {reward.isSpecial && (
                        <div className="absolute -top-1 -left-1 text-yellow-400">⭐</div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Special Milestones Info */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700 rounded-lg">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <span>⭐</span>
                  Special Milestone Rewards
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="text-purple-200">
                    <span className="font-semibold">Day 7:</span> 50 coins + card back
                  </div>
                  <div className="text-purple-200">
                    <span className="font-semibold">Day 14:</span> 100 coins + title
                  </div>
                  <div className="text-purple-200">
                    <span className="font-semibold">Day 21:</span> 150 coins + badge
                  </div>
                  <div className="text-purple-200">
                    <span className="font-semibold">Day 30:</span> 500 coins + exclusive
                    rewards!
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-700 p-4 rounded-b-lg border-t border-gray-600">
          <p className="text-gray-400 text-sm text-center">
            🔁 Calendar resets every 30 days • Login daily to maximize rewards
          </p>
        </div>
      </div>
    </div>
  );
}
