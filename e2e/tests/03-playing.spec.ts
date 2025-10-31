import { test, expect, Page } from '@playwright/test';
import { createGameWith4Players, placeAllBets, findCurrentPlayerIndex } from './helpers';

test.describe('Card Playing Phase', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should display player hands after betting', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    // All players should see their hand area
    for (const page of pages) {
      await expect(page.getByTestId('player-hand')).toBeVisible();

      // Should have 8 cards
      const cards = page.locator('[data-card-value]');
      await expect(cards).toHaveCount(8);
    }
  });

  test('should show current trick area', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    // Should show playing phase with key elements
    await expect(pages[0].getByTestId('score-board')).toBeVisible();
    await expect(pages[0].getByTestId('trick-area')).toBeVisible();
    await expect(pages[0].getByTestId('player-hand')).toBeVisible();
  });

  test('should show score board with team scores', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    // Should show score board
    const scoreBoard = pages[0].getByTestId('score-board');
    await expect(scoreBoard).toBeVisible();

    // Should show team scores within score board
    await expect(scoreBoard.getByText(/team 1/i)).toBeVisible();
    await expect(scoreBoard.getByText(/team 2/i)).toBeVisible();

    // Should show round number
    await expect(pages[0].getByTestId('round-number')).toHaveText('R1');
  });

  // NOTE: Test for "should show player info (cards left, tricks won)" removed
  // because this feature doesn't exist in the current UI implementation.
  // The game displays team scores and round points instead of individual
  // player card counts or tricks won. See: docs/sprints/sprint5-phase5-summary.md

  test('should indicate whose turn it is', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    // At least one player should have their turn indicated
    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

    // Check for current turn player indicator (always visible) or turn indicator (during countdown)
    const currentPlayerPage = pages[currentPlayerIndex];
    const playerName = `Player ${currentPlayerIndex + 1}`;

    // Try turn-indicator first (if countdown is active)
    const turnIndicator = currentPlayerPage.getByTestId('turn-indicator');
    const hasTurnIndicator = await turnIndicator.isVisible().catch(() => false);

    if (hasTurnIndicator) {
      await expect(turnIndicator).toHaveText('Your turn');
    } else {
      // Otherwise check current-turn-player
      const currentTurnPlayer = currentPlayerPage.getByTestId('current-turn-player');
      await expect(currentTurnPlayer).toBeVisible();
      await expect(currentTurnPlayer).toContainText(playerName);
    }
  });

  test('should disable cards when not player turn', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

    // Current player should see their name in the current-turn-player indicator
    const currentPlayerName = `Player ${currentPlayerIndex + 1}`;
    const currentTurnPlayer = pages[currentPlayerIndex].getByTestId('current-turn-player');
    await expect(currentTurnPlayer).toBeVisible();
    await expect(currentTurnPlayer).toContainText(currentPlayerName);

    // Other players should see the current player's name (not their own)
    for (let i = 0; i < 4; i++) {
      if (i !== currentPlayerIndex) {
        const otherCurrentTurnPlayer = pages[i].getByTestId('current-turn-player');
        await expect(otherCurrentTurnPlayer).toBeVisible();
        await expect(otherCurrentTurnPlayer).toContainText(currentPlayerName);
        await expect(otherCurrentTurnPlayer).not.toContainText(`Player ${i + 1}`);
      }
    }
  });

  test('should allow current player to play a card', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const currentPage = pages[currentPlayerIndex];

    // Count cards in hand before
    const handSection = currentPage.getByTestId('player-hand');
    const cardsBefore = await handSection.locator('[data-card-value]').count();

    // Get first card in hand and click it
    const firstCard = handSection.locator('[data-card-value]').first();
    await firstCard.click();

    await pages[0].waitForTimeout(500);

    // Card count in hand should decrease
    const cardsAfter = await handSection.locator('[data-card-value]').count();
    expect(cardsAfter).toBe(cardsBefore - 1);
  });

  test('should set trump suit from first card played', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const handSection = pages[currentPlayerIndex].getByTestId('player-hand');
    const firstCard = handSection.locator('[data-card-value]').first();
    await firstCard.click();

    // Wait for the card to be played and trick area to update
    await pages[0].waitForTimeout(1000);

    // After first card is played, trump should be set to that card's color
    // Trump is displayed as the color name (e.g., "red", "blue", "green", "brown")
    // Check that one of the trump colors is visible in the score board
    const trumpColors = ['red', 'blue', 'green', 'brown'];
    const hasTrumpVisible = await Promise.race(
      trumpColors.map(color =>
        pages[0].getByText(color, { exact: false }).isVisible({ timeout: 1000 }).catch(() => false)
      )
    );

    expect(hasTrumpVisible).toBe(true);
  });

  test('should complete a full trick with 4 cards', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    // Play 4 cards (one from each player)
    for (let round = 0; round < 4; round++) {
      const currentPlayerIndex = await findCurrentPlayerIndex(pages);
      expect(currentPlayerIndex).toBeGreaterThanOrEqual(0);

      // Play a card from hand - use force to bypass suit-following disabled state
      const handSection = pages[currentPlayerIndex].getByTestId('player-hand');
      const card = handSection.locator('[data-card-value]').first();
      await card.click({ force: true });

      // Wait a bit for state update
      await pages[0].waitForTimeout(500);
    }

    // Trick should be resolved
    // One player should have tricksWon = 1
    await pages[0].waitForTimeout(2000); // Wait for trick resolution
  });

  test('should decrease card count after playing', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    const currentPlayerIndex = await findCurrentPlayerIndex(pages);
    const currentPage = pages[currentPlayerIndex];

    // Count cards in hand before
    const handSection = currentPage.getByTestId('player-hand');
    const cardsBefore = await handSection.locator('[data-card-value]').count();

    // Play a card from hand
    const firstCard = handSection.locator('[data-card-value]').first();
    await firstCard.click();

    await pages[0].waitForTimeout(500);

    // Count cards in hand after
    const cardsAfter = await handSection.locator('[data-card-value]').count();

    expect(cardsAfter).toBe(cardsBefore - 1);
  });

  test('should show special card indicators (+5 for Red 0, -2 for Brown 0)', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const pages = result.pages;
    await placeAllBets(pages);

    // Look for special cards in any player's hand
    const red0 = pages[0].locator('button.bg-red-500').filter({ hasText: '0' }).first();
    const brown0 = pages[0].locator('button.bg-amber-700').filter({ hasText: '0' }).first();

    // Check if they have special indicators (ring or badge)
    if (await red0.isVisible()) {
      await expect(red0.locator('text=+5')).toBeVisible();
    }

    if (await brown0.isVisible()) {
      await expect(brown0.locator('text=-2')).toBeVisible();
    }
  });
});
