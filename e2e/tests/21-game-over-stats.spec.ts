import { test, expect } from '@playwright/test';
import { setGameStateViaAPI } from './helpers';

test.describe('Game Over Stats', () => {
  test('should display game over screen with final scores and history', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Create a game using Quick Play
    await page.getByRole('button', { name: /quick play/i }).click();

    // Wait for team selection (bots will auto-join)
    await page.waitForSelector('text=/game id/i', { timeout: 10000 });

    // Capture game ID for API manipulation
    const gameIdElement = page.getByTestId('game-id');
    const gameId = (await gameIdElement.textContent())!;
    console.log(`Game ID: ${gameId}`);

    // Wait for all 4 players to join
    await page.waitForSelector('text=/player 1|bot 1/i', { timeout: 5000 });
    await page.waitForSelector('text=/bot 2/i', { timeout: 5000 });
    await page.waitForSelector('text=/bot 3/i', { timeout: 5000 });

    // Start the game
    await page.getByRole('button', { name: /start game/i }).click();

    // Fast forward to game over using REST API (more reliable than Test Panel UI)
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 41, team2: 35 }
    });

    // Check if game_over phase is displayed
    const gameOverHeading = page.getByRole('heading', { name: /game over/i });

    // If not in game over yet, wait for a round to complete
    if (!(await gameOverHeading.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Enable autoplay to complete the game
      const autoplayButton = page.locator('button:has-text("Manual"), button:has-text("Auto")').first();
      if (await autoplayButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await autoplayButton.click();
      }

      // Wait for game over (with longer timeout)
      await gameOverHeading.waitFor({ timeout: 120000 });
    }

    // Verify game over screen elements
    await expect(gameOverHeading).toBeVisible();

    // Check for victory banner
    await expect(page.getByText(/team \d+ wins!/i)).toBeVisible();

    // Check for final scores
    await expect(page.getByText(/final score/i).first()).toBeVisible();

    // Verify team scores are displayed
    const team1Score = page.locator('text=/team 1/i').locator('..').locator('text=/\d+/');
    const team2Score = page.locator('text=/team 2/i').locator('..').locator('text=/\d+/');

    await expect(team1Score).toBeVisible();
    await expect(team2Score).toBeVisible();

    // Check for player stats (tricks and points)
    await expect(page.getByText(/tricks/i).first()).toBeVisible();
    await expect(page.getByText(/pts/i).first()).toBeVisible();

    // Check for game history section if there were rounds played
    const gameHistory = page.getByText(/game history/i);
    if (await gameHistory.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(gameHistory).toBeVisible();

      // Check for round details
      await expect(page.getByText(/round \d+/i).first()).toBeVisible();
      await expect(page.getByText(/bet made|bet failed/i).first()).toBeVisible();
    }

    // Verify action buttons
    await expect(page.getByRole('button', { name: /new game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /back to lobby/i })).toBeVisible();
  });

  test('should show correct winning team and crown icon', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Create game with Quick Play
    await page.getByRole('button', { name: /quick play/i }).click();
    await page.waitForSelector('text=/game id/i', { timeout: 10000 });

    // Capture game ID
    const gameId = (await page.getByTestId('game-id').textContent())!;

    // Wait for bots to join
    await page.waitForTimeout(2000);

    // Start game
    await page.getByRole('button', { name: /start game/i }).click();

    // Set winning scores using REST API
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 30, team2: 41 }
    });

    // Wait for game over
    await page.waitForSelector('text=/game over/i', { timeout: 120000 });

    // Verify Team 2 wins
    await expect(page.getByText(/team 2 wins!/i)).toBeVisible();

    // Check for crown icon on winning team
    const crownIcon = page.locator('text=/team 2/i').locator('..').locator('text=👑');
    await expect(crownIcon).toBeVisible();
  });

  test('should allow starting a new game from game over screen', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Create game
    await page.getByRole('button', { name: /quick play/i }).click();
    await page.waitForSelector('text=/game id/i', { timeout: 10000 });

    // Capture game ID
    const gameId = (await page.getByTestId('game-id').textContent())!;

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /start game/i }).click();

    // Fast forward to game over using REST API
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 41, team2: 20 }
    });

    await page.waitForSelector('text=/game over/i', { timeout: 120000 });

    // Click "New Game" button
    await page.getByRole('button', { name: /new game/i }).click();

    // Should return to team selection with new game
    await expect(page.getByText(/game id/i)).toBeVisible();
    await expect(page.getByText(/waiting for/i)).toBeVisible();
  });

  test('should allow returning to lobby from game over screen', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Create game
    await page.getByRole('button', { name: /quick play/i }).click();
    await page.waitForSelector('text=/game id/i', { timeout: 10000 });

    // Capture game ID
    const gameId = (await page.getByTestId('game-id').textContent())!;

    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: /start game/i }).click();

    // Fast forward to game over using REST API
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 41, team2: 20 }
    });

    await page.waitForSelector('text=/game over/i', { timeout: 120000 });

    // Click "Back to Lobby" button
    await page.getByRole('button', { name: /back to lobby/i }).click();

    // Should return to main lobby
    await expect(page.getByRole('button', { name: /create game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /join game/i })).toBeVisible();
  });
});
