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
import { Button } from './ui';

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
  // Variant-specific styles that extend Button's link/ghost variants
  const variantStyles = {
    inline: 'text-orange-400 hover:text-orange-300 hover:underline font-semibold !p-0',
    badge: 'px-2 py-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded-lg font-semibold',
    plain: 'text-white hover:text-orange-400 !p-0'
  };

  // Map PlayerNameButton variants to Button variants
  const buttonVariant = variant === 'badge' ? 'ghost' : 'link';

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent click handlers
        onClick();
      }}
      variant={buttonVariant}
      size="sm"
      className={`${variantStyles[variant]} ${className}`}
      title={`View ${playerName}'s profile`}
      aria-label={`View ${playerName}'s profile`}
    >
      {children || playerName}
    </Button>
  );
}
