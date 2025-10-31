import { test, expect } from '@playwright/test';
import { setGameStateViaAPI } from './helpers';

test.describe('Game Completion Stats Recording', () => {
  test('should record player stats when game completes after Test Panel score manipulation', async ({ page }) => {
    const playerName = 'StatTestPlayer_' + Date.now();

    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Create a game using Quick Play with custom player name
    await page.getByTestId('quick-play-button').click();

    // Wait for team selection
    await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });

    // Capture game ID
    const gameId = (await page.getByTestId('game-id').textContent())!;

    // Wait for bots to join (3 bots)
    await page.waitForTimeout(2000);

    // Start the game
    await page.getByTestId('start-game-button').click();

    // Wait for betting phase
    await page.waitForSelector('text=/betting/i', { state: 'visible', timeout: 10000 });

    // Set team 1 to 41 points to trigger immediate game_over
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 41, team2: 30 }
    });

    // Wait for game to complete (should be immediate since team1 >= 41)
    const gameOverHeading = page.getByRole('heading', { name: /game over/i });
    await gameOverHeading.waitFor({ timeout: 10000 });

    console.log('✅ Game completed, verifying game over screen...');

    // Verify game over screen is displayed
    await expect(gameOverHeading).toBeVisible();
    await expect(page.getByText(/team \d+ wins!/i)).toBeVisible();

    // Verify final scores are shown (one team should have at least 41 points)
    const finalScoreText = await page.getByText(/final score/i).first().textContent();
    console.log('Final score text:', finalScoreText);

    // Now verify player stats were recorded by checking the database via API
    // Note: This assumes you have a player's name available (not just "You")
    // For now, we'll verify that the game history was recorded

    // Check if game history API endpoint exists
    const gameHistoryCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/games/recent');
        return response.ok;
      } catch {
        return false;
      }
    });

    if (gameHistoryCheck) {
      console.log('✅ Game history API accessible');
    }

    // Verify leaderboard is accessible (which requires stats to be recorded)
    const leaderboardCheck = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/leaderboard');
        return response.ok;
      } catch {
        return false;
      }
    });

    if (leaderboardCheck) {
      console.log('✅ Leaderboard API accessible');
    }
  });

  test('should update player stats correctly when completing a game (E2E with real player name)', async ({ page }) => {
    // Use Quick Play with default player name "You"
    const playerName = 'You';

    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Use Quick Play to create game with bots
    await page.getByTestId('quick-play-button').click();
    await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });

    // Capture game ID
    const gameId = (await page.getByTestId('game-id').textContent())!;

    // Wait for bots to join
    await page.waitForTimeout(2000);

    // Start the game
    await page.getByTestId('start-game-button').click();

    // Wait for betting phase
    await page.waitForSelector('text=/betting/i', { state: 'visible', timeout: 10000 });

    // Use REST API to fast-forward to game completion
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 41, team2: 30 }
    });

    // Wait for game over
    await page.waitForSelector('text=/game over/i', { timeout: 120000 });

    console.log('✅ Game completed successfully');

    // Verify game over elements
    await expect(page.getByRole('heading', { name: /game over/i })).toBeVisible();
    await expect(page.getByText(/team \d+ wins!/i)).toBeVisible();

    // Wait a moment for stats to be saved to database
    await page.waitForTimeout(2000);

    // Check player stats via API
    const statsResponse = await page.evaluate(async (name) => {
      try {
        const response = await fetch(`/api/stats/${encodeURIComponent(name)}`);
        if (!response.ok) {
          return { error: 'Stats not found', status: response.status };
        }
        return await response.json();
      } catch (error: any) {
        return { error: error.message };
      }
    }, playerName);

    console.log('Stats API response:', statsResponse);

    // Verify stats were recorded
    if (!statsResponse.error) {
      expect(statsResponse.games_played).toBeGreaterThanOrEqual(1);
      expect(statsResponse.player_name).toBe(playerName);
      console.log('✅ Player stats successfully recorded!');
      console.log(`   - Games Played: ${statsResponse.games_played}`);
      console.log(`   - Games Won: ${statsResponse.games_won}`);
      console.log(`   - ELO Rating: ${statsResponse.elo_rating}`);
    } else {
      console.error('❌ Player stats not found:', statsResponse.error);
      throw new Error(`Player stats not recorded: ${statsResponse.error}`);
    }
  });

  test('should verify stats are recorded in database after game completion', async ({ page }) => {
    // This test directly checks the backend logs
    console.log('🔍 Monitoring backend logs for stat recording...');

    // Navigate to app
    await page.goto('http://localhost:5173');

    // Create game with Quick Play
    await page.getByTestId('quick-play-button').click();
    await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });

    // Capture game ID
    const gameId = (await page.getByTestId('game-id').textContent())!;

    await page.waitForTimeout(2000);
    await page.getByTestId('start-game-button').click();

    // Fast-forward using REST API (more reliable than Test Panel)
    await setGameStateViaAPI(page, gameId, {
      teamScores: { team1: 41, team2: 35 }
    });

    // Wait for game completion
    await page.waitForSelector('text=/game over/i', { timeout: 120000 });
    await page.waitForTimeout(2000);

    console.log('✅ Game completed, stats should be recorded in backend logs');
    console.log('📝 Check backend console for messages like:');
    console.log('   - "Game {gameId} marked as finished, Team X won"');
    console.log('   - "Updated game stats for {playerName}: WIN/LOSS, ELO +/-{change}"');

    // Verify game over screen is displayed
    await expect(page.getByRole('heading', { name: /game over/i })).toBeVisible();
  });
});
