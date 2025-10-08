import { Page, expect } from '@playwright/test';

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

export async function placeAllBets(pages: Page[], bets: number[] = [9, 9, 7, 8], withoutTrump: boolean[] = [false, false, false, false]) {
  // Betting order: Player 3, 4, 1, 2 (Player 2 is first dealer after rotation)
  // bets array is in PLAYER order [P1, P2, P3, P4], not betting order
  // Default: P3=7 (first), P4=8, P1=9, P2=9 (dealer matches) → [9, 9, 7, 8]
  const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2

  for (let i = 0; i < bettingOrder.length; i++) {
    const pageIndex = bettingOrder[i];
    const page = pages[pageIndex];

    // Wait for this player's turn
    await page.getByRole('button', { name: /place bet/i }).waitFor({ timeout: 15000 });

    await page.locator('input[type="range"]').fill(bets[pageIndex].toString());

    if (withoutTrump[pageIndex]) {
      await page.locator('input[type="checkbox"]#withoutTrump').check();
    }

    await page.getByRole('button', { name: /place bet/i }).click();

    // Wait for bet to register
    if (i < bettingOrder.length - 1) {
      await pages[0].waitForTimeout(500);
    }
  }

  // Wait for playing phase
  await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });
}

export async function playCard(page: Page, cardIndex: number = 0) {
  const handArea = page.locator('text=/your hand/i').locator('..');
  const cards = handArea.locator('[data-card-value]');
  const card = cards.nth(cardIndex);
  await card.click();
}

export async function findCurrentPlayerIndex(pages: Page[]): Promise<number> {
  // Wait for at least one page to show the turn indicator
  const promises = pages.map((page, index) =>
    page.getByText(/your turn/i).isVisible().then(visible => visible ? index : -1)
  );

  const results = await Promise.all(promises);
  const currentIndex = results.find(index => index !== -1);

  return currentIndex !== undefined ? currentIndex : -1;
}

export async function playFullTrick(pages: Page[]) {
  for (let i = 0; i < 4; i++) {
    // Wait a bit for state to settle
    await pages[0].waitForTimeout(200);

    // Find which page has the turn
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

    // Play card immediately with force to handle rapid re-renders
    const currentPage = pages[pageWithTurn];
    const handArea = currentPage.locator('text=/your hand/i').locator('..');
    const card = handArea.locator('[data-card-value]').first();
    await card.click({ force: true });

    // Wait for card to be played (card count should decrease or trick area should update)
    await pages[0].waitForTimeout(300);
  }

  // After 4 cards, the trick should be resolved and a new turn should start
  // Wait for any player to show the turn indicator
  await Promise.race(
    pages.map(page => page.waitForSelector('text=/your turn/i', { timeout: 10000 }))
  );
}

export async function playFullRound(pages: Page[]) {
  // Play all 8 tricks (8 cards per player)
  for (let trick = 0; trick < 8; trick++) {
    await playFullTrick(pages);
  }

  // Wait for scoring phase to appear
  await pages[0].waitForSelector('text=/round.*complete/i', { timeout: 10000 });
}
