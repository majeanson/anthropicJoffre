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
  console.log('🚨 Initializing Sentry for backend...');
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
  console.log('✅ Sentry initialized successfully for backend');
} else {
  console.warn('⚠️ SENTRY_DSN not found. Backend error tracking disabled.');
}

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ConnectionManager } from './connection/ConnectionManager';
import { GameState, Player, Bet, TrickCard, Card, PlayerSession, GamePhase, VoiceParticipant } from './types/game';
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
// Import skin/reward system
import { awardGameEventReward, updatePlayerLevel, checkAndUnlockSkins, getPlayerUnlockedSkins } from './db/skins';
// Import quest system (Sprint 19: Daily Engagement System)
import { updateQuestProgress, updateRoundQuestProgress } from './db/quests';
import { extractQuestContext, extractRoundQuestContext } from './game/quests';
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
import { memoryManager } from './utils/memoryManager';
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
import authRoutes from './api/auth'; // Sprint 3 Phase 1
import profileRoutes from './api/profiles'; // Sprint 3 Phase 3.2
import { verifyAccessToken } from './utils/authHelpers'; // Sprint 3: JWT verification
import { registerLobbyHandlers } from './socketHandlers/lobby';
import { registerGameplayHandlers } from './socketHandlers/gameplay';
import { registerChatHandlers } from './socketHandlers/chat';
import { registerSpectatorHandlers } from './socketHandlers/spectator';
import { registerBotHandlers } from './socketHandlers/bots';
import { registerStatsHandlers } from './socketHandlers/stats';
import { registerConnectionHandlers } from './socketHandlers/connection';
import { registerAdminHandlers } from './socketHandlers/admin';
import { registerAchievementHandlers, triggerAchievementCheck, emitAchievementUnlocked } from './socketHandlers/achievements'; // Sprint 2 Phase 1
import { checkSecretAchievements } from './utils/achievementChecker'; // Achievement integration
import { registerFriendHandlers } from './socketHandlers/friends'; // Sprint 2 Phase 2
import { registerNotificationHandlers } from './socketHandlers/notifications'; // Sprint 3 Phase 5
import { registerDirectMessageHandlers } from './socketHandlers/directMessages'; // Sprint 16 Day 4
import { registerSocialHandlers } from './socketHandlers/social'; // Sprint 16 Day 6
import { registerQuestHandlers } from './socketHandlers/quests'; // Sprint 19: Daily Engagement System
import { registerVoiceHandlers } from './socketHandlers/voice'; // Voice chat WebRTC signaling
import { registerSideBetsHandlers } from './socketHandlers/sideBets'; // Side betting system
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

// Trust proxy for Railway deployment (enables X-Forwarded-For header)
// Railway is behind 1 proxy hop
app.set('trust proxy', 1);

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
  // Ping timeout and interval
  // Increased to 60s to prevent false timeouts when clients are busy processing bot actions/deltas
  pingTimeout: 60000, // 60 seconds (was 10s - too aggressive)
  pingInterval: 25000,  // 25 seconds (was 5s)
  // Enable both transports for Railway compatibility
  // Railway's proxy sometimes has issues with WebSocket upgrades, so allow polling fallback
  transports: ['websocket', 'polling'],
  // Allow upgrades from polling to websocket
  allowUpgrades: true,
  // Enable WebSocket compression (reduces bandwidth by 30-60%)
  perMessageDeflate: {
    threshold: 1024, // Only compress messages > 1KB
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 1, // MEMORY OPTIMIZATION: Level 1 = faster, less memory (was 3)
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
  // Connection events are logged via ConnectionManager
});

connectionManager.on('connection_timeout', ({ playerName, socketId }) => {
  // Connection events are logged via ConnectionManager
});

// ============================================================================
// Sentry Tunnel Endpoint (MUST be registered BEFORE CORS middleware)
// ============================================================================
// This endpoint proxies Sentry events to bypass ad blockers
// CRITICAL: Must be registered before CORS to avoid blocking Sentry's ingest domain
app.options('/api/sentry-tunnel', (req, res) => {
  // Handle preflight CORS request for Sentry tunnel
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).send();
});

