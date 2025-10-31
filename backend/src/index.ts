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
  saveOrUpdateGame,
  markGameFinished,
  saveGameParticipants,
  updatePlayerStats,
  updateRoundStats,
  updateGameStats,
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

// Input sanitization helpers
const sanitizePlayerName = (name: string): string => {
  // Remove leading/trailing whitespace
  let sanitized = name.trim();

  // Limit length to 20 characters
  sanitized = sanitized.substring(0, 20);

  // Remove any HTML tags or script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any potential XSS characters
  sanitized = sanitized.replace(/[<>'"]/g, '');

  // Ensure name is not empty after sanitization
  if (!sanitized) {
    sanitized = 'Player';
  }

  return sanitized;
};

const sanitizeChatMessage = (message: string): string => {
  // Remove leading/trailing whitespace
  let sanitized = message.trim();

  // Limit length to 200 characters
  sanitized = sanitized.substring(0, 200);

  // Remove any HTML tags or script tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any potential XSS characters but allow some punctuation
  sanitized = sanitized.replace(/[<>]/g, '');

  return sanitized;
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

// Online players tracking
interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

const onlinePlayers = new Map<string, OnlinePlayer>();

// Previous game states for delta generation (gameId -> previous GameState)
// Enables sending only changed data instead of full state (80-90% bandwidth reduction)
const previousGameStates = new Map<string, GameState>();

// Round statistics tracking
interface RoundStatsData {
  cardPlayTimes: Map<string, number[]>; // playerId -> array of play times in ms
  trumpsPlayed: Map<string, number>; // playerId -> count of trump cards played
  redZerosCollected: Map<string, number>; // playerId -> count of red 0 cards collected
  brownZerosReceived: Map<string, number>; // playerId -> count of brown 0 cards received
  trickStartTime: number; // timestamp when trick started
}

interface RoundStatistics {
  fastestPlay?: {
    playerId: string;
    playerName: string;
    timeMs: number;
  };
  mostAggressiveBidder?: {
    playerId: string;
    playerName: string;
    bidAmount: number;
  };
  trumpMaster?: {
    playerId: string;
    playerName: string;
    trumpsPlayed: number;
  };
  luckyPlayer?: {
    playerId: string;
    playerName: string;
    reason: string;
  };
}

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

/**
 * Helper to emit game_updated event with delta optimization AND persist to database
 * Use this instead of direct io.to().emit() calls for consistency
 *
 * Sprint 2 Enhancement: Sends delta updates (only changed fields) instead of full state
 * to reduce WebSocket payload size by 80-90%
 *
 * Debounces database saves to prevent race conditions when multiple rapid updates occur
 * (e.g., when multiple bots reconnect simultaneously)
 *
 * @param gameId - Game room ID
 * @param gameState - Current game state
 * @param forceFull - Force sending full state (e.g., player just joined, phase change)
 */
function emitGameUpdate(gameId: string, gameState: GameState, forceFull: boolean = false) {
  const previousState = previousGameStates.get(gameId);

  // Send full state if forced, no previous state, or phase changed
  const shouldSendFull = forceFull || !previousState || previousState.phase !== gameState.phase;

  if (shouldSendFull) {
    // Send full game state
    io.to(gameId).emit('game_updated', gameState);

    if (process.env.NODE_ENV === 'development') {
      const fullSize = JSON.stringify(gameState).length;
      logger.debug('Sent full game state', {
        gameId,
        phase: gameState.phase,
        sizeBytes: fullSize,
      });
    }
  } else {
    // Generate and send delta update
    const delta = generateStateDelta(previousState, gameState);

    if (isSignificantChange(delta)) {
      io.to(gameId).emit('game_updated_delta', delta);

      if (process.env.NODE_ENV === 'development') {
        const { deltaSize, estimatedFullSize, reduction } = calculateDeltaSize(delta);
        logger.debug('Sent delta game state', {
          gameId,
          phase: gameState.phase,
          deltaSize,
          estimatedFullSize,
          reduction,
        });
      }
    }
  }

  // Store current state as previous for next delta
  previousGameStates.set(gameId, JSON.parse(JSON.stringify(gameState))); // Deep clone

  // Clear any pending save for this game
  const existingSaveTimeout = gameSaveTimeouts.get(gameId);
  if (existingSaveTimeout) {
    clearTimeout(existingSaveTimeout);
  }

  // Debounce database save (wait 100ms for any additional updates)
  const saveTimeout = setTimeout(() => {
    saveGame(gameState).catch(err => {
      console.error(`Failed to persist game ${gameId}:`, err);
    });
    gameSaveTimeouts.delete(gameId);
  }, 100);

  gameSaveTimeouts.set(gameId, saveTimeout);
}

// Helper to generate secure random token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Helper to find player by socket ID or name (stable across reconnections)
 * Prefers socket ID for speed, falls back to name if ID not found
 */
function findPlayer(game: GameState, socketId: string, playerName?: string): Player | undefined {
  // First try by socket ID (fast path)
  let player = game.players.find(p => p.id === socketId);

  // If not found and we have a name, try by name (reconnection case)
  if (!player && playerName) {
    player = game.players.find(p => p.name === playerName);
  }

  return player;
}

/**
 * Helper to get the next available bot name (Bot 1, Bot 2, Bot 3)
 */
function getNextBotName(game: GameState): string {
  const existingBotNumbers = game.players
    .filter(p => p.name.startsWith('Bot '))
    .map(p => parseInt(p.name.split(' ')[1]))
    .filter(n => !isNaN(n));

  for (let i = 1; i <= 3; i++) {
    if (!existingBotNumbers.includes(i)) {
      return `Bot ${i}`;
    }
  }

  // Fallback (should never happen with validation)
  return `Bot ${Date.now() % 1000}`;
}

/**
 * Helper to check if game can add another bot (max 3 bots)
 */
function canAddBot(game: GameState): boolean {
  const botCount = game.players.filter(p => p.isBot).length;
  return botCount < 3;
}

/**
 * Helper to check if two players are teammates
 */
function areTeammates(game: GameState, player1Name: string, player2Name: string): boolean {
  const p1 = game.players.find(p => p.name === player1Name);
  const p2 = game.players.find(p => p.name === player2Name);

  if (!p1 || !p2) return false;

  return p1.teamId === p2.teamId;
}

/**
 * Helper to ensure at least 1 human player remains
 */
function hasAtLeastOneHuman(game: GameState): boolean {
  const humanCount = game.players.filter(p => !p.isBot).length;
  return humanCount >= 1;
}

/**
 * Helper to find player index by socket ID or name
 */
function findPlayerIndex(game: GameState, socketId: string, playerName?: string): number {
  // First try by socket ID
  let index = game.players.findIndex(p => p.id === socketId);

  // If not found and we have a name, try by name
  if (index === -1 && playerName) {
    index = game.players.findIndex(p => p.name === playerName);
  }

  return index;
}

// Helper to create and store player session
function createPlayerSession(gameId: string, playerId: string, playerName: string): PlayerSession {
  const token = generateSessionToken();
  const session: PlayerSession = {
    gameId,
    playerId,
    playerName,
    token,
    timestamp: Date.now(),
  };
  playerSessions.set(token, session);
  return session;
}

// Helper to validate session token
function validateSessionToken(token: string): PlayerSession | null {
  const session = playerSessions.get(token);
  if (!session) return null;

  // Check if session is expired (15 minutes = 900000ms for mobile AFK)
  const SESSION_TIMEOUT = 900000;
  if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
    playerSessions.delete(token);
    return null;
  }

  return session;
}

// Helper to update online player status
function updateOnlinePlayer(socketId: string, playerName: string, status: 'in_lobby' | 'in_game' | 'in_team_selection', gameId?: string) {
  onlinePlayers.set(socketId, {
    socketId,
    playerName,
    status,
    gameId,
    lastActivity: Date.now()
  });
}

// Helper to broadcast online players list
function broadcastOnlinePlayers() {
  const now = Date.now();
  const ACTIVITY_THRESHOLD = 30000; // 30 seconds

  // Filter active players (active in last 30 seconds)
  const activePlayers = Array.from(onlinePlayers.values())
    .filter(p => now - p.lastActivity < ACTIVITY_THRESHOLD);

  // Broadcast to all connected clients
  io.emit('online_players_update', activePlayers);
}

// Broadcast online players every 5 seconds
let onlinePlayersInterval: NodeJS.Timeout;

const startOnlinePlayersInterval = () => {
  onlinePlayersInterval = setInterval(broadcastOnlinePlayers, 5000);
};

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
startOnlinePlayersInterval();

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

// Helper to broadcast to both players and spectators
function broadcastGameUpdate(gameId: string, event: string, data: GameState | { winnerId: string; winnerName: string; points: number; gameState: GameState } | { winningTeam: 1 | 2; gameState: GameState }) {
  // Send full data to players
  io.to(gameId).emit(event, data);

  // Send spectator-safe data to spectators (hide player hands)
  if (data && 'players' in data) {
    const spectatorData = {
      ...data,
      players: data.players.map((player: Player) => ({
        id: player.id,
        name: player.name,
        teamId: player.teamId,
        hand: [], // Hide hands from spectators
        tricksWon: player.tricksWon,
        pointsWon: player.pointsWon,
      }))
    };
    io.to(`${gameId}-spectators`).emit(event, spectatorData);
  } else {
    io.to(`${gameId}-spectators`).emit(event, data);
  }
}

// Helper functions for health endpoints
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
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
  roundStats.set(gameId, {
    cardPlayTimes: new Map(),
    trumpsPlayed: new Map(),
    redZerosCollected: new Map(),
    brownZerosReceived: new Map(),
    trickStartTime: Date.now(),
  });
  game.players.forEach(player => {
    const stats = roundStats.get(gameId);
    if (stats) {
      stats.cardPlayTimes.set(player.name, []);
      stats.trumpsPlayed.set(player.name, 0);
      stats.redZerosCollected.set(player.name, 0);
      stats.brownZerosReceived.set(player.name, 0);
    }
  });

  broadcastGameUpdate(gameId, 'round_started', game);

  // Start timeout for first player's bet
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer) {
    startPlayerTimeout(gameId, currentPlayer.id, 'betting');
  }
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
  const stats = roundStats.get(gameId);
  if (stats) {
    // Check if trick contains red 0 (worth +5 points)
    if (hasRedZero(game.currentTrick)) {
      const redZeroCount = stats.redZerosCollected.get(winnerName) || 0;
      stats.redZerosCollected.set(winnerName, redZeroCount + 1);
    }

    // Check if trick contains brown 0 (worth -2 points)
    if (hasBrownZero(game.currentTrick)) {
      const brownZeroCount = stats.brownZerosReceived.get(winnerName) || 0;
      stats.brownZerosReceived.set(winnerName, brownZeroCount + 1);
    }
  }

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
  if (result.isRoundOver) {
    // Wait 2 seconds before finalizing round (show completed trick)
    setTimeout(() => {
      const g = games.get(gameId);
      if (g) {
        g.currentTrick = []; // Clear trick after delay
      }
      endRound(gameId);
    }, 2000);
  } else {
    // Normal trick resolution - continue playing
    setTimeout(() => {
      const g = games.get(gameId);
      if (g) {
        g.currentTrick = []; // Clear trick after delay
        emitGameUpdate(gameId, g);
        // Start timeout for trick winner's next card (use stable playerName)
        startPlayerTimeout(gameId, winnerName, 'playing');
      }
    }, 2000);
  }
}

