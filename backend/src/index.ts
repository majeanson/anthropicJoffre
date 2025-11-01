// Sentry must be imported and initialized first
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables first
// Prioritize .env.local for local development (avoids Neon quota usage)
const localEnvPath = resolve(__dirname, '../.env.local');
if (existsSync(localEnvPath)) {
  console.log('📝 Using local environment (.env.local)');
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions in development
    // Profiling
    profilesSampleRate: 1.0, // Profile 100% of transactions
  });
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { ConnectionManager } from './connection/ConnectionManager';
import { GameState, Player, Bet, TrickCard, Card, PlayerSession, GamePhase } from './types/game';
import { createDeck, shuffleDeck, dealCards } from './game/deck';
import {
  determineWinner,
  calculateTrickPoints,
  calculateRoundScore,
  getHighestBet,
  isBetHigher,
  getWinnerName,
  hasRedZero,
  hasBrownZero,
  getFastestPlayer,
  getTrumpMaster,
  getLuckiestPlayer,
} from './game/logic';
import {
  calculateRoundStatistics,
  initializeRoundStats,
  updateTrickStats,
  RoundStatsData,
  RoundStatistics,
} from './game/roundStatistics';
import { selectBotCard } from './game/botLogic';
import {
  validateCardPlay,
  validateBet,
  validateTeamSelection,
  validatePositionSwap,
  validateGameStart
} from './game/validation';
import {
  applyCardPlay,
  applyBet,
  resetBetting,
  applyTeamSelection,
  applyPositionSwap,
  applyTrickResolution,
  calculateRoundScoring,
  applyRoundScoring
} from './game/state';
import {
  saveGameHistory,
  getRecentGames,
  saveOrUpdateGame as dbSaveOrUpdateGame,
  markGameFinished as dbMarkGameFinished,
  saveGameParticipants as dbSaveGameParticipants,
  updatePlayerStats,
  updateRoundStats as dbUpdateRoundStats,
  updateGameStats as dbUpdateGameStats,
  calculateEloChange,
  getPlayerStats,
  getLeaderboard,
  getPlayerGameHistory,
  getGameReplayData,
  getAllFinishedGames,
  cleanupAbandonedGames,
  cleanupStaleGames,
  saveGameSnapshot,
  loadGameSnapshots,
  getPoolStats,
  closePool,
} from './db';
// Import conditional persistence manager
import * as PersistenceManager from './db/persistenceManager';
import {
  saveGameState as saveGameToDB,
  loadGameState as loadGameFromDB,
  deleteGameState as deleteGameFromDB,
  listActiveGames,
  getPlayerGames
} from './db/gameState';
import {
  validateBetAmount,
  validateGameId,
  validateTeamId,
  validateBoolean,
  validateCardValue,
  validateCardColor,
} from './utils/sanitization';
import { queryCache } from './utils/queryCache';
import {
  createSession as createDBSession,
  validateSession as validateDBSession,
  updateSessionActivity,
  deletePlayerSessions,
  findSessionByPlayer
} from './db/sessions';
import {
  updatePlayerPresence,
  getOnlinePlayers,
  getPlayerPresence,
  markPlayerOffline,
} from './db/presence';
import { errorBoundaries, getAllMetrics } from './middleware/errorBoundary';
import logger, {
  createLogger,
  logGameAction,
  logError,
  requestLogger,
  PerformanceTimer,
} from './utils/logger';
import {
  responseTimeTracker,
  responseTimeMiddleware,
  trackSocketEvent,
} from './utils/responseTime';
import {
  generateStateDelta,
  applyStateDelta,
  calculateDeltaSize,
  isSignificantChange,
  GameStateDelta,
} from './utils/stateDelta';
import {
  rateLimiters,
  startRateLimiterCleanup,
  getSocketIP,
} from './utils/rateLimiter';
import {
  emitGameUpdate as emitGameUpdateUtil,
  broadcastGameUpdate as broadcastGameUpdateUtil,
  BroadcastManagerDeps,
} from './utils/broadcastManager';
import {
  validateInput,
  playCardPayloadSchema,
  placeBetPayloadSchema,
  selectTeamPayloadSchema,
  swapPositionPayloadSchema,
  startGamePayloadSchema,
  joinGamePayloadSchema,
  createGamePayloadSchema,
  teamChatPayloadSchema,
  gameChatPayloadSchema,
  playerReadyPayloadSchema,
  voteRematchPayloadSchema,
  kickPlayerPayloadSchema,
  leaveGamePayloadSchema,
  spectateGamePayloadSchema,
  leaveSpectatePayloadSchema,
} from './validation/schemas';
import { registerRoutes } from './api/routes';
import { registerLobbyHandlers } from './socketHandlers/lobby';
import { registerGameplayHandlers } from './socketHandlers/gameplay';
import { registerChatHandlers } from './socketHandlers/chat';
import { registerSpectatorHandlers } from './socketHandlers/spectator';
import { registerBotHandlers } from './socketHandlers/bots';
import { registerStatsHandlers } from './socketHandlers/stats';
import { registerConnectionHandlers } from './socketHandlers/connection';
import { registerAdminHandlers } from './socketHandlers/admin';
import {
  generateSessionToken as generateSessionTokenUtil,
  createPlayerSession as createPlayerSessionUtil,
  validateSessionToken as validateSessionTokenUtil
} from './utils/sessionManager';
import { findPlayer, findPlayerIndex, hasAtLeastOneHuman } from './utils/playerHelpers';
import { getNextBotName, canAddBot, areTeammates } from './utils/botHelpers';
import {
  updateOnlinePlayer as updateOnlinePlayerUtil,
  broadcastOnlinePlayers as broadcastOnlinePlayersUtil,
  startOnlinePlayersInterval,
  OnlinePlayer
} from './utils/onlinePlayerManager';
import { formatBytes, formatUptime } from './utils/formatting';

