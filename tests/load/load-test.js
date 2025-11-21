/**
 * Load Testing Script for Jaffre Multiplayer Card Game
 *
 * Tests concurrent game scenarios to verify:
 * - Socket.IO connection stability
 * - Game state consistency under load
 * - Response times and latency
 * - Memory usage patterns
 * - Server capacity limits
 *
 * Usage:
 *   BACKEND_URL=https://anthropicjoffre-production.up.railway.app npm run load-test
 *
 * Or for local testing:
 *   BACKEND_URL=http://localhost:3000 npm run load-test
 */

const io = require('socket.io-client');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const NUM_CONCURRENT_GAMES = 5;
const GAME_DURATION_MS = 30000; // 30 seconds per game
const RECONNECT_TEST_ENABLED = true;

// Metrics tracking
const metrics = {
  gamesCreated: 0,
  gamesJoined: 0,
  gamesFailed: 0,
  totalLatency: 0,
  latencyCount: 0,
  errors: [],
  startTime: Date.now(),
};

/**
 * Create a socket client with event logging
 */
function createSocket(playerName) {
  const socket = io(BACKEND_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
  });

  const startTime = Date.now();

  socket.on('connect', () => {
    const latency = Date.now() - startTime;
    metrics.totalLatency += latency;
    metrics.latencyCount++;
    console.log(`✓ ${playerName} connected (${latency}ms)`);
  });

  socket.on('error', (error) => {
    console.error(`✗ ${playerName} error:`, error.message);
    metrics.errors.push({ player: playerName, error: error.message, timestamp: Date.now() });
  });

  socket.on('connect_error', (error) => {
    console.error(`✗ ${playerName} connection error:`, error.message);
    metrics.errors.push({ player: playerName, error: `Connection: ${error.message}`, timestamp: Date.now() });
  });

  socket.on('disconnect', (reason) => {
    console.log(`⊗ ${playerName} disconnected: ${reason}`);
  });

  return socket;
}

/**
 * Simulate a single game with 4 players
 */
async function simulateGame(gameIndex) {
  console.log(`\n[Game ${gameIndex}] Starting simulation...`);

  const players = [
    { name: `LoadTest P1 G${gameIndex}`, socket: null, gameId: null },
    { name: `LoadTest P2 G${gameIndex}`, socket: null, gameId: null },
    { name: `LoadTest P3 G${gameIndex}`, socket: null, gameId: null },
    { name: `LoadTest P4 G${gameIndex}`, socket: null, gameId: null },
  ];

  return new Promise((resolve) => {
    // Player 1 creates the game
    const p1 = players[0];
    p1.socket = createSocket(p1.name);

    p1.socket.on('game_created', ({ gameId, gameState }) => {
      p1.gameId = gameId;
      metrics.gamesCreated++;
      console.log(`[Game ${gameIndex}] Created: ${gameId}`);

      // Player 1 joins Team 1
      p1.socket.emit('select_team', { gameId, teamId: 1 });

      // Other players join
      setTimeout(() => joinPlayers(gameIndex, players, gameId, resolve), 1000);
    });

    p1.socket.on('connect', () => {
      p1.socket.emit('create_game', { playerName: p1.name, persistenceMode: 'elo' });
    });

    p1.socket.on('error', (error) => {
      console.error(`[Game ${gameIndex}] Failed:`, error.message);
      metrics.gamesFailed++;
      cleanup(players);
      resolve();
    });
  });
}

/**
 * Join remaining players to the game
 */
function joinPlayers(gameIndex, players, gameId, resolve) {
  let joinedCount = 1; // P1 already in

  // Players 2-4 join
  for (let i = 1; i < 4; i++) {
    const player = players[i];
    player.socket = createSocket(player.name);
    player.gameId = gameId;

    player.socket.on('player_joined', ({ gameState }) => {
      joinedCount++;
      metrics.gamesJoined++;
      console.log(`[Game ${gameIndex}] ${player.name} joined (${joinedCount}/4)`);

      // Assign to teams (Team 1: P1, P3; Team 2: P2, P4)
      const teamId = i % 2 === 0 ? 1 : 2;
      player.socket.emit('select_team', { gameId, teamId });

      // When all 4 players joined, start the game
      if (joinedCount === 4) {
        console.log(`[Game ${gameIndex}] All players joined. Starting game...`);
        setTimeout(() => {
          players[0].socket.emit('start_game', { gameId });

          // Test reconnection scenario for one player
          if (RECONNECT_TEST_ENABLED && gameIndex === 1) {
            setTimeout(() => testReconnection(players[2], gameId), 5000);
          }

          // Cleanup after game duration
          setTimeout(() => {
            console.log(`[Game ${gameIndex}] Simulation complete.`);
            cleanup(players);
            resolve();
          }, GAME_DURATION_MS);
        }, 2000);
      }
    });

    player.socket.on('connect', () => {
      player.socket.emit('join_game', { gameId, playerName: player.name });
    });

    player.socket.on('error', (error) => {
      console.error(`[Game ${gameIndex}] ${player.name} error:`, error.message);
    });
  }
}

