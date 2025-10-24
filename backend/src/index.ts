// Sentry must be imported and initialized first
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

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
import { GameState, Player, Bet, TrickCard, Card, PlayerSession } from './types/game';
import { createDeck, shuffleDeck, dealCards } from './game/deck';
import {
  determineWinner,
  calculateTrickPoints,
  calculateRoundScore,
  getHighestBet,
  isBetHigher,
} from './game/logic';
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
  cleanupAbandonedGames,
} from './db';
import {
  saveGameState as saveGameToDB,
  loadGameState as loadGameFromDB,
  deleteGameState as deleteGameFromDB,
  listActiveGames,
  getPlayerGames
} from './db/gameState';
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
});

// Configure CORS for Express
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

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

  // Remove from database (async)
  try {
    await deleteGameFromDB(gameId);
  } catch (error) {
    console.error(`Failed to delete game ${gameId} from database:`, error);
  }
}

/**
 * Helper to emit game_updated event AND persist to database
 * Use this instead of direct io.to().emit() calls for consistency
 *
 * Debounces database saves to prevent race conditions when multiple rapid updates occur
 * (e.g., when multiple bots reconnect simultaneously)
 */
function emitGameUpdate(gameId: string, gameState: GameState) {
  // Emit socket event immediately
  io.to(gameId).emit('game_updated', gameState);

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

const cleanup = () => {
  if (onlinePlayersInterval) {
    clearInterval(onlinePlayersInterval);
  }
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
    if (currentPlayer.name !== playerName || game.phase !== phase) {
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
  activeTimeouts.set(`${key}-interval`, countdownInterval as any);
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
    game.currentPlayerIndex = highestBidderIndex;
    emitGameUpdate(gameId, game);
    startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].name, 'playing');
  } else {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
    emitGameUpdate(gameId, game);
    startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].name, 'betting');
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

  // Determine valid cards
  let validCards = currentPlayer.hand;
  if (game.currentTrick.length > 0) {
    const ledSuit = game.currentTrick[0].card.color;
    const cardsInLedSuit = currentPlayer.hand.filter(c => c.color === ledSuit);
    if (cardsInLedSuit.length > 0) {
      validCards = cardsInLedSuit;
    }
  }

  // Pick random valid card
  const randomCard = validCards[Math.floor(Math.random() * validCards.length)];

  if (!randomCard) {
    console.error(`No valid cards found for ${currentPlayer.name}`);
    return;
  }

  console.log(`Auto-playing: ${randomCard.color} ${randomCard.value}`);

  // Set trump on first card
  if (game.currentTrick.length === 0 && !game.trump) {
    game.trump = randomCard.color;
  }

  // Add card to trick (include both playerId and playerName)
  game.currentTrick.push({
    playerId: player.id,
    playerName: player.name,
    card: randomCard
  });

  // Remove card from player's hand
  currentPlayer.hand = currentPlayer.hand.filter(
    (c) => !(c.color === randomCard.color && c.value === randomCard.value)
  );

  // Move to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

  // Check if trick is complete
  if (game.currentTrick.length === 4) {
    emitGameUpdate(gameId, game);
    resolveTrick(gameId);
  } else {
    emitGameUpdate(gameId, game);
    startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].name, 'playing');
  }
}

