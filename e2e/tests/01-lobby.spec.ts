import { test, expect } from '@playwright/test';

test.describe('Lobby and Player Joining', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should display lobby with create and join options', async ({ page }) => {
    await page.goto('/');

    // Check for lobby title (J⋀ffre) - using text content check since heading has special character
    await expect(page.getByRole('heading').filter({ hasText: 'ffre' })).toBeVisible();

    // Check for create and join buttons using test IDs
    await expect(page.getByTestId('create-game-button')).toBeVisible();
    await expect(page.getByTestId('join-game-button')).toBeVisible();
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
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();
    const pages = [];
    let gameId: string | null = null;

    // Player 1 creates game
    const page1 = await context.newPage();
    await page1.goto('/');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player 1');
    await page1.getByTestId('submit-create-button').click();

    // Get game ID using test ID
    await page1.getByTestId('game-id').waitFor({ timeout: 10000 });
    gameId = await page1.getByTestId('game-id').textContent();
    expect(gameId).toBeTruthy();
    pages.push(page1);

    // Player 2 joins (new tab)
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.getByTestId('join-game-button').click();
    await page2.getByTestId('game-id-input').fill(gameId!);
    await page2.getByTestId('player-name-input').fill('Player 2');
    await page2.getByTestId('submit-join-button').click();
    pages.push(page2);

    // Both should see both players
    await expect(page1.getByText('Player 2')).toBeVisible();
    await expect(page2.getByText('Player 1')).toBeVisible();
    await expect(page2.getByText('Player 2')).toBeVisible();

    // Player 3 joins (new tab)
    const page3 = await context.newPage();
    await page3.goto('/');
    await page3.getByTestId('join-game-button').click();
    await page3.getByTestId('game-id-input').fill(gameId!);
    await page3.getByTestId('player-name-input').fill('Player 3');
    await page3.getByTestId('submit-join-button').click();
    pages.push(page3);

    // All should see all players
    await expect(page1.getByText('Player 3')).toBeVisible();
    await expect(page2.getByText('Player 3')).toBeVisible();
    await expect(page3.getByText('Player 1')).toBeVisible();

    // Player 4 joins (new tab)
    const page4 = await context.newPage();
    await page4.goto('/');
    await page4.getByTestId('join-game-button').click();
    await page4.getByTestId('game-id-input').fill(gameId!);
    await page4.getByTestId('player-name-input').fill('Player 4');
    await page4.getByTestId('submit-join-button').click();
    pages.push(page4);

    // Should show Start Game button when 4 players are present
    await expect(page1.getByTestId('start-game-button')).toBeVisible({ timeout: 10000 });
    await expect(page1.getByTestId('start-game-message')).not.toBeVisible();
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
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();
    let gameId: string | null = null;

    // Create game and add 4 players
    for (let i = 1; i <= 4; i++) {
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
    }

    // Try to add 5th player (new tab in same context)
    const page5 = await context.newPage();
    await page5.goto('/');
    await page5.getByTestId('join-game-button').click();
    await page5.getByTestId('game-id-input').fill(gameId!);
    await page5.getByTestId('player-name-input').fill('Player 5');
    await page5.getByTestId('submit-join-button').click();

    // Should show error
    await expect(page5.getByText(/game is full/i)).toBeVisible();
  });
});
