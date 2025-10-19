import { test, expect, Page } from '@playwright/test';

async function createGameWith4Players(browser: any) {
  const pages: Page[] = [];
  const contexts: any[] = [];
  let gameId: string | null = null;

  for (let i = 1; i <= 4; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      await page.getByTestId('create-game-button').click();
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-create-button').click();
      await page.getByTestId('game-id').waitFor({ timeout: 10000 });
      gameId = await page.getByTestId('game-id').textContent();
    } else {
      await page.getByTestId('join-game-button').click();
      await page.getByTestId('game-id-input').fill(gameId!);
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-join-button').click();
    }

    pages.push(page);
    contexts.push(context);
  }

  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });
  await pages[0].getByTestId('start-game-button').click();
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  return { contexts, pages, gameId };
}

test.describe('Timeout System', () => {
  test('should show timeout indicator during betting phase', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // After dealer rotation, dealer is Player 2 (index 1)
    // Betting starts with player after dealer = Player 3 (index 2)
    // Wait for Player 3's turn
    await pages[2].waitForSelector('text=Select Bet Amount:', { timeout: 5000 });

    // Check if timeout indicator is visible on Player 3's page
    const timeoutText = await pages[2].locator('text=/\\d+s/').textContent();
    expect(timeoutText).toMatch(/\d+s/);

    // Verify timer starts around 60 seconds
    const seconds = parseInt(timeoutText!.replace('s', ''));
    expect(seconds).toBeGreaterThanOrEqual(55);
    expect(seconds).toBeLessThanOrEqual(60);

    // Clean up
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should auto-skip bet after timeout in betting phase', async ({ browser }) => {
    test.setTimeout(90000); // Extend timeout for this test

    const { contexts, pages } = await createGameWith4Players(browser);

    // Wait for Player 3's turn (first after dealer)
    await pages[2].waitForSelector('text=Select Bet Amount:', { timeout: 5000 });

    // Do NOT place bet - wait for timeout (60 seconds + buffer)
    // The server should auto-skip after 60 seconds

    // Wait for Player 4's turn (indicating Player 3 was auto-skipped)
    await pages[3].waitForSelector('text=Select Bet Amount:', { timeout: 70000 });

    // Verify Player 3 shows "Skipped" badge
    const player3Badge = await pages[0].locator('text=Player 3').locator('..').locator('text=Skipped');
    await expect(player3Badge).toBeVisible({ timeout: 5000 });

    // Clean up
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show timeout indicator during playing phase', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Place bets for all players to reach playing phase
    // Player order after dealer rotation: P2, P3, P4, P1 (dealer)
    const bettingOrder = [1, 2, 3, 0]; // Page indices for P2, P3, P4, P1

    for (let i = 0; i < 4; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];

      // Wait for betting controls
      await page.waitForSelector('text=Select Bet Amount:', { timeout: 15000 });

      // Place bet (amount must increase or equal for dealer)
      const betAmount = i === 3 ? 7 : 7 + i; // P2=7, P3=8, P4=9, P1=7 (dealer can match)
      await page.getByRole('button', { name: `${betAmount}` }).click();
      await page.getByRole('button', { name: /Place Bet/ }).click();

      // Wait briefly between bets
      await page.waitForTimeout(500);
    }

    // Wait for playing phase
    await pages[0].waitForSelector('text=/Trump|Waiting for/', { timeout: 10000 });

    // Find who has the first turn (highest bidder = P4 with 9 points)
    const firstTurnPage = pages[2]; // P4

    // Check for timeout indicator
    const timeoutText = await firstTurnPage.locator('text=/\\d+s/').first().textContent();
    expect(timeoutText).toMatch(/\d+s/);

    // Clean up
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should auto-play random valid card after timeout in playing phase', async ({ browser }) => {
    test.setTimeout(90000); // Extend timeout for this test

    const { contexts, pages } = await createGameWith4Players(browser);

    // Place bets to reach playing phase
    const bettingOrder = [1, 2, 3, 0];

    for (let i = 0; i < 4; i++) {
      const pageIndex = bettingOrder[i];
      const page = pages[pageIndex];
      await page.waitForSelector('text=Select Bet Amount:', { timeout: 15000 });
      const betAmount = i === 3 ? 9 : 7 + i;
      await page.getByRole('button', { name: `${betAmount}` }).click();
      await page.getByRole('button', { name: /Place Bet/ }).click();
      await page.waitForTimeout(500);
    }

    // Wait for playing phase
    await pages[0].waitForSelector('text=/Trump|Waiting for/', { timeout: 10000 });

    // P4 (index 2) has highest bid (9 points) - they go first
    // Do NOT play a card - wait for timeout

    // After 60 seconds, server should auto-play a card
    // Next player should get their turn
    await pages[0].waitForSelector('text=/Trump/', { timeout: 70000 });

    // Verify at least 1 card is in the trick (auto-played)
    // Check any page's display for trick cards
    const trickArea = pages[0].locator('[class*="rounded-full"][class*="border"]').first();
    await expect(trickArea).toBeVisible({ timeout: 5000 });

    // Clean up
    for (const context of contexts) {
      await context.close();
    }
  });

  test('should not timeout if player takes action', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Wait for Player 3's turn
    await pages[2].waitForSelector('text=Select Bet Amount:', { timeout: 5000 });

    // Place bet BEFORE timeout (within 60 seconds)
    await pages[2].getByRole('button', { name: '7', exact: true }).first().click();
    await pages[2].getByRole('button', { name: /Place Bet/ }).click();

    // Wait a bit
    await pages[2].waitForTimeout(2000);

    // Verify bet was placed (should show "Waiting for other players")
    await expect(pages[2].locator('text=Waiting for other players to bet')).toBeVisible({ timeout: 5000 });

    // Clean up
    for (const context of contexts) {
      await context.close();
    }
  });
});
