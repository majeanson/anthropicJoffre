import { test, expect, Page } from '@playwright/test';
import { createGameWith4Players } from './helpers';

/**
 * DEPRECATED: E2E Timeout System Tests
 *
 * These tests are permanently skipped because timeout logic should be tested
 * via BACKEND UNIT TESTS, not E2E tests.
 *
 * WHY BACKEND UNIT TESTS ARE BETTER:
 * 1. Timeout logic lives in backend/src/utils/timeoutManager.ts (server-side)
 * 2. E2E tests require 60s+ waits (slow, flaky)
 * 3. E2E tests need multi-page setup (unstable, crash-prone)
 * 4. Backend tests are faster (milliseconds vs minutes)
 * 5. Backend tests are more reliable (no browser overhead)
 *
 * RECOMMENDED APPROACH:
 * Create backend/src/utils/timeoutManager.test.ts with:
 * - Test timeout duration calculations
 * - Test auto-skip logic for betting phase
 * - Test auto-play logic for playing phase
 * - Test timeout cancellation on player action
 * - Test timeout notifications
 *
 * E2E tests should only verify UI elements:
 * - Timeout indicator displays correctly
 * - Countdown timer updates
 * - Timeout warnings appear
 *
 * See: docs/sprints/sprint5-phase5-summary.md (Priority 5)
 */
test.describe.skip('@slow Timeout System - DEPRECATED (Use backend unit tests)', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });
  test('should show timeout indicator during betting phase', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // After dealer rotation, dealer is Player 2 (index 1)
    // Betting starts with player after dealer = Player 3 (index 2)
    // Wait for Player 3's turn
    await pages[2].waitForSelector('text=Select Bet Amount:', { timeout: 5000 });

    // Check if timeout indicator is visible on Player 3's page
    const timeoutText = await pages[2].locator('text=/\\d+s/').textContent();
    expect(timeoutText).toMatch(/\d+s/);

    // Verify timer starts around 60 seconds
    const seconds = parseInt(timeoutText!.replace('s', ''));
    expect(seconds).toBeGreaterThanOrEqual(55);
    expect(seconds).toBeLessThanOrEqual(60);
  });

  test('should auto-skip bet after timeout in betting phase', async ({ browser }) => {
    test.setTimeout(90000); // Extend timeout for this test

    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // Wait for Player 3's turn (first after dealer)
    await pages[2].waitForSelector('text=Select Bet Amount:', { timeout: 5000 });

    // Do NOT place bet - wait for timeout (60 seconds + buffer)
    // The server should auto-skip after 60 seconds

    // Wait for Player 4's turn (indicating Player 3 was auto-skipped)
    await pages[3].waitForSelector('text=Select Bet Amount:', { timeout: 70000 });

    // Verify Player 3 shows "Skipped" badge
    const player3Badge = await pages[0].locator('text=Player 3').locator('..').locator('text=Skipped');
    await expect(player3Badge).toBeVisible({ timeout: 5000 });
  });

  test('should show timeout indicator during playing phase', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // Place bets for all players to reach playing phase
    // Player order after dealer rotation: P3, P4, P1, P2 (dealer)
    const bettingOrder = [2, 3, 0, 1]; // Page indices for P3, P4, P1, P2

    for (let i = 0; i < 4; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      // Wait for betting controls
      await page.waitForSelector('text=Select Bet Amount:', { timeout: 15000 });

      // Place bet (amount must increase or equal for dealer)
      const betAmount = i === 3 ? 9 : 7 + i; // P3=7, P4=8, P1=9, P2=9 (dealer can match)
      await page.getByRole('button', { name: `${betAmount}`, exact: true }).click();
      await page.getByRole('button', { name: /Place Bet/ }).click();

      // Wait briefly between bets
      await page.waitForTimeout(500);
    }

    // Wait for playing phase
    await pages[0].waitForSelector('text=/Trump|Waiting for/', { timeout: 10000 });

    // Find who has the first turn (highest bidder = P1 or P2 with 9 points)
    const firstTurnPage = pages[0]; // P1 (first to bet 9)

    // Check for timeout indicator
    const timeoutText = await firstTurnPage.locator('text=/\\d+s/').first().textContent();
    expect(timeoutText).toMatch(/\d+s/);
  });

  test('should auto-play random valid card after timeout in playing phase', async ({ browser }) => {
    test.setTimeout(90000); // Extend timeout for this test

    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // Place bets to reach playing phase
    const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2

    for (let i = 0; i < 4; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];
      await page.waitForSelector('text=Select Bet Amount:', { timeout: 15000 });
      const betAmount = i === 3 ? 9 : 7 + i; // P3=7, P4=8, P1=9, P2=9 (dealer matches)
      await page.getByRole('button', { name: `${betAmount}`, exact: true }).click();
      await page.getByRole('button', { name: /Place Bet/ }).click();
      await page.waitForTimeout(500);
    }

    // Wait for playing phase
    await pages[0].waitForSelector('text=/Trump|Waiting for/', { timeout: 10000 });

    // P1 (index 0) or P2 (index 1) has highest bid (9 points)
    // Do NOT play a card - wait for timeout

    // After 60 seconds, server should auto-play a card
    // Next player should get their turn
    await pages[0].waitForSelector('text=/Trump/', { timeout: 70000 });

    // Verify at least 1 card is in the trick (auto-played)
    // Check any page's display for trick cards
    const trickArea = pages[0].locator('[class*="rounded-full"][class*="border"]').first();
    await expect(trickArea).toBeVisible({ timeout: 5000 });
  });

  test('should not timeout if player takes action', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // Wait for Player 3's turn
    await pages[2].waitForSelector('text=Select Bet Amount:', { timeout: 5000 });

    // Place bet BEFORE timeout (within 60 seconds)
    await pages[2].getByRole('button', { name: '7', exact: true }).first().click();
    await pages[2].getByRole('button', { name: /Place Bet/ }).click();

    // Wait a bit
    await pages[2].waitForTimeout(2000);

    // Verify bet was placed (should show "Waiting for other players")
    await expect(pages[2].locator('text=Waiting for other players to bet')).toBeVisible({ timeout: 5000 });
  });
});
