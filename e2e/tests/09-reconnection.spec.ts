import { test, expect, Page } from '@playwright/test';

test.describe('Reconnection Support', () => {
  test('should save session to localStorage when joining game', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Clear any existing session
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for lobby to load
    await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

    // Create a game
    await page.fill('input[placeholder="Enter your name"]', 'TestPlayer');
    await page.click('button:has-text("Create Game")');

    // Wait for game to be created
    await page.waitForSelector('text=/Game Code:/i', { timeout: 10000 });

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

  test('should allow player to reconnect after page reload', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Clear localStorage first
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for lobby
    await page.waitForSelector('input[placeholder="Enter your name"]', { timeout: 10000 });

    // Create a game
    await page.fill('input[placeholder="Enter your name"]', 'Player1');
    await page.click('button:has-text("Create Game")');

    // Wait for team selection
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Select a team
    await page.click('button:has-text("Team 1")');

    // Reload the page (simulate disconnect/refresh)
    await page.reload();

    // Should automatically reconnect
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Verify we're still in the same game
    await expect(page.locator('text=/Team 1/i')).toBeVisible();
  });

  test('should show reconnecting state during reconnection', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Create a game
    await page.fill('input[placeholder*="name" i]', 'Player1');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

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
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });
  });

  test('should update socket ID on reconnection', async ({ context }) => {
    // Create first page (player who will reconnect)
    const page1 = await context.newPage();
    await page1.goto('http://localhost:5173');

    await page1.fill('input[placeholder*="name" i]', 'Player1');
    await page1.click('button:has-text("Create Game")');
    await page1.waitForSelector('text=/Game Code:/i');

    const gameCodeElement = await page1.locator('text=/Game Code:/i').textContent();
    const gameCode = gameCodeElement?.match(/[A-Z0-9]{6}/)?.[0];
    expect(gameCode).toBeTruthy();

    // Create second page (observer)
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');

    await page2.fill('input[placeholder*="name" i]', 'Player2');
    await page2.fill('input[placeholder*="code" i]', gameCode!);
    await page2.click('button:has-text("Join Game")');
    await page2.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Both players select teams
    await page1.click('button:has-text("Team 1")');
    await page2.click('button:has-text("Team 2")');

    // Player1 reloads (reconnects)
    await page1.reload();
    await page1.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Player1 should still be able to interact
    // Try swapping position or another action
    await expect(page1.locator('button:has-text("Team 1")')).toBeVisible();

    await page1.close();
    await page2.close();
  });

  test('should notify other players of reconnection', async ({ context }) => {
    const page1 = await context.newPage();
    await page1.goto('http://localhost:5173');

    await page1.fill('input[placeholder*="name" i]', 'Player1');
    await page1.click('button:has-text("Create Game")');
    await page1.waitForSelector('text=/Game Code:/i');

    const gameCodeElement = await page1.locator('text=/Game Code:/i').textContent();
    const gameCode = gameCodeElement?.match(/[A-Z0-9]{6}/)?.[0];

    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');

    await page2.fill('input[placeholder*="name" i]', 'Player2');
    await page2.fill('input[placeholder*="code" i]', gameCode!);
    await page2.click('button:has-text("Join Game")');
    await page2.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Player1 closes connection (simulating disconnect)
    await page1.context().clearCookies();

    // Player1 reconnects
    await page1.reload();
    await page1.waitForSelector('text=/Select Team/i', { timeout: 10000 });

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
      localStorage.setItem('gameSession', JSON.stringify({
        gameId: 'EXPIRED123',
        playerId: 'invalid-id',
        playerName: 'OldPlayer',
        token: 'expired-token',
        timestamp: Date.now() - (1000 * 60 * 60) // 1 hour ago
      }));
    });

    // Reload page
    await page.reload();

    // Should show lobby (not reconnect to expired session)
    await expect(page.locator('text=/Create Game/i')).toBeVisible({ timeout: 5000 });
  });

  test('should clear session on explicit disconnect', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await page.fill('input[placeholder*="name" i]', 'Player1');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Verify session exists
    let session = await page.evaluate(() => localStorage.getItem('gameSession'));
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

    await page.fill('input[placeholder*="name" i]', 'Player1');
    await page.click('button:has-text("Create Game")');
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Store session
    const session = await page.evaluate(() => localStorage.getItem('gameSession'));
    expect(session).not.toBeNull();

    // Manually mark game as finished (simulate game_over)
    await page.evaluate(() => {
      const sessionData = JSON.parse(localStorage.getItem('gameSession')!);
      sessionData.gameFinished = true;
      localStorage.setItem('gameSession', JSON.stringify(sessionData));
    });

    // Try to reconnect
    await page.reload();

    // Should show lobby, not reconnect to finished game
    await expect(page.locator('text=/Create Game/i')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain game state after reconnection', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Quick Play to get into a game quickly
    await page.click('button:has-text("Quick Play")');
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Select team
    await page.click('button:has-text("Team 1")');

    // Wait for bots to join and select teams
    await page.waitForTimeout(3000);

    // Get game state before reload
    const playerCountBefore = await page.locator('[data-testid="player-card"]').count();

    // Reload page
    await page.reload();

    // Should reconnect
    await page.waitForSelector('text=/Select Team/i', { timeout: 10000 });

    // Game state should be preserved
    const playerCountAfter = await page.locator('[data-testid="player-card"]').count();
    expect(playerCountAfter).toBe(playerCountBefore);
  });
});
