/**
 * Pure validation functions for game actions.
 *
 * These functions validate game state without side effects.
 * They return validation results that can be used to emit appropriate errors.
 *
 * Design principle: Validation functions should be pure (no I/O, no mutations).
 */

import { GameState, Card, Player } from '../types/game';
import { Result, ok, err } from '../types/result';

/**
 * Validation result type - either success (void) or error with message
 *
 * @deprecated Use Result<void, string> directly instead
 */
export type ValidationResult = Result<void, string>;

/**
 * Validates if a card play is allowed.
 *
 * Checks all game rules for playing a card:
 * - Game must be in playing phase
 * - Player hasn't already played in current trick
 * - Trick isn't complete (waiting for resolution)
 * - It's the player's turn
 * - Card data is valid
 * - Card is in player's hand
 * - Suit-following rule is respected (if applicable)
 *
 * @param game - Current game state
 * @param playerId - ID of the player attempting to play
 * @param card - Card the player wants to play
 * @returns ValidationResult - Success or error with message
 *
 * @example
 * const result = validateCardPlay(game, 'player-1', { color: 'red', value: 7 });
 * if (!result.success) {
 *   socket.emit('invalid_move', { message: result.error });
 * }
 */
export function validateCardPlay(
  game: GameState,
  playerId: string,
  card: Card
): ValidationResult {
  // Check game phase
  if (game.phase !== 'playing') {
    return err('Game is not in playing phase');
  }

  // Check if player has already played in this trick
  const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerId === playerId);
  if (hasAlreadyPlayed) {
    return err('You have already played a card this trick');
  }

  // Check if trick is complete
  if (game.currentTrick.length >= 4) {
    return err('Please wait for the current trick to be resolved');
  }

  // Check if it's player's turn
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return err('It is not your turn');
  }

  // Validate card data structure
  if (!card || !card.color || card.value === undefined) {
    return err('Invalid card data');
  }

  // Validate card is in player's hand
  const cardInHand = currentPlayer.hand.find(
    c => c.color === card.color && c.value === card.value
  );
  if (!cardInHand) {
    return err('You do not have that card in your hand');
  }

  // Validate suit-following rule
  if (game.currentTrick.length > 0) {
    const ledSuit = game.currentTrick[0].card.color;
    const hasLedSuit = currentPlayer.hand.some(c => c.color === ledSuit);

    if (hasLedSuit && card.color !== ledSuit) {
      return err('You must follow suit if you have it in your hand');
    }
  }

  return ok(undefined);
}

/**
 * Validates if a bet is allowed.
 *
 * Checks betting rules:
 * - Game must be in betting phase
 * - It's the player's turn
 * - Player hasn't already bet
 * - Bet amount is in valid range (7-12) for non-skip bets
 * - Skip rules: dealer cannot skip if no one has bet
 *
 * @param game - Current game state
 * @param playerId - ID of the player attempting to bet
 * @param amount - Bet amount (7-12 points)
 * @param withoutTrump - Whether bet is "without trump"
 * @param skipped - Optional flag indicating if player is skipping
 * @returns ValidationResult - Success or error with message
 *
 * @example
 * const result = validateBet(game, 'player-1', 10, false);
 * if (!result.success) {
 *   socket.emit('invalid_bet', { message: result.error });
 * }
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
    return err('Game is not in betting phase');
  }

  // Check if it's player's turn
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return err('It is not your turn to bet');
  }

  // Check if player has already bet
  const hasAlreadyBet = game.currentBets.some(b => b.playerId === playerId);
  if (hasAlreadyBet) {
    return err('You have already placed your bet');
  }

  // Validate bet amount range (only for non-skip bets)
  if (!skipped && (amount < 7 || amount > 12)) {
    return err('Bet amount must be between 7 and 12');
  }

  // Handle skip bet validation
  if (skipped) {
    const isDealer = game.currentPlayerIndex === game.dealerIndex;
    const hasValidBets = game.currentBets.some(b => !b.skipped);

    // Dealer cannot skip if no one has bet
    if (isDealer && !hasValidBets) {
      return err('As dealer, you must bet at least 7 points when no one has bet.');
    }
  }

  return ok(undefined);
}

/**
 * Validates if a team selection is allowed.
 *
 * Checks team selection rules:
 * - Game must be in team_selection phase
 * - Player must exist in game
 * - Player is not already on the target team
 * - Target team is not full (max 2 players per team)
 *
 * @param game - Current game state
 * @param playerId - ID of the player selecting a team
 * @param teamId - Team to join (1 or 2)
 * @returns ValidationResult - Success or error with message
 *
 * @example
 * const result = validateTeamSelection(game, 'player-1', 1);
 * if (!result.success) {
 *   socket.emit('error', { message: result.error });
 * }
 */
