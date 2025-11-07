/**
 * Bot Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all bot-related socket events:
 * - replace_with_bot: Replace a human player with a bot
 * - take_over_bot: Take over a bot with a human player
 * - change_bot_difficulty: Change bot difficulty level
 */

import { Socket, Server } from 'socket.io';
import { GameState, PlayerSession } from '../types/game';
import { Logger } from 'winston';
import * as PersistenceManager from '../db/persistenceManager';
import { migratePlayerIdentity } from '../utils/playerMigrationHelpers';
import { RoundStatsData } from '../game/roundStatistics';

/**
 * Online player tracking data
 */
interface OnlinePlayer {
  playerName: string;
  socketId: string;
  status?: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity?: number;
}

/**
 * Dependencies needed by the bot handlers
 */
export interface BotHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  playerSessions: Map<string, PlayerSession>;
  onlinePlayers: Map<string, OnlinePlayer>;
  roundStats: Map<string, RoundStatsData>;

  // Socket.io
  io: Server;

  // Database functions
  deletePlayerSessions: (playerName: string, gameId: string) => Promise<void>;
  createDBSession: (playerName: string, socketId: string, gameId: string) => Promise<PlayerSession>;

  // Helper functions
  areTeammates: (game: GameState, player1Name: string, player2Name: string) => boolean;
  canAddBot: (game: GameState) => boolean;
  getNextBotName: (game: GameState) => string;
  generateSessionToken: () => string;
  broadcastOnlinePlayers: () => void;

  // Emission helpers
  emitGameUpdate: (gameId: string, gameState: GameState, forceFull?: boolean) => void;

  // Utility
  logger: Logger;
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: unknown[]) => void) => (...args: unknown[]) => void;
  };
}

/**
 * Register all bot-related Socket.io handlers
 */
