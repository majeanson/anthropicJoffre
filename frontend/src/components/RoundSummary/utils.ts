/**
 * RoundSummary Utility Functions
 *
 * Helper functions for stat scoring and calculations.
 */

import { StatValue } from './types';
import {
  hasContribution,
  hasRedZeros,
  hasPointsEarned,
  hasTricksWon,
  hasSevensCount,
  hasCount,
  hasTrumpCount,
  hasTrumpsPlayed,
  hasAvgValue,
} from './typeGuards';

/**
 * Calculate a score for a stat to determine display priority.
 * Higher scores = more interesting stats shown first.
 */
export function getStatScore(title: string, stat: StatValue): number {
  if (!stat) return 30;

  switch (title) {
    case 'Perfect Bet':
      return 100;
    case 'Team MVP':
      if (hasContribution(stat)) {
        return stat.contribution >= 70 ? 90 : stat.contribution >= 60 ? 60 : 50;
      }
      return 50;
    case 'Lucky Player':
      if (hasRedZeros(stat)) {
        return stat.redZeros >= 2 ? 85 : 70;
      }
      return 70;
    case 'Point Leader':
      if (hasPointsEarned(stat)) {
        return stat.pointsEarned >= 10 ? 80 : stat.pointsEarned >= 8 ? 65 : 50;
      }
      return 50;
    case 'Trick Master':
      if (hasTricksWon(stat)) {
        return stat.tricksWon >= 5 ? 75 : stat.tricksWon >= 4 ? 60 : 45;
      }
      return 45;
    case 'Monochrome':
      return 70;
    case 'Lucky Sevens':
      if (hasSevensCount(stat)) {
        return stat.sevensCount >= 3 ? 70 : 55;
      }
      return 55;
    case 'Suited Up':
      if (hasCount(stat)) {
        return stat.count >= 5 ? 65 : 50;
      }
      return 50;
    case 'Trump Heavy':
      if (hasTrumpCount(stat)) {
        return stat.trumpCount >= 4 ? 60 : 45;
      }
      return 45;
    case 'Rainbow':
      return 55;
    case 'Trump Master':
      if (hasTrumpsPlayed(stat)) {
        return stat.trumpsPlayed >= 4 ? 55 : 40;
      }
      return 40;
    case 'High Roller':
      if (hasAvgValue(stat)) {
        return stat.avgValue >= 5 ? 45 : 35;
      }
      return 35;
    case 'Lowball':
      if (hasAvgValue(stat)) {
        return stat.avgValue <= 2 ? 45 : 35;
      }
      return 35;
    default:
      return 30;
  }
}
