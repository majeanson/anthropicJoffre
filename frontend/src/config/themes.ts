/**
 * Theme Configuration
 *
 * Centralized theme definitions for the UI component system.
 * All modals, panels, and components should use these theme presets
 * for consistent styling across the application.
 *
 * Usage:
 * ```tsx
 * import { themes } from '@/config/themes';
 *
 * <Modal theme="parchment" />
 * <div className={themes.parchment.bg}>...</div>
 * ```
 */

export interface Theme {
  name: string;
  bg: string;
  header: string;
  border: string;
  text: string;
  textMuted: string;
  backdrop: string;
}

export const themes = {
  /**
   * Parchment theme - Default, warm, game-like aesthetic
   * Used for: Most game-related modals, primary UI
   */
  parchment: {
    name: 'Parchment',
    bg: 'from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900',
    header: 'from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900',
    border: 'border-amber-900 dark:border-gray-600',
    text: 'text-umber-900 dark:text-gray-100',
    textMuted: 'text-umber-600 dark:text-gray-400',
    backdrop: 'bg-black/70 dark:bg-black/80',
  },

  /**
   * Blue theme - Cool, professional
   * Used for: Stats, analytics, information modals
   */
  blue: {
    name: 'Blue',
    bg: 'from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900',
    header: 'from-blue-700 to-blue-900 dark:from-gray-700 dark:to-gray-800',
    border: 'border-blue-700 dark:border-gray-600',
    text: 'text-blue-900 dark:text-gray-100',
    textMuted: 'text-blue-600 dark:text-gray-400',
    backdrop: 'bg-black/60 dark:bg-black/80',
  },

  /**
   * Purple theme - Premium, special features
   * Used for: Achievements, premium features, special events
   */
  purple: {
    name: 'Purple',
    bg: 'from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900',
    header: 'from-purple-700 to-blue-700 dark:from-purple-800 dark:to-blue-800',
    border: 'border-purple-700 dark:border-gray-600',
    text: 'text-purple-900 dark:text-gray-100',
    textMuted: 'text-purple-600 dark:text-gray-400',
    backdrop: 'bg-black/70 dark:bg-black/80',
  },

  /**
   * Green theme - Success, positive actions
   * Used for: Confirmations, success messages, wins
   */
  green: {
    name: 'Green',
    bg: 'from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900',
    header: 'from-green-700 to-emerald-700 dark:from-gray-700 dark:to-gray-800',
    border: 'border-green-700 dark:border-gray-600',
    text: 'text-green-900 dark:text-gray-100',
    textMuted: 'text-green-600 dark:text-gray-400',
    backdrop: 'bg-black/60 dark:bg-black/80',
  },

  /**
   * Red theme - Danger, warnings, destructive actions
   * Used for: Delete confirmations, errors, critical warnings
   */
  red: {
    name: 'Red',
    bg: 'from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900',
    header: 'from-red-700 to-red-900 dark:from-gray-700 dark:to-gray-800',
    border: 'border-red-700 dark:border-gray-600',
    text: 'text-red-900 dark:text-gray-100',
    textMuted: 'text-red-600 dark:text-gray-400',
    backdrop: 'bg-black/70 dark:bg-black/80',
  },

  /**
   * Dark theme - Always dark, regardless of system theme
   * Used for: Debug panels, developer tools
   */
  dark: {
    name: 'Dark',
    bg: 'from-gray-900 to-gray-800',
    header: 'from-gray-800 to-gray-900',
    border: 'border-gray-700',
    text: 'text-gray-100',
    textMuted: 'text-gray-400',
    backdrop: 'bg-black/90',
  },
} as const;

export type ThemeName = keyof typeof themes;

/**
 * Get theme by name with fallback
 */
export function getTheme(name: ThemeName = 'parchment'): Theme {
  return themes[name] || themes.parchment;
}
