import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameState, Player, Bet, TrickCard, Card } from './types/game';
import { createDeck, shuffleDeck, dealCards } from './game/deck';
import {
  determineWinner,
  calculateTrickPoints,
  calculateRoundScore,
  getHighestBet,
} from './game/logic';
import { saveGameHistory, getRecentGames } from './db';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS for Socket.io
const allowedOrigins: string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL || '',
].filter((origin): origin is string => Boolean(origin) && origin.length > 0);

const corsOrigin = process.env.CLIENT_URL ? allowedOrigins : '*';

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configure CORS for Express
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

// In-memory game storage (can be moved to Redis for production)
const games = new Map<string, GameState>();

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
    const gameId = Math.random().toString(36).substring(7);
    const player: Player = {
      id: socket.id,
      name: playerName,
      teamId: 1,
      hand: [],
      tricksWon: 0,
    };

    const gameState: GameState = {
      id: gameId,
      phase: 'team_selection',
      players: [player],
      currentBets: [],
      highestBet: null,
      trump: null,
      currentTrick: [],
      currentPlayerIndex: 0,
      teamScores: { team1: 0, team2: 0 },
      roundNumber: 1,
    };

    games.set(gameId, gameState);
    socket.join(gameId);
    socket.emit('game_created', { gameId, gameState });
  });

  socket.on('join_game', ({ gameId, playerName }: { gameId: string; playerName: string }) => {
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
    };

    game.players.push(player);
    socket.join(gameId);
    io.to(gameId).emit('player_joined', { player, gameState: game });

    // Start game if 4 players
    if (game.players.length === 4) {
      startNewRound(gameId);
    }
  });

  socket.on('place_bet', ({ gameId, amount, withoutTrump }: { gameId: string; amount: number; withoutTrump: boolean }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'betting') return;

    const bet: Bet = {
      playerId: socket.id,
      amount,
      withoutTrump,
    };

    game.currentBets.push(bet);

    if (game.currentBets.length === 4) {
      game.highestBet = getHighestBet(game.currentBets);
      game.phase = 'playing';
      const highestBidderIndex = game.players.findIndex(
        (p) => p.id === game.highestBet?.playerId
      );
      game.currentPlayerIndex = highestBidderIndex;
    }

    io.to(gameId).emit('game_updated', game);
  });

  socket.on('play_card', ({ gameId, card }: { gameId: string; card: Card }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

    // Set trump on first card
    if (game.currentTrick.length === 0 && !game.trump) {
      game.trump = card.color;
    }

    // Add card to trick
    game.currentTrick.push({ playerId: socket.id, card });

    // Remove card from player's hand
    currentPlayer.hand = currentPlayer.hand.filter(
      (c) => !(c.color === card.color && c.value === card.value)
    );

    // Check if trick is complete
    if (game.currentTrick.length === 4) {
      resolveTrick(gameId);
    } else {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
      io.to(gameId).emit('game_updated', game);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Handle player disconnect
    games.forEach((game, gameId) => {
      const playerIndex = game.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        io.to(gameId).emit('player_left', { playerId: socket.id, gameState: game });
      }
    });
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
  });

  game.phase = 'betting';
  game.currentBets = [];
  game.highestBet = null;
  game.trump = null;
  game.currentTrick = [];
  game.currentPlayerIndex = 0;

  io.to(gameId).emit('round_started', game);
}

function resolveTrick(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  const winnerId = determineWinner(game.currentTrick, game.trump);
  const points = calculateTrickPoints(game.currentTrick);

  const winner = game.players.find((p) => p.id === winnerId);
  if (winner) {
    winner.tricksWon += 1;
  }

  game.currentTrick = [];
  game.currentPlayerIndex = game.players.findIndex((p) => p.id === winnerId);

  io.to(gameId).emit('trick_resolved', { winnerId, points, gameState: game });

  // Check if round is over (all cards played)
  if (game.players.every((p) => p.hand.length === 0)) {
    endRound(gameId);
  } else {
    io.to(gameId).emit('game_updated', game);
  }
}

async function endRound(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  game.phase = 'scoring';

  // Calculate scores
  game.players.forEach((player) => {
    const bet = game.currentBets.find((b) => b.playerId === player.id);
    if (bet) {
      const score = calculateRoundScore(player, bet);
      if (player.teamId === 1) {
        game.teamScores.team1 += score;
      } else {
        game.teamScores.team2 += score;
      }
    }
  });

  io.to(gameId).emit('round_ended', game);

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

    io.to(gameId).emit('game_over', { winningTeam, gameState: game });
  } else {
    game.roundNumber += 1;
    setTimeout(() => startNewRound(gameId), 5000);
  }
}

const PORT = process.env.PORT || 3001;

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS origins:`, corsOrigin === '*' ? ['*'] : allowedOrigins);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
}).on('error', (error: any) => {
  console.error('❌ Failed to start server:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});
