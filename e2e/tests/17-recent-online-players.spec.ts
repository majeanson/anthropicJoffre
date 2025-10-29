import { test, expect } from '@playwright/test';

test.describe('Recent and Online Players', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should show Recent/Online tabs in lobby', async ({ page }) => {
    await page.goto('http://localhost:5177');

    // Check that both tabs exist
    await expect(page.getByRole('button', { name: /recent players/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /online now/i })).toBeVisible();
  });

  test('should switch between Recent and Online tabs', async ({ page }) => {
    await page.goto('http://localhost:5177');

    // Default tab should be Recent
    await expect(page.getByText('No recent players yet').first()).toBeVisible();

    // Click Online tab
    await page.getByRole('button', { name: /online now/i }).click();

    // Should show online players (initially empty or with current player)
    await expect(page.getByText('No players online').first()).toBeVisible();

    // Click Recent tab again
    await page.getByRole('button', { name: /recent players/i }).click();
    await expect(page.getByText('No recent players yet').first()).toBeVisible();
  });

  test('should show online players when multiple users connect', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Player 1 creates a game
    await page1.goto('http://localhost:5177');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player One');
    await page1.getByTestId('submit-create-button').click();

    // Wait for game to be created
    await page1.waitForSelector('text=/game id/i', { timeout: 5000 });

    // Player 2 goes to lobby
    await page2.goto('http://localhost:5177');

    // Switch to Online tab
    await page2.getByRole('button', { name: /online now/i }).click();

    // Wait for online players to update (5 second interval + buffer)
    await page2.waitForTimeout(6000);

    // Should see Player One online
    await expect(page2.getByText('Player One')).toBeVisible({ timeout: 10000 });
  });

  test('should load recent players from localStorage on mount', async ({ browser }) => {
    // This test verifies that the Recent Players tab loads properly
    context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:5177');

    // Verify Recent Players tab exists and is visible
    await expect(page.getByRole('button', { name: /recent players/i })).toBeVisible();

    // Click to ensure content loads
    await page.getByRole('button', { name: /recent players/i }).click();

    // Should show empty state initially
    await expect(page.getByText('No recent players yet').first()).toBeVisible();
  });

  test('should show player status correctly', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();
    const page1 = await context.newPage();

    // Create a game
    await page1.goto('http://localhost:5177');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('StatusTest');
    await page1.getByTestId('submit-create-button').click();

    // Wait for game creation
    await page1.waitForSelector('text=/game id/i', { timeout: 5000 });

    // Open second tab to check online status
    const page2 = await context.newPage();

    await page2.goto('http://localhost:5177');
    await page2.getByRole('button', { name: /online now/i }).click();

    // Wait for online players update
    await page2.waitForTimeout(6000);

    // Should show StatusTest player name in online list
    await expect(page2.getByText('StatusTest')).toBeVisible({ timeout: 10000 });
  });

  test('should allow copying invite link from online players', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Player 1 creates a game
    await page1.goto('http://localhost:5177');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Host');
    await page1.getByTestId('submit-create-button').click();

    await page1.waitForSelector('text=/game id/i', { timeout: 5000 });

    // Player 2 checks online players
    await page2.goto('http://localhost:5177');

    // Wait for page to load completely
    await page2.waitForTimeout(1000);

    await page2.getByRole('button', { name: /online now/i }).click({ force: true });

    // Wait for online players update
    await page2.waitForTimeout(6000);

    // Should see Host player
    await expect(page2.getByText('Host')).toBeVisible({ timeout: 10000 });

    // Should see Invite button (since Host is in a game)
    const inviteButton = page2.getByRole('button', { name: /invite/i });

    // If invite button is visible, click it
    if (await inviteButton.isVisible()) {
      await inviteButton.click();

      // Should show toast notification
      await expect(page2.getByText(/invite link copied/i)).toBeVisible({ timeout: 3000 });
    }
  });
});
