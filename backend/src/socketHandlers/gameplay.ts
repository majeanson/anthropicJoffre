/**
 * Gameplay Socket.io Handlers
 * Sprint 3 Refactoring: Extracted from index.ts
 *
 * Handles all core gameplay socket events:
 * - place_bet: Place a bet during betting phase
 * - play_card: Play a card during playing phase
 * - player_ready: Mark player as ready for next round
 */

import { Socket, Server } from 'socket.io';
import { GameState, Card, Bet } from '../types/game';
import { Logger } from 'winston';

// Import validation schemas
import {
  validateInput,
  placeBetPayloadSchema,
  playCardPayloadSchema,
  playerReadyPayloadSchema,
} from '../validation/schemas';

/**
 * Round statistics tracking interface
 */
export interface RoundStatsData {
  cardPlayTimes: Map<string, number[]>; // playerId -> array of play times in ms
  trumpsPlayed: Map<string, number>; // playerId -> count of trump cards played
  redZerosCollected: Map<string, number>; // playerId -> count of red 0 cards collected
  brownZerosReceived: Map<string, number>; // playerId -> count of brown 0 cards received
  trickStartTime: number; // timestamp when trick started
  initialHands: Map<string, Card[]>; // playerName -> starting hand
  playerBets: Map<string, { amount: number; withoutTrump: boolean } | null>; // playerName -> bet or null if skipped
}

/**
 * Dependencies needed by the gameplay handlers
 */
export interface GameplayHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  roundStats: Map<string, RoundStatsData>;

  // Socket.io
  io: Server;

  // Rate limiting
  rateLimiters: {
    gameActions: {
      checkLimit: (identifier: string, ipAddress: string) => { allowed: boolean };
      recordRequest: (identifier: string, ipAddress: string) => void;
    };
  };
  getSocketIP: (socket: Socket) => string;

  // Timeout management
  startPlayerTimeout: (gameId: string, playerId: string, phase: 'betting' | 'playing') => void;
  clearPlayerTimeout: (gameId: string, playerId: string) => void;

  // Game logic helpers
  getHighestBet: (bets: Bet[], dealerPlayerId: string) => Bet | null;
  isBetHigher: (bet1: Bet, bet2: Bet) => boolean;

  // Validation functions
  validateBet: (game: GameState, playerId: string, amount: number, withoutTrump: boolean, skipped?: boolean) => { success: boolean; error?: string };
  validateCardPlay: (game: GameState, playerId: string, card: Card) => { success: boolean; error?: string };

  // State transformation functions
  applyBet: (game: GameState, playerId: string, playerName: string, amount: number, withoutTrump: boolean, skipped?: boolean) => {
    bettingComplete: boolean;
    allPlayersSkipped: boolean;
  };
  resetBetting: (game: GameState) => void;
  applyCardPlay: (game: GameState, playerId: string, card: Card) => {
    trickComplete: boolean;
    previousPlayerIndex: number;
  };

  // Game lifecycle
  resolveTrick: (gameId: string) => void;
  handlePlayingTimeout: (gameId: string, playerName: string) => void;
  handleBettingTimeout: (gameId: string, playerName: string) => void;

  // Emission helpers
  emitGameUpdate: (gameId: string, gameState: GameState, forceFull?: boolean) => void;
  broadcastGameUpdate: (gameId: string, event: string, gameState: GameState) => void;

  // Utility
  logger: Logger;
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;

}

/**
 * Register all gameplay-related Socket.io handlers
 */
