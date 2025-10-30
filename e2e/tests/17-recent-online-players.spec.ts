import { test, expect } from '@playwright/test';

// SOCIAL Tab Structure:
// - Main lobby has 4 tabs: PLAY, SOCIAL, STATS, SETTINGS
// - SOCIAL tab contains two sub-tabs: "🟢 Online" and "📜 Recent"
// - Online players show with green dot and "Join" button if they're in a game
// - Recent players show with game count and last played date
test.describe('Recent and Online Players', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should show SOCIAL tab and Recent/Online sub-tabs in lobby', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check main SOCIAL tab exists
    const socialTab = page.getByRole('button', { name: /SOCIAL/i });
    await expect(socialTab).toBeVisible();

    // Click SOCIAL tab
    await socialTab.click();

    // Check that both sub-tabs exist
    await expect(page.getByRole('button', { name: /🟢 Online/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /📜 Recent/i })).toBeVisible();
  });

  test('should switch between Recent and Online sub-tabs', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Click SOCIAL tab first
    await page.getByRole('button', { name: /SOCIAL/i }).click();

    // Default sub-tab is Online (based on Lobby.tsx line 45: socialTab: 'online')
    await expect(page.getByText(/No players online/i).first()).toBeVisible();

    // Click Recent sub-tab
    await page.getByRole('button', { name: /📜 Recent/i }).click();

    // Should show recent players empty state
    await expect(page.getByText(/No recent players yet/i).first()).toBeVisible();

    // Click Online sub-tab again
    await page.getByRole('button', { name: /🟢 Online/i }).click();
    await expect(page.getByText(/No players online/i).first()).toBeVisible();
  });

  test('should show online players when multiple users connect', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Player 1 creates a game
    await page1.goto('http://localhost:5173');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Player One');
    await page1.getByTestId('submit-create-button').click();

    // Wait for game to be created
    await page1.waitForSelector('text=/team selection|select your team/i', { timeout: 10000 });

    // Player 2 goes to lobby
    await page2.goto('http://localhost:5173');

    // Click SOCIAL tab
    await page2.getByRole('button', { name: /SOCIAL/i }).click();

    // Default sub-tab is Online (no need to click)
    // Wait for online players to update (5 second interval + buffer)
    await page2.waitForTimeout(6000);

    // Should see Player One online with status "Setting up"
    await expect(page2.getByText('Player One')).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText(/Setting up|In Lobby|Playing/i)).toBeVisible({ timeout: 5000 });
  });

  test('should load recent players from localStorage on mount', async ({ browser }) => {
    // This test verifies that the Recent Players sub-tab loads properly
    context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:5173');

    // Click SOCIAL tab
    await page.getByRole('button', { name: /SOCIAL/i }).click();

    // Click Recent sub-tab
    await page.getByRole('button', { name: /📜 Recent/i }).click();

    // Should show empty state initially
    await expect(page.getByText(/No recent players yet/i).first()).toBeVisible();
  });

  test('should show player status correctly', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();
    const page1 = await context.newPage();

    // Create a game
    await page1.goto('http://localhost:5173');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('StatusTest');
    await page1.getByTestId('submit-create-button').click();

    // Wait for game creation
    await page1.waitForSelector('text=/team selection|select your team/i', { timeout: 10000 });

    // Open second tab to check online status
    const page2 = await context.newPage();

    await page2.goto('http://localhost:5173');

    // Click SOCIAL tab
    await page2.getByRole('button', { name: /SOCIAL/i }).click();

    // Default sub-tab is Online
    // Wait for online players update
    await page2.waitForTimeout(6000);

    // Should show StatusTest player name in online list with status
    await expect(page2.getByText('StatusTest')).toBeVisible({ timeout: 10000 });
    await expect(page2.getByText(/Setting up/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show Join button for online players in games', async ({ browser }) => {
    // Single context with multiple pages (tabs) - sessionStorage provides isolation
    context = await browser.newContext();

    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Player 1 creates a game
    await page1.goto('http://localhost:5173');
    await page1.getByTestId('create-game-button').click();
    await page1.getByTestId('player-name-input').fill('Host');
    await page1.getByTestId('submit-create-button').click();

    await page1.waitForSelector('text=/team selection|select your team/i', { timeout: 10000 });

    // Player 2 checks online players
    await page2.goto('http://localhost:5173');

    // Click SOCIAL tab
    await page2.getByRole('button', { name: /SOCIAL/i }).click();

    // Default sub-tab is Online
    // Wait for online players update
    await page2.waitForTimeout(6000);

    // Should see Host player
    await expect(page2.getByText('Host')).toBeVisible({ timeout: 10000 });

    // Should see Join button (since Host is in a game, not in lobby)
    const joinButton = page2.getByRole('button', { name: /🎮 Join/i });
    await expect(joinButton).toBeVisible({ timeout: 5000 });
  });
});
