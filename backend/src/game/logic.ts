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
 * - Tie-breaker: If bets are exactly equal, dealer wins
 *
 * @param bets - Array of all bets placed
 * @param dealerPlayerId - Optional dealer ID (for tie-breaking)
 * @returns Highest bet, or null if no valid bets exist
 *
 * @example
 * const bets = [
 *   { playerId: 'p1', amount: 10, withoutTrump: false, skipped: false },
 *   { playerId: 'p2', amount: 11, withoutTrump: false, skipped: false },
 *   { playerId: 'p3', amount: 0, withoutTrump: false, skipped: true }
 * ];
 * getHighestBet(bets); // returns p2's bet (11 points)
 *
 * // Dealer tie-breaker
 * const equalBets = [
 *   { playerId: 'p1', amount: 10, withoutTrump: false, skipped: false },
 *   { playerId: 'p2', amount: 10, withoutTrump: false, skipped: false } // dealer
 * ];
 * getHighestBet(equalBets, 'p2'); // returns p2's bet (dealer wins tie)
 */
export const getHighestBet = (bets: Bet[], dealerPlayerId?: string): Bet | null => {
  if (bets.length === 0) return null;

  // Filter out skipped bets
  const validBets = bets.filter(bet => !bet.skipped);
  if (validBets.length === 0) return null;

  return validBets.reduce((highest, current) => {
    if (isBetHigher(current, highest)) return current;

    // If bets are exactly equal (same amount and withoutTrump status), dealer wins
    if (
      current.amount === highest.amount &&
      current.withoutTrump === highest.withoutTrump &&
      dealerPlayerId &&
      current.playerId === dealerPlayerId
    ) {
      return current;
    }

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
