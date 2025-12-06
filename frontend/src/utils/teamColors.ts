/**
 * Utility functions for consistent team color styling across components
 */

export type TeamId = 1 | 2;
export type TeamColorVariant = 'light' | 'dark' | 'gradient' | 'text' | 'border' | 'ring';

/**
 * Get team gradient colors (from-to pattern)
 */
export function getTeamGradient(teamId: TeamId): string {
  return teamId === 1 ? 'from-orange-600 to-orange-700' : 'from-purple-600 to-purple-700';
}

/**
 * Get team gradient with hover effect
 */
export function getTeamGradientHover(teamId: TeamId): string {
  return teamId === 1
    ? 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
    : 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800';
}

/**
 * Get team background color by variant
 */
export function getTeamBg(teamId: TeamId, variant: 'light' | 'dark' = 'light'): string {
  const colors = {
    1: {
      light: 'bg-orange-50 dark:bg-orange-900/40',
      dark: 'bg-orange-100 dark:bg-orange-900/40',
    },
    2: {
      light: 'bg-purple-50 dark:bg-purple-900/40',
      dark: 'bg-purple-100 dark:bg-purple-900/40',
    },
  };
  return colors[teamId][variant];
}

/**
 * Get team border color
 */
export function getTeamBorder(teamId: TeamId, width: '1' | '2' | '4' = '2'): string {
  const color =
    teamId === 1
      ? 'border-orange-400 dark:border-orange-600'
      : 'border-purple-400 dark:border-purple-600';
  return `border-${width} ${color}`;
}

/**
 * Get team text color
 */
export function getTeamText(teamId: TeamId, variant: 'base' | 'light' | 'dark' = 'base'): string {
  const colors = {
    1: {
      base: 'text-orange-800 dark:text-orange-200',
      light: 'text-orange-700 dark:text-orange-300',
      dark: 'text-orange-900 dark:text-orange-100',
    },
    2: {
      base: 'text-purple-800 dark:text-purple-200',
      light: 'text-purple-700 dark:text-purple-300',
      dark: 'text-purple-900 dark:text-purple-100',
    },
  };
  return colors[teamId][variant];
}

/**
 * Get team ring color (for focus/active states)
 */
export function getTeamRing(teamId: TeamId): string {
  return teamId === 1
    ? 'ring-orange-500 dark:ring-orange-400'
    : 'ring-purple-500 dark:ring-purple-400';
}

/**
 * Get team name
 */
export function getTeamName(teamId: TeamId): string {
  return teamId === 1 ? 'Team 1 (Orange)' : 'Team 2 (Purple)';
}

/**
 * Get complete team color class set for a card/container
 */
export function getTeamCardClasses(teamId: TeamId, isHighlighted: boolean = false): string {
  const bg = isHighlighted ? getTeamBg(teamId, 'dark') : getTeamBg(teamId, 'light');
  const border = getTeamBorder(teamId);
  const text = getTeamText(teamId);

  return `${bg} ${border} ${text}`;
}