const app = express();
const httpServer = createServer(app);

// Configure CORS for Socket.io
const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, ''); // Remove trailing slash
const allowedOrigins: string[] = [
  'https://jaffre.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  clientUrl || '',
].filter((origin): origin is string => Boolean(origin) && origin.length > 0);

const corsOrigin = clientUrl ? allowedOrigins : '*';

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Enable connection state recovery for better stability
  connectionStateRecovery: {
    // Max disconnection duration (15 minutes = 900000ms for mobile AFK)
    maxDisconnectionDuration: 900000,
    // Skip middleware on recovery
    skipMiddlewares: true,
  },
  // Ping timeout and interval for faster disconnect detection
  pingTimeout: 10000, // 10 seconds
  pingInterval: 5000,  // 5 seconds
  // Enable WebSocket compression (reduces bandwidth by 30-60%)
  perMessageDeflate: {
    threshold: 1024, // Only compress messages > 1KB
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3, // Compression level (1-9, lower = faster, higher = better compression)
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024,
    },
    // Compression options
    clientNoContextTakeover: true, // Reset context between messages (lower memory)
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10, // Lower memory usage
    concurrencyLimit: 10, // Limit concurrent compression operations
  },
});

// Initialize connection manager for robust connection handling
const connectionManager = new ConnectionManager(io, {
  heartbeatInterval: 25000,  // 25 seconds
  heartbeatTimeout: 60000,   // 60 seconds
  maxReconnectionTime: 5 * 60 * 1000, // 5 minutes
  messageQueueLimit: 100,
  enableLogging: process.env.NODE_ENV === 'development'
});

// Log connection events
connectionManager.on('connection_lost', ({ playerName, gameId }) => {
  console.log(`Connection lost: ${playerName} in game ${gameId}`);
});

connectionManager.on('connection_timeout', ({ playerName, socketId }) => {
  console.log(`Connection timeout: ${playerName} (${socketId})`);
});

// Configure CORS for Express with validation logging
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (corsOrigin === '*') {
      // Development mode - allow all
      logger.debug('CORS: Allowing origin (development mode)', { origin });
      return callback(null, true);
    }

    // Production mode - check whitelist
    const isAllowed = Array.isArray(corsOrigin) && corsOrigin.includes(origin);
    if (isAllowed) {
      logger.debug('CORS: Allowing whitelisted origin', { origin });
      return callback(null, true);
    } else {
      logger.warn('CORS: Blocked non-whitelisted origin', {
        origin,
        allowedOrigins: corsOrigin,
      });
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Add structured logging for HTTP requests
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Add response time monitoring for all requests
app.use(responseTimeMiddleware);

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Stricter rate limit for game creation
const gameCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit to 10 game creations per 5 minutes
  message: 'Too many games created, please try again later.',
});

// Socket event rate limiters (stored per socket ID)
const socketRateLimiters = {
  chat: new Map<string, number>(), // Last message timestamp
  bet: new Map<string, number>(), // Last bet timestamp
  card: new Map<string, number>(), // Last card play timestamp
};


// In-memory game storage (can be moved to Redis for production)
const games = new Map<string, GameState>();

// Track game creation timestamps (gameId -> timestamp in milliseconds)
const gameCreationTimes = new Map<string, number>();

// Session storage for reconnection (maps token to session data)
const playerSessions = new Map<string, PlayerSession>();

// Timeout storage (maps gameId-playerId to timeout ID)
const activeTimeouts = new Map<string, NodeJS.Timeout>();

// Disconnect timeout storage (maps socket.id to timeout ID)
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

// Countdown interval storage (maps socket.id to interval ID)
const countdownIntervals = new Map<string, NodeJS.Timeout>();

// Game deletion timeouts (maps gameId to timeout ID)
const gameDeletionTimeouts = new Map<string, NodeJS.Timeout>();

// Database save debounce timeouts (prevent rapid concurrent saves)
const gameSaveTimeouts = new Map<string, NodeJS.Timeout>();


