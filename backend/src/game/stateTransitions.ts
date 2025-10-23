/**
 * Pure State Transition Functions
 *
 * This module contains pure functions for transforming game state.
 * These functions:
 * - Take game state as input
 * - Return new game state (immutable)
 * - Have no side effects (no I/O, no mutations)
 * - Are easily testable
 *
 * Benefits:
 * - Enable undo/redo functionality
 * - Easier to reason about and test
 * - Better separation of concerns
 * - Potential for time-travel debugging
 */

import { GameState, Player, Bet, Card, TrickCard, TrickResult } from '../types/game';
import { determineWinner, calculateTrickPoints } from './logic';

/**
 * Team Selection Phase Transitions
 */

export function selectTeam(game: GameState, playerId: string, teamId: 1 | 2): GameState {
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  if (game.phase !== 'team_selection') {
    throw new Error(`Cannot select team in phase: ${game.phase}`);
  }

  // Check if team is full (max 2 players per team)
  const teamCount = game.players.filter(p => p.teamId === teamId).length;
  const currentTeamId = game.players[playerIndex].teamId;

  // If player is changing teams and target team is full, reject
  if (currentTeamId !== teamId && teamCount >= 2) {
    throw new Error('Team is full');
  }

  // Create new players array with updated team assignment
  const updatedPlayers = game.players.map((player, idx) =>
    idx === playerIndex ? { ...player, teamId } : player
  );

  return {
    ...game,
    players: updatedPlayers,
  };
}

export function swapPosition(game: GameState, playerId: string, targetPlayerId: string): GameState {
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  const targetIndex = game.players.findIndex(p => p.id === targetPlayerId);

  if (playerIndex === -1 || targetIndex === -1) {
    throw new Error('Player not found');
  }

  if (game.phase !== 'team_selection') {
    throw new Error(`Cannot swap positions in phase: ${game.phase}`);
  }

  // Prevent swapping with yourself
  if (playerId === targetPlayerId) {
    throw new Error('Cannot swap with yourself');
  }

  // Create new players array with swapped positions
  const newPlayers = [...game.players];
  [newPlayers[playerIndex], newPlayers[targetIndex]] =
    [newPlayers[targetIndex], newPlayers[playerIndex]];

  return {
    ...game,
    players: newPlayers,
  };
}

/**
 * Betting Phase Transitions
 */

export function placeBet(
  game: GameState,
  playerId: string,
  amount: number,
  withoutTrump: boolean,
  skipped: boolean = false
): GameState {
  if (game.phase !== 'betting') {
    throw new Error(`Cannot place bet in phase: ${game.phase}`);
  }

  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  // Verify it's player's turn
  if (game.currentPlayerIndex !== playerIndex) {
    throw new Error('Not your turn to bet');
  }

  // Check if player already bet this round
  const hasAlreadyBet = game.currentBets.some(bet => bet.playerId === playerId);
  if (hasAlreadyBet) {
    throw new Error('You have already placed a bet this round');
  }

  // Validate bet logic (dealer rules, skip rules, etc.)
  const isDealer = playerIndex === game.dealerIndex;
  const hasActiveBets = game.currentBets.some(bet => !bet.skipped);

  if (!skipped) {
    // Validate bet amount
    if (amount < 7 || amount > 12) {
      throw new Error('Bet must be between 7 and 12');
    }

    // Non-dealers must beat highest bet or skip
    if (!isDealer && hasActiveBets) {
      const highestBet = game.highestBet;
      if (highestBet && !isBetHigher(amount, withoutTrump, highestBet.amount, highestBet.withoutTrump)) {
        throw new Error('You must raise the bet or skip');
      }
    }
  } else {
    // Skip validation
    if (isDealer && hasActiveBets) {
      throw new Error('Dealer cannot skip when there are active bets');
    }
  }

  // Create new bet
  const newBet: Bet = {
    playerId,
    amount: skipped ? 0 : amount,
    withoutTrump,
    skipped,
  };

  // Add bet to currentBets
  const updatedBets = [...game.currentBets, newBet];

  // Update highest bet if this is a valid non-skipped bet
  let newHighestBet = game.highestBet;
  if (!skipped && (
    !newHighestBet ||
    isBetHigher(amount, withoutTrump, newHighestBet.amount, newHighestBet.withoutTrump)
  )) {
    newHighestBet = newBet;
  }

  // Move to next player
  const nextPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

  // Check if betting round is complete (all 4 players have bet)
  const bettingComplete = updatedBets.length === game.players.length;

  return {
    ...game,
    currentBets: updatedBets,
    highestBet: newHighestBet,
    currentPlayerIndex: nextPlayerIndex,
    phase: bettingComplete && newHighestBet ? 'playing' : game.phase,
  };
}

