/**
 * Side Bets Socket.io Handlers
 *
 * Handles all side betting socket events:
 * - create_side_bet: Create a new side bet
 * - accept_side_bet: Accept an open bet
 * - cancel_side_bet: Cancel own open bet
 * - resolve_custom_bet: Manually resolve custom bet
 * - dispute_bet: Dispute a custom bet resolution
 * - get_side_bets: Get all bets for a game
 */

import { Socket, Server } from 'socket.io';
import { GameState } from '../types/game';
import type {
  CreateSideBetPayload,
  AcceptSideBetPayload,
  CancelSideBetPayload,
  ResolveCustomBetPayload,
  DisputeBetPayload,
  SideBet,
  PresetBetType,
} from '../types/game';
import {
  createSideBet,
  getSideBetsByGame,
  getActiveSideBets,
  getSideBetById,
  acceptSideBet,
  cancelSideBet,
  resolveSideBet,
  disputeSideBet,
  expireOpenBets,
  getBetsForAutoResolution,
  getPlayerBalance,
  updatePlayerBalance,
  transferCoins,
  updateSideBetStats,
  getPlayerBetStreak,
  calculateStreakMultiplier,
} from '../db/sideBets';
import { Logger } from 'winston';

/**
 * Dependencies needed by the side bets handlers
 */
export interface SideBetsHandlersDependencies {
  games: Map<string, GameState>;
  spectatorNames: Map<string, string>; // socket.id -> spectator name
  io: Server;
  logger: Logger;
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;
}

/**
 * Register all side bets Socket.io handlers
 */
/**
 * Helper to find player by socket ID in a game
 */
function findPlayerBySocket(socket: Socket, games: Map<string, GameState>, gameId: string) {
  const game = games.get(gameId);
  if (!game) return { player: undefined, game: undefined };
  const player = game.players.find(p => p.id === socket.id);
  return { player, game };
}

