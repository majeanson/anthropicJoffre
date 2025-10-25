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

  // Set trump on first card of first trick (unless bet was "without trump")
  if (game.currentTrick.length === 0 && !game.trump && !game.highestBet?.withoutTrump) {
    game.trump = card.color;
    trumpWasSet = true;
  }

  // Add card to trick (include playerName for stable identification across reconnects)
  game.currentTrick.push({
    playerId,
    playerName: currentPlayer.name,
    card
  });

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

    // FIX: Enforce alternating team pattern (1-2-1-2) to maintain turn order
    // This prevents turn order bugs when positions are swapped
    game.players.forEach((player, index) => {
      player.teamId = (index % 2 === 0 ? 1 : 2) as 1 | 2;
    });
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

/**
 * Result of trick resolution including metadata
 */
export interface TrickResolutionResult {
  winnerId: string;
  points: number;
  isRoundOver: boolean;
  winnerIndex: number;
}

/**
 * Applies trick resolution to game state.
 *
 * Performs the following transformations:
 * - Awards tricks and points to winner
 * - Stores current trick as previousTrick
 * - Adds trick to currentRoundTricks history
 * - Clears currentTrick
 * - Sets winner as next player
 * - Transitions to 'scoring' phase if round is over
 *
 * Note: Requires currentTrick to have 4 cards.
 *
 * @param game - Game state (will be mutated)
 * @param winnerId - ID of player who won the trick
 * @param points - Total points for the trick (1 + special card points)
 * @returns Metadata about the resolution
 *
 * @example
 * const winnerId = determineWinner(game.currentTrick, game.trump);
 * const specialPoints = calculateTrickPoints(game.currentTrick);
 * const totalPoints = 1 + specialPoints;
 * const result = applyTrickResolution(game, winnerId, totalPoints);
 * if (result.isRoundOver) {
 *   setTimeout(() => endRound(gameId), 3000);
 * }
 */
export function applyTrickResolution(
  game: GameState,
  winnerId: string,
  points: number
): TrickResolutionResult {
  console.log(`🔧 applyTrickResolution START: currentTrick.length = ${game.currentTrick.length}`);

  // Look up winner by name first (stable), fallback to ID (for backwards compat)
  // winnerId might be a playerName or a socket ID depending on caller
  let winnerIndex = game.players.findIndex(p => p.name === winnerId);
  if (winnerIndex === -1) {
    winnerIndex = game.players.findIndex(p => p.id === winnerId);
  }

  if (winnerIndex === -1) {
    throw new Error('Winner not found in players list');
  }

  const winner = game.players[winnerIndex];

  // Award trick and points to winner
  winner.tricksWon += 1;
  winner.pointsWon += points;

  console.log(`🔧 Before storing trick: currentTrick.length = ${game.currentTrick.length}`);

  // Store trick result before clearing (include both winnerId and winnerName)
  const trickResult = {
    trick: [...game.currentTrick],
    winnerId: winner.id, // Current socket ID (may change on reconnect)
    winnerName: winner.name, // Stable identifier
    points,
  };

  console.log(`🔧 After creating trickResult: currentTrick.length = ${game.currentTrick.length}, trickResult.trick.length = ${trickResult.trick.length}`);

  game.previousTrick = trickResult;
  game.currentRoundTricks.push(trickResult);

  // Check if round is over (all players have empty hands)
  const isRoundOver = game.players.every(p => p.hand.length === 0);

  // DON'T clear current trick here - it will be cleared after delay in resolveTrick()
  // This allows the trick to remain visible for 2 seconds
  // game.currentTrick = []; // Moved to resolveTrick setTimeout

  // Set winner as next player
  game.currentPlayerIndex = winnerIndex;

  // If round is over, transition to scoring phase
  if (isRoundOver) {
    game.phase = 'scoring';
  }

  console.log(`🔧 applyTrickResolution END: currentTrick.length = ${game.currentTrick.length}`);

  return {
    winnerId,
    points,
    isRoundOver,
    winnerIndex,
  };
}

/**
 * Result of round scoring calculations
 */
export interface RoundScoringResult {
  offensiveTeamId: 1 | 2;
  defensiveTeamId: 1 | 2;
  offensiveTeamPoints: number;
  defensiveTeamPoints: number;
  betAmount: number;
  withoutTrump: boolean;
  multiplier: number;
  betMade: boolean;
  offensiveScore: number;
  defensiveScore: number;
  roundScore: {
    team1: number;
    team2: number;
  };
  newTeamScores: {
    team1: number;
    team2: number;
  };
  gameOver: boolean;
  winningTeam?: 1 | 2;
}

