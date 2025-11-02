/**
 * Round Statistics Calculation
 * Sprint 4: Extracted from index.ts
 * Sprint 5 Phase 2.3: Added updateTrickStats() helper
 * Sprint 6: Added hand analysis functions for creative stats
 *
 * Calculates end-of-round statistics like fastest play, most aggressive bidder,
 * trump master, lucky player, and analyzes starting hands for unique patterns.
 */

import { GameState, Player, TrickCard, Card } from '../types/game';
import {
  getFastestPlayer,
  getTrumpMaster,
  getLuckiestPlayer,
  hasRedZero,
  hasBrownZero,
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
  initialHands: Map<string, Card[]>; // playerName -> starting hand
  playerBets: Map<string, { amount: number; withoutTrump: boolean } | null>; // playerName -> bet or null if skipped
}

/**
 * Round statistics summary
 * Highlights for end-of-round display
 */
export interface RoundStatistics {
  // Performance-based stats
  trickMaster?: {
    playerId: string;
    playerName: string;
    tricksWon: number;
  };
  pointLeader?: {
    playerId: string;
    playerName: string;
    pointsEarned: number;
  };
  perfectBet?: {
    playerId: string;
    playerName: string;
    betAmount: number;
  };
  teamMVP?: {
    playerId: string;
    playerName: string;
    contribution: number; // percentage of team's points
  };
  trumpMaster?: {
    playerId: string;
    playerName: string;
    trumpsPlayed: number;
  };
  luckyPlayer?: {
    playerId: string;
    playerName: string;
    redZeros: number;
  };

  // Starting hand stats
  monochrome?: {
    playerId: string;
    playerName: string;
  };
  suitedUp?: {
    playerId: string;
    playerName: string;
    suit: string;
    count: number;
  };
  luckySevens?: {
    playerId: string;
    playerName: string;
    sevensCount: number;
  };
  rainbow?: {
    playerId: string;
    playerName: string;
  };
  lowball?: {
    playerId: string;
    playerName: string;
    avgValue: number;
  };
  highRoller?: {
    playerId: string;
    playerName: string;
    avgValue: number;
  };
  trumpHeavy?: {
    playerId: string;
    playerName: string;
    trumpCount: number;
  };

  // Detailed data for round summary (Maps will be serialized to objects for JSON)
  initialHands?: { [playerName: string]: Card[] };
  playerBets?: { [playerName: string]: { amount: number; withoutTrump: boolean } | null };
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

  // ===== PERFORMANCE-BASED STATS =====

  // 1. Trick Master - player who won the most tricks
  let maxTricks = 0;
  let trickMasterId = '';
  let trickMasterName = '';
  game.players.forEach((player: Player) => {
    if (player.tricksWon > maxTricks) {
      maxTricks = player.tricksWon;
      trickMasterId = player.id;
      trickMasterName = player.name;
    }
  });
  if (trickMasterId && maxTricks > 0) {
    statistics.trickMaster = {
      playerId: trickMasterId,
      playerName: trickMasterName,
      tricksWon: maxTricks,
    };
  }

  // 2. Point Leader - player who earned the most points
  let maxPoints = 0;
  let pointLeaderId = '';
  let pointLeaderName = '';
  game.players.forEach((player: Player) => {
    if (player.pointsWon > maxPoints) {
      maxPoints = player.pointsWon;
      pointLeaderId = player.id;
      pointLeaderName = player.name;
    }
  });
  if (pointLeaderId && maxPoints > 0) {
    statistics.pointLeader = {
      playerId: pointLeaderId,
      playerName: pointLeaderName,
      pointsEarned: maxPoints,
    };
  }

  // 3. Perfect Bet - player who made their exact bet
  if (game.highestBet && statsData.playerBets) {
    const bidder = game.players.find(p => p.id === game.highestBet?.playerId);
    if (bidder) {
      const bet = statsData.playerBets.get(bidder.name);
      if (bet && bidder.pointsWon === bet.amount) {
        statistics.perfectBet = {
          playerId: bidder.id,
          playerName: bidder.name,
          betAmount: bet.amount,
        };
      }
    }
  }

  // 4. Team MVP - player with highest contribution to team's points
  // Calculate team totals using only positive contributions to avoid >100% when teammates have negative points
  const teamPoints = { team1: 0, team2: 0 };
  game.players.forEach((player: Player) => {
    // Only count positive points to avoid MVP >100% when teammate has negative points from brown zeros
    const positivePoints = Math.max(0, player.pointsWon);
    if (player.teamId === 1) teamPoints.team1 += positivePoints;
    else if (player.teamId === 2) teamPoints.team2 += positivePoints;
  });

