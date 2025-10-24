/**
 * Pure validation functions for game actions.
 *
 * These functions validate game state without side effects.
 * They return validation results that can be used to emit appropriate errors.
 *
 * Design principle: Validation functions should be pure (no I/O, no mutations).
 */

import { GameState, Card, Player } from '../types/game';

/**
 * Validation result type - either success or error with message
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Validates if a card play is allowed
 */
export function validateCardPlay(
  game: GameState,
  playerId: string,
  card: Card
): ValidationResult {
  // Check game phase
  if (game.phase !== 'playing') {
    return { valid: false, error: 'Game is not in playing phase' };
  }

  // Check if player has already played in this trick
  const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerId === playerId);
  if (hasAlreadyPlayed) {
    return { valid: false, error: 'You have already played a card this trick' };
  }

  // Check if trick is complete
  if (game.currentTrick.length >= 4) {
    return { valid: false, error: 'Please wait for the current trick to be resolved' };
  }

  // Check if it's player's turn
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return { valid: false, error: 'It is not your turn' };
  }

  // Validate card data structure
  if (!card || !card.color || card.value === undefined) {
    return { valid: false, error: 'Invalid card data' };
  }

  // Validate card is in player's hand
  const cardInHand = currentPlayer.hand.find(
    c => c.color === card.color && c.value === card.value
  );
  if (!cardInHand) {
    return { valid: false, error: 'You do not have that card in your hand' };
  }

  // Validate suit-following rule
  if (game.currentTrick.length > 0) {
    const ledSuit = game.currentTrick[0].card.color;
    const hasLedSuit = currentPlayer.hand.some(c => c.color === ledSuit);

    if (hasLedSuit && card.color !== ledSuit) {
      return { valid: false, error: 'You must follow suit if you have it in your hand' };
    }
  }

  return { valid: true };
}

/**
 * Validates if a bet is allowed
 */
export function validateBet(
  game: GameState,
  playerId: string,
  amount: number,
  withoutTrump: boolean,
  skipped?: boolean
): ValidationResult {
  // Check game phase
  if (game.phase !== 'betting') {
    return { valid: false, error: 'Game is not in betting phase' };
  }

  // Check if it's player's turn
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return { valid: false, error: 'It is not your turn to bet' };
  }

  // Check if player has already bet
  const hasAlreadyBet = game.currentBets.some(b => b.playerId === playerId);
  if (hasAlreadyBet) {
    return { valid: false, error: 'You have already placed your bet' };
  }

  // Validate bet amount range (only for non-skip bets)
  if (!skipped && (amount < 7 || amount > 12)) {
    return { valid: false, error: 'Bet amount must be between 7 and 12' };
  }

  // Handle skip bet validation
  if (skipped) {
    const isDealer = game.currentPlayerIndex === game.dealerIndex;
    const hasValidBets = game.currentBets.some(b => !b.skipped);

    // Dealer cannot skip if no one has bet
    if (isDealer && !hasValidBets) {
      return { valid: false, error: 'As dealer, you must bet at least 7 points when no one has bet.' };
    }
  }

  return { valid: true };
}

/**
 * Validates if a team selection is allowed
 */
export function validateTeamSelection(
  game: GameState,
  playerId: string,
  teamId: 1 | 2
): ValidationResult {
  // Check game phase
  if (game.phase !== 'team_selection') {
    return { valid: false, error: 'Game is not in team selection phase' };
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found in game' };
  }

  // Check if player is already on the team
  if (player.teamId === teamId) {
    return { valid: false, error: 'You are already on this team' };
  }

  // Check if team is full (2 players per team)
  const teamPlayers = game.players.filter(p => p.teamId === teamId);
  if (teamPlayers.length >= 2) {
    return { valid: false, error: 'Team is full' };
  }

  return { valid: true };
}

/**
 * Validates if a position swap is allowed
 */
export function validatePositionSwap(
  game: GameState,
  initiatorId: string,
  targetPlayerId: string
): ValidationResult {
  // Check game phase
  if (game.phase !== 'team_selection') {
    return { valid: false, error: 'Position swapping is only allowed during team selection' };
  }

  const initiator = game.players.find(p => p.id === initiatorId);
  const target = game.players.find(p => p.id === targetPlayerId);

  if (!initiator || !target) {
    return { valid: false, error: 'Player not found' };
  }

  // Can't swap with yourself
  if (initiatorId === targetPlayerId) {
    return { valid: false, error: 'Cannot swap position with yourself' };
  }

  return { valid: true };
}

/**
 * Validates if the game can start
 */
export function validateGameStart(game: GameState): ValidationResult {
  // Check game phase
  if (game.phase !== 'team_selection') {
    return { valid: false, error: 'Game cannot be started from this phase' };
  }

  // Check player count
  if (game.players.length !== 4) {
    return { valid: false, error: 'Need exactly 4 players to start' };
  }

  // Check team balance
  const team1Count = game.players.filter(p => p.teamId === 1).length;
  const team2Count = game.players.filter(p => p.teamId === 2).length;

  if (team1Count !== 2 || team2Count !== 2) {
    return { valid: false, error: 'Teams must be balanced (2 players per team)' };
  }

  return { valid: true };
}
