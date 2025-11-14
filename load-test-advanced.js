/**
 * Advanced Load Testing Script for Jaffre Multiplayer Card Game
 *
 * Comprehensive testing scenarios:
 * - Baseline: 5 concurrent games
 * - Moderate Load: 10 concurrent games
 * - Heavy Load: 20 concurrent games
 * - Stress Test: 50 concurrent games
 * - Spike Test: Gradual ramp-up from 0 to 30 games
 *
 * Metrics tracked:
 * - Connection latency (min, max, avg, p95, p99)
 * - Game creation success rate
 * - Player join success rate
 * - Memory usage (if available)
 * - Error rates and categorization
 * - Reconnection success rate
 * - WebSocket vs polling transport ratio
 *
 * Usage:
 *   # Baseline test (5 games)
 *   npm run load-test:advanced
 *
 *   # Moderate load (10 games)
 *   NUM_GAMES=10 npm run load-test:advanced
 *
 *   # Heavy load (20 games)
 *   NUM_GAMES=20 npm run load-test:advanced
 *
 *   # Stress test (50 games)
 *   NUM_GAMES=50 npm run load-test:advanced
 *
 *   # Spike test (gradual ramp-up)
 *   TEST_TYPE=spike npm run load-test:advanced
 *
 *   # Production test
 *   BACKEND_URL=https://your-backend.railway.app NUM_GAMES=10 npm run load-test:advanced
 */

const io = require('socket.io-client');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const NUM_CONCURRENT_GAMES = parseInt(process.env.NUM_GAMES) || 5;
const GAME_DURATION_MS = parseInt(process.env.GAME_DURATION_MS) || 30000; // 30 seconds
const RECONNECT_TEST_ENABLED = process.env.RECONNECT_TEST !== 'false'; // Default: true
const TEST_TYPE = process.env.TEST_TYPE || 'concurrent'; // concurrent, spike
const SPIKE_INTERVAL_MS = 5000; // Add new game every 5 seconds for spike test

// Performance tracking
const metrics = {
  gamesCreated: 0,
  gamesJoined: 0,
  gamesFailed: 0,
  playersConnected: 0,
  playersDisconnected: 0,
  reconnectAttempts: 0,
  reconnectSuccesses: 0,
  reconnectFailures: 0,

  // Latency tracking
  latencies: [],

  // Error categorization
  errors: {
    connection: [],
    gameCreation: [],
    playerJoin: [],
    reconnection: [],
    timeout: [],
    other: [],
  },

  // Transport tracking
  transports: {
    websocket: 0,
    polling: 0,
  },

  // Timing
  startTime: Date.now(),
  endTime: null,

  // Memory tracking (if available)
  memorySnapshots: [],
};

/**
 * Calculate percentile from sorted array
 */
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((sorted.length * p) / 100) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Take memory snapshot if available
 */
