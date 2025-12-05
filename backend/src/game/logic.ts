/**
 * Pure game logic functions for trick card game.
 *
 * These functions contain the core game rules:
 * - Card point values (red 0 = +5, brown 0 = -3)
 * - Trick winner determination (trump > led suit > off-suit)
 * - Round scoring (bet met or failed, with/without trump multiplier)
 * - Bet comparison (higher amount > same amount with "without trump")
 */

import { Card, CardColor, TrickCard, Player, Bet } from '../types/game';

/**
 * Gets the point value of a card.
 *
 * Point values:
 * - Red 0 card: +5 points
 * - Brown 0 card: -3 points
 * - All other cards: 0 points
 *
 * @param card - Card to evaluate
 * @returns Point value of the card
 *
 * @example
 * getCardPoints({ color: 'red', value: 0 }) // returns 5
 * getCardPoints({ color: 'brown', value: 0 }) // returns -3
 * getCardPoints({ color: 'blue', value: 7 }) // returns 0
 */
export const getCardPoints = (card: Card): number => {
  // Special cards
  if (card.color === 'red' && card.value === 0) return 5;
  if (card.color === 'brown' && card.value === 0) return -3;
  return 0;
};

/**
 * Determines the winner of a trick.
 *
 * Game rules for winning a trick:
 * 1. Trump always beats non-trump
 * 2. Within trump cards, higher value wins
 * 3. Led suit beats off-suit (when no trump)
 * 4. Within led suit, higher value wins
 * 5. Off-suit cards cannot win (unless all cards are off-suit)
 *
 * The first card played determines the led suit.
 *
 * @param trick - Array of 4 cards played in the trick
 * @param trump - Trump color for this round (null if not set yet)
 * @returns ID of the player who won the trick
 * @throws Error if trick is empty
 *
 * @example
 * const trick = [
 *   { playerId: 'p1', card: { color: 'red', value: 7 } },
 *   { playerId: 'p2', card: { color: 'blue', value: 4 } },
 *   { playerId: 'p3', card: { color: 'red', value: 3 } },
 *   { playerId: 'p4', card: { color: 'green', value: 2 } }
 * ];
 * const winner = determineWinner(trick, 'blue'); // 'p2' (trump beats all)
 */
export const determineWinner = (
  trick: TrickCard[],
  trump: CardColor | null
): string => {
  if (trick.length === 0) throw new Error('Empty trick');

  const ledSuit = trick[0].card.color; // First card determines the led sui
  let winningCard = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];
    const currentIsTrump = trump && current.card.color === trump;
    const winningIsTrump = trump && winningCard.card.color === trump;
    const currentIsLedSuit = current.card.color === ledSuit;
    const winningIsLedSuit = winningCard.card.color === ledSuit;

    // Trump always beats non-trump
    if (currentIsTrump && !winningIsTrump) {
      winningCard = current;
    }
    // If both are trump, higher value wins
    else if (currentIsTrump && winningIsTrump) {
      if (current.card.value > winningCard.card.value) {
        winningCard = current;
      }
    }
    // If winning card is trump, current can't beat it (unless also trump, handled above)
    else if (winningIsTrump) {
      // Do nothing, trump stays winning
    }
    // Led suit beats off-suit (when no trump involved)
    else if (currentIsLedSuit && !winningIsLedSuit) {
      winningCard = current;
    }
    // If both are led suit, higher value wins
    else if (currentIsLedSuit && winningIsLedSuit) {
      if (current.card.value > winningCard.card.value) {
        winningCard = current;
      }
    }
    // Both are off-suit (not trump, not led suit) - keep the winning card as is
  }

  return winningCard.playerId;
};

/**
 * Calculates the total point value of all cards in a trick.
 *
 * Sums the special card points (red 0 = +5, brown 0 = -3).
 * Most tricks are worth 0 points unless they contain special cards.
 *
 * @param trick - Array of cards in the completed trick
 * @returns Total point value of the trick
 *
 * @example
 * const trick = [
 *   { playerId: 'p1', card: { color: 'red', value: 0 } },  // +5 points
 *   { playerId: 'p2', card: { color: 'blue', value: 7 } }, // 0 points
 *   { playerId: 'p3', card: { color: 'brown', value: 0 } }, // -3 points
 *   { playerId: 'p4', card: { color: 'green', value: 5 } } // 0 points
 * ];
 * calculateTrickPoints(trick); // returns 2 (5 + 0 - 3 + 0)
 */
export const calculateTrickPoints = (trick: TrickCard[]): number => {
  return trick.reduce((sum, tc) => sum + getCardPoints(tc.card), 0);
};

