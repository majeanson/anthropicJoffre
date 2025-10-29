#!/usr/bin/env node

/**
 * Stress Testing Script for Bot Games
 * Runs rapid bot game tests to check system stability under load
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  duration: process.env.STRESS_DURATION || 30, // minutes
  parallelGames: process.env.PARALLEL_GAMES || 4,
  reportDir: path.join(__dirname, '..', 'stress-test-results'),
};

// Results tracking
const results = {
  gamesStarted: 0,
  gamesCompleted: 0,
  gamesFailed: 0,
  averageDuration: 0,
  startTime: Date.now(),
  endTime: null,
};

console.log('🔥 Stress Testing Script - Bot Games');
console.log('=====================================');
console.log(`Duration: ${config.duration} minutes`);
console.log(`Parallel Games: ${config.parallelGames}`);
console.log('');

// Create results directory
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

const endTime = Date.now() + (config.duration * 60 * 1000);

console.log('🎮 Running stress test with bot games...');
console.log(`Will run until: ${new Date(endTime).toLocaleTimeString()}`);
console.log('');

let gameCounter = 0;
const gameDurations = [];

while (Date.now() < endTime) {
  gameCounter++;
  results.gamesStarted++;

  const gameStartTime = Date.now();
  console.log(`[${new Date().toLocaleTimeString()}] Game ${gameCounter} starting...`);

  try {
    // Run a quick bot game test
    execSync(
      `npx playwright test 24-game-flow-1-player-3-bots --grep @quick --workers=${config.parallelGames}`,
      {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 180000, // 3 minutes
      }
    );

    results.gamesCompleted++;
    const duration = (Date.now() - gameStartTime) / 1000;
    gameDurations.push(duration);

    console.log(`  ✅ Game ${gameCounter} completed in ${duration.toFixed(2)}s`);

  } catch (error) {
    results.gamesFailed++;
    console.log(`  ❌ Game ${gameCounter} failed`);

    // Log failure
    fs.appendFileSync(
      path.join(config.reportDir, 'failures.log'),
      `[${new Date().toISOString()}] Game ${gameCounter} failed:\n${error.message}\n\n`
    );
  }

  // Progress update
  const elapsed = (Date.now() - results.startTime) / 1000 / 60;
  const remaining = (endTime - Date.now()) / 1000 / 60;
  console.log(`  Progress: ${elapsed.toFixed(1)}m elapsed, ${remaining.toFixed(1)}m remaining`);
  console.log(`  Stats: ${results.gamesCompleted} completed, ${results.gamesFailed} failed`);
  console.log('');
}

// Calculate final stats
results.endTime = Date.now();
results.averageDuration = gameDurations.length > 0
  ? (gameDurations.reduce((a, b) => a + b, 0) / gameDurations.length).toFixed(2)
  : 0;

// Final report
console.log('');
console.log('═'.repeat(50));
console.log('📊 STRESS TEST RESULTS');
console.log('═'.repeat(50));
console.log(`Total Duration: ${((results.endTime - results.startTime) / 1000 / 60).toFixed(2)} minutes`);
console.log(`Games Started: ${results.gamesStarted}`);
console.log(`Games Completed: ${results.gamesCompleted} ✅`);
console.log(`Games Failed: ${results.gamesFailed} ❌`);
console.log(`Success Rate: ${((results.gamesCompleted / results.gamesStarted) * 100).toFixed(2)}%`);
console.log(`Average Game Duration: ${results.averageDuration}s`);
console.log('');

// Save summary
const summary = {
  config,
  results,
  timestamp: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(config.reportDir, 'summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log(`Results saved to: ${config.reportDir}/summary.json`);
console.log('');

// Exit with appropriate code
process.exit(results.gamesFailed > 0 ? 1 : 0);
