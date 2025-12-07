/**
 * SideBetsPanel Utility Functions
 */

import type { SideBet } from '../../types/game';

// Preset bet type labels for display
export const PRESET_LABELS: Record<string, string> = {
  red_zero_winner: 'Red 0 Winner',
  brown_zero_victim: 'Brown 0 Victim',
  tricks_over_under: 'Tricks Over/Under',
  team_score_over_under: 'Score Over/Under',
  bet_made: 'Bet Made',
  without_trump_success: 'Without Trump',
  first_trump_played: 'First Trump',
};

// Resolution timing labels
export const RESOLUTION_TIMING_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  trick: { label: 'After Trick', icon: '⚡', color: 'text-blue-400' },
  round: { label: 'End of Round', icon: '🔄', color: 'text-purple-400' },
  game: { label: 'End of Game', icon: '🏁', color: 'text-orange-400' },
  manual: { label: 'Manual', icon: '👆', color: 'text-skin-muted' },
};

/**
 * Format team prediction relative to viewer
 */
export function formatTeamPrediction(
  prediction: string | undefined,
  viewerTeamId: 1 | 2,
  isSpectator: boolean = false
): string {
  if (!prediction) return '';
  if (prediction === 'true') return 'Yes';
  if (prediction === 'false') return 'No';
  if (isSpectator) {
    // Spectators see Team 1/Team 2
    if (prediction === 'team1') return 'Team 1';
    if (prediction === 'team2') return 'Team 2';
  } else {
    // Players see My Team/Their Team
    if (prediction === 'team1') return viewerTeamId === 1 ? 'My Team' : 'Their Team';
    if (prediction === 'team2') return viewerTeamId === 2 ? 'My Team' : 'Their Team';
  }
  return prediction;
}

/**
 * Get bet description with context
 */
export function getBetDescription(bet: SideBet): string {
  if (bet.betType === 'custom') {
    return bet.customDescription || 'Custom bet';
  }
  return PRESET_LABELS[bet.presetType || ''] || bet.presetType || 'Preset bet';
}

/**
 * Get resolution timing badge JSX info for custom bets
 */
export function getResolutionTimingInfo(bet: SideBet): {
  icon: string;
  label: string;
  color: string;
  trickNumber?: number;
  roundNumber?: number;
} | null {
  if (bet.betType !== 'custom' || !bet.resolutionTiming) return null;
  const timing = RESOLUTION_TIMING_LABELS[bet.resolutionTiming];
  if (!timing) return null;
  return {
    ...timing,
    trickNumber: bet.resolutionTiming === 'trick' ? bet.trickNumber : undefined,
    roundNumber: bet.resolutionTiming === 'round' ? bet.roundNumber : undefined,
  };
}
