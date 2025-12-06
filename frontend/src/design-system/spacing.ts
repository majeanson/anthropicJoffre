/**
 * Design System - Spacing Tokens
 * Sprint 21: Standardized spacing scale
 *
 * Usage:
 * import { spacing } from '@/design-system';
 * className={spacing.gap.md}
 */

export const spacing = {
  // Base spacing values (rem)
  values: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
    '4xl': '6rem', // 96px
  },

  // Padding classes
  padding: {
    xs: 'p-2', // 8px
    sm: 'p-3', // 12px
    md: 'p-4', // 16px
    lg: 'p-6', // 24px
    xl: 'p-8', // 32px
    '2xl': 'p-12', // 48px
  },

  // Padding X (horizontal)
  paddingX: {
    xs: 'px-2', // 8px
    sm: 'px-3', // 12px
    md: 'px-4', // 16px
    lg: 'px-6', // 24px
    xl: 'px-8', // 32px
    '2xl': 'px-12', // 48px
  },

  // Padding Y (vertical)
  paddingY: {
    xs: 'py-2', // 8px
    sm: 'py-3', // 12px
    md: 'py-4', // 16px
    lg: 'py-6', // 24px
    xl: 'py-8', // 32px
    '2xl': 'py-12', // 48px
  },

  // Margin classes
  margin: {
    xs: 'm-2', // 8px
    sm: 'm-3', // 12px
    md: 'm-4', // 16px
    lg: 'm-6', // 24px
    xl: 'm-8', // 32px
    '2xl': 'm-12', // 48px
  },

  // Margin X (horizontal)
  marginX: {
    xs: 'mx-2', // 8px
    sm: 'mx-3', // 12px
    md: 'mx-4', // 16px
    lg: 'mx-6', // 24px
    xl: 'mx-8', // 32px
    '2xl': 'mx-12', // 48px
  },

  // Margin Y (vertical)
  marginY: {
    xs: 'my-2', // 8px
    sm: 'my-3', // 12px
    md: 'my-4', // 16px
    lg: 'my-6', // 24px
    xl: 'my-8', // 32px
    '2xl': 'my-12', // 48px
  },

  // Gap classes (for flexbox/grid)
  gap: {
    xs: 'gap-2', // 8px
    sm: 'gap-3', // 12px
    md: 'gap-4', // 16px
    lg: 'gap-6', // 24px
    xl: 'gap-8', // 32px
    '2xl': 'gap-12', // 48px
  },

  // Space between (for flex/grid children)
  space: {
    xs: 'space-y-2', // 8px
    sm: 'space-y-3', // 12px
    md: 'space-y-4', // 16px
    lg: 'space-y-6', // 24px
    xl: 'space-y-8', // 32px
    '2xl': 'space-y-12', // 48px
  },

  // Button padding variants
  button: {
    sm: 'py-2 px-3', // Small button
    md: 'py-3 px-4', // Medium button (default)
    lg: 'py-4 px-6', // Large button
    xl: 'py-4 px-8', // Extra large button
  },

  // Card/Container padding
  container: {
    sm: 'p-4', // 16px
    md: 'p-6', // 24px
    lg: 'p-8', // 32px
    xl: 'p-12', // 48px
  },

  // Section spacing (vertical)
  section: {
    sm: 'py-8', // 32px
    md: 'py-12', // 48px
    lg: 'py-16', // 64px
    xl: 'py-24', // 96px
  },

  // Component spacing (consistent spacing for UI elements)
  component: {
    cardPadding: 'p-6',
    modalPadding: 'p-6',
    panelPadding: 'p-4',
    listItemPadding: 'py-3 px-4',
    inputPadding: 'py-2 px-3',
    buttonGroupGap: 'gap-3',
    formFieldGap: 'space-y-4',
    sectionGap: 'space-y-6',
  },
} as const;

// Helper function to get spacing value
export function getSpacing(size: keyof typeof spacing.values): string {
  return spacing.values[size];
}

// Helper function to get padding class
export function getPadding(size: keyof typeof spacing.padding, direction?: 'x' | 'y'): string {
  if (direction === 'x') return spacing.paddingX[size];
  if (direction === 'y') return spacing.paddingY[size];
  return spacing.padding[size];
}

// Helper function to get margin class
export function getMargin(size: keyof typeof spacing.margin, direction?: 'x' | 'y'): string {
  if (direction === 'x') return spacing.marginX[size];
  if (direction === 'y') return spacing.marginY[size];
  return spacing.margin[size];
}

// Helper function to get gap class
export function getGap(size: keyof typeof spacing.gap): string {
  return spacing.gap[size];
}
