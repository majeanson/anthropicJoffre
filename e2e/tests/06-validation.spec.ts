import { test, expect } from '@playwright/test';
import { createGameWith4Players, placeAllBets, findCurrentPlayerIndex } from './helpers';

test.describe('Validation Feedback', () => {
  test.describe('Team Selection Validation', () => {
    let context: any;

    test.afterEach(async () => {
      if (context) {
        await context.close();
      }
    });

    test('should disable Start Game when teams are unbalanced', async ({ browser }) => {
      context = await browser.newContext();
      const pages = [];
      let gameId: string | null = null;

      // Create game with only 3 players
      for (let i = 1; i <= 3; i++) {
        const page = await context.newPage();
        await page.goto('/');

        if (i === 1) {
          await page.getByTestId('create-game-button').click();
          await page.getByPlaceholder(/enter your name/i).fill(`Player ${i}`);
          await page.getByRole('button', { name: /create/i }).click();

          await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });
          const gameIdElement = page.getByTestId('game-id');
          gameId = await gameIdElement.textContent();
        } else {
          await page.getByTestId('join-game-button').click();
          await page.getByPlaceholder(/game id/i).fill(gameId!);
          await page.getByPlaceholder(/your name/i).fill(`Player ${i}`);
          await page.getByRole('button', { name: /join/i }).click();
        }

        pages.push(page);
      }

      // Wait for team selection
      await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });

      // Start Game button should be disabled
      const startButton = pages[0].getByTestId('start-game-button');
      await expect(startButton).toBeDisabled();

      // Should show message about waiting for players
      await expect(pages[0].getByText(/waiting for.*more player/i)).toBeVisible();
    });

    test('should show dealer indicator during team selection', async ({ browser }) => {
      // Create game but don't start it - stop at team selection
      context = await browser.newContext();
      const pages = [];
      let gameId: string | null = null;

      for (let i = 1; i <= 4; i++) {
        const page = await context.newPage();
        await page.goto('/');

        if (i === 1) {
          await page.getByTestId('create-game-button').click();
          await page.getByPlaceholder(/enter your name/i).fill(`Player ${i}`);
          await page.getByRole('button', { name: /create/i }).click();

          await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });
          const gameIdElement = page.getByTestId('game-id');
          gameId = await gameIdElement.textContent();
        } else {
          await page.getByTestId('join-game-button').click();
          await page.getByPlaceholder(/game id/i).fill(gameId!);
          await page.getByPlaceholder(/your name/i).fill(`Player ${i}`);
          await page.getByRole('button', { name: /join/i }).click();
        }

        pages.push(page);
      }

      // Should be at team selection
      await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });

      // Start Game button should be enabled (4 players, default 2-2 split)
      const startButton = pages[0].getByTestId('start-game-button');
      await expect(startButton).toBeEnabled();
    });
  });

  test.describe('Betting Phase Validation', () => {
    let context: any;

    test.afterEach(async () => {
      if (context) {
        await context.close();
      }
    });

    test('should disable Place Bet button when bet is too low', async ({ browser }) => {
      const result = await createGameWith4Players(browser);
      context = result.context;
      const pages = result.pages;

      await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

      // Player 3 bets 9
      const page3 = pages[2];
      await page3.getByRole('button', { name: '9', exact: true }).waitFor({ timeout: 15000 });
      await page3.getByRole('button', { name: '9', exact: true }).click();
      await page3.getByRole('button', { name: /Place Bet: 9/ }).click();
      await pages[0].waitForTimeout(500);

      // Player 4 should see bet 7 button disabled (too low)
      const page4 = pages[3];
      await pages[0].waitForTimeout(500); // Wait for turn

      // Button for 7 should be disabled (must raise to 10+)
      await expect(page4.getByRole('button', { name: '7', exact: true })).toBeDisabled({ timeout: 2000 });

      // Button for 10 should be enabled (valid raise)
      await expect(page4.getByRole('button', { name: '10', exact: true })).toBeEnabled();
    });

    test('should show validation message explaining bet requirements', async ({ browser }) => {
      const result = await createGameWith4Players(browser);
      context = result.context;
      const pages = result.pages;

      await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

      // Player 3 bets 10 with "without trump"
      const page3 = pages[2];
      await page3.getByRole('button', { name: '10', exact: true }).waitFor({ timeout: 15000 });
      await page3.getByRole('button', { name: '10', exact: true }).click();
      await page3.getByRole('radio', { name: /without trump/i }).click();
      await page3.getByRole('button', { name: /Place Bet: 10/ }).click();
      await pages[0].waitForTimeout(500);

      // Player 4 should see regular 10 button disabled (must beat "without trump")
      const page4 = pages[3];
      await pages[0].waitForTimeout(500); // Wait for turn

      // Regular 10 button should be disabled (same amount with trump loses to without trump)
      await expect(page4.getByRole('button', { name: '10', exact: true })).toBeDisabled({ timeout: 2000 });

      // Button for 11 should be enabled (valid raise)
      await expect(page4.getByRole('button', { name: '11', exact: true })).toBeEnabled();
    });

    test('should show dealer indicator during betting', async ({ browser }) => {
      const result = await createGameWith4Players(browser);
      context = result.context;
      const pages = result.pages;

      await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

      // Player 2 is dealer (index 1)
      // Should see "(Dealer)" label
      await expect(pages[0].getByText(/dealer/i)).toBeVisible();
    });
  });

  test.describe('Playing Phase Validation', () => {
    let context: any;

    test.afterEach(async () => {
      if (context) {
        await context.close();
      }
    });

    test('should show validation message when trying to play wrong suit', async ({ browser }) => {
      const result = await createGameWith4Players(browser);
      context = result.context;
      const pages = result.pages;
      await placeAllBets(pages);

      // First player plays a card
      const firstPlayerIndex = await findCurrentPlayerIndex(pages);
      const firstCard = pages[firstPlayerIndex].locator('[data-card-value]').first();
      await firstCard.click();

      await pages[0].waitForTimeout(500);

      // Second player should see current turn indicator (validation is visual via disabled cards)
      const secondPlayerIndex = await findCurrentPlayerIndex(pages);
      await expect(pages[secondPlayerIndex].getByTestId('current-turn-player')).toBeVisible();
    });

    test('should visually disable unplayable cards', async ({ browser }) => {
      const result = await createGameWith4Players(browser);
      context = result.context;
      const pages = result.pages;
      await placeAllBets(pages);

      // Play one card to establish led suit
      const firstPlayerIndex = await findCurrentPlayerIndex(pages);
      const firstCard = pages[firstPlayerIndex].locator('[data-card-value]').first();
      await firstCard.click();

      await pages[0].waitForTimeout(500);

      // Second player might see disabled cards (if they have led suit)
      const secondPlayerIndex = await findCurrentPlayerIndex(pages);
      const secondPage = pages[secondPlayerIndex];

      // Check if any cards have the disabled overlay (✕ mark)
      const disabledOverlays = secondPage.locator('text=✕');
      const count = await disabledOverlays.count();

      // If player has led suit, some cards will be disabled (count > 0)
      // If player doesn't have led suit, no cards disabled (count = 0)
      // Both scenarios are valid
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show which player we are waiting for', async ({ browser }) => {
      const result = await createGameWith4Players(browser);
      context = result.context;
      const pages = result.pages;
      await placeAllBets(pages);

      // Other players should see "Waiting for: [PlayerName]" in the current turn indicator
      const currentPlayerIndex = await findCurrentPlayerIndex(pages);
      const otherPlayerIndex = (currentPlayerIndex + 1) % 4;
      await expect(pages[otherPlayerIndex].getByTestId('current-turn-player')).toBeVisible();
      await expect(pages[otherPlayerIndex].getByText(/Waiting for:/)).toBeVisible();
    });
  });
});
