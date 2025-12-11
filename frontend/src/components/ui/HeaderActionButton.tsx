/**
 * HeaderActionButton Component
 *
 * Specialized button for game header actions with icon, optional label, and notification badge.
 * Uses the translucent glassmorphism style consistent with game headers.
 *
 * Features:
 * - Icon + optional text label (responsive - label hidden on mobile)
 * - Notification badge support
 * - Translucent backdrop-blur style
 * - Dark mode support
 * - Responsive sizing
 *
 * Usage:
 * ```tsx
 * <HeaderActionButton
 *   icon="💬"
 *   label="Chat"
 *   onClick={onOpenChat}
 *   badgeCount={unreadCount}
 *   testId="header-chat-button"
 * />
 * ```
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { UIBadge } from './UIBadge';

export type HeaderActionButtonSize = 'sm' | 'md';

export interface HeaderActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** Icon element (emoji or React node) */
  icon: ReactNode;
  /** Optional label text (hidden on mobile, shown on desktop) */
  label?: string;
  /** Badge count for notifications (0 or undefined = hidden) */
  badgeCount?: number;
  /** Button size */
  size?: HeaderActionButtonSize;
  /** Test ID for e2e testing */
  testId?: string;
  /** Additional custom classes */
  className?: string;
  /** Accessible label for screen readers (uses label or title as fallback) */
  'aria-label'?: string;
}

const sizeClasses: Record<HeaderActionButtonSize, { button: string; icon: string; label: string }> =
  {
    sm: {
      // Minimum 44x44px touch target for WCAG compliance
      button: 'p-2 min-w-[44px] min-h-[44px]',
      icon: 'text-base',
      label: 'text-xs',
    },
    md: {
      // Minimum 44x44px touch target for WCAG compliance
      button: 'p-2.5 min-w-[44px] min-h-[44px] md:px-3 md:py-2',
      icon: 'text-lg md:text-xl',
      label: 'text-sm',
    },
  };

export function HeaderActionButton({
  icon,
  label,
  badgeCount,
  size = 'md',
  testId,
  className = '',
  disabled = false,
  'aria-label': ariaLabel,
  title,
  ...props
}: HeaderActionButtonProps) {
  const classes = sizeClasses[size];
  const showBadge = badgeCount !== undefined && badgeCount > 0;

  // Use aria-label, or fall back to label or title for accessibility
  const accessibleLabel = ariaLabel || label || title;

  return (
    <button
      className={`
        relative
        bg-black/30 hover:bg-black/40
        rounded
        backdrop-blur-sm
        transition-all duration-200
        border border-skin-default
        flex items-center gap-1.5
        ${classes.button}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      data-testid={testId}
      disabled={disabled}
      aria-label={accessibleLabel}
      title={title}
      {...props}
    >
      <span className={classes.icon}>{icon}</span>
      {label && (
        <span
          className={`hidden md:inline text-skin-primary font-semibold ${classes.label}`}
        >
          {label}
        </span>
      )}
      {showBadge && (
        <UIBadge
          variant="solid"
          color="error"
          size="xs"
          shape="pill"
          pulse
          className="absolute -top-1 -right-1 z-50 min-w-[16px] h-4 flex items-center justify-center"
        >
          {badgeCount}
        </UIBadge>
      )}
    </button>
  );
}