/**
 * Calculates round scoring based on bet results.
 *
 * Determines offensive/defensive teams, calculates points earned,
 * applies bet multipliers, and computes new team scores.
 *
 * Scoring rules:
 * - Offensive team (highest bettor): +/- bet amount × multiplier
 * - Defensive team: always + their points earned
 * - Multiplier: 2 if "without trump", otherwise 1
 * - Game over if either team reaches 41+ points
 *
 * @param game - Current game state (not mutated)
 * @returns Complete scoring breakdown and new scores
 *
 * @example
 * const scoring = calculateRoundScoring(game);
 * console.log(`Team ${scoring.offensiveTeamId} ${scoring.betMade ? 'made' : 'failed'} bet`);
 * applyRoundScoring(game, scoring);
 */
export function calculateRoundScoring(game: GameState): RoundScoringResult {
  if (!game.highestBet) {
    throw new Error('No highest bet found for scoring');
  }

  // Look up betting player - try by ID first, then by name (in case player was replaced by bot)
  let offensivePlayer = game.players.find(p => p.id === game.highestBet?.playerId);

  // If not found by ID, try finding by playerId in currentBets (which has both playerId and name)
  if (!offensivePlayer && game.highestBet?.playerId) {
    const bet = game.currentBets.find(b => b.playerId === game.highestBet?.playerId);
    if (bet) {
      // Find player who placed this bet (might have different ID now if replaced by bot)
      offensivePlayer = game.players.find(p =>
        game.currentTrick.some(tc => tc.playerId === bet.playerId && tc.playerName === p.name)
      );
    }
  }

  if (!offensivePlayer) {
    console.error('Failed to find betting player. Game state:', {
      highestBetPlayerId: game.highestBet?.playerId,
      players: game.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot })),
      currentBets: game.currentBets
    });
    throw new Error('Betting player not found');
  }

  const offensiveTeamId = offensivePlayer.teamId;
  const defensiveTeamId = offensiveTeamId === 1 ? 2 : 1;

  // Calculate team totals
  const offensiveTeamPoints = game.players
    .filter(p => p.teamId === offensiveTeamId)
    .reduce((sum, p) => sum + p.pointsWon, 0);

  const defensiveTeamPoints = game.players
    .filter(p => p.teamId === defensiveTeamId)
    .reduce((sum, p) => sum + p.pointsWon, 0);

  const betAmount = game.highestBet.amount;
  const multiplier = game.highestBet.withoutTrump ? 2 : 1;
  const betMade = offensiveTeamPoints >= betAmount;

  // Calculate scores
  const offensiveScore = betMade
    ? betAmount * multiplier
    : -(betAmount * multiplier);
  const defensiveScore = defensiveTeamPoints;

  const roundScore = {
    team1: offensiveTeamId === 1 ? offensiveScore : defensiveScore,
    team2: offensiveTeamId === 2 ? offensiveScore : defensiveScore,
  };

  const newTeamScores = {
    team1: game.teamScores.team1 + roundScore.team1,
    team2: game.teamScores.team2 + roundScore.team2,
  };

  const gameOver = newTeamScores.team1 >= 41 || newTeamScores.team2 >= 41;
  const winningTeam = gameOver
    ? (newTeamScores.team1 >= 41 ? 1 : 2)
    : undefined;

  return {
    offensiveTeamId,
    defensiveTeamId,
    offensiveTeamPoints,
    defensiveTeamPoints,
    betAmount,
    withoutTrump: game.highestBet.withoutTrump,
    multiplier,
    betMade,
    offensiveScore,
    defensiveScore,
    roundScore,
    newTeamScores,
    gameOver,
    winningTeam: winningTeam as 1 | 2 | undefined,
  };
}

/**
 * Applies round scoring to game state.
 *
 * Updates team scores, adds round to history, and transitions
 * to game_over phase if a team reached 41+ points.
 *
 * @param game - Game state (will be mutated)
 * @param scoring - Scoring calculation from calculateRoundScoring()
 *
 * @example
 * const scoring = calculateRoundScoring(game);
 * applyRoundScoring(game, scoring);
 * if (scoring.gameOver) {
 *   io.to(gameId).emit('game_over', {
 *     winningTeam: scoring.winningTeam,
 *     gameState: game
 *   });
 * }
 */
export function applyRoundScoring(
  game: GameState,
  scoring: RoundScoringResult
): void {
  // Update team scores
  game.teamScores.team1 = scoring.newTeamScores.team1;
  game.teamScores.team2 = scoring.newTeamScores.team2;

  // Add to round history
  game.roundHistory.push({
    roundNumber: game.roundNumber,
    bets: [...game.currentBets],
    highestBet: game.highestBet!,
    offensiveTeam: scoring.offensiveTeamId,
    offensivePoints: scoring.offensiveTeamPoints,
    defensivePoints: scoring.defensiveTeamPoints,
    betAmount: scoring.betAmount,
    withoutTrump: scoring.withoutTrump,
    betMade: scoring.betMade,
    roundScore: scoring.roundScore,
    cumulativeScore: {
      team1: scoring.newTeamScores.team1,
      team2: scoring.newTeamScores.team2,
    },
    tricks: [...game.currentRoundTricks],
    trump: game.trump,
  });

  // Transition to game_over if applicable
  if (scoring.gameOver) {
    game.phase = 'game_over';
  }
}
