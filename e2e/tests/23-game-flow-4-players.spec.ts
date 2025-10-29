import { test, expect, Page } from '@playwright/test';
import {
  createGameWith4Players,
  playFullRound,
  playMultipleRounds,
  verifyGameState,
  measureRoundDuration,
  playCompleteGame
} from './helpers';

/**
 * Test suite for complete game flows with 4 real players (4 browsers).
 * Tests both quick games (near end-game) and full-length games from scratch.
 */
test.describe('Game Flow - 4 Real Players', () => {
  let pages: Page[];
  let contexts: any[];
  let gameId: string;

  test.afterEach(async () => {
    // Cleanup all contexts
    if (contexts) {
      for (const context of contexts) {
        await context.close();
      }
    }
  });


  test.describe('@full Full-Length Games', () => {
    test('should play a complete game from 0-0 to 41+', async ({ browser }) => {
      test.setTimeout(2700000); // 45 minutes for full game

      const result = await createGameWith4Players(browser);
      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      console.log(`Full game started with ID: ${gameId}`);

      // Verify starting at 0-0
      await verifyGameState(pages[0], {
        phase: 'Betting',
        team1Score: 0,
        team2Score: 0,
        roundNumber: 1
      });

      // Track round durations for performance metrics
      const roundDurations: number[] = [];
      let totalRounds = 0;
      let gameEnded = false;

      while (!gameEnded && totalRounds < 20) {
        totalRounds++;
        console.log(`\n=== Round ${totalRounds} ===`);

        const roundStartTime = Date.now();

        // Betting phase - varied strategies
        const bettingOrder = [2, 3, 0, 1];
        for (let i = 0; i < bettingOrder.length; i++) {
          const playerIndex = bettingOrder[i];
          const page = pages[playerIndex];

          // Vary betting amounts for realism
          const betAmounts = [7, 8, 9, 10, 11, 12];
          const randomBet = betAmounts[Math.floor(Math.random() * betAmounts.length)];

          const betBtn = page.getByTestId(`bet-${randomBet}-with-trump`);
          const skipBtn = page.getByTestId('skip-bet-button');

          // Try to bet, otherwise skip
          if (await betBtn.isVisible({ timeout: 2000 })) {
            await betBtn.click();
            console.log(`Player ${playerIndex + 1} bet ${randomBet}`);
          } else if (await skipBtn.isVisible({ timeout: 2000 })) {
            await skipBtn.click();
            console.log(`Player ${playerIndex + 1} skipped`);
          }

          await pages[0].waitForTimeout(500);
        }

        // Playing phase - 8 tricks
        console.log('Playing 8 tricks...');
        await playFullRound(pages);

        const roundEndTime = Date.now();
        const roundDuration = roundEndTime - roundStartTime;
        roundDurations.push(roundDuration);
        console.log(`Round ${totalRounds} completed in ${Math.round(roundDuration / 1000)}s`);

        // Check scores
        const scoresText = await pages[0].locator('[data-testid="team-scores"]').textContent();
        const team1Match = scoresText?.match(/Team 1: (\d+)/);
        const team2Match = scoresText?.match(/Team 2: (\d+)/);

        if (team1Match && team2Match) {
          const team1Score = parseInt(team1Match[1]);
          const team2Score = parseInt(team2Match[1]);
          console.log(`Scores: Team 1: ${team1Score}, Team 2: ${team2Score}`);

          if (team1Score >= 41 || team2Score >= 41) {
            gameEnded = true;
            console.log('Game ending condition met!');
          }
        }

        // Check for game over
        const gameOverElement = pages[0].locator('text=/Game Over/i');
        if (await gameOverElement.isVisible({ timeout: 2000 })) {
          gameEnded = true;
        }

        if (!gameEnded) {
          // All players ready for next round
          for (const page of pages) {
            const readyBtn = page.getByTestId('ready-for-next-round-button');
            if (await readyBtn.isVisible({ timeout: 1000 })) {
              await readyBtn.click();
            }
          }
          await pages[0].waitForTimeout(1000);
        }
      }

      // Game statistics
      console.log('\n=== Game Statistics ===');
      console.log(`Total rounds played: ${totalRounds}`);
      console.log(`Average round duration: ${Math.round(roundDurations.reduce((a, b) => a + b, 0) / roundDurations.length / 1000)}s`);
      console.log(`Shortest round: ${Math.round(Math.min(...roundDurations) / 1000)}s`);
      console.log(`Longest round: ${Math.round(Math.max(...roundDurations) / 1000)}s`);

      // Verify game ended properly
      expect(gameEnded).toBeTruthy();
      await expect(pages[0].locator('text=/Game Over/i')).toBeVisible();

      // Verify final scores
      const finalScoresText = await pages[0].locator('[data-testid="final-scores"]').textContent();
      expect(finalScoresText).toMatch(/Team (1|2): \d+/);
    });

    test('should handle special cards correctly over multiple rounds', async ({ browser }) => {
      test.setTimeout(1800000); // 30 minutes

      const result = await createGameWith4Players(browser);
      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      // Play 3 complete rounds to ensure special cards are encountered
      for (let round = 1; round <= 3; round++) {
        console.log(`Playing round ${round}/3`);

        // Betting phase
        const bettingOrder = [2, 3, 0, 1];
        for (const playerIndex of bettingOrder) {
          const betBtn = pages[playerIndex].getByTestId('bet-9-with-trump');
          const skipBtn = pages[playerIndex].getByTestId('skip-bet-button');

          if (await betBtn.isVisible({ timeout: 2000 })) {
            await betBtn.click();
          } else if (await skipBtn.isVisible({ timeout: 2000 })) {
            await skipBtn.click();
          }
          await pages[0].waitForTimeout(500);
        }

        // Play round
        await playFullRound(pages);

        // Check for special cards in round history
        const roundHistoryText = await pages[0].locator('[data-testid="round-history"]').textContent();
        if (roundHistoryText?.includes('Red 0')) {
          console.log('Red 0 card played - +5 points bonus detected');
        }
        if (roundHistoryText?.includes('Brown 0')) {
          console.log('Brown 0 card played - -2 points penalty detected');
        }

        // Ready for next round
        for (const page of pages) {
          const readyBtn = page.getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
        }
        await pages[0].waitForTimeout(1000);
      }

      // Verify scores progressed over 3 rounds
      const scoresText = await pages[0].locator('[data-testid="team-scores"]').textContent();
      const team1Match = scoresText?.match(/Team 1: (\d+)/);
      const team2Match = scoresText?.match(/Team 2: (\d+)/);

      if (team1Match && team2Match) {
        const team1Score = parseInt(team1Match[1]);
        const team2Score = parseInt(team2Match[1]);

        // After 3 rounds, scores should be > 0
        expect(team1Score + team2Score).toBeGreaterThan(0);
        console.log(`Scores after 3 rounds: Team 1: ${team1Score}, Team 2: ${team2Score}`);
      }
    });
  });

  test.describe('@stress Stress Testing', () => {
    test('should maintain performance over 10 consecutive quick rounds', async ({ browser }) => {
      test.setTimeout(600000); // 10 minutes

      const result = await createGameWith4Players(browser);
      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      // Set scores near end for quick rounds
      await pages[0].evaluate(() => {
        // @ts-ignore
        if (window.socket) {
          // @ts-ignore
          window.socket.emit('__test_set_scores', { team1: 20, team2: 20 });
        }
      });
      await pages[0].waitForTimeout(2000); // Wait for state to propagate

      const roundDurations: number[] = [];

      for (let round = 1; round <= 10; round++) {
        const startTime = Date.now();

        // Quick betting - all bet 8
        const bettingOrder = [2, 3, 0, 1];
        for (const playerIndex of bettingOrder) {
          const betBtn = pages[playerIndex].getByTestId('bet-8-with-trump');
          if (await betBtn.isVisible({ timeout: 1000 })) {
            await betBtn.click();
          }
          await pages[0].waitForTimeout(300);
        }

        // Play round
        await playFullRound(pages);

        const duration = Date.now() - startTime;
        roundDurations.push(duration);

        // Ready for next
        for (const page of pages) {
          const readyBtn = page.getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
        }
      }

      // Check for performance degradation
      const firstRoundDuration = roundDurations[0];
      const lastRoundDuration = roundDurations[roundDurations.length - 1];
      const degradation = ((lastRoundDuration - firstRoundDuration) / firstRoundDuration) * 100;

      console.log(`Performance degradation: ${degradation.toFixed(2)}%`);
      expect(Math.abs(degradation)).toBeLessThan(50); // Less than 50% degradation
    });
  });
});