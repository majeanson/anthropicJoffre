import { test, expect } from '@playwright/test';
import { setupPlayers, waitForGamePhase } from './helpers';

/**
 * Persistence Mode Tests
 *
 * Verifies that casual mode uses zero database calls and ELO mode persists correctly
 *
 * Test scenarios:
 * 1. Casual mode - No database persistence
 * 2. ELO mode - Full database persistence
 * 3. Session handling - Casual has no sessions, ELO has sessions
 * 4. Reconnection - Casual doesn't support it, ELO does
 */

test.describe('Persistence Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=Trick Card Game', { timeout: 10000 });
  });

  test('Casual mode: Quick Play creates memory-only game with no database persistence', async ({ page, context }) => {
    // Step 1: Ensure Quick Play is set to casual mode (unchecked)
    // Quick Play button is on the main menu, so we need to verify the checkbox state first
    const persistenceCheckbox = page.locator('text=Save Stats & ELO').locator('..').locator('input[type="checkbox"]').first();

    // Make sure it's unchecked (casual mode)
    const isChecked = await persistenceCheckbox.isChecked();
    if (isChecked) {
      await persistenceCheckbox.click();
    }

    // Verify the badge shows "Casual"
    await expect(page.locator('text=🎮 Casual').first()).toBeVisible();

    // Step 2: Create a casual game via Quick Play
    const quickPlayButton = page.locator('button', { hasText: 'Quick Play' });
    await expect(quickPlayButton).toBeVisible();
    await quickPlayButton.click();

    // Wait for game to be created
    await page.waitForSelector('text=Team Selection', { timeout: 10000 });

    // Extract game ID from page
    const gameIdElement = page.locator('[data-testid="game-id"]');
    await expect(gameIdElement).toBeVisible({ timeout: 5000 });
    const gameId = await gameIdElement.textContent();

    console.log(`[Casual Test] Created game: ${gameId}`);

    // Step 3: Wait a moment for any potential DB saves
    await page.waitForTimeout(2000);

    // Step 4: Verify game is NOT in database via API
    // The lobby API endpoint queries the database, so casual games shouldn't appear
    const apiResponse = await page.request.get('http://localhost:3001/api/games/lobby');
    expect(apiResponse.ok()).toBeTruthy();

    const lobbyData = await apiResponse.json();
    const gamesInDb = lobbyData.games || [];

    // Casual game should NOT be in database
    const casualGameInDb = gamesInDb.find((g: any) => g.id === gameId);
    expect(casualGameInDb).toBeUndefined();

    console.log(`[Casual Test] ✓ Game ${gameId} not found in database (expected for casual mode)`);

    // Step 5: Verify localStorage has NO session token (casual mode)
    const sessionToken = await page.evaluate(() => localStorage.getItem('joffreSession'));
    expect(sessionToken).toBeNull();

    console.log('[Casual Test] ✓ No session token in localStorage (expected for casual mode)');

    // Step 6: Test reconnection failure (casual mode doesn't support reconnection)
    // Refresh the page and verify we can't reconnect
    await page.reload();

    // Should NOT auto-reconnect - should be back at lobby
    await expect(page.locator('text=J⋀ffre')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Team Selection')).not.toBeVisible();

    console.log('[Casual Test] ✓ No reconnection support (expected for casual mode)');
  });

  test('ELO mode: Manual game creation persists to database', async ({ page, context }) => {
    // Step 1: Create an ELO game via manual creation
    const createGameButton = page.locator('button', { hasText: 'Create Game' }).filter({ hasText: /^➕ Create Game$/ });
    await expect(createGameButton).toBeVisible();
    await createGameButton.click();

    // Fill in player name
    const playerNameInput = page.locator('[data-testid="player-name-input"]');
    await playerNameInput.fill('ELO Player 1');

    // Enable ELO mode (check the persistence checkbox) - defaults to checked, so verify
    const persistenceCheckbox = page.locator('[data-testid="persistence-mode-checkbox"]');
    await expect(persistenceCheckbox).toBeVisible();

    const isChecked = await persistenceCheckbox.isChecked();
    if (!isChecked) {
      await persistenceCheckbox.click();
    }

    // Verify the badge shows "Ranked"
    await expect(page.locator('text=🏆 Ranked')).toBeVisible();

    // Submit game creation
    const submitButton = page.locator('[data-testid="submit-create-button"]');
    await submitButton.click();

    // Wait for game to be created
    await page.waitForSelector('text=Team Selection', { timeout: 10000 });

    // Extract game ID
    const gameIdElement = page.locator('[data-testid="game-id"]');
    await expect(gameIdElement).toBeVisible({ timeout: 5000 });
    const gameId = await gameIdElement.textContent();

    console.log(`[ELO Test] Created game: ${gameId}`);

    // Step 2: Wait a moment for database save to complete
    await page.waitForTimeout(2000);

    // Step 3: Verify game IS in database via API
    const apiResponse = await page.request.get('http://localhost:3001/api/games/lobby');
    expect(apiResponse.ok()).toBeTruthy();

    const lobbyData = await apiResponse.json();
    const gamesInDb = lobbyData.games || [];

    // ELO game should be in database
    const eloGameInDb = gamesInDb.find((g: any) => g.id === gameId);
    expect(eloGameInDb).toBeDefined();
    expect(eloGameInDb.persistence_mode).toBe('elo');

    console.log(`[ELO Test] ✓ Game ${gameId} found in database with persistence_mode='elo'`);

    // Step 4: Verify localStorage HAS session token (ELO mode)
    const sessionToken = await page.evaluate(() => localStorage.getItem('joffreSession'));
    expect(sessionToken).not.toBeNull();
    expect(sessionToken).toBeTruthy();

    const sessionData = JSON.parse(sessionToken!);
    expect(sessionData.gameId).toBe(gameId);
    expect(sessionData.playerName).toBe('ELO Player 1');

    console.log('[ELO Test] ✓ Session token saved in localStorage');

    // Step 5: Test reconnection support (ELO mode)
    // Refresh the page and verify we auto-reconnect
    await page.reload();

    // Should auto-reconnect to game
    await expect(page.locator('text=Team Selection')).toBeVisible({ timeout: 5000 });

    // Verify we're in the same game
    const reconnectedGameId = await page.locator('[data-testid="game-id"]').textContent();
    expect(reconnectedGameId).toBe(gameId);

    console.log('[ELO Test] ✓ Reconnection successful');
  });

  test('Session management: Casual has no sessions, ELO creates sessions', async ({ page }) => {
    console.log('\n===== TESTING SESSION MANAGEMENT =====');

    // Test 1: Casual mode - no session creation
    // Ensure Quick Play is in casual mode
    const persistenceCheckbox = page.locator('text=Save Stats & ELO').locator('..').locator('input[type="checkbox"]').first();
    const isChecked = await persistenceCheckbox.isChecked();
    if (isChecked) {
      await persistenceCheckbox.click();
    }

    const quickPlayButton = page.locator('button', { hasText: 'Quick Play' });
    await quickPlayButton.click();
    await page.waitForSelector('text=Team Selection', { timeout: 10000 });

    // Check localStorage - should have NO session
    let sessionToken = await page.evaluate(() => localStorage.getItem('joffreSession'));
    expect(sessionToken).toBeNull();
    console.log('[Casual] ✓ No session token created (expected for casual mode)');

    // Leave game and go back to lobby
    await page.locator('button', { hasText: 'Leave Game' }).first().click();
    await page.waitForSelector('text=J⋀ffre', { timeout: 5000 });

    // Test 2: ELO mode - session creation
    const createButton = page.locator('button', { hasText: 'Create Game' }).filter({ hasText: /^➕ Create Game$/ });
    await createButton.click();

    const nameInput = page.locator('[data-testid="player-name-input"]');
    await nameInput.fill('Session Test Player');

    // Verify ELO mode is enabled (should be checked by default)
    const eloCheckbox = page.locator('[data-testid="persistence-mode-checkbox"]');
    const eloChecked = await eloCheckbox.isChecked();
    if (!eloChecked) {
      await eloCheckbox.click();
    }

    await page.locator('[data-testid="submit-create-button"]').click();
    await page.waitForSelector('text=Team Selection', { timeout: 10000 });

    // Check localStorage - should HAVE session
    sessionToken = await page.evaluate(() => localStorage.getItem('joffreSession'));
    expect(sessionToken).not.toBeNull();

    const sessionData = JSON.parse(sessionToken!);
    expect(sessionData.playerName).toBe('Session Test Player');
    expect(sessionData.gameId).toBeTruthy();
    expect(sessionData.token).toBeTruthy();

    console.log('[ELO] ✓ Session token created with correct data');
  });
});
