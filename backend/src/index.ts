import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
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
import { saveGameHistory, getRecentGames } from './db';

dotenv.config();

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

// Session storage for reconnection (maps token to session data)
const playerSessions = new Map<string, PlayerSession>();

// Timeout storage (maps gameId-playerId to timeout ID)
const activeTimeouts = new Map<string, NodeJS.Timeout>();

// Disconnect timeout storage (maps socket.id to timeout ID)
const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

// Online players tracking
interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

const onlinePlayers = new Map<string, OnlinePlayer>();

// Timeout configuration
const BETTING_TIMEOUT = 60000; // 60 seconds
const PLAYING_TIMEOUT = 60000; // 60 seconds

// Helper to generate secure random token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
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
setInterval(broadcastOnlinePlayers, 5000);

// Helper to clear timeout for a player
function clearPlayerTimeout(gameId: string, playerId: string) {
  const key = `${gameId}-${playerId}`;
  const timeout = activeTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(key);
  }
}

// Helper to start timeout for current player
function startPlayerTimeout(gameId: string, playerId: string, phase: 'betting' | 'playing') {
  const key = `${gameId}-${playerId}`;

  // Clear any existing timeout for this player
  clearPlayerTimeout(gameId, playerId);

  const timeoutDuration = phase === 'betting' ? BETTING_TIMEOUT : PLAYING_TIMEOUT;

  const timeout = setTimeout(() => {
    const game = games.get(gameId);
    if (!game) return;

    const player = game.players.find(p => p.id === playerId);
    if (!player) return;

    console.log(`⏰ Timeout: ${player.name} (${playerId}) in ${phase} phase`);

    if (phase === 'betting') {
      handleBettingTimeout(gameId, playerId);
    } else {
      handlePlayingTimeout(gameId, playerId);
    }
  }, timeoutDuration);

  activeTimeouts.set(key, timeout);
}

// Handle betting timeout - auto-skip bet
function handleBettingTimeout(gameId: string, playerId: string) {
  const game = games.get(gameId);
  if (!game || game.phase !== 'betting') return;

  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return; // Not their turn anymore

  const hasAlreadyBet = game.currentBets.some(b => b.playerId === playerId);
  if (hasAlreadyBet) return; // Already bet

  console.log(`Auto-skipping bet for ${currentPlayer.name} due to timeout`);

  const isDealer = game.currentPlayerIndex === game.dealerIndex;
  const hasValidBets = game.currentBets.some(b => !b.skipped);

  // If dealer and no valid bets, must bet minimum 7
  if (isDealer && !hasValidBets) {
    const bet: Bet = {
      playerId,
      amount: 7,
      withoutTrump: false,
      skipped: false,
    };
    game.currentBets.push(bet);
    console.log(`Auto-bet 7 points for dealer ${currentPlayer.name}`);
  } else {
    // Skip the bet
    const bet: Bet = {
      playerId,
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
      io.to(gameId).emit('game_updated', game);
      io.to(gameId).emit('error', { message: 'All players skipped. Betting restarts.' });
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
      return;
    }

    const dealerPlayerId = game.players[game.dealerIndex].id;
    game.highestBet = getHighestBet(game.currentBets, dealerPlayerId);
    game.phase = 'playing';
    const highestBidderIndex = game.players.findIndex(
      (p) => p.id === game.highestBet?.playerId
    );
    game.currentPlayerIndex = highestBidderIndex;
    io.to(gameId).emit('game_updated', game);
    startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'playing');
  } else {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
    io.to(gameId).emit('game_updated', game);
    startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
  }
}

// Handle playing timeout - auto-play random valid card
function handlePlayingTimeout(gameId: string, playerId: string) {
  const game = games.get(gameId);
  if (!game || game.phase !== 'playing') return;

  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return; // Not their turn anymore

  const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerId === playerId);
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

  // Add card to trick
  game.currentTrick.push({ playerId, card: randomCard });

  // Remove card from player's hand
  currentPlayer.hand = currentPlayer.hand.filter(
    (c) => !(c.color === randomCard.color && c.value === randomCard.value)
  );

  // Move to next player
  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

  // Check if trick is complete
  if (game.currentTrick.length === 4) {
    io.to(gameId).emit('game_updated', game);
    resolveTrick(gameId);
  } else {
    io.to(gameId).emit('game_updated', game);
    startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'playing');
  }
}

