import { test, expect } from '@playwright/test';
import {
  TestPerformanceMonitor
} from './helpers-enhanced';

/**
 * Example test using enhanced helpers with stability improvements
 */
test.describe('Stability Test Example', () => {
  const monitor = new TestPerformanceMonitor();

  test.afterEach(async () => {
    // Log performance report
    console.log(monitor.getReport());
  });

  test('should handle game flow with enhanced stability (Single Player + Bots)', async ({ page }) => {
    test.setTimeout(90000); // Increase timeout for bot auto-betting
    monitor.start();

    // Use Quick Play for single player + 3 bots (much more stable)
    monitor.checkpoint('Creating game');
    await page.goto('http://localhost:5173');
    await page.getByTestId('quick-play-button').click();

    // Wait for game creation
    await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });
    const gameId = await page.getByTestId('game-id').textContent();
    console.log(`Game ID: ${gameId}`);
    monitor.checkpoint('Game created');

    // Wait for bots to join (3 bots)
    await page.waitForTimeout(2000);

    // Start the game
    await page.getByTestId('start-game-button').click();
    monitor.checkpoint('Game started');

    // Wait for betting phase
    await page.waitForSelector('text=/betting/i', { state: 'visible', timeout: 10000 });
    monitor.checkpoint('Betting phase started');

    // Place bet (dealer privilege allows equalizing)
    const betAmount = page.getByRole('button', { name: '10', exact: true });
    await betAmount.waitFor({ state: 'visible', timeout: 10000 });
    await betAmount.click();

    const placeBetButton = page.getByRole('button', { name: /place bet: 10$/i });
    await placeBetButton.waitFor({ state: 'visible', timeout: 5000 });
    await placeBetButton.click();
    monitor.checkpoint('Bet placed');

    // Wait for playing phase (bots need time to auto-bet)
    // Check for cards in hand (more reliable than text)
    await page.locator('[data-card-value]').first().waitFor({ state: 'visible', timeout: 30000 });
    monitor.checkpoint('Playing phase started');

    // Verify we have playable cards in hand
    const cardCount = await page.locator('[data-card-value]').count();
    expect(cardCount).toBeGreaterThan(0);
    monitor.checkpoint(`Found ${cardCount} cards in hand`);

    // Verify game is in valid playing state
    await page.waitForTimeout(2000);
    const hasCards = await page.locator('[data-card-value]').first().isVisible();
    expect(hasCards).toBeTruthy();

    monitor.checkpoint('Game flow completed successfully');
  });

  test('should recover from network errors (Single Player + Bots)', async ({ page }) => {
    monitor.start();

    // Create game with Quick Play
    await page.goto('http://localhost:5173');
    await page.getByTestId('quick-play-button').click();

    // Wait for game creation
    await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });
    monitor.checkpoint('Game created');

    // Wait for bots and start game
    await page.waitForTimeout(2000);
    await page.getByTestId('start-game-button').click();

    // Simulate network instability by intercepting requests (20% failure rate)
    await page.route('**/socket.io/*', async (route, request) => {
      if (Math.random() < 0.2) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    monitor.checkpoint('Testing with network instability');

    // Try to place bet despite network issues
    try {
      await page.waitForSelector('text=/betting/i', { state: 'visible', timeout: 10000 });
      const betAmount = page.getByRole('button', { name: '10', exact: true });
      await betAmount.waitFor({ state: 'visible', timeout: 10000 });
      await betAmount.click();

      const placeBetButton = page.getByRole('button', { name: /place bet: 10$/i });
      await placeBetButton.waitFor({ state: 'visible', timeout: 5000 });
      await placeBetButton.click();
      monitor.checkpoint('Bets placed despite network issues');
    } catch (error) {
      console.log('Expected error during network instability:', error);
      monitor.checkpoint('Network error handled gracefully');
    }

    // Remove network interference
    await page.unroute('**/socket.io/*');

    // Verify game can recover
    const recovered = await page.locator('text=/Betting Phase|Playing Phase/i').isVisible({ timeout: 10000 });
    expect(recovered).toBeTruthy();

    monitor.checkpoint('Game recovered from network issues');
  });

  test('should handle rapid actions without race conditions (Single Player + Bots)', async ({ page }) => {
    monitor.start();

    // Create game with Quick Play
    monitor.checkpoint('Creating game');
    await page.goto('http://localhost:5173');
    await page.getByTestId('quick-play-button').click();

    // Wait for game creation
    await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });
    monitor.checkpoint('Game created');

    // Wait for bots to join
    await page.waitForTimeout(2000);

    // Attempt rapid UI state checks
    monitor.checkpoint('Starting rapid action test');

    // Rapidly check multiple UI elements (50 checks in parallel)
    const rapidChecks = [];
    for (let i = 0; i < 50; i++) {
      rapidChecks.push(
        page.locator('text=/Team Selection|Game ID/i').isVisible().catch(() => false)
      );
    }

    const results = await Promise.all(rapidChecks);
    const successfulChecks = results.filter(r => r === true).length;
    console.log(`Rapid checks completed: ${successfulChecks}/${results.length} successful`);

    monitor.checkpoint('Rapid actions completed without crashes');

    // Verify page is still responsive
    const isResponsive = await page.evaluate(() => document.readyState === 'complete');
    expect(isResponsive).toBeTruthy();

    // Verify game UI is still functional
    const startButton = await page.getByTestId('start-game-button').isVisible();
    expect(startButton).toBeTruthy();

    monitor.checkpoint('Page remains responsive and functional');
  });
});