/**
 * Calculates a player's score for the round based on their bet.
 *
 * Scoring rules:
 * - If points won >= bet amount: Score = bet amount × multiplier
 * - If points won < bet amount: Score = -bet amount × multiplier
 * - Multiplier = 2 if "without trump", otherwise 1
 *
 * @param player - Player whose score to calculate (uses player.pointsWon)
 * @param bet - Player's bet for the round
 * @returns Round score (positive if bet met, negative if failed)
 *
 * @example
 * // Player bet 10 points and won 12 points
 * calculateRoundScore({ pointsWon: 12 }, { amount: 10, withoutTrump: false });
 * // returns 10
 *
 * // Player bet 10 "without trump" and won 12 points
 * calculateRoundScore({ pointsWon: 12 }, { amount: 10, withoutTrump: true });
 * // returns 20 (10 × 2)
 *
 * // Player bet 10 points but only won 7 points
 * calculateRoundScore({ pointsWon: 7 }, { amount: 10, withoutTrump: false });
 * // returns -10
 */
export const calculateRoundScore = (
  player: Player,
  bet: Bet
): number => {
  const pointsWon = player.pointsWon;
  const betAmount = bet.amount;
  const multiplier = bet.withoutTrump ? 2 : 1;

  if (pointsWon >= betAmount) {
    return betAmount * multiplier;
  } else {
    return -betAmount * multiplier;
  }
};

/**
 * Compares two bets to determine if bet1 is strictly higher than bet2.
 *
 * Bet comparison rules:
 * 1. Higher amount wins
 * 2. Same amount + "without trump" beats same amount with trump
 * 3. Equal bets (same amount, same withoutTrump) are NOT considered higher
 *
 * @param bet1 - First bet to compare
 * @param bet2 - Second bet to compare
 * @returns True if bet1 is strictly higher than bet2
 *
 * @example
 * isBetHigher({ amount: 11 }, { amount: 10 }); // true (11 > 10)
 * isBetHigher(
 *   { amount: 10, withoutTrump: true },
 *   { amount: 10, withoutTrump: false }
 * ); // true (same amount but without trump)
 * isBetHigher({ amount: 10 }, { amount: 11 }); // false (10 < 11)
 */
export const isBetHigher = (bet1: Bet, bet2: Bet): boolean => {
  // bet1 is higher if amount is greater
  if (bet1.amount > bet2.amount) return true;
  // bet1 is higher if same amount but withoutTrump
  if (bet1.amount === bet2.amount && bet1.withoutTrump && !bet2.withoutTrump) return true;
  return false;
};

/**
 * Finds the highest bet from an array of bets.
 *
 * Rules:
 * - Skipped bets are filtered out
 * - Compares bets using isBetHigher() (amount, then withoutTrump)
 * - Tie-breaker: Dealer wins when bets are exactly equal (dealer can "steal" by matching)
 *
 * @param bets - Array of all bets placed (in chronological order)
 * @param dealerPlayerId - Dealer's player ID for tie-breaking
 * @returns Highest bet, or null if no valid bets exist
 *
 * @example
 * const bets = [
 *   { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: false, skipped: false },
 *   { playerId: 'p2', playerName: 'Player 2', amount: 11, withoutTrump: false, skipped: false },
 *   { playerId: 'p3', playerName: 'Player 3', amount: 0, withoutTrump: false, skipped: true }
 * ];
 * getHighestBet(bets); // returns p2's bet (11 points)
 *
 * // Dealer tie-breaker - dealer wins when matching
 * const equalBets = [
 *   { playerId: 'p1', playerName: 'Player 1', amount: 10, withoutTrump: false },
 *   { playerId: 'p2', playerName: 'Player 2', amount: 10, withoutTrump: false } // dealer matched
 * ];
 * getHighestBet(equalBets, 'p2'); // returns p2's bet (dealer steals by matching)
 */
export const getHighestBet = (bets: Bet[], dealerPlayerId?: string): Bet | null => {
  if (bets.length === 0) return null;

  // Filter out skipped bets
  const validBets = bets.filter(bet => !bet.skipped);
  if (validBets.length === 0) return null;

  return validBets.reduce((highest, current) => {
    // Current bet strictly higher? It wins.
    if (isBetHigher(current, highest)) return current;

    // If bets are exactly equal (same amount AND same withoutTrump), dealer wins the tie
    if (
      current.amount === highest.amount &&
      current.withoutTrump === highest.withoutTrump &&
      dealerPlayerId &&
      current.playerId === dealerPlayerId
    ) {
      return current;
    }

    // Otherwise keep the current highest
    return highest;
  });
};

/**
 * Finds the winner's name from trick cards.
 *
 * Looks up the winner's stable playerName from the trick cards
 * to ensure reconnection stability.
 *
 * @param trick - Array of cards played in the trick
 * @param winnerId - ID of the player who won (from determineWinner)
 * @param players - Array of players in the game (fallback)
 * @returns Winner's name (stable identifier)
 *
 * @example
 * const trick = [
 *   { playerId: 'p1', playerName: 'Alice', card: { color: 'red', value: 7 } },
 *   { playerId: 'p2', playerName: 'Bob', card: { color: 'red', value: 5 } }
 * ];
 * getWinnerName(trick, 'p1', players); // returns 'Alice'
 */
