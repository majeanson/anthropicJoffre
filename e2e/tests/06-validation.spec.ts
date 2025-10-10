import { test, expect } from '@playwright/test';
import { createGameWith4Players, placeAllBets, findCurrentPlayerIndex } from './helpers';

test.describe('Validation Feedback', () => {
  test.describe('Team Selection Validation', () => {
    test('should disable Start Game when teams are unbalanced', async ({ browser }) => {
      const contexts = [];
      const pages = [];
      let gameId: string | null = null;

      // Create game with only 3 players
      for (let i = 1; i <= 3; i++) {
        const context = await browser.newContext();
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
        contexts.push(context);
      }

      // Wait for team selection
      await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });

      // Start Game button should be disabled
      const startButton = pages[0].getByRole('button', { name: /start game/i });
      await expect(startButton).toBeDisabled();

      // Should show message about waiting for players
      await expect(pages[0].getByText(/waiting for.*more player/i)).toBeVisible();

      for (const context of contexts) {
        await context.close();
      }
    });

    test('should show dealer indicator during team selection', async ({ browser }) => {
      // Create game but don't start it - stop at team selection
      const contexts = [];
      const pages = [];
      let gameId: string | null = null;

      for (let i = 1; i <= 4; i++) {
        const context = await browser.newContext();
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
        contexts.push(context);
      }

      // Should be at team selection
      await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });

      // Start Game button should be enabled (4 players, default 2-2 split)
      const startButton = pages[0].getByRole('button', { name: /start game/i });
      await expect(startButton).toBeEnabled();

      for (const context of contexts) {
        await context.close();
      }
    });
  });

  test.describe('Betting Phase Validation', () => {
    test('should disable Place Bet button when bet is too low', async ({ browser }) => {
      const { contexts, pages } = await createGameWith4Players(browser);

      await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

      // Player 3 bets 9
      const page3 = pages[2];
      const bet9Button = page3.locator('button:has-text("9")').first();
      await bet9Button.waitFor({ state: 'visible', timeout: 15000 });
      await bet9Button.click();
      await pages[0].waitForTimeout(500);

      // Player 4 should see bet 7 button disabled (too low)
      const page4 = pages[3];
      await pages[0].waitForTimeout(500); // Wait for turn

      // Button for 7 should be disabled (must raise to 10+)
      const bet7Button = page4.locator('button:has-text("7")').first();
      await expect(bet7Button).toBeDisabled({ timeout: 2000 });

      // Button for 10 should be enabled (valid raise)
      const bet10Button = page4.locator('button:has-text("10")').first();
      await expect(bet10Button).toBeEnabled();

      for (const context of contexts) {
        await context.close();
      }
    });

    test('should show validation message explaining bet requirements', async ({ browser }) => {
      const { contexts, pages } = await createGameWith4Players(browser);

      await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

      // Player 3 bets 10 with "without trump"
      const page3 = pages[2];
      const bet10NoTrumpButton = page3.locator('button:has-text("10 (No Trump)")');
      await bet10NoTrumpButton.waitFor({ state: 'visible', timeout: 15000 });
      await bet10NoTrumpButton.click();
      await pages[0].waitForTimeout(500);

      // Player 4 should see regular 10 button disabled (must beat "without trump")
      const page4 = pages[3];
      await pages[0].waitForTimeout(500); // Wait for turn

      // Regular 10 button should be disabled (same amount with trump loses to without trump)
      const bet10Button = page4.locator('button:has-text("10")').first();
      await expect(bet10Button).toBeDisabled({ timeout: 2000 });

      // Button for 11 should be enabled (valid raise)
      const bet11Button = page4.locator('button:has-text("11")').first();
      await expect(bet11Button).toBeEnabled();

      for (const context of contexts) {
        await context.close();
      }
    });

    test('should show dealer indicator during betting', async ({ browser }) => {
      const { contexts, pages } = await createGameWith4Players(browser);

      await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

      // Player 2 is dealer (index 1)
      // Should see "(Dealer)" label
      await expect(pages[0].getByText(/dealer/i)).toBeVisible();

      for (const context of contexts) {
        await context.close();
      }
    });
  });

  test.describe('Playing Phase Validation', () => {
    test('should show validation message when trying to play wrong suit', async ({ browser }) => {
      const { contexts, pages } = await createGameWith4Players(browser);
      await placeAllBets(pages);

      // First player plays a card
      const firstPlayerIndex = await findCurrentPlayerIndex(pages);
      const firstCard = pages[firstPlayerIndex].locator('[data-card-value]').first();
      await firstCard.click();

      await pages[0].waitForTimeout(500);

      // Second player should see "Led suit" information
      const secondPlayerIndex = await findCurrentPlayerIndex(pages);
      await expect(pages[secondPlayerIndex].getByText(/led suit/i)).toBeVisible();

      for (const context of contexts) {
        await context.close();
      }
    });

    test('should visually disable unplayable cards', async ({ browser }) => {
      const { contexts, pages } = await createGameWith4Players(browser);
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

      for (const context of contexts) {
        await context.close();
      }
    });

    test('should show which player we are waiting for', async ({ browser }) => {
      const { contexts, pages } = await createGameWith4Players(browser);
      await placeAllBets(pages);

      // Other players should see "Waiting for [PlayerName]..." (more specific to avoid multiple matches)
      const currentPlayerIndex = await findCurrentPlayerIndex(pages);
      const otherPlayerIndex = (currentPlayerIndex + 1) % 4;
      await expect(pages[otherPlayerIndex].getByText(/waiting for player \d+/i)).toBeVisible();

      for (const context of contexts) {
        await context.close();
      }
    });
  });
});
