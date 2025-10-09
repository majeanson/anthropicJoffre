import { Page, expect } from '@playwright/test';

/**
 * Creates a game with 4 players and advances to the betting phase.
 * Players are assigned to teams 1-2-1-2 by default.
 * Player 2 will be the first dealer after rotation.
 *
 * @returns Object with browser context, page instances, and game ID
 */
export async function createGameWith4Players(browser: any) {
  const context = await browser.newContext();
  const pages: Page[] = [];
  let gameId: string | null = null;

  for (let i = 1; i <= 4; i++) {
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      await page.getByRole('button', { name: /create game/i }).click();
      await page.getByPlaceholder(/enter your name/i).fill(`Player ${i}`);
      await page.getByRole('button', { name: /create/i }).click();

      await page.waitForSelector('.font-mono', { timeout: 10000 });
      const gameIdElement = page.locator('.font-mono');
      gameId = await gameIdElement.textContent();
    } else {
      await page.getByRole('button', { name: /join game/i }).click();
      await page.getByPlaceholder(/game id/i).fill(gameId!);
      await page.getByPlaceholder(/your name/i).fill(`Player ${i}`);
      await page.getByRole('button', { name: /join/i }).click();
    }

    pages.push(page);
  }

  // Wait for team selection, then start game
  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });
  await pages[0].getByRole('button', { name: /start game/i }).click();

  // Wait for betting phase to begin
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  return { context, pages, gameId };
}

/**
 * Places bets for all 4 players in the correct order and advances to playing phase.
 * Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last).
 *
 * @param pages - Array of page instances for all 4 players
 * @param bets - Bet amounts in PLAYER order [P1, P2, P3, P4]. Default: [9, 9, 7, 8]
 * @param withoutTrump - Whether each player bets without trump, in PLAYER order
 */
export async function placeAllBets(pages: Page[], bets: number[] = [9, 9, 7, 8], withoutTrump: boolean[] = [false, false, false, false]) {
  const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2 (betting order)

  for (let i = 0; i < bettingOrder.length; i++) {
    const pageIndex = bettingOrder[i];
    const page = pages[pageIndex];
    const betAmount = bets[pageIndex];
    const noTrump = withoutTrump[pageIndex];

    // Wait for bet button to appear (means it's this player's turn)
    const betButtonText = noTrump ? `${betAmount} (No Trump)` : `${betAmount}`;
    const betButton = page.locator(`button:has-text("${betButtonText}")`).first();
    await betButton.waitFor({ state: 'visible', timeout: 15000 });
    await betButton.click();

    // Wait for bet to register
    if (i < bettingOrder.length - 1) {
      await pages[0].waitForTimeout(500);
    }
  }

  // Wait for playing phase
  await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });
}

/**
 * Plays a card from the current player's hand.
 *
 * @param page - The page instance of the player
 * @param cardIndex - Index of the card to play (default: 0 for first card)
 */
export async function playCard(page: Page, cardIndex: number = 0) {
  const handArea = page.locator('text=/your hand/i').locator('..');
  const cards = handArea.locator('[data-card-value]');
  const card = cards.nth(cardIndex);
  await card.click();
}

/**
 * Finds which player currently has their turn.
 *
 * @param pages - Array of all player page instances
 * @returns Index of the player with current turn, or -1 if not found
 */
export async function findCurrentPlayerIndex(pages: Page[]): Promise<number> {
  const promises = pages.map((page, index) =>
    page.getByText(/your turn/i).isVisible().then(visible => visible ? index : -1)
  );

  const results = await Promise.all(promises);
  const currentIndex = results.find(index => index !== -1);

  return currentIndex !== undefined ? currentIndex : -1;
}

/**
 * Plays one complete trick (4 cards, one from each player).
 * Automatically finds the current player for each card and plays it.
 *
 * @param pages - Array of all player page instances
 */
export async function playFullTrick(pages: Page[]) {
  for (let i = 0; i < 4; i++) {
    await pages[0].waitForTimeout(200);

    const results = await Promise.all(
      pages.map(async (page, index) => {
        const hasTurn = await page.getByText(/your turn/i).isVisible();
        return hasTurn ? index : -1;
      })
    );

    const pageWithTurn = results.find(idx => idx !== -1);
    if (pageWithTurn === undefined) {
      throw new Error(`Could not find current player at card ${i + 1} of trick`);
    }

    const currentPage = pages[pageWithTurn];
    const handArea = currentPage.locator('text=/your hand/i').locator('..');
    const card = handArea.locator('[data-card-value]').first();
    await card.click({ force: true });

    await pages[0].waitForTimeout(300);
  }

  // Wait for trick to resolve and next turn to start
  await Promise.race(
    pages.map(page => page.waitForSelector('text=/your turn/i', { timeout: 10000 }))
  );
}

/**
 * Plays a complete round (8 tricks) and waits for scoring phase.
 *
 * @param pages - Array of all player page instances
 */
export async function playFullRound(pages: Page[]) {
  for (let trick = 0; trick < 8; trick++) {
    await playFullTrick(pages);
  }

  await pages[0].waitForSelector('text=/round.*complete/i', { timeout: 10000 });
}
