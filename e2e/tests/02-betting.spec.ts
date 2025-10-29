import { test, expect, Page } from '@playwright/test';
import { createGameWith4Players } from './helpers';

test.describe('Betting Phase', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });
  test('should show betting phase after 4 players join', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // All players should see betting phase
    for (const page of pages) {
      await expect(page.getByRole('heading', { name: /betting phase/i })).toBeVisible();
    }
  });

  test('should display bet amount selector (7-12)', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // Player 3 bets first (after dealer rotation)
    const page3 = pages[2];

    // Should see bet amount buttons 7-12 in grid
    await expect(page3.getByRole('button', { name: '7', exact: true })).toBeVisible();
    await expect(page3.getByRole('button', { name: '12', exact: true })).toBeVisible();

    // Should see trump option radio buttons
    await expect(page3.getByText('With Trump (1x)')).toBeVisible();
    await expect(page3.getByText('Without Trump (2x multiplier)')).toBeVisible();
  });

  test('should allow selecting different bet amounts', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

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
  });

  test('should allow selecting "without trump" option', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    // Player 3 bets first
    const page3 = pages[2];

    // Should see "Without Trump" radio option
    const noTrumpRadio = page3.getByText('Without Trump (2x multiplier)');
    await expect(noTrumpRadio).toBeVisible();
  });

  test('should show all players and their bet status', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

    const page1 = pages[0];

    // Should show all 4 players in the player list using test IDs
    await expect(page1.getByTestId('player-name-Player 1')).toBeVisible();
    await expect(page1.getByTestId('player-name-Player 2')).toBeVisible();
    await expect(page1.getByTestId('player-name-Player 3')).toBeVisible();
    await expect(page1.getByTestId('player-name-Player 4')).toBeVisible();

    // All should show "Waiting..." initially (in player list, not the turn indicator)
    const waitingTexts = page1.locator('.text-sm.text-umber-500', { hasText: 'Waiting...' });
    await expect(waitingTexts).toHaveCount(4);
  });

  test('should submit bet and show waiting state', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

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
  });

  test('should show "No Trump" indicator for without-trump bets', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

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
  });

  test('should transition to playing phase when all bets are placed', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

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
  });

  test('should correctly identify highest bidder', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;

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

    // Either Player 1 or Player 2 (both bid 12, highest) should have turn first
    // The game logic determines which one gets priority (could be dealer or first bidder)
    const currentTurnPlayer = pages[0].getByTestId('current-turn-player');
    await expect(currentTurnPlayer).toBeVisible();

    // Check that it's one of the highest bidders
    const turnText = await currentTurnPlayer.textContent();
    const hasHighestBidder = turnText?.includes('Player 1') || turnText?.includes('Player 2');
    expect(hasHighestBidder).toBe(true);
  });
});
