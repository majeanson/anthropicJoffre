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
  children,
}: PlayerNameButtonProps) {
  // Variant-specific styles that extend Button's link/ghost variants
  // Use CSS variables for theme-adaptive colors
  const variantStyles = {
    inline: 'text-[var(--color-text-accent)] hover:opacity-80 hover:underline font-semibold !p-0',
    badge:
      'px-2 py-1 bg-[var(--color-text-accent)]/20 hover:bg-[var(--color-text-accent)]/30 text-[var(--color-text-accent)] hover:opacity-80 border border-[var(--color-text-accent)]/30 rounded-lg font-semibold',
    plain: 'text-[var(--color-text-primary)] hover:text-[var(--color-text-accent)] !p-0',
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