export function registerSideBetsHandlers(socket: Socket, deps: SideBetsHandlersDependencies): void {
  const { games, spectatorNames, io, logger } = deps;

  // ============================================================================
  // create_side_bet - Create a new side bet
  // ============================================================================
  socket.on('create_side_bet', async (payload: CreateSideBetPayload) => {
    try {
      const { gameId, betType, presetType, customDescription, resolutionTiming, amount, prediction, targetPlayer, roundNumber } = payload;

      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Find creator (player or spectator)
      const { player } = findPlayerBySocket(socket, games, gameId);
      let creatorName = player?.name;

      // Check if spectator
      if (!creatorName) {
        creatorName = spectatorNames.get(socket.id);
      }

      if (!creatorName) {
        socket.emit('error', { message: 'You must be a player or named spectator to create bets' });
        return;
      }

      // Validate amount
      if (amount < 1) {
        socket.emit('error', { message: 'Minimum bet is 1 coin' });
        return;
      }

      // Check balance
      const balance = await getPlayerBalance(creatorName);
      if (balance < amount) {
        socket.emit('error', { message: `Insufficient coins. You have ${balance} coins.` });
        return;
      }

      // Validate bet type
      if (betType === 'custom' && !customDescription) {
        socket.emit('error', { message: 'Custom bets require a description' });
        return;
      }

      if (betType === 'preset' && !presetType) {
        socket.emit('error', { message: 'Preset bets require a preset type' });
        return;
      }

      // Reserve coins (deduct from balance)
      const newBalance = await updatePlayerBalance(creatorName, -amount);
      if (newBalance === null) {
        socket.emit('error', { message: 'Failed to reserve coins' });
        return;
      }

      // Calculate trick number for trick-timed resolution
      const trickNumber = game.currentRoundTricks ? game.currentRoundTricks.length + 1 : 1;

      // Create the bet
      const bet = await createSideBet(gameId, creatorName, betType, amount, {
        presetType,
        customDescription,
        resolutionTiming,
        prediction,
        targetPlayer,
        roundNumber: roundNumber ?? game.roundNumber,
        trickNumber: resolutionTiming === 'trick' ? trickNumber : undefined,
      });

      if (!bet) {
        // Refund if creation failed
        await updatePlayerBalance(creatorName, amount);
        socket.emit('error', { message: 'Failed to create bet' });
        return;
      }

      logger.info('Side bet created', { betId: bet.id, gameId, creatorName, amount, betType });

      // Notify all players and spectators
      io.to(gameId).emit('side_bet_created', { bet });
      io.to(`${gameId}-spectators`).emit('side_bet_created', { bet });

      // Send updated balance to creator
      socket.emit('balance_updated', { balance: newBalance });
    } catch (error) {
      logger.warn('create_side_bet failed (database may not be ready)', { error });
      socket.emit('error', { message: 'Side bets are not available yet. Database setup required.' });
    }
  });

  // ============================================================================
  // accept_side_bet - Accept an open bet
  // ============================================================================
  socket.on('accept_side_bet', async (payload: AcceptSideBetPayload) => {
    try {
      const { gameId, betId } = payload;

      const game = games.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Find acceptor (player or spectator)
      const { player } = findPlayerBySocket(socket, games, gameId);
      let acceptorName = player?.name;

      // Check if spectator
      if (!acceptorName) {
        acceptorName = spectatorNames.get(socket.id);
      }

      if (!acceptorName) {
        socket.emit('error', { message: 'You must be a player or named spectator to accept bets' });
        return;
      }

      // Get the bet
      const bet = await getSideBetById(betId);
      if (!bet) {
        socket.emit('error', { message: 'Bet not found' });
        return;
      }

      if (bet.status !== 'open') {
        socket.emit('error', { message: 'Bet is no longer open' });
        return;
      }

      if (bet.creatorName === acceptorName) {
        socket.emit('error', { message: 'You cannot accept your own bet' });
        return;
      }

      // Check acceptor balance
      const balance = await getPlayerBalance(acceptorName);
      if (balance < bet.amount) {
        socket.emit('error', { message: `Insufficient coins. You have ${balance} coins, need ${bet.amount}.` });
        return;
      }

      // Reserve acceptor's coins
      const newBalance = await updatePlayerBalance(acceptorName, -bet.amount);
      if (newBalance === null) {
        socket.emit('error', { message: 'Failed to reserve coins' });
        return;
      }

      // Accept the bet
      const updatedBet = await acceptSideBet(betId, acceptorName);
      if (!updatedBet) {
        // Refund if acceptance failed
        await updatePlayerBalance(acceptorName, bet.amount);
        socket.emit('error', { message: 'Failed to accept bet' });
        return;
      }

      logger.info('Side bet accepted', { betId, gameId, acceptorName });

      // Notify all players and spectators
      io.to(gameId).emit('side_bet_accepted', { betId, acceptorName });
      io.to(`${gameId}-spectators`).emit('side_bet_accepted', { betId, acceptorName });

      // Send updated balance to acceptor
      socket.emit('balance_updated', { balance: newBalance });
    } catch (error) {
      logger.warn('accept_side_bet failed (database may not be ready)', { error });
      socket.emit('error', { message: 'Side bets are not available yet. Database setup required.' });
    }
  });

  // ============================================================================
  // cancel_side_bet - Cancel own open bet
  // ============================================================================
  socket.on('cancel_side_bet', async (payload: CancelSideBetPayload) => {
    try {
      const { gameId, betId } = payload;

      const { player } = findPlayerBySocket(socket, games, gameId);
      let playerName = player?.name;

      // Check if spectator
      if (!playerName) {
        playerName = spectatorNames.get(socket.id);
      }

      if (!playerName) {
        socket.emit('error', { message: 'Player or spectator not found' });
        return;
      }

      // Get the bet
      const bet = await getSideBetById(betId);
      if (!bet) {
        socket.emit('error', { message: 'Bet not found' });
        return;
      }

      if (bet.creatorName !== playerName) {
        socket.emit('error', { message: 'You can only cancel your own bets' });
        return;
      }

      // Cancel and refund
      const cancelled = await cancelSideBet(betId, playerName);
      if (!cancelled) {
        socket.emit('error', { message: 'Failed to cancel bet (may already be accepted)' });
        return;
      }

      // Refund creator
      const newBalance = await updatePlayerBalance(playerName, bet.amount);

      logger.info('Side bet cancelled', { betId, gameId, playerName });

      // Notify all players and spectators
      io.to(gameId).emit('side_bet_cancelled', { betId, reason: 'creator_cancelled' });
      io.to(`${gameId}-spectators`).emit('side_bet_cancelled', { betId, reason: 'creator_cancelled' });

      // Send updated balance
      socket.emit('balance_updated', { balance: newBalance });
    } catch (error) {
      logger.warn('cancel_side_bet failed (database may not be ready)', { error });
      socket.emit('error', { message: 'Side bets are not available yet. Database setup required.' });
    }
  });

  // ============================================================================
  // resolve_custom_bet - Manually resolve custom bet
  // ============================================================================
  socket.on('resolve_custom_bet', async (payload: ResolveCustomBetPayload) => {
    try {
      const { gameId, betId, creatorWon } = payload;

      const { player } = findPlayerBySocket(socket, games, gameId);
      let playerName = player?.name;

      // Check if spectator
      if (!playerName) {
        playerName = spectatorNames.get(socket.id);
      }

      if (!playerName) {
        socket.emit('error', { message: 'Player or spectator not found' });
        return;
      }

      // Get the bet
      const bet = await getSideBetById(betId);
      if (!bet) {
        socket.emit('error', { message: 'Bet not found' });
        return;
      }

      if (bet.betType !== 'custom') {
        socket.emit('error', { message: 'Only custom bets can be manually resolved' });
        return;
      }

      if (bet.status !== 'active') {
        socket.emit('error', { message: 'Bet is not active' });
        return;
      }

      // Only participants can resolve
      if (bet.creatorName !== playerName && bet.acceptorName !== playerName) {
        socket.emit('error', { message: 'Only bet participants can resolve' });
        return;
      }

      // Mark as resolved (the other party can dispute)
      const resolvedBet = await resolveSideBet(betId, creatorWon, 'manual');
      if (!resolvedBet) {
        socket.emit('error', { message: 'Failed to resolve bet' });
        return;
      }

      // Transfer coins with streak multiplier
      const winnerName = creatorWon ? bet.creatorName : bet.acceptorName!;
      const loserName = creatorWon ? bet.acceptorName! : bet.creatorName;

      // Get winner's current streak before updating
      const currentStreak = await getPlayerBetStreak(winnerName);
      const streakMultiplier = calculateStreakMultiplier(currentStreak);

      // Apply streak multiplier to winnings (base pot + bonus from streak)
      const basePot = bet.amount * 2;
      const bonus = Math.floor(basePot * (streakMultiplier - 1));
      const totalPot = basePot + bonus;

      await updatePlayerBalance(winnerName, totalPot);
      const winnerStats = await updateSideBetStats(winnerName, true, bet.amount);
      await updateSideBetStats(loserName, false, bet.amount);

      logger.info('Custom bet resolved', {
        betId, gameId, winnerName, amount: totalPot,
        streak: winnerStats.currentStreak, multiplier: streakMultiplier
      });

      // Notify all with streak info
      const resolvedEvent = {
        betId,
        result: creatorWon,
        winnerName,
        loserName,
        coinsAwarded: totalPot,
        streakBonus: bonus,
        winnerStreak: winnerStats.currentStreak,
        streakMultiplier,
      };
      io.to(gameId).emit('side_bet_resolved', resolvedEvent);
      io.to(`${gameId}-spectators`).emit('side_bet_resolved', resolvedEvent);
    } catch (error) {
      logger.warn('resolve_custom_bet failed (database may not be ready)', { error });
      socket.emit('error', { message: 'Side bets are not available yet. Database setup required.' });
    }
  });

  // ============================================================================
  // dispute_bet - Dispute a custom bet resolution (refund both)
  // ============================================================================
  socket.on('dispute_bet', async (payload: DisputeBetPayload) => {
    try {
      const { gameId, betId } = payload;

      const { player } = findPlayerBySocket(socket, games, gameId);
      let playerName = player?.name;

      // Check if spectator
      if (!playerName) {
        playerName = spectatorNames.get(socket.id);
      }

      if (!playerName) {
        socket.emit('error', { message: 'Player or spectator not found' });
        return;
      }

      // Get the bet
      const bet = await getSideBetById(betId);
      if (!bet) {
        socket.emit('error', { message: 'Bet not found' });
        return;
      }

      // Only the other party can dispute
      if (bet.creatorName !== playerName && bet.acceptorName !== playerName) {
        socket.emit('error', { message: 'Only bet participants can dispute' });
        return;
      }

      // Mark as disputed and refund both
      const disputedBet = await disputeSideBet(betId);
      if (!disputedBet) {
        socket.emit('error', { message: 'Failed to dispute bet' });
        return;
      }

      // Refund both parties
      await updatePlayerBalance(bet.creatorName, bet.amount);
      if (bet.acceptorName) {
        await updatePlayerBalance(bet.acceptorName, bet.amount);
      }

      logger.info('Bet disputed and refunded', { betId, gameId, disputedBy: playerName });

      // Notify all
      io.to(gameId).emit('side_bet_disputed', {
        betId,
        disputedBy: playerName,
        refundAmount: bet.amount,
      });
      io.to(`${gameId}-spectators`).emit('side_bet_disputed', {
        betId,
        disputedBy: playerName,
        refundAmount: bet.amount,
      });
    } catch (error) {
      logger.warn('dispute_bet failed (database may not be ready)', { error });
      socket.emit('error', { message: 'Side bets are not available yet. Database setup required.' });
    }
  });

  // ============================================================================
  // get_side_bets - Get all bets for a game
  // ============================================================================
  socket.on('get_side_bets', async ({ gameId }: { gameId: string }) => {
    try {
      const bets = await getSideBetsByGame(gameId);
      socket.emit('side_bets_list', { bets });
    } catch (error) {
      // Table may not exist yet - return empty list gracefully
      logger.debug('get_side_bets failed (table may not exist)', { gameId, error });
      socket.emit('side_bets_list', { bets: [] });
    }
  });

  // ============================================================================
  // get_balance - Get player's or spectator's coin balance
  // ============================================================================
  socket.on('get_balance', async ({ gameId }: { gameId: string }) => {
    try {
      const { player } = findPlayerBySocket(socket, games, gameId);
      let playerName = player?.name;

      // Check if spectator
      if (!playerName) {
        playerName = spectatorNames.get(socket.id);
      }

      if (!playerName) {
        // Anonymous spectator - return default balance
        socket.emit('balance_updated', { balance: 100 });
        return;
      }

      const balance = await getPlayerBalance(playerName);
      socket.emit('balance_updated', { balance });
    } catch (error) {
      // Table may not exist yet - return default balance gracefully
      logger.debug('get_balance failed (table may not exist)', { gameId, error });
      socket.emit('balance_updated', { balance: 100 });
    }
  });
}

