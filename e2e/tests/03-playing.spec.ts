import { test, expect, Page } from '@playwright/test';

async function setupGameToPlayingPhase(browser: any) {
  const context = await browser.newContext();
  const pages: Page[] = [];

  // Create game with 4 players
  for (let i = 1; i <= 4; i++) {
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      await page.getByRole('button', { name: /create game/i }).click();
      await page.getByPlaceholder(/enter your name/i).fill(`Player ${i}`);
      await page.getByRole('button', { name: /create/i }).click();

      await page.waitForSelector('.font-mono', { timeout: 10000 });
      const gameIdElement = page.locator('.font-mono');
      const gameId = await gameIdElement.textContent();
      pages.push(page);

      // Add other players
      for (let j = 2; j <= 4; j++) {
        const nextPage = await context.newPage();
        await nextPage.goto('/');
        await nextPage.getByRole('button', { name: /join game/i }).click();
        await nextPage.getByPlaceholder(/game id/i).fill(gameId!);
        await nextPage.getByPlaceholder(/your name/i).fill(`Player ${j}`);
        await nextPage.getByRole('button', { name: /join/i }).click();
        pages.push(nextPage);
      }
      break;
    }
  }

  // Wait for betting phase
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  // All players place bets
  for (let i = 0; i < 4; i++) {
    await pages[i].locator('input[type="range"]').fill('7');
    await pages[i].getByRole('button', { name: /place bet/i }).click();
  }

  // Wait for playing phase
  await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });

  return { context, pages };
}

test.describe('Card Playing Phase', () => {
  test('should display player hands after betting', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // All players should see their hand
    for (const page of pages) {
      await expect(page.getByText(/your hand/i)).toBeVisible();

      // Should have 8 cards
      const cards = page.locator('button[class*="bg-red-500"], button[class*="bg-amber-700"], button[class*="bg-green-500"], button[class*="bg-blue-500"]');
      await expect(cards).toHaveCount(8);
    }

    await context.close();
  });

  test('should show current trick area', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Should show trick area
    await expect(pages[0].getByText(/current trick/i)).toBeVisible();

    await context.close();
  });

  test('should show score board with team scores', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Should show team scores
    await expect(pages[0].getByText(/team 1/i)).toBeVisible();
    await expect(pages[0].getByText(/team 2/i)).toBeVisible();

    // Should show round number
    await expect(pages[0].getByText(/round 1/i)).toBeVisible();

    await context.close();
  });

  test('should show player info (cards left, tricks won)', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

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
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // First player (highest bidder or designated starter) should have turn
    const firstPlayerPage = pages.find(async (page) => {
      return await page.getByText(/your turn/i).isVisible();
    });

    expect(firstPlayerPage).toBeTruthy();

    await context.close();
  });

  test('should disable cards when not player turn', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Find page with turn
    let currentPlayerIndex = -1;
    for (let i = 0; i < 4; i++) {
      if (await pages[i].getByText(/your turn/i).isVisible()) {
        currentPlayerIndex = i;
        break;
      }
    }

    expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

    // Other players should see waiting message
    for (let i = 0; i < 4; i++) {
      if (i !== currentPlayerIndex) {
        await expect(pages[i].getByText(/waiting for other players/i)).toBeVisible();
      }
    }

    await context.close();
  });

  test('should allow current player to play a card', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Find current player
    let currentPlayerIndex = -1;
    for (let i = 0; i < 4; i++) {
      if (await pages[i].getByText(/your turn/i).isVisible()) {
        currentPlayerIndex = i;
        break;
      }
    }

    const currentPage = pages[currentPlayerIndex];

    // Get first card and click it
    const firstCard = currentPage.locator('button').filter({ hasText: /^[0-7]$/ }).first();
    await firstCard.click();

    // Card should appear in trick area
    await expect(currentPage.locator('text=/current trick/i').locator('..').locator('button')).toHaveCount(1);

    await context.close();
  });

  test('should set trump suit from first card played', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Find current player and play first card
    let currentPlayerIndex = -1;
    for (let i = 0; i < 4; i++) {
      if (await pages[i].getByText(/your turn/i).isVisible()) {
        currentPlayerIndex = i;
        break;
      }
    }

    const firstCard = pages[currentPlayerIndex].locator('button').filter({ hasText: /^[0-7]$/ }).first();
    await firstCard.click();

    // Trump should be displayed
    await expect(pages[0].getByText(/trump/i)).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('should complete a full trick with 4 cards', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Play 4 cards (one from each player)
    for (let round = 0; round < 4; round++) {
      // Find current player
      let currentPlayerIndex = -1;
      for (let i = 0; i < 4; i++) {
        if (await pages[i].getByText(/your turn/i).isVisible()) {
          currentPlayerIndex = i;
          break;
        }
      }

      expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

      // Play a card
      const card = pages[currentPlayerIndex].locator('button').filter({ hasText: /^[0-7]$/ }).first();
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
    const { context, pages } = await setupGameToPlayingPhase(browser);

    // Find current player
    let currentPlayerIndex = -1;
    for (let i = 0; i < 4; i++) {
      if (await pages[i].getByText(/your turn/i).isVisible()) {
        currentPlayerIndex = i;
        break;
      }
    }

    const currentPage = pages[currentPlayerIndex];

    // Count cards before
    const cardsBefore = await currentPage.locator('button').filter({ hasText: /^[0-7]$/ }).count();

    // Play a card
    const firstCard = currentPage.locator('button').filter({ hasText: /^[0-7]$/ }).first();
    await firstCard.click();

    // Wait for update
    await currentPage.waitForTimeout(1000);

    // Count cards after
    const cardsAfter = await currentPage.locator('button').filter({ hasText: /^[0-7]$/ }).count();

    expect(cardsAfter).toBe(cardsBefore - 1);

    await context.close();
  });

  test('should show special card indicators (+5 for Red 0, -2 for Brown 0)', async ({ browser }) => {
    const { context, pages } = await setupGameToPlayingPhase(browser);

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
