/**
 * Rewards Calendar Component
 * Sprint 19: Daily Engagement System
 *
 * 30-day progressive rewards calendar with special milestones
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Modal, UICard, Spinner, Button } from './ui';

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
  const [notification, setNotification] = useState<{ message: string; isError: boolean } | null>(null);

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

      setNotification({ message: `Day ${data.dayNumber} claimed: ${rewardText.join(', ')}!`, isError: false });
      setTimeout(() => setNotification(null), 5000);
      setClaimingDay(null);
    };

    // Listen for errors (e.g., claiming wrong day, already claimed)
    const handleError = (data: { message: string }) => {
      setNotification({ message: data.message, isError: true });
      setTimeout(() => setNotification(null), 5000);
      setClaimingDay(null);
    };

    socket.on('daily_calendar', handleDailyCalendar);
    socket.on('calendar_progress', handleCalendarProgress);
    socket.on('calendar_reward_claimed', handleCalendarRewardClaimed);
    socket.on('error', handleError);

    return () => {
      socket.off('daily_calendar', handleDailyCalendar);
      socket.off('calendar_progress', handleCalendarProgress);
      socket.off('calendar_reward_claimed', handleCalendarRewardClaimed);
      socket.off('error', handleError);
    };
  }, [socket, playerName]);

  const handleClaimReward = (dayNumber: number) => {
    if (!socket || claimingDay || !progress) return;

    // Check if already claimed
    if (progress.rewardsClaimed.includes(dayNumber)) {
      setNotification({ message: 'Already claimed!', isError: true });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Only allow claiming TODAY's reward (currentDay is calculated server-side based on elapsed days)
    if (dayNumber !== progress.currentDay) {
      if (dayNumber > progress.currentDay) {
        setNotification({ message: 'Cannot claim future rewards!', isError: true });
      } else {
        setNotification({ message: 'This reward has expired. You can only claim today\'s reward.', isError: true });
      }
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setClaimingDay(dayNumber);
    socket.emit('claim_calendar_reward', { playerName, dayNumber });
  };

  const getDayStatus = (dayNumber: number) => {
    if (!progress) return 'locked';

    if (progress.rewardsClaimed.includes(dayNumber)) return 'claimed';
    // Only TODAY's day is available (currentDay is calculated based on days since start)
    if (dayNumber === progress.currentDay) return 'available';
    // Past days that weren't claimed are missed
    if (dayNumber < progress.currentDay) return 'missed';
    return 'locked';
  };

  const getDayClasses = (reward: CalendarReward) => {
    const status = getDayStatus(reward.dayNumber);

    const baseClasses =
      'relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all';

    if (reward.isSpecial) {
      if (status === 'claimed') {
        return `${baseClasses} bg-gradient-to-br from-gray-600 to-gray-800 border-purple-500 opacity-60`;
      }
      if (status === 'available') {
        return `${baseClasses} bg-gradient-to-br from-gray-500 to-gray-700 border-purple-400 cursor-pointer hover:scale-105 shadow-lg shadow-purple-500/50 animate-pulse`;
      }
      return `${baseClasses} bg-gradient-to-br from-gray-600 to-gray-800 border-purple-700/50`;
    }

    switch (status) {
      case 'claimed':
        return `${baseClasses} bg-gray-700 border-gray-600 opacity-60`;
      case 'available':
        return `${baseClasses} bg-gradient-to-br from-purple-600 to-indigo-700 border-blue-400 cursor-pointer hover:scale-105 shadow-lg`;
      case 'missed':
        return `${baseClasses} bg-gray-800 border-gray-600 opacity-50`;
      case 'locked':
      default:
        return `${baseClasses} bg-gray-900 border-gray-700 opacity-40`;
    }
  };

  // Generate subtitle with progress info
  const subtitle = progress
    ? `Day ${progress.currentDay} of 30 • ${progress.calendarResets} cycles completed`
    : 'Login daily to unlock progressive rewards';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="30-Day Rewards Calendar"
      subtitle={subtitle}
      icon="📅"
      theme="purple"
      size="xl"
      testId="rewards-calendar-modal"
    >
      {/* Notification */}
      {notification && (
        <div className="mb-4">
          <UICard variant="gradient" gradient={notification.isError ? 'error' : 'success'} size="sm" className="text-center">
            <p className="text-white">{notification.message}</p>
          </UICard>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-400 mt-4">Loading calendar...</p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <UICard variant="default" size="sm" className="mb-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-indigo-700 border-2 border-blue-400 rounded"></div>
                <span className="text-gray-300 text-sm">Available to claim</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700 border-2 border-gray-600 rounded opacity-60"></div>
                <span className="text-gray-300 text-sm">Claimed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-gray-500 to-gray-700 border-2 border-purple-400 rounded"></div>
                <span className="text-gray-300 text-sm">Special Milestone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-900 border-2 border-gray-700 rounded opacity-40"></div>
                <span className="text-gray-300 text-sm">Locked</span>
              </div>
            </div>
          </UICard>

          {/* Calendar Grid */}
          <div className="grid grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
            {calendar.map((reward) => {
              const status = getDayStatus(reward.dayNumber);

              return (
                <Button
                  key={reward.dayNumber}
                  onClick={() =>
                    status === 'available' && handleClaimReward(reward.dayNumber)
                  }
                  disabled={status !== 'available' || claimingDay !== null}
                  variant="ghost"
                  size="md"
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
                </Button>
              );
            })}
          </div>

          {/* Special Milestones Info */}
          <UICard variant="gradient" gradient="team2" size="md" className="mt-6">
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
          </UICard>
        </>
      )}

      {/* Footer Note */}
      <p className="text-gray-400 text-sm text-center mt-6 pt-4 border-t border-gray-600">
        Calendar resets every 30 days • Login daily to maximize rewards
      </p>
    </Modal>
  );
}