export function registerBotHandlers(socket: Socket, deps: BotHandlersDependencies): void {
  const {
    games,
    playerSessions,
    onlinePlayers,
    roundStats,
    io,
    deletePlayerSessions,
    createDBSession,
    areTeammates,
    canAddBot,
    getNextBotName,
    generateSessionToken,
    broadcastOnlinePlayers,
    emitGameUpdate,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // replace_me_with_bot - Sprint 6: Allow player to replace themselves with bot
  // ============================================================================
  socket.on('replace_me_with_bot', errorBoundaries.gameAction('replace_me_with_bot')(async ({
    gameId,
    playerName
  }: {
    gameId: string;
    playerName: string;
  }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find the player
    const player = game.players.find(p => p.name === playerName && p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not found or unauthorized' });
      return;
    }

    // Cannot replace a bot
    if (player.isBot) {
      socket.emit('error', { message: 'Bots cannot be replaced' });
      return;
    }

    // Check bot limit (max 3 bots)
    if (!canAddBot(game)) {
      socket.emit('error', { message: 'Maximum of 3 bots allowed per game' });
      return;
    }

    // Check if at least 1 human would remain
    const humanCountAfterReplace = game.players.filter(p => !p.isBot && p.name !== playerName).length;
    if (humanCountAfterReplace < 1) {
      socket.emit('error', { message: 'Cannot replace - you are the last human player' });
      return;
    }

    // Get next available bot name
    const botName = getNextBotName(game);
    const oldSocketId = player.id;

    // Generate new unique ID for bot
    const newBotId = `bot-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Update player to be a bot (preserve team, hand, scores, position)
    player.name = botName;
    player.isBot = true;
    player.botDifficulty = 'medium'; // Default to medium difficulty for self-replacement
    player.id = newBotId;

    // Update player ID in currentTrick
    game.currentTrick.forEach(tc => {
      if (tc.playerId === oldSocketId) {
        tc.playerId = newBotId;
      }
    });

    // Update player ID in bets
    game.currentBets.forEach(bet => {
      if (bet.playerId === oldSocketId) {
        bet.playerId = newBotId;
      }
    });
    if (game.highestBet && game.highestBet.playerId === oldSocketId) {
      game.highestBet.playerId = newBotId;
    }

    // CRITICAL: Migrate ALL player identity data (roundStats, currentTrick, currentRoundTricks, afkWarnings)
    migratePlayerIdentity({
      gameState: game,
      roundStats: roundStats.get(gameId),
      oldPlayerId: oldSocketId,
      newPlayerId: newBotId,
      oldPlayerName: playerName,
      newPlayerName: botName
    });

    // Clean up player sessions
    await PersistenceManager.deletePlayerSessions(playerName, gameId, game.persistenceMode);
    for (const [token, session] of playerSessions.entries()) {
      if (session.playerName === playerName && session.gameId === gameId) {
        playerSessions.delete(token);
        break;
      }
    }

    // Remove from online players
    onlinePlayers.delete(socket.id);
    broadcastOnlinePlayers();

    // Notify the leaving player
    socket.emit('replaced_by_bot', {
      message: 'You have been replaced by a bot',
      gameId,
      botName
    });

    // Remove socket from room
    socket.leave(gameId);

    // Broadcast to remaining players
    io.to(gameId).emit('player_replaced_self', {
      gameState: game,
      replacedPlayerName: playerName,
      botName
    });

    logger.info(`Player ${playerName} replaced themselves with ${botName} in game ${gameId}`);
  }));

  // ============================================================================
  // replace_with_bot - Replace a human player with a bot
  // ============================================================================
  socket.on('replace_with_bot', errorBoundaries.gameAction('replace_with_bot')(async ({
    gameId,
    playerNameToReplace,
    requestingPlayerName
  }: {
    gameId: string;
    playerNameToReplace: string;
    requestingPlayerName: string;
  }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find the player to replace
    const playerToReplace = game.players.find(p => p.name === playerNameToReplace);
    if (!playerToReplace) {
      socket.emit('error', { message: 'Player to replace not found' });
      return;
    }

    // Cannot replace a bot
    if (playerToReplace.isBot) {
      socket.emit('error', { message: 'Cannot replace a bot with another bot' });
      return;
    }

    // Validate requesting player is a teammate
    if (!areTeammates(game, requestingPlayerName, playerNameToReplace)) {
      socket.emit('error', { message: 'Only teammates can replace a player with a bot' });
      return;
    }

    // Check bot limit (max 3 bots)
    if (!canAddBot(game)) {
      socket.emit('error', { message: 'Maximum of 3 bots allowed per game' });
      return;
    }

    // Check if at least 1 human would remain
    const humanCountAfterReplace = game.players.filter(p => !p.isBot && p.name !== playerNameToReplace).length;
    if (humanCountAfterReplace < 1) {
      socket.emit('error', { message: 'At least 1 human player must remain in the game' });
      return;
    }

    // Get next available bot name
    const botName = getNextBotName(game);
    const oldSocketId = playerToReplace.id;

    // Generate new unique ID for bot (bots don't have socket connections)
    const newBotId = `bot-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Update player to be a bot (preserve team, hand, scores, position)
    playerToReplace.name = botName;
    playerToReplace.isBot = true;
    playerToReplace.botDifficulty = 'hard';
    playerToReplace.id = newBotId;

    // IMPORTANT: Update player ID in currentTrick to fix card display after replacement
    game.currentTrick.forEach(tc => {
      if (tc.playerId === oldSocketId) {
        tc.playerId = newBotId;
      }
    });

    // IMPORTANT: Update player ID in bets to fix round scoring
    game.currentBets.forEach(bet => {
      if (bet.playerId === oldSocketId) {
        bet.playerId = newBotId;
      }
    });
    if (game.highestBet && game.highestBet.playerId === oldSocketId) {
      game.highestBet.playerId = newBotId;
    }

    // CRITICAL: Migrate ALL player identity data (roundStats, currentTrick, currentRoundTricks, afkWarnings)
    migratePlayerIdentity({
      gameState: game,
      roundStats: roundStats.get(gameId),
      oldPlayerId: oldSocketId,
      newPlayerId: newBotId,
      oldPlayerName: playerNameToReplace,
      newPlayerName: botName
    });

    // Clean up old player's sessions (conditional on persistence mode)
    await PersistenceManager.deletePlayerSessions(playerNameToReplace, gameId, game.persistenceMode);

    // Remove from player sessions
    for (const [token, session] of playerSessions.entries()) {
      if (session.playerName === playerNameToReplace && session.gameId === gameId) {
        playerSessions.delete(token);
        break;
      }
    }

    // Notify the replaced player
    io.to(oldSocketId).emit('replaced_by_bot', {
      message: 'You have been replaced by a bot',
      gameId
    });

    // Remove old socket from room
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      oldSocket.leave(gameId);
    }

    // Broadcast updated game state
    io.to(gameId).emit('bot_replaced', {
      gameState: game,
      replacedPlayerName: playerNameToReplace,
      botName
    });

    console.log(`Player ${playerNameToReplace} replaced with ${botName} in game ${gameId}`);
  }));

  // ============================================================================
  // take_over_bot - Take over a bot with a human player
  // ============================================================================
  socket.on('take_over_bot', errorBoundaries.gameAction('take_over_bot')(async ({
    gameId,
    botNameToReplace,
    newPlayerName
  }: {
    gameId: string;
    botNameToReplace: string;
    newPlayerName: string;
  }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find the bot to replace
    const botToReplace = game.players.find(p => p.name === botNameToReplace);
    if (!botToReplace) {
      socket.emit('error', { message: 'Bot not found' });
      return;
    }

    // Must be a bot
    if (!botToReplace.isBot) {
      socket.emit('error', { message: 'Can only take over bot players' });
      return;
    }

    // Check if new player name already exists
    const existingPlayer = game.players.find(p => p.name === newPlayerName);
    if (existingPlayer) {
      socket.emit('error', { message: 'Player name already exists in this game' });
      return;
    }

    const oldBotId = botToReplace.id;

    // Update bot to be a human player (preserve team, hand, scores, position)
    botToReplace.name = newPlayerName;
    botToReplace.isBot = false;
    botToReplace.botDifficulty = undefined;
    botToReplace.id = socket.id; // Update to new player's socket

    // IMPORTANT: Update player ID in currentTrick to maintain game state consistency
    game.currentTrick.forEach(tc => {
      if (tc.playerId === oldBotId) {
        tc.playerId = socket.id;
      }
    });

    // IMPORTANT: Update player ID in bets to ensure correct round scoring
    game.currentBets.forEach(bet => {
      if (bet.playerId === oldBotId) {
        bet.playerId = socket.id;
      }
    });
    if (game.highestBet && game.highestBet.playerId === oldBotId) {
      game.highestBet.playerId = socket.id;
    }

    // CRITICAL: Update previousTrick to prevent "Player data not found" errors
    if (game.previousTrick) {
      game.previousTrick.trick.forEach(tc => {
        if (tc.playerId === oldBotId) {
          tc.playerId = socket.id;
          tc.playerName = newPlayerName;
        }
      });
      if (game.previousTrick.winnerId === oldBotId) {
        game.previousTrick.winnerId = socket.id;
      }
    }

    // CRITICAL: Update roundHistory to prevent "Player data not found" errors in round/game end
    game.roundHistory.forEach(round => {
      // Update player names in tricks (TrickResult contains trick: TrickCard[])
      round.tricks.forEach(trickResult => {
        trickResult.trick.forEach(tc => {
          if (tc.playerName === botNameToReplace) {
            tc.playerName = newPlayerName;
            tc.playerId = socket.id;
          }
        });
        // Update winner name if it matches
        if (trickResult.winnerName === botNameToReplace) {
          trickResult.winnerName = newPlayerName;
          trickResult.winnerId = socket.id;
        }
      });

      // Update player stats if they exist
      if (round.playerStats) {
        const botStats = round.playerStats.find(ps => ps.playerName === botNameToReplace);
        if (botStats) {
          botStats.playerName = newPlayerName;
        }
      }

      // Update initial hands mapping
      if (round.statistics?.initialHands && round.statistics.initialHands[botNameToReplace]) {
        round.statistics.initialHands[newPlayerName] = round.statistics.initialHands[botNameToReplace];
        delete round.statistics.initialHands[botNameToReplace];
      }

      // Update player bets mapping
      if (round.statistics?.playerBets && round.statistics.playerBets[botNameToReplace] !== undefined) {
        round.statistics.playerBets[newPlayerName] = round.statistics.playerBets[botNameToReplace];
        delete round.statistics.playerBets[botNameToReplace];
      }
    });

    // CRITICAL: Migrate ALL player identity data (roundStats, currentTrick, currentRoundTricks, afkWarnings)
    migratePlayerIdentity({
      gameState: game,
      roundStats: roundStats.get(gameId),
      oldPlayerId: oldBotId,
      newPlayerId: socket.id,
      oldPlayerName: botNameToReplace,
      newPlayerName: newPlayerName
    });

    // Join the socket room
    socket.join(gameId);

    // Create and save session token (conditional on persistence mode)
    const sessionResult = await PersistenceManager.createSession(
      newPlayerName,
      socket.id,
      gameId,
      game.persistenceMode,
      false // isBot = false (this is a human taking over)
    );

    let session: PlayerSession;
    if (sessionResult) {
      session = sessionResult;
      playerSessions.set(session.token, session);
    } else {
      // Fallback to in-memory session (casual mode or DB error)
      const token = generateSessionToken();
      session = {
        gameId,
        playerId: socket.id,
        playerName: newPlayerName,
        token,
        timestamp: Date.now()
      };
      playerSessions.set(token, session);
    }

    // Update online players
    onlinePlayers.set(socket.id, {
      socketId: socket.id,
      playerName: newPlayerName,
      status: 'in_game',
      gameId,
      lastActivity: Date.now()
    });
    broadcastOnlinePlayers();

    // Emit to the new player
    socket.emit('bot_taken_over', {
      gameState: game,
      botName: botNameToReplace,
      newPlayerName,
      session
    });

    // Broadcast to other players
    socket.to(gameId).emit('bot_taken_over', {
      gameState: game,
      botName: botNameToReplace,
      newPlayerName,
      session: null // Don't send session to other players
    });

    console.log(`Bot ${botNameToReplace} taken over by ${newPlayerName} in game ${gameId}`);
  }));

  // ============================================================================
  // change_bot_difficulty - Change bot difficulty level
  // ============================================================================
  socket.on('change_bot_difficulty', errorBoundaries.gameAction('change_bot_difficulty')(async ({
    gameId,
    botName,
    difficulty
  }: {
    gameId: string;
    botName: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Find the bot
    const bot = game.players.find(p => p.name === botName);
    if (!bot) {
      socket.emit('error', { message: 'Bot not found' });
      return;
    }

    // Must be a bot
    if (!bot.isBot) {
      socket.emit('error', { message: 'Can only change difficulty of bot players' });
      return;
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      socket.emit('error', { message: 'Invalid difficulty level' });
      return;
    }

    // Update bot difficulty
    bot.botDifficulty = difficulty;

    // Broadcast updated game state
    emitGameUpdate(gameId, game);

    console.log(`Bot ${botName} difficulty changed to ${difficulty} in game ${gameId}`);
  }));
}