// Helper to broadcast to both players and spectators
function broadcastGameUpdate(gameId: string, event: string, data: any) {
  // Send full data to players
  io.to(gameId).emit(event, data);

  // Send spectator-safe data to spectators (hide player hands)
  if (data && data.players) {
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
      socket: '/socket.io'
    }
  });
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

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create_game', (playerName: string) => {
    const gameId = Math.random().toString(36).substring(7).toUpperCase();
    const player: Player = {
      id: socket.id,
      name: playerName,
      teamId: 1,
      hand: [],
      tricksWon: 0,
      pointsWon: 0,
    };

    const gameState: GameState = {
      id: gameId,
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

    games.set(gameId, gameState);
    socket.join(gameId);

    // Create session for reconnection
    const session = createPlayerSession(gameId, socket.id, playerName);

    // Track online player status
    updateOnlinePlayer(socket.id, playerName, 'in_team_selection', gameId);

    socket.emit('game_created', { gameId, gameState, session });
  });

  socket.on('join_game', ({ gameId, playerName, isBot }: { gameId: string; playerName: string; isBot?: boolean }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
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

    // Create session for reconnection
    const session = createPlayerSession(gameId, socket.id, playerName);

    // Track online player status
    updateOnlinePlayer(socket.id, playerName, 'in_team_selection', gameId);

    io.to(gameId).emit('player_joined', { player, gameState: game, session });
  });

  socket.on('select_team', ({ gameId, teamId }: { gameId: string; teamId: 1 | 2 }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Cannot select team - game has already started' });
      return;
    }

    const player = game.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    // Validate teamId is 1 or 2
    if (teamId !== 1 && teamId !== 2) {
      socket.emit('error', { message: 'Invalid team ID' });
      return;
    }

    // Check if team has space (max 2 players per team)
    const teamCount = game.players.filter(p => p.teamId === teamId).length;
    if (teamCount >= 2 && player.teamId !== teamId) {
      socket.emit('error', { message: 'Team is full' });
      return;
    }

    player.teamId = teamId;
    io.to(gameId).emit('game_updated', game);
  });

  socket.on('swap_position', ({ gameId, targetPlayerId }: { gameId: string; targetPlayerId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Cannot swap positions - game has already started' });
      return;
    }

    const currentPlayer = game.players.find(p => p.id === socket.id);
    const targetPlayer = game.players.find(p => p.id === targetPlayerId);

    if (!currentPlayer) {
      socket.emit('error', { message: 'You are not in this game' });
      return;
    }

    if (!targetPlayer) {
      socket.emit('error', { message: 'Target player not found' });
      return;
    }

    if (currentPlayer.id === targetPlayer.id) {
      socket.emit('error', { message: 'Cannot swap with yourself' });
      return;
    }

    // Swap positions in the players array
    const currentIndex = game.players.indexOf(currentPlayer);
    const targetIndex = game.players.indexOf(targetPlayer);

    game.players[currentIndex] = targetPlayer;
    game.players[targetIndex] = currentPlayer;

    io.to(gameId).emit('game_updated', game);
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

  // In-game chat (betting and playing phases)
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

    if (game.phase !== 'betting' && game.phase !== 'playing') {
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

  socket.on('start_game', ({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    if (game.phase !== 'team_selection') {
      socket.emit('error', { message: 'Game has already started' });
      return;
    }

    if (game.players.length !== 4) {
      socket.emit('error', { message: 'Need exactly 4 players to start' });
      return;
    }

    // Validate teams are balanced (2v2)
    const team1Count = game.players.filter(p => p.teamId === 1).length;
    const team2Count = game.players.filter(p => p.teamId === 2).length;

    if (team1Count !== 2 || team2Count !== 2) {
      socket.emit('error', { message: 'Teams must be balanced (2 players per team)' });
      return;
    }

    // Update all players' status to in_game
    game.players.forEach(player => {
      updateOnlinePlayer(player.id, player.name, 'in_game', gameId);
    });

    startNewRound(gameId);
  });

  socket.on('place_bet', ({ gameId, amount, withoutTrump, skipped }: { gameId: string; amount: number; withoutTrump: boolean; skipped?: boolean }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'betting') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) {
      socket.emit('invalid_bet', {
        message: 'It is not your turn to bet'
      });
      return;
    }

    // Check if player has already bet
    const hasAlreadyBet = game.currentBets.some(b => b.playerId === socket.id);
    if (hasAlreadyBet) {
      console.log(`Player ${socket.id} attempted to bet multiple times`);
      socket.emit('invalid_bet', {
        message: 'You have already placed your bet'
      });
      return;
    }

    // Clear timeout for current player (they took action)
    clearPlayerTimeout(gameId, socket.id);

    const isDealer = game.currentPlayerIndex === game.dealerIndex;

    // Validate bet amount range (only for non-skip bets)
    if (!skipped && (amount < 7 || amount > 12)) {
      socket.emit('invalid_bet', {
        message: 'Bet amount must be between 7 and 12'
      });
      return;
    }

    // Handle skip bet
    if (skipped) {
      // Check if there are any non-skipped bets
      const hasValidBets = game.currentBets.some(b => !b.skipped);

      // Dealer cannot skip ONLY if no one has bet (all skipped or no bets) - must bet minimum 7
      if (isDealer && !hasValidBets) {
        socket.emit('invalid_bet', {
          message: 'As dealer, you must bet at least 7 points when no one has bet.'
        });
        return;
      }

      // Add the skip bet
      const bet: Bet = {
        playerId: socket.id,
        amount: -1,
        withoutTrump: false,
        skipped: true,
      };

      game.currentBets.push(bet);

      // If all 4 players skip, restart betting with first player after dealer
      if (game.currentBets.length === 4 && game.currentBets.every(b => b.skipped)) {
        game.currentBets = [];
        game.currentPlayerIndex = (game.dealerIndex + 1) % 4;
        io.to(gameId).emit('game_updated', game);
        io.to(gameId).emit('error', { message: 'All players skipped. Betting restarts.' });
        // Start timeout for first player after betting restart
        startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
        return;
      }

      // Check if all 4 players have bet (including skips)
      if (game.currentBets.length === 4) {
        const dealerPlayerId = game.players[game.dealerIndex].id;
        game.highestBet = getHighestBet(game.currentBets, dealerPlayerId);
        game.phase = 'playing';
        const highestBidderIndex = game.players.findIndex(
          (p) => p.id === game.highestBet?.playerId
        );
        game.currentPlayerIndex = highestBidderIndex;
        io.to(gameId).emit('game_updated', game);
        // Start timeout for first card play
        startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'playing');
        return;
      }

      // Move to next player
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
      io.to(gameId).emit('game_updated', game);
      // Start timeout for next player's bet
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
      return;
    }

    // Validate betting rules for non-skip bets
    if (game.currentBets.length > 0) {
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
          // If same amount, dealer can match even if current highest is withoutTrump
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

    const bet: Bet = {
      playerId: socket.id,
      amount,
      withoutTrump,
      skipped: false,
    };

    game.currentBets.push(bet);

    if (game.currentBets.length === 4) {
      const dealerPlayerId = game.players[game.dealerIndex].id;
      game.highestBet = getHighestBet(game.currentBets, dealerPlayerId);
      game.phase = 'playing';
      const highestBidderIndex = game.players.findIndex(
        (p) => p.id === game.highestBet?.playerId
      );
      game.currentPlayerIndex = highestBidderIndex;
      io.to(gameId).emit('game_updated', game);
      // Start timeout for first card play
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'playing');
    } else {
      // Move to next player
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
      io.to(gameId).emit('game_updated', game);
      // Start timeout for next player's bet
      startPlayerTimeout(gameId, game.players[game.currentPlayerIndex].id, 'betting');
    }
  });

  socket.on('play_card', ({ gameId, card }: { gameId: string; card: Card }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    const playerName = game.players.find(p => p.id === socket.id)?.name || socket.id;

    // Log current trick state and player's hand
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

    // Check if player has already played a card in this trick FIRST (before any other checks)
    const hasAlreadyPlayed = game.currentTrick.some(tc => tc.playerId === socket.id);
    if (hasAlreadyPlayed) {
      console.log(`   ❌ REJECTED: Player has already played in this trick`);
      socket.emit('invalid_move', {
        message: 'You have already played a card this trick'
      });
      return;
    }

    // Prevent playing when trick is complete (4 cards already played)
    if (game.currentTrick.length >= 4) {
      console.log(`   ❌ REJECTED: Trick is complete (${game.currentTrick.length}/4 cards)`);
      socket.emit('invalid_move', {
        message: 'Please wait for the current trick to be resolved'
      });
      return;
    }

    if (currentPlayer.id !== socket.id) {
      console.log(`   ❌ REJECTED: Not player's turn (current: ${currentPlayer.name}, requestor: ${playerName})`);

      socket.emit('invalid_move', {
        message: 'It is not your turn'
      });
      return;
    }

    // Clear timeout for current player (they took action)
    clearPlayerTimeout(gameId, socket.id);

    // Validate card data structure
    if (!card || !card.color || card.value === undefined) {
      console.log(`Player ${socket.id} sent invalid card data:`, card);
      socket.emit('invalid_move', {
        message: 'Invalid card data'
      });
      return;
    }

    // Validate that card is in player's hand
    const cardInHand = currentPlayer.hand.find(
      c => c.color === card.color && c.value === card.value
    );
    if (!cardInHand) {
      console.log(`Player ${socket.id} attempted to play card not in hand:`, card);
      socket.emit('invalid_move', {
        message: 'You do not have that card in your hand'
      });
      return;
    }

    // Validate suit-following rule
    if (game.currentTrick.length > 0) {
      const ledSuit = game.currentTrick[0].card.color;
      const hasLedSuit = currentPlayer.hand.some((c) => c.color === ledSuit);

      // If player has the led suit, they must play it
      if (hasLedSuit && card.color !== ledSuit) {
        socket.emit('invalid_move', {
          message: 'You must follow suit if you have it in your hand'
        });
        return;
      }
    }

    // Set trump on first card
    if (game.currentTrick.length === 0 && !game.trump) {
      game.trump = card.color;
    }

    // Add card to trick
    game.currentTrick.push({ playerId: socket.id, card });
    console.log(`   ✅ ACCEPTED: Card added to trick (now ${game.currentTrick.length}/4 cards)`);

    // Remove card from player's hand
    currentPlayer.hand = currentPlayer.hand.filter(
      (c) => !(c.color === card.color && c.value === card.value)
    );
    console.log(`   Updated hand (${currentPlayer.hand.length} cards remaining):`);
    currentPlayer.hand.forEach((c, idx) => {
      console.log(`     ${idx + 1}. ${c.color} ${c.value}`);
    });

    // Move to next player IMMEDIATELY (before resolving trick)
    const previousIndex = game.currentPlayerIndex;
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;

    // Check if trick is complete
    if (game.currentTrick.length === 4) {
      // Emit state with all 4 cards played and turn advanced
      console.log(`   🎯 Trick complete! Turn advanced: ${game.players[previousIndex].name} → ${game.players[game.currentPlayerIndex].name}`);
      console.log(`   Final trick state before resolution:`);
      game.currentTrick.forEach((tc, idx) => {
        const player = game.players.find(p => p.id === tc.playerId);
        console.log(`     ${idx + 1}. ${player?.name}: ${tc.card.color} ${tc.card.value}`);
      });
      io.to(gameId).emit('game_updated', game);
      console.log(`   ⏳ Resolving trick...\n`);
      resolveTrick(gameId);
      // Note: timeout will be started by resolveTrick after 3-second delay
    } else {
      // Emit updated state with turn advanced
      console.log(`   ➡️  Turn advanced: ${game.players[previousIndex].name} → ${game.players[game.currentPlayerIndex].name} (${game.currentTrick.length}/4 cards played)\n`);
      io.to(gameId).emit('game_updated', game);
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
        io.to(game.id).emit('game_updated', game);
      }
    });
  });

  // Leave game handler
  socket.on('leave_game', ({ gameId }: { gameId: string }) => {
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

    // Remove player from game
    const playerIndex = game.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1);
      console.log(`Player ${player.name} (${socket.id}) left game ${gameId}`);

      // Leave the game room
      socket.leave(gameId);

      // Notify remaining players
      io.to(gameId).emit('player_left', { playerId: socket.id, gameState: game });

      // If game is empty, delete it
      if (game.players.length === 0) {
        games.delete(gameId);
        console.log(`Game ${gameId} deleted (no players remaining)`);
      }

      // Confirm to the leaving player
      socket.emit('leave_game_success', { success: true });
    }
  });

  // Reconnection handler
  socket.on('reconnect_to_game', ({ token }: { token: string }) => {
    console.log('Reconnection attempt with token:', token.substring(0, 10) + '...');

    const session = validateSessionToken(token);
    if (!session) {
      socket.emit('reconnection_failed', { message: 'Invalid or expired session token' });
      return;
    }

    const game = games.get(session.gameId);
    if (!game) {
      socket.emit('reconnection_failed', { message: 'Game no longer exists' });
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
      playerSessions.delete(token);
      return;
    }

    // Update player's socket ID
    const oldSocketId = player.id;
    player.id = socket.id;

    // Update session with new socket ID and timestamp
    session.playerId = socket.id;
    session.timestamp = Date.now();

    // Join game room
    socket.join(session.gameId);

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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove from online players
    onlinePlayers.delete(socket.id);

    // Find player's game and session
    let playerGame: GameState | null = null;
    let playerGameId: string | null = null;

    games.forEach((game, gameId) => {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) {
        playerGame = game;
        playerGameId = gameId;
      }
    });

    if (!playerGame || !playerGameId) {
      return; // Player not in any game
    }

    // Don't immediately remove player - give 15 minutes grace period for reconnection (mobile AFK)
    console.log(`Player ${socket.id} disconnected. Waiting for reconnection...`);

    // Notify other players of disconnection
    io.to(playerGameId).emit('player_disconnected', {
      playerId: socket.id,
      waitingForReconnection: true
    });

    // Set timeout to remove player if they don't reconnect
    const disconnectTimeout = setTimeout(() => {
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

  const winnerId = determineWinner(game.currentTrick, game.trump);
  const specialCardPoints = calculateTrickPoints(game.currentTrick);
  const totalPoints = 1 + specialCardPoints;

  const winner = game.players.find((p) => p.id === winnerId);
  if (winner) {
    winner.tricksWon += 1;
    // Award 1 point for winning trick + special card points
    winner.pointsWon += totalPoints;
  }

  // Store current trick as previous trick before clearing
  const trickResult = {
    trick: [...game.currentTrick],
    winnerId,
    points: totalPoints,
  };
  game.previousTrick = trickResult;

  // Add trick to current round's trick history
  game.currentRoundTricks.push(trickResult);

  // Emit trick resolution with updated state (showing trick result for 3 seconds)
  broadcastGameUpdate(gameId, 'trick_resolved', { winnerId, points: totalPoints, gameState: game });

  // Wait 3 seconds before clearing trick and continuing
  setTimeout(() => {
    game.currentTrick = [];
    game.currentPlayerIndex = game.players.findIndex((p) => p.id === winnerId);

    // Check if round is over (all cards played)
    if (game.players.every((p) => p.hand.length === 0)) {
      endRound(gameId);
    } else {
      // Continue playing - emit game state for next turn
      io.to(gameId).emit('game_updated', game);
      // Start timeout for trick winner's next card
      startPlayerTimeout(gameId, winnerId, 'playing');
    }
  }, 3000);
}

async function endRound(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  game.phase = 'scoring';

  // Find offensive team (highest bet winner)
  if (!game.highestBet) return;

  const offensivePlayer = game.players.find(p => p.id === game.highestBet?.playerId);
  if (!offensivePlayer) return;

  const offensiveTeamId = offensivePlayer.teamId;
  const defensiveTeamId = offensiveTeamId === 1 ? 2 : 1;

  // Calculate offensive team total points
  const offensiveTeamPoints = game.players
    .filter(p => p.teamId === offensiveTeamId)
    .reduce((sum, p) => sum + p.pointsWon, 0);

  // Calculate defensive team total points
  const defensiveTeamPoints = game.players
    .filter(p => p.teamId === defensiveTeamId)
    .reduce((sum, p) => sum + p.pointsWon, 0);

  const betAmount = game.highestBet.amount;
  const multiplier = game.highestBet.withoutTrump ? 2 : 1;

  // Offensive team: win or lose their bet
  let offensiveScore = 0;
  if (offensiveTeamPoints >= betAmount) {
    // Made their bet - gain bet amount
    offensiveScore = betAmount * multiplier;
    if (offensiveTeamId === 1) {
      game.teamScores.team1 += offensiveScore;
    } else {
      game.teamScores.team2 += offensiveScore;
    }
    console.log(`Offensive Team ${offensiveTeamId} made bet (${offensiveTeamPoints}/${betAmount}): +${offensiveScore}`);
  } else {
    // Failed their bet - lose bet amount
    offensiveScore = -(betAmount * multiplier);
    if (offensiveTeamId === 1) {
      game.teamScores.team1 += offensiveScore;
    } else {
      game.teamScores.team2 += offensiveScore;
    }
    console.log(`Offensive Team ${offensiveTeamId} failed bet (${offensiveTeamPoints}/${betAmount}): ${offensiveScore}`);
  }

  // Defensive team: always gain their points (no negatives)
  if (defensiveTeamId === 1) {
    game.teamScores.team1 += defensiveTeamPoints;
  } else {
    game.teamScores.team2 += defensiveTeamPoints;
  }
  console.log(`Defensive Team ${defensiveTeamId}: +${defensiveTeamPoints}`);
  console.log(`Round ${game.roundNumber} Scores - Team 1: ${game.teamScores.team1}, Team 2: ${game.teamScores.team2}`);

  // Add round to history
  const roundScore = {
    team1: offensiveTeamId === 1 ? offensiveScore : defensiveTeamPoints,
    team2: offensiveTeamId === 2 ? offensiveScore : defensiveTeamPoints,
  };

  game.roundHistory.push({
    roundNumber: game.roundNumber,
    bets: [...game.currentBets],
    highestBet: game.highestBet,
    offensiveTeam: offensiveTeamId,
    offensivePoints: offensiveTeamPoints,
    defensivePoints: defensiveTeamPoints,
    betAmount: game.highestBet.amount,
    withoutTrump: game.highestBet.withoutTrump,
    betMade: offensiveTeamPoints >= betAmount,
    roundScore,
    cumulativeScore: {
      team1: game.teamScores.team1,
      team2: game.teamScores.team2,
    },
    tricks: [...game.currentRoundTricks], // Store all tricks from this round
    trump: game.trump, // Store trump suit for this round
  });

  // Check for game over
  if (game.teamScores.team1 >= 41 || game.teamScores.team2 >= 41) {
    game.phase = 'game_over';
    const winningTeam = game.teamScores.team1 >= 41 ? 1 : 2;

    try {
      await saveGameHistory(
        gameId,
        winningTeam as 1 | 2,
        game.teamScores.team1,
        game.teamScores.team2,
        game.roundNumber
      );
    } catch (error) {
      console.error('Error saving game history:', error);
    }

    broadcastGameUpdate(gameId, 'game_over', { winningTeam, gameState: game });
  } else {
    // Emit round ended and schedule next round
    broadcastGameUpdate(gameId, 'round_ended', game);

    // Start next round after delay (5 seconds to review scores)
    game.roundNumber += 1;
    setTimeout(() => startNewRound(gameId), 5000);
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
}).on('error', (error: any) => {
  console.error('❌ Server failed to start:', error.message);
  process.exit(1);
});
