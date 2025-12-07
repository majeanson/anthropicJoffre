/**
 * RoundSummary Type Guards
 *
 * Type guard functions for narrowing stat value types.
 */

import { StatValue, RoundStatistics } from './types';

export function hasContribution(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['teamMVP']> {
  return !!stat && 'contribution' in stat;
}

export function hasRedZeros(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['luckyPlayer']> {
  return !!stat && 'redZeros' in stat;
}

export function hasPointsEarned(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['pointLeader']> {
  return !!stat && 'pointsEarned' in stat;
}

export function hasTricksWon(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['trickMaster']> {
  return !!stat && 'tricksWon' in stat;
}

export function hasSevensCount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['luckySevens']> {
  return !!stat && 'sevensCount' in stat;
}

export function hasCount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['suitedUp']> {
  return !!stat && 'count' in stat;
}

export function hasTrumpCount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['trumpHeavy']> {
  return !!stat && 'trumpCount' in stat;
}

export function hasTrumpsPlayed(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['trumpMaster']> {
  return !!stat && 'trumpsPlayed' in stat;
}

export function hasAvgValue(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['highRoller']> | NonNullable<RoundStatistics['lowball']> {
  return !!stat && 'avgValue' in stat;
}

export function hasSuit(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['suitedUp']> {
  return !!stat && 'suit' in stat;
}

export function hasBetAmount(
  stat: StatValue | undefined
): stat is NonNullable<RoundStatistics['perfectBet']> {
  return !!stat && 'betAmount' in stat;
}
