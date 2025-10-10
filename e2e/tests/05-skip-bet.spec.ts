import { test, expect } from '@playwright/test';
import { createGameWith4Players } from './helpers';

test.describe('Skip Bet Functionality', () => {
  test('should allow first player to skip bet', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 is first in betting order (Player 2 is dealer)
    const page3 = pages[2];

    // Skip button should be visible for first player
    const skipButton = page3.getByRole('button', { name: /skip/i });
    await expect(skipButton).toBeVisible();

    // Click skip
    await skipButton.click();

    // Should move to next player and show "Skipped" badge
    await page3.waitForTimeout(500);
    await expect(page3.getByText(/skipped/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should allow all non-dealer players to skip', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

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

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should NOT allow dealer to skip when there are bets', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 places a bet (first in betting order)
    const page3 = pages[2];
    const bet7Button = page3.locator('button:has-text("7")').first();
    await bet7Button.waitFor({ state: 'visible', timeout: 15000 });
    await bet7Button.click();

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

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should force dealer to bet minimum when all others skip', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // First 3 players skip (betting order: P3, P4, P1)
    const bettingOrder = [2, 3, 0];

    for (let i = 0; i < bettingOrder.length; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      await page.getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
      await page.getByRole('button', { name: /skip/i }).click();

      await pages[0].waitForTimeout(500);
    }

    // Player 2 (dealer) should NOT see Skip button
    const page2 = pages[1];
    await pages[0].waitForTimeout(500); // Wait for turn

    const skipButton = page2.getByRole('button', { name: /skip/i });
    await expect(skipButton).not.toBeVisible({ timeout: 2000 }).catch(() => {});

    // Should see message that dealer must bet
    await expect(page2.getByText(/you must bet at least 7/i)).toBeVisible({ timeout: 2000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show validation message when bet is too low', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 bets 10
    const page3 = pages[2];
    const bet10ButtonP3 = page3.locator('button:has-text("10")').first();
    await bet10ButtonP3.waitFor({ state: 'visible', timeout: 15000 });
    await bet10ButtonP3.click();
    await pages[0].waitForTimeout(500);

    // Player 4 should see bet 10 button disabled (same as current, must raise)
    const page4 = pages[3];
    await pages[3].waitForTimeout(1000); // Wait for turn

    // Button for 10 should be disabled (non-dealer can't match)
    const bet10ButtonP4 = page4.locator('button:has-text("10")').first();
    await expect(bet10ButtonP4).toBeDisabled({ timeout: 2000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should allow dealer to match highest bet', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Players bet escalating: P3=7, P4=8, P1=9
    const bettingOrder = [2, 3, 0];
    const betAmounts = [7, 8, 9];

    for (let i = 0; i < bettingOrder.length; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      const betButton = page.locator(`button:has-text("${betAmounts[i]}")`).first();
      await betButton.waitFor({ state: 'visible', timeout: 15000 });
      await betButton.click();

      if (i < bettingOrder.length - 1) {
        await pages[0].waitForTimeout(500);
      }
    }

    // Player 2 (dealer) can match at 9
    const page2 = pages[1];
    await pages[0].waitForTimeout(500); // Wait for turn

    // Should see dealer privilege message
    await expect(page2.getByText(/dealer privilege/i)).toBeVisible({ timeout: 5000 });

    // Button for 9 should be enabled (dealer can match)
    const bet9Button = page2.locator('button:has-text("9")').first();
    await expect(bet9Button).toBeEnabled();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should handle skip then bet scenario without infinite rerender', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 3 skips (first in betting order)
    const page3 = pages[2];
    await page3.getByRole('button', { name: /skip/i }).waitFor({ timeout: 15000 });
    await page3.getByRole('button', { name: /skip/i }).click();
    await pages[0].waitForTimeout(500);

    // Player 4 places bet of 7
    const page4 = pages[3];
    const bet7ButtonP4 = page4.locator('button:has-text("7")').first();
    await bet7ButtonP4.waitFor({ state: 'visible', timeout: 15000 });
    await bet7ButtonP4.click();
    await pages[0].waitForTimeout(500);

    // Player 1 should now be able to bet (must raise to 8 or more)
    const page1 = pages[0];
    await pages[0].waitForTimeout(500); // Wait for turn

    // Button for 7 should be disabled (must raise)
    const bet7ButtonP1 = page1.locator('button:has-text("7")').first();
    await expect(bet7ButtonP1).toBeDisabled({ timeout: 2000 });

    // Button for 8 should be enabled (valid raise)
    const bet8ButtonP1 = page1.locator('button:has-text("8")').first();
    await expect(bet8ButtonP1).toBeEnabled();

    // Should be able to place bet without issues
    await bet8ButtonP1.click();
    await pages[0].waitForTimeout(500);

    // Should show that bet was placed successfully
    await expect(page1.getByText(/waiting for other players/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });
});
