/**
 * Design System - Shadow Tokens
 * Sprint 21: Standardized shadow definitions
 *
 * Usage:
 * import { shadows } from '@/design-system';
 * className={shadows.md}
 */

export const shadows = {
  // Base shadows
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',

  // Inner shadow
  inner: 'shadow-inner',

  // Colored shadows (for emphasis)
  colored: {
    primary: 'shadow-lg shadow-blue-500/50',
    secondary: 'shadow-lg shadow-purple-500/50',
    success: 'shadow-lg shadow-green-500/50',
    warning: 'shadow-lg shadow-yellow-500/50',
    error: 'shadow-lg shadow-red-500/50',
  },

  // Component-specific shadows
  card: 'shadow-md hover:shadow-lg transition-shadow duration-200',
  modal: 'shadow-2xl',
  button: 'shadow hover:shadow-md transition-shadow duration-200',
  dropdown: 'shadow-xl',
  tooltip: 'shadow-lg',
} as const;

// Helper function to get shadow class
export function getShadow(
  size: keyof typeof shadows,
  hover = false
): string {
  const baseShadow = shadows[size];

  if (hover) {
    return `${baseShadow} hover:shadow-lg transition-shadow duration-200`;
  }

  return baseShadow;
}
