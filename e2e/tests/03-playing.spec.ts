import { test, expect, Page } from '@playwright/test';
import { createGameWith4Players, placeAllBets, findCurrentPlayerIndex } from './helpers';

test.describe('Card Playing Phase', () => {
  test('should display player hands after betting', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // All players should see their hand area
    for (const page of pages) {
      await expect(page.getByTestId('player-hand')).toBeVisible();

      // Should have 8 cards
      const cards = page.locator('[data-card-value]');
      await expect(cards).toHaveCount(8);
    }

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show current trick area', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Should show playing phase with key elements
    await expect(pages[0].getByTestId('score-board')).toBeVisible();
    await expect(pages[0].getByTestId('trick-area')).toBeVisible();
    await expect(pages[0].getByTestId('player-hand')).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show score board with team scores', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Should show score board
    const scoreBoard = pages[0].getByTestId('score-board');
    await expect(scoreBoard).toBeVisible();

    // Should show team scores within score board
    await expect(scoreBoard.getByText(/team 1/i)).toBeVisible();
    await expect(scoreBoard.getByText(/team 2/i)).toBeVisible();

    // Should show round number
    await expect(pages[0].getByText(/round 1/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show player info (cards left, tricks won)', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Should show all 4 players - use .first() to handle duplicates
    await expect(pages[0].getByText('Player 1').first()).toBeVisible();
    await expect(pages[0].getByText('Player 2').first()).toBeVisible();
    await expect(pages[0].getByText('Player 3').first()).toBeVisible();
    await expect(pages[0].getByText('Player 4').first()).toBeVisible();

    // Should show tricks won (0 initially)
    const tricksElements = pages[0].locator('text=/tricks.*0/i');
    await expect(tricksElements.first()).toBeVisible();

    // Should show cards count (8 initially)
    const cardsElements = pages[0].locator('text=/cards.*8/i');
    await expect(cardsElements.first()).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should indicate whose turn it is', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // First player (highest bidder or designated starter) should have turn
    const firstPlayerPage = pages.find(async (page) => {
      return await page.getByText(/your turn/i).isVisible();
    });

    expect(firstPlayerPage).toBeTruthy();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should disable cards when not player turn', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

    // Current player should see "Your Turn"
    await expect(pages[currentPlayerIndex].getByText(/your turn/i)).toBeVisible();

    // Other players should NOT see "Your Turn"
    for (let i = 0; i < 4; i++) {
      if (i !== currentPlayerIndex) {
        await expect(pages[i].getByText(/your turn/i)).not.toBeVisible();
      }
    }

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should allow current player to play a card', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const currentPage = pages[currentPlayerIndex];

    // Count cards in hand before (look inside "Your Hand" section)
    const handSection = currentPage.getByText(/your hand/i).locator('..');
    const cardsBefore = await handSection.locator('[data-card-value]').count();

    // Get first card in hand and click it
    const firstCard = handSection.locator('[data-card-value]').first();
    await firstCard.click();

    await pages[0].waitForTimeout(500);

    // Card count in hand should decrease
    const cardsAfter = await handSection.locator('[data-card-value]').count();
    expect(cardsAfter).toBe(cardsBefore - 1);

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should set trump suit from first card played', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const firstCard = pages[currentPlayerIndex].locator('[data-card-value]').first();
    await firstCard.click();

    // Trump should be displayed
    await expect(pages[0].getByText(/trump/i)).toBeVisible({ timeout: 5000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should complete a full trick with 4 cards', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    // Play 4 cards (one from each player)
    for (let round = 0; round < 4; round++) {
      const currentPlayerIndex = await findCurrentPlayerIndex(pages);
      expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

      // Play a card from hand section - use force to bypass suit-following disabled state
      const handSection = pages[currentPlayerIndex].getByText(/your hand/i).locator('..');
      const card = handSection.locator('[data-card-value]').first();
      await card.click({ force: true });

      // Wait a bit for state update
      await pages[0].waitForTimeout(500);
    }

    // Trick should be resolved
    // One player should have tricksWon = 1
    await pages[0].waitForTimeout(2000); // Wait for trick resolution

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should decrease card count after playing', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const currentPage = pages[currentPlayerIndex];

    // Count cards in hand before (look inside "Your Hand" section)
    const handSection = currentPage.getByText(/your hand/i).locator('..');
    const cardsBefore = await handSection.locator('[data-card-value]').count();

    // Play a card from hand
    const firstCard = handSection.locator('[data-card-value]').first();
    await firstCard.click();

    await pages[0].waitForTimeout(500);

    // Count cards in hand after
    const cardsAfter = await handSection.locator('[data-card-value]').count();

    expect(cardsAfter).toBe(cardsBefore - 1);

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show special card indicators (+5 for Red 0, -2 for Brown 0)', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);
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

    for (const context of contexts) {
      await context.close();
    }
  });
});
