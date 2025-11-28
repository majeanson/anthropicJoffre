/**
 * Design System - Color Tokens
 * Sprint 21: Standardized color palette and gradients
 *
 * Usage:
 * import { colors } from '@/design-system';
 * className={colors.gradients.primary}
 */

export const colors = {
  // Brand colors (Blue-Purple spectrum)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Primary blue
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea', // Primary purple
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a', // Success green
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  warning: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04', // Warning yellow
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626', // Error red
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7', // Info blue
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Team colors
  team1: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c', // Team 1 orange
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },

  team2: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea', // Team 2 purple
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Parchment theme (light mode)
  parchment: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },

  umber: {
    50: '#fdf8f6',
    100: '#f2e8e5',
    200: '#eaddd7',
    300: '#e0cec7',
    400: '#d2bab0',
    500: '#bfa094',
    600: '#a18072',
    700: '#977669', // Primary umber
    800: '#846358',
    900: '#43302b',
  },

  // Standard gradient definitions
  gradients: {
    // Primary gradients
    primary: 'from-blue-600 to-purple-600',
    primaryHover: 'from-blue-700 to-purple-700',
    primaryDark: 'from-blue-700 to-purple-800',
    primaryDarkHover: 'from-blue-600 to-purple-700',

    // Secondary gradients
    secondary: 'from-purple-600 to-pink-600',
    secondaryHover: 'from-purple-700 to-pink-700',
    secondaryDark: 'from-purple-700 to-pink-800',
    secondaryDarkHover: 'from-purple-600 to-pink-700',

    // Semantic gradients
    success: 'from-green-600 to-emerald-600',
    successHover: 'from-green-700 to-emerald-700',
    successDark: 'from-green-700 to-emerald-800',

    warning: 'from-yellow-600 to-orange-600',
    warningHover: 'from-yellow-700 to-orange-700',
    warningDark: 'from-yellow-700 to-orange-800',

    error: 'from-red-600 to-rose-600',
    errorHover: 'from-red-700 to-rose-700',
    errorDark: 'from-red-700 to-rose-800',

    info: 'from-blue-600 to-cyan-600',
    infoHover: 'from-blue-700 to-cyan-700',
    infoDark: 'from-blue-700 to-cyan-800',

    // Team gradients
    team1: 'from-orange-600 to-amber-600',
    team1Hover: 'from-orange-700 to-amber-700',
    team1Dark: 'from-orange-700 to-amber-800',

    team2: 'from-purple-600 to-indigo-600',
    team2Hover: 'from-purple-700 to-indigo-700',
    team2Dark: 'from-purple-700 to-indigo-800',

    // Quest system gradients
    questDaily: 'from-blue-600 to-purple-600',
    questDailyHover: 'from-blue-700 to-purple-700',
    questRewards: 'from-pink-600 to-orange-600',
    questRewardsHover: 'from-pink-700 to-orange-700',

    // Stats gradients
    statsMain: 'from-umber-700 to-amber-800',
    statsMainHover: 'from-umber-800 to-amber-900',
    statsMainDark: 'from-blue-700 to-blue-800',
    statsMainDarkHover: 'from-blue-600 to-blue-700',

    statsLeaderboard: 'from-amber-700 to-orange-700',
    statsLeaderboardHover: 'from-amber-800 to-orange-800',
    statsLeaderboardDark: 'from-indigo-700 to-indigo-800',
    statsLeaderboardDarkHover: 'from-indigo-600 to-indigo-700',

    statsRecent: 'from-purple-600 to-pink-600',
    statsRecentHover: 'from-purple-700 to-pink-700',
    statsRecentDark: 'from-purple-700 to-pink-800',
    statsRecentDarkHover: 'from-purple-600 to-pink-700',
  },

  // Border colors
  borders: {
    light: {
      default: 'border-gray-300',
      hover: 'border-gray-400',
      focus: 'border-blue-500',
    },
    dark: {
      default: 'border-gray-600',
      hover: 'border-gray-500',
      focus: 'border-purple-500',
    },
  },

  // Focus ring colors
  focus: {
    light: 'focus-visible:ring-orange-500',
    dark: 'focus-visible:ring-purple-500',
  },
} as const;

// Helper function to get gradient classes
export function getGradient(variant: keyof typeof colors.gradients, hover = false): string {
  const baseGradient = colors.gradients[variant];
  const hoverGradient = colors.gradients[`${variant}Hover` as keyof typeof colors.gradients];

  if (hover && hoverGradient) {
    return `bg-gradient-to-r ${baseGradient} hover:${hoverGradient}`;
  }

  return `bg-gradient-to-r ${baseGradient}`;
}

// Helper function to get team color
export function getTeamColor(teamId: 1 | 2, shade: keyof typeof colors.team1 = 600): string {
  return teamId === 1 ? colors.team1[shade] : colors.team2[shade];
}

// Helper function to get semantic color
export function getSemanticColor(
  type: 'success' | 'warning' | 'error' | 'info',
  shade: keyof typeof colors.success = 600
): string {
  return colors[type][shade];
}