const onlinePlayers = new Map<string, OnlinePlayer>();

// Wrapper functions that use closure over Maps for handler compatibility
function generateSessionToken(): string {
  return generateSessionTokenUtil();
}

function createPlayerSession(gameId: string, playerId: string, playerName: string): PlayerSession {
  return createPlayerSessionUtil(gameId, playerId, playerName, playerSessions);
}

function validateSessionToken(token: string): PlayerSession | null {
  return validateSessionTokenUtil(token, playerSessions);
}

function updateOnlinePlayer(
  socketId: string,
  playerName: string,
  status: 'in_lobby' | 'in_game' | 'in_team_selection',
  gameId?: string
): void {
  updateOnlinePlayerUtil(socketId, playerName, status, gameId, onlinePlayers);
}

function broadcastOnlinePlayers(): void {
  broadcastOnlinePlayersUtil(io, onlinePlayers);
}

// Previous game states for delta generation (gameId -> previous GameState)
// Enables sending only changed data instead of full state (80-90% bandwidth reduction)
const previousGameStates = new Map<string, GameState>();

// Wrapper functions for broadcast utilities (use closure over dependencies)
function emitGameUpdate(gameId: string, gameState: GameState, forceFull: boolean = false): void {
  const deps: BroadcastManagerDeps = {
    io,
    previousGameStates,
    gameSaveTimeouts,
    logger,
    saveGame,
  };
  emitGameUpdateUtil(gameId, gameState, forceFull, deps);
}

function broadcastGameUpdate(
  gameId: string,
  event: string,
  data: GameState | { winnerId: string; winnerName: string; points: number; gameState: GameState } | { winningTeam: 1 | 2; gameState: GameState }
): void {
  broadcastGameUpdateUtil(gameId, event, data, io);
}

// Round statistics tracking (imported types from game/roundStatistics.ts)
const roundStats = new Map<string, RoundStatsData>(); // gameId -> stats data

// Timeout configuration
const BETTING_TIMEOUT = 60000; // 60 seconds
const PLAYING_TIMEOUT = 60000; // 60 seconds

// Database-backed game storage helpers

/**
 * Get game from cache or load from database
 * Provides transparent database-backed storage with memory caching
 */
async function getGame(gameId: string): Promise<GameState | undefined> {
  // Check cache first
  if (games.has(gameId)) {
    return games.get(gameId);
  }

  // Load from database if not in cache
  try {
    const gameState = await loadGameFromDB(gameId);
    if (gameState) {
      games.set(gameId, gameState); // Cache it
      return gameState;
    }
  } catch (error) {
    console.error(`Failed to load game ${gameId} from database:`, error);
  }

  return undefined;
}

/**
 * Save game to both cache and database
 * Ensures persistence across server restarts
 */
async function saveGame(gameState: GameState): Promise<void> {
  // Update cache
  games.set(gameState.id, gameState);

  // Persist to database (async, non-blocking)
  try {
    await saveGameToDB(gameState);
  } catch (error) {
    console.error(`Failed to save game ${gameState.id} to database:`, error);
    // Continue execution - cache is still valid
  }
}

/**
 * Delete game from both cache and database
 */
async function deleteGame(gameId: string): Promise<void> {
  // Remove from cache
  games.delete(gameId);
  gameCreationTimes.delete(gameId);
  previousGameStates.delete(gameId); // Clean up delta tracking

  // Remove from database (async)
  try {
    await deleteGameFromDB(gameId);
  } catch (error) {
    console.error(`Failed to delete game ${gameId} from database:`, error);
  }
}


// Online players interval (needed for cleanup)
let onlinePlayersInterval: NodeJS.Timeout;

const cleanup = async () => {
  logger.info('Starting graceful shutdown');

  // Clear intervals
  if (onlinePlayersInterval) {
    clearInterval(onlinePlayersInterval);
    logger.debug('Cleared online players interval');
  }

  // Destroy query cache
  try {
    queryCache.destroy();
    logger.debug('Query cache destroyed');
  } catch (error) {
    logError(error as Error, 'destroy query cache');
  }

  // Close database pool
  try {
    await closePool();
    logger.info('Database pool closed');
  } catch (error) {
    logError(error as Error, 'close database pool');
  }

  logger.info('Graceful shutdown complete');
  process.exit(0);
};

// Start the interval
onlinePlayersInterval = startOnlinePlayersInterval(io, onlinePlayers);

// Graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Helper to clear timeout for a player
function clearPlayerTimeout(gameId: string, playerNameOrId: string) {
  const key = `${gameId}-${playerNameOrId}`;
  const timeout = activeTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(key);
  }

  // Clear countdown interval
  const intervalKey = `${key}-interval`;
  const interval = activeTimeouts.get(intervalKey);
  if (interval) {
    clearInterval(interval as NodeJS.Timeout);
    activeTimeouts.delete(intervalKey);
  }
}