export function registerGameplayHandlers(socket: Socket, deps: GameplayHandlersDependencies): void {
  const {
    games,
    roundStats,
    io,
    rateLimiters,
    getSocketIP,
    startPlayerTimeout,
    clearPlayerTimeout,
    getHighestBet,
    isBetHigher,
    validateBet,
    validateCardPlay,
    applyBet,
    resetBetting,
    applyCardPlay,
    resolveTrick,
    emitGameUpdate,
    broadcastGameUpdate,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // place_bet - Place a bet during betting phase
  // ============================================================================
  socket.on('place_bet', errorBoundaries.gameAction('place_bet')((payload: { gameId: string; amount: number; withoutTrump: boolean; skipped?: boolean }) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(placeBetPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid place_bet payload', { payload, error: validation.error });
      return;
    }

    const { gameId, amount, withoutTrump, skipped } = validation.data;

    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) return;

    // Find player by name (stable identifier) - socket IDs are volatile
    const playerName = socket.data.playerName || game.players.find(p => p.id === socket.id)?.name;
    if (!playerName) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.gameActions.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are betting too fast. Please wait a moment.',
      });
      logger.warn('Rate limit exceeded for place_bet', {
        playerName,
        ipAddress,
        gameId,
      });
      return;
    }
    rateLimiters.gameActions.recordRequest(playerName, ipAddress);

    // VALIDATION - Use pure validation function
    const betValidation = validateBet(game, socket.id, amount, withoutTrump, skipped);
    if (!betValidation.success) {
      socket.emit('invalid_bet', { message: betValidation.error });
      return;
    }


    // Clear timeout for current player (side effect)
    clearPlayerTimeout(gameId, socket.id);

    const isDealer = game.currentPlayerIndex === game.dealerIndex;

    // Additional validation for non-skip bets (complex betting rules)
    if (!skipped && game.currentBets.length > 0) {
      const dealerPlayerId = game.players[game.dealerIndex].id;
      const currentHighest = getHighestBet(game.currentBets, dealerPlayerId);
      if (currentHighest) {
        const newBet: Bet = { playerId: socket.id, playerName, amount, withoutTrump };

        // Dealer can equalize the bet
        if (isDealer) {
          // Dealer must match or beat the highest bet
          if (amount < currentHighest.amount) {
            socket.emit('invalid_bet', {
              message: 'As dealer, you can match the highest bet or raise'
            });
            return;
          }
        } else {
          // Non-dealers must raise (beat the current highest)
          if (!isBetHigher(newBet, currentHighest)) {
            socket.emit('invalid_bet', {
              message: 'You must bid higher than the current highest bet (without trump beats with trump at same value)'
            });
            return;
          }
        }
      }
    }

    // Find player by name for stable identification
    const player = game.players.find(p => p.name === playerName);
    if (!player) {
      socket.emit('error', { message: 'Player not found in game' });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function with player.id
    const result = applyBet(game, player.id, playerName, amount, withoutTrump, skipped);

    // Save bet to round stats for end-of-round display
    const stats = roundStats.get(gameId);
    if (stats) {
      if (skipped) {
        stats.playerBets.set(player.name, null); // null indicates skip
      } else {
        stats.playerBets.set(player.name, { amount, withoutTrump });
      }
    }

    // Handle all-players-skipped scenario
    if (result.allPlayersSkipped) {
      resetBetting(game);
      emitGameUpdate(gameId, game);
      io.to(gameId).emit('error', { message: 'All players skipped. Betting restarts.' });
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
      return;
    }

    // Handle betting completion - transition to playing phase
    if (result.bettingComplete) {
      const dealerPlayerId = game.players[game.dealerIndex].id;
      game.highestBet = getHighestBet(game.currentBets, dealerPlayerId);
      game.phase = 'playing';
      const highestBidderIndex = game.players.findIndex(
        (p) => p.id === game.highestBet?.playerId
      );
      game.currentPlayerIndex = highestBidderIndex;
      emitGameUpdate(gameId, game);
      const firstPlayer = game.players[game.currentPlayerIndex];
      startPlayerTimeout(gameId, firstPlayer.id, 'playing');

      // Schedule bot action if first player is a bot
      if (firstPlayer?.isBot) {
        setTimeout(() => {
          const currentGame = games.get(gameId);
          if (!currentGame || currentGame.phase !== 'playing') return;

          const currentBot = currentGame.players[currentGame.currentPlayerIndex];
          if (!currentBot || currentBot.name !== firstPlayer.name) return;

          deps.handlePlayingTimeout(gameId, firstPlayer.name);
        }, 2000);
      }
    } else {
      // Betting continues - emit update and start next player's timeout
      emitGameUpdate(gameId, game);
      const nextPlayer = game.players[game.currentPlayerIndex];
      startPlayerTimeout(gameId, nextPlayer.id, 'betting');

      // Schedule bot action if next player is a bot
      if (nextPlayer?.isBot) {
        setTimeout(() => {
          const currentGame = games.get(gameId);
          if (!currentGame || currentGame.phase !== 'betting') return;

          const currentBot = currentGame.players[currentGame.currentPlayerIndex];
          if (!currentBot || currentBot.name !== nextPlayer.name) return;

          deps.handleBettingTimeout(gameId, nextPlayer.name);
        }, 2000);
      }
    }
  }));

  // ============================================================================
  // play_card - Play a card during playing phase
  // ============================================================================
  socket.on('play_card', errorBoundaries.gameAction('play_card')((payload: { gameId: string; card: Card }) => {
    // Sprint 2: Validate input with Zod schema
    const inputValidation = validateInput(playCardPayloadSchema, payload);
    if (!inputValidation.success) {
      socket.emit('error', { message: `Invalid input: ${inputValidation.error}` });
      logger.warn('Invalid play_card payload', { payload, error: inputValidation.error });
      return;
    }

    const { gameId, card } = inputValidation.data;

    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    // Find player by name (stable identifier) - socket IDs are volatile
    const playerName = socket.data.playerName || game.players.find(p => p.id === socket.id)?.name;
    if (!playerName) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.gameActions.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are playing too fast. Please wait a moment before playing again.',
      });
      logger.warn('Rate limit exceeded for play_card', {
        playerName,
        ipAddress,
        gameId,
      });
      return;
    }
    rateLimiters.gameActions.recordRequest(playerName, ipAddress);

    // VALIDATION - Use pure validation function
    const playValidation = validateCardPlay(game, socket.id, card);
    if (!playValidation.success) {
      socket.emit('invalid_move', { message: playValidation.error });
      return;
    }

    // Clear timeout for current player (side effect)
    clearPlayerTimeout(gameId, socket.id);

    // Track statistics BEFORE state change (side effect)
    const stats = roundStats.get(gameId);
    if (stats) {
      // Track play time (time since trick started)
      const playTime = Date.now() - stats.trickStartTime;
      const playerTimes = stats.cardPlayTimes.get(playerName) || [];
      playerTimes.push(playTime);
      stats.cardPlayTimes.set(playerName, playerTimes);

      // Track trump card usage (check BEFORE trump is set)
      if (game.trump && card.color === game.trump) {
        const trumpCount = stats.trumpsPlayed.get(playerName) || 0;
        stats.trumpsPlayed.set(playerName, trumpCount + 1);
      }

      // Reset trick start time if this starts a new trick
      if (game.currentTrick.length === 0) {
        stats.trickStartTime = Date.now();
      }
    }

    // STATE TRANSFORMATION - Use pure state function
    const result = applyCardPlay(game, socket.id, card);

    // I/O - Emit updates and handle trick resolution
    if (result.trickComplete) {
      // HOT PATH: Emit immediately for client rendering, skip DB save (trick will be saved after resolution)
      // Using direct emit() instead of emitGameUpdate() to avoid unnecessary DB writes
      io.to(gameId).emit('game_updated', game);
      // Small delay to ensure clients render the 4-card state before resolution
      setTimeout(() => {
        resolveTrick(gameId);
      }, 100);
      // Note: timeout will be started by resolveTrick after 2-second delay
      // Database save will happen after trick is cleared
    } else {
      // Emit updated state with turn advanced
      emitGameUpdate(gameId, game);
      // Start timeout for next player
      const nextPlayer = game.players[game.currentPlayerIndex];
      if (nextPlayer) {
        startPlayerTimeout(gameId, nextPlayer.id, 'playing');

        // Schedule bot action if next player is a bot
        if (nextPlayer.isBot) {
          setTimeout(() => {
            const currentGame = games.get(gameId);
            if (!currentGame || currentGame.phase !== 'playing') return;

            // Verify it's still this bot's turn
            const currentBot = currentGame.players[currentGame.currentPlayerIndex];
            if (!currentBot || currentBot.name !== nextPlayer.name) return;

            // Check if bot already played
            const hasPlayed = currentGame.currentTrick.some(tc => tc.playerName === nextPlayer.name);
            if (hasPlayed) return;

            // Trigger the playing timeout handler which has bot logic
            deps.handlePlayingTimeout(gameId, nextPlayer.name);
          }, 2000); // 2 second delay for bot actions
        }
      }
    }
  }));

  // ============================================================================
  // player_ready - Mark player as ready for next round
  // ============================================================================
  socket.on('player_ready', errorBoundaries.gameAction('player_ready')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'scoring') {
      socket.emit('error', { message: 'Not in scoring phase' });
      return;
    }

    // Find player by name (stable identifier) - socket IDs are volatile
    const playerName = socket.data.playerName;
    const player = playerName
      ? game.players.find(p => p.name === playerName)
      : game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Add player to ready list if not already ready
    if (!game.playersReady) {
      game.playersReady = [];
    }

    // Use player name for stability across reconnections
    if (!game.playersReady.includes(player.name)) {
      game.playersReady.push(player.name);

      // Broadcast updated game state
      broadcastGameUpdate(gameId, 'game_updated', game);
    }
  }));
}