function takeMemorySnapshot() {
  if (typeof process.memoryUsage === 'function') {
    const mem = process.memoryUsage();
    metrics.memorySnapshots.push({
      timestamp: Date.now(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
    });
  }
}

/**
 * Create a socket client with comprehensive event tracking
 */
function createSocket(playerName, gameIndex) {
  const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 1000,
    timeout: 20000, // 20 second connection timeout
  });

  const startTime = Date.now();
  let connected = false;

  socket.on('connect', () => {
    connected = true;
    const latency = Date.now() - startTime;
    metrics.latencies.push(latency);
    metrics.playersConnected++;

    // Track transport type
    const transport = socket.io.engine.transport.name;
    metrics.transports[transport] = (metrics.transports[transport] || 0) + 1;

    console.log(`✓ [G${gameIndex}] ${playerName} connected (${latency}ms, ${transport})`);
  });

  socket.on('error', (error) => {
    console.error(`✗ [G${gameIndex}] ${playerName} error:`, error.message);
    metrics.errors.other.push({
      player: playerName,
      game: gameIndex,
      error: error.message,
      timestamp: Date.now(),
    });
  });

  socket.on('connect_error', (error) => {
    console.error(`✗ [G${gameIndex}] ${playerName} connection error:`, error.message);
    metrics.errors.connection.push({
      player: playerName,
      game: gameIndex,
      error: error.message,
      timestamp: Date.now(),
    });
  });

  socket.on('connect_timeout', () => {
    console.error(`⏱️ [G${gameIndex}] ${playerName} connection timeout`);
    metrics.errors.timeout.push({
      player: playerName,
      game: gameIndex,
      error: 'Connection timeout',
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', (reason) => {
    if (connected) {
      metrics.playersDisconnected++;
      console.log(`⊗ [G${gameIndex}] ${playerName} disconnected: ${reason}`);
    }
  });

  return socket;
}

/**
 * Simulate a single game with 4 players
 */
async function simulateGame(gameIndex) {
  console.log(`\n[Game ${gameIndex}] Starting simulation...`);

  const players = [
    { name: `LT_P1_G${gameIndex}`, socket: null, gameId: null },
    { name: `LT_P2_G${gameIndex}`, socket: null, gameId: null },
    { name: `LT_P3_G${gameIndex}`, socket: null, gameId: null },
    { name: `LT_P4_G${gameIndex}`, socket: null, gameId: null },
  ];

  return new Promise((resolve) => {
    let gameCreatedSuccessfully = false;
    const gameTimeout = setTimeout(() => {
      if (!gameCreatedSuccessfully) {
        console.error(`[Game ${gameIndex}] Timeout - game creation took too long`);
        metrics.gamesFailed++;
        cleanup(players);
        resolve();
      }
    }, 60000); // 60 second timeout for entire game setup

    // Player 1 creates the game
    const p1 = players[0];
    p1.socket = createSocket(p1.name, gameIndex);

    p1.socket.on('game_created', ({ gameId, gameState }) => {
      gameCreatedSuccessfully = true;
      p1.gameId = gameId;
      metrics.gamesCreated++;
      console.log(`[Game ${gameIndex}] Created: ${gameId}`);

      // Player 1 joins Team 1
      p1.socket.emit('select_team', { gameId, teamId: 1 });

      // Other players join (staggered by 500ms)
      setTimeout(() => joinPlayers(gameIndex, players, gameId, resolve, gameTimeout), 500);
    });

    p1.socket.on('connect', () => {
      p1.socket.emit('create_game', p1.name);
    });

    p1.socket.on('error', (error) => {
      console.error(`[Game ${gameIndex}] Creation failed:`, error.message);
      metrics.gamesFailed++;
      metrics.errors.gameCreation.push({
        game: gameIndex,
        error: error.message,
        timestamp: Date.now(),
      });
      clearTimeout(gameTimeout);
      cleanup(players);
      resolve();
    });
  });
}

/**
 * Join remaining players to the game
 */
function joinPlayers(gameIndex, players, gameId, resolve, gameTimeout) {
  let joinedCount = 1; // P1 already in
  const joinTimeouts = [];

  // Players 2-4 join
  for (let i = 1; i < 4; i++) {
    const player = players[i];
    player.socket = createSocket(player.name, gameIndex);
    player.gameId = gameId;

    // Timeout for individual player join
    const joinTimeout = setTimeout(() => {
      console.error(`[Game ${gameIndex}] ${player.name} join timeout`);
      metrics.errors.playerJoin.push({
        player: player.name,
        game: gameIndex,
        error: 'Join timeout',
        timestamp: Date.now(),
      });
    }, 15000);

    joinTimeouts.push(joinTimeout);

    player.socket.on('player_joined', ({ gameState }) => {
      clearTimeout(joinTimeout);
      joinedCount++;
      metrics.gamesJoined++;
      console.log(`[Game ${gameIndex}] ${player.name} joined (${joinedCount}/4)`);

      // Assign to teams (Team 1: P1, P3; Team 2: P2, P4)
      const teamId = i % 2 === 0 ? 1 : 2;
      player.socket.emit('select_team', { gameId, teamId });

      // When all 4 players joined, start the game
      if (joinedCount === 4) {
        console.log(`[Game ${gameIndex}] All players joined. Starting game...`);

        // Clear all join timeouts
        joinTimeouts.forEach(t => clearTimeout(t));

        setTimeout(() => {
          players[0].socket.emit('start_game', { gameId });

          // Test reconnection for one random player per 5 games
          if (RECONNECT_TEST_ENABLED && gameIndex % 5 === 1) {
            const reconnectPlayerIndex = Math.floor(Math.random() * 4);
            setTimeout(() => {
              testReconnection(players[reconnectPlayerIndex], gameId, gameIndex);
            }, 5000);
          }

          // Take memory snapshot mid-test
          takeMemorySnapshot();

          // Cleanup after game duration
          setTimeout(() => {
            console.log(`[Game ${gameIndex}] Simulation complete.`);
            clearTimeout(gameTimeout);
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
      metrics.errors.playerJoin.push({
        player: player.name,
        game: gameIndex,
        error: error.message,
        timestamp: Date.now(),
      });
    });
  }
}

/**
 * Test reconnection scenario
 */
function testReconnection(player, gameId, gameIndex) {
  console.log(`[Reconnection] [G${gameIndex}] Disconnecting ${player.name}...`);
  metrics.reconnectAttempts++;

  // Store session for reconnection
  const session = {
    token: `mock_token_${Date.now()}`,
    gameId,
    playerId: player.name,
    playerName: player.name
  };

  player.socket.disconnect();

  setTimeout(() => {
    console.log(`[Reconnection] [G${gameIndex}] Reconnecting ${player.name}...`);
    player.socket.connect();

    const reconnectTimeout = setTimeout(() => {
      console.error(`✗ [Reconnection] [G${gameIndex}] ${player.name} timeout`);
      metrics.reconnectFailures++;
      metrics.errors.reconnection.push({
        player: player.name,
        game: gameIndex,
        error: 'Reconnection timeout',
        timestamp: Date.now(),
      });
    }, 10000);

    player.socket.once('connect', () => {
      player.socket.emit('reconnect_to_game', { token: session.token });

      player.socket.once('reconnection_successful', ({ gameState }) => {
        clearTimeout(reconnectTimeout);
        metrics.reconnectSuccesses++;
        console.log(`✓ [Reconnection] [G${gameIndex}] ${player.name} successfully reconnected`);
      });

      player.socket.once('reconnection_failed', ({ message }) => {
        clearTimeout(reconnectTimeout);
        metrics.reconnectFailures++;
        console.error(`✗ [Reconnection] [G${gameIndex}] ${player.name} failed: ${message}`);
        metrics.errors.reconnection.push({
          player: player.name,
          game: gameIndex,
          error: message,
          timestamp: Date.now(),
        });
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
      try {
        player.socket.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      player.socket = null;
    }
  });
}

/**
 * Print comprehensive metrics report
 */
function printMetrics() {
  metrics.endTime = Date.now();
  const duration = (metrics.endTime - metrics.startTime) / 1000;

  // Latency statistics
  const avgLatency = metrics.latencies.length > 0
    ? (metrics.latencies.reduce((a, b) => a + b, 0) / metrics.latencies.length).toFixed(2)
    : 0;
  const minLatency = metrics.latencies.length > 0 ? Math.min(...metrics.latencies) : 0;
  const maxLatency = metrics.latencies.length > 0 ? Math.max(...metrics.latencies) : 0;
  const p95Latency = percentile(metrics.latencies, 95);
  const p99Latency = percentile(metrics.latencies, 99);

  // Success rates
  const gameSuccessRate = ((metrics.gamesCreated / NUM_CONCURRENT_GAMES) * 100).toFixed(2);
  const joinSuccessRate = ((metrics.gamesJoined / (NUM_CONCURRENT_GAMES * 3)) * 100).toFixed(2);
  const reconnectSuccessRate = metrics.reconnectAttempts > 0
    ? ((metrics.reconnectSuccesses / metrics.reconnectAttempts) * 100).toFixed(2)
    : 'N/A';

  // Total errors
  const totalErrors = Object.values(metrics.errors).reduce((sum, arr) => sum + arr.length, 0);

  // Transport ratio
  const wsPercent = metrics.transports.websocket > 0
    ? ((metrics.transports.websocket / (metrics.transports.websocket + metrics.transports.polling)) * 100).toFixed(2)
    : 0;

  console.log('\n' + '='.repeat(70));
  console.log('📊 ADVANCED LOAD TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Backend URL:               ${BACKEND_URL}`);
  console.log(`Test Type:                 ${TEST_TYPE}`);
  console.log(`Test Duration:             ${duration.toFixed(2)}s`);
  console.log(`Target Concurrent Games:   ${NUM_CONCURRENT_GAMES}`);
  console.log(`Game Duration Each:        ${GAME_DURATION_MS / 1000}s`);

  console.log(`\n📈 Connection Metrics:`);
  console.log(`  Games Created:           ${metrics.gamesCreated}/${NUM_CONCURRENT_GAMES} (${gameSuccessRate}%)`);
  console.log(`  Players Joined:          ${metrics.gamesJoined}/${NUM_CONCURRENT_GAMES * 3} (${joinSuccessRate}%)`);
  console.log(`  Games Failed:            ${metrics.gamesFailed}`);
  console.log(`  Players Connected:       ${metrics.playersConnected}`);
  console.log(`  Players Disconnected:    ${metrics.playersDisconnected}`);

  console.log(`\n⚡ Latency Statistics:`);
  console.log(`  Average:                 ${avgLatency}ms`);
  console.log(`  Min:                     ${minLatency}ms`);
  console.log(`  Max:                     ${maxLatency}ms`);
  console.log(`  95th Percentile (p95):   ${p95Latency}ms`);
  console.log(`  99th Percentile (p99):   ${p99Latency}ms`);

  console.log(`\n🔄 Reconnection Metrics:`);
  console.log(`  Attempts:                ${metrics.reconnectAttempts}`);
  console.log(`  Successes:               ${metrics.reconnectSuccesses}`);
  console.log(`  Failures:                ${metrics.reconnectFailures}`);
  console.log(`  Success Rate:            ${reconnectSuccessRate}${typeof reconnectSuccessRate === 'string' ? '' : '%'}`);

  console.log(`\n🔌 Transport Distribution:`);
  console.log(`  WebSocket:               ${metrics.transports.websocket} (${wsPercent}%)`);
  console.log(`  Polling:                 ${metrics.transports.polling} (${(100 - wsPercent).toFixed(2)}%)`);

  console.log(`\n❌ Error Summary:`);
  console.log(`  Total Errors:            ${totalErrors}`);
  console.log(`  Connection Errors:       ${metrics.errors.connection.length}`);
  console.log(`  Game Creation Errors:    ${metrics.errors.gameCreation.length}`);
  console.log(`  Player Join Errors:      ${metrics.errors.playerJoin.length}`);
  console.log(`  Reconnection Errors:     ${metrics.errors.reconnection.length}`);
  console.log(`  Timeout Errors:          ${metrics.errors.timeout.length}`);
  console.log(`  Other Errors:            ${metrics.errors.other.length}`);

  if (totalErrors > 0) {
    console.log(`\n⚠️  Recent Errors (last 10):`);
    const allErrors = [
      ...metrics.errors.connection,
      ...metrics.errors.gameCreation,
      ...metrics.errors.playerJoin,
      ...metrics.errors.reconnection,
      ...metrics.errors.timeout,
      ...metrics.errors.other,
    ];
    allErrors.slice(-10).forEach(err => {
      const game = err.game ? `[G${err.game}] ` : '';
      const player = err.player || 'N/A';
      console.log(`  - ${game}${player}: ${err.error}`);
    });
  }

  // Memory snapshots
  if (metrics.memorySnapshots.length > 0) {
    const lastSnapshot = metrics.memorySnapshots[metrics.memorySnapshots.length - 1];
    console.log(`\n💾 Memory Usage (Client):`);
    console.log(`  Heap Used:               ${(lastSnapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total:              ${(lastSnapshot.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS:                     ${(lastSnapshot.rss / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('\n' + '='.repeat(70));

  // Success criteria evaluation
  const passed =
    parseFloat(gameSuccessRate) >= 90 &&
    parseFloat(joinSuccessRate) >= 90 &&
    totalErrors < NUM_CONCURRENT_GAMES &&
    (metrics.reconnectAttempts === 0 || parseFloat(reconnectSuccessRate) >= 80) &&
    parseFloat(avgLatency) < 1000;

  if (passed) {
    console.log('✅ LOAD TEST PASSED - Server performs well under load');
    console.log('\nPassing Criteria:');
    console.log('  ✓ Game creation success rate ≥ 90%');
    console.log('  ✓ Player join success rate ≥ 90%');
    console.log('  ✓ Total errors < number of games');
    console.log('  ✓ Average latency < 1000ms');
    if (metrics.reconnectAttempts > 0) {
      console.log('  ✓ Reconnection success rate ≥ 80%');
    }
  } else {
    console.log('⚠️  LOAD TEST WARNINGS - Review metrics above');
    console.log('\nIssues Detected:');
    if (parseFloat(gameSuccessRate) < 90) {
      console.log(`  ✗ Game creation success rate (${gameSuccessRate}%) < 90%`);
    }
    if (parseFloat(joinSuccessRate) < 90) {
      console.log(`  ✗ Player join success rate (${joinSuccessRate}%) < 90%`);
    }
    if (totalErrors >= NUM_CONCURRENT_GAMES) {
      console.log(`  ✗ Total errors (${totalErrors}) ≥ number of games (${NUM_CONCURRENT_GAMES})`);
    }
    if (parseFloat(avgLatency) >= 1000) {
      console.log(`  ✗ Average latency (${avgLatency}ms) ≥ 1000ms`);
    }
    if (metrics.reconnectAttempts > 0 && parseFloat(reconnectSuccessRate) < 80) {
      console.log(`  ✗ Reconnection success rate (${reconnectSuccessRate}%) < 80%`);
    }
  }

  console.log('='.repeat(70));

  return passed;
}

/**
 * Concurrent load test - all games start at roughly the same time
 */
async function runConcurrentTest() {
  console.log('🚀 Starting Concurrent Load Test');
  console.log(`Target: ${BACKEND_URL}`);
  console.log(`Concurrent Games: ${NUM_CONCURRENT_GAMES}`);
  console.log(`Game Duration: ${GAME_DURATION_MS / 1000}s`);
  console.log(`Reconnection Test: ${RECONNECT_TEST_ENABLED ? 'Enabled (every 5th game)' : 'Disabled'}\n`);

  takeMemorySnapshot();

  // Run concurrent games with slight stagger
  const gamePromises = [];
  for (let i = 0; i < NUM_CONCURRENT_GAMES; i++) {
    gamePromises.push(simulateGame(i + 1));

    // Stagger game creation by 1 second to avoid overwhelming the server
    if (i < NUM_CONCURRENT_GAMES - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Wait for all games to complete
  await Promise.all(gamePromises);

  takeMemorySnapshot();

  return printMetrics();
}

/**
 * Spike load test - gradual ramp-up to simulate traffic surge
 */
async function runSpikeTest() {
  console.log('📈 Starting Spike Load Test');
  console.log(`Target: ${BACKEND_URL}`);
  console.log(`Total Games: ${NUM_CONCURRENT_GAMES}`);
  console.log(`Ramp-up Interval: ${SPIKE_INTERVAL_MS / 1000}s`);
  console.log(`Game Duration: ${GAME_DURATION_MS / 1000}s\n`);

  takeMemorySnapshot();

  // Gradual ramp-up
  const gamePromises = [];
  for (let i = 0; i < NUM_CONCURRENT_GAMES; i++) {
    console.log(`\n[Spike] Adding game ${i + 1}/${NUM_CONCURRENT_GAMES}...`);
    gamePromises.push(simulateGame(i + 1));

    // Wait before adding next game
    if (i < NUM_CONCURRENT_GAMES - 1) {
      await new Promise(resolve => setTimeout(resolve, SPIKE_INTERVAL_MS));
    }
  }

  // Wait for all games to complete
  await Promise.all(gamePromises);

  takeMemorySnapshot();

  return printMetrics();
}

/**
 * Main load test execution
 */
async function runLoadTest() {
  let passed = false;

  if (TEST_TYPE === 'spike') {
    passed = await runSpikeTest();
  } else {
    passed = await runConcurrentTest();
  }

  // Exit with appropriate code
  setTimeout(() => {
    process.exit(passed ? 0 : 1);
  }, 2000);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the load test
runLoadTest().catch(error => {
  console.error('❌ Load test crashed:', error);
  process.exit(1);
});
