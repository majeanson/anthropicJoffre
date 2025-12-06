/**
 * Design System - Breakpoint Tokens
 * Sprint 21: Responsive design breakpoints
 *
 * Usage:
 * import { breakpoints } from '@/design-system';
 */

export const breakpoints = {
  // Breakpoint values (matches Tailwind defaults)
  values: {
    sm: '640px', // Small devices (phones, 640px and up)
    md: '768px', // Medium devices (tablets, 768px and up)
    lg: '1024px', // Large devices (desktops, 1024px and up)
    xl: '1280px', // Extra large devices (large desktops, 1280px and up)
    '2xl': '1536px', // 2X Extra large devices (larger desktops, 1536px and up)
  },

  // Media query helpers
  up: {
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)',
  },

  down: {
    sm: '@media (max-width: 639px)',
    md: '@media (max-width: 767px)',
    lg: '@media (max-width: 1023px)',
    xl: '@media (max-width: 1279px)',
    '2xl': '@media (max-width: 1535px)',
  },

  // Common responsive classes
  hide: {
    mobile: 'hidden sm:block', // Hide on mobile, show on sm+
    tablet: 'hidden md:block', // Hide on tablet, show on md+
    desktop: 'block lg:hidden', // Hide on desktop, show on mobile/tablet
  },

  show: {
    mobile: 'block sm:hidden', // Show on mobile only
    tablet: 'hidden sm:block md:hidden', // Show on tablet only
    desktop: 'hidden lg:block', // Show on desktop only
  },
} as const;

// Helper function to check if viewport matches breakpoint
export function isBreakpoint(breakpoint: keyof typeof breakpoints.values): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(min-width: ${breakpoints.values[breakpoint]})`).matches;
}