function calculateRoundStatistics(gameId: string, game: GameState): RoundStatistics | undefined {
  const stats = roundStats.get(gameId);
  if (!stats) return undefined;

  const statistics: RoundStatistics = {};

  // 1. Fastest Play - player with fastest average card play time
  const fastestResult = getFastestPlayer(stats.cardPlayTimes);
  if (fastestResult) {
    const player = game.players.find(p => p.name === fastestResult.playerName);
    if (player) {
      statistics.fastestPlay = {
        playerId: player.id,
        playerName: player.name,
        timeMs: Math.round(fastestResult.avgTime),
      };
    }
  }

  // 2. Most Aggressive Bidder - highest bet amount
  if (game.highestBet) {
    const player = game.players.find(p => p.id === game.highestBet?.playerId);
    if (player) {
      statistics.mostAggressiveBidder = {
        playerId: player.id,
        playerName: player.name,
        bidAmount: game.highestBet.amount,
      };
    }
  }

  // 3. Trump Master - player who played most trump cards
  const trumpMasterResult = getTrumpMaster(stats.trumpsPlayed);
  if (trumpMasterResult) {
    const player = game.players.find(p => p.name === trumpMasterResult.playerName);
    if (player) {
      statistics.trumpMaster = {
        playerId: player.id,
        playerName: player.name,
        trumpsPlayed: trumpMasterResult.count,
      };
    }
  }

  // 4. Lucky Player - player who won most points with fewest tricks
  const luckyResult = getLuckiestPlayer(game.players);
  if (luckyResult) {
    statistics.luckyPlayer = {
      playerId: luckyResult.player.id,
      playerName: luckyResult.player.name,
      reason: `${luckyResult.pointsPerTrick.toFixed(1)} pts/trick`,
    };
  }

  // Clean up stats for this game
  roundStats.delete(gameId);

  return Object.keys(statistics).length > 0 ? statistics : undefined;
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
  const statistics = calculateRoundStatistics(gameId, game);
  const lastRound = game.roundHistory[game.roundHistory.length - 1];
  if (lastRound) {
    lastRound.statistics = statistics;
  }

  // Log scoring results
  console.log(`Offensive Team ${scoring.offensiveTeamId} ${scoring.betMade ? 'made' : 'failed'} bet (${scoring.offensiveTeamPoints}/${scoring.betAmount}): ${scoring.offensiveScore > 0 ? '+' : ''}${scoring.offensiveScore}`);
  console.log(`Defensive Team ${scoring.defensiveTeamId}: +${scoring.defensiveScore}`);
  console.log(`Round ${game.roundNumber} Scores - Team 1: ${game.teamScores.team1}, Team 2: ${game.teamScores.team2}`);

  // Save game state incrementally after each round
  try {
    const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
    const createdAt = new Date(createdAtMs);
    await saveOrUpdateGame(game, createdAt);
    await saveGameParticipants(gameId, game.players);
    console.log(`Game ${gameId} saved after round ${game.roundNumber}`);

    // Update round-level stats for NON-BOT players
    const humanPlayers = game.players.filter(p => !p.isBot);
    const stats = roundStats.get(gameId);

    for (const player of humanPlayers) {
      const playerTeamId = player.teamId;
      const roundWon = playerTeamId === scoring.offensiveTeamId && scoring.betMade;
      const wasBidder = game.highestBet?.playerId === player.id;

      await updateRoundStats(player.name, {
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
      });

      console.log(`Updated round stats for ${player.name}: ${roundWon ? 'WIN' : 'LOSS'}`);
    }
  } catch (error) {
    console.error('Error saving game progress:', error);
  }

  // 4. ORCHESTRATION - Handle game over or continue to next round
  if (scoring.gameOver && scoring.winningTeam) {
    // Game over - phase already set to 'game_over' by applyRoundScoring()
    const winningTeam = scoring.winningTeam;

    try {
      // Mark game as finished in database
      await markGameFinished(gameId, winningTeam);
      console.log(`Game ${gameId} marked as finished, Team ${winningTeam} won`);

      // Update game-level stats for NON-BOT players only
      const humanPlayers = game.players.filter(p => !p.isBot);
      const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
      const gameDurationMinutes = Math.floor((Date.now() - createdAtMs) / 1000 / 60);

      for (const player of humanPlayers) {
        const won = player.teamId === winningTeam;

        // Get current player stats to calculate ELO
        let currentStats = await getPlayerStats(player.name);
        const currentElo = currentStats?.elo_rating || 1200;

        // Calculate opponent average ELO (opposing team's average)
        const opposingTeam = humanPlayers.filter(p => p.teamId !== player.teamId);
        const opponentElos = await Promise.all(
          opposingTeam.map(async (opp) => {
            const stats = await getPlayerStats(opp.name);
            return stats?.elo_rating || 1200;
          })
        );
        const avgOpponentElo = opponentElos.length > 0
          ? opponentElos.reduce((sum, elo) => sum + elo, 0) / opponentElos.length
          : 1200;

        // Calculate ELO change
        const eloChange = calculateEloChange(currentElo, avgOpponentElo, won);

        // Update game-level stats (ELO, win/loss, streaks)
        await updateGameStats(
          player.name,
          {
            won,
            gameRounds: game.roundNumber,
            gameDurationMinutes,
          },
          eloChange
        );

        console.log(`Updated game stats for ${player.name}: ${won ? 'WIN' : 'LOSS'}, ELO ${eloChange > 0 ? '+' : ''}${eloChange}`);
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
