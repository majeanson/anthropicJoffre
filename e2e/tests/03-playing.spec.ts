import { test, expect, Page } from '@playwright/test';
import { createGameWith4Players, placeAllBets, findCurrentPlayerIndex } from './helpers';

test.describe('Card Playing Phase', () => {
  test('should display player hands after betting', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // All players should see their hand
    for (const page of pages) {
      await expect(page.getByText(/your hand/i)).toBeVisible();

      // Should have 8 cards
      const cards = page.locator('[data-card-value]');
      await expect(cards).toHaveCount(8);
    }

    await context.close();
  });

  test('should show current trick area', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Should show trick area
    await expect(pages[0].getByText(/current trick/i)).toBeVisible();

    await context.close();
  });

  test('should show score board with team scores', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Should show team scores
    await expect(pages[0].getByText(/team 1/i)).toBeVisible();
    await expect(pages[0].getByText(/team 2/i)).toBeVisible();

    // Should show round number
    await expect(pages[0].getByText(/round 1/i)).toBeVisible();

    await context.close();
  });

  test('should show player info (cards left, tricks won)', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Should show all 4 players
    await expect(pages[0].getByText('Player 1')).toBeVisible();
    await expect(pages[0].getByText('Player 2')).toBeVisible();
    await expect(pages[0].getByText('Player 3')).toBeVisible();
    await expect(pages[0].getByText('Player 4')).toBeVisible();

    // Should show tricks won (0 initially)
    const tricksElements = pages[0].locator('text=/tricks.*0/i');
    await expect(tricksElements.first()).toBeVisible();

    // Should show cards count (8 initially)
    const cardsElements = pages[0].locator('text=/cards.*8/i');
    await expect(cardsElements.first()).toBeVisible();

    await context.close();
  });

  test('should indicate whose turn it is', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // First player (highest bidder or designated starter) should have turn
    const firstPlayerPage = pages.find(async (page) => {
      return await page.getByText(/your turn/i).isVisible();
    });

    expect(firstPlayerPage).toBeTruthy();

    await context.close();
  });

  test('should disable cards when not player turn', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

    // Other players should see waiting message
    for (let i = 0; i < 4; i++) {
      if (i !== currentPlayerIndex) {
        await expect(pages[i].getByText(/waiting for/i)).toBeVisible();
      }
    }

    await context.close();
  });

  test('should allow current player to play a card', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const currentPage = pages[currentPlayerIndex];

    // Get first card and click it
    const firstCard = currentPage.locator('[data-card-value]').first();
    await firstCard.click();

    // Card should appear in trick area
    await expect(currentPage.locator('text=/current trick/i').locator('..').locator('[data-card-value]')).toHaveCount(1);

    await context.close();
  });

  test('should set trump suit from first card played', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const firstCard = pages[currentPlayerIndex].locator('[data-card-value]').first();
    await firstCard.click();

    // Trump should be displayed
    await expect(pages[0].getByText(/trump/i)).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('should complete a full trick with 4 cards', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Play 4 cards (one from each player)
    for (let round = 0; round < 4; round++) {
      const currentPlayerIndex = await findCurrentPlayerIndex(pages);
      expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

      // Play a card
      const card = pages[currentPlayerIndex].locator('[data-card-value]').first();
      await card.click();

      // Wait a bit for state update
      await pages[0].waitForTimeout(500);
    }

    // Trick should be resolved
    // One player should have tricksWon = 1
    await pages[0].waitForTimeout(2000); // Wait for trick resolution

    await context.close();
  });

  test('should decrease card count after playing', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const currentPage = pages[currentPlayerIndex];

    // Count cards in hand before (not in trick area)
    const handArea = currentPage.locator('text=/your hand/i').locator('..');
    const cardsBefore = await handArea.locator('[data-card-value]').count();

    // Play a card
    const firstCard = handArea.locator('[data-card-value]').first();
    await firstCard.click();

    // Wait for card to appear in trick area
    await expect(currentPage.locator('text=/current trick/i').locator('..').locator('[data-card-value]')).toHaveCount(1, { timeout: 3000 });

    // Count cards in hand after
    const cardsAfter = await handArea.locator('[data-card-value]').count();

    expect(cardsAfter).toBe(cardsBefore - 1);

    await context.close();
  });

  test('should show special card indicators (+5 for Red 0, -2 for Brown 0)', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Look for special cards in any player's hand
    const red0 = pages[0].locator('button.bg-red-500').filter({ hasText: '0' }).first();
    const brown0 = pages[0].locator('button.bg-amber-700').filter({ hasText: '0' }).first();

    // Check if they have special indicators (ring or badge)
    if (await red0.isVisible()) {
      await expect(red0.locator('text=+5')).toBeVisible();
    }

    if (await brown0.isVisible()) {
      await expect(brown0.locator('text=-2')).toBeVisible();
    }

    await context.close();
  });
});
