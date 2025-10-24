/**
 * Pure state transformation functions for game actions.
 *
 * These functions transform game state without side effects.
 * They modify the game state object passed in (mutating approach for performance).
 *
 * Design principle: State functions handle business logic and state changes,
 * but do NOT perform I/O (no socket.emit, no console.log, no database calls).
 */

import { GameState, Card, Bet, Player, CardColor } from '../types/game';

/**
 * Result of playing a card - includes state changes and metadata
 */
export interface CardPlayResult {
  trickComplete: boolean;
  previousPlayerIndex: number;
  trumpWasSet: boolean;
  trump?: CardColor | null;
}

/**
 * Applies a card play to the game state.
 *
 * Performs the following state transformations:
 * - Sets trump if this is the first card of the first trick
 * - Adds card to current trick
 * - Removes card from player's hand
 * - Advances turn to next player
 * - Detects if trick is complete (4 cards played)
 *
 * Note: This function mutates the game state for performance.
 *
 * @param game - Game state (will be mutated)
 * @param playerId - ID of player playing the card
 * @param card - Card being played
 * @returns Metadata about the result including trump change and trick completion
 *
 * @example
 * const result = applyCardPlay(game, 'player-1', { color: 'red', value: 7 });
 * if (result.trickComplete) {
 *   resolveTrick(gameId);
 * } else {
 *   startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id);
 * }
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
 * Applies a bet to the game state.
 *
 * Performs the following state transformations:
 * - Adds bet to currentBets array
 * - Advances turn to next player
 * - Detects if betting is complete (all 4 players have bet)
 * - Detects if all players skipped (requires restart)
 *
 * Note: For skip bets, amount is set to 0 and withoutTrump to false.
 *
 * @param game - Game state (will be mutated)
 * @param playerId - ID of player placing bet
 * @param amount - Bet amount (7-12 points)
 * @param withoutTrump - Whether betting without trump
 * @param skipped - Whether the bet was skipped
 * @returns Metadata about betting completion and skip status
 *
 * @example
 * const result = applyBet(game, 'player-1', 10, false);
 * if (result.allPlayersSkipped) {
 *   resetBetting(game);
 * } else if (result.bettingComplete) {
 *   setPhase(game, 'playing');
 * }
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
 * Resets betting state for a new round of betting.
 *
 * Called when all 4 players skip their bet, requiring a restart.
 * Clears all bets and resets turn to player after dealer.
 *
 * @param game - Game state (will be mutated)
 *
 * @example
 * if (result.allPlayersSkipped) {
 *   resetBetting(game);
 *   io.to(gameId).emit('game_updated', game);
 * }
 */
export function resetBetting(game: GameState): void {
  game.currentBets = [];

  // Reset to player after dealer
  game.currentPlayerIndex = (game.dealerIndex + 1) % 4;
}

/**
 * Applies team selection to a player.
 *
 * Updates the player's teamId. If player is not found, no change occurs.
 *
 * @param game - Game state (will be mutated)
 * @param playerId - ID of player selecting team
 * @param teamId - Team to join (1 or 2)
 *
 * @example
 * const validation = validateTeamSelection(game, socket.id, teamId);
 * if (validation.valid) {
 *   applyTeamSelection(game, socket.id, teamId);
 *   io.to(gameId).emit('game_updated', game);
 * }
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
 * Swaps positions of two players in the game.
 *
 * Swaps player positions in the players array, which determines:
 * - Turn order during betting and playing
 * - Visual position in the UI (circular layout)
 *
 * If either player is not found, no change occurs.
 *
 * @param game - Game state (will be mutated)
 * @param player1Id - First player ID
 * @param player2Id - Second player ID
 *
 * @example
 * const validation = validatePositionSwap(game, socket.id, targetPlayerId);
 * if (validation.valid) {
 *   applyPositionSwap(game, socket.id, targetPlayerId);
 *   io.to(gameId).emit('game_updated', game);
 * }
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
 * Initializes a new round of the game.
 *
 * Performs the following state transformations:
 * - Deals 8 cards to each of 4 players from deck
 * - Resets betting and trick state
 * - Clears trump
 * - Transitions to betting phase
 * - Rotates dealer clockwise
 * - Sets current player to player after dealer
 *
 * @param game - Game state (will be mutated)
 * @param deck - Shuffled deck of 32 cards (8 per player)
 *
 * @example
 * const deck = createShuffledDeck();
 * initializeRound(game, deck);
 * io.to(gameId).emit('round_started', game);
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
 * Clears the current trick and sets the next player.
 *
 * Called after a trick is resolved. The winner of the trick
 * becomes the current player and leads the next trick.
 *
 * @param game - Game state (will be mutated)
 * @param winnerId - ID of player who won the trick
 *
 * @example
 * const winnerId = determineWinner(game.currentTrick, game.trump);
 * clearTrick(game, winnerId);
 * io.to(gameId).emit('trick_resolved', { winnerId, points, gameState: game });
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
 * Note: Points are tracked per player in player.pointsWon
 * This function is not currently used in the codebase.
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
  // Points are tracked per player, not per team in current round
  // This is a placeholder for future use if needed
  // Currently, points are accumulated in player.pointsWon
}

/**
 * Updates team scores based on round results.
 *
 * Adds round scores to team totals and checks for game over (41+ points).
 *
 * @param game - Game state (will be mutated)
 * @param team1RoundScore - Score for team 1 this round
 * @param team2RoundScore - Score for team 2 this round
 * @returns Whether the game is over (a team reached 41+ points)
 *
 * @example
 * const { team1Score, team2Score } = calculateRoundScore(game);
 * const gameOver = updateScores(game, team1Score, team2Score);
 * if (gameOver) {
 *   const winningTeam = game.teamScores.team1 >= 41 ? 1 : 2;
 *   io.to(gameId).emit('game_over', { winningTeam, gameState: game });
 * }
 */
export function updateScores(
  game: GameState,
  team1RoundScore: number,
  team2RoundScore: number
): boolean {
  game.teamScores.team1 += team1RoundScore;
  game.teamScores.team2 += team2RoundScore;

  // Check for game over (41+ points)
  return game.teamScores.team1 >= 41 || game.teamScores.team2 >= 41;
}

/**
 * Transitions game to a new phase.
 *
 * Valid phases: 'team_selection', 'betting', 'playing', 'scoring'
 *
 * @param game - Game state (will be mutated)
 * @param newPhase - New phase to transition to
 *
 * @example
 * if (result.bettingComplete) {
 *   setPhase(game, 'playing');
 *   io.to(gameId).emit('game_updated', game);
 * }
 */
export function setPhase(
  game: GameState,
  newPhase: GameState['phase']
): void {
  game.phase = newPhase;
}