// ==================== AUTO-RESOLUTION & PROMPTING HELPERS ====================

/**
 * Get active custom bets that need prompting for resolution
 * Called at trick end, round end, or game end
 */
export async function getCustomBetsForPrompting(
  gameId: string,
  timing: 'trick' | 'round' | 'game',
  currentRound?: number,
  currentTrick?: number
): Promise<SideBet[]> {
  try {
    const allBets = await getActiveSideBets(gameId);
    return allBets.filter(bet => {
      if (bet.betType !== 'custom') return false;
      if (bet.resolutionTiming !== timing) return false;

      // For trick-timed, check if this is the right trick
      if (timing === 'trick' && bet.trickNumber !== undefined) {
        return bet.trickNumber === currentTrick && bet.roundNumber === currentRound;
      }

      // For round-timed, check if this is the right round
      if (timing === 'round' && bet.roundNumber !== undefined) {
        return bet.roundNumber === currentRound;
      }

      return true;
    });
  } catch (error) {
    console.debug('[SideBets] getCustomBetsForPrompting failed', error);
    return [];
  }
}

/**
 * Prompt participants to resolve custom bets
 * Emits 'side_bet_prompt_resolution' to both creator and acceptor
 */
export async function promptCustomBetResolution(
  io: Server,
  gameId: string,
  timing: 'trick' | 'round' | 'game',
  currentRound?: number,
  currentTrick?: number
): Promise<void> {
  try {
    const betsToPrompt = await getCustomBetsForPrompting(gameId, timing, currentRound, currentTrick);

    for (const bet of betsToPrompt) {
      // Emit to the game room - client will show prompt to participants
      io.to(gameId).emit('side_bet_prompt_resolution', {
        bet,
        timing,
        message: getPromptMessage(bet, timing),
      });
      io.to(`${gameId}-spectators`).emit('side_bet_prompt_resolution', {
        bet,
        timing,
        message: getPromptMessage(bet, timing),
      });
    }
  } catch (error) {
    console.debug('[SideBets] promptCustomBetResolution failed', error);
  }
}

