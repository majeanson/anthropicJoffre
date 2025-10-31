/**
 * Round Statistics Calculation
 * Sprint 4: Extracted from index.ts
 *
 * Calculates end-of-round statistics like fastest play, most aggressive bidder,
 * trump master, and lucky player.
 */

import { GameState, Player } from '../types/game';
import {
  getFastestPlayer,
  getTrumpMaster,
  getLuckiestPlayer,
} from './logic';

/**
 * Round statistics data structure
 * Tracks player performance metrics during a round
 */
export interface RoundStatsData {
  cardPlayTimes: Map<string, number[]>; // playerName -> array of play times in ms
  trumpsPlayed: Map<string, number>; // playerName -> count of trump cards played
  redZerosCollected: Map<string, number>; // playerName -> count of red 0 cards collected
  brownZerosReceived: Map<string, number>; // playerName -> count of brown 0 cards received
  trickStartTime: number; // timestamp when trick started
}

/**
 * Round statistics summary
 * Highlights for end-of-round display
 */
export interface RoundStatistics {
  fastestPlay?: {
    playerId: string;
    playerName: string;
    timeMs: number;
  };
  mostAggressiveBidder?: {
    playerId: string;
    playerName: string;
    bidAmount: number;
  };
  trumpMaster?: {
    playerId: string;
    playerName: string;
    trumpsPlayed: number;
  };
  luckyPlayer?: {
    playerId: string;
    playerName: string;
    reason: string;
  };
}

/**
 * Calculate round statistics from collected data
 * Determines fastest player, most aggressive bidder, trump master, and lucky player
 *
 * @param statsData - Round statistics data collected during play
 * @param game - Current game state
 * @returns Round statistics summary, or undefined if no stats available
 */
export function calculateRoundStatistics(
  statsData: RoundStatsData | undefined,
  game: GameState
): RoundStatistics | undefined {
  if (!statsData) return undefined;

  const statistics: RoundStatistics = {};

  // 1. Fastest Play - player with fastest average card play time
  const fastestResult = getFastestPlayer(statsData.cardPlayTimes);
  if (fastestResult) {
    const player = game.players.find(p => p.name === fastestResult.playerName);
    if (player) {
      statistics.fastestPlay = {
        playerId: player.id,
        playerName: player.name,
        timeMs: Math.round(fastestResult.avgTime),
      };
    }
  }

  // 2. Most Aggressive Bidder - highest bet amount
  if (game.highestBet) {
    const player = game.players.find(p => p.id === game.highestBet?.playerId);
    if (player) {
      statistics.mostAggressiveBidder = {
        playerId: player.id,
        playerName: player.name,
        bidAmount: game.highestBet.amount,
      };
    }
  }

  // 3. Trump Master - player who played most trump cards
  const trumpMasterResult = getTrumpMaster(statsData.trumpsPlayed);
  if (trumpMasterResult) {
    const player = game.players.find(p => p.name === trumpMasterResult.playerName);
    if (player) {
      statistics.trumpMaster = {
        playerId: player.id,
        playerName: player.name,
        trumpsPlayed: trumpMasterResult.count,
      };
    }
  }

  // 4. Lucky Player - player who won most points with fewest tricks
  const luckyResult = getLuckiestPlayer(game.players);
  if (luckyResult) {
    statistics.luckyPlayer = {
      playerId: luckyResult.player.id,
      playerName: luckyResult.player.name,
      reason: `${luckyResult.pointsPerTrick.toFixed(1)} pts/trick`,
    };
  }

  return Object.keys(statistics).length > 0 ? statistics : undefined;
}

/**
 * Initialize round statistics tracking for a new round
 * Sets up empty data structures for all players
 *
 * @param players - Array of players in the game
 * @returns Initialized round statistics data
 */
export function initializeRoundStats(players: Player[]): RoundStatsData {
  const stats: RoundStatsData = {
    cardPlayTimes: new Map(),
    trumpsPlayed: new Map(),
    redZerosCollected: new Map(),
    brownZerosReceived: new Map(),
    trickStartTime: Date.now(),
  };

  players.forEach(player => {
    stats.cardPlayTimes.set(player.name, []);
    stats.trumpsPlayed.set(player.name, 0);
    stats.redZerosCollected.set(player.name, 0);
    stats.brownZerosReceived.set(player.name, 0);
  });

  return stats;
}