// Helper to start timeout for current player (uses stable playerName)
function startPlayerTimeout(gameId: string, playerNameOrId: string, phase: 'betting' | 'playing') {
  const game = games.get(gameId);
  if (!game) return;

  // Look up player by name (stable), fallback to ID
  let player = game.players.find(p => p.name === playerNameOrId);
  if (!player) {
    player = game.players.find(p => p.id === playerNameOrId);
  }
  if (!player) return;

  const playerName = player.name;
  const key = `${gameId}-${playerName}`; // Use stable playerName for key

  // Clear any existing timeout for this player
  clearPlayerTimeout(gameId, playerName);

  const timeoutDuration = phase === 'betting' ? BETTING_TIMEOUT : PLAYING_TIMEOUT;
  const startTime = Date.now();

  // Send countdown updates every second
  const countdownInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, Math.floor((timeoutDuration - elapsed) / 1000));

    const game = games.get(gameId);
    if (!game) {
      clearInterval(countdownInterval);
      return;
    }

    // Check if still current player's turn (use name for stable check)
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.name !== playerName || game.phase !== phase) {
      clearInterval(countdownInterval);
      return;
    }

    // Send countdown update to all players
    io.to(gameId).emit('timeout_countdown', {
      playerId: currentPlayer.id, // Current socket ID
      playerName: playerName, // Stable identifier
      secondsRemaining: remaining,
      phase
    });

    // Send warning at 15 seconds
    if (remaining === 15) {
      io.to(gameId).emit('timeout_warning', {
        playerId: currentPlayer.id,
        playerName: playerName,
        secondsRemaining: 15
      });
    }

    if (remaining === 0) {
      clearInterval(countdownInterval);
    }
  }, 1000);

  const timeout = setTimeout(() => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find(p => p.name === playerName);
    if (!player) return;

    console.log(`⏰ Timeout: ${player.name} in ${phase} phase`);

    // Emit auto-action notification
    io.to(gameId).emit('auto_action_taken', {
      playerId: player.id,
      playerName: player.name,
      phase
    });

    if (phase === 'betting') {
      handleBettingTimeout(gameId, playerName);
    } else {
      handlePlayingTimeout(gameId, playerName);
    }
  }, timeoutDuration);

  activeTimeouts.set(key, timeout);
  activeTimeouts.set(`${key}-interval`, countdownInterval);
}

// Handle betting timeout - auto-skip bet (uses stable playerName)
function handleBettingTimeout(gameId: string, playerName: string) {
  const game = games.get(gameId);
  if (!game || game.phase !== 'betting') return;

  // Look up player by name (stable across reconnects)
  const player = game.players.find(p => p.name === playerName);
  if (!player) return;

  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.name !== playerName) return; // Not their turn anymore

  const hasAlreadyBet = game.currentBets.some(b => b.playerId === player.id);
  if (hasAlreadyBet) return; // Already bet

  console.log(`Auto-skipping bet for ${currentPlayer.name} due to timeout`);

  const isDealer = game.currentPlayerIndex === game.dealerIndex;
  const hasValidBets = game.currentBets.some(b => !b.skipped);

  // If dealer and no valid bets, must bet minimum 7
  if (isDealer && !hasValidBets) {
    const bet: Bet = {
      playerId: player.id,
      amount: 7,
      withoutTrump: false,
      skipped: false,
    };
    game.currentBets.push(bet);
    console.log(`Auto-bet 7 points for dealer ${currentPlayer.name}`);
  } else {
    // Skip the bet
    const bet: Bet = {
      playerId: player.id,
      amount: -1,
      withoutTrump: false,
      skipped: true,
    };
    game.currentBets.push(bet);
  }

  // Check if all 4 players have bet
  if (game.currentBets.length === 4) {
    // Check if all skipped
    if (game.currentBets.every(b => b.skipped)) {
      game.currentBets = [];
      game.currentPlayerIndex = (game.dealerIndex + 1) % 4;
      emitGameUpdate(gameId, game);
      io.to(gameId).emit('error', { message: 'All players skipped. Betting restarts.' });
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].name, 'betting');
      return;
    }

    const dealerPlayerId = game.players[game.dealerIndex].id;
    game.highestBet = getHighestBet(game.currentBets, dealerPlayerId);
    game.phase = 'playing';
    const highestBidderIndex = game.players.findIndex(
      (p) => p.id === game.highestBet?.playerId
    );
    game.currentPlayerIndex = highestBidderIndex >= 0 ? highestBidderIndex : 0;
    emitGameUpdate(gameId, game);

    // Safety check: ensure player exists before starting timeout
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer) {
      startPlayerTimeout(gameId, currentPlayer.name, 'playing');
    }
  } else {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
    emitGameUpdate(gameId, game);

    // Safety check: ensure player exists before starting timeout
    const nextPlayer = game.players[game.currentPlayerIndex];
    if (nextPlayer) {
      startPlayerTimeout(gameId, nextPlayer.name, 'betting');
    }
  }
}

