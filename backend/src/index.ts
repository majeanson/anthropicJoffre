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

// Configure CORS for Express
app.use(cors({
  origin: corsOrigin,
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

// REST endpoints
app.get('/api/health', (req, res) => {
  const poolStats = getPoolStats();
  const cacheStats = queryCache.getStats();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      configured: process.env.DATABASE_URL ? true : false,
      pool: {
        total: poolStats.totalCount,
        idle: poolStats.idleCount,
        waiting: poolStats.waitingCount,
      },
    },
    cache: {
      size: cacheStats.size,
      keys: cacheStats.keys.length,
    },
    cors: corsOrigin,
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
    },
  });
});

// Detailed health check endpoint
app.get('/api/health/detailed', (req, res) => {
  try {
    const poolStats = getPoolStats();
    const cacheStats = queryCache.getStats();
    const memUsage = process.memoryUsage();
    const errorMetrics = getAllMetrics();

    // Calculate error rates
    let totalHandlerCalls = 0;
    let totalHandlerErrors = 0;
    errorMetrics.forEach((value) => {
      totalHandlerCalls += value.totalCalls;
      totalHandlerErrors += value.totalErrors;
    });

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime()),
      },
      environment: process.env.NODE_ENV || 'development',

      // Database health
      database: {
        configured: !!process.env.DATABASE_URL,
        pool: {
          total: poolStats.totalCount,
          idle: poolStats.idleCount,
          waiting: poolStats.waitingCount,
          utilization: poolStats.totalCount > 0
            ? `${Math.round(((poolStats.totalCount - poolStats.idleCount) / poolStats.totalCount) * 100)}%`
            : '0%',
        },
      },

      // Cache health
      cache: {
        enabled: true,
        size: cacheStats.size,
        keys: cacheStats.keys.length,
        sampleKeys: cacheStats.keys.slice(0, 5), // First 5 cache keys
      },

      // Memory health
      memory: {
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss: formatBytes(memUsage.rss),
        external: formatBytes(memUsage.external),
        heapUtilization: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
      },

      // Game state health
      game: {
        activeGames: games.size,
        connectedSockets: io.sockets.sockets.size,
        onlinePlayers: onlinePlayers.size,
        activeBotTimeouts: activeBotTimeouts.size,
        activePlayerTimeouts: activeTimeouts.size,
      },

      // Error handling health
      errorHandling: {
        totalHandlers: errorMetrics.size,
        totalCalls: totalHandlerCalls,
        totalErrors: totalHandlerErrors,
        errorRate: totalHandlerCalls > 0
          ? `${((totalHandlerErrors / totalHandlerCalls) * 100).toFixed(2)}%`
          : '0%',
        successRate: totalHandlerCalls > 0
          ? `${(((totalHandlerCalls - totalHandlerErrors) / totalHandlerCalls) * 100).toFixed(2)}%`
          : '100%',
      },

      // CORS configuration
      cors: {
        origin: corsOrigin === '*' ? 'All origins (development)' : allowedOrigins,
      },

      // WebSocket configuration
      websocket: {
        compressionEnabled: true,
        compressionThreshold: '1KB',
        compressionLevel: 3,
      },

      // Performance monitoring
      performance: {
        responseTime: {
          totalEndpoints: responseTimeTracker.getSummary().totalEndpoints,
          totalRequests: responseTimeTracker.getSummary().totalRequests,
          avgResponseTime: Math.round(responseTimeTracker.getSummary().avgResponseTime * 100) / 100 + 'ms',
          slowEndpoints: responseTimeTracker.getSummary().slowEndpoints.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error generating detailed health check', { error });
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate health check',
      timestamp: new Date().toISOString(),
    });
  }
});

