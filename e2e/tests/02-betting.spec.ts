import { test, expect, Page } from '@playwright/test';

async function createGameWith4Players(browser: any) {
  const pages: Page[] = [];
  const contexts: any[] = [];
  let gameId: string | null = null;

  for (let i = 1; i <= 4; i++) {
    // Create separate context for each player to avoid localStorage sharing
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      // Create game using test IDs
      await page.getByTestId('create-game-button').click();
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-create-button').click();

      // Get game ID using test ID
      await page.getByTestId('game-id').waitFor({ timeout: 10000 });
      gameId = await page.getByTestId('game-id').textContent();
    } else {
      // Join game using test IDs
      await page.getByTestId('join-game-button').click();
      await page.getByTestId('game-id-input').fill(gameId!);
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-join-button').click();
    }

    pages.push(page);
    contexts.push(context);
  }

  // Wait for team selection to be ready, then start game using test ID
  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });
  await pages[0].getByTestId('start-game-button').click();

  // Wait for betting phase to start
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  return { contexts, pages, gameId };
}

test.describe('Betting Phase', () => {
  test('should show betting phase after 4 players join', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // All players should see betting phase
    for (const page of pages) {
      await expect(page.getByRole('heading', { name: /betting phase/i })).toBeVisible();
    }

    for (const context of contexts) {
      for (const context of contexts) {
      await context.close();
    }
    }
  });

  test('should display bet amount selector (7-12)', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first (after dealer rotation)
    const page3 = pages[2];

    // Should see bet buttons for amounts 7-12 using test IDs
    await expect(page3.getByTestId('bet-7-with-trump')).toBeVisible();
    await expect(page3.getByTestId('bet-12-with-trump')).toBeVisible();

    // Should see "No Trump" options using test IDs
    await expect(page3.getByTestId('bet-7-without-trump')).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should allow selecting different bet amounts', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first (dealer rotates from 0 to 1, so Player 2 is dealer, Player 3 starts)
    const page3 = pages[2];

    // Should be able to click different bet amount buttons using test IDs
    const bet7Button = page3.getByTestId('bet-7-with-trump');
    const bet10Button = page3.getByTestId('bet-10-with-trump');

    await expect(bet7Button).toBeVisible();
    await expect(bet10Button).toBeVisible();

    // Both should be enabled (no bets placed yet)
    await expect(bet7Button).toBeEnabled();
    await expect(bet10Button).toBeEnabled();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should allow selecting "without trump" option', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Should see "No Trump" buttons using test IDs
    const noTrumpButton = page3.getByTestId('bet-7-without-trump');
    await expect(noTrumpButton).toBeVisible();
    await expect(noTrumpButton).toBeEnabled();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show all players and their bet status', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];

    // Should show all 4 players in the player list (look within player bet sections)
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 1' })).toBeVisible();
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 2' })).toBeVisible();
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 3' })).toBeVisible();
    await expect(page1.locator('.bg-gray-50 .font-medium', { hasText: 'Player 4' })).toBeVisible();

    // All should show "Waiting..." initially (in player list, not the turn indicator)
    const waitingTexts = page1.locator('.text-sm.text-gray-500', { hasText: 'Waiting...' });
    await expect(waitingTexts).toHaveCount(4);

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should submit bet and show waiting state', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Click bet button for 8 points using test ID
    await page3.getByTestId('bet-8-with-trump').click();

    // Should show waiting message
    await expect(page3.getByText(/waiting for other players to bet/i)).toBeVisible({ timeout: 10000 });

    // Should not show bet buttons anymore
    await expect(page3.getByTestId('bet-8-with-trump')).not.toBeVisible();

    // Other players should see Player 3's bet
    await expect(pages[0].getByText(/8 points/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show "No Trump" indicator for without-trump bets', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Click "No Trump" button for 8 points using test ID
    await page3.getByTestId('bet-8-without-trump').click();

    // Other players should see "No Trump" indicator
    await expect(pages[0].getByText(/no trump/i)).toBeVisible({ timeout: 10000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should transition to playing phase when all bets are placed', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last)
    const bettingOrder = [2, 3, 0, 1]; // indices for pages array
    const bets = [7, 8, 9, 10];

    for (let i = 0; i < 4; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];
      const betAmount = bets[i];
      await page.getByTestId(`bet-${betAmount}-with-trump`).click();
    }

    // Should transition to playing phase
    await expect(pages[0].getByText(/your hand/i)).toBeVisible({ timeout: 10000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should correctly identify highest bidder', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last)
    // Player 3: 8
    await pages[2].getByTestId('bet-8-with-trump').click();
    await pages[0].locator('.bg-green-100:has-text("8 points")').waitFor(); // Wait for bet to register

    // Player 4: 9
    await pages[3].getByTestId('bet-9-with-trump').click();
    await pages[0].locator('.bg-green-100:has-text("9 points")').waitFor(); // Wait for bet to register

    // Player 1: 12 (highest, raises to max)
    await pages[0].getByTestId('bet-12-with-trump').waitFor({ state: 'visible' });
    await pages[0].getByTestId('bet-12-with-trump').click();
    await pages[2].locator('.bg-green-100:has-text("12 points")').waitFor(); // Wait for bet to register

    // Player 2 (dealer): 12 (matches highest, allowed for dealer)
    await pages[1].getByTestId('bet-12-with-trump').waitFor({ state: 'visible' });
    await pages[1].getByTestId('bet-12-with-trump').click();

    // Wait for playing phase
    await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });

    // Player 1 (first with highest bet of 12) should have turn first
    await expect(pages[0].getByText(/your turn/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });
});
