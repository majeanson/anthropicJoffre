import { test, expect } from '@playwright/test';

test.describe('Lobby and Player Joining', () => {
  test('should display lobby with create and join options', async ({ page }) => {
    await page.goto('/');

    // Check for lobby title
    await expect(page.getByRole('heading', { name: /trick card game/i })).toBeVisible();

    // Check for create and join buttons using test IDs
    await expect(page.getByTestId('create-game-button')).toBeVisible();
    await expect(page.getByTestId('join-game-button')).toBeVisible();
    await expect(page.getByTestId('spectate-game-button')).toBeVisible();
    await expect(page.getByTestId('quick-play-button')).toBeVisible();
  });

  test('should allow player to create a game', async ({ page }) => {
    await page.goto('/');

    // Click create game using test ID
    await page.getByTestId('create-game-button').click();

    // Fill in player name using test ID
    await page.getByTestId('player-name-input').fill('Player 1');

    // Submit using test ID
    await page.getByTestId('submit-create-button').click();

    // Should show team selection screen
    await expect(page.getByRole('heading', { name: /team selection/i })).toBeVisible();

    // Should show game ID using test ID
    await expect(page.getByTestId('game-id')).toBeVisible();

    // Should show player 1
    await expect(page.getByText('Player 1')).toBeVisible();

    // Should show waiting message using test ID
    await expect(page.getByTestId('start-game-message')).toBeVisible();
    await expect(page.getByTestId('start-game-message')).toContainText(/waiting for.*player/i);
  });

  test('should allow multiple players to join a game', async ({ browser }) => {
    // Player 1 creates game
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player 1');
    await page1.getByTestId('submit-create-button').click();

    // Get game ID using test ID
    await page1.getByTestId('game-id').waitFor({ timeout: 10000 });
    const gameId = await page1.getByTestId('game-id').textContent();
    expect(gameId).toBeTruthy();

    // Player 2 joins (new context to avoid localStorage sharing)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/');
    await page2.getByTestId('join-game-button').click();
    await page2.getByTestId('game-id-input').fill(gameId!);
    await page2.getByTestId('player-name-input').fill('Player 2');
    await page2.getByTestId('submit-join-button').click();

    // Both should see both players
    await expect(page1.getByText('Player 2')).toBeVisible();
    await expect(page2.getByText('Player 1')).toBeVisible();
    await expect(page2.getByText('Player 2')).toBeVisible();

    // Player 3 joins (new context)
    const context3 = await browser.newContext();
    const page3 = await context3.newPage();
    await page3.goto('/');
    await page3.getByTestId('join-game-button').click();
    await page3.getByTestId('game-id-input').fill(gameId!);
    await page3.getByTestId('player-name-input').fill('Player 3');
    await page3.getByTestId('submit-join-button').click();

    // All should see all players
    await expect(page1.getByText('Player 3')).toBeVisible();
    await expect(page2.getByText('Player 3')).toBeVisible();
    await expect(page3.getByText('Player 1')).toBeVisible();

    // Player 4 joins (new context)
    const context4 = await browser.newContext();
    const page4 = await context4.newPage();
    await page4.goto('/');
    await page4.getByTestId('join-game-button').click();
    await page4.getByTestId('game-id-input').fill(gameId!);
    await page4.getByTestId('player-name-input').fill('Player 4');
    await page4.getByTestId('submit-join-button').click();

    // Should show Start Game button when 4 players are present
    await expect(page1.getByTestId('start-game-button')).toBeVisible({ timeout: 10000 });
    await expect(page1.getByTestId('start-game-message')).not.toBeVisible();

    await context1.close();
    await context2.close();
    await context3.close();
    await context4.close();
  });

  test('should show error for invalid game ID', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('join-game-button').click();
    await page.getByTestId('game-id-input').fill('invalid123');
    await page.getByTestId('player-name-input').fill('Player 1');
    await page.getByTestId('submit-join-button').click();

    // Should show error
    await expect(page.getByText(/game not found/i)).toBeVisible();
  });

  test('should not allow 5th player to join', async ({ browser }) => {
    // Create game and add 4 players (each in separate context to avoid localStorage sharing)
    const pages = [];
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
        pages.push({ page, context, gameId });
      } else {
        await page.getByTestId('join-game-button').click();
        await page.getByTestId('game-id-input').fill(gameId!);
        await page.getByTestId('player-name-input').fill(`Player ${i}`);
        await page.getByTestId('submit-join-button').click();
        pages.push({ page, context, gameId });
      }
    }

    // Try to add 5th player
    const context5 = await browser.newContext();
    const page5 = await context5.newPage();
    await page5.goto('/');
    await page5.getByTestId('join-game-button').click();
    await page5.getByTestId('game-id-input').fill(gameId!);
    await page5.getByTestId('player-name-input').fill('Player 5');
    await page5.getByTestId('submit-join-button').click();

    // Should show error
    await expect(page5.getByText(/game is full/i)).toBeVisible();

    // Clean up all contexts
    for (const { context } of pages) {
      await context.close();
    }
    await context5.close();
  });
});