export const getWinnerName = (
  trick: TrickCard[],
  winnerId: string,
  players: Player[]
): string => {
  const winningTrickCard = trick.find(tc => tc.playerId === winnerId);
  return winningTrickCard?.playerName ||
         players.find(p => p.id === winnerId)?.name ||
         winnerId;
};

/**
 * Checks if a trick contains a red zero card.
 *
 * Red zero cards are worth +5 bonus points to the trick winner.
 *
 * @param trick - Array of cards played in the trick
 * @returns True if trick contains red 0
 *
 * @example
 * hasRedZero([
 *   { playerId: 'p1', playerName: 'Alice', card: { color: 'red', value: 0 } }
 * ]); // returns true
 */
export const hasRedZero = (trick: TrickCard[]): boolean => {
  return trick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
};

/**
 * Checks if a trick contains a brown zero card.
 *
 * Brown zero cards are worth -2 penalty points to the trick winner.
 *
 * @param trick - Array of cards played in the trick
 * @returns True if trick contains brown 0
 *
 * @example
 * hasBrownZero([
 *   { playerId: 'p1', playerName: 'Alice', card: { color: 'brown', value: 0 } }
 * ]); // returns true
 */
export const hasBrownZero = (trick: TrickCard[]): boolean => {
  return trick.some(tc => tc.card.color === 'brown' && tc.card.value === 0);
};

/**
 * Finds the player with the fastest average card play time.
 *
 * @param cardPlayTimes - Map of player names to array of play times in milliseconds
 * @returns Player name with fastest average play time, or null if no data
 *
 * @example
 * const times = new Map([
 *   ['Alice', [1000, 2000, 1500]],
 *   ['Bob', [3000, 2500, 2000]]
 * ]);
 * getFastestPlayer(times); // returns 'Alice'
 */
export const getFastestPlayer = (
  cardPlayTimes: Map<string, number[]>
): { playerName: string; avgTime: number } | null => {
  let fastestPlayerName: string | null = null;
  let fastestAvgTime = Infinity;

  cardPlayTimes.forEach((times, playerName) => {
    if (times.length > 0) {
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      if (avgTime < fastestAvgTime) {
        fastestAvgTime = avgTime;
        fastestPlayerName = playerName;
      }
    }
  });

  return fastestPlayerName
    ? { playerName: fastestPlayerName, avgTime: fastestAvgTime }
    : null;
};

/**
 * Finds the player who played the most trump cards.
 *
 * @param trumpsPlayed - Map of player names to trump card counts
 * @returns Player name with most trumps played, or null if no data
 *
 * @example
 * const trumps = new Map([
 *   ['Alice', 3],
 *   ['Bob', 5],
 *   ['Carol', 2]
 * ]);
 * getTrumpMaster(trumps); // returns { playerName: 'Bob', count: 5 }
 */
export const getTrumpMaster = (
  trumpsPlayed: Map<string, number>
): { playerName: string; count: number } | null => {
  let trumpMasterName: string | null = null;
  let maxTrumps = 0;

  trumpsPlayed.forEach((count, playerName) => {
    if (count > maxTrumps) {
      maxTrumps = count;
      trumpMasterName = playerName;
    }
  });

  return trumpMasterName && maxTrumps > 0
    ? { playerName: trumpMasterName, count: maxTrumps }
    : null;
};

/**
 * Finds the luckiest player based on points per trick ratio.
 *
 * A player is considered lucky if they won significantly more points
 * per trick than the base value (>1.5 pts/trick).
 *
 * @param players - Array of players with tricksWon and pointsWon
 * @returns Luckiest player info, or null if no player qualifies
 *
 * @example
 * const players = [
 *   { id: 'p1', name: 'Alice', tricksWon: 3, pointsWon: 10, teamId: 1, hand: [], isBot: false },
 *   { id: 'p2', name: 'Bob', tricksWon: 2, pointsWon: 2, teamId: 2, hand: [], isBot: false }
 * ];
 * getLuckiestPlayer(players); // returns { player: Alice's object, pointsPerTrick: 3.3 }
 */
export const getLuckiestPlayer = (
  players: Player[]
): { player: Player; pointsPerTrick: number } | null => {
  let luckyPlayer: Player | null = null;
  let bestPointsPerTrick = 1.5; // Minimum threshold to qualify as "lucky"

  players.forEach(player => {
    if (player.tricksWon > 0) {
      const pointsPerTrick = player.pointsWon / player.tricksWon;
      if (pointsPerTrick > bestPointsPerTrick) {
        bestPointsPerTrick = pointsPerTrick;
        luckyPlayer = player;
      }
    }
  });

  return luckyPlayer
    ? { player: luckyPlayer, pointsPerTrick: bestPointsPerTrick }
    : null;
};
