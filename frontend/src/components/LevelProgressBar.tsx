/**
 * LevelProgressBar Component
 *
 * Sprint 20: Player Progression System
 *
 * Displays player level and XP progress with:
 * - Level badge with animated glow
 * - Horizontal XP progress bar
 * - XP numbers (current/needed)
 * - Animated fill on XP gain
 */

import { useMemo } from 'react';

export interface LevelProgressBarProps {
  /** Current player level */
  level: number;
  /** XP accumulated in current level */
  currentLevelXP: number;
  /** XP needed to reach next level */
  nextLevelXP: number;
  /** Total lifetime XP (optional, for display) */
  totalXP?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Show level badge only (no progress bar) */
  badgeOnly?: boolean;
  /** Animate progress changes */
  animate?: boolean;
}

export function LevelProgressBar({
  level,
  currentLevelXP,
  nextLevelXP,
  totalXP,
  compact = false,
  badgeOnly = false,
  animate = true,
}: LevelProgressBarProps) {
  const progressPercent = useMemo(() => {
    if (nextLevelXP === 0) return 100;
    return Math.min(100, (currentLevelXP / nextLevelXP) * 100);
  }, [currentLevelXP, nextLevelXP]);

  // Get level tier styling based on level - using inline CSS colors for proper rendering
  // Dynamic Tailwind classes don't work at runtime, so we use inline styles
  const levelTier = useMemo(() => {
    if (level >= 50)
      return {
        gradient: 'linear-gradient(to bottom right, #a855f7, #ec4899)',
        glowColor: 'rgba(168, 85, 247, 0.5)',
        name: 'Legendary',
      };
    if (level >= 40)
      return {
        gradient: 'linear-gradient(to bottom right, #facc15, #f97316)',
        glowColor: 'rgba(234, 179, 8, 0.5)',
        name: 'Master',
      };
    if (level >= 30)
      return {
        gradient: 'linear-gradient(to bottom right, #22d3ee, #3b82f6)',
        glowColor: 'rgba(34, 211, 238, 0.5)',
        name: 'Expert',
      };
    if (level >= 20)
      return {
        gradient: 'linear-gradient(to bottom right, #34d399, #22c55e)',
        glowColor: 'rgba(52, 211, 153, 0.5)',
        name: 'Veteran',
      };
    if (level >= 10)
      return {
        gradient: 'linear-gradient(to bottom right, #60a5fa, #6366f1)',
        glowColor: 'rgba(96, 165, 250, 0.5)',
        name: 'Skilled',
      };
    if (level >= 5)
      return {
        gradient: 'linear-gradient(to bottom right, #94a3b8, #64748b)',
        glowColor: 'rgba(148, 163, 184, 0.5)',
        name: 'Apprentice',
      };
    return {
      gradient: 'linear-gradient(to bottom right, #d97706, #b45309)',
      glowColor: 'rgba(217, 119, 6, 0.5)',
      name: 'Beginner',
    };
  }, [level]);

  // Level badge component
  const LevelBadge = () => (
    <div
      className={`
        relative flex items-center justify-center
        ${compact ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-lg'}
        rounded-full font-bold text-white
        ${animate ? 'transition-all duration-300' : ''}
      `}
      style={{
        background: levelTier.gradient,
        boxShadow: `0 10px 15px -3px ${levelTier.glowColor}, 0 4px 6px -4px ${levelTier.glowColor}`,
      }}
      title={`Level ${level} - ${levelTier.name}`}
    >
      <span className="relative z-10">{level}</span>
      {/* Animated glow ring for high levels */}
      {level >= 10 && (
        <div
          className={`
            absolute inset-0 rounded-full
            opacity-50 blur-sm
            ${animate ? 'animate-pulse' : ''}
          `}
          style={{ background: levelTier.gradient }}
        />
      )}
    </div>
  );

  // Badge only mode
  if (badgeOnly) {
    return <LevelBadge />;
  }

  // Full progress bar mode
  return (
    <div className={`flex items-center gap-3 ${compact ? 'gap-2' : 'gap-3'}`}>
      <LevelBadge />

      <div className="flex-1 min-w-0">
        {/* Level label and XP */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={`
              font-semibold text-skin-primary
              ${compact ? 'text-xs' : 'text-sm'}
            `}
          >
            Level {level}
            {!compact && (
              <span className="ml-2 text-xs font-normal text-skin-muted">{levelTier.name}</span>
            )}
          </span>
          <span className={`font-medium text-skin-secondary ${compact ? 'text-xs' : 'text-sm'}`}>
            {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>

        {/* Progress bar */}
        <div
          className={`
            relative overflow-hidden rounded-full bg-skin-tertiary
            ${compact ? 'h-2' : 'h-3'}
          `}
        >
          <div
            className={`
              absolute inset-y-0 left-0 rounded-full
              ${animate ? 'transition-all duration-500 ease-out' : ''}
            `}
            style={{
              width: `${progressPercent}%`,
              background: levelTier.gradient.replace('to bottom right', 'to right'),
            }}
          />
          {/* Animated shimmer effect */}
          {animate && progressPercent > 0 && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              style={{
                width: '50%',
                animation: 'shimmer 2s infinite',
                transform: 'translateX(-100%)',
              }}
            />
          )}
        </div>

        {/* Total XP (optional) */}
        {totalXP !== undefined && !compact && (
          <div className="mt-1 text-xs text-skin-muted">Total: {totalXP.toLocaleString()} XP</div>
        )}
      </div>
    </div>
  );
}

/**
 * LevelBadgeInline - A small inline level badge for use in player names
 */
export function LevelBadgeInline({ level }: { level: number }) {
  const tierStyle = useMemo(() => {
    if (level >= 50) return { gradient: 'linear-gradient(to bottom right, #a855f7, #ec4899)' };
    if (level >= 40) return { gradient: 'linear-gradient(to bottom right, #facc15, #f97316)' };
    if (level >= 30) return { gradient: 'linear-gradient(to bottom right, #22d3ee, #3b82f6)' };
    if (level >= 20) return { gradient: 'linear-gradient(to bottom right, #34d399, #22c55e)' };
    if (level >= 10) return { gradient: 'linear-gradient(to bottom right, #60a5fa, #6366f1)' };
    if (level >= 5) return { gradient: 'linear-gradient(to bottom right, #94a3b8, #64748b)' };
    return { gradient: 'linear-gradient(to bottom right, #d97706, #b45309)' };
  }, [level]);

  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white rounded-full shadow-sm"
      style={{ background: tierStyle.gradient }}
      title={`Level ${level}`}
    >
      {level}
    </span>
  );
}

// Add keyframes for shimmer animation in your global CSS or add:
// @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
