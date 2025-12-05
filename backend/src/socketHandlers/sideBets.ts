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
} from '../db/sideBets';
import { Logger } from 'winston';

/**
 * Dependencies needed by the side bets handlers
 */
export interface SideBetsHandlersDependencies {
  games: Map<string, GameState>;
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
  const { games, io, logger, errorBoundaries } = deps;

  // ============================================================================
  // create_side_bet - Create a new side bet
  // ============================================================================
  socket.on('create_side_bet', errorBoundaries.gameAction('create_side_bet')(async (payload: CreateSideBetPayload) => {
    const { gameId, betType, presetType, customDescription, amount, prediction, targetPlayer, roundNumber } = payload;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find creator (player or spectator)
    const { player } = findPlayerBySocket(socket, games, gameId);
    const creatorName = player?.name;

    if (!creatorName) {
      // Check if spectator (they may have a name stored differently)
      socket.emit('error', { message: 'You must be a player or spectator to create bets' });
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

    // Create the bet
    const bet = await createSideBet(gameId, creatorName, betType, amount, {
      presetType,
      customDescription,
      prediction,
      targetPlayer,
      roundNumber,
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
  }));

  // ============================================================================
  // accept_side_bet - Accept an open bet
  // ============================================================================
  socket.on('accept_side_bet', errorBoundaries.gameAction('accept_side_bet')(async (payload: AcceptSideBetPayload) => {
    const { gameId, betId } = payload;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find acceptor
    const { player } = findPlayerBySocket(socket, games, gameId);
    const acceptorName = player?.name;

    if (!acceptorName) {
      socket.emit('error', { message: 'You must be a player to accept bets' });
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
  }));

  // ============================================================================
  // cancel_side_bet - Cancel own open bet
  // ============================================================================
  socket.on('cancel_side_bet', errorBoundaries.gameAction('cancel_side_bet')(async (payload: CancelSideBetPayload) => {
    const { gameId, betId } = payload;

    const { player } = findPlayerBySocket(socket, games, gameId);
    const playerName = player?.name;

    if (!playerName) {
      socket.emit('error', { message: 'Player not found' });
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
  }));

  // ============================================================================
  // resolve_custom_bet - Manually resolve custom bet
  // ============================================================================
  socket.on('resolve_custom_bet', errorBoundaries.gameAction('resolve_custom_bet')(async (payload: ResolveCustomBetPayload) => {
    const { gameId, betId, creatorWon } = payload;

    const { player } = findPlayerBySocket(socket, games, gameId);
    const playerName = player?.name;

    if (!playerName) {
      socket.emit('error', { message: 'Player not found' });
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

    // Transfer coins
    const winnerName = creatorWon ? bet.creatorName : bet.acceptorName!;
    const loserName = creatorWon ? bet.acceptorName! : bet.creatorName;
    const totalPot = bet.amount * 2;

    await updatePlayerBalance(winnerName, totalPot);
    await updateSideBetStats(winnerName, true, bet.amount);
    await updateSideBetStats(loserName, false, bet.amount);

    logger.info('Custom bet resolved', { betId, gameId, winnerName, amount: totalPot });

    // Notify all
    io.to(gameId).emit('side_bet_resolved', {
      betId,
      result: creatorWon,
      winnerName,
      loserName,
      coinsAwarded: totalPot,
    });
    io.to(`${gameId}-spectators`).emit('side_bet_resolved', {
      betId,
      result: creatorWon,
      winnerName,
      loserName,
      coinsAwarded: totalPot,
    });
  }));

  // ============================================================================
  // dispute_bet - Dispute a custom bet resolution (refund both)
  // ============================================================================
  socket.on('dispute_bet', errorBoundaries.gameAction('dispute_bet')(async (payload: DisputeBetPayload) => {
    const { gameId, betId } = payload;

    const { player } = findPlayerBySocket(socket, games, gameId);
    const playerName = player?.name;

    if (!playerName) {
      socket.emit('error', { message: 'Player not found' });
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
  }));

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
  // get_balance - Get player's coin balance
  // ============================================================================
  socket.on('get_balance', async ({ gameId }: { gameId: string }) => {
    try {
      const { player } = findPlayerBySocket(socket, games, gameId);
      if (!player) {
        // Return default balance instead of error
        socket.emit('balance_updated', { balance: 100 });
        return;
      }

      const balance = await getPlayerBalance(player.name);
      socket.emit('balance_updated', { balance });
    } catch (error) {
      // Table may not exist yet - return default balance gracefully
      logger.debug('get_balance failed (table may not exist)', { gameId, error });
      socket.emit('balance_updated', { balance: 100 });
    }
  });
}

// ==================== AUTO-RESOLUTION HELPERS ====================

/**
 * Auto-resolve preset bets when game events occur
 * Called from game logic (trick resolved, round ended, etc.)
 */
export async function autoResolveBets(
  io: Server,
  gameId: string,
  presetType: PresetBetType,
  winningTeam: 1 | 2,
  roundNumber?: number
): Promise<void> {
  const bets = await getBetsForAutoResolution(gameId, presetType, roundNumber);

  for (const bet of bets) {
    // Determine winner based on prediction
    const creatorWon = bet.prediction === `team${winningTeam}`;

    const resolvedBet = await resolveSideBet(bet.id, creatorWon, 'auto');
    if (!resolvedBet) continue;

    // Transfer coins
    const winnerName = creatorWon ? bet.creatorName : bet.acceptorName!;
    const loserName = creatorWon ? bet.acceptorName! : bet.creatorName;
    const totalPot = bet.amount * 2;

    await updatePlayerBalance(winnerName, totalPot);
    await updateSideBetStats(winnerName, true, bet.amount);
    await updateSideBetStats(loserName, false, bet.amount);

    // Notify all
    io.to(gameId).emit('side_bet_resolved', {
      betId: bet.id,
      result: creatorWon,
      winnerName,
      loserName,
      coinsAwarded: totalPot,
    });
    io.to(`${gameId}-spectators`).emit('side_bet_resolved', {
      betId: bet.id,
      result: creatorWon,
      winnerName,
      loserName,
      coinsAwarded: totalPot,
    });
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
  const expiredCount = await expireOpenBets(gameId);
  if (expiredCount > 0) {
    console.log(`[SideBets] Expired ${expiredCount} open bets for game ${gameId}`);
  }
}
