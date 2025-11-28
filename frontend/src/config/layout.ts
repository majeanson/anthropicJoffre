/**
 * Layout Constants Configuration
 *
 * Centralized spacing, sizing, and animation constants for the UI system.
 *
 * Usage:
 * ```tsx
 * import { spacing, sizes, animations } from '@/config/layout';
 *
 * <div className={spacing.modal.padding}>...</div>
 * ```
 */

/**
 * Spacing constants for consistent padding/margins
 */
export const spacing = {
  modal: {
    /** Padding inside modal content */
    padding: 'p-6',
    /** Padding for modal header */
    headerPadding: 'px-6 py-4',
    /** Padding for modal footer */
    footerPadding: 'p-4',
    /** Gap between modal elements */
    gap: 'gap-4',
  },
  button: {
    /** Gap between icon and text in buttons */
    iconGap: 'gap-2',
  },
  panel: {
    /** Standard panel padding */
    padding: 'p-4',
    /** Compact panel padding */
    paddingCompact: 'p-2',
  },
} as const;

/**
 * Size constants for components
 */
export const sizes = {
  modal: {
    sm: 'max-w-sm',       // ~384px
    md: 'max-w-2xl',      // ~672px
    lg: 'max-w-4xl',      // ~896px
    xl: 'max-w-6xl',      // ~1152px
    full: 'max-w-7xl',    // ~1280px
  },
  button: {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  },
  iconButton: {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  },
  /** Minimum touch target size for accessibility (WCAG 2.5.5) */
  minTouchTarget: '44px',
} as const;

/**
 * Animation constants
 */
export const animations = {
  /** Duration for most transitions */
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  /** Timing functions */
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  /** Modal animations */
  modal: {
    /** Fade in animation for backdrop */
    backdropEnter: 'animate-fadeIn',
    /** Slide up animation for modal content */
    contentEnter: 'animate-slideUp',
    /** Scale animation alternative */
    scaleEnter: 'animate-scaleIn',
  },
} as const;

/**
 * Border radius constants
 */
export const borderRadius = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

/**
 * Shadow constants
 */
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;
