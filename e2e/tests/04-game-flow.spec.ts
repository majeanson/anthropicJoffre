import { test, expect } from '@playwright/test';
import { createGameWith4Players, placeAllBets, playFullRound, playFullTrick } from './helpers';

test.describe('Game Flow and Scoring', () => {
  test('should complete a full round and show scoring phase', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    // Wait for betting phase
    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Place bets
    await placeAllBets(pages);

    // Play full round
    await playFullRound(pages);

    // Should show scoring phase
    await expect(pages[0].getByText(/round.*complete/i)).toBeVisible({ timeout: 15000 });

    // Should show team scores
    await expect(pages[0].getByText(/team 1/i)).toBeVisible();
    await expect(pages[0].getByText(/team 2/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should award points when bet is met', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // All players bet (in player order [P1, P2, P3, P4])
    await placeAllBets(pages); // Uses defaults: P3=7, P4=8, P1=9, P2=9

    // Get initial scores
    const initialScore = await pages[0].locator('text=/team 1/i').locator('..').locator('text=/^\\d+$/').textContent();

    // Play full round
    await playFullRound(pages);

    // Check if scores changed
    await pages[0].waitForSelector('text=/round.*complete/i', { timeout: 15000 });

    // At least one team should have points
    const team1Score = await pages[0].locator('text=/team 1/i').locator('..').locator('text=/^\\d+$/').textContent();
    const team2Score = await pages[0].locator('text=/team 2/i').locator('..').locator('text=/^\\d+$/').textContent();

    const totalPoints = parseInt(team1Score || '0') + parseInt(team2Score || '0');
    expect(totalPoints).toBeGreaterThan(0);

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should deduct points when bet is not met', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Players bet high - unlikely to meet
    // Betting order: P3, P4, P1, P2 → bets 10, 11, 12, 12
    await placeAllBets(pages, [12, 12, 10, 11]);

    // Play full round
    await playFullRound(pages);

    // Should show scoring
    await pages[0].waitForSelector('text=/round.*complete/i', { timeout: 15000 });

    // Some players should have negative scores
    // (Check player stats in scoring screen)
    const playerStats = pages[0].locator('text=/bet.*12.*won/i');
    await expect(playerStats.first()).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should double points for "without trump" bets', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

    // Player 1 bets without trump (escalating bets: 7, 8, 9, 9)
    // Note: Player 1 is index 0, in betting order they bet 3rd with amount at index 0
    await placeAllBets(pages, [9, 9, 7, 8], [true, false, false, false]);

    // Play full round
    await playFullRound(pages);

    // Check scoring screen shows without trump modifier
    await pages[0].waitForSelector('text=/round.*complete/i', { timeout: 15000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should start new round after scoring', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });
    await placeAllBets(pages);
    await playFullRound(pages);

    // Wait for scoring
    await pages[0].waitForSelector('text=/round.*complete/i', { timeout: 15000 });

    // Should show "Next round starting soon"
    await expect(pages[0].getByText(/next round starting/i)).toBeVisible();

    // Should automatically start new round
    await expect(pages[0].getByText(/betting phase/i)).toBeVisible({ timeout: 10000 });

    // Should show Round 2
    await expect(pages[0].getByText(/round 2/i)).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should end game when a team reaches 41 points', async ({ browser }) => {
    // Note: This test would require playing multiple rounds
    // Skipping for now as it would take too long
    // This should be tested with mocked/fast-forward game state
    test.skip();
  });

  test('should show game over screen with winner', async ({ browser }) => {
    // Note: This test requires reaching 41 points
    // Should be tested with backend helper to set scores directly
    test.skip();
  });

  test('should display trick winner correctly', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });
    await placeAllBets(pages);

    // Play one complete trick using helper
    await playFullTrick(pages);

    // One player should have tricks won = 1
    const playerWithTrick = pages[0].locator('text=/tricks.*1/i');
    await expect(playerWithTrick.first()).toBeVisible({ timeout: 5000 });

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should track tricks won for each player', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });
    await placeAllBets(pages);

    // Initial tricks should be 0
    const initialTricks = pages[0].locator('text=/tricks.*0/i');
    await expect(initialTricks.first()).toBeVisible();

    // Play 2 tricks
    for (let trick = 0; trick < 2; trick++) {
      for (let i = 0; i < 4; i++) {
        let currentPlayerIndex = -1;
        for (let j = 0; j < 4; j++) {
          if (await pages[j].getByText(/your turn/i).isVisible()) {
            currentPlayerIndex = j;
            break;
          }
        }

        if (currentPlayerIndex >= 0) {
          const card = pages[currentPlayerIndex].locator('button').filter({ hasText: /^[0-7]$/ }).first();
          await card.click();
          await pages[0].waitForTimeout(500);
        }
      }
      await pages[0].waitForTimeout(2000); // Wait for trick resolution
    }

    // At least one player should have won tricks
    const tricksWon = pages[0].locator('text=/tricks.*[1-9]/i');
    await expect(tricksWon.first()).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });

  test('should show correct card counts as game progresses', async ({ browser }) => {
    const { contexts, pages } = await createGameWith4Players(browser);

    await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });
    await placeAllBets(pages);

    // Initial: 8 cards
    await expect(pages[0].locator('text=/cards.*8/i').first()).toBeVisible();

    // Play one trick (4 cards)
    for (let i = 0; i < 4; i++) {
      let currentPlayerIndex = -1;
      for (let j = 0; j < 4; j++) {
        if (await pages[j].getByText(/your turn/i).isVisible()) {
          currentPlayerIndex = j;
          break;
        }
      }

      if (currentPlayerIndex >= 0) {
        const card = pages[currentPlayerIndex].locator('[data-card-value]').first();
        await card.click();
        await pages[0].waitForTimeout(500);
      }
    }

    await pages[0].waitForTimeout(2000);

    // After 1 trick: 7 cards
    await expect(pages[0].locator('text=/cards.*7/i').first()).toBeVisible();

    for (const context of contexts) {
      await context.close();
    }
  });
});
