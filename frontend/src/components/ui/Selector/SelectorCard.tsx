/**
 * SelectorCard Component
 *
 * Reusable card component for selection grids (skins, card skins, avatars, etc.)
 * Provides consistent lock overlay, selection state, and accessibility features.
 *
 * @example
 * <SelectorCard
 *   isSelected={selectedId === item.id}
 *   isLocked={item.requiredLevel > playerLevel}
 *   lockInfo={{ level: item.requiredLevel, currentLevel: playerLevel }}
 *   onSelect={() => handleSelect(item.id)}
 * >
 *   <YourCustomPreview item={item} />
 * </SelectorCard>
 */

import { ReactNode, useState, useEffect } from 'react';

export interface SelectorCardLockInfo {
  /** Required level to unlock */
  level: number;
  /** Current player level */
  currentLevel?: number;
  /** Custom lock message (overrides default) */
  message?: string;
}

export interface SelectorCardProps {
  /** Whether this card is currently selected */
  isSelected: boolean;
  /** Whether this card is locked */
  isLocked?: boolean;
  /** Lock information for display */
  lockInfo?: SelectorCardLockInfo;
  /** Callback when card is selected */
  onSelect: () => void;
  /** Content to render inside the card */
  children: ReactNode;
  /** Optional badge content (e.g., "Premium", "New") */
  badge?: ReactNode;
  /** Show selection animation */
  showSelectAnimation?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the card */
  ariaLabel?: string;
}

export function SelectorCard({
  isSelected,
  isLocked = false,
  lockInfo,
  onSelect,
  children,
  badge,
  showSelectAnimation = false,
  className = '',
  ariaLabel,
}: SelectorCardProps) {
  const [showFlash, setShowFlash] = useState(false);

  // Trigger flash animation when showSelectAnimation changes to true
  useEffect(() => {
    if (showSelectAnimation) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [showSelectAnimation]);

  const levelsToUnlock = lockInfo?.currentLevel
    ? lockInfo.level - lockInfo.currentLevel
    : undefined;

  return (
    <button
      onClick={() => !isLocked && onSelect()}
      disabled={isLocked}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={`
        relative
        w-full
        p-4
        rounded-[var(--radius-lg)]
        border-2
        transition-all duration-200
        text-left
        ${
          isLocked
            ? 'opacity-60 cursor-not-allowed border-skin-default'
            : isSelected
              ? 'border-skin-text-accent shadow-[0_0_20px_var(--color-glow)] scale-[1.02]'
              : 'border-skin-default hover:border-skin-accent hover:scale-[1.01]'
        }
        bg-skin-secondary
        focus-visible:outline-none
        focus-visible:ring-3
        focus-visible:ring-skin-text-accent
        overflow-hidden
        ${className}
      `}
    >
      {/* Selection flash overlay */}
      {showFlash && (
        <div
          className="absolute inset-0 z-20 pointer-events-none rounded-[var(--radius-lg)]"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
            animation: 'selectorFlash 0.6s ease-out forwards',
          }}
        />
      )}

      {/* Lock overlay */}
      {isLocked && lockInfo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-black/50 z-10">
          <span className="text-3xl mb-1">🔒</span>
          {lockInfo.message ? (
            <p className="text-sm text-white font-medium text-center px-2">{lockInfo.message}</p>
          ) : (
            <>
              <p className="text-sm text-white font-bold">Level {lockInfo.level}</p>
              {levelsToUnlock !== undefined && levelsToUnlock > 0 && (
                <p className="text-xs text-white/70 mt-0.5">
                  {levelsToUnlock} level{levelsToUnlock !== 1 ? 's' : ''} to unlock
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Badge (top-left) */}
      {badge && !isLocked && <div className="absolute top-2 left-2 z-10">{badge}</div>}

      {/* Selected indicator (top-right) */}
      {isSelected && !isLocked && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-skin-status-success flex items-center justify-center z-10">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Card content */}
      {children}
    </button>
  );
}

export default SelectorCard;
