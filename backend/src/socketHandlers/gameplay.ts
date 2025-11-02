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
  applyBet: (game: GameState, playerId: string, amount: number, withoutTrump: boolean, skipped?: boolean) => {
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
  errorBoundaries: {
    gameAction: (actionName: string) => (handler: (...args: any[]) => void) => (...args: any[]) => void;
  };
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

    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;
    console.log(`\n[PLACE_BET] Player: ${playerName}, Amount: ${amount}, WithoutTrump: ${withoutTrump}, Skipped: ${skipped}`);

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
    console.log(`[PLACE_BET] Validating bet - amount: ${amount}, withoutTrump: ${withoutTrump}, skipped: ${skipped}`);
    const betValidation = validateBet(game, socket.id, amount, withoutTrump, skipped);
    if (!betValidation.success) {
      console.log(`[PLACE_BET] ❌ Validation failed: ${betValidation.error}`);
      socket.emit('invalid_bet', { message: betValidation.error });
      return;
    }
    console.log(`[PLACE_BET] ✅ Validation passed`);


    // Clear timeout for current player (side effect)
    clearPlayerTimeout(gameId, socket.id);

    const isDealer = game.currentPlayerIndex === game.dealerIndex;

    // Additional validation for non-skip bets (complex betting rules)
    if (!skipped && game.currentBets.length > 0) {
      const dealerPlayerId = game.players[game.dealerIndex].id;
      const currentHighest = getHighestBet(game.currentBets, dealerPlayerId);
      if (currentHighest) {
        const newBet: Bet = { playerId: socket.id, amount, withoutTrump };

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

    // STATE TRANSFORMATION - Use pure state function
    console.log(`[PLACE_BET] Applying bet to game state...`);
    const result = applyBet(game, socket.id, amount, withoutTrump, skipped);
    console.log(`[PLACE_BET] Result: bettingComplete=${result.bettingComplete}, allPlayersSkipped=${result.allPlayersSkipped}`);
    console.log(`[PLACE_BET] Current player index: ${game.currentPlayerIndex}, Current player: ${game.players[game.currentPlayerIndex]?.name}`);

    // Save bet to round stats for end-of-round display
    const stats = roundStats.get(gameId);
    if (stats) {
      const player = game.players.find(p => p.id === socket.id);
      if (player) {
        if (skipped) {
          stats.playerBets.set(player.name, null); // null indicates skip
        } else {
          stats.playerBets.set(player.name, { amount, withoutTrump });
        }
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
      console.log(`[PLACE_BET] 🎯 Betting complete! Transitioning to playing phase...`);
      const dealerPlayerId = game.players[game.dealerIndex].id;
      game.highestBet = getHighestBet(game.currentBets, dealerPlayerId);
      game.phase = 'playing';
      const highestBidderIndex = game.players.findIndex(
        (p) => p.id === game.highestBet?.playerId
      );
      game.currentPlayerIndex = highestBidderIndex;
      console.log(`[PLACE_BET] 📡 Emitting game_updated (phase transition to playing)...`);
      emitGameUpdate(gameId, game);
      const firstPlayer = game.players[game.currentPlayerIndex];
      startPlayerTimeout(gameId, firstPlayer.id, 'playing');

      // Schedule bot action if first player is a bot
      if (firstPlayer?.isBot) {
        console.log(`   🤖 Scheduling bot action for ${firstPlayer.name} in 2 seconds (playing phase)`);
        setTimeout(() => {
          const currentGame = games.get(gameId);
          if (!currentGame || currentGame.phase !== 'playing') return;

          const currentBot = currentGame.players[currentGame.currentPlayerIndex];
          if (!currentBot || currentBot.name !== firstPlayer.name) return;

          console.log(`   🤖 Bot ${firstPlayer.name} taking automatic action (start of playing)`);
          deps.handlePlayingTimeout(gameId, firstPlayer.name);
        }, 2000);
      }
    } else {
      // Betting continues - emit update and start next player's timeout
      console.log(`[PLACE_BET] ➡️  Betting continues. Next player: ${game.players[game.currentPlayerIndex]?.name}`);
      console.log(`[PLACE_BET] 📡 Emitting game_updated (betting continues)...`);
      emitGameUpdate(gameId, game);
      const nextPlayer = game.players[game.currentPlayerIndex];
      startPlayerTimeout(gameId, nextPlayer.id, 'betting');

      // Schedule bot action if next player is a bot
      if (nextPlayer?.isBot) {
        console.log(`   🤖 Scheduling bot action for ${nextPlayer.name} in 2 seconds (betting)`);
        setTimeout(() => {
          const currentGame = games.get(gameId);
          if (!currentGame || currentGame.phase !== 'betting') return;

          const currentBot = currentGame.players[currentGame.currentPlayerIndex];
          if (!currentBot || currentBot.name !== nextPlayer.name) return;

          console.log(`   🤖 Bot ${nextPlayer.name} taking automatic action (betting)`);
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
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;

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

    // Log current trick state and player's hand (debugging)
    console.log(`\n🃏 PLAY_CARD - Player: ${playerName} (${socket.id})`);
    console.log(`   Current Trick (${game.currentTrick.length}/4):`);
    game.currentTrick.forEach((tc, idx) => {
      const player = game.players.find(p => p.id === tc.playerId);
      console.log(`     ${idx + 1}. ${player?.name || tc.playerId}: ${tc.card.color} ${tc.card.value}`);
    });
    console.log(`   Player's Hand (${currentPlayer.hand.length} cards):`);
    currentPlayer.hand.forEach((c, idx) => {
      console.log(`     ${idx + 1}. ${c.color} ${c.value}`);
    });
    console.log(`   Card being played: ${card.color} ${card.value}`);
    console.log(`   Current turn index: ${game.currentPlayerIndex} (${currentPlayer.name})`);

    // VALIDATION - Use pure validation function
    const playValidation = validateCardPlay(game, socket.id, card);
    if (!playValidation.success) {
      console.log(`   ❌ REJECTED: ${playValidation.error}`);
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

    console.log(`   ✅ ACCEPTED: Card added to trick (now ${game.currentTrick.length}/4 cards)`);
    console.log(`   Updated hand (${currentPlayer.hand.length} cards remaining):`);
    currentPlayer.hand.forEach((c, idx) => {
      console.log(`     ${idx + 1}. ${c.color} ${c.value}`);
    });

    // I/O - Emit updates and handle trick resolution
    if (result.trickComplete) {
      // Emit state with all 4 cards visible before trick resolution
      const prevPlayer = game.players[result.previousPlayerIndex];
      const currPlayer = game.players[game.currentPlayerIndex];
      if (prevPlayer && currPlayer) {
        console.log(`   🎯 Trick complete! Turn advanced: ${prevPlayer.name} → ${currPlayer.name}`);
      }
      console.log(`   Final trick state before resolution:`);
      game.currentTrick.forEach((tc, idx) => {
        const player = game.players.find(p => p.id === tc.playerId);
        console.log(`     ${idx + 1}. ${player?.name}: ${tc.card.color} ${tc.card.value}`);
      });
      // HOT PATH: Emit immediately for client rendering, skip DB save (trick will be saved after resolution)
      // Using direct emit() instead of emitGameUpdate() to avoid unnecessary DB writes
      io.to(gameId).emit('game_updated', game);
      console.log(`   ⏳ Resolving trick in 100ms to allow clients to render...\n`);
      // Small delay to ensure clients render the 4-card state before resolution
      setTimeout(() => {
        resolveTrick(gameId);
      }, 100);
      // Note: timeout will be started by resolveTrick after 2-second delay
      // Database save will happen after trick is cleared
    } else {
      // Emit updated state with turn advanced
      const prevPlayer = game.players[result.previousPlayerIndex];
      const currPlayer = game.players[game.currentPlayerIndex];
      if (prevPlayer && currPlayer) {
        console.log(`   ➡️  Turn advanced: ${prevPlayer.name} → ${currPlayer.name} (${game.currentTrick.length}/4 cards played)\n`);
      }
      emitGameUpdate(gameId, game);
      // Start timeout for next player
      const nextPlayer = game.players[game.currentPlayerIndex];
      if (nextPlayer) {
        startPlayerTimeout(gameId, nextPlayer.id, 'playing');

        // Schedule bot action if next player is a bot
        if (nextPlayer.isBot) {
          console.log(`   🤖 Scheduling bot action for ${nextPlayer.name} in 2 seconds`);
          setTimeout(() => {
            const currentGame = games.get(gameId);
            if (!currentGame || currentGame.phase !== 'playing') return;

            // Verify it's still this bot's turn
            const currentBot = currentGame.players[currentGame.currentPlayerIndex];
            if (!currentBot || currentBot.name !== nextPlayer.name) return;

            // Check if bot already played
            const hasPlayed = currentGame.currentTrick.some(tc => tc.playerName === nextPlayer.name);
            if (hasPlayed) return;

            console.log(`   🤖 Bot ${nextPlayer.name} taking automatic action`);
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

    const player = game.players.find(p => p.id === socket.id);
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
      console.log(`Player ${player.name} is ready (${game.playersReady.length}/4)`);

      // Broadcast updated game state
      broadcastGameUpdate(gameId, 'game_updated', game);
    }
  }));
}