// Handle playing timeout - auto-play random valid card (uses stable playerName)
function handlePlayingTimeout(gameId: string, playerName: string) {
  const game = games.get(gameId);
  if (!game || game.phase !== 'playing') return;

  // Look up player by name (stable across reconnects)
  const player = game.players.find(p => p.name === playerName);
  if (!player) return;

  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.name !== playerName) return; // Not their turn anymore

  const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerName === playerName);
  if (hasAlreadyPlayed) return; // Already played

  if (game.currentTrick.length >= 4) return; // Trick complete

  console.log(`Auto-playing card for ${currentPlayer.name} due to timeout`);

  // Use hard bot logic to select best card (same strategy as frontend autoplay)
  const selectedCard = selectBotCard(game, player.id);

  if (!selectedCard) {
    console.error(`No valid cards found for ${currentPlayer.name}`);
    return;
  }

  console.log(`Auto-playing (bot logic): ${selectedCard.color} ${selectedCard.value}`);

  // Set trump on first card (unless bet was "without trump")
  if (game.currentTrick.length === 0 && !game.trump && !game.highestBet?.withoutTrump) {
    game.trump = selectedCard.color;
  }

  // Add card to trick (include both playerId and playerName)
  game.currentTrick.push({
    playerId: player.id,
    playerName: player.name,
    card: selectedCard
  });

  // Remove card from player's hand
  currentPlayer.hand = currentPlayer.hand.filter(
    (c) => !(c.color === selectedCard.color && c.value === selectedCard.value)
  );

  // Move to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

  // Check if trick is complete
  if (game.currentTrick.length === 4) {
    console.log(`   🎯 Trick complete! (via timeout auto-play)`);
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
  } else {
    emitGameUpdate(gameId, game);
    const nextPlayer = game.players[game.currentPlayerIndex];
    if (nextPlayer) {
      startPlayerTimeout(gameId, nextPlayer.name, 'playing');
    }
  }
}



// ============================================================================
// REST API Routes - Refactored (Sprint 3)
// ============================================================================
// Register all REST API routes from the extracted module
registerRoutes(app, {
  games,
  gameCreationTimes,
  io,
  corsOrigin,
  allowedOrigins,
  getGame,
  emitGameUpdate,
  formatUptime,
  formatBytes,
});

