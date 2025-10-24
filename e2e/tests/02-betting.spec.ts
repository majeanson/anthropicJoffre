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

    // Should see bet amount buttons 7-12 in grid
    await expect(page3.getByRole('button', { name: '7', exact: true })).toBeVisible();
    await expect(page3.getByRole('button', { name: '12', exact: true })).toBeVisible();

    // Should see trump option radio buttons
    await expect(page3.getByText('With Trump (1x)')).toBeVisible();
    await expect(page3.getByText('Without Trump (2x multiplier)')).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should allow selecting different bet amounts', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first (dealer rotates from 0 to 1, so Player 2 is dealer, Player 3 starts)
    const page3 = pages[2];

    // Should be able to click different bet amount buttons
    const bet7Button = page3.getByRole('button', { name: '7', exact: true });
    const bet10Button = page3.getByRole('button', { name: '10', exact: true });

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

    // Should see "Without Trump" radio option
    const noTrumpRadio = page3.getByText('Without Trump (2x multiplier)');
    await expect(noTrumpRadio).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show all players and their bet status', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    const page1 = pages[0];

    // Should show all 4 players in the player list using test IDs
    await expect(page1.getByTestId('player-name-Player 1')).toBeVisible();
    await expect(page1.getByTestId('player-name-Player 2')).toBeVisible();
    await expect(page1.getByTestId('player-name-Player 3')).toBeVisible();
    await expect(page1.getByTestId('player-name-Player 4')).toBeVisible();

    // All should show "Waiting..." initially (in player list, not the turn indicator)
    const waitingTexts = page1.locator('.text-sm.text-umber-500', { hasText: 'Waiting...' });
    await expect(waitingTexts).toHaveCount(4);

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should submit bet and show waiting state', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Player 3 bets first
    const page3 = pages[2];

    // Select 8 points
    await page3.getByRole('button', { name: '8', exact: true }).click();

    // Click Place Bet button
    await page3.getByRole('button', { name: /Place Bet: 8/i }).click();

    // Should show waiting message
    await expect(page3.getByText(/waiting for other players to bet/i)).toBeVisible({ timeout: 10000 });

    // Should not show bet buttons anymore
    await expect(page3.getByRole('button', { name: '8', exact: true })).not.toBeVisible();

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

    // Select 8 points
    await page3.getByRole('button', { name: '8', exact: true }).click();

    // Select "Without Trump" option
    await page3.getByText('Without Trump (2x multiplier)').click();

    // Click Place Bet button
    await page3.getByRole('button', { name: /Place Bet: 8 \(No Trump\)/i }).click();

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

      // Select bet amount
      await page.getByRole('button', { name: String(betAmount), exact: true }).click();

      // Click Place Bet button
      await page.getByRole('button', { name: new RegExp(`Place Bet: ${betAmount}`) }).click();
    }

    // Should transition to playing phase
    await expect(pages[0].getByTestId('player-hand')).toBeVisible({ timeout: 10000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should correctly identify highest bidder', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last)
    // Player 3: 8
    await pages[2].getByRole('button', { name: '8', exact: true }).click();
    await pages[2].getByRole('button', { name: /Place Bet: 8/i }).click();
    await pages[0].locator('.bg-forest-100:has-text("8 points")').waitFor(); // Wait for bet to register

    // Player 4: 9
    await pages[3].getByRole('button', { name: '9', exact: true }).click();
    await pages[3].getByRole('button', { name: /Place Bet: 9/i }).click();
    await pages[0].locator('.bg-forest-100:has-text("9 points")').waitFor(); // Wait for bet to register

    // Player 1: 12 (highest, raises to max)
    await pages[0].getByRole('button', { name: '12', exact: true }).waitFor({ state: 'visible' });
    await pages[0].getByRole('button', { name: '12', exact: true }).click();
    await pages[0].getByRole('button', { name: /Place Bet: 12/i }).click();
    await pages[2].locator('.bg-forest-100:has-text("12 points")').waitFor(); // Wait for bet to register

    // Player 2 (dealer): 12 (matches highest, allowed for dealer)
    await pages[1].getByRole('button', { name: '12', exact: true }).waitFor({ state: 'visible' });
    await pages[1].getByRole('button', { name: '12', exact: true }).click();
    await pages[1].getByRole('button', { name: /Place Bet: 12/i }).click();

    // Wait for playing phase
    await expect(pages[0].getByTestId('player-hand')).toBeVisible({ timeout: 10000 });

    // Player 1 (first with highest bet of 12) should have turn first
    const turnIndicator = pages[0].getByTestId('turn-indicator');
    await expect(turnIndicator).toBeVisible();
    await expect(turnIndicator).toHaveText('Your turn');

    for (const context of contexts) {
      await context.close();
    }
  });
});
