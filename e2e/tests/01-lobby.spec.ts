import { test, expect } from '@playwright/test';

test.describe('Lobby and Player Joining', () => {
  test('should display lobby with create and join options', async ({ page }) => {
    await page.goto('/');

    // Check for lobby title
    await expect(page.getByRole('heading', { name: /trick card game/i })).toBeVisible();

    // Check for create and join buttons
    await expect(page.getByRole('button', { name: /create game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /join game/i })).toBeVisible();
  });

  test('should allow player to create a game', async ({ page }) => {
    await page.goto('/');

    // Click create game
    await page.getByRole('button', { name: /create game/i }).click();

    // Fill in player name
    await page.getByPlaceholder(/enter your name/i).fill('Player 1');

    // Submit
    await page.getByRole('button', { name: /create/i }).click();

    // Should show team selection screen
    await expect(page.getByRole('heading', { name: /team selection/i })).toBeVisible();

    // Should show game ID
    await expect(page.getByText(/game id/i)).toBeVisible();

    // Should show player 1
    await expect(page.getByText('Player 1')).toBeVisible();

    // Should show waiting message
    await expect(page.getByText(/waiting for.*player/i)).toBeVisible();
  });

  test('should allow multiple players to join a game', async ({ browser }) => {
    const context = await browser.newContext();

    // Player 1 creates game
    const page1 = await context.newPage();
    await page1.goto('/');
    await page1.getByRole('button', { name: /create game/i }).click();
    await page1.getByPlaceholder(/enter your name/i).fill('Player 1');
    await page1.getByRole('button', { name: /create/i }).click();

    // Get game ID
    await page1.waitForSelector('.font-mono', { timeout: 10000 });
    const gameIdElement = page1.locator('.font-mono');
    const gameId = await gameIdElement.textContent();
    expect(gameId).toBeTruthy();

    // Player 2 joins
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.getByRole('button', { name: /join game/i }).click();
    await page2.getByPlaceholder(/game id/i).fill(gameId!);
    await page2.getByPlaceholder(/your name/i).fill('Player 2');
    await page2.getByRole('button', { name: /join/i }).click();

    // Both should see both players
    await expect(page1.getByText('Player 2')).toBeVisible();
    await expect(page2.getByText('Player 1')).toBeVisible();
    await expect(page2.getByText('Player 2')).toBeVisible();

    // Player 3 joins
    const page3 = await context.newPage();
    await page3.goto('/');
    await page3.getByRole('button', { name: /join game/i }).click();
    await page3.getByPlaceholder(/game id/i).fill(gameId!);
    await page3.getByPlaceholder(/your name/i).fill('Player 3');
    await page3.getByRole('button', { name: /join/i }).click();

    // All should see all players
    await expect(page1.getByText('Player 3')).toBeVisible();
    await expect(page2.getByText('Player 3')).toBeVisible();
    await expect(page3.getByText('Player 1')).toBeVisible();

    // Player 4 joins
    const page4 = await context.newPage();
    await page4.goto('/');
    await page4.getByRole('button', { name: /join game/i }).click();
    await page4.getByPlaceholder(/game id/i).fill(gameId!);
    await page4.getByPlaceholder(/your name/i).fill('Player 4');
    await page4.getByRole('button', { name: /join/i }).click();

    // Should show Start Game button when 4 players are present
    await expect(page1.getByRole('button', { name: /start game/i })).toBeVisible({ timeout: 10000 });
    await expect(page1.getByText(/waiting for.*player/i)).not.toBeVisible();

    await context.close();
  });

  test('should show error for invalid game ID', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /join game/i }).click();
    await page.getByPlaceholder(/game id/i).fill('invalid123');
    await page.getByPlaceholder(/your name/i).fill('Player 1');
    await page.getByRole('button', { name: /join/i }).click();

    // Should show error
    await expect(page.getByText(/game not found/i)).toBeVisible();
  });

  test('should not allow 5th player to join', async ({ browser }) => {
    const context = await browser.newContext();

    // Create game and add 4 players
    const pages = [];
    for (let i = 1; i <= 4; i++) {
      const page = await context.newPage();
      await page.goto('/');

      if (i === 1) {
        await page.getByRole('button', { name: /create game/i }).click();
        await page.getByPlaceholder(/enter your name/i).fill(`Player ${i}`);
        await page.getByRole('button', { name: /create/i }).click();

        await page.waitForSelector('.font-mono', { timeout: 10000 });
        const gameIdElement = page.locator('.font-mono');
        const gameId = await gameIdElement.textContent();
        pages.push({ page, gameId });
      } else {
        await page.getByRole('button', { name: /join game/i }).click();
        await page.getByPlaceholder(/game id/i).fill(pages[0].gameId!);
        await page.getByPlaceholder(/your name/i).fill(`Player ${i}`);
        await page.getByRole('button', { name: /join/i }).click();
        pages.push({ page, gameId: pages[0].gameId });
      }
    }

    // Try to add 5th player
    const page5 = await context.newPage();
    await page5.goto('/');
    await page5.getByRole('button', { name: /join game/i }).click();
    await page5.getByPlaceholder(/game id/i).fill(pages[0].gameId!);
    await page5.getByPlaceholder(/your name/i).fill('Player 5');
    await page5.getByRole('button', { name: /join/i }).click();

    // Should show error
    await expect(page5.getByText(/game is full/i)).toBeVisible();

    await context.close();
  });
});
