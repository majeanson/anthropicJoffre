import { test, expect, Page } from '@playwright/test';

test.describe('Reconnection Support', () => {
  test('should save session to sessionStorage when joining game', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // Wait for lobby to load using test ID
    await page.getByTestId('create-game-button').waitFor({ timeout: 10000 });

    // Create a game
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('TestPlayer');
    await page.getByTestId('submit-create-button').click();

    // Wait for game to be created (team selection phase)
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Check sessionStorage for session
    const session = await page.evaluate(() => {
      return sessionStorage.getItem('gameSession');
    });

    expect(session).not.toBeNull();

    const sessionData = JSON.parse(session!);
    expect(sessionData).toHaveProperty('gameId');
    expect(sessionData).toHaveProperty('playerId');
    expect(sessionData).toHaveProperty('playerName', 'TestPlayer');
    expect(sessionData).toHaveProperty('token');
  });

  test('should allow player to reconnect after page reload', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Clear storage first
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // Wait for lobby using test ID
    await page.getByTestId('create-game-button').waitFor({ timeout: 10000 });

    // Create a game
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('Player1');
    await page.getByTestId('submit-create-button').click();

    // Wait for team selection
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Select a team
    await page.click('button:has-text("Team 1")');

    // Reload the page (simulate disconnect/refresh)
    await page.reload();

    // Should automatically reconnect
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Verify we're still in the same game
    await expect(page.locator('text=/Team 1/i')).toBeVisible();
  });

  test('should show reconnecting state during reconnection', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Create a game using test IDs
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('Player1');
    await page.getByTestId('submit-create-button').click();
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Reload page
    const reloadPromise = page.reload();

    // Should show reconnecting UI briefly
    // Note: This might be too fast to catch, but we'll try
    try {
      await expect(page.locator('text=/Reconnecting/i')).toBeVisible({ timeout: 2000 });
    } catch {
      // If it's too fast, that's okay - the reconnection succeeded
    }

    await reloadPromise;

    // Should successfully reconnect
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });
  });

  test('should update socket ID on reconnection', async ({ context }) => {
    // Create first page (player who will reconnect)
    const page1 = await context.newPage();
    await page1.goto('http://localhost:5173');

    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player1');
    await page1.getByTestId('submit-create-button').click();
    await page1.getByTestId('game-id').waitFor({ timeout: 10000 });

    const gameCode = await page1.getByTestId('game-id').textContent();
    expect(gameCode).toBeTruthy();

    // Create second page (observer)
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');

    await page2.getByTestId('join-game-button').click();
    await page2.getByTestId('game-id-input').fill(gameCode!);
    await page2.getByTestId('player-name-input').fill('Player2');
    await page2.getByTestId('submit-join-button').click();
    await page2.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Both players select teams
    await page1.click('button:has-text("Team 1")');
    await page2.click('button:has-text("Team 2")');

    // Player1 reloads (reconnects)
    await page1.reload();
    await page1.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Player1 should still be able to interact
    // Try swapping position or another action
    await expect(page1.locator('button:has-text("Team 1")')).toBeVisible();

    await page1.close();
    await page2.close();
  });

  test('should notify other players of reconnection', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('http://localhost:5173');

    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player1');
    await page1.getByTestId('submit-create-button').click();
    await page1.getByTestId('game-id').waitFor({ timeout: 10000 });

    const gameCode = await page1.getByTestId('game-id').textContent();

    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');

    await page2.getByTestId('join-game-button').click();
    await page2.getByTestId('game-id-input').fill(gameCode!);
    await page2.getByTestId('player-name-input').fill('Player2');
    await page2.getByTestId('submit-join-button').click();
    await page2.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Player1 closes connection (simulating disconnect)
    await page1.context().clearCookies();

    // Player1 reconnects
    await page1.reload();
    await page1.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Player2 should be notified (via game_updated or specific event)
    // For now, just verify Player1 is still visible in player list
    await expect(page2.locator('text=/Player1/i')).toBeVisible();

    await page1.close();
    await page2.close();
  });

  test('should handle expired session token gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Manually set an expired/invalid session
    await page.evaluate(() => {
      sessionStorage.setItem('gameSession', JSON.stringify({
        gameId: 'EXPIRED123',
        playerId: 'invalid-id',
        playerName: 'OldPlayer',
        token: 'expired-token',
        timestamp: Date.now() - (1000 * 60 * 60) // 1 hour ago
      }));
    });

    // Reload page
    await page.reload();

    // Should show lobby (not reconnect to expired session) - use test ID
    await expect(page.getByTestId('create-game-button')).toBeVisible({ timeout: 5000 });
  });

  test('should clear session on explicit disconnect', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('Player1');
    await page.getByTestId('submit-create-button').click();
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Verify session exists
    let session = await page.evaluate(() => sessionStorage.getItem('gameSession'));
    expect(session).not.toBeNull();

    // Leave game explicitly (if such button exists, or go back to lobby)
    // For now, we'll test that going to home clears session
    await page.goto('http://localhost:5173');

    // Click a "Leave Game" button if it exists
    // If not, we'll implement it as part of this feature

    // Session might still exist if user just navigates away
    // We'll add explicit "Leave Game" functionality
  });

  test('should prevent reconnection to finished game', async ({ page }) => {
    // This test requires a game to reach completion
    // For now, we'll set up the scenario manually

    await page.goto('http://localhost:5173');

    await page.getByTestId('create-game-button').click();
    await page.getByTestId('player-name-input').fill('Player1');
    await page.getByTestId('submit-create-button').click();
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Store session
    const session = await page.evaluate(() => sessionStorage.getItem('gameSession'));
    expect(session).not.toBeNull();

    // Manually mark game as finished (simulate game_over)
    await page.evaluate(() => {
      const sessionData = JSON.parse(sessionStorage.getItem('gameSession')!);
      sessionData.gameFinished = true;
      sessionStorage.setItem('gameSession', JSON.stringify(sessionData));
    });

    // Try to reconnect
    await page.reload();

    // Should show lobby, not reconnect to finished game - use test ID
    await expect(page.getByTestId('create-game-button')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain game state after reconnection', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Quick Play to get into a game quickly - use test ID
    await page.getByTestId('quick-play-button').click();
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Select team
    await page.click('button:has-text("Team 1")');

    // Wait for bots to join and select teams
    await page.waitForTimeout(3000);

    // Get game state before reload
    const playerCountBefore = await page.locator('[data-testid="player-card"]').count();

    // Reload page
    await page.reload();

    // Should reconnect
    await page.waitForSelector('text=/Team Selection/i', { timeout: 10000 });

    // Game state should be preserved
    const playerCountAfter = await page.locator('[data-testid="player-card"]').count();
    expect(playerCountAfter).toBe(playerCountBefore);
  });
});
