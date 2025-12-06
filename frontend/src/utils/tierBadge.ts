export type RankingTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

/**
 * Get the emoji icon for a ranking tier
 */
export function getTierIcon(tier: string): string {
  switch (tier) {
    case 'Diamond':
      return '💎';
    case 'Platinum':
      return '🏆';
    case 'Gold':
      return '🥇';
    case 'Silver':
      return '🥈';
    case 'Bronze':
      return '🥉';
    default:
      return '📊';
  }
}

/**
 * Get Tailwind color classes for a ranking tier
 * @param tier - The ranking tier
 * @param fullClass - If true, returns complete class with bg-gradient-to-r, otherwise just from/to colors
 */
export function getTierColor(tier: string, fullClass: boolean = false): string {
  const colors = {
    Diamond: 'from-cyan-400 to-blue-600',
    Platinum: 'from-gray-300 to-gray-500',
    Gold: 'from-yellow-400 to-yellow-600',
    Silver: 'from-gray-400 to-gray-600',
    Bronze: 'from-orange-700 to-orange-900',
  };

  const textColors = {
    Diamond: 'text-white',
    Platinum: 'text-gray-900',
    Gold: 'text-gray-900',
    Silver: 'text-white',
    Bronze: 'text-white',
  };

  const gradient = colors[tier as keyof typeof colors] || 'from-gray-500 to-gray-700';
  const textColor = textColors[tier as keyof typeof textColors] || 'text-white';

  if (fullClass) {
    return `bg-gradient-to-r ${gradient} ${textColor}`;
  }

  return gradient;
}

/**
 * Get medal emoji for leaderboard rank
 */
export function getRankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}