// Helper to broadcast to both players and spectators
function broadcastGameUpdate(gameId: string, event: string, data: GameState | { winnerId: string; points: number; gameState: GameState } | { winningTeam: 1 | 2; gameState: GameState }) {
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

// REST endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: process.env.DATABASE_URL ? 'configured' : 'missing',
    cors: corsOrigin,
  });
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
        // Load full game state from DB
        const fullGame = await loadGameFromDB(dbGame.gameId);
        if (fullGame) {
          gameMap.set(fullGame.id, fullGame);
        }
      }
    }

    const activeGames = Array.from(gameMap.values()).map((game: GameState) => {
      // Get actual player count (not including bots unless specified)
      const humanPlayerCount = game.players.filter((p: Player) => !p.isBot).length;
      const botPlayerCount = game.players.filter((p: Player) => p.isBot).length;

      // Check if game is joinable
      const isJoinable = game.phase === 'team_selection' && game.players.length < 4;

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
    });

    // Sort by joinable first, then by creation time (newest first)
    activeGames.sort((a, b) => {
      if (a.isJoinable && !b.isJoinable) return -1;
      if (!a.isJoinable && b.isJoinable) return 1;
      return b.createdAt - a.createdAt;
    });

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
    const gameMap = new Map<string, any>();
    dbGames.forEach((g: any) => gameMap.set(g.gameId, g));
    inMemoryGames.forEach((g: any) => gameMap.set(g.gameId, g));

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

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_game', async (playerName: string) => {
    const gameId = Math.random().toString(36).substring(7).toUpperCase();
    const player: Player = {
      id: socket.id,
      name: playerName,
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
  });

  socket.on('join_game', async ({ gameId, playerName, isBot }: { gameId: string; playerName: string; isBot?: boolean }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Check if player is trying to rejoin with same name
    const existingPlayer = game.players.find(p => p.name === playerName);
    if (existingPlayer) {
      console.log(`Player ${playerName} attempting to rejoin game ${gameId} (isBot: ${existingPlayer.isBot})`);

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
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    const teamId = game.players.length % 2 === 0 ? 1 : 2;
    const player: Player = {
      id: socket.id,
      name: playerName,
      teamId: teamId as 1 | 2,
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
      isBot: isBot || false,
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
  });

  socket.on('select_team', ({ gameId, teamId }: { gameId: string; teamId: 1 | 2 }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validateTeamSelection(game, socket.id, teamId);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function
    applyTeamSelection(game, socket.id, teamId);

    // I/O - Emit updates
    emitGameUpdate(gameId, game);
  });

  socket.on('swap_position', ({ gameId, targetPlayerId }: { gameId: string; targetPlayerId: string }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validatePositionSwap(game, socket.id, targetPlayerId);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // STATE TRANSFORMATION - Use pure state function
    applyPositionSwap(game, socket.id, targetPlayerId);

    // I/O - Emit updates
    emitGameUpdate(gameId, game);
  });

  // Team selection chat
  socket.on('send_team_selection_chat', ({ gameId, message }: { gameId: string; message: string }) => {
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

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Chat only available during team selection' });
      return;
    }

    // Sanitize and limit message length
    const sanitizedMessage = message.trim().substring(0, 200);
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
  });

  // In-game chat (betting, playing, and scoring phases)
  socket.on('send_game_chat', ({ gameId, message }: { gameId: string; message: string }) => {
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

    if (game.phase !== 'betting' && game.phase !== 'playing' && game.phase !== 'scoring') {
      socket.emit('error', { message: 'Chat only available during gameplay' });
      return;
    }

    // Sanitize and limit message length
    const sanitizedMessage = message.trim().substring(0, 200);
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
  });

  // Player ready for next round
  socket.on('player_ready', ({ gameId }: { gameId: string }) => {
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
  });

  socket.on('start_game', ({ gameId }: { gameId: string }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // VALIDATION - Use pure validation function
    const validation = validateGameStart(game);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // Side effects - Update online player statuses
    game.players.forEach(player => {
      updateOnlinePlayer(player.id, player.name, 'in_game', gameId);
    });

    // Start the game (handles state transitions and I/O)
    startNewRound(gameId);
  });

  socket.on('place_bet', ({ gameId, amount, withoutTrump, skipped }: { gameId: string; amount: number; withoutTrump: boolean; skipped?: boolean }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) return;

    // VALIDATION - Use pure validation function
    const validation = validateBet(game, socket.id, amount, withoutTrump, skipped);
    if (!validation.valid) {
      socket.emit('invalid_bet', { message: validation.error });
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
  });

  socket.on('play_card', ({ gameId, card }: { gameId: string; card: Card }) => {
    // Basic validation: game exists
    const game = games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;

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
    if (!validation.valid) {
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
      const playerTimes = stats.cardPlayTimes.get(socket.id) || [];
      playerTimes.push(playTime);
      stats.cardPlayTimes.set(socket.id, playerTimes);

      // Track trump card usage (check BEFORE trump is set)
      if (game.trump && card.color === game.trump) {
        const trumpCount = stats.trumpsPlayed.get(socket.id) || 0;
        stats.trumpsPlayed.set(socket.id, trumpCount + 1);
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
      console.log(`   🎯 Trick complete! Turn advanced: ${game.players[result.previousPlayerIndex].name} → ${game.players[game.currentPlayerIndex].name}`);
      console.log(`   Final trick state before resolution:`);
      game.currentTrick.forEach((tc, idx) => {
        const player = game.players.find(p => p.id === tc.playerId);
        console.log(`     ${idx + 1}. ${player?.name}: ${tc.card.color} ${tc.card.value}`);
      });
      // Emit game_updated so clients see the 4th card added
      emitGameUpdate(gameId, game);
      console.log(`   ⏳ Resolving trick in 100ms to allow clients to render...\n`);
      // Small delay to ensure clients render the 4-card state before resolution
      setTimeout(() => {
        resolveTrick(gameId);
      }, 100);
      // Note: timeout will be started by resolveTrick after 2-second delay
    } else {
      // Emit updated state with turn advanced
      console.log(`   ➡️  Turn advanced: ${game.players[result.previousPlayerIndex].name} → ${game.players[game.currentPlayerIndex].name} (${game.currentTrick.length}/4 cards played)\n`);
      emitGameUpdate(gameId, game);
      // Start timeout for next player
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'playing');
    }
  });

  // Spectator mode - join game as observer
  socket.on('spectate_game', ({ gameId, spectatorName }: { gameId: string; spectatorName?: string }) => {
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
  });

  // Leave spectator mode
  socket.on('leave_spectate', ({ gameId }: { gameId: string }) => {
    socket.leave(`${gameId}-spectators`);
    console.log(`Spectator ${socket.id} left game ${gameId}`);

    // Notify remaining players
    io.to(gameId).emit('spectator_update', {
      message: 'A spectator left',
      spectatorCount: io.sockets.adapter.rooms.get(`${gameId}-spectators`)?.size || 0
    });

    socket.emit('spectator_left', { success: true });
  });

  // Test-only handler to set scores
  socket.on('__test_set_scores', ({ team1, team2 }: { team1: number; team2: number }) => {
    // Find game for this socket
    games.forEach((game) => {
      if (game.players.some(p => p.id === socket.id)) {
        game.teamScores.team1 = team1;
        game.teamScores.team2 = team2;
        console.log(`TEST: Set scores to Team1=${team1}, Team2=${team2}`);
        emitGameUpdate(game.id, game);
      }
    });
  });

  // Leave game handler
  socket.on('leave_game', async ({ gameId }: { gameId: string }) => {
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
  });

  // Kick player handler
  socket.on('kick_player', async ({ gameId, playerId }: { gameId: string; playerId: string }) => {
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
  });

  // Reconnection handler
  socket.on('reconnect_to_game', async ({ token }: { token: string }) => {
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
  });

  // Handle rematch vote
  socket.on('vote_rematch', ({ gameId }: { gameId: string }) => {
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
  });

  // ============= STATS & LEADERBOARD EVENTS =============

  // Get player statistics
  socket.on('get_player_stats', async ({ playerName }: { playerName: string }) => {
    try {
      const stats = await getPlayerStats(playerName);
      socket.emit('player_stats_response', { stats, playerName });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      socket.emit('error', { message: 'Failed to fetch player statistics' });
    }
  });

  // Get global leaderboard
  socket.on('get_leaderboard', async ({ limit = 100, excludeBots = true }: { limit?: number; excludeBots?: boolean }) => {
    try {
      const leaderboard = await getLeaderboard(limit, excludeBots);
      socket.emit('leaderboard_response', { players: leaderboard });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      socket.emit('error', { message: 'Failed to fetch leaderboard' });
    }
  });

  // Get player game history
  socket.on('get_player_history', async ({ playerName, limit = 20 }: { playerName: string; limit?: number }) => {
    try {
      const history = await getPlayerGameHistory(playerName, limit);
      socket.emit('player_history_response', { games: history, playerName });
    } catch (error) {
      console.error('Error fetching player history:', error);
      socket.emit('error', { message: 'Failed to fetch player game history' });
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);

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

    // Don't immediately remove player - give 15 minutes grace period for reconnection (mobile AFK)
    console.log(`Player ${socket.id} disconnected. Waiting for reconnection...`);

    // Notify other players of disconnection
    io.to(playerGameId).emit('player_disconnected', {
      playerId: socket.id,
      waitingForReconnection: true
    });

    // Set timeout to remove player if they don't reconnect
    const disconnectTimeout = setTimeout(async () => {
      const game = games.get(playerGameId!);
      if (!game) {
        disconnectTimeouts.delete(socket.id);
        return;
      }

      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        // Player didn't reconnect - remove them
        const playerIndex = game.players.findIndex((p) => p.id === socket.id);
        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);
          io.to(playerGameId!).emit('player_left', { playerId: socket.id, gameState: game });
          console.log(`Player ${socket.id} removed from game ${playerGameId} (no reconnection)`);

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
      stats.cardPlayTimes.set(player.id, []);
      stats.trumpsPlayed.set(player.id, 0);
      stats.redZerosCollected.set(player.id, 0);
      stats.brownZerosReceived.set(player.id, 0);
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
  const game = games.get(gameId);
  if (!game) return;

  // 1. PURE CALCULATION - Determine winner and points
  const winnerId = determineWinner(game.currentTrick, game.trump);
  const specialCardPoints = calculateTrickPoints(game.currentTrick);
  const totalPoints = 1 + specialCardPoints;

  // Look up winner's name (stable identifier) from the trick
  const winningTrickCard = game.currentTrick.find(tc => tc.playerId === winnerId);
  const winnerName = winningTrickCard?.playerName ||
                     game.players.find(p => p.id === winnerId)?.name ||
                     winnerId;

  // 2. SIDE EFFECT - Track special card stats for round statistics (use stable playerName)
  const stats = roundStats.get(gameId);
  if (stats) {
    // Check if trick contains red 0 (worth +5 points)
    const hasRedZero = game.currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
    if (hasRedZero) {
      const redZeroCount = stats.redZerosCollected.get(winnerName) || 0;
      stats.redZerosCollected.set(winnerName, redZeroCount + 1);
    }

    // Check if trick contains brown 0 (worth -2 points)
    const hasBrownZero = game.currentTrick.some(tc => tc.card.color === 'brown' && tc.card.value === 0);
    if (hasBrownZero) {
      const brownZeroCount = stats.brownZerosReceived.get(winnerName) || 0;
      stats.brownZerosReceived.set(winnerName, brownZeroCount + 1);
    }
  }

  // 3. STATE TRANSFORMATION - Apply trick resolution (use stable playerName)
  // applyTrickResolution now keeps currentTrick visible (doesn't clear it)
  const result = applyTrickResolution(game, winnerName, totalPoints);

  // 4. I/O - Emit trick resolution event with trick still visible
  broadcastGameUpdate(gameId, 'trick_resolved', { winnerId, winnerName, points: totalPoints, gameState: game });

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
  let fastestPlayerId: string | null = null;
  let fastestAvgTime = Infinity;

  stats.cardPlayTimes.forEach((times, playerId) => {
    if (times.length > 0) {
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      if (avgTime < fastestAvgTime) {
        fastestAvgTime = avgTime;
        fastestPlayerId = playerId;
      }
    }
  });

  if (fastestPlayerId) {
    const player = game.players.find(p => p.id === fastestPlayerId);
    if (player) {
      statistics.fastestPlay = {
        playerId: fastestPlayerId,
        playerName: player.name,
        timeMs: Math.round(fastestAvgTime),
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
  let trumpMasterId: string | null = null;
  let maxTrumps = 0;

  stats.trumpsPlayed.forEach((count, playerId) => {
    if (count > maxTrumps) {
      maxTrumps = count;
      trumpMasterId = playerId;
    }
  });

  if (trumpMasterId && maxTrumps > 0) {
    const player = game.players.find(p => p.id === trumpMasterId);
    if (player) {
      statistics.trumpMaster = {
        playerId: trumpMasterId,
        playerName: player.name,
        trumpsPlayed: maxTrumps,
      };
    }
  }

  // 4. Lucky Player - player who won most points with fewest tricks
  let luckyPlayerId: string | null = null;
  let bestPointsPerTrick = 0;

  game.players.forEach(player => {
    if (player.tricksWon > 0) {
      const pointsPerTrick = player.pointsWon / player.tricksWon;
      if (pointsPerTrick > bestPointsPerTrick) {
        bestPointsPerTrick = pointsPerTrick;
        luckyPlayerId = player.id;
      }
    }
  });

  if (luckyPlayerId && bestPointsPerTrick > 1.5) { // Only award if significantly lucky (>1.5 pts/trick)
    const player = game.players.find(p => p.id === luckyPlayerId);
    if (player) {
      statistics.luckyPlayer = {
        playerId: luckyPlayerId,
        playerName: player.name,
        reason: `${bestPointsPerTrick.toFixed(1)} pts/trick`,
      };
    }
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
        redZerosCollected: stats?.redZerosCollected.get(player.id) || 0,
        brownZerosReceived: stats?.brownZerosReceived.get(player.id) || 0,
        trumpsPlayed: stats?.trumpsPlayed.get(player.id) || 0,
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

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 Trick Card Game Server running on ${HOST}:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 CORS: ${corsOrigin === '*' ? 'All origins' : allowedOrigins.join(', ')}`);
  }
}).on('error', (error: NodeJS.ErrnoException) => {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
});
