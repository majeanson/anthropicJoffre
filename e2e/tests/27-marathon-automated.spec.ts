import { test, expect } from '@playwright/test';
import {
  createAutomatedMarathonGame,
  monitorMarathonGame,
  verifyGameState
} from './helpers';

/**
 * Marathon Tests using Automated Quick Play Architecture
 *
 * These tests use Quick Play + Autoplay to run long games without manual intervention.
 * This approach is MUCH more stable than multi-page tests for marathon scenarios.
 *
 * Benefits:
 * - Single browser page (no multi-page overhead)
 * - Server-side bots (more efficient than browser bots)
 * - Autoplay for human player (no manual intervention)
 * - Memory efficient (runs for 60+ minutes without issues)
 *
 * Use cases:
 * - Stability testing (ensure no crashes over extended gameplay)
 * - Memory leak detection (track memory usage over time)
 * - Performance regression testing (track round durations)
 * - Full game flow validation (0-0 to 41+ naturally)
 */
test.describe('@marathon Automated Marathon Tests (Stable)', () => {
  let page: any;
  let context: any;
  let gameId: string;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should complete a 15-round game without crashes', async ({ browser }) => {
    test.setTimeout(1200000); // 20 minutes

    // Create automated game
    const result = await createAutomatedMarathonGame(browser, {
      difficulty: 'medium',
      targetRounds: 15
    });

    page = result.page;
    context = result.context;
    gameId = result.gameId;

    console.log(`\nMarathon game started: ${gameId}`);
    console.log(`Using: 1 browser page + 3 server-side bots + autoplay`);

    // Verify initial state
    await verifyGameState(page, {
      phase: 'Betting',
      team1Score: 0,
      team2Score: 0,
      roundNumber: 1
    });

    // Monitor game progress
    const metrics = await monitorMarathonGame(page, {
      maxRounds: 15,
      maxDurationMinutes: 20,
      collectMetrics: true
    });

    // Verify completion
    expect(metrics.roundNumbers.length).toBeGreaterThanOrEqual(15);
    expect(metrics.errorCount).toBeLessThan(3);

    console.log(`\n✓ Marathon test completed successfully`);
    console.log(`  Rounds: ${metrics.roundNumbers.length}`);
    console.log(`  Duration: ${(metrics.totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`  Errors: ${metrics.errorCount}`);
  });

  test('should complete a full game from 0-0 to 41+', async ({ browser }) => {
    test.setTimeout(3600000); // 60 minutes

    // Create automated game with hard difficulty for faster gameplay
    const result = await createAutomatedMarathonGame(browser, {
      difficulty: 'hard',
      targetRounds: 25 // Estimate for full game
    });

    page = result.page;
    context = result.context;
    gameId = result.gameId;

    console.log(`\nFull marathon game started: ${gameId}`);

    // Verify initial state
    await verifyGameState(page, {
      phase: 'Betting',
      team1Score: 0,
      team2Score: 0,
      roundNumber: 1
    });

    // Monitor until game completion
    const metrics = await monitorMarathonGame(page, {
      maxRounds: 30,
      maxDurationMinutes: 60,
      collectMetrics: true
    });

    // Verify game completed naturally (reached 41+)
    expect(metrics.gameCompleted).toBe(true);
    expect(metrics.teamScores.length).toBeGreaterThan(0);

    const finalScores = metrics.teamScores[metrics.teamScores.length - 1];
    const winningScore = Math.max(finalScores.team1, finalScores.team2);

    expect(winningScore).toBeGreaterThanOrEqual(41);

    console.log(`\n✓ Full marathon game completed!`);
    console.log(`  Final Score: ${finalScores.team1} - ${finalScores.team2}`);
    console.log(`  Total Rounds: ${metrics.roundNumbers.length}`);
    console.log(`  Duration: ${(metrics.totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`  Avg Round: ${metrics.roundDurations.length > 0 ?
      (metrics.roundDurations.reduce((a, b) => a + b) / metrics.roundDurations.length / 1000).toFixed(1) : 'N/A'}s`);
  });

  test('should detect memory leaks over 20 rounds', async ({ browser }) => {
    test.setTimeout(1800000); // 30 minutes

    const result = await createAutomatedMarathonGame(browser, {
      difficulty: 'hard',
      targetRounds: 20
    });

    page = result.page;
    context = result.context;
    gameId = result.gameId;

    console.log(`\nMemory leak detection test started: ${gameId}`);

    // Monitor with detailed metrics
    const metrics = await monitorMarathonGame(page, {
      maxRounds: 20,
      maxDurationMinutes: 30,
      collectMetrics: true
    });

    // Analyze memory usage
    if (metrics.memorySnapshots.length > 10) {
      const initialMemory = metrics.memorySnapshots[0];
      const finalMemory = metrics.memorySnapshots[metrics.memorySnapshots.length - 1];
      const memoryGrowth = finalMemory - initialMemory;
      const growthPercentage = (memoryGrowth / initialMemory) * 100;

      console.log(`\n=== Memory Analysis ===`);
      console.log(`Initial Memory: ${initialMemory}MB`);
      console.log(`Final Memory: ${finalMemory}MB`);
      console.log(`Growth: ${memoryGrowth}MB (${growthPercentage.toFixed(1)}%)`);

      // Memory growth should be reasonable (< 50% growth over 20 rounds)
      expect(growthPercentage).toBeLessThan(50);

      console.log(`✓ No significant memory leak detected`);
    } else {
      console.log(`⚠ Memory API not available (browser-dependent)`);
    }

    expect(metrics.roundNumbers.length).toBeGreaterThanOrEqual(20);
    expect(metrics.errorCount).toBeLessThan(3);
  });

  test('should maintain performance over extended gameplay', async ({ browser }) => {
    test.setTimeout(1200000); // 20 minutes

    const result = await createAutomatedMarathonGame(browser, {
      difficulty: 'medium',
      targetRounds: 15
    });

    page = result.page;
    context = result.context;
    gameId = result.gameId;

    console.log(`\nPerformance regression test started: ${gameId}`);

    const metrics = await monitorMarathonGame(page, {
      maxRounds: 15,
      maxDurationMinutes: 20,
      collectMetrics: true
    });

    // Analyze round durations for performance regression
    if (metrics.roundDurations.length >= 10) {
      // Compare early rounds (2-5) vs later rounds (11-14)
      const earlyRounds = metrics.roundDurations.slice(1, 5);
      const lateRounds = metrics.roundDurations.slice(Math.max(metrics.roundDurations.length - 4, 5));

      const avgEarly = earlyRounds.reduce((a, b) => a + b) / earlyRounds.length;
      const avgLate = lateRounds.reduce((a, b) => a + b) / lateRounds.length;
      const performanceChange = ((avgLate - avgEarly) / avgEarly) * 100;

      console.log(`\n=== Performance Analysis ===`);
      console.log(`Early Rounds (2-5): ${(avgEarly / 1000).toFixed(1)}s avg`);
      console.log(`Late Rounds (11-14): ${(avgLate / 1000).toFixed(1)}s avg`);
      console.log(`Performance Change: ${performanceChange > 0 ? '+' : ''}${performanceChange.toFixed(1)}%`);

      // Performance should not degrade significantly (< 20% slower)
      expect(performanceChange).toBeLessThan(20);

      console.log(`✓ No significant performance degradation`);
    }

    expect(metrics.roundNumbers.length).toBeGreaterThanOrEqual(15);
  });
});
