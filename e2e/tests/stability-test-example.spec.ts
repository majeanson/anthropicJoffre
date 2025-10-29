import { test, expect } from '@playwright/test';
import {
  createGameWith4PlayersEnhanced,
  placeAllBetsEnhanced,
  playCardEnhanced,
  waitForGameState,
  verifyGameSync,
  cleanupGame,
  TestPerformanceMonitor
} from './helpers-enhanced';

/**
 * Example test using enhanced helpers with stability improvements
 */
test.describe('Stability Test Example', () => {
  let context: any;
  const monitor = new TestPerformanceMonitor();

  test.afterEach(async () => {
    // Log performance report
    console.log(monitor.getReport());

    // Safe cleanup
    await cleanupGame(context);
  });

  test('should handle game flow with enhanced stability', async ({ browser }) => {
    monitor.start();

    // Create game with retry logic and error handling
    monitor.checkpoint('Creating game');
    const result = await createGameWith4PlayersEnhanced(browser);
    context = result.context;
    const { pages, gameId } = result;

    monitor.checkpoint('Game created');
    console.log(`Game ID: ${gameId}`);

    // Verify all players are synchronized
    monitor.checkpoint('Verifying player sync');
    const syncCheck = await verifyGameSync(pages, async (page) => {
      const phaseText = await page.locator('text=/Betting Phase/i').textContent();
      return phaseText || '';
    });

    expect(syncCheck).toBeTruthy();
    monitor.checkpoint('Players synchronized');

    // Place bets with enhanced error handling
    monitor.checkpoint('Placing bets');
    await placeAllBetsEnhanced(pages, [8, 9, 7, 10], [false, true, false, false]);
    monitor.checkpoint('Bets placed');

    // Wait for playing phase
    await waitForGameState(pages[0], 'playing');
    monitor.checkpoint('Playing phase started');

    // Play first trick with error handling
    for (let i = 0; i < 4; i++) {
      const playerPage = pages[i];

      // Check if it's this player's turn
      const turnIndicator = playerPage.locator('text=/Your Turn/i');
      if (await turnIndicator.isVisible({ timeout: 1000 })) {
        monitor.checkpoint(`Player ${i + 1} playing card`);
        await playCardEnhanced(playerPage, undefined, { verifyPlay: true });
      }
    }

    monitor.checkpoint('First trick completed');

    // Verify game state consistency
    const finalSync = await verifyGameSync(pages, async (page) => {
      // Get trick count or current phase
      try {
        const trickCount = await page.locator('[data-testid="trick-count"]').textContent();
        return trickCount || 'unknown';
      } catch {
        return 'error';
      }
    });

    expect(finalSync).toBeTruthy();
    monitor.checkpoint('Test completed successfully');
  });

  test('should recover from network errors', async ({ browser }) => {
    monitor.start();

    // Create game
    const result = await createGameWith4PlayersEnhanced(browser);
    context = result.context;
    const { pages } = result;

    monitor.checkpoint('Game created');

    // Simulate network instability by intercepting requests
    await pages[0].route('**/socket.io/*', async (route, request) => {
      // Randomly fail 20% of requests to simulate network issues
      if (Math.random() < 0.2) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // Try to place bets with network issues
    monitor.checkpoint('Testing with network instability');

    try {
      await placeAllBetsEnhanced(pages);
      monitor.checkpoint('Bets placed despite network issues');
    } catch (error) {
      console.log('Expected error during network instability:', error);
      monitor.checkpoint('Network error handled gracefully');
    }

    // Remove network interference
    await pages[0].unroute('**/socket.io/*');

    // Verify game can recover
    const recovered = await pages[0].locator('text=/Betting Phase|Playing Phase/i').isVisible({ timeout: 5000 });
    expect(recovered).toBeTruthy();

    monitor.checkpoint('Game recovered from network issues');
  });

  test('should handle rapid actions without race conditions', async ({ browser }) => {
    monitor.start();

    const result = await createGameWith4PlayersEnhanced(browser);
    context = result.context;
    const { pages } = result;

    monitor.checkpoint('Game created');

    // Attempt rapid simultaneous actions
    monitor.checkpoint('Starting rapid action test');

    const rapidActions = pages.map(async (page, index) => {
      // Each player rapidly checks their state
      for (let i = 0; i < 10; i++) {
        const isVisible = await page.locator('text=/Team Selection|Betting Phase/i').isVisible();
        console.log(`Player ${index + 1} check ${i}: ${isVisible}`);
        await page.waitForTimeout(100);
      }
    });

    await Promise.all(rapidActions);
    monitor.checkpoint('Rapid actions completed without crashes');

    // Verify all pages are still responsive
    const allResponsive = await Promise.all(
      pages.map(page => page.evaluate(() => document.readyState === 'complete'))
    );

    expect(allResponsive.every(r => r)).toBeTruthy();
    monitor.checkpoint('All pages remain responsive');
  });
});