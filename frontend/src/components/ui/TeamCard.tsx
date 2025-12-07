/**
 * TeamCard Component
 * Storybook UI Component
 *
 * Team-colored card container that automatically applies team colors.
 * Eliminates repetitive ternary operators for team-based styling.
 *
 * Features:
 * - Automatic team color application (team1 = orange, team2 = purple)
 * - 3 variants: solid, subtle, outlined
 * - Dark mode support
 * - Composable with other UI components
 *
 * Usage:
 * ```tsx
 * <TeamCard teamId={1} variant="subtle">
 *   Player content here
 * </TeamCard>
 *
 * <TeamCard teamId={2} variant="solid" className="p-4">
 *   Team 2 content
 * </TeamCard>
 * ```
 */

import { ReactNode } from 'react';

export type TeamId = 1 | 2;
export type TeamCardVariant = 'solid' | 'subtle' | 'outlined';
export type TeamCardSize = 'sm' | 'md' | 'lg';

export interface TeamCardProps {
  /** Team ID (1 = orange, 2 = purple) */
  teamId: TeamId;
  /** Card variant */
  variant?: TeamCardVariant;
  /** Card size */
  size?: TeamCardSize;
  /** Card content */
  children: ReactNode;
  /** Additional classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the card is selected/highlighted */
  selected?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
}

const teamColors: Record<
  TeamId,
  {
    solid: string;
    subtle: string;
    outlined: string;
    selectedRing: string;
  }
> = {
  1: {
    solid: 'bg-orange-600 text-white border-orange-700',
    subtle:
      'bg-orange-100/50 text-orange-100 border-orange-700',
    outlined:
      'bg-transparent text-orange-300 border-orange-600',
    selectedRing:
      'ring-2 ring-orange-500 ring-offset-2 ring-offset-skin-primary',
  },
  2: {
    solid: 'bg-purple-600 text-white border-purple-700',
    subtle:
      'bg-purple-100/50 text-purple-100 border-purple-700',
    outlined:
      'bg-transparent text-purple-300 border-purple-600',
    selectedRing:
      'ring-2 ring-purple-500 ring-offset-2 ring-offset-skin-primary',
  },
};

const sizeClasses: Record<TeamCardSize, string> = {
  sm: 'p-2 rounded-md',
  md: 'p-3 rounded-lg',
  lg: 'p-4 rounded-xl',
};

export function TeamCard({
  teamId,
  variant = 'subtle',
  size = 'md',
  children,
  className = '',
  onClick,
  selected = false,
  disabled = false,
}: TeamCardProps) {
  const colorStyle = teamColors[teamId][variant];
  const sizeStyle = sizeClasses[size];
  const selectedStyle = selected ? teamColors[teamId].selectedRing : '';
  const isClickable = !!onClick && !disabled;

  return (
    <div
      className={`
        border-2
        transition-all duration-200
        ${colorStyle}
        ${sizeStyle}
        ${selectedStyle}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isClickable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

/**
 * TeamBadge Component
 * Small team-colored badge/pill
 */
export interface TeamBadgeProps {
  teamId: TeamId;
  children: ReactNode;
  className?: string;
}

export function TeamBadge({ teamId, children, className = '' }: TeamBadgeProps) {
  const bgColor =
    teamId === 1 ? 'bg-orange-600' : 'bg-purple-600';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5
        text-xs font-bold text-white
        rounded-full
        ${bgColor}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

/**
 * TeamIndicator Component
 * Small colored dot indicator for team
 */
export interface TeamIndicatorProps {
  teamId: TeamId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TeamIndicator({ teamId, size = 'md', className = '' }: TeamIndicatorProps) {
  const bgColor =
    teamId === 1 ? 'bg-orange-400' : 'bg-purple-400';

  const sizeClass = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`
        inline-block rounded-full
        ${bgColor}
        ${sizeClass}
        ${className}
      `}
      aria-label={`Team ${teamId}`}
    />
  );
}
