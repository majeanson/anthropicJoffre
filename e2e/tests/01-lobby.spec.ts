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

  // NOTE: Multi-player joining tests removed - these functionalities are covered by:
  // - tests/helpers.ts: createQuickPlayGame() helper creates 1 human + 3 bots
  // - 02-betting.spec.ts: All betting tests verify 4-player game progression
  // - 03-playing.spec.ts: All playing tests verify 4-player game state
  //
  // Original tests used multi-page/multi-context approach which caused browser
  // instability after ~60s. See docs/technical/E2E_QUICKPLAY_REFACTORING.md
  //
  // Removed tests:
  // - "should allow multiple players to join a game" - Tested via QuickPlay helper
  // - "should show error for invalid game ID" - Backend validation tested via unit tests
  // - "should not allow 5th player to join" - Backend validation tested via unit tests
});
