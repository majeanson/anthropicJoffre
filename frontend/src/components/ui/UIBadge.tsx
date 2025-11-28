/**
 * UIBadge Component
 * Sprint 21 - Reusable badge/tag component
 *
 * A flexible badge component for labels, status indicators, and tags.
 * Supports multiple variants (solid, outline, subtle, translucent), colors, sizes, and features.
 *
 * @example
 * ```tsx
 * <UIBadge color="success" variant="solid">Active</UIBadge>
 * ```
 *
 * @example With icon
 * ```tsx
 * <UIBadge color="warning" icon={<AlertIcon />}>Warning</UIBadge>
 * ```
 *
 * @example Pulsing status indicator
 * ```tsx
 * <UIBadge color="success" pulse>Online</UIBadge>
 * ```
 */

import React, { ReactNode } from 'react';

export type UIBadgeVariant = 'solid' | 'outline' | 'subtle' | 'translucent';
export type UIBadgeColor =
  | 'team1'
  | 'team2'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gray'
  | 'primary';
export type UIBadgeSize = 'xs' | 'sm' | 'md';
export type UIBadgeShape = 'rounded' | 'pill';

export interface UIBadgeProps {
  /** Visual style variant */
  variant?: UIBadgeVariant;
  /** Color scheme */
  color?: UIBadgeColor;
  /** Badge size */
  size?: UIBadgeSize;
  /** Shape style */
  shape?: UIBadgeShape;
  /** Optional icon (displayed left of text) */
  icon?: ReactNode;
  /** Enable pulse animation (for status indicators) */
  pulse?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Badge content */
  children: ReactNode;
}

/**
 * UIBadge - Flexible badge component for labels and status indicators
 *
 * Variants:
 * - solid: Full background color, white/light text
 * - outline: Border only, colored text
 * - subtle: Muted background, colored text
 * - translucent: Semi-transparent background
 *
 * All variants support dark mode automatically.
 */
export const UIBadge: React.FC<UIBadgeProps> = ({
  variant = 'solid',
  color = 'gray',
  size = 'sm',
  shape = 'rounded',
  icon,
  pulse = false,
  className = '',
  children,
}) => {
  // Base styles (always applied)
  const baseStyles = 'inline-flex items-center gap-1.5 font-semibold transition-all duration-200';

  // Size-based styles
  const sizeStyles = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-1.5 text-base',
  }[size];

  // Shape styles
  const shapeStyles = {
    rounded: 'rounded',
    pill: 'rounded-full',
  }[shape];

  // Color + Variant combinations
  const getColorStyles = () => {
    const colorMap = {
      team1: {
        solid:
          'bg-orange-500 text-white dark:bg-orange-600 dark:text-white',
        outline:
          'border border-orange-500 text-orange-700 dark:border-orange-400 dark:text-orange-300',
        subtle:
          'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
        translucent:
          'bg-orange-500/20 text-orange-900 dark:bg-orange-500/30 dark:text-orange-100 backdrop-blur-sm',
      },
      team2: {
        solid:
          'bg-purple-500 text-white dark:bg-purple-600 dark:text-white',
        outline:
          'border border-purple-500 text-purple-700 dark:border-purple-400 dark:text-purple-300',
        subtle:
          'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
        translucent:
          'bg-purple-500/20 text-purple-900 dark:bg-purple-500/30 dark:text-purple-100 backdrop-blur-sm',
      },
      success: {
        solid:
          'bg-green-500 text-white dark:bg-green-600 dark:text-white',
        outline:
          'border border-green-500 text-green-700 dark:border-green-400 dark:text-green-300',
        subtle:
          'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
        translucent:
          'bg-green-500/20 text-green-900 dark:bg-green-500/30 dark:text-green-100 backdrop-blur-sm',
      },
      warning: {
        solid:
          'bg-yellow-500 text-white dark:bg-yellow-600 dark:text-white',
        outline:
          'border border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300',
        subtle:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
        translucent:
          'bg-yellow-500/20 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-100 backdrop-blur-sm',
      },
      error: {
        solid:
          'bg-red-500 text-white dark:bg-red-600 dark:text-white',
        outline:
          'border border-red-500 text-red-700 dark:border-red-400 dark:text-red-300',
        subtle:
          'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
        translucent:
          'bg-red-500/20 text-red-900 dark:bg-red-500/30 dark:text-red-100 backdrop-blur-sm',
      },
      info: {
        solid:
          'bg-blue-500 text-white dark:bg-blue-600 dark:text-white',
        outline:
          'border border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300',
        subtle:
          'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
        translucent:
          'bg-blue-500/20 text-blue-900 dark:bg-blue-500/30 dark:text-blue-100 backdrop-blur-sm',
      },
      gray: {
        solid:
          'bg-gray-500 text-white dark:bg-gray-600 dark:text-white',
        outline:
          'border border-gray-400 text-gray-700 dark:border-gray-500 dark:text-gray-300',
        subtle:
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        translucent:
          'bg-gray-500/20 text-gray-900 dark:bg-gray-500/30 dark:text-gray-100 backdrop-blur-sm',
      },
      primary: {
        solid:
          'bg-indigo-500 text-white dark:bg-indigo-600 dark:text-white',
        outline:
          'border border-indigo-500 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300',
        subtle:
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
        translucent:
          'bg-indigo-500/20 text-indigo-900 dark:bg-indigo-500/30 dark:text-indigo-100 backdrop-blur-sm',
      },
    };

    return colorMap[color][variant];
  };

  // Pulse animation for status indicators
  const pulseStyles = pulse ? 'animate-pulse' : '';

  // Icon size based on badge size
  const iconSize = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  const allStyles = [
    baseStyles,
    sizeStyles,
    shapeStyles,
    getColorStyles(),
    pulseStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={allStyles}>
      {icon && <span className={iconSize}>{icon}</span>}
      {children}
    </span>
  );
};
