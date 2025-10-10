import { test, expect } from '@playwright/test';

test.describe('Reconnection Support - Basic Tests', () => {
  // Clear localStorage before each test
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage
    await context.clearCookies();
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should save session to localStorage when creating game', async ({ page }) => {
    // Wait for lobby buttons using test IDs
    await page.getByTestId('create-game-button').waitFor({ timeout: 10000 });

    // Click Create Game button to show form
    await page.getByTestId('create-game-button').click();

    // Wait for the create game form to appear using test ID
    await page.getByTestId('player-name-input').waitFor({ timeout: 5000 });

    // Fill in name and create game
    await page.getByTestId('player-name-input').fill('TestPlayer');
    await page.getByTestId('submit-create-button').click();

    // Wait for game to be created (team selection phase)
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Check localStorage for session
    const session = await page.evaluate(() => {
      return localStorage.getItem('gameSession');
    });

    expect(session).not.toBeNull();

    const sessionData = JSON.parse(session!);
    expect(sessionData).toHaveProperty('gameId');
    expect(sessionData).toHaveProperty('playerId');
    expect(sessionData).toHaveProperty('playerName', 'TestPlayer');
    expect(sessionData).toHaveProperty('token');
  });

  test('should reconnect after page reload', async ({ page }) => {
    // Wait for lobby buttons using test IDs
    await page.getByTestId('create-game-button').waitFor({ timeout: 10000 });

    // Click Create Game button
    await page.getByTestId('create-game-button').click();

    // Wait for form and fill it
    await page.getByTestId('player-name-input').waitFor({ timeout: 5000 });
    await page.getByTestId('player-name-input').fill('Player1');
    await page.getByTestId('submit-create-button').click();

    // Wait for team selection
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Select a team
    await page.click('button:has-text("Team 1")');
    await page.waitForTimeout(1000); // Wait for state to update

    // Reload the page (simulate disconnect/refresh)
    await page.reload();

    // Should show reconnecting briefly, then reconnect
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Verify we're still in the same game (Player1 should still be visible)
    await expect(page.locator('text=/Player1/i')).toBeVisible();
  });

  test('should clear expired session', async ({ page }) => {
    // Manually set an expired session
    await page.evaluate(() => {
      localStorage.setItem('gameSession', JSON.stringify({
        gameId: 'EXPIRED123',
        playerId: 'invalid-id',
        playerName: 'OldPlayer',
        token: 'expired-token',
        timestamp: Date.now() - (1000 * 60 * 5) // 5 minutes ago (expired)
      }));
    });

    // Reload page
    await page.reload();

    // Should eventually show lobby (not stay in reconnecting state) - use test ID
    await page.getByTestId('create-game-button').waitFor({ timeout: 15000 });

    // Session should be cleared
    const session = await page.evaluate(() => localStorage.getItem('gameSession'));
    expect(session).toBeNull();
  });
});