export function validateTeamSelection(
  game: GameState,
  playerId: string,
  teamId: 1 | 2
): ValidationResult {
  // Check game phase
  if (game.phase !== 'team_selection') {
    return err('Game is not in team selection phase');
  }

  const player = game.players.find(p => p.id === playerId);
  if (!player) {
    return err('Player not found in game');
  }

  // Check if player is already on the team
  if (player.teamId === teamId) {
    return err('You are already on this team');
  }

  // Check if team is full (2 players per team)
  const teamPlayers = game.players.filter(p => p.teamId === teamId);
  if (teamPlayers.length >= 2) {
    return err('Team is full');
  }

  return ok(undefined);
}

/**
 * Validates if a position swap is allowed.
 *
 * Checks position swap rules:
 * - Game must be in team_selection phase
 * - Both initiator and target players exist
 * - Player is not swapping with themselves
 *
 * @param game - Current game state
 * @param initiatorId - ID of the player initiating the swap
 * @param targetPlayerId - ID of the player to swap positions with
 * @returns ValidationResult - Success or error with message
 *
 * @example
 * const result = validatePositionSwap(game, 'player-1', 'player-2');
 * if (!result.success) {
 *   socket.emit('error', { message: result.error });
 * }
 */
export function validatePositionSwap(
  game: GameState,
  initiatorId: string,
  targetPlayerId: string
): ValidationResult {
  // Check game phase
  if (game.phase !== 'team_selection') {
    return err('Position swapping is only allowed during team selection');
  }

  const initiator = game.players.find(p => p.id === initiatorId);
  const target = game.players.find(p => p.id === targetPlayerId);

  if (!initiator || !target) {
    return err('Player not found');
  }

  // Can't swap with yourself
  if (initiatorId === targetPlayerId) {
    return err('Cannot swap position with yourself');
  }

  // Can only swap with players on the same team
  if (initiator.teamId !== target.teamId) {
    return err('Can only swap positions with teammates');
  }

  return ok(undefined);
}

/**
 * Validates if the game can start.
 *
 * Checks game start requirements:
 * - Game must be in team_selection phase
 * - Exactly 4 players must be present
 * - Teams must be balanced (2 players per team)
 *
 * @param game - Current game state
 * @returns ValidationResult - Success or error with message
 *
 * @example
 * const result = validateGameStart(game);
 * if (!result.success) {
 *   socket.emit('error', { message: result.error });
 * } else {
 *   startNewRound(gameId);
 * }
 */
export function validateGameStart(game: GameState): ValidationResult {
  // Check game phase
  if (game.phase !== 'team_selection') {
    return err('Game cannot be started from this phase');
  }

  // Check player count
  if (game.players.length !== 4) {
    return err('Need exactly 4 players to start');
  }

  // Check team balance
  const team1Count = game.players.filter(p => p.teamId === 1).length;
  const team2Count = game.players.filter(p => p.teamId === 2).length;

  if (team1Count !== 2 || team2Count !== 2) {
    return err('Teams must be balanced (2 players per team)');
  }

  return ok(undefined);
}
