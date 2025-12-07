/**
 * RoundSummary Types
 *
 * Shared type definitions for round summary components.
 */

import { Card, GameState, RoundHistory } from '../../types/game';

export interface RoundStatistics {
  // Performance-based stats
  trickMaster?: { playerId: string; playerName: string; tricksWon: number };
  pointLeader?: { playerId: string; playerName: string; pointsEarned: number };
  perfectBet?: { playerId: string; playerName: string; betAmount: number };
  teamMVP?: { playerId: string; playerName: string; contribution: number };
  trumpMaster?: { playerId: string; playerName: string; trumpsPlayed: number };
  luckyPlayer?: { playerId: string; playerName: string; redZeros: number };

  // Starting hand stats
  monochrome?: { playerId: string; playerName: string };
  suitedUp?: { playerId: string; playerName: string; suit: string; count: number };
  luckySevens?: { playerId: string; playerName: string; sevensCount: number };
  rainbow?: { playerId: string; playerName: string };
  lowball?: { playerId: string; playerName: string; avgValue: number };
  highRoller?: { playerId: string; playerName: string; avgValue: number };
  trumpHeavy?: { playerId: string; playerName: string; trumpCount: number };

  // Raw data
  initialHands?: { [playerName: string]: Card[] };
  playerBets?: { [playerName: string]: { amount: number; withoutTrump: boolean } | null };
}

// Type for all possible stat values
export type StatValue =
  | RoundStatistics['trickMaster']
  | RoundStatistics['pointLeader']
  | RoundStatistics['perfectBet']
  | RoundStatistics['teamMVP']
  | RoundStatistics['trumpMaster']
  | RoundStatistics['luckyPlayer']
  | RoundStatistics['monochrome']
  | RoundStatistics['suitedUp']
  | RoundStatistics['luckySevens']
  | RoundStatistics['rainbow']
  | RoundStatistics['lowball']
  | RoundStatistics['highRoller']
  | RoundStatistics['trumpHeavy'];

export interface DisplayedStat {
  title: string;
  icon: string;
  stat: StatValue;
  score: number;
}

export interface RewardsEarned {
  xp: {
    total: number;
    breakdown: {
      tricks: number;
      bet: number;
      redZeros: number;
    };
  };
  coins: {
    total: number;
    breakdown: {
      round: number;
      redZeros: number;
    };
  };
  tricksWon: number;
  betSuccessful: boolean;
  redZerosCollected: number;
}

export interface RoundSummaryProps {
  gameState: GameState;
  onReady: () => void;
  currentPlayerId?: string;
}

// Re-export for convenience
export type { RoundHistory };
