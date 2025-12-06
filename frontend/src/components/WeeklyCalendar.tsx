/**
 * WeeklyCalendar Component
 *
 * Sprint 20: Weekly Rewards Calendar
 *
 * 7-day calendar (Mon-Sun) for daily login rewards:
 * - Shows all 7 days in a row
 * - Today's reward is claimable (glowing)
 * - Past days show claimed (green check) or missed (faded)
 * - Future days are locked (gray)
 * - Sunday is the special big reward day
 */

import { useState } from 'react';

export interface WeeklyCalendarDay {
  dayNumber: number;
  dayName: string;
  rewardXp: number;
  rewardCurrency: number;
  isSpecial: boolean;
  icon: string;
}

export interface WeeklyCalendarProps {
  /** Calendar template (7 days) */
  calendar: WeeklyCalendarDay[];
  /** Days already claimed (array of day numbers 1-7) */
  daysClaimed: number[];
  /** Current day of week (1=Monday, 7=Sunday) */
  currentDayOfWeek: number;
  /** Callback when claiming today's reward */
  onClaimReward: (dayNumber: number) => void;
  /** Loading state while claiming */
  isLoading?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

type DayStatus = 'claimed' | 'available' | 'missed' | 'locked';

export function WeeklyCalendar({
  calendar,
  daysClaimed,
  currentDayOfWeek,
  onClaimReward,
  isLoading = false,
  compact = false,
}: WeeklyCalendarProps) {
  const [claimingDay, setClaimingDay] = useState<number | null>(null);

  const getDayStatus = (dayNumber: number): DayStatus => {
    if (daysClaimed.includes(dayNumber)) return 'claimed';
    if (dayNumber === currentDayOfWeek) return 'available';
    if (dayNumber < currentDayOfWeek) return 'missed';
    return 'locked';
  };

  const handleClaim = async (dayNumber: number) => {
    setClaimingDay(dayNumber);
    await onClaimReward(dayNumber);
    setClaimingDay(null);
  };

  const getStatusStyles = (status: DayStatus, isSpecial: boolean) => {
    const base = 'rounded-lg transition-all duration-200';

    switch (status) {
      case 'claimed':
        return `${base} bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500`;
      case 'available':
        return `${base} bg-gradient-to-br ${
          isSpecial
            ? 'from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400 shadow-lg shadow-yellow-500/30'
            : 'from-blue-500/20 to-indigo-500/20 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
        } cursor-pointer hover:scale-105 active:scale-95`;
      case 'missed':
        return `${base} bg-gray-500/10 border border-gray-500/30 opacity-50`;
      case 'locked':
        return `${base} bg-gray-500/10 border border-gray-500/20 opacity-60`;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-skin-primary">Weekly Rewards</h3>
        <span className="text-sm text-skin-muted">{daysClaimed.length}/7 claimed</span>
      </div>

      {/* Calendar grid */}
      <div className={`grid grid-cols-7 gap-2 ${compact ? 'gap-1' : 'gap-2'}`}>
        {calendar.map((day) => {
          const status = getDayStatus(day.dayNumber);
          const isClaimable = status === 'available';
          const isClaiming = claimingDay === day.dayNumber;

          return (
            <button
              key={day.dayNumber}
              onClick={() => isClaimable && !isLoading && handleClaim(day.dayNumber)}
              disabled={!isClaimable || isLoading}
              className={`
                flex flex-col items-center p-2
                ${compact ? 'p-1.5' : 'p-2 sm:p-3'}
                ${getStatusStyles(status, day.isSpecial)}
                ${isClaimable && !isLoading ? '' : 'cursor-default'}
              `}
            >
              {/* Day name */}
              <span
                className={`font-medium text-skin-secondary ${compact ? 'text-[10px]' : 'text-xs'}`}
              >
                {compact ? day.dayName.slice(0, 1) : day.dayName.slice(0, 3)}
              </span>

              {/* Icon/Status */}
              <div className={`my-1 ${compact ? 'text-lg' : 'text-2xl'}`}>
                {status === 'claimed' ? (
                  <span className="text-green-500">✓</span>
                ) : status === 'missed' ? (
                  <span className="text-gray-400">—</span>
                ) : isClaiming ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <span className={isClaimable ? 'animate-bounce' : ''}>{day.icon}</span>
                )}
              </div>

              {/* Rewards */}
              <div
                className={`flex flex-col items-center text-skin-muted ${compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
              >
                <span>+{day.rewardXp} XP</span>
                {!compact && <span>+{day.rewardCurrency} 💰</span>}
              </div>

              {/* Special day indicator */}
              {day.isSpecial && (
                <span
                  className={`
                    mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold
                    bg-gradient-to-r from-yellow-400 to-orange-500 text-white
                  `}
                >
                  BONUS
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Today indicator */}
      <div className="mt-3 text-center text-sm text-skin-muted">
        {getDayStatus(currentDayOfWeek) === 'available' ? (
          <span className="text-blue-400">
            Claim today's reward! ({calendar.find((d) => d.dayNumber === currentDayOfWeek)?.dayName}
            )
          </span>
        ) : getDayStatus(currentDayOfWeek) === 'claimed' ? (
          <span className="text-green-400">Today's reward claimed!</span>
        ) : null}
      </div>

      {/* Info text */}
      <p className="mt-2 text-xs text-center text-skin-muted">
        Log in each day to claim rewards. Missed days cannot be recovered.
      </p>
    </div>
  );
}

/**
 * WeeklyCalendarCompact - Ultra-compact version for sidebar/header
 */
export function WeeklyCalendarCompact({
  daysClaimed,
  currentDayOfWeek,
  onOpenFull,
}: {
  daysClaimed: number[];
  currentDayOfWeek: number;
  onOpenFull: () => void;
}) {
  const hasUnclaimedToday = !daysClaimed.includes(currentDayOfWeek);

  return (
    <button
      onClick={onOpenFull}
      className={`
        relative flex items-center gap-2 px-3 py-1.5 rounded-full
        transition-all hover:scale-105 text-skin-primary
        ${
          hasUnclaimedToday
            ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400'
            : 'bg-gray-500/10 border border-gray-500/30'
        }
      `}
    >
      <span className="text-sm">📅</span>
      <span className="text-xs font-medium">{daysClaimed.length}/7</span>
      {hasUnclaimedToday && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
      )}
    </button>
  );
}
