/**
 * Pure state transformation functions for game actions.
 *
 * These functions transform game state without side effects.
 * They modify the game state object passed in (mutating approach for performance).
 *
 * Design principle: State functions handle business logic and state changes,
 * but do NOT perform I/O (no socket.emit, no console.log, no database calls).
 */

import { GameState, Card, Bet, Player } from '../types/game';

/**
 * Result of playing a card - includes state changes and metadata
 */
export interface CardPlayResult {
  trickComplete: boolean;
  previousPlayerIndex: number;
  trumpWasSet: boolean;
  trump?: string;
}

/**
 * Applies a card play to the game state
 *
 * @param game - Game state (will be mutated)
 * @param playerId - ID of player playing the card
 * @param card - Card being played
 * @returns Metadata about the result of the play
 */
export function applyCardPlay(
  game: GameState,
  playerId: string,
  card: Card
): CardPlayResult {
  const currentPlayer = game.players[game.currentPlayerIndex];
  let trumpWasSet = false;

  // Set trump on first card of first trick
  if (game.currentTrick.length === 0 && !game.trump) {
    game.trump = card.color;
    trumpWasSet = true;
  }

  // Add card to trick
  game.currentTrick.push({ playerId, card });

  // Remove card from player's hand
  currentPlayer.hand = currentPlayer.hand.filter(
    c => !(c.color === card.color && c.value === card.value)
  );

  // Store previous index before advancing
  const previousPlayerIndex = game.currentPlayerIndex;

  // Advance to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

  // Check if trick is complete
  const trickComplete = game.currentTrick.length === 4;

  return {
    trickComplete,
    previousPlayerIndex,
    trumpWasSet,
    trump: trumpWasSet ? game.trump : undefined,
  };
}

/**
 * Result of placing a bet
 */
export interface BetPlaceResult {
  allPlayersSkipped: boolean;
  bettingComplete: boolean;
}

/**
 * Applies a bet to the game state
 *
 * @param game - Game state (will be mutated)
 * @param playerId - ID of player placing bet
 * @param amount - Bet amount (7-12)
 * @param withoutTrump - Whether betting without trump
 * @param skipped - Whether the bet was skipped
 * @returns Metadata about the result
 */
export function applyBet(
  game: GameState,
  playerId: string,
  amount: number,
  withoutTrump: boolean,
  skipped?: boolean
): BetPlaceResult {
  const bet: Bet = {
    playerId,
    amount: skipped ? 0 : amount,
    withoutTrump: skipped ? false : withoutTrump,
    skipped: skipped || false,
  };

  game.currentBets.push(bet);

  // Advance to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

  // Check if all 4 players have bet
  const bettingComplete = game.currentBets.length === 4;

  // Check if all players skipped
  const allPlayersSkipped = bettingComplete && game.currentBets.every(b => b.skipped);

  return {
    allPlayersSkipped,
    bettingComplete,
  };
}

/**
 * Resets betting state for a new round of betting
 *
 * @param game - Game state (will be mutated)
 */
export function resetBetting(game: GameState): void {
  game.currentBets = [];

  // Reset to player after dealer
  game.currentPlayerIndex = (game.dealerIndex + 1) % 4;
}

/**
 * Applies team selection to a player
 *
 * @param game - Game state (will be mutated)
 * @param playerId - ID of player selecting team
 * @param teamId - Team to join (1 or 2)
 */
export function applyTeamSelection(
  game: GameState,
  playerId: string,
  teamId: 1 | 2
): void {
  const player = game.players.find(p => p.id === playerId);
  if (player) {
    player.teamId = teamId;
  }
}

/**
 * Swaps positions of two players
 *
 * @param game - Game state (will be mutated)
 * @param player1Id - First player ID
 * @param player2Id - Second player ID
 */
export function applyPositionSwap(
  game: GameState,
  player1Id: string,
  player2Id: string
): void {
  const player1Index = game.players.findIndex(p => p.id === player1Id);
  const player2Index = game.players.findIndex(p => p.id === player2Id);

  if (player1Index !== -1 && player2Index !== -1) {
    // Swap players in array
    [game.players[player1Index], game.players[player2Index]] =
      [game.players[player2Index], game.players[player1Index]];
  }
}

/**
 * Initializes a new round
 *
 * @param game - Game state (will be mutated)
 * @param deck - Shuffled deck of cards
 */
export function initializeRound(game: GameState, deck: Card[]): void {
  // Deal cards (8 per player)
  for (let i = 0; i < 4; i++) {
    game.players[i].hand = deck.slice(i * 8, (i + 1) * 8);
  }

  // Reset round state
  game.currentBets = [];
  game.currentTrick = [];
  game.trump = null;
  game.phase = 'betting';

  // Rotate dealer
  game.dealerIndex = (game.dealerIndex + 1) % 4;

  // Set current player to player after dealer
  game.currentPlayerIndex = (game.dealerIndex + 1) % 4;
}

/**
 * Clears the current trick and sets the next player
 *
 * @param game - Game state (will be mutated)
 * @param winnerId - ID of player who won the trick
 */
export function clearTrick(game: GameState, winnerId: string): void {
  game.currentTrick = [];

  // Set winner as next player
  const winnerIndex = game.players.findIndex(p => p.id === winnerId);
  if (winnerIndex !== -1) {
    game.currentPlayerIndex = winnerIndex;
  }
}

/**
 * Records points won by a team in the current round
 *
 * @param game - Game state (will be mutated)
 * @param teamId - Team that won points (1 or 2)
 * @param points - Points won
 */
export function addTeamPoints(
  game: GameState,
  teamId: 1 | 2,
  points: number
): void {
  if (teamId === 1) {
    game.team1PointsWon = (game.team1PointsWon || 0) + points;
  } else {
    game.team2PointsWon = (game.team2PointsWon || 0) + points;
  }
}

/**
 * Updates team scores based on round results
 *
 * @param game - Game state (will be mutated)
 * @param team1RoundScore - Score for team 1 this round
 * @param team2RoundScore - Score for team 2 this round
 * @returns Whether the game is over (a team reached 41+ points)
 */
export function updateScores(
  game: GameState,
  team1RoundScore: number,
  team2RoundScore: number
): boolean {
  game.team1Score += team1RoundScore;
  game.team2Score += team2RoundScore;

  // Check for game over (41+ points)
  return game.team1Score >= 41 || game.team2Score >= 41;
}

/**
 * Transitions game phase
 *
 * @param game - Game state (will be mutated)
 * @param newPhase - New phase to transition to
 */
export function setPhase(
  game: GameState,
  newPhase: GameState['phase']
): void {
  game.phase = newPhase;
}