  let maxContribution = 0;
  let mvpId = '';
  let mvpName = '';
  game.players.forEach((player: Player) => {
    const teamTotal = player.teamId === 1 ? teamPoints.team1 : teamPoints.team2;
    if (teamTotal > 0 && player.pointsWon > 0) {
      // Calculate contribution as percentage of positive team points
      const contribution = (player.pointsWon / teamTotal) * 100;
      if (contribution > maxContribution) {
        maxContribution = contribution;
        mvpId = player.id;
        mvpName = player.name;
      }
    }
  });
  if (mvpId && maxContribution > 50) { // Only show MVP if they contributed >50%
    statistics.teamMVP = {
      playerId: mvpId,
      playerName: mvpName,
      contribution: Math.round(maxContribution),
    };
  }

  // 5. Trump Master - player who played most trump cards
  const trumpMasterResult = getTrumpMaster(statsData.trumpsPlayed);
  if (trumpMasterResult && trumpMasterResult.count > 0) {
    const player = game.players.find(p => p.name === trumpMasterResult.playerName);
    if (player) {
      statistics.trumpMaster = {
        playerId: player.id,
        playerName: player.name,
        trumpsPlayed: trumpMasterResult.count,
      };
    }
  }

  // 6. Lucky Player - player who collected most red zeros
  let maxRedZeros = 0;
  let luckyPlayerName = '';
  statsData.redZerosCollected.forEach((count, playerName) => {
    if (count > maxRedZeros) {
      maxRedZeros = count;
      luckyPlayerName = playerName;
    }
  });
  if (luckyPlayerName && maxRedZeros > 0) {
    const player = game.players.find(p => p.name === luckyPlayerName);
    if (player) {
      statistics.luckyPlayer = {
        playerId: player.id,
        playerName: player.name,
        redZeros: maxRedZeros,
      };
    }
  }

  // ===== STARTING HAND STATS =====
  if (statsData.initialHands && statsData.initialHands.size > 0) {
    const handAnalyses = analyzeStartingHands(statsData.initialHands, game.trump);

    // Find interesting hand patterns
    handAnalyses.forEach((analysis, playerName) => {
      const player = game.players.find(p => p.name === playerName);
      if (!player) return;

      // Monochrome (no red cards)
      if (analysis.noRed && !statistics.monochrome) {
        statistics.monochrome = {
          playerId: player.id,
          playerName: player.name,
        };
      }

      // Suited Up (4+ of same suit)
      if (analysis.suitedUp && !statistics.suitedUp) {
        statistics.suitedUp = {
          playerId: player.id,
          playerName: player.name,
          suit: analysis.suitedUp.suit,
          count: analysis.suitedUp.count,
        };
      }

      // Lucky Sevens (2+ sevens)
      if (analysis.sevensCount >= 2 && !statistics.luckySevens) {
        statistics.luckySevens = {
          playerId: player.id,
          playerName: player.name,
          sevensCount: analysis.sevensCount,
        };
      }

      // Rainbow (all 4 suits)
      if (analysis.rainbow && !statistics.rainbow) {
        statistics.rainbow = {
          playerId: player.id,
          playerName: player.name,
        };
      }

      // Lowball (lowest average)
      if (analysis.lowestAvg && !statistics.lowball) {
        statistics.lowball = {
          playerId: player.id,
          playerName: player.name,
          avgValue: Math.round(analysis.avgValue * 10) / 10,
        };
      }

      // High Roller (highest average)
      if (analysis.highestAvg && !statistics.highRoller) {
        statistics.highRoller = {
          playerId: player.id,
          playerName: player.name,
          avgValue: Math.round(analysis.avgValue * 10) / 10,
        };
      }

      // Trump Heavy (3+ trumps)
      if (analysis.trumpCount >= 3 && !statistics.trumpHeavy) {
        statistics.trumpHeavy = {
          playerId: player.id,
          playerName: player.name,
          trumpCount: analysis.trumpCount,
        };
      }
    });

    // Store the raw data for detailed display (convert Maps to objects for JSON serialization)
    if (statsData.initialHands) {
      const handsObj: { [playerName: string]: Card[] } = {};
      statsData.initialHands.forEach((hand, playerName) => {
        handsObj[playerName] = hand;
      });
      statistics.initialHands = handsObj;
    }

    if (statsData.playerBets) {
      const betsObj: { [playerName: string]: { amount: number; withoutTrump: boolean } | null } = {};
      statsData.playerBets.forEach((bet, playerName) => {
        betsObj[playerName] = bet;
      });
      statistics.playerBets = betsObj;
    }
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
    initialHands: new Map(),
    playerBets: new Map(),
  };

  players.forEach(player => {
    stats.cardPlayTimes.set(player.name, []);
    stats.trumpsPlayed.set(player.name, 0);
    stats.redZerosCollected.set(player.name, 0);
    stats.brownZerosReceived.set(player.name, 0);
    // Initial hands will be set when cards are dealt
    // Player bets will be set as betting happens
  });

  return stats;
}

/**
 * Update round statistics after a trick is won
 * Tracks special card collection (red zeros and brown zeros)
 *
 * Sprint 5 Phase 2.3: Extracted from resolveTrick() orchestration
 *
 * @param stats - Current round statistics data (will be mutated)
 * @param trick - The completed trick
 * @param winnerName - Name of the player who won the trick
 * @returns The updated stats object (same reference, for chaining)
 *
 * @example
 * const stats = roundStats.get(gameId);
 * updateTrickStats(stats, game.currentTrick, winnerName);
 */