// ============================================================================

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Register connection with ConnectionManager
  connectionManager.registerConnection(socket);

  // ============================================================================
  // Lobby Handlers - Refactored (Sprint 3)
  // ============================================================================
  // Register all lobby-related socket handlers from the extracted module
  registerLobbyHandlers(socket, {
    games,
    gameCreationTimes,
    activeTimeouts,
    disconnectTimeouts,
    gameDeletionTimeouts,
    io,
    saveGame: saveGameToDB,
    deletePlayerSessions,
    updatePlayerPresence,
    createDBSession,
    createPlayerSession,
    connectionManager,
    updateOnlinePlayer,
    startPlayerTimeout,
    clearPlayerTimeout,
    startNewRound,
    emitGameUpdate,
    broadcastGameUpdate,
    validateTeamSelection,
    validatePositionSwap,
    validateGameStart,
    applyTeamSelection,
    applyPositionSwap,
    logger,
    errorBoundaries,
  });




  // ============================================================================

  // ============================================================================
  // Gameplay Handlers - Refactored (Sprint 3)
  // ============================================================================
  // Register all gameplay-related socket handlers from the extracted module
  registerGameplayHandlers(socket, {
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
  });

  // ============================================================================
  // Chat Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerChatHandlers(socket, {
    games,
    io,
    rateLimiters,
    getSocketIP,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Spectator Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerSpectatorHandlers(socket, {
    games,
    io,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Bot Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerBotHandlers(socket, {
    games,
    playerSessions,
    onlinePlayers,
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
  });

  // ============================================================================
  // Stats Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerStatsHandlers(socket, {
    getPlayerStats,
    getLeaderboard,
    getPlayerGameHistory,
    getGameReplayData,
    getAllFinishedGames,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Connection Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerConnectionHandlers(socket, {
    games,
    playerSessions,
    activeTimeouts,
    disconnectTimeouts,
    gameDeletionTimeouts,
    countdownIntervals,
    onlinePlayers,
    socketRateLimiters: {
      chat: socketRateLimiters.chat,
      bet: socketRateLimiters.bet,
      card: socketRateLimiters.card,
    },
    io,
    validateDBSession,
    updateSessionActivity,
    deletePlayerSessions,
    markPlayerOffline,
    validateSessionToken,
    getGame,
    startPlayerTimeout,
    emitGameUpdate,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Admin Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerAdminHandlers(socket, {
    games,
    playerSessions,
    onlinePlayers,
    io,
    deletePlayerSessions,
    broadcastOnlinePlayers,
    emitGameUpdate,
    logger,
    errorBoundaries,
  });

});

function startNewRound(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  const deck = shuffleDeck(createDeck());
  const hands = dealCards(deck, 4);

  game.players.forEach((player, index) => {
    player.hand = hands[index];
    player.tricksWon = 0;
    player.pointsWon = 0;
  });

  // Rotate dealer to next player
  game.dealerIndex = (game.dealerIndex + 1) % 4;

  game.phase = 'betting';
  game.currentBets = [];
  game.highestBet = null;
  game.trump = null;
  game.currentTrick = [];
  game.previousTrick = null;
  game.currentRoundTricks = []; // Reset tricks for new round
  // Betting starts with player after dealer
  game.currentPlayerIndex = (game.dealerIndex + 1) % 4;

  // Initialize round statistics tracking
  roundStats.set(gameId, initializeRoundStats(game.players));

  broadcastGameUpdate(gameId, 'round_started', game);

  // Start timeout for first player's bet
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer) {
    startPlayerTimeout(gameId, currentPlayer.id, 'betting');
  }
}

/**
 * Schedule post-trick actions after animation delay
 * Sprint 5 Phase 2.3: Extracted from resolveTrick() to reduce duplication
 *
 * The 2-second delay allows the frontend to show trick resolution animation.
 * After the delay, clears the current trick and either:
 * - Ends the round if all hands are empty
 * - Continues playing with next card
 *
 * @param gameId - Game ID
 * @param winnerName - Name of player who won the trick
 * @param isRoundOver - Whether the round is complete (all hands empty)
 * @param delayMs - Delay in milliseconds before executing actions (default: 2000ms)
 */
function schedulePostTrickActions(
  gameId: string,
  winnerName: string,
  isRoundOver: boolean,
  delayMs: number = 2000
) {
  setTimeout(() => {
    const game = games.get(gameId);
    if (!game) return;

    // Clear trick after frontend has shown the animation
    game.currentTrick = [];

    if (isRoundOver) {
      // All hands empty - proceed to round end
      endRound(gameId);
    } else {
      // Continue playing - emit update and start timeout for next card
      emitGameUpdate(gameId, game);
      startPlayerTimeout(gameId, winnerName, 'playing');
    }
  }, delayMs);
}

function resolveTrick(gameId: string) {
  console.log(`\n🎯 ===== resolveTrick START for game ${gameId} =====`);
  const game = games.get(gameId);
  if (!game) {
    console.log(`   ❌ Game not found!`);
    return;
  }

  console.log(`   📊 currentTrick.length = ${game.currentTrick.length}`);
  game.currentTrick.forEach((tc, idx) => {
    console.log(`      ${idx + 1}. ${tc.playerName}: ${tc.card.color} ${tc.card.value}`);
  });

  // 1. PURE CALCULATION - Determine winner and points
  const winnerId = determineWinner(game.currentTrick, game.trump);
  const specialCardPoints = calculateTrickPoints(game.currentTrick);
  const totalPoints = 1 + specialCardPoints;

  // Look up winner's name (stable identifier) from the trick
  const winnerName = getWinnerName(game.currentTrick, winnerId, game.players);

  // 2. SIDE EFFECT - Track special card stats for round statistics (use stable playerName)
  // Sprint 5 Phase 2.3: Extracted to updateTrickStats() helper
  const stats = roundStats.get(gameId);
  updateTrickStats(stats, game.currentTrick, winnerName);

  // 3. STATE TRANSFORMATION - Apply trick resolution (use stable playerName)
  // applyTrickResolution now keeps currentTrick visible (doesn't clear it)
  const result = applyTrickResolution(game, winnerName, totalPoints);

  // DEBUG: Log current trick state before emitting
  console.log(`   📤 About to emit trick_resolved`);
  console.log(`   📤 game object currentTrick.length = ${game.currentTrick.length}`);
  console.log(`   📤 games.get('${gameId}')?.currentTrick.length = ${games.get(gameId)?.currentTrick.length}`);

  const gameToSend = games.get(gameId);
  if (gameToSend) {
    console.log(`   📤 Sending gameState with currentTrick.length = ${gameToSend.currentTrick.length}`);
    gameToSend.currentTrick.forEach((tc, idx) => {
      console.log(`      ${idx + 1}. ${tc.playerName}: ${tc.card.color} ${tc.card.value}`);
    });
  }

  // 4. I/O - Emit trick resolution event with trick still visible
  broadcastGameUpdate(gameId, 'trick_resolved', { winnerId, winnerName, points: totalPoints, gameState: gameToSend || game });

  // 5. ORCHESTRATION - Handle round completion or continue playing
  // Sprint 5 Phase 2.3: Extracted setTimeout logic to schedulePostTrickActions()
  schedulePostTrickActions(gameId, winnerName, result.isRoundOver);
}


async function endRound(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  // Phase may already be set to 'scoring' by resolveTrick (to allow player_ready during 3s delay)
  if (game.phase !== 'scoring') {
    game.phase = 'scoring';
  }

  // 1. PURE CALCULATION - Calculate round scoring
  const scoring = calculateRoundScoring(game);

  // 2. STATE TRANSFORMATION - Apply scoring to game state (updates scores, adds to history, checks game over)
  applyRoundScoring(game, scoring);

  // 3. Add round statistics to the round history entry
  const statsData = roundStats.get(gameId);
  const statistics = calculateRoundStatistics(statsData, game);
  const lastRound = game.roundHistory[game.roundHistory.length - 1];
  if (lastRound) {
    lastRound.statistics = statistics;
  }

  // Clean up stats after calculation
  roundStats.delete(gameId);

  // Log scoring results
  console.log(`Offensive Team ${scoring.offensiveTeamId} ${scoring.betMade ? 'made' : 'failed'} bet (${scoring.offensiveTeamPoints}/${scoring.betAmount}): ${scoring.offensiveScore > 0 ? '+' : ''}${scoring.offensiveScore}`);
  console.log(`Defensive Team ${scoring.defensiveTeamId}: +${scoring.defensiveScore}`);
  console.log(`Round ${game.roundNumber} Scores - Team 1: ${game.teamScores.team1}, Team 2: ${game.teamScores.team2}`);

  // Save game state incrementally after each round (conditional on persistence mode)
  try {
    const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
    const createdAt = new Date(createdAtMs);
    await PersistenceManager.saveOrUpdateGame(game, createdAt);
    await PersistenceManager.saveGameParticipants(gameId, game.players, game.persistenceMode);
    console.log(`[${game.persistenceMode.toUpperCase()}] Game ${gameId} saved after round ${game.roundNumber}`);

    // Update round-level stats for NON-BOT players (conditional on persistence mode)
    const humanPlayers = game.players.filter(p => !p.isBot);
    const stats = roundStats.get(gameId);

    for (const player of humanPlayers) {
      const playerTeamId = player.teamId;
      const roundWon = playerTeamId === scoring.offensiveTeamId && scoring.betMade;
      const wasBidder = game.highestBet?.playerId === player.id;

      await PersistenceManager.updateRoundStats(player.name, {
        roundWon,
        tricksWon: player.tricksWon,
        pointsEarned: player.pointsWon,
        wasBidder,
        betAmount: wasBidder ? scoring.betAmount : undefined,
        betMade: wasBidder ? scoring.betMade : undefined,
        withoutTrump: wasBidder ? game.highestBet?.withoutTrump : undefined,
        redZerosCollected: stats?.redZerosCollected.get(player.name) || 0,
        brownZerosReceived: stats?.brownZerosReceived.get(player.name) || 0,
        trumpsPlayed: stats?.trumpsPlayed.get(player.name) || 0,
      }, game.persistenceMode);

      console.log(`[${game.persistenceMode.toUpperCase()}] Updated round stats for ${player.name}: ${roundWon ? 'WIN' : 'LOSS'}`);
    }
  } catch (error) {
    console.error('Error saving game progress:', error);
  }

  // 4. ORCHESTRATION - Handle game over or continue to next round
  if (scoring.gameOver && scoring.winningTeam) {
    // Game over - phase already set to 'game_over' by applyRoundScoring()
    const winningTeam = scoring.winningTeam;

    try {
      // Mark game as finished in database (conditional on persistence mode)
      await PersistenceManager.markGameFinished(gameId, winningTeam, game.persistenceMode);
      console.log(`[${game.persistenceMode.toUpperCase()}] Game ${gameId} marked as finished, Team ${winningTeam} won`);

      // Update game-level stats for NON-BOT players only (conditional on persistence mode)
      const humanPlayers = game.players.filter(p => !p.isBot);
      const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
      const gameDurationMinutes = Math.floor((Date.now() - createdAtMs) / 1000 / 60);

      // Calculate ELO changes for all players (returns 0 for casual mode)
      const eloChanges = await PersistenceManager.calculateEloChangesForGame(
        game.players,
        winningTeam,
        game.persistenceMode
      );

      for (const player of humanPlayers) {
        const won = player.teamId === winningTeam;
        const eloChange = eloChanges.get(player.name) || 0;

        // Update game-level stats (ELO, win/loss, streaks)
        await PersistenceManager.updateGameStats(
          player.name,
          {
            won,
            gameRounds: game.roundNumber,
            gameDurationMinutes,
          },
          eloChange,
          game.persistenceMode
        );

        console.log(`[${game.persistenceMode.toUpperCase()}] Updated game stats for ${player.name}: ${won ? 'WIN' : 'LOSS'}, ELO ${eloChange > 0 ? '+' : ''}${eloChange}`);
      }
    } catch (error) {
      console.error('Error finalizing game:', error);
    }

    broadcastGameUpdate(gameId, 'game_over', { winningTeam, gameState: game });
  } else {
    // Initialize player ready tracking and round end timestamp
    game.playersReady = [];
    game.roundEndTimestamp = Date.now();

    // Emit round ended
    broadcastGameUpdate(gameId, 'round_ended', game);

    // Check for ready or timeout every second
    const roundSummaryInterval = setInterval(() => {
      const currentGame = games.get(gameId);
      if (!currentGame || currentGame.phase !== 'scoring') {
        clearInterval(roundSummaryInterval);
        return;
      }

      const allReady = currentGame.playersReady && currentGame.playersReady.length === 4;
      const timeoutReached = currentGame.roundEndTimestamp && (Date.now() - currentGame.roundEndTimestamp >= 60000);

      if (allReady || timeoutReached) {
        clearInterval(roundSummaryInterval);
        currentGame.roundNumber += 1;
        startNewRound(gameId);
      }
    }, 1000);
  }
}

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, async () => {
  logger.info('Trick Card Game Server started', {
    host: HOST,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    cors: corsOrigin === '*' ? 'All origins' : allowedOrigins,
  });

  // Legacy console.log for quick visibility in non-production
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
  }

  // ============= GAME STATE RECOVERY =============
  // Load and restore game snapshots on server startup
  try {
    console.log('🔄 Attempting to restore game snapshots...');
    const snapshots = await loadGameSnapshots();

    for (const snapshot of snapshots) {
      // Validate the game isn't already in memory
      if (!games.has(snapshot.id)) {
        // Restore the game state
        games.set(snapshot.id, snapshot);
        gameCreationTimes.set(snapshot.id, Date.now());
        console.log(`✅ Restored game ${snapshot.id} with ${snapshot.players.length} players`);

        // Re-establish bot timeouts if needed
        if (snapshot.phase === 'betting' || snapshot.phase === 'playing') {
          const currentPlayer = snapshot.players[snapshot.currentPlayerIndex];
          if (currentPlayer?.isBot) {
            // Give bots a moment to reconnect/play
            setTimeout(() => {
              const game = games.get(snapshot.id);
              if (game && game.phase === snapshot.phase && game.currentPlayerIndex === snapshot.currentPlayerIndex) {
                // Bot will be handled by existing bot logic
                console.log(`Bot ${currentPlayer.name} will take action when ready`);
              }
            }, 5000);
          }
        }
      }
    }

    if (snapshots.length > 0) {
      console.log(`🎮 Recovered ${snapshots.length} game(s) from previous session`);
    } else {
      console.log('💭 No games to recover');
    }
  } catch (error) {
    console.error('⚠️ Failed to restore game snapshots:', error);
  }

  // ============= PERIODIC CLEANUP =============
  // Clean up stale games every hour (ONLY when games exist to reduce DB compute usage)
  setInterval(async () => {
    // Skip cleanup if no games in memory (reduces Neon compute usage)
    if (games.size === 0) {
      return;
    }

    try {
      console.log('[Cleanup] Running stale game cleanup...');
      const staleGames = await cleanupStaleGames();

      // Remove from memory if exists
      for (const staleGame of staleGames) {
        if (games.has(staleGame.game_id)) {
          games.delete(staleGame.game_id);
          gameCreationTimes.delete(staleGame.game_id);
          console.log(`[Cleanup] Removed stale game from memory: ${staleGame.game_id}`);
        }
      }

      if (staleGames.length > 0) {
        console.log(`[Cleanup] Cleaned up ${staleGames.length} stale game(s)`);
      }
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
    }
  }, 3600000); // Run every hour

  // ============= RATE LIMITER CLEANUP =============
  // Clean up expired rate limit entries every 5 minutes
  const rateLimiterCleanupInterval = startRateLimiterCleanup();
  logger.info('Rate limiter cleanup started', {
    interval: '5 minutes',
  });

  // ============= PERIODIC STATE SNAPSHOTS =============
  // Save game snapshots every 30 seconds for recovery (ONLY when active games exist)
  setInterval(async () => {
    // Skip if no games at all (reduces Neon compute usage)
    if (games.size === 0) {
      return;
    }

    const activeGames = Array.from(games.values()).filter(game => game.phase !== 'game_over');

    if (activeGames.length > 0) {
      for (const game of activeGames) {
        try {
          await saveGameSnapshot(game.id, game);
        } catch (error) {
          console.error(`[Snapshot] Failed to save snapshot for game ${game.id}:`, error);
        }
      }

      // Only log if we're actually saving snapshots
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Snapshot] Saved ${activeGames.length} game snapshot(s)`);
      }
    }
  }, 30000); // Save every 30 seconds

  // ============= INITIAL CLEANUP =============
  // Run an initial cleanup on startup
  setTimeout(async () => {
    try {
      console.log('[Startup] Running initial cleanup...');
      const staleGames = await cleanupStaleGames();
      if (staleGames.length > 0) {
        console.log(`[Startup] Cleaned up ${staleGames.length} stale game(s) from previous sessions`);
      }
    } catch (error) {
      console.error('[Startup] Initial cleanup failed:', error);
    }
  }, 5000); // Wait 5 seconds after startup
}).on('error', (error: NodeJS.ErrnoException) => {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
});