app.post('/api/sentry-tunnel', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    // Set CORS headers for actual POST request
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'false');

    const envelope = req.body;

    // Handle both Buffer and string
    const envelopeString = Buffer.isBuffer(envelope) ? envelope.toString('utf-8') : envelope;
    const lines = envelopeString.split('\n');
    const headerLine = lines[0];

    const header = JSON.parse(headerLine);

    // Extract Sentry project ID and host from DSN
    const dsnMatch = header.dsn?.match(/https:\/\/([^@]+)@([^\/]+)\/(\d+)/);

    if (!dsnMatch) {
      console.error('[Sentry Tunnel] Invalid DSN in envelope:', header.dsn);
      return res.status(400).send('Invalid DSN');
    }

    const [, publicKey, host, projectId] = dsnMatch;
    const sentryIngestUrl = `https://${host}/api/${projectId}/envelope/`;

    // Forward the envelope to Sentry (as raw bytes)
    const response = await fetch(sentryIngestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_key=${publicKey}, sentry_version=7`,
      },
      body: envelope,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sentry Tunnel] Sentry API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        projectId,
      });
      return res.status(response.status).send(response.statusText);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Sentry Tunnel] Error forwarding to Sentry:', error);
    res.status(500).send('Internal Server Error');
  }
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

// Security headers middleware with helmet
// Configured for production deployment with HTTPS
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now (conflicts with Socket.io)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(express.json());
app.use(cookieParser()); // Sprint 18: Parse cookies for refresh tokens

// Add structured logging for HTTP requests
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Add response time monitoring for all requests
app.use(responseTimeMiddleware);

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Increased from 100 - allows polling endpoints like /api/debug/games
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Serve Storybook static files at /storybook (Sprint 20)
// Built from: frontend/storybook-static
// Only available when built locally with: npm run build:local
const storybookPath = resolve(__dirname, '../public/storybook');
if (existsSync(storybookPath)) {
  app.use('/storybook', express.static(storybookPath));
  logger.info('Storybook static files available at /storybook');
} else {
  logger.warn('Storybook not built - run "npm run build:local" to enable');
}

// Stricter rate limit for game creation
const gameCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Increased from 10 - allows more testing/development
  message: 'Too many games created, please try again later.',
});

// Socket event rate limiters (stored per socket ID)
interface RateLimiterData {
  count: number;
  lastReset: number;
}

const socketRateLimiters = {
  chat: new Map<string, RateLimiterData>(), // Rate limiter data
  bet: new Map<string, RateLimiterData>(), // Rate limiter data
  card: new Map<string, RateLimiterData>(), // Rate limiter data
};


// In-memory game storage (can be moved to Redis for production)
const games = new Map<string, GameState>();

// Track game creation timestamps (gameId -> timestamp in milliseconds)
const gameCreationTimes = new Map<string, number>();

// Track when games finish (gameId -> timestamp in milliseconds)
const gameFinishTimes = new Map<string, number>();

// Session storage for reconnection (maps token to session data)
const playerSessions = new Map<string, PlayerSession>();

// Timeout storage (maps gameId-playerId to timeout ID)
const activeTimeouts = new Map<string, NodeJS.Timeout>();

// Disconnect timeout storage (maps socket.id to timeout ID)
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

// Voice chat participants (maps gameId -> (socketId -> VoiceParticipant))
const voiceParticipants = new Map<string, Map<string, VoiceParticipant>>();

// Swap request tracking (maps gameId-targetPlayerId to request data)
interface SwapRequest {
  gameId: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  timeout: NodeJS.Timeout;
}
const pendingSwapRequests = new Map<string, SwapRequest>();

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

// ============================================================================
// ACHIEVEMENT HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the game was a comeback (opponent was 30+ points ahead at some point)
 */
function checkIfComeback(game: GameState, playerTeamId: 1 | 2): boolean {
  // Check round history for point differentials
  for (const round of game.roundHistory || []) {
    const playerTeamScore = playerTeamId === 1 ? round.cumulativeScore.team1 : round.cumulativeScore.team2;
    const opponentScore = playerTeamId === 1 ? round.cumulativeScore.team2 : round.cumulativeScore.team1;

    // If opponent was ever 30+ points ahead
    if (opponentScore - playerTeamScore >= 30) {
      return true;
    }
  }
  return false;
}

/**
 * Check if the game was a perfect game (won every bet as the betting team)
 */
function checkIfPerfectGame(game: GameState, playerTeamId: 1 | 2): boolean {
  // Check if player's team won all rounds where they were the betting team
  for (const round of game.roundHistory || []) {
    // offensiveTeam is the team that made the highest bet
    const biddingTeamId = round.offensiveTeam;

    if (biddingTeamId === playerTeamId) {
      // This team was betting - did they make their bet?
      if (!round.betMade) {
        return false; // Lost a bet they made
      }
    }
  }

  // Need at least one round where they were betting to count
  const roundsAsBettingTeam = (game.roundHistory || []).filter(r => r.offensiveTeam === playerTeamId);
  return roundsAsBettingTeam.length > 0;
}

/**
 * Count how many rounds a player's team was the lowest scorer
 */
function countRoundsAsLowestScorer(game: GameState, playerName: string): number {
  const player = game.players.find(p => p.name === playerName);
  if (!player) return 0;

  const playerTeamId = player.teamId;
  let lowestScorerRounds = 0;

  for (const round of game.roundHistory || []) {
    const playerTeamScore = playerTeamId === 1 ? round.cumulativeScore.team1 : round.cumulativeScore.team2;
    const opponentScore = playerTeamId === 1 ? round.cumulativeScore.team2 : round.cumulativeScore.team1;

    if (playerTeamScore < opponentScore) {
      lowestScorerRounds++;
    }
  }

  return lowestScorerRounds;
}

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
 * Uses conditional persistence based on game mode
 */
async function saveGame(gameState: GameState): Promise<void> {
  // Update cache (always)
  games.set(gameState.id, gameState);

  // Persist to database (conditional on persistence mode)
  const createdAtMs = gameCreationTimes.get(gameState.id) || Date.now();
  const createdAt = new Date(createdAtMs);
  await PersistenceManager.saveOrUpdateGame(gameState, createdAt);
}

/**
 * Delete game from both cache and database
 */
async function deleteGame(gameId: string): Promise<void> {
  const game = games.get(gameId);
  const persistenceMode = game?.persistenceMode || 'elo'; // Default to 'elo' if game not found

  // Remove from cache
  games.delete(gameId);
  gameCreationTimes.delete(gameId);
  gameFinishTimes.delete(gameId);
  previousGameStates.delete(gameId); // Clean up delta tracking

  // Remove from database (conditional on persistence mode)
  if (persistenceMode === 'elo') {
    try {
      await deleteGameFromDB(gameId);
    } catch (error) {
      console.error(`Failed to delete game ${gameId} from database:`, error);
    }
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
  if (!game) {
    return;
  }

  // Look up player by name (stable), fallback to ID
  let player = game.players.find(p => p.name === playerNameOrId);
  if (!player) {
    player = game.players.find(p => p.id === playerNameOrId);
  }
  if (!player) {
    return;
  }

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

    // Emit auto-action notification (skip for bots - they're already in autoplay)
    if (!player.isBot) {
      io.to(gameId).emit('auto_action_taken', {
        playerId: player.id,
        playerName: player.name,
        phase
      });
    }

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

  const hasAlreadyBet = game.currentBets.some(b => b.playerName === playerName);
  if (hasAlreadyBet) return; // Already bet

  const isDealer = game.currentPlayerIndex === game.dealerIndex;
  const hasValidBets = game.currentBets.some(b => !b.skipped);

  // Dealer betting rules:
  // 1. If no valid bets exist, dealer MUST bet minimum 7
  // 2. If valid bets exist, dealer EQUALIZES (matches) the highest bet
  // Non-dealer: Always skip on timeout
  if (isDealer) {
    if (!hasValidBets) {
      // No valid bets - dealer must bet minimum 7
      const bet: Bet = {
        playerId: player.id,
        playerName: player.name,
        amount: 7,
        withoutTrump: false,
        skipped: false,
      };
      game.currentBets.push(bet);
    } else {
      // Valid bets exist - dealer equalizes (matches) the highest bet
      const dealerPlayerId = game.players[game.dealerIndex].id;
      const highestBet = getHighestBet(game.currentBets, dealerPlayerId);
      const bet: Bet = {
        playerId: player.id,
        playerName: player.name,
        amount: highestBet?.amount || 7,
        withoutTrump: highestBet?.withoutTrump || false,
        skipped: false,
      };
      game.currentBets.push(bet);
    }
  } else {
    // Non-dealer: Skip the bet on timeout
    const bet: Bet = {
      playerId: player.id,
      playerName: player.name,
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

  // Use hard bot logic to select best card (same strategy as frontend autoplay)
  const selectedCard = selectBotCard(game, player.id);

  if (!selectedCard) {
    console.error(`No valid cards found for ${currentPlayer.name}`);
    return;
  }

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
    // HOT PATH: Emit immediately for client rendering, skip DB save (trick will be saved after resolution)
    // Using direct emit() instead of emitGameUpdate() to avoid unnecessary DB writes
    io.to(gameId).emit('game_updated', game);
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
// Setup Swagger API documentation
import { setupSwagger } from './api/swagger';
setupSwagger(app);

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

// Sprint 18 Phase 1: CSRF Protection
import { getCsrfToken, csrfProtection, csrfErrorHandler } from './middleware/csrf';

// CSRF token endpoint (GET request, no protection needed)
app.get('/api/csrf-token', getCsrfToken);

// Sprint 3 Phase 1: Authentication routes
// Note: Public auth endpoints (login, register, forgot-password) are exempt from CSRF
// because mobile Safari blocks cross-origin cookies (ITP), and these endpoints are
// already protected by rate limiting. Authenticated endpoints still require CSRF.
const authCsrfExemptPaths = ['/login', '/register', '/request-password-reset', '/reset-password', '/verify-email'];
app.use('/api/auth', (req, res, next) => {
  // Exempt public auth endpoints from CSRF (rate-limited already)
  if (authCsrfExemptPaths.some(path => req.path === path)) {
    return next();
  }
  // All other auth endpoints (logout, logout-all, refresh, me, profile) need CSRF
  return csrfProtection(req, res, next);
}, authRoutes);

// Sprint 3 Phase 3.2: Profile routes (with CSRF protection)
app.use('/api/profiles', csrfProtection, profileRoutes);

// CSRF error handler (must be after protected routes)
app.use(csrfErrorHandler);

// ============================================================================

// Socket.IO authentication middleware - set playerName from JWT token if available
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (token) {
      const payload = verifyAccessToken(token);

      if (payload && payload.username) {
        // Set playerName from authenticated user
        socket.data.playerName = payload.username;

        // Join player-specific room for real-time notifications (friend requests, DMs, etc.)
        socket.join(`player:${payload.username}`);
        console.log(`[AUTH] Player ${payload.username} joined their notification room`);
      }
    }

    // Continue even if not authenticated (guest users can still play)
    next();
  } catch (error) {
    // Don't block connection on auth error, just log it
    console.error('Socket auth error:', error);
    next();
  }
});

// Socket.io event handlers
io.on('connection', (socket) => {
  // Register connection with ConnectionManager
  connectionManager.registerConnection(socket);

  // Track authenticated users as online immediately on connection
  // This ensures they appear in the global online players list even before joining a game
  if (socket.data.playerName) {
    updateOnlinePlayer(socket.id, socket.data.playerName, 'in_lobby', undefined);
    console.log(`[ONLINE] Authenticated player ${socket.data.playerName} added to online list`);
  }

  // Handle post-connection authentication (when user logs in after already connecting)
  socket.on('authenticate', errorBoundaries.readOnly('authenticate')(async ({ token }: { token: string }) => {
    try {
      const payload = verifyAccessToken(token);

      if (payload && payload.username) {
        // Leave old player room if re-authenticating as different user
        if (socket.data.playerName && socket.data.playerName !== payload.username) {
          socket.leave(`player:${socket.data.playerName}`);
          onlinePlayers.delete(socket.id); // Remove old entry
        }

        // Set playerName and join new player room
        socket.data.playerName = payload.username;
        socket.join(`player:${payload.username}`);

        // Track as online
        updateOnlinePlayer(socket.id, payload.username, 'in_lobby', undefined);

        socket.emit('authenticated', { success: true, username: payload.username });
        console.log(`[AUTH] Player ${payload.username} authenticated post-connection`);
      } else {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    } catch (error) {
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  }));

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
    pendingSwapRequests,
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
    handlePlayingTimeout,
    handleBettingTimeout,
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
  // Achievement Handlers - Sprint 2 Phase 1 | Sprint 6: Added error boundaries
  // ============================================================================
  registerAchievementHandlers(io, socket, { errorBoundaries });
  registerFriendHandlers(io, socket, { errorBoundaries, onlinePlayers });

  // ============================================================================
  // Notification Handlers - Sprint 3 Phase 5
  // ============================================================================
  registerNotificationHandlers(socket, {
    io,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Direct Message Handlers - Sprint 16 Day 4
  // ============================================================================
  registerDirectMessageHandlers(io, socket, { errorBoundaries });

  // ============================================================================
  // Social Handlers - Sprint 16 Day 6
  // ============================================================================
  registerSocialHandlers(io, socket, { errorBoundaries });

  // ============================================================================
  // Quest Handlers - Sprint 19: Daily Engagement System
  // ============================================================================
  registerQuestHandlers(socket);

  // ============================================================================
  // Voice Chat Handlers - WebRTC Signaling
  // ============================================================================
  registerVoiceHandlers(socket, {
    games,
    voiceParticipants,
    io,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Side Bets Handlers - Coin betting system
  // ============================================================================
  registerSideBetsHandlers(socket, {
    games,
    io,
    logger,
    errorBoundaries,
  });

  // ============================================================================
  // Connection Handlers - Refactored (Sprint 3)
  // ============================================================================
  registerConnectionHandlers(socket, {
    games,
    playerSessions,
    roundStats,
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

  // ============================================================================
  // Connection Quality - Sprint 6
  // ============================================================================
  // Simple ping measurement for connection quality monitoring
  socket.on('ping_measurement', ({ timestamp }, callback) => {
    // Echo back the timestamp so client can calculate latency
    callback({ timestamp });
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

  // Store initial hands in round stats for end-of-round display
  const stats = roundStats.get(gameId);
  if (stats) {
    game.players.forEach(player => {
      // Deep copy the hand to preserve the initial state
      stats.initialHands.set(player.name, [...player.hand]);
    });
  }

  broadcastGameUpdate(gameId, 'round_started', game);

  // Start timeout for first player's bet
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer) {
    startPlayerTimeout(gameId, currentPlayer.id, 'betting');

    // Schedule bot action if first player is a bot
    if (currentPlayer.isBot) {
      setTimeout(() => {
        const currentGame = games.get(gameId);
        if (!currentGame || currentGame.phase !== 'betting') return;

        const currentBot = currentGame.players[currentGame.currentPlayerIndex];
        if (!currentBot || currentBot.name !== currentPlayer.name) return;

        handleBettingTimeout(gameId, currentPlayer.name);
      }, 2000); // 2 second delay for bot actions
    }
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
    if (!game) {
      return;
    }

    // Clear trick after frontend has shown the animation
    game.currentTrick = [];

    if (isRoundOver) {
      // All hands empty - proceed to round end
      endRound(gameId);
    } else {
      // Continue playing - emit update and start timeout for next card
      emitGameUpdate(gameId, game);
      startPlayerTimeout(gameId, winnerName, 'playing');

      // Schedule bot action if winner is a bot
      const winner = game.players.find(p => p.name === winnerName);
      if (winner?.isBot) {
        setTimeout(() => {
          const currentGame = games.get(gameId);
          if (!currentGame || currentGame.phase !== 'playing') return;

          // Verify it's still this bot's turn
          const currentBot = currentGame.players[currentGame.currentPlayerIndex];
          if (!currentBot || currentBot.name !== winnerName) return;

          // Check if bot already played
          const hasPlayed = currentGame.currentTrick.some(tc => tc.playerName === winnerName);
          if (hasPlayed) return;

          handlePlayingTimeout(gameId, winnerName);
        }, 2000); // 2 second delay for bot actions
      }
    }
  }, delayMs);
}

function resolveTrick(gameId: string) {
  const game = games.get(gameId);
  if (!game) {
    return;
  }

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

  const gameToSend = games.get(gameId);

  // 4. I/O - Emit trick resolution event with trick still visible
  broadcastGameUpdate(gameId, 'trick_resolved', { winnerId, winnerName, points: totalPoints, gameState: gameToSend || game });

  // 5. ORCHESTRATION - Handle round completion or continue playing
  // Sprint 5 Phase 2.3: Extracted setTimeout logic to schedulePostTrickActions()
  schedulePostTrickActions(gameId, winnerName, result.isRoundOver);
}


async function endRound(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  // Set phase to 'scoring' (called after 2s trick display delay from schedulePostTrickActions)
  game.phase = 'scoring';

  // 1. PURE CALCULATION - Calculate round scoring
  const scoring = calculateRoundScoring(game);

  // 2. STATE TRANSFORMATION - Apply scoring to game state (updates scores, adds to history, checks game over)
  applyRoundScoring(game, scoring);

  // 3. Add round statistics and player stats to the round history entry
  const statsData = roundStats.get(gameId);
  const statistics = calculateRoundStatistics(statsData, game);
  const lastRound = game.roundHistory[game.roundHistory.length - 1];
  if (lastRound) {
    lastRound.statistics = statistics;

    // Add player stats for detailed round summary display
    lastRound.playerStats = game.players.map(player => ({
      playerName: player.name,
      tricksWon: player.tricksWon,
      pointsWon: player.pointsWon,
      redZerosCollected: statsData?.redZerosCollected.get(player.name) || 0,
      brownZerosReceived: statsData?.brownZerosReceived.get(player.name) || 0,
    }));
  }

  // DON'T delete stats yet - we need them for database updates below!

  // Save game state incrementally after each round (conditional on persistence mode)
  try {
    const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
    const createdAt = new Date(createdAtMs);
    await PersistenceManager.saveOrUpdateGame(game, createdAt);
    await PersistenceManager.saveGameParticipants(gameId, game.players, game.persistenceMode);

    // Update round-level stats for NON-BOT players (conditional on persistence mode)
    const humanPlayers = game.players.filter(p => !p.isBot);
    const stats = roundStats.get(gameId);

    for (const player of humanPlayers) {
      const playerTeamId = player.teamId;
      const roundWon = playerTeamId === scoring.offensiveTeamId && scoring.betMade;
      const wasBidder = game.highestBet?.playerName === player.name;

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

      // ========================================================================
      // ACHIEVEMENT INTEGRATION - Check round-level achievements
      // ========================================================================

      // Check bet_won achievements (for bidder whose team made the bet)
      if (wasBidder && scoring.betMade) {
        await triggerAchievementCheck(io, gameId, {
          playerName: player.name,
          gameId,
          eventType: 'bet_won',
          eventData: {
            hadTrump: !game.highestBet?.withoutTrump,
          },
        });

        // Check for perfect bet (exact prediction)
        // offensiveTeamPoints is the points earned by the betting team
        if (scoring.offensiveTeamPoints === scoring.betAmount) {
          await triggerAchievementCheck(io, gameId, {
            playerName: player.name,
            gameId,
            eventType: 'perfect_bet',
          });
        }

        // Check for no-trump bet won
        if (game.highestBet?.withoutTrump) {
          await triggerAchievementCheck(io, gameId, {
            playerName: player.name,
            gameId,
            eventType: 'no_trump_bet_won',
          });
        }
      }

      // Check red zero achievements
      const redZeros = stats?.redZerosCollected.get(player.name) || 0;
      if (redZeros > 0) {
        await triggerAchievementCheck(io, gameId, {
          playerName: player.name,
          gameId,
          eventType: 'red_zero_collected',
        });
      }

      // ========================================================================
      // QUEST PROGRESS - Update after each round (Sprint 19)
      // ========================================================================
      try {
        const roundQuestContext = extractRoundQuestContext(
          game,
          player.name,
          gameId,
          stats,
          scoring
        );

        const questProgressUpdates = await updateRoundQuestProgress(roundQuestContext);

        // Emit progress update to player if any quests made progress
        if (questProgressUpdates.length > 0) {
          const playerSocket = [...io.sockets.sockets.values()].find(
            s => game.players.find(p => p.id === s.id && p.name === player.name)
          );
          if (playerSocket) {
            playerSocket.emit('quest_progress_update', {
              updates: questProgressUpdates,
              source: 'round_complete',
            });
          }
        }
      } catch (questError) {
        console.error(`[Quests] Error updating quest progress for ${player.name}:`, questError);
        // Don't throw - quest errors shouldn't break the game
      }

      // ========================================================================
      // XP/CURRENCY REWARDS - Award for round events
      // ========================================================================
      let roundXpTotal = 0;
      let roundCoinsTotal = 0;

      try {
        // Award for tricks won (5 XP per trick)
        const tricksWon = player.tricksWon || 0;
        if (tricksWon > 0) {
          const result = await awardGameEventReward(player.name, 'trick_won', tricksWon);
          roundXpTotal += result.xpAwarded;
          roundCoinsTotal += result.currencyAwarded;
        }

        // Award for round win/loss (bet success)
        if (roundWon) {
          const result = await awardGameEventReward(player.name, 'round_won');
          roundXpTotal += result.xpAwarded;
          roundCoinsTotal += result.currencyAwarded;
        } else {
          const result = await awardGameEventReward(player.name, 'round_lost');
          roundXpTotal += result.xpAwarded;
          roundCoinsTotal += result.currencyAwarded;
        }

        // Award for successful bet (if player was bidder and made their bet)
        if (wasBidder && scoring.betMade) {
          const result = await awardGameEventReward(player.name, 'bet_made');
          roundXpTotal += result.xpAwarded;
          roundCoinsTotal += result.currencyAwarded;
          // Bonus for "without trump" win
          if (game.highestBet?.withoutTrump) {
            const wtResult = await awardGameEventReward(player.name, 'without_trump_won');
            roundXpTotal += wtResult.xpAwarded;
            roundCoinsTotal += wtResult.currencyAwarded;
          }
        }

        // Award for collecting red zeros (per card)
        const redZerosCollected = stats?.redZerosCollected.get(player.name) || 0;
        if (redZerosCollected > 0) {
          const result = await awardGameEventReward(player.name, 'red_zero_collected', redZerosCollected);
          roundXpTotal += result.xpAwarded;
          roundCoinsTotal += result.currencyAwarded;
        }

        // Award for avoiding brown zeros (if opponent got them)
        const brownZerosReceived = stats?.brownZerosReceived.get(player.name) || 0;
        if (brownZerosReceived === 0 && stats) {
          // Check if any brown zeros were given out this round
          let totalBrownZeros = 0;
          stats.brownZerosReceived.forEach(count => totalBrownZeros += count);
          if (totalBrownZeros > 0) {
            const result = await awardGameEventReward(player.name, 'brown_zero_dodged');
            roundXpTotal += result.xpAwarded;
            roundCoinsTotal += result.currencyAwarded;
          }
        }

        // Emit rewards_earned event to the player
        if (roundXpTotal > 0 || roundCoinsTotal > 0) {
          const playerSocket = connectionManager.getSocketIdForPlayer(player.name);
          if (playerSocket) {
            io.to(playerSocket).emit('rewards_earned', {
              xp: roundXpTotal,
              coins: roundCoinsTotal,
              source: 'round',
              roundNumber: game.roundNumber,
            });
          }
        }
      } catch (rewardError) {
        console.error(`[Rewards] Error awarding round rewards for ${player.name}:`, rewardError);
        // Don't throw - reward errors shouldn't break the game
      }
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
      }

      // ============================================================================
      // ACHIEVEMENT INTEGRATION - Check game-end achievements for human players
      // ============================================================================
      const stats = roundStats.get(gameId);

      for (const player of humanPlayers) {
        const won = player.teamId === winningTeam;
        const playerStats = await getPlayerStats(player.name);

        // Check if this was a comeback (opponent was 30+ points ahead at some point)
        const wasComeback = won && checkIfComeback(game, player.teamId);

        // Check if this was a perfect game (won all bets as betting team)
        const perfectGame = won && checkIfPerfectGame(game, player.teamId);

        if (won) {
          // Trigger game_won achievements
          await triggerAchievementCheck(io, gameId, {
            playerName: player.name,
            gameId,
            eventType: 'game_won',
            eventData: {
              wasComeback,
              perfectGame,
              winStreak: playerStats.current_win_streak || 0,
            },
          });
        }

        // Trigger game_completed achievement (for games played milestone)
        await triggerAchievementCheck(io, gameId, {
          playerName: player.name,
          gameId,
          eventType: 'game_completed',
        });

        // Check secret achievements
        const brownZerosCollected = stats?.brownZerosReceived.get(player.name) || 0;
        // Calculate rounds as lowest scorer (simplified - check round history)
        const roundsAsLowestScorer = countRoundsAsLowestScorer(game, player.name);

        const secretUnlocked = await checkSecretAchievements(player.name, {
          won,
          brownZerosCollected,
          roundsAsLowestScorer,
        });

        // Emit secret achievement unlocks
        for (const achievement of secretUnlocked) {
          await emitAchievementUnlocked(io, gameId, player.name, achievement);
        }
      }

      // ============================================================================
      // QUEST INTEGRATION - Sprint 19: Update quest progress for human players
      // ============================================================================
      for (const player of humanPlayers) {
        try {
          // Extract quest-relevant context from finished game
          const questContext = extractQuestContext(game, player.name, gameId, winningTeam);

          // Update quest progress in database
          const questUpdates = await updateQuestProgress(questContext);

          // Notify player of quest progress updates
          if (questUpdates.length > 0) {
            const playerSocket = connectionManager.getSocketIdForPlayer(player.name);
            if (playerSocket) {
              io.to(playerSocket).emit('quest_progress_update', {
                updates: questUpdates,
              });
            }
          }
        } catch (error) {
          console.error(`[Quests] Error updating quest progress for ${player.name}:`, error);
          // Don't block game completion if quest update fails
        }
      }

      // ========================================================================
      // XP/CURRENCY REWARDS - Award for game completion
      // ========================================================================
      for (const player of humanPlayers) {
        try {
          const won = player.teamId === winningTeam;
          const eventType = won ? 'game_won' : 'game_lost';
          const rewardResult = await awardGameEventReward(player.name, eventType);

          // Emit rewards_earned event for session tracking
          if (rewardResult.success) {
            const playerSocket = connectionManager.getSocketIdForPlayer(player.name);
            if (playerSocket) {
              io.to(playerSocket).emit('rewards_earned', {
                xp: rewardResult.xpAwarded,
                coins: rewardResult.currencyAwarded,
                source: 'game_end',
                won,
              });
            }
          }
        } catch (rewardError) {
          console.error(`[Rewards] Error awarding game rewards for ${player.name}:`, rewardError);
          // Don't throw - reward errors shouldn't break the game
        }
      }

      // ========================================================================
      // LEVEL-UP CHECK - After all XP is awarded, check for level-ups
      // ========================================================================
      for (const player of humanPlayers) {
        try {
          const levelResult = await updatePlayerLevel(player.name);

          if (levelResult.leveledUp) {
            // Check for new skin unlocks
            const skinResult = await checkAndUnlockSkins(player.name);
            // Get all currently unlocked skins
            const allUnlockedSkins = await getPlayerUnlockedSkins(player.name);

            // Emit level_up event to the player
            const playerSocket = connectionManager.getSocketIdForPlayer(player.name);
            if (playerSocket) {
              io.to(playerSocket).emit('player_leveled_up', {
                playerName: player.name,
                oldLevel: levelResult.oldLevel,
                newLevel: levelResult.newLevel,
                newlyUnlockedSkins: skinResult.newlyUnlocked,
                allUnlockedSkins,
              });
              console.log(`[Level Up] ${player.name} leveled up from ${levelResult.oldLevel} to ${levelResult.newLevel}`);
            }
          }
        } catch (levelError) {
          console.error(`[Level Up] Error checking level for ${player.name}:`, levelError);
          // Don't throw - level errors shouldn't break the game
        }
      }
    } catch (error) {
      console.error('Error finalizing game:', error);
    }

    // Clean up round stats after all database updates
    roundStats.delete(gameId);

    // Track when game finished for cleanup (15 min TTL)
    gameFinishTimes.set(gameId, Date.now());

    // Broadcast game_over event BEFORE removing from memory
    broadcastGameUpdate(gameId, 'game_over', { winningTeam, gameState: game });

    // ============================================================================
    // MEMORY OPTIMIZATION: Remove finished games from memory immediately
    // Game is already saved to database, so we only need DB reference for replays
    // ============================================================================

    // Remove from all tracking Maps
    games.delete(gameId);
    gameFinishTimes.delete(gameId);
    gameCreationTimes.delete(gameId);
    previousGameStates.delete(gameId);
  } else {
    // Initialize player ready tracking and round end timestamp
    game.playersReady = [];
    game.roundEndTimestamp = Date.now();

    // Emit round ended
    broadcastGameUpdate(gameId, 'round_ended', game);

    // NOW we can clean up stats after all database updates are complete
    roundStats.delete(gameId);

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
    const snapshots = await loadGameSnapshots();

    for (const snapshot of snapshots) {
      // Validate the game isn't already in memory
      if (!games.has(snapshot.id)) {
        // Restore the game state
        games.set(snapshot.id, snapshot);
        gameCreationTimes.set(snapshot.id, Date.now());

        // Re-establish bot timeouts if needed
        if (snapshot.phase === 'betting' || snapshot.phase === 'playing') {
          const currentPlayer = snapshot.players[snapshot.currentPlayerIndex];
          if (currentPlayer?.isBot) {
            // Give bots a moment to reconnect/play
            setTimeout(() => {
              const game = games.get(snapshot.id);
              if (game && game.phase === snapshot.phase && game.currentPlayerIndex === snapshot.currentPlayerIndex) {
                // Bot will be handled by existing bot logic
              }
            }, 5000);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to restore game snapshots:', error);
  }

  // ============= PERIODIC CLEANUP =============

  // Clean up finished games every 15 minutes (aggressive cleanup for game_over phase)
  setInterval(() => {
    if (games.size === 0) return;

    const now = Date.now();
    const FINISHED_GAME_TTL = 15 * 60 * 1000; // 15 minutes
    let cleanedCount = 0;

    for (const [gameId, game] of games.entries()) {
      // Remove games that have been in game_over phase for 15+ minutes
      if (game.phase === 'game_over') {
        const finishTime = gameFinishTimes.get(gameId);

        if (finishTime) {
          const timeSinceFinish = now - finishTime;

          // Clean up if game has been finished for 15+ minutes
          if (timeSinceFinish > FINISHED_GAME_TTL) {
            games.delete(gameId);
            gameCreationTimes.delete(gameId);
            gameFinishTimes.delete(gameId);
            previousGameStates.delete(gameId);
            roundStats.delete(gameId);
            cleanedCount++;
          }
        }
      }
    }
  }, 900000); // Run every 15 minutes

  // Clean up stale games every hour (ONLY when games exist to reduce DB compute usage)
  setInterval(async () => {
    // Skip cleanup if no games in memory (reduces Neon compute usage)
    if (games.size === 0) {
      return;
    }

    try {
      const staleGames = await cleanupStaleGames();

      // Remove from memory if exists
      for (const staleGame of staleGames) {
        if (games.has(staleGame.game_id)) {
          games.delete(staleGame.game_id);
          gameCreationTimes.delete(staleGame.game_id);
          previousGameStates.delete(staleGame.game_id);
          roundStats.delete(staleGame.game_id);
        }
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

  // ============= RAM USAGE MONITORING =============
  // Log RAM usage every 30 seconds to monitor memory consumption
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    const heapPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    // Warn if memory is high
    if (heapPercent > 80) {
      console.warn(`[RAM] High memory usage: ${heapPercent}% (${heapUsedMB}MB / ${heapTotalMB}MB)`);
    }

    // Critical warning if memory is very high
    if (heapPercent > 90) {
      console.error(`[RAM] CRITICAL memory usage: ${heapPercent}% (${heapUsedMB}MB / ${heapTotalMB}MB)`);
      logger.error('Critical memory usage detected', {
        heapUsedMB,
        heapTotalMB,
        heapPercent,
        rssMB,
        activeGames: games.size,
      });
    }
  }, 30000); // Every 30 seconds

  // ============= PERIODIC STATE SNAPSHOTS =============
  // Save game snapshots every 30 seconds for recovery (ONLY ELO games, NOT casual)
  setInterval(async () => {
    // Skip if no games at all (reduces Neon compute usage)
    if (games.size === 0) {
      return;
    }

    // Only save snapshots for ELO games (casual games are memory-only)
    const eloGames = Array.from(games.values()).filter(
      game => game.phase !== 'game_over' && game.persistenceMode === 'elo'
    );

    if (eloGames.length > 0) {
      for (const game of eloGames) {
        try {
          await saveGameSnapshot(game.id, game);
        } catch (error) {
          console.error(`[Snapshot] Failed to save snapshot for game ${game.id}:`, error);
        }
      }

    }
  }, 30000); // Save every 30 seconds

  // ============= INITIAL CLEANUP =============
  // Run an initial cleanup on startup
  setTimeout(async () => {
    try {
      await cleanupStaleGames();
    } catch (error) {
      console.error('[Startup] Initial cleanup failed:', error);
    }
  }, 5000); // Wait 5 seconds after startup

  // ============= MEMORY MANAGEMENT =============
  // Start memory monitoring and automatic cleanup
  memoryManager.startMonitoring(
    games,
    previousGameStates,
    gameFinishTimes,
    gameCreationTimes,
    () => {
      // Callback after cleanup: force save to database
      queryCache.clear();
      if (global.gc) {
        global.gc(); // Force garbage collection if available
      }
    }
  );
  logger.info('Memory monitoring enabled');
}).on('error', (error: NodeJS.ErrnoException) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});