export function updateTrickStats(
  stats: RoundStatsData | undefined,
  trick: TrickCard[],
  winnerName: string
): RoundStatsData | undefined {
  if (!stats) return stats;

  // Track red zero collection (+5 points)
  if (hasRedZero(trick)) {
    const redZeroCount = stats.redZerosCollected.get(winnerName) || 0;
    stats.redZerosCollected.set(winnerName, redZeroCount + 1);
  }

  // Track brown zero collection (-2 points)
  if (hasBrownZero(trick)) {
    const brownZeroCount = stats.brownZerosReceived.get(winnerName) || 0;
    stats.brownZerosReceived.set(winnerName, brownZeroCount + 1);
  }

  return stats;
}

/**
 * Hand Analysis Functions for Creative Statistics
 */

/**
 * Check if a hand has no red cards (monochrome)
 */
export function hasNoRedCards(hand: Card[]): boolean {
  return !hand.some(card => card.color === 'red');
}

/**
 * Count how many cards of each suit are in the hand
 */
export function getSuitCounts(hand: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  hand.forEach(card => {
    counts.set(card.color, (counts.get(card.color) || 0) + 1);
  });
  return counts;
}

/**
 * Check if hand has 4+ cards of the same suit
 */
export function hasSuitedUp(hand: Card[]): { suited: boolean; suit?: string; count?: number } {
  const suitCounts = getSuitCounts(hand);
  for (const [suit, count] of suitCounts.entries()) {
    if (count >= 4) {
      return { suited: true, suit, count };
    }
  }
  return { suited: false };
}

/**
 * Check if hand has all 4 suits (rainbow)
 */
export function hasRainbow(hand: Card[]): boolean {
  const suits = new Set(hand.map(card => card.color));
  return suits.size === 4;
}

/**
 * Count how many 7s (highest value) are in the hand
 */
export function countSevens(hand: Card[]): number {
  return hand.filter(card => card.value === 7).length;
}

/**
 * Get average card value for the hand
 */
export function getAverageCardValue(hand: Card[]): number {
  if (hand.length === 0) return 0;
  const sum = hand.reduce((total, card) => total + card.value, 0);
  return sum / hand.length;
}

/**
 * Count trump cards in hand
 */
export function countTrumps(hand: Card[], trump: string | null): number {
  if (!trump) return 0;
  return hand.filter(card => card.color === trump).length;
}

/**
 * Analyze all hands for creative statistics
 */
export interface HandAnalysis {
  playerName: string;
  noRed: boolean;           // Monochrome - no red cards
  suitedUp?: {              // 4+ cards of same suit
    suit: string;
    count: number;
  };
  rainbow: boolean;          // Has all 4 suits
  sevensCount: number;       // Number of 7s
  avgValue: number;          // Average card value
  trumpCount: number;        // Number of trump cards
  lowestAvg?: boolean;       // Has lowest average value (will be set by comparison)
  highestAvg?: boolean;      // Has highest average value (will be set by comparison)
}

/**
 * Analyze all player hands for creative statistics
 */
export function analyzeStartingHands(
  initialHands: Map<string, Card[]>,
  trump: string | null
): Map<string, HandAnalysis> {
  const analyses = new Map<string, HandAnalysis>();

  // First pass: analyze each hand
  for (const [playerName, hand] of initialHands.entries()) {
    const suitedUp = hasSuitedUp(hand);
    const analysis: HandAnalysis = {
      playerName,
      noRed: hasNoRedCards(hand),
      suitedUp: suitedUp.suited ? { suit: suitedUp.suit!, count: suitedUp.count! } : undefined,
      rainbow: hasRainbow(hand),
      sevensCount: countSevens(hand),
      avgValue: getAverageCardValue(hand),
      trumpCount: countTrumps(hand, trump),
    };
    analyses.set(playerName, analysis);
  }

  // Second pass: determine lowest/highest averages
  let lowestAvg = Infinity;
  let highestAvg = -Infinity;
  let lowestPlayer = '';
  let highestPlayer = '';

  for (const [playerName, analysis] of analyses.entries()) {
    if (analysis.avgValue < lowestAvg) {
      lowestAvg = analysis.avgValue;
      lowestPlayer = playerName;
    }
    if (analysis.avgValue > highestAvg) {
      highestAvg = analysis.avgValue;
      highestPlayer = playerName;
    }
  }

  // Mark the players with lowest/highest averages
  if (lowestPlayer) {
    const analysis = analyses.get(lowestPlayer);
    if (analysis) analysis.lowestAvg = true;
  }
  if (highestPlayer && highestPlayer !== lowestPlayer) {
    const analysis = analyses.get(highestPlayer);
    if (analysis) analysis.highestAvg = true;
  }

  return analyses;
}
