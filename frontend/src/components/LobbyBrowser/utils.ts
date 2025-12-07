// Helper function to get phase color
export const getPhaseColor = (phase: string): string => {
  switch (phase) {
    case 'team_selection':
      return 'var(--color-info)';
    case 'betting':
      return 'var(--color-warning)';
    case 'playing':
      return 'var(--color-success)';
    case 'scoring':
      return 'var(--color-team2-primary)';
    case 'game_over':
      return 'var(--color-text-muted)';
    default:
      return 'var(--color-text-muted)';
  }
};

// Helper function to get phase label
export const getPhaseLabel = (phase: string): string => {
  switch (phase) {
    case 'team_selection':
      return 'Team Selection';
    case 'betting':
      return 'Betting';
    case 'playing':
      return 'Playing';
    case 'scoring':
      return 'Scoring';
    case 'game_over':
      return 'Game Over';
    default:
      return phase;
  }
};

// Helper function to format time ago
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
