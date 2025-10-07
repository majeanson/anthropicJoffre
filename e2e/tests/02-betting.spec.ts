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

    const page1 = pages[0];

    // Should see range slider
    const slider = page1.locator('input[type="range"][min="7"][max="12"]');
    await expect(slider).toBeVisible();

    // Default should be 7
    const displayedBet = page1.locator('text=/^7$/');
    await expect(displayedBet).toBeVisible();

    await context.close();
  });

  test('should allow changing bet amount', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];
    const slider = page1.locator('input[type="range"]');

    // Change to 10
    await slider.fill('10');

    // Should display 10
    await expect(page1.locator('text=/^10$/').first()).toBeVisible();

    await context.close();
  });

  test('should allow selecting "without trump" option', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];
    const checkbox = page1.locator('input[type="checkbox"]#withoutTrump');

    // Should be unchecked by default
    await expect(checkbox).not.toBeChecked();

    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    await context.close();
  });

  test('should show all players and their bet status', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];

    // Should show all 4 players
    await expect(page1.getByText('Player 1')).toBeVisible();
    await expect(page1.getByText('Player 2')).toBeVisible();
    await expect(page1.getByText('Player 3')).toBeVisible();
    await expect(page1.getByText('Player 4')).toBeVisible();

    // All should show "Waiting..." initially
    const waitingTexts = page1.locator('text=/waiting/i');
    await expect(waitingTexts).toHaveCount(4);

    await context.close();
  });

  test('should submit bet and show waiting state', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];

    // Set bet amount
    const slider = page1.locator('input[type="range"]');
    await slider.fill('8');

    // Submit bet
    await page1.getByRole('button', { name: /place bet/i }).click();

    // Should show waiting message
    await expect(page1.getByText(/waiting for other players to bet/i)).toBeVisible();

    // Should not show bet form anymore
    await expect(page1.getByRole('button', { name: /place bet/i })).not.toBeVisible();

    // Other players should see Player 1's bet
    await expect(pages[1].getByText(/8 tricks/i)).toBeVisible();

    await context.close();
  });

  test('should show "No Trump" indicator for without-trump bets', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];

    // Select without trump
    await page1.locator('input[type="checkbox"]#withoutTrump').check();

    // Submit bet
    await page1.getByRole('button', { name: /place bet/i }).click();

    // Other players should see "No Trump" indicator
    await expect(pages[1].getByText(/no trump/i)).toBeVisible();

    await context.close();
  });

  test('should transition to playing phase when all bets are placed', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // All players place bets
    for (let i = 0; i < 4; i++) {
      const page = pages[i];
      const slider = page.locator('input[type="range"]');
      await slider.fill(`${7 + i}`); // Different bets: 7, 8, 9, 10
      await page.getByRole('button', { name: /place bet/i }).click();
    }

    // Should transition to playing phase
    await expect(pages[0].getByText(/your hand/i)).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('should correctly identify highest bidder', async ({ browser }) => {
    const { context, pages } = await createGameWith4Players(browser);

    // Player 1: 7
    await pages[0].locator('input[type="range"]').fill('7');
    await pages[0].getByRole('button', { name: /place bet/i }).click();

    // Player 2: 12 (highest)
    await pages[1].locator('input[type="range"]').fill('12');
    await pages[1].getByRole('button', { name: /place bet/i }).click();

    // Player 3: 8
    await pages[2].locator('input[type="range"]').fill('8');
    await pages[2].getByRole('button', { name: /place bet/i }).click();

    // Player 4: 9
    await pages[3].locator('input[type="range"]').fill('9');
    await pages[3].getByRole('button', { name: /place bet/i }).click();

    // Wait for playing phase
    await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });

    // Player 2 (highest bidder) should have turn first
    await expect(pages[1].getByText(/your turn/i)).toBeVisible();

    await context.close();
  });
});
