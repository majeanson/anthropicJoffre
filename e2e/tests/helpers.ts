import { Page, expect } from '@playwright/test';

/**
 * Creates a game with 4 players and advances to the betting phase.
 * Players are assigned to teams 1-2-1-2 by default.
 * Player 2 will be the first dealer after rotation.
 *
 * @returns Object with browser context, page instances, and game ID
 */
export async function createGameWith4Players(browser: any) {
  const pages: Page[] = [];
  const contexts: any[] = [];
  let gameId: string | null = null;

  for (let i = 1; i <= 4; i++) {
    // Create separate context for each player to avoid localStorage sharing
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      // Use test IDs for reliable selectors
      await page.getByTestId('create-game-button').click();
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-create-button').click();

      await page.getByTestId('game-id').waitFor({ timeout: 10000 });
      gameId = await page.getByTestId('game-id').textContent();
    } else {
      // Use test IDs for reliable selectors
      await page.getByTestId('join-game-button').click();
      await page.getByTestId('game-id-input').fill(gameId!);
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-join-button').click();
    }

    pages.push(page);
    contexts.push(context);
  }

  // Wait for team selection, then start game using test ID
  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });
  await pages[0].getByTestId('start-game-button').click();

  // Wait for betting phase to begin
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  return { contexts, pages, gameId };
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

    // Wait for bet amount button to appear (means it's this player's turn)
    const amountButton = page.getByRole('button', { name: String(betAmount), exact: true });
    await amountButton.waitFor({ state: 'visible', timeout: 15000 });
    await amountButton.click();

    // If without trump, click the "Without Trump" radio option
    if (noTrump) {
      await page.getByText('Without Trump (2x multiplier)').click();
    }

    // Click the Place Bet button
    const placeBetPattern = noTrump
      ? new RegExp(`Place Bet: ${betAmount} \\(No Trump\\)`)
      : new RegExp(`Place Bet: ${betAmount}`);
    await page.getByRole('button', { name: placeBetPattern }).click();

    // Wait for bet to register
    if (i < bettingOrder.length - 1) {
      await pages[0].waitForTimeout(500);
    }
  }

  // Wait for playing phase - check for cards to be visible
  await pages[0].locator('[data-card-value]').first().waitFor({ timeout: 10000 });
}

/**
 * Plays a card from the current player's hand.
 *
 * @param page - The page instance of the player
 * @param cardIndex - Index of the card to play (default: 0 for first card)
 */
export async function playCard(page: Page, cardIndex: number = 0) {
  const cards = page.locator('[data-card-value]');
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
  // Check pages sequentially to avoid "Target crashed" errors
  for (let i = 0; i < pages.length; i++) {
    try {
      const hasTurn = await pages[i].getByText(/your turn/i).isVisible({ timeout: 500 });
      if (hasTurn) {
        return i;
      }
    } catch {
      // Page might not have text, continue checking
    }
  }

  return -1;
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

    // Find current player by checking pages sequentially (avoid parallel "Target crashed" issues)
    let pageWithTurn = -1;
    for (let j = 0; j < pages.length; j++) {
      try {
        const hasTurn = await pages[j].getByText(/your turn/i).isVisible({ timeout: 500 });
        if (hasTurn) {
          pageWithTurn = j;
          break;
        }
      } catch {
        // Page might not have loaded yet or text not present, continue checking
      }
    }

    if (pageWithTurn === -1) {
      throw new Error(`Could not find current player at card ${i + 1} of trick`);
    }

    const currentPage = pages[pageWithTurn];
    const card = currentPage.locator('[data-card-value]').first();
    await card.click({ force: true });

    await pages[0].waitForTimeout(300);
  }

  // Wait for trick to resolve and next turn to start
  await pages[0].waitForTimeout(3500); // Wait for trick resolution
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

  // Wait for scoring phase to appear with text "Round {N} Complete!"
  await pages[0].waitForSelector('text=/round \\d+ complete/i', { timeout: 10000 });
}
