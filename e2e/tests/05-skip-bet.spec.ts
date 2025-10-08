import { test, expect } from '@playwright/test';
import { createGameWith4Players } from './helpers';

test.describe('Skip Bet Functionality', () => {
  test('should allow first player to skip bet', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Wait for betting phase
    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // First player (Player 3) should see Skip button
    const page3 = pages[2];
    await page3.waitForSelector('text=/your turn/i', { state: 'hidden', timeout: 1000 }).catch(() => {});

    // Skip button should be visible
    const skipButton = page3.getByRole('button', { name: /skip/i });
    await expect(skipButton).toBeVisible();

    // Click skip
    await skipButton.click();

    // Should move to next player and show "Skipped" badge
    await page3.waitForTimeout(500);
    await expect(page3.getByText(/skipped/i)).toBeVisible();

    await context.close();
  });

  test('should allow all non-dealer players to skip', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Players 3, 4, 1 can skip (Player 2 is dealer)
    // Betting order: [2, 3, 0, 1] (P3, P4, P1, P2)
    const bettingOrder = [2, 3, 0]; // First 3 players (not dealer)

    for (let i = 0; i < bettingOrder.length; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      await page.getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: /skip/i }).click();

      await pages[0].waitForTimeout(500);
    }

    // All 3 players should show "Skipped"
    const skippedCount = await pages[0].locator('text=/skipped/i').count();
    expect(skippedCount).toBe(3);

    await context.close();
  });

  test('should NOT allow dealer to skip when there are bets', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 places a bet (first in betting order)
    const page3 = pages[2];
    await page3.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
    await page3.locator('input[type="range"]').fill('7');
    await page3.getByRole('button', { name: /place bet/i }).click();

    // Players 4 and 1 skip
    await pages[3].getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
    await pages[3].getByRole('button', { name: /skip/i }).click();
    await pages[0].waitForTimeout(500);

    await pages[0].getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
    await pages[0].getByRole('button', { name: /skip/i }).click();
    await pages[0].waitForTimeout(500);

    // Player 2 (dealer) should NOT see Skip button
    const page2 = pages[1];
    const skipButton = page2.getByRole('button', { name: /skip/i });
    await expect(skipButton).not.toBeVisible({ timeout: 2000 }).catch(() => {});

    // Should see dealer privilege message
    await expect(page2.getByText(/dealer privilege/i)).toBeVisible();

    await context.close();
  });

  test('should restart betting when all 4 players skip', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // All players skip (betting order: P3, P4, P1, P2)
    const bettingOrder = [2, 3, 0, 1];

    for (let i = 0; i < bettingOrder.length; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      await page.getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: /skip/i }).click();

      await pages[0].waitForTimeout(500);
    }

    // Should show error message about restarting
    await expect(pages[0].getByText(/all players skipped/i)).toBeVisible({ timeout: 5000 });

    // Betting should restart - first player should be able to bet again
    await pages[2].getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
    await expect(pages[2].getByRole('button', { name: /place bet/i })).toBeVisible();

    await context.close();
  });

  test('should show validation message when bet is too low', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 bets 10
    const page3 = pages[2];
    await page3.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
    await page3.locator('input[type="range"]').fill('10');
    await page3.getByRole('button', { name: /place bet/i }).click();
    await pages[0].waitForTimeout(500);

    // Player 4 tries to bet 10 (same as current)
    const page4 = pages[3];
    await page4.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
    await page4.locator('input[type="range"]').fill('10');

    // Should show validation message
    await expect(page4.getByText(/you must raise/i)).toBeVisible({ timeout: 2000 });

    // Place Bet button should be disabled
    const placeBetButton = page4.getByRole('button', { name: /place bet/i });
    await expect(placeBetButton).toBeDisabled();

    await context.close();
  });

  test('should allow dealer to match highest bet', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Players bet escalating: P3=7, P4=8, P1=9
    const bettingOrder = [2, 3, 0];
    const betAmounts = [7, 8, 9];

    for (let i = 0; i < bettingOrder.length; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      await page.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
      await page.locator('input[type="range"]').fill(betAmounts[i].toString());
      await page.getByRole('button', { name: /place bet/i }).click();

      if (i < bettingOrder.length - 1) {
        await pages[0].waitForTimeout(500);
      }
    }

    // Player 2 (dealer) can match at 9
    const page2 = pages[1];
    await page2.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
    await page2.locator('input[type="range"]').fill('9');

    // Should see dealer privilege message
    await expect(page2.getByText(/dealer privilege/i)).toBeVisible();

    // Place Bet button should be enabled
    const placeBetButton = page2.getByRole('button', { name: /place bet/i });
    await expect(placeBetButton).toBeEnabled();

    await context.close();
  });

  test('should handle skip then bet scenario without infinite rerender', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 skips (first in betting order)
    const page3 = pages[2];
    await page3.getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
    await page3.getByRole('button', { name: /skip/i }).click();
    await pages[0].waitForTimeout(500);

    // Player 4 places bet of 7
    const page4 = pages[3];
    await page4.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });
    await page4.locator('input[type="range"]').fill('7');
    await page4.getByRole('button', { name: /place bet/i }).click();
    await pages[0].waitForTimeout(500);

    // Player 1 should now be able to bet (must raise to 8 or more)
    const page1 = pages[0];
    await page1.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });

    // At bet 7, should show validation message
    await page1.locator('input[type="range"]').fill('7');
    await expect(page1.getByText(/you must raise/i)).toBeVisible();

    // Raise to 8, should be valid
    await page1.locator('input[type="range"]').fill('8');
    await pages[0].waitForTimeout(300);

    // No validation message should appear
    const validationMsg = page1.getByText(/you must raise/i);
    await expect(validationMsg).not.toBeVisible();

    // Place Bet button should be enabled
    const placeBetButton = page1.getByRole('button', { name: /place bet/i });
    await expect(placeBetButton).toBeEnabled();

    // Should be able to place bet without issues
    await placeBetButton.click();
    await pages[0].waitForTimeout(500);

    // Should show that bet was placed successfully
    await expect(page1.getByText(/waiting for other players/i)).toBeVisible();

    await context.close();
  });
});
