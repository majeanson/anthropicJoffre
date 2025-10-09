import { test, expect, Page } from '@playwright/test';

async function createGameWith4Players(browser: any) {
  const context = await browser.newContext();
  const pages: Page[] = [];
  let gameId: string | null = null;

  for (let i = 1; i <= 4; i++) {
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      // Create game
      await page.getByRole('button', { name: /create game/i }).click();
      await page.getByPlaceholder(/enter your name/i).fill(`Player ${i}`);
      await page.getByRole('button', { name: /create/i }).click();

      // Get game ID
      await page.waitForSelector('.font-mono', { timeout: 10000 });
      const gameIdElement = page.locator('.font-mono');
      gameId = await gameIdElement.textContent();
    } else {
      // Join game
      await page.getByRole('button', { name: /join game/i }).click();
      await page.getByPlaceholder(/game id/i).fill(gameId!);
      await page.getByPlaceholder(/your name/i).fill(`Player ${i}`);
      await page.getByRole('button', { name: /join/i }).click();
    }

    pages.push(page);
  }

  // Wait for team selection to be ready, then start game
  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });
  await pages[0].getByRole('button', { name: /start game/i }).click();

  // Wait for betting phase to start
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  return { context, pages, gameId };
}

test.describe('Betting Phase', () => {
  test('should show betting phase after 4 players join', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // All players should see betting phase
    for (const page of pages) {
      await expect(page.getByRole('heading', { name: /betting phase/i })).toBeVisible();
    }

    await context.close();
  });

  test('should display bet amount selector (7-12)', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 3 bets first (after dealer rotation)
    const page3 = pages[2];

    // Should see bet buttons for amounts 7-12
    await expect(page3.locator('button:has-text("7")').first()).toBeVisible();
    await expect(page3.locator('button:has-text("12")').first()).toBeVisible();

    // Should see "No Trump" options
    await expect(page3.locator('button:has-text("(No Trump)")').first()).toBeVisible();

    await context.close();
  });

  test('should allow selecting different bet amounts', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 3 bets first (dealer rotates from 0 to 1, so Player 2 is dealer, Player 3 starts)
    const page3 = pages[2];

    // Should be able to click different bet amount buttons
    const bet7Button = page3.locator('button:has-text("7")').first();
    const bet10Button = page3.locator('button:has-text("10")').first();

    await expect(bet7Button).toBeVisible();
    await expect(bet10Button).toBeVisible();

    // Both should be enabled (no bets placed yet)
    await expect(bet7Button).toBeEnabled();
    await expect(bet10Button).toBeEnabled();

    await context.close();
  });

  test('should allow selecting "without trump" option', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Should see "No Trump" buttons
    const noTrumpButton = page3.locator('button:has-text("(No Trump)")').first();
    await expect(noTrumpButton).toBeVisible();
    await expect(noTrumpButton).toBeEnabled();

    await context.close();
  });

  test('should show all players and their bet status', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];

    // Should show all 4 players in the player list (look within player bet sections)
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 1' })).toBeVisible();
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 2' })).toBeVisible();
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 3' })).toBeVisible();
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 4' })).toBeVisible();

    // All should show "Waiting..." initially (in player list, not the turn indicator)
    const waitingTexts = page1.locator('.text-sm.text-gray-500', { hasText: 'Waiting...' });
    await expect(waitingTexts).toHaveCount(4);

    await context.close();
  });

  test('should submit bet and show waiting state', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Click bet button for 8 points
    await page3.locator('button:has-text("8")').first().click();

    // Should show waiting message
    await expect(page3.getByText(/waiting for other players to bet/i)).toBeVisible({ timeout: 10000 });

    // Should not show bet buttons anymore
    await expect(page3.locator('button:has-text("8")').first()).not.toBeVisible();

    // Other players should see Player 3's bet
    await expect(pages[0].getByText(/8 points/i)).toBeVisible();

    await context.close();
  });

  test('should show "No Trump" indicator for without-trump bets', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Click "No Trump" button for 8 points
    await page3.locator('button:has-text("8 (No Trump)")').click();

    // Other players should see "No Trump" indicator
    await expect(pages[0].getByText(/no trump/i)).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('should transition to playing phase when all bets are placed', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last)
    const bettingOrder = [2, 3, 0, 1]; // indices for pages array
    const bets = [7, 8, 9, 10];

    for (let i = 0; i < 4; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];
      const betAmount = bets[i];
      await page.locator(`button:has-text("${betAmount}")`).first().click();
    }

    // Should transition to playing phase
    await expect(pages[0].getByText(/your hand/i)).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('should correctly identify highest bidder', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last)
    // Player 3: 8
    await pages[2].locator('button:has-text("8")').first().click();
    await pages[0].locator('.bg-green-100:has-text("8 points")').waitFor(); // Wait for bet to register

    // Player 4: 9
    await pages[3].locator('button:has-text("9")').first().click();
    await pages[0].locator('.bg-green-100:has-text("9 points")').waitFor(); // Wait for bet to register

    // Player 1: 12 (highest, raises to max)
    await pages[0].locator('button:has-text("12")').first().waitFor({ state: 'visible' });
    await pages[0].locator('button:has-text("12")').first().click();
    await pages[2].locator('.bg-green-100:has-text("12 points")').waitFor(); // Wait for bet to register

    // Player 2 (dealer): 12 (matches highest, allowed for dealer)
    await pages[1].locator('button:has-text("12")').first().waitFor({ state: 'visible' });
    await pages[1].locator('button:has-text("12")').first().click();

    // Wait for playing phase
    await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });

    // Player 1 (first with highest bet of 12) should have turn first
    await expect(pages[0].getByText(/your turn/i)).toBeVisible();

    await context.close();
  });
});