// Helper function (pure)
function isBetHigher(
  amount1: number,
  withoutTrump1: boolean,
  amount2: number,
  withoutTrump2: boolean
): boolean {
  if (amount1 > amount2) return true;
  if (amount1 < amount2) return false;
  // Amounts are equal, check withoutTrump
  return withoutTrump1 && !withoutTrump2;
}

/**
 * Playing Phase Transitions
 */

export function playCard(game: GameState, playerId: string, card: Card): GameState {
  if (game.phase !== 'playing') {
    throw new Error(`Cannot play card in phase: ${game.phase}`);
  }

  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  // Verify it's player's turn
  if (game.currentPlayerIndex !== playerIndex) {
    throw new Error('Not your turn to play');
  }

  // Verify trick is not being resolved
  if (game.currentTrick.length >= 4) {
    throw new Error('Please wait for trick to resolve');
  }

  // Verify player has the card
  const player = game.players[playerIndex];
  const cardIndex = player.hand.findIndex(c =>
    c.value === card.value && c.color === card.color
  );

  if (cardIndex === -1) {
    throw new Error('You do not have this card');
  }

  // Check if player already played in this trick
  const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerId === playerId);
  if (hasAlreadyPlayed) {
    throw new Error('You have already played a card this trick');
  }

  // Validate suit-following rules
  if (game.currentTrick.length > 0) {
    const ledSuit = game.currentTrick[0].card.color;
    const hasLedSuit = player.hand.some(c => c.color === ledSuit);

    if (hasLedSuit && card.color !== ledSuit) {
      throw new Error(`You must follow suit (${ledSuit})`);
    }
  }

  // Create trick card
  const trickCard: TrickCard = {
    playerId,
    card,
  };

  // Remove card from player's hand
  const updatedHand = player.hand.filter((_, idx) => idx !== cardIndex);

  // Update player with new hand
  const updatedPlayers = game.players.map((p, idx) =>
    idx === playerIndex ? { ...p, hand: updatedHand } : p
  );

  // Add card to current trick
  const updatedTrick = [...game.currentTrick, trickCard];

  // Move to next player (will be overridden if trick completes)
  const nextPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

  return {
    ...game,
    players: updatedPlayers,
    currentTrick: updatedTrick,
    currentPlayerIndex: nextPlayerIndex,
  };
}

/**
 * Trick Resolution
 */

export function resolveTrick(game: GameState): GameState {
  if (game.currentTrick.length !== 4) {
    throw new Error('Trick must have 4 cards to resolve');
  }

  // Determine winner (returns player ID)
  const winnerId = determineWinner(game.currentTrick, game.trump);

  // Calculate points
  const points = calculateTrickPoints(game.currentTrick);

  // Find winner's player index
  const winnerPlayerIndex = game.players.findIndex(p => p.id === winnerId);

  if (winnerPlayerIndex === -1) {
    throw new Error('Winner not found in players list');
  }

  // Update player's tricks won and points
  const updatedPlayers = game.players.map((player, idx) =>
    idx === winnerPlayerIndex
      ? {
          ...player,
          tricksWon: player.tricksWon + 1,
          pointsWon: player.pointsWon + points,
        }
      : player
  );

  // Create TrickResult for previous trick
  const updatedPreviousTrick: TrickResult = {
    trick: [...game.currentTrick],
    winnerId,
    points,
  };

  // Clear current trick
  const clearedTrick: TrickCard[] = [];

  // Set current player to winner (they lead next trick)
  const nextPlayerIndex = winnerPlayerIndex;

  // Check if round is over (all cards played)
  const roundOver = updatedPlayers.every(p => p.hand.length === 0);

  return {
    ...game,
    players: updatedPlayers,
    currentTrick: clearedTrick,
    previousTrick: updatedPreviousTrick,
    currentPlayerIndex: nextPlayerIndex,
    phase: roundOver ? 'scoring' : 'playing',
  };
}

/**
 * Round Scoring and Completion
 */

export function scoreRound(game: GameState): GameState {
  if (game.phase !== 'scoring') {
    throw new Error('Can only score in scoring phase');
  }

  if (!game.highestBet) {
    throw new Error('No highest bet found for scoring');
  }

  // Find the betting player and their teammate
  const bettingPlayer = game.players.find(p => p.id === game.highestBet!.playerId);
  if (!bettingPlayer) {
    throw new Error('Betting player not found');
  }

  const bettingTeamId = bettingPlayer.teamId;
  const bettingTeamPlayers = game.players.filter(p => p.teamId === bettingTeamId);
  const otherTeamPlayers = game.players.filter(p => p.teamId !== bettingTeamId);

  // Calculate total points for each team
  const bettingTeamPoints = bettingTeamPlayers.reduce((sum, p) => sum + p.pointsWon, 0);
  const otherTeamPoints = otherTeamPlayers.reduce((sum, p) => sum + p.pointsWon, 0);

  // Calculate score change for betting team
  const betAmount = game.highestBet.amount;
  const multiplier = game.highestBet.withoutTrump ? 2 : 1;
  const betMade = bettingTeamPoints >= betAmount;
  const bettingTeamScore = betMade ? betAmount * multiplier : -betAmount * multiplier;

  // Other team always gets their points
  const otherTeamScore = otherTeamPoints;

  // Update team scores
  const newTeamScores = {
    team1:
      game.teamScores.team1 +
      (bettingTeamId === 1 ? bettingTeamScore : otherTeamScore),
    team2:
      game.teamScores.team2 +
      (bettingTeamId === 2 ? bettingTeamScore : otherTeamScore),
  };

  // Check for game over (team reached 41 points)
  const gameOver = newTeamScores.team1 >= 41 || newTeamScores.team2 >= 41;

  return {
    ...game,
    teamScores: newTeamScores,
    phase: gameOver ? 'game_over' : game.phase,
  };
}

