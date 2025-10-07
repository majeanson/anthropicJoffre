import { Page } from '@playwright/test';

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

  return { context, pages, gameId };
}

export async function placeAllBets(pages: Page[], bets: number[] = [7, 7, 7, 7], withoutTrump: boolean[] = [false, false, false, false]) {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    await page.locator('input[type="range"]').fill(bets[i].toString());

    if (withoutTrump[i]) {
      await page.locator('input[type="checkbox"]#withoutTrump').check();
    }

    await page.getByRole('button', { name: /place bet/i }).click();
  }

  // Wait for playing phase
  await pages[0].waitForSelector('text=/your hand/i', { timeout: 10000 });
}

export async function playCard(page: Page, cardIndex: number = 0) {
  const cards = page.locator('button').filter({ hasText: /^[0-7]$/ });
  const card = cards.nth(cardIndex);
  await card.click();
  await page.waitForTimeout(500); // Wait for state update
}

export async function findCurrentPlayerIndex(pages: Page[]): Promise<number> {
  for (let i = 0; i < pages.length; i++) {
    if (await pages[i].getByText(/your turn/i).isVisible()) {
      return i;
    }
  }
  return -1;
}

export async function playFullTrick(pages: Page[]) {
  for (let i = 0; i < 4; i++) {
    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    if (currentPlayerIndex === -1) break;

    await playCard(pages[currentPlayerIndex]);
    await pages[0].waitForTimeout(500);
  }

  // Wait for trick resolution
  await pages[0].waitForTimeout(2000);
}

export async function playFullRound(pages: Page[]) {
  // Play all 8 tricks (8 cards per player)
  for (let trick = 0; trick < 8; trick++) {
    await playFullTrick(pages);
  }

  // Wait for scoring phase
  await pages[0].waitForTimeout(2000);
}
