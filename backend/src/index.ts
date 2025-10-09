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
  isBetHigher,
} from './game/logic';
import { saveGameHistory, getRecentGames } from './db';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS for Socket.io
const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, ''); // Remove trailing slash
const allowedOrigins: string[] = [
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
      currentPlayerIndex: 0,
      dealerIndex: 0, // First player is the initial dealer
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
      pointsWon: 0,
    };

    game.players.push(player);
    socket.join(gameId);
    io.to(gameId).emit('player_joined', { player, gameState: game });
  });

  socket.on('select_team', ({ gameId, teamId }: { gameId: string; teamId: 1 | 2 }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'team_selection') return;

    const player = game.players.find(p => p.id === socket.id);
    if (!player) return;

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
    if (!game || game.phase !== 'team_selection') return;

    const currentPlayer = game.players.find(p => p.id === socket.id);
    const targetPlayer = game.players.find(p => p.id === targetPlayerId);

    if (!currentPlayer || !targetPlayer) return;

    // Swap positions in the players array
    const currentIndex = game.players.indexOf(currentPlayer);
    const targetIndex = game.players.indexOf(targetPlayer);

    game.players[currentIndex] = targetPlayer;
    game.players[targetIndex] = currentPlayer;

    io.to(gameId).emit('game_updated', game);
  });

  socket.on('start_game', ({ gameId }: { gameId: string }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'team_selection') return;

    if (game.players.length !== 4) {
      socket.emit('error', { message: 'Need 4 players to start' });
      return;
    }

    startNewRound(gameId);
  });

  socket.on('place_bet', ({ gameId, amount, withoutTrump, skipped }: { gameId: string; amount: number; withoutTrump: boolean; skipped?: boolean }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'betting') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

    const isDealer = game.currentPlayerIndex === game.dealerIndex;

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
        return;
      }

      // Check if all 4 players have bet (including skips)
      if (game.currentBets.length === 4) {
        game.highestBet = getHighestBet(game.currentBets);
        game.phase = 'playing';
        const highestBidderIndex = game.players.findIndex(
          (p) => p.id === game.highestBet?.playerId
        );
        game.currentPlayerIndex = highestBidderIndex;
        io.to(gameId).emit('game_updated', game);
        return;
      }

      // Move to next player
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
      io.to(gameId).emit('game_updated', game);
      return;
    }

    // Validate betting rules for non-skip bets
    if (game.currentBets.length > 0) {
      const currentHighest = getHighestBet(game.currentBets);
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
      game.highestBet = getHighestBet(game.currentBets);
      game.phase = 'playing';
      const highestBidderIndex = game.players.findIndex(
        (p) => p.id === game.highestBet?.playerId
      );
      game.currentPlayerIndex = highestBidderIndex;
    } else {
      // Move to next player
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
    }

    io.to(gameId).emit('game_updated', game);
  });

  socket.on('play_card', ({ gameId, card }: { gameId: string; card: Card }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

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

    // Remove card from player's hand
    currentPlayer.hand = currentPlayer.hand.filter(
      (c) => !(c.color === card.color && c.value === card.value)
    );

    // Check if trick is complete
    if (game.currentTrick.length === 4) {
      // Emit state with card played before resolving trick
      io.to(gameId).emit('game_updated', game);
      resolveTrick(gameId);
    } else {
      // Move to next player
      const previousIndex = game.currentPlayerIndex;
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 4;
      console.log(`Turn advanced from player ${previousIndex} to player ${game.currentPlayerIndex}, trick has ${game.currentTrick.length} cards`);
      // Emit updated state
      io.to(gameId).emit('game_updated', game);
    }
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
    player.pointsWon = 0;
  });

  // Rotate dealer to next player
  game.dealerIndex = (game.dealerIndex + 1) % 4;

  game.phase = 'betting';
  game.currentBets = [];
  game.highestBet = null;
  game.trump = null;
  game.currentTrick = [];
  // Betting starts with player after dealer
  game.currentPlayerIndex = (game.dealerIndex + 1) % 4;

  io.to(gameId).emit('round_started', game);
}

function resolveTrick(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  const winnerId = determineWinner(game.currentTrick, game.trump);
  const specialCardPoints = calculateTrickPoints(game.currentTrick);

  const winner = game.players.find((p) => p.id === winnerId);
  if (winner) {
    winner.tricksWon += 1;
    // Award 1 point for winning trick + special card points
    winner.pointsWon += 1 + specialCardPoints;
  }

  game.currentTrick = [];
  game.currentPlayerIndex = game.players.findIndex((p) => p.id === winnerId);

  // Emit trick resolution with updated state
  io.to(gameId).emit('trick_resolved', { winnerId, points: 1 + specialCardPoints, gameState: game });

  // Check if round is over (all cards played)
  if (game.players.every((p) => p.hand.length === 0)) {
    endRound(gameId);
  } else {
    // Continue playing - emit game state for next turn
    io.to(gameId).emit('game_updated', game);
  }
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
    // Emit round ended and schedule next round
    io.to(gameId).emit('round_ended', game);

    // Start next round after delay
    game.roundNumber += 1;
    setTimeout(() => startNewRound(gameId), 3000);
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