/**
 * Start New Round
 */

export function startNewRound(game: GameState, newDeck: Card[]): GameState {
  // Rotate dealer
  const newDealerIndex = (game.dealerIndex + 1) % game.players.length;

  // Deal cards
  const hands = [
    newDeck.slice(0, 8),
    newDeck.slice(8, 16),
    newDeck.slice(16, 24),
    newDeck.slice(24, 32),
  ];

  // Reset players for new round
  const updatedPlayers = game.players.map((player, idx) => ({
    ...player,
    hand: hands[idx],
    tricksWon: 0,
    pointsWon: 0,
  }));

  // Determine trump color (from last card in deck)
  const trumpCard = newDeck[newDeck.length - 1];
  const trump = trumpCard.color;

  // Set current player to player after dealer (betting starts with them)
  const firstBettingPlayerIndex = (newDealerIndex + 1) % game.players.length;

  // Increment round number
  const newRoundNumber = game.roundNumber + 1;

  return {
    ...game,
    phase: 'betting',
    roundNumber: newRoundNumber,
    dealerIndex: newDealerIndex,
    currentPlayerIndex: firstBettingPlayerIndex,
    players: updatedPlayers,
    trump,
    currentBets: [],
    highestBet: null,
    currentTrick: [],
    previousTrick: null,
    currentRoundTricks: [],
  };
}

/**
 * Player Management
 */

export function removePlayer(game: GameState, playerId: string): GameState {
  const playerIndex = game.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    throw new Error('Player not found');
  }

  // Remove player from players array
  const updatedPlayers = game.players.filter(p => p.id !== playerId);

  // Adjust currentPlayerIndex if needed
  let newCurrentPlayerIndex = game.currentPlayerIndex;
  if (playerIndex < game.currentPlayerIndex) {
    newCurrentPlayerIndex = Math.max(0, game.currentPlayerIndex - 1);
  } else if (playerIndex === game.currentPlayerIndex && updatedPlayers.length > 0) {
    // If current player left, move to next player
    newCurrentPlayerIndex = game.currentPlayerIndex % updatedPlayers.length;
  }

  // Adjust dealerIndex if needed
  let newDealerIndex = game.dealerIndex;
  if (playerIndex < game.dealerIndex) {
    newDealerIndex = Math.max(0, game.dealerIndex - 1);
  } else if (playerIndex === game.dealerIndex && updatedPlayers.length > 0) {
    newDealerIndex = game.dealerIndex % updatedPlayers.length;
  }

  return {
    ...game,
    players: updatedPlayers,
    currentPlayerIndex: newCurrentPlayerIndex,
    dealerIndex: newDealerIndex,
  };
}

/**
 * Rematch System
 */

export function voteRematch(game: GameState, playerId: string): GameState {
  if (game.phase !== 'game_over') {
    throw new Error('Can only vote for rematch after game is over');
  }

  // Check if player already voted
  if (game.rematchVotes?.includes(playerId)) {
    throw new Error('You have already voted for rematch');
  }

  const newRematchVotes = [...(game.rematchVotes || []), playerId];

  return {
    ...game,
    rematchVotes: newRematchVotes,
  };
}

export function resetForRematch(game: GameState, newDeck: Card[]): GameState {
  // Reset to initial state but keep players
  const resetPlayers = game.players.map((player, idx) => ({
    ...player,
    hand: newDeck.slice(idx * 8, (idx + 1) * 8),
    tricksWon: 0,
    pointsWon: 0,
  }));

  const trumpCard = newDeck[newDeck.length - 1];

  return {
    ...game,
    phase: 'betting',
    roundNumber: 1,
    dealerIndex: 1, // Start with player 2 as dealer
    currentPlayerIndex: 2, // Start betting with player 3 (after dealer)
    players: resetPlayers,
    trump: trumpCard.color,
    teamScores: { team1: 0, team2: 0 },
    currentBets: [],
    highestBet: null,
    currentTrick: [],
    previousTrick: null,
    currentRoundTricks: [],
    roundHistory: [],
    rematchVotes: [],
  };
}