// Error boundary metrics endpoint
app.get('/api/metrics/error-boundaries', (req, res) => {
  try {
    const metrics = getAllMetrics();
    const formattedMetrics: Record<string, any> = {};

    metrics.forEach((value, key) => {
      formattedMetrics[key] = {
        totalCalls: value.totalCalls,
        totalErrors: value.totalErrors,
        totalSuccess: value.totalSuccess,
        errorRate: value.totalCalls > 0 ? (value.totalErrors / value.totalCalls * 100).toFixed(2) + '%' : '0%',
        successRate: value.totalCalls > 0 ? (value.totalSuccess / value.totalCalls * 100).toFixed(2) + '%' : '0%',
        averageExecutionTime: value.averageExecutionTime.toFixed(2) + 'ms',
        lastError: value.lastError?.toISOString() || null,
        errorsByType: Object.fromEntries(value.errorsByType),
      };
    });

    res.json({
      timestamp: new Date().toISOString(),
      totalHandlers: metrics.size,
      handlers: formattedMetrics,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Response time metrics endpoint
app.get('/api/metrics/response-times', (req, res) => {
  try {
    const summary = responseTimeTracker.getSummary();
    const allMetrics = responseTimeTracker.getAllMetrics();

    // Format metrics with rounded values for readability
    const formattedMetrics = allMetrics.map(metric => ({
      name: metric.name,
      count: metric.count,
      min: Math.round(metric.min * 100) / 100,
      max: Math.round(metric.max * 100) / 100,
      avg: Math.round(metric.avg * 100) / 100,
      p50: Math.round(metric.p50 * 100) / 100,
      p95: Math.round(metric.p95 * 100) / 100,
      p99: Math.round(metric.p99 * 100) / 100,
    }));

    // Add alerting information
    const slowEndpoints = formattedMetrics.filter(m => m.p95 > 100);
    const verySlowEndpoints = formattedMetrics.filter(m => m.p95 > 200);

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        totalEndpoints: summary.totalEndpoints,
        totalRequests: summary.totalRequests,
        avgResponseTime: Math.round(summary.avgResponseTime * 100) / 100,
      },
      alerts: {
        slowEndpoints: slowEndpoints.length,
        verySlowEndpoints: verySlowEndpoints.length,
      },
      metrics: formattedMetrics,
      // Separate sections for quick reference
      performance: {
        fastest: formattedMetrics.slice(-5).reverse(), // Top 5 fastest
        slowest: formattedMetrics.slice(0, 5), // Top 5 slowest
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve response time metrics' });
  }
});

// Test-only endpoint to manipulate game state
// POST /api/__test/set-game-state
// Body: { gameId: string, teamScores?: { team1: number, team2: number }, phase?: string }
app.post('/api/__test/set-game-state', express.json(), (req, res) => {
  try {
    const { gameId, teamScores, phase } = req.body;

    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ error: `Game ${gameId} not found` });
    }

    console.log(`TEST API: Manipulating game state for ${gameId}`);

    // Set team scores if provided
    if (teamScores) {
      if (typeof teamScores.team1 === 'number') {
        game.teamScores.team1 = teamScores.team1;
      }
      if (typeof teamScores.team2 === 'number') {
        game.teamScores.team2 = teamScores.team2;
      }
      console.log(`TEST API: Set scores to Team1=${game.teamScores.team1}, Team2=${game.teamScores.team2}`);

      // Check if game should be over (team >= 41)
      if (game.teamScores.team1 >= 41 || game.teamScores.team2 >= 41) {
        game.phase = 'game_over';
        const winningTeam = game.teamScores.team1 >= 41 ? 1 : 2;
        console.log(`TEST API: Game over triggered, Team ${winningTeam} wins`);

        // Save stats for all human players (same logic as endRound)
        (async () => {
          try {
            await markGameFinished(gameId, winningTeam);
            console.log(`TEST API: Game ${gameId} marked as finished, Team ${winningTeam} won`);

            const humanPlayers = game.players.filter(p => !p.isBot);
            const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
            const gameDurationMinutes = Math.floor((Date.now() - createdAtMs) / 1000 / 60);

            for (const player of humanPlayers) {
              const won = player.teamId === winningTeam;
              let currentStats = await getPlayerStats(player.name);
              const currentElo = currentStats?.elo_rating || 1200;

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

              const eloChange = calculateEloChange(currentElo, avgOpponentElo, won);
              await updateGameStats(
                player.name,
                {
                  won,
                  gameRounds: game.roundNumber,
                  gameDurationMinutes,
                },
                eloChange
              );

              console.log(`TEST API: Updated game stats for ${player.name}: ${won ? 'WIN' : 'LOSS'}, ELO ${eloChange > 0 ? '+' : ''}${eloChange}`);
            }
          } catch (error) {
            console.error('TEST API: Error finalizing game:', error);
          }
        })();

        // Emit game_over event
        io.to(game.id).emit('game_over', {
          winningTeam,
          gameState: game
        });
      }
    }

    // Set phase if provided (and not already set to game_over by score logic)
    if (phase && game.phase !== 'game_over') {
      // Validate phase value
      const validPhases: GamePhase[] = ['team_selection', 'betting', 'playing', 'scoring', 'game_over'];
      if (validPhases.includes(phase as GamePhase)) {
        game.phase = phase as GamePhase;
        console.log(`TEST API: Set phase to ${phase}`);
      } else {
        console.error(`TEST API: Invalid phase '${phase}' - must be one of: ${validPhases.join(', ')}`);
      }
    }

    // Emit game update
    emitGameUpdate(game.id, game);

    res.json({
      success: true,
      gameId: game.id,
      phase: game.phase,
      teamScores: game.teamScores
    });
  } catch (error) {
    console.error('TEST API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Trick Card Game API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      history: '/api/games/history',
      lobby: '/api/games/lobby',
      socket: '/socket.io'
    }
  });
});

// Get list of active games for lobby browser
app.get('/api/games/lobby', async (req, res) => {
  try {
    // Load games from DB if not in memory (in case server restarted)
    const dbGames = await listActiveGames({ isPublic: true, limit: 100 });

    // Merge with in-memory games
    const gameMap = new Map<string, any>();

    // Add in-memory games first
    Array.from(games.values()).forEach(game => {
      gameMap.set(game.id, game);
    });

    // Add DB games that aren't in memory
    for (const dbGame of dbGames) {
      if (!gameMap.has(dbGame.gameId)) {
        try {
          // Load full game state from DB
          const fullGame = await loadGameFromDB(dbGame.gameId);

          // Validate the loaded game has required properties
          if (fullGame && fullGame.id && fullGame.players && Array.isArray(fullGame.players)) {
            // Only add to map if game is in team_selection phase (joinable)
            if (fullGame.phase === 'team_selection') {
              gameMap.set(fullGame.id, fullGame);
            } else {
              console.log('[Lobby] Skipping non-joinable DB game:', fullGame.id, 'phase:', fullGame.phase);
            }
          } else {
            console.warn('[Lobby] Invalid game loaded from DB:', dbGame.gameId);
          }
        } catch (error) {
          console.error('[Lobby] Failed to load game from DB:', dbGame.gameId, error);
        }
      }
    }

    const activeGames = Array.from(gameMap.values())
      .filter((game: GameState) => {
        // Pre-filter: Only include games with valid structure
        if (!game || !game.id || !game.players || !Array.isArray(game.players)) {
          console.warn('[Lobby] Filtering out invalid game:', game?.id);
          return false;
        }
        return true;
      })
      .map((game: GameState) => {
        // Get actual player count (not including bots unless specified)
        const humanPlayerCount = game.players.filter((p: Player) => !p.isBot).length;
        const botPlayerCount = game.players.filter((p: Player) => p.isBot).length;

        // Check if game is joinable (can join if not full, or if there are bots to replace)
        const isJoinable = game.phase === 'team_selection' && (game.players.length < 4 || botPlayerCount > 0);

        // Check if game is in progress
        const isInProgress = game.phase === 'betting' || game.phase === 'playing' || game.phase === 'scoring';

        return {
          gameId: game.id,
          phase: game.phase,
          playerCount: game.players.length,
          humanPlayerCount,
          botPlayerCount,
          isJoinable,
          isInProgress,
          teamScores: game.teamScores,
          roundNumber: game.roundNumber,
          createdAt: gameCreationTimes.get(game.id) || Date.now(),
          players: game.players.map((p: Player) => ({
            name: p.name,
            teamId: p.teamId,
            isBot: p.isBot || false,
          })),
        };
      })
      // Only show joinable games in the active games list
      .filter(game => game.isJoinable);

    // Sort by creation time (newest first)
    activeGames.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      games: activeGames,
      total: activeGames.length,
      joinable: activeGames.filter(g => g.isJoinable).length,
      inProgress: activeGames.filter(g => g.isInProgress).length,
    });
  } catch (error) {
    console.error('Error fetching lobby games:', error);
    res.status(500).json({ error: 'Failed to fetch lobby games' });
  }
});

