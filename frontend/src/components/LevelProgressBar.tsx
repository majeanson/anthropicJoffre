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

  // Get level tier styling based on level
  const levelTier = useMemo(() => {
    if (level >= 50) return { color: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/50', name: 'Legendary' };
    if (level >= 40) return { color: 'from-yellow-400 to-orange-500', glow: 'shadow-yellow-500/50', name: 'Master' };
    if (level >= 30) return { color: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/50', name: 'Expert' };
    if (level >= 20) return { color: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-500/50', name: 'Veteran' };
    if (level >= 10) return { color: 'from-blue-400 to-indigo-500', glow: 'shadow-blue-500/50', name: 'Skilled' };
    if (level >= 5) return { color: 'from-slate-400 to-slate-500', glow: 'shadow-slate-500/50', name: 'Apprentice' };
    return { color: 'from-amber-600 to-amber-700', glow: 'shadow-amber-600/50', name: 'Beginner' };
  }, [level]);

  // Level badge component
  const LevelBadge = () => (
    <div
      className={`
        relative flex items-center justify-center
        ${compact ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-lg'}
        rounded-full font-bold text-white
        bg-gradient-to-br ${levelTier.color}
        shadow-lg ${levelTier.glow}
        ${animate ? 'transition-all duration-300' : ''}
      `}
      title={`Level ${level} - ${levelTier.name}`}
    >
      <span className="relative z-10">{level}</span>
      {/* Animated glow ring for high levels */}
      {level >= 10 && (
        <div
          className={`
            absolute inset-0 rounded-full
            bg-gradient-to-br ${levelTier.color}
            opacity-50 blur-sm
            ${animate ? 'animate-pulse' : ''}
          `}
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
              font-semibold
              ${compact ? 'text-xs' : 'text-sm'}
            `}
            style={{ color: 'var(--color-text-primary)' }}
          >
            Level {level}
            {!compact && (
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {levelTier.name}
              </span>
            )}
          </span>
          <span
            className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>

        {/* Progress bar */}
        <div
          className={`
            relative overflow-hidden rounded-full
            ${compact ? 'h-2' : 'h-3'}
          `}
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          <div
            className={`
              absolute inset-y-0 left-0 rounded-full
              bg-gradient-to-r ${levelTier.color}
              ${animate ? 'transition-all duration-500 ease-out' : ''}
            `}
            style={{ width: `${progressPercent}%` }}
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
          <div
            className="mt-1 text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Total: {totalXP.toLocaleString()} XP
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LevelBadgeInline - A small inline level badge for use in player names
 */
export function LevelBadgeInline({ level }: { level: number }) {
  const tierColor = useMemo(() => {
    if (level >= 50) return 'from-purple-500 to-pink-500';
    if (level >= 40) return 'from-yellow-400 to-orange-500';
    if (level >= 30) return 'from-cyan-400 to-blue-500';
    if (level >= 20) return 'from-emerald-400 to-green-500';
    if (level >= 10) return 'from-blue-400 to-indigo-500';
    if (level >= 5) return 'from-slate-400 to-slate-500';
    return 'from-amber-600 to-amber-700';
  }, [level]);

  return (
    <span
      className={`
        inline-flex items-center justify-center
        w-5 h-5 text-[10px] font-bold text-white
        rounded-full bg-gradient-to-br ${tierColor}
        shadow-sm
      `}
      title={`Level ${level}`}
    >
      {level}
    </span>
  );
}

// Add keyframes for shimmer animation in your global CSS or add:
// @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