function getPromptMessage(bet: SideBet, timing: 'trick' | 'round' | 'game'): string {
  const timingLabels = {
    trick: 'Trick ended',
    round: 'Round ended',
    game: 'Game ended',
  };
  return `${timingLabels[timing]}! Time to resolve: "${bet.customDescription}"`;
}

/**
 * Auto-resolve preset bets when game events occur
 * Called from game logic (trick resolved, round ended, etc.)
 *
 * For team-based bets (red_zero_winner, brown_zero_victim, first_trump_played):
 *   - winningTeam is the team that "wins" (gets red 0, gets brown 0, plays first trump)
 *   - Prediction is 'team1' or 'team2'
 *
 * For boolean bets (bet_made, without_trump_success):
 *   - winningTeam is 1 if the outcome is TRUE (bet was made), 2 if FALSE
 *   - Prediction is 'true' or 'false'
 */
export async function autoResolveBets(
  io: Server,
  gameId: string,
  presetType: PresetBetType,
  winningTeam: 1 | 2,
  roundNumber?: number
): Promise<void> {
  try {
    const bets = await getBetsForAutoResolution(gameId, presetType, roundNumber);

    for (const bet of bets) {
      // Determine winner based on prediction type
      let creatorWon: boolean;

      if (presetType === 'bet_made' || presetType === 'without_trump_success') {
        // Boolean bets: winningTeam=1 means TRUE (bet made), winningTeam=2 means FALSE
        const outcomeIsTrue = winningTeam === 1;
        const creatorPredictedTrue = bet.prediction === 'true';
        creatorWon = outcomeIsTrue === creatorPredictedTrue;
      } else {
        // Team bets: prediction matches the winning team
        creatorWon = bet.prediction === `team${winningTeam}`;
      }

      const resolvedBet = await resolveSideBet(bet.id, creatorWon, 'auto');
      if (!resolvedBet) continue;

      // Transfer coins with streak multiplier
      const winnerName = creatorWon ? bet.creatorName : bet.acceptorName!;
      const loserName = creatorWon ? bet.acceptorName! : bet.creatorName;

      // Get winner's current streak before updating
      const currentStreak = await getPlayerBetStreak(winnerName);
      const streakMultiplier = calculateStreakMultiplier(currentStreak);

      // Apply streak multiplier to winnings
      const basePot = bet.amount * 2;
      const bonus = Math.floor(basePot * (streakMultiplier - 1));
      const totalPot = basePot + bonus;

      await updatePlayerBalance(winnerName, totalPot);
      const winnerStats = await updateSideBetStats(winnerName, true, bet.amount);
      await updateSideBetStats(loserName, false, bet.amount);

      // Notify all with streak info
      const resolvedEvent = {
        betId: bet.id,
        result: creatorWon,
        winnerName,
        loserName,
        coinsAwarded: totalPot,
        streakBonus: bonus,
        winnerStreak: winnerStats.currentStreak,
        streakMultiplier,
      };
      io.to(gameId).emit('side_bet_resolved', resolvedEvent);
      io.to(`${gameId}-spectators`).emit('side_bet_resolved', resolvedEvent);
    }
  } catch (error) {
    // Silently fail if database not ready - side bets are optional
    console.debug('[SideBets] autoResolveBets failed (table may not exist)', error);
  }
}

/**
 * Expire all open bets when game ends
 * Called when game is over
 */
export async function expireGameBets(
  io: Server,
  gameId: string
): Promise<void> {
  try {
    const expiredCount = await expireOpenBets(gameId);
    if (expiredCount > 0) {
      console.log(`[SideBets] Expired ${expiredCount} open bets for game ${gameId}`);
    }
  } catch (error) {
    // Silently fail if database not ready - side bets are optional
    console.debug('[SideBets] expireGameBets failed (table may not exist)', error);
  }
}