// Get list of recent finished games for replay browser
app.get('/api/games/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const games = await getAllFinishedGames(limit, offset);
    res.json({ games });
  } catch (error) {
    console.error('Error fetching recent games:', error);
    res.status(500).json({ error: 'Failed to fetch recent games' });
  }
});

app.get('/api/games/history', async (req, res) => {
  try {
    const history = await getRecentGames(10);
    res.json(history);
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

// Get specific game by ID
app.get('/api/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await getGame(gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Return game with metadata
    res.json({
      gameId: game.id,
      phase: game.phase,
      playerCount: game.players.length,
      players: game.players.map(p => ({
        name: p.name,
        teamId: p.teamId,
        isBot: p.isBot || false,
      })),
      teamScores: game.teamScores,
      roundNumber: game.roundNumber,
      isJoinable: game.phase === 'team_selection' && game.players.length < 4,
      createdAt: gameCreationTimes.get(game.id) || Date.now(),
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get games for a specific player
app.get('/api/players/:playerName/games', async (req, res) => {
  try {
    const { playerName } = req.params;

    // Get games from database
    const dbGames = await getPlayerGames(playerName);

    // Also check in-memory games
    const inMemoryGames = Array.from(games.values())
      .filter((game: GameState) => game.players.some((p: Player) => p.name === playerName))
      .map((game: GameState) => ({
        gameId: game.id,
        phase: game.phase,
        status: game.phase === 'game_over' ? 'finished' :
                game.phase === 'team_selection' ? 'waiting' : 'in_progress',
        playerCount: game.players.length,
        playerNames: game.players.map(p => p.name),
        teamAssignments: game.players.reduce((acc, p) => {
          acc[p.name] = p.teamId;
          return acc;
        }, {} as Record<string, number>),
        createdAt: gameCreationTimes.get(game.id) || Date.now(),
      }));

    // Merge results (prefer in-memory)
    interface PlayerGameSummary {
      gameId: string;
      playerNames: string[];
      teamIds: (number | null)[];
      createdAt: number;
      isFinished: boolean;
      team1Score?: number;
      team2Score?: number;
    }
    const gameMap = new Map<string, PlayerGameSummary>();
    dbGames.forEach((g) => gameMap.set(g.gameId, g));
    inMemoryGames.forEach((g) => gameMap.set(g.gameId, g));

    const playerGames = Array.from(gameMap.values())
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      playerName,
      games: playerGames,
      total: playerGames.length,
    });
  } catch (error) {
    console.error('Error fetching player games:', error);
    res.status(500).json({ error: 'Failed to fetch player games' });
  }
});

// Get online players
app.get('/api/players/online', async (req, res) => {
  try {
    const onlinePlayers = await getOnlinePlayers();
    res.json({
      players: onlinePlayers,
      total: onlinePlayers.length,
    });
  } catch (error) {
    console.error('Error fetching online players:', error);
    res.status(500).json({ error: 'Failed to fetch online players' });
  }
});

// Get player statistics
app.get('/api/stats/:playerName', async (req, res) => {
  try {
    const { playerName } = req.params;
    const stats = await getPlayerStats(playerName);

    if (!stats) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get global leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const excludeBots = req.query.excludeBots !== 'false'; // Default to true

    const leaderboard = await getLeaderboard(limit, excludeBots);
    res.json({
      players: leaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Register connection with ConnectionManager
  connectionManager.registerConnection(socket);

  socket.on('create_game', errorBoundaries.gameAction('create_game')(async (playerName: string) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(createGamePayloadSchema, { playerName });
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid create_game payload', { playerName, error: validation.error });
      return;
    }

    const { playerName: validatedPlayerName } = validation.data;

    // Apply game creation rate limiting
    // Access remote address via socket.handshake (standard Socket.IO API)
    const clientIp = socket.handshake.address;

    // Player name is already validated and sanitized by Zod schema
    const sanitizedName = validatedPlayerName;

    const gameId = Math.random().toString(36).substring(7).toUpperCase();
    const player: Player = {
      id: socket.id,
      name: sanitizedName,
      teamId: 1,
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      isBot: false, // Game creator is always human
    };

    const gameState: GameState = {
      id: gameId,
      creatorId: socket.id, // Track who created the game
      phase: 'team_selection',
      players: [player],
      currentBets: [],
      highestBet: null,
      trump: null,
      currentTrick: [],
      previousTrick: null,
      currentPlayerIndex: 0,
      dealerIndex: 0, // First player is the initial dealer
      teamScores: { team1: 0, team2: 0 },
      roundNumber: 1,
      roundHistory: [],
      currentRoundTricks: [],
    };

    // Persist game to database (with fallback to cache-only)
    await saveGame(gameState);
    gameCreationTimes.set(gameId, Date.now()); // Store actual creation timestamp
    socket.join(gameId);

    // Create session for reconnection (using DB-backed sessions)
    let session: PlayerSession;
    try {
      session = await createDBSession(playerName, socket.id, gameId);
    } catch (error) {
      console.error('Failed to create DB session, falling back to in-memory:', error);
      session = createPlayerSession(gameId, socket.id, playerName);
    }

    // Track online player status
    updateOnlinePlayer(socket.id, playerName, 'in_team_selection', gameId);

    // Update player presence in database
    try {
      await updatePlayerPresence(playerName, 'online', socket.id, gameId);
    } catch (error) {
      console.error('Failed to update player presence:', error);
    }

    socket.emit('game_created', { gameId, gameState, session });

    // Associate player with connection manager
    const creator = gameState.players.find(p => p.name === sanitizedName);
    if (creator) {
      connectionManager.associatePlayer(socket.id, sanitizedName, creator.id, gameId, false);
    }
  }));

  socket.on('join_game', errorBoundaries.gameAction('join_game')(async (payload: { gameId: string; playerName: string; isBot?: boolean }) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(joinGamePayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid join_game payload', { payload, error: validation.error });
      return;
    }

    const { gameId, playerName: validatedPlayerName, isBot } = validation.data;

    // Player name is already validated and sanitized by Zod schema
    const sanitizedName = validatedPlayerName;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Check if player is trying to rejoin with same name
    const existingPlayer = game.players.find(p => p.name === sanitizedName);
    if (existingPlayer) {
      console.log(`Player ${sanitizedName} attempting to rejoin game ${gameId} (isBot: ${existingPlayer.isBot})`);

      // Allow rejoin - update socket ID
      const oldSocketId = existingPlayer.id;
      existingPlayer.id = socket.id;

      // IMPORTANT: Update player ID in currentTrick to fix card display after reconnection
      game.currentTrick.forEach(tc => {
        if (tc.playerId === oldSocketId) {
          tc.playerId = socket.id;
        }
      });

      // Join game room
      socket.join(gameId);

      // Create new session for human players only (DB-backed)
      let session: PlayerSession | undefined;
      if (!existingPlayer.isBot) {
        try {
          session = await createDBSession(playerName, socket.id, gameId);
        } catch (error) {
          console.error('Failed to create DB session for rejoin, falling back to in-memory:', error);
          session = createPlayerSession(gameId, socket.id, playerName);
        }
      }

      // Update timeout if this player had an active timeout
      const oldTimeoutKey = `${gameId}-${oldSocketId}`;
      const existingTimeout = activeTimeouts.get(oldTimeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        activeTimeouts.delete(oldTimeoutKey);
        console.log(`Cleared old timeout for ${oldSocketId}, restarting for ${socket.id}`);

        // Restart timeout with new socket ID if it's their turn
        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer && currentPlayer.id === socket.id) {
          const phase = game.phase === 'betting' ? 'betting' : 'playing';
          startPlayerTimeout(gameId, socket.id, phase as 'betting' | 'playing');
        }
      }

      // Track online player status (only for human players)
      if (!existingPlayer.isBot) {
        updateOnlinePlayer(socket.id, playerName, 'in_game', gameId);
      }

      // Emit appropriate response
      if (existingPlayer.isBot) {
        // For bots, emit player_joined (they don't need sessions)
        socket.emit('player_joined', { player: existingPlayer, gameState: game });

        // Broadcast game_updated to all players so bot knows to act if it's their turn
        emitGameUpdate(gameId, game);
      } else {
        // For humans, emit reconnection_successful
        socket.emit('reconnection_successful', { gameState: game, session });

        // Notify other players
        socket.to(gameId).emit('player_reconnected', {
          playerName,
          playerId: socket.id,
          oldSocketId
        });

        // Broadcast game_updated to ensure all clients are synced
        emitGameUpdate(gameId, game);
      }

      console.log(`Player ${playerName} successfully rejoined game ${gameId}`);
      return;
    }

    if (game.players.length >= 4) {
      // Check if there are bots that can be replaced
      const availableBots = game.players.filter(p => p.isBot);
      if (availableBots.length > 0) {
        // Game is full but has bots - offer takeover option
        socket.emit('game_full_with_bots', {
          gameId,
          availableBots: availableBots.map(bot => ({
            name: bot.name,
            teamId: bot.teamId,
            difficulty: bot.botDifficulty || 'hard'
          }))
        });
        return;
      }
      // Game is full with no bots - cannot join
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    const teamId = game.players.length % 2 === 0 ? 1 : 2;
    const player: Player = {
      id: socket.id,
      name: sanitizedName,
      teamId: teamId as 1 | 2,
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      isBot: isBot || false,
      connectionStatus: 'connected',
    };

    game.players.push(player);
    socket.join(gameId);

    // Cancel any pending disconnect timeout for this socket
    const disconnectTimeout = disconnectTimeouts.get(socket.id);
    if (disconnectTimeout) {
      clearTimeout(disconnectTimeout);
      disconnectTimeouts.delete(socket.id);
      console.log(`Cancelled disconnect timeout for rejoining player ${socket.id}`);
    }

    // Create session for reconnection (only for human players, not bots) - DB-backed
    let session: PlayerSession | undefined;
    if (!isBot) {
      try {
        session = await createDBSession(playerName, socket.id, gameId);
        console.log('Created DB session for human player:', playerName, 'socket:', socket.id);
      } catch (error) {
        console.error('Failed to create DB session, falling back to in-memory:', error);
        session = createPlayerSession(gameId, socket.id, playerName);
      }
    } else {
      console.log('Skipping session for bot:', playerName);
    }

    // Track online player status
    updateOnlinePlayer(socket.id, playerName, 'in_team_selection', gameId);

    // Update player presence in database (only for human players)
    if (!isBot) {
      try {
        await updatePlayerPresence(playerName, 'online', socket.id, gameId);
      } catch (error) {
        console.error('Failed to update player presence:', error);
      }
    }

    // Send session only to the joining player (not broadcast to everyone)
    socket.emit('player_joined', { player, gameState: game, session });

    // Broadcast to other players without session info
    socket.to(gameId).emit('player_joined', { player, gameState: game });

    // Associate player with connection manager
    connectionManager.associatePlayer(socket.id, playerName, player.id, gameId, isBot || false);
  }));

  socket.on('select_team', errorBoundaries.gameAction('select_team')(({ gameId, teamId }: { gameId: string; teamId: 1 | 2 }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validateTeamSelection(game, socket.id, teamId);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function
    applyTeamSelection(game, socket.id, teamId);

    // I/O - Emit updates
    emitGameUpdate(gameId, game);
  }));

  socket.on('swap_position', errorBoundaries.gameAction('swap_position')(({ gameId, targetPlayerId }: { gameId: string; targetPlayerId: string }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validatePositionSwap(game, socket.id, targetPlayerId);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function
    applyPositionSwap(game, socket.id, targetPlayerId);

    // I/O - Emit updates
    emitGameUpdate(gameId, game);
  }));

  // Team selection chat
  socket.on('send_team_selection_chat', errorBoundaries.gameAction('send_team_selection_chat')((payload: { gameId: string; message: string }) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(teamChatPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid send_team_selection_chat payload', { payload, error: validation.error });
      return;
    }

    const { gameId, message: validatedMessage } = validation.data;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.chat.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are sending messages too fast. Please slow down.',
      });
      logger.warn('Rate limit exceeded for send_team_selection_chat', {
        playerName,
        ipAddress,
        gameId,
      });
      return;
    }
    rateLimiters.chat.recordRequest(playerName, ipAddress);

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Chat only available during team selection' });
      return;
    }

    // Message is already validated and sanitized by Zod schema
    const sanitizedMessage = validatedMessage;
    if (!sanitizedMessage) {
      return;
    }

    // Broadcast message to all players in the game
    io.to(gameId).emit('team_selection_chat_message', {
      playerId: socket.id,
      playerName: player.name,
      teamId: player.teamId,
      message: sanitizedMessage,
      timestamp: Date.now()
    });
  }));

  // In-game chat (betting, playing, and scoring phases)
  socket.on('send_game_chat', errorBoundaries.gameAction('send_game_chat')((payload: { gameId: string; message: string }) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(gameChatPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid send_game_chat payload', { payload, error: validation.error });
      return;
    }

    const { gameId, message: validatedMessage } = validation.data;

    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;
    const ipAddress = getSocketIP(socket);
    const rateLimit = rateLimiters.chat.checkLimit(playerName, ipAddress);
    if (!rateLimit.allowed) {
      socket.emit('error', {
        message: 'You are sending messages too fast. Please slow down.',
      });
      logger.warn('Rate limit exceeded for send_game_chat', {
        playerName,
        ipAddress,
        gameId,
      });
      return;
    }
    rateLimiters.chat.recordRequest(playerName, ipAddress);

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    if (game.phase !== 'betting' && game.phase !== 'playing' && game.phase !== 'scoring') {
      socket.emit('error', { message: 'Chat only available during gameplay' });
      return;
    }

    // Message is already validated and sanitized by Zod schema
    const sanitizedMessage = validatedMessage;
    if (!sanitizedMessage) {
      return;
    }

    // Broadcast message to all players in the game
    io.to(gameId).emit('game_chat_message', {
      playerId: socket.id,
      playerName: player.name,
      teamId: player.teamId,
      message: sanitizedMessage,
      timestamp: Date.now()
    });
  }));

  // Player ready for next round
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

  socket.on('start_game', errorBoundaries.gameAction('start_game')(({ gameId }: { gameId: string }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validateGameStart(game);
    if (!validation.success) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // Side effects - Update online player statuses
    game.players.forEach(player => {
      updateOnlinePlayer(player.id, player.name, 'in_game', gameId);
    });

    // Start the game (handles state transitions and I/O)
    startNewRound(gameId);
  }));

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

    // Rate limiting: Check per-player rate limit (Sprint 2)
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;
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
    const result = applyBet(game, socket.id, amount, withoutTrump, skipped);

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
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'playing');
    } else {
      // Betting continues - emit update and start next player's timeout
      emitGameUpdate(gameId, game);
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
    }
  }));

  socket.on('play_card', errorBoundaries.gameAction('play_card')((payload: { gameId: string; card: Card }) => {
    // Sprint 2: Validate input with Zod schema
    const validation = validateInput(playCardPayloadSchema, payload);
    if (!validation.success) {
      socket.emit('error', { message: `Invalid input: ${validation.error}` });
      logger.warn('Invalid play_card payload', { payload, error: validation.error });
      return;
    }

    const { gameId, card } = validation.data;

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
    const validation = validateCardPlay(game, socket.id, card);
    if (!validation.success) {
      console.log(`   ❌ REJECTED: ${validation.error}`);
      socket.emit('invalid_move', { message: validation.error });
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
      }
    }
  }));

  // Spectator mode - join game as observer
  socket.on('spectate_game', errorBoundaries.gameAction('spectate_game')(({ gameId, spectatorName }: { gameId: string; spectatorName?: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Join spectator room
    socket.join(`${gameId}-spectators`);
    console.log(`Spectator ${socket.id} (${spectatorName || 'Anonymous'}) joined game ${gameId}`);

    // Create spectator game state (hide player hands)
    const spectatorGameState = {
      ...game,
      players: game.players.map(player => ({
        id: player.id,
        name: player.name,
        teamId: player.teamId,
        hand: [], // Hide hands from spectators
        tricksWon: player.tricksWon,
        pointsWon: player.pointsWon,
      }))
    };

    // Send spectator game state
    socket.emit('spectator_joined', {
      gameState: spectatorGameState,
      isSpectator: true
    });

    // Notify other players that a spectator joined
    io.to(gameId).emit('spectator_update', {
      message: `${spectatorName || 'A spectator'} is now watching`,
      spectatorCount: io.sockets.adapter.rooms.get(`${gameId}-spectators`)?.size || 0
    });
  }));

  // Leave spectator mode
  socket.on('leave_spectate', errorBoundaries.gameAction('leave_spectate')(({ gameId }: { gameId: string }) => {
    socket.leave(`${gameId}-spectators`);
    console.log(`Spectator ${socket.id} left game ${gameId}`);

    // Notify remaining players
    io.to(gameId).emit('spectator_update', {
      message: 'A spectator left',
      spectatorCount: io.sockets.adapter.rooms.get(`${gameId}-spectators`)?.size || 0
    });

    socket.emit('spectator_left', { success: true });
  }));

  // Test-only handler to set scores
  socket.on('__test_set_scores', errorBoundaries.gameAction('__test_set_scores')(({ team1, team2 }: { team1: number; team2: number }) => {
    // Find game for this socket
    games.forEach((game) => {
      if (game.players.some(p => p.id === socket.id)) {
        game.teamScores.team1 = team1;
        game.teamScores.team2 = team2;
        console.log(`TEST: Set scores to Team1=${team1}, Team2=${team2}`);

        // Check if game should be over (team >= 41)
        if (team1 >= 41 || team2 >= 41) {
          game.phase = 'game_over';
          const winningTeam = team1 >= 41 ? 1 : 2;
          console.log(`TEST: Game over triggered, Team ${winningTeam} wins`);

          // Emit game_over event
          io.to(game.id).emit('game_over', {
            winningTeam,
            gameState: game
          });
        }

        emitGameUpdate(game.id, game);
      }
    });
  }));

  // Leave game handler
  socket.on('leave_game', errorBoundaries.gameAction('leave_game')(async ({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Clean up player sessions from database
    try {
      await deletePlayerSessions(player.name, gameId);
      console.log(`Deleted DB sessions for ${player.name} leaving game ${gameId}`);
    } catch (error) {
      console.error('Failed to delete player sessions from DB:', error);
    }

    // Remove player from game
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1);
      console.log(`Player ${player.name} (${socket.id}) left game ${gameId}`);

      // Leave the game room
      socket.leave(gameId);

      // Notify remaining players
      io.to(gameId).emit('player_left', { playerId: socket.id, gameState: game });

      // If game is empty, schedule deletion after 5 minutes (allows reconnection)
      if (game.players.length === 0) {
        console.log(`Game ${gameId} is now empty, scheduling deletion in 5 minutes`);

        const deletionTimeout = setTimeout(() => {
          if (games.has(gameId)) {
            const currentGame = games.get(gameId);
            // Only delete if still empty
            if (currentGame && currentGame.players.length === 0) {
              games.delete(gameId);
              gameDeletionTimeouts.delete(gameId);
              console.log(`Game ${gameId} deleted after timeout (no players returned)`);
            }
          }
        }, 5 * 60 * 1000); // 5 minutes

        gameDeletionTimeouts.set(gameId, deletionTimeout);
      }

      // Confirm to the leaving player
      socket.emit('leave_game_success', { success: true });
    }
  }));

  // Kick player handler
  socket.on('kick_player', errorBoundaries.gameAction('kick_player')(async ({ gameId, playerId }: { gameId: string; playerId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Only allow the game creator to kick players
    if (socket.id !== game.creatorId) {
      socket.emit('error', { message: 'Only the game creator can kick players' });
      return;
    }

    // Cannot kick yourself
    if (playerId === socket.id) {
      socket.emit('error', { message: 'Cannot kick yourself' });
      return;
    }

    // Only allow kicking during team selection phase
    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Can only kick players during team selection' });
      return;
    }

    // Find player
    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Player not found' });
      return;
    }

    const kickedPlayer = game.players[playerIndex];

    // Clean up kicked player's sessions from database
    try {
      await deletePlayerSessions(kickedPlayer.name, gameId);
      console.log(`Deleted DB sessions for kicked player ${kickedPlayer.name} from game ${gameId}`);
    } catch (error) {
      console.error('Failed to delete kicked player sessions from DB:', error);
    }

    // Remove player from game
    game.players.splice(playerIndex, 1);

    // Notify the kicked player
    io.to(playerId).emit('kicked_from_game', {
      message: 'You have been removed from the game by the host',
      gameId
    });

    // Remove from socket room
    const kickedSocket = io.sockets.sockets.get(playerId);
    if (kickedSocket) {
      kickedSocket.leave(gameId);
    }

    // Remove player session if it exists
    for (const [token, session] of playerSessions.entries()) {
      if (session.playerId === playerId && session.gameId === gameId) {
        playerSessions.delete(token);
        break;
      }
    }

    // Update online player status
    onlinePlayers.delete(playerId);
    broadcastOnlinePlayers();

    // Broadcast updated game state
    io.to(gameId).emit('player_left', { playerId, gameState: game });
    console.log(`Player ${kickedPlayer.name} was kicked from game ${gameId} by host`);
  }));

  // Replace human player with bot
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

    // Clean up old player's sessions
    try {
      await deletePlayerSessions(playerNameToReplace, gameId);
      console.log(`Deleted DB sessions for replaced player ${playerNameToReplace}`);
    } catch (error) {
      console.error('Failed to delete replaced player sessions from DB:', error);
    }

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

  // Take over a bot with a human player
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

    // Update bot to be a human player (preserve team, hand, scores, position)
    botToReplace.name = newPlayerName;
    botToReplace.isBot = false;
    botToReplace.botDifficulty = undefined;
    botToReplace.id = socket.id; // Update to new player's socket

    // Join the socket room
    socket.join(gameId);

    // Create and save session token
    let session: PlayerSession;
    try {
      session = await createDBSession(newPlayerName, socket.id, gameId);
      playerSessions.set(session.token, session);
      console.log(`Saved DB session for takeover player ${newPlayerName}`);
    } catch (error) {
      console.error('Failed to save takeover session to DB:', error);
      // Fallback to in-memory session
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

  // Change bot difficulty
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

  // Reconnection handler
  socket.on('reconnect_to_game', errorBoundaries.gameAction('reconnect_to_game')(async ({ token }: { token: string }) => {
    console.log('Reconnection attempt with token:', token.substring(0, 10) + '...');

    // Validate session from database
    let session: PlayerSession | null;
    try {
      session = await validateDBSession(token);
    } catch (error) {
      console.error('DB session validation error, trying in-memory:', error);
      session = validateSessionToken(token);
    }

    if (!session) {
      socket.emit('reconnection_failed', { message: 'Invalid or expired session token' });
      return;
    }

    console.log('Session found for player:', session.playerName, 'in game:', session.gameId);

    // Load game from database (with cache fallback)
    const game = await getGame(session.gameId);
    if (!game) {
      socket.emit('reconnection_failed', { message: 'Game no longer exists' });
      // Clean up invalid session from DB
      try {
        await deletePlayerSessions(session.playerName, session.gameId);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
      playerSessions.delete(token);
      return;
    }

    // Check if game is finished
    if (game.phase === 'game_over') {
      socket.emit('reconnection_failed', { message: 'Game has finished' });
      return;
    }

    // Find player in game
    const player = game.players.find(p => p.name === session.playerName);
    if (!player) {
      socket.emit('reconnection_failed', { message: 'Player no longer in game' });
      try {
        await deletePlayerSessions(session.playerName, session.gameId);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
      playerSessions.delete(token);
      return;
    }

    // Don't allow reconnection to bot players (safety check)
    if (player.isBot) {
      socket.emit('reconnection_failed', { message: 'Cannot reconnect as bot player' });
      try {
        await deletePlayerSessions(session.playerName, session.gameId);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
      playerSessions.delete(token);
      return;
    }

    // Update player's socket ID
    const oldSocketId = player.id;
    player.id = socket.id;

    // Reset connection status
    player.connectionStatus = 'connected';
    player.disconnectedAt = undefined;
    player.reconnectTimeLeft = undefined;

    // Clear countdown interval if it exists
    const countdownInterval = countdownIntervals.get(oldSocketId);
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownIntervals.delete(oldSocketId);
    }

    // IMPORTANT: Update player ID in currentTrick to fix card display after reconnection
    game.currentTrick.forEach(tc => {
      if (tc.playerId === oldSocketId) {
        tc.playerId = socket.id;
      }
    });

    // Update session with new socket ID and timestamp in database
    try {
      await updateSessionActivity(token, socket.id);
    } catch (error) {
      console.error('Failed to update session activity in DB:', error);
      // Update in-memory as fallback
      session.playerId = socket.id;
      session.timestamp = Date.now();
    }

    // Join game room
    socket.join(session.gameId);

    // Cancel game deletion timeout if it exists (player returned)
    const deletionTimeout = gameDeletionTimeouts.get(session.gameId);
    if (deletionTimeout) {
      clearTimeout(deletionTimeout);
      gameDeletionTimeouts.delete(session.gameId);
      console.log(`Cancelled deletion timeout for game ${session.gameId} (player returned)`);
    }

    // Update timeout if this player had an active timeout
    // This fixes the bug where a reconnecting player on their turn gets stuck
    const oldTimeoutKey = `${session.gameId}-${oldSocketId}`;
    const existingTimeout = activeTimeouts.get(oldTimeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      activeTimeouts.delete(oldTimeoutKey);
      console.log(`Cleared old timeout for ${oldSocketId}, restarting for ${socket.id}`);

      // Restart timeout with new socket ID if it's their turn
      const currentPlayer = game.players[game.currentPlayerIndex];
      if (currentPlayer && currentPlayer.id === socket.id) {
        const phase = game.phase === 'betting' ? 'betting' : 'playing';
        startPlayerTimeout(session.gameId, socket.id, phase as 'betting' | 'playing');
      }
    }

    // Migrate rematch votes from old socket ID to player name (for backward compatibility)
    if (game.rematchVotes && game.rematchVotes.includes(oldSocketId)) {
      const index = game.rematchVotes.indexOf(oldSocketId);
      game.rematchVotes[index] = player.name;
      console.log(`Migrated rematch vote from socket ID to player name: ${player.name}`);
    }

    // Migrate playersReady from old socket ID to player name (for backward compatibility)
    if (game.playersReady && game.playersReady.includes(oldSocketId)) {
      const index = game.playersReady.indexOf(oldSocketId);
      game.playersReady[index] = player.name;
      console.log(`Migrated player ready status from socket ID to player name: ${player.name}`);
    }

    // Update bets with old socket ID to new socket ID
    game.currentBets.forEach(bet => {
      if (bet.playerId === oldSocketId) {
        bet.playerId = socket.id;
        console.log(`Updated bet playerId from ${oldSocketId} to ${socket.id}`);
      }
    });
    if (game.highestBet && game.highestBet.playerId === oldSocketId) {
      game.highestBet.playerId = socket.id;
      console.log(`Updated highestBet playerId from ${oldSocketId} to ${socket.id}`);
    }

    // Update current trick with old socket ID to new socket ID
    game.currentTrick.forEach(trickCard => {
      if (trickCard.playerId === oldSocketId) {
        trickCard.playerId = socket.id;
        console.log(`Updated trick card playerId from ${oldSocketId} to ${socket.id}`);
      }
    });

    console.log(`Player ${session.playerName} reconnected to game ${session.gameId}`);

    // Send updated game state to reconnected player
    socket.emit('reconnection_successful', { gameState: game, session });

    // Notify other players
    io.to(session.gameId).emit('player_reconnected', {
      playerId: socket.id,
      playerName: session.playerName,
      oldSocketId
    });
  }));

  // Handle rematch vote
  socket.on('vote_rematch', errorBoundaries.gameAction('vote_rematch')(({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Verify game is over
    if (game.phase !== 'game_over') {
      socket.emit('error', { message: 'Game is not over yet' });
      return;
    }

    // Verify player is in game
    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Initialize rematch votes if not exists
    if (!game.rematchVotes) {
      game.rematchVotes = [];
    }

    // Check if player already voted (by name for stability across reconnections)
    if (game.rematchVotes.includes(player.name)) {
      socket.emit('error', { message: 'You already voted for rematch' });
      return;
    }

    // Add vote using player name (stable across reconnections)
    game.rematchVotes.push(player.name);
    console.log(`Player ${player.name} voted for rematch. Votes: ${game.rematchVotes.length}/4`);

    // Broadcast updated vote count
    io.to(gameId).emit('rematch_vote_update', {
      votes: game.rematchVotes.length,
      totalPlayers: 4,
      voters: game.rematchVotes
    });

    // If all 4 players voted, start new game
    if (game.rematchVotes.length === 4) {
      console.log(`All players voted for rematch in game ${gameId}. Starting new game...`);

      // Reset game state
      game.phase = 'team_selection';
      game.currentBets = [];
      game.highestBet = null;
      game.trump = null;
      game.currentTrick = [];
      game.previousTrick = null;
      game.currentPlayerIndex = 0;
      game.dealerIndex = 0;
      game.teamScores = { team1: 0, team2: 0 };
      game.roundNumber = 0;
      game.roundHistory = [];
      game.currentRoundTricks = [];
      game.playersReady = [];
      game.rematchVotes = [];

      // Keep players but clear their hands and reset stats
      game.players.forEach(player => {
        player.hand = [];
        player.tricksWon = 0;
        player.pointsWon = 0;
      });

      // Broadcast game restarted
      io.to(gameId).emit('rematch_started', { gameState: game });
      console.log(`Rematch started for game ${gameId}`);
    }
  }));

  // ============= STATS & LEADERBOARD EVENTS =============

  // Get player statistics
  socket.on('get_player_stats', errorBoundaries.readOnly('get_player_stats')(async ({ playerName }: { playerName: string }) => {
    try {
      const stats = await getPlayerStats(playerName);
      socket.emit('player_stats_response', { stats, playerName });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      socket.emit('error', { message: 'Failed to fetch player statistics' });
    }
  }));

  // Get global leaderboard
  socket.on('get_leaderboard', errorBoundaries.readOnly('get_leaderboard')(async ({ limit = 100, excludeBots = true }: { limit?: number; excludeBots?: boolean }) => {
    try {
      const leaderboard = await getLeaderboard(limit, excludeBots);
      socket.emit('leaderboard_response', { players: leaderboard });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      socket.emit('error', { message: 'Failed to fetch leaderboard' });
    }
  }));

  // Get player game history
  socket.on('get_player_history', errorBoundaries.readOnly('get_player_history')(async ({ playerName, limit = 20 }: { playerName: string; limit?: number }) => {
    try {
      const history = await getPlayerGameHistory(playerName, limit);
      socket.emit('player_history_response', { games: history, playerName });
    } catch (error) {
      console.error('Error fetching player history:', error);
      socket.emit('error', { message: 'Failed to fetch player game history' });
    }
  }));

  // Get game replay data
  socket.on('get_game_replay', errorBoundaries.readOnly('get_game_replay')(async ({ gameId }: { gameId: string }) => {
    try {
      const replayData = await getGameReplayData(gameId);

      if (!replayData) {
        socket.emit('error', { message: 'Game replay not found or game is not finished yet' });
        return;
      }

      socket.emit('game_replay_data', { replayData });
    } catch (error) {
      console.error('Error fetching game replay:', error);
      socket.emit('error', { message: 'Failed to fetch game replay data' });
    }
  }));

  // Get all finished games (for browsing replays)
  socket.on('get_all_finished_games', errorBoundaries.readOnly('get_all_finished_games')(async ({ limit = 50, offset = 0 }: { limit?: number; offset?: number }) => {
    try {
      const games = await getAllFinishedGames(limit, offset);
      socket.emit('finished_games_list', { games });
    } catch (error) {
      console.error('Error fetching finished games:', error);
      socket.emit('error', { message: 'Failed to fetch finished games list' });
    }
  }));

  socket.on('disconnect', errorBoundaries.background('disconnect')(async () => {
    console.log('Client disconnected:', socket.id);

    // Clean up rate limiters
    socketRateLimiters.chat.delete(socket.id);
    socketRateLimiters.bet.delete(socket.id);
    socketRateLimiters.card.delete(socket.id);

    // Remove from online players
    const onlinePlayer = onlinePlayers.get(socket.id);
    onlinePlayers.delete(socket.id);

    // Find player's game and session
    let playerGame: GameState | null = null;
    let playerGameId: string | null = null;
    let playerName: string | null = null;

    games.forEach((game, gameId) => {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        playerGame = game;
        playerGameId = gameId;
        playerName = player.name;
      }
    });

    if (!playerGame || !playerGameId) {
      // Player not in any game - mark as offline immediately if we know their name
      if (onlinePlayer) {
        try {
          await markPlayerOffline(onlinePlayer.playerName);
        } catch (error) {
          console.error('Failed to mark player offline:', error);
        }
      }
      return;
    }

    // TypeScript type guard - playerGame is definitely not null here
    const game: GameState = playerGame;
    const gameId: string = playerGameId;

    // Don't immediately remove player - give 15 minutes grace period for reconnection (mobile AFK)
    console.log(`Player ${socket.id} disconnected. Waiting for reconnection...`);

    // Update player connection status
    const player = game.players.find((p: Player) => p.id === socket.id);
    if (player) {
      player.connectionStatus = 'disconnected';
      player.disconnectedAt = Date.now();
      player.reconnectTimeLeft = 900; // 15 minutes = 900 seconds
    }

    // Start countdown timer that updates every second
    const countdownInterval = setInterval(() => {
      const currentGame = games.get(gameId);
      if (!currentGame) {
        const interval = countdownIntervals.get(socket.id);
        if (interval) {
          clearInterval(interval);
          countdownIntervals.delete(socket.id);
        }
        return;
      }

      const player = currentGame.players.find(p => p.id === socket.id);
      if (player && player.connectionStatus === 'disconnected' && player.reconnectTimeLeft) {
        player.reconnectTimeLeft = Math.max(0, player.reconnectTimeLeft - 1);

        // Emit connection status update every 5 seconds to reduce bandwidth
        if (player.reconnectTimeLeft % 5 === 0 || player.reconnectTimeLeft < 5) {
          io.to(gameId).emit('connection_status_update', {
            playerId: socket.id,
            playerName: player.name,
            status: 'disconnected',
            reconnectTimeLeft: player.reconnectTimeLeft
          });
        }

        // Clear interval when timer reaches 0
        if (player.reconnectTimeLeft === 0) {
          const interval = countdownIntervals.get(socket.id);
          if (interval) {
            clearInterval(interval);
            countdownIntervals.delete(socket.id);
          }
        }
      } else {
        const interval = countdownIntervals.get(socket.id);
        if (interval) {
          clearInterval(interval);
          countdownIntervals.delete(socket.id);
        }
      }
    }, 1000); // Update every second

    // Store the countdown interval
    countdownIntervals.set(socket.id, countdownInterval);

    // Notify other players of disconnection
    io.to(gameId).emit('player_disconnected', {
      playerId: socket.id,
      playerName: playerName,
      waitingForReconnection: true,
      reconnectTimeLeft: 900
    });

    // Update game state for all players with persistence
    emitGameUpdate(gameId, game);

    // Set timeout to remove player if they don't reconnect
    const disconnectTimeout = setTimeout(async () => {
      const currentGame = games.get(gameId);
      if (!currentGame) {
        disconnectTimeouts.delete(socket.id);
        return;
      }

      const player = currentGame.players.find((p) => p.id === socket.id);
      if (player) {
        // Player didn't reconnect - remove them
        const playerIndex = currentGame.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          currentGame.players.splice(playerIndex, 1);
          io.to(gameId).emit('player_left', { playerId: socket.id, gameState: currentGame });
          console.log(`Player ${socket.id} removed from game ${gameId} (no reconnection)`);

          // Mark player as offline in database
          if (playerName) {
            try {
              await markPlayerOffline(playerName);
            } catch (error) {
              console.error('Failed to mark player offline:', error);
            }
          }
        }
      }
      disconnectTimeouts.delete(socket.id);
    }, 900000); // 15 minutes

    // Store the timeout so it can be cancelled on reconnection
    disconnectTimeouts.set(socket.id, disconnectTimeout);
  }));
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
