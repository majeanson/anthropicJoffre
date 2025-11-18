/**
 * PlayerNameButton Component
 * Sprint 16 Task 3.2
 *
 * Clickable player name component that opens PlayerProfileModal.
 * Use this component anywhere you display player names to make them interactive.
 *
 * Features:
 * - Hover effects
 * - Optional styling variants (inline, badge, etc.)
 * - Opens PlayerProfileModal on click
 * - Accessible with keyboard navigation
 *
 * Usage:
 * ```tsx
 * <PlayerNameButton
 *   playerName="Alice"
 *   onClick={() => openProfile("Alice")}
 *   variant="inline"
 * />
 * ```
 */

import { ReactNode } from 'react';

interface PlayerNameButtonProps {
  playerName: string;
  onClick: () => void;
  variant?: 'inline' | 'badge' | 'plain';
  className?: string;
  children?: ReactNode; // Optional: render custom content instead of playerName
}

export function PlayerNameButton({
  playerName,
  onClick,
  variant = 'inline',
  className = '',
  children
}: PlayerNameButtonProps) {
  // Base styles for all variants
  const baseStyles = 'cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50 rounded';

  // Variant-specific styles
  const variantStyles = {
    inline: 'text-orange-400 hover:text-orange-300 hover:underline font-semibold',
    badge: 'px-2 py-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded-lg font-semibold',
    plain: 'text-white hover:text-orange-400'
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent click handlers
        onClick();
      }}
      className={combinedClassName}
      title={`View ${playerName}'s profile`}
      aria-label={`View ${playerName}'s profile`}
    >
      {children || playerName}
    </button>
  );
}