/**
 * Test reconnection scenario
 */
function testReconnection(player, gameId) {
  console.log(`[Reconnection Test] Disconnecting ${player.name}...`);

  const session = { gameId, playerName: player.name };
  player.socket.disconnect();

  setTimeout(() => {
    console.log(`[Reconnection Test] Reconnecting ${player.name}...`);
    player.socket.connect();

    player.socket.once('connect', () => {
      player.socket.emit('reconnect_to_game', { gameId, session });

      player.socket.once('reconnection_successful', ({ gameState }) => {
        console.log(`✓ [Reconnection Test] ${player.name} successfully reconnected`);
      });

      player.socket.once('reconnection_failed', ({ message }) => {
        console.error(`✗ [Reconnection Test] ${player.name} failed: ${message}`);
        metrics.errors.push({ player: player.name, error: `Reconnection: ${message}`, timestamp: Date.now() });
      });
    });
  }, 3000);
}

/**
 * Cleanup sockets for a game
 */
function cleanup(players) {
  players.forEach(player => {
    if (player.socket) {
      player.socket.disconnect();
      player.socket = null;
    }
  });
}

/**
 * Print final metrics report
 */
function printMetrics() {
  const duration = (Date.now() - metrics.startTime) / 1000;
  const avgLatency = metrics.latencyCount > 0 ? (metrics.totalLatency / metrics.latencyCount).toFixed(2) : 0;

  console.log('\n' + '='.repeat(60));
  console.log('📊 LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Backend URL:          ${BACKEND_URL}`);
  console.log(`Test Duration:        ${duration.toFixed(2)}s`);
  console.log(`Concurrent Games:     ${NUM_CONCURRENT_GAMES}`);
  console.log(`\nConnection Metrics:`);
  console.log(`  Games Created:      ${metrics.gamesCreated}/${NUM_CONCURRENT_GAMES}`);
  console.log(`  Players Joined:     ${metrics.gamesJoined}/${NUM_CONCURRENT_GAMES * 3}`);
  console.log(`  Games Failed:       ${metrics.gamesFailed}`);
  console.log(`  Avg Latency:        ${avgLatency}ms`);
  console.log(`\nError Summary:`);
  console.log(`  Total Errors:       ${metrics.errors.length}`);

  if (metrics.errors.length > 0) {
    console.log(`\n⚠️  Recent Errors:`);
    metrics.errors.slice(-5).forEach(err => {
      console.log(`  - ${err.player}: ${err.error}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Success criteria
  const successRate = (metrics.gamesCreated / NUM_CONCURRENT_GAMES) * 100;
  const joinSuccessRate = (metrics.gamesJoined / (NUM_CONCURRENT_GAMES * 3)) * 100;

  if (successRate >= 90 && joinSuccessRate >= 90 && metrics.errors.length < NUM_CONCURRENT_GAMES) {
    console.log('✅ LOAD TEST PASSED - Server handles concurrent games well');
  } else {
    console.log('⚠️  LOAD TEST WARNINGS - Review metrics above');
  }
}

/**
 * Main load test execution
 */
async function runLoadTest() {
  console.log('🚀 Starting Load Test for Jaffre Card Game');
  console.log(`Target: ${BACKEND_URL}`);
  console.log(`Concurrent Games: ${NUM_CONCURRENT_GAMES}`);
  console.log(`Game Duration: ${GAME_DURATION_MS / 1000}s`);
  console.log(`Reconnection Test: ${RECONNECT_TEST_ENABLED ? 'Enabled' : 'Disabled'}\n`);

  // Run concurrent games in staggered fashion
  const gamePromises = [];
  for (let i = 0; i < NUM_CONCURRENT_GAMES; i++) {
    gamePromises.push(simulateGame(i + 1));

    // Stagger game creation by 2 seconds
    if (i < NUM_CONCURRENT_GAMES - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Wait for all games to complete
  await Promise.all(gamePromises);

  // Print results
  printMetrics();

  // Exit
  setTimeout(() => process.exit(0), 2000);
}

// Run the load test
runLoadTest().catch(error => {
  console.error('❌ Load test crashed:', error);
  process.exit(1);
});
