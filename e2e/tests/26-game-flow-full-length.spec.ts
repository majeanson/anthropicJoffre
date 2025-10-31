import { test, expect, Page } from '@playwright/test';
import {
  createGameWith4Players,
  createGameWithBots,
  playMultipleRounds,
  playCompleteGame,
  verifyGameState,
  measureRoundDuration,
  GameConfig
} from './helpers';

/**
 * Test suite for full-length games from 0-0 to completion without score manipulation.
 * These tests verify no memory leaks or performance degradation over extended gameplay.
 * Includes marathon tests with 10+ rounds to ensure game stability.
 *
 * NOTE: These tests are temporarily skipped due to multi-browser stability issues.
 * Multi-page architecture crashes after ~60s in marathon runs.
 * TODO: Refactor to use Quick Play + autoplay pattern for stability.
 */
test.describe.skip('@marathon Full-Length Games (No Score Manipulation)', () => {
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

  test.describe('Marathon Games - 4 Real Players', () => {
    test('should complete a natural full-length game from 0-0', async ({ browser }) => {
      test.setTimeout(3600000); // 60 minutes for truly full game

      const result = await createGameWith4Players(browser);
      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      console.log(`Marathon game started with ID: ${gameId}`);

      // Verify starting state
      await verifyGameState(pages[0], {
        phase: 'Betting',
        team1Score: 0,
        team2Score: 0,
        roundNumber: 1
      });

      // Track metrics
      const metrics = {
        roundDurations: [] as number[],
        memorySnapshots: [] as number[],
        errorCount: 0,
        totalTricks: 0,
        specialCardPlays: { red0: 0, brown0: 0 }
      };

      let gameEnded = false;
      let roundCount = 0;
      const MAX_ROUNDS = 30; // Safety limit

      while (!gameEnded && roundCount < MAX_ROUNDS) {
        roundCount++;
        console.log(`\n=== Round ${roundCount} ===`);

        const roundStart = Date.now();

        // Take memory snapshot (if available)
        try {
          const memoryUsage = await pages[0].evaluate(() => {
            // @ts-ignore
            if (window.performance && window.performance.memory) {
              // @ts-ignore
              return window.performance.memory.usedJSHeapSize;
            }
            return 0;
          });
          if (memoryUsage > 0) {
            metrics.memorySnapshots.push(memoryUsage);
          }
        } catch (e) {
          console.log('Memory measurement not available');
        }

        // Betting phase with varied strategies
        const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2
        const strategies = ['aggressive', 'conservative', 'mixed', 'adaptive'];
        const strategy = strategies[roundCount % strategies.length];

        for (let i = 0; i < 4; i++) {
          const playerIndex = bettingOrder[i];
          const page = pages[playerIndex];

          // Determine bet based on strategy
          let betAmount: number;
          let withoutTrump = false;

          switch (strategy) {
            case 'aggressive':
              betAmount = Math.floor(Math.random() * 3) + 10; // 10-12
              withoutTrump = Math.random() > 0.7;
              break;
            case 'conservative':
              betAmount = Math.floor(Math.random() * 2) + 7; // 7-8
              withoutTrump = false;
              break;
            case 'mixed':
              betAmount = Math.floor(Math.random() * 6) + 7; // 7-12
              withoutTrump = Math.random() > 0.5;
              break;
            case 'adaptive':
              // Adapt based on current scores
              const scoresText = await page.locator('[data-testid="team-scores"]').textContent();
              const team1Score = parseInt(scoresText?.match(/Team 1: (\d+)/)?.[1] || '0');
              const team2Score = parseInt(scoresText?.match(/Team 2: (\d+)/)?.[1] || '0');
              const scoreDiff = Math.abs(team1Score - team2Score);

              if (scoreDiff > 10) {
                // Big difference - be aggressive if behind
                const playerTeam = (playerIndex % 2 === 0) ? 1 : 2;
                const teamScore = playerTeam === 1 ? team1Score : team2Score;
                const opponentScore = playerTeam === 1 ? team2Score : team1Score;

                if (teamScore < opponentScore) {
                  betAmount = Math.floor(Math.random() * 2) + 11; // 11-12
                  withoutTrump = true;
                } else {
                  betAmount = Math.floor(Math.random() * 2) + 7; // 7-8
                  withoutTrump = false;
                }
              } else {
                betAmount = Math.floor(Math.random() * 4) + 8; // 8-11
                withoutTrump = Math.random() > 0.6;
              }
              break;
          }

          // Try to place bet
          const betTestId = withoutTrump
            ? `bet-${betAmount}-without-trump`
            : `bet-${betAmount}-with-trump`;
          const betBtn = page.getByTestId(betTestId);
          const skipBtn = page.getByTestId('skip-bet-button');

          if (await betBtn.isVisible({ timeout: 2000 })) {
            await betBtn.click();
            console.log(`P${playerIndex + 1} bet ${betAmount}${withoutTrump ? ' (no trump)' : ''}`);
          } else if (await skipBtn.isVisible({ timeout: 2000 })) {
            await skipBtn.click();
            console.log(`P${playerIndex + 1} skipped`);
          }

          await pages[0].waitForTimeout(300);
        }

        // Playing phase - track special cards
        for (let trick = 0; trick < 8; trick++) {
          metrics.totalTricks++;

          for (let card = 0; card < 4; card++) {
            await pages[0].waitForTimeout(200);

            // Find current player
            let pageWithTurn = -1;
            for (let i = 0; i < pages.length; i++) {
              try {
                const turnIndicator = pages[i].getByTestId('turn-indicator');
                if (await turnIndicator.isVisible({ timeout: 500 })) {
                  const text = await turnIndicator.textContent();
                  if (text === 'Your turn') {
                    pageWithTurn = i;
                    break;
                  }
                }
              } catch {
                // Continue checking other pages
              }
            }

            if (pageWithTurn === -1) {
              metrics.errorCount++;
              console.error(`Could not find current player at round ${roundCount}, trick ${trick + 1}, card ${card + 1}`);
              continue;
            }

            const currentPage = pages[pageWithTurn];

            // Check for special cards before playing
            try {
              const cardElements = currentPage.locator('[data-card-value]');
              const cardTexts = await cardElements.allTextContents();

              for (const cardText of cardTexts) {
                if (cardText.includes('Red 0')) metrics.specialCardPlays.red0++;
                if (cardText.includes('Brown 0')) metrics.specialCardPlays.brown0++;
              }
            } catch {
              // Card checking failed, continue
            }

            // Play the card
            const cardToPlay = currentPage.locator('[data-card-value]').first();
            await cardToPlay.click({ force: true });
            await pages[0].waitForTimeout(300);
          }

          // Wait for trick resolution
          await pages[0].waitForTimeout(3500);
        }

        const roundDuration = Date.now() - roundStart;
        metrics.roundDurations.push(roundDuration);
        console.log(`Round ${roundCount} completed in ${Math.round(roundDuration / 1000)}s`);

        // Check scores and game state
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        const scoresText = await pages[0].locator('[data-testid="team-scores"]').textContent();
        const team1Score = parseInt(scoresText?.match(/Team 1: (\d+)/)?.[1] || '0');
        const team2Score = parseInt(scoresText?.match(/Team 2: (\d+)/)?.[1] || '0');

        console.log(`Scores after round ${roundCount}: Team 1: ${team1Score}, Team 2: ${team2Score}`);

        // Check for game over
        const gameOverElement = pages[0].locator('text=/Game Over/i');
        gameEnded = await gameOverElement.isVisible({ timeout: 2000 });

        if (team1Score >= 41 || team2Score >= 41) {
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

      // Game statistics and validation
      console.log('\n=== Marathon Game Statistics ===');
      console.log(`Total rounds played: ${roundCount}`);
      console.log(`Total tricks played: ${metrics.totalTricks}`);
      console.log(`Special cards - Red 0: ${metrics.specialCardPlays.red0}, Brown 0: ${metrics.specialCardPlays.brown0}`);
      console.log(`Error count: ${metrics.errorCount}`);

      // Performance analysis
      if (metrics.roundDurations.length > 0) {
        const avgDuration = metrics.roundDurations.reduce((a, b) => a + b, 0) / metrics.roundDurations.length;
        const minDuration = Math.min(...metrics.roundDurations);
        const maxDuration = Math.max(...metrics.roundDurations);

        console.log(`\n=== Performance Metrics ===`);
        console.log(`Average round duration: ${Math.round(avgDuration / 1000)}s`);
        console.log(`Fastest round: ${Math.round(minDuration / 1000)}s`);
        console.log(`Slowest round: ${Math.round(maxDuration / 1000)}s`);

        // Check for performance degradation
        if (metrics.roundDurations.length > 5) {
          const firstFive = metrics.roundDurations.slice(0, 5);
          const lastFive = metrics.roundDurations.slice(-5);
          const firstAvg = firstFive.reduce((a, b) => a + b, 0) / firstFive.length;
          const lastAvg = lastFive.reduce((a, b) => a + b, 0) / lastFive.length;
          const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

          console.log(`Performance degradation: ${degradation.toFixed(2)}%`);
          expect(Math.abs(degradation)).toBeLessThan(100); // Less than 100% degradation
        }
      }

      // Memory leak detection
      if (metrics.memorySnapshots.length > 5) {
        const firstSnapshot = metrics.memorySnapshots[0];
        const lastSnapshot = metrics.memorySnapshots[metrics.memorySnapshots.length - 1];
        const memoryGrowth = ((lastSnapshot - firstSnapshot) / firstSnapshot) * 100;

        console.log(`\n=== Memory Analysis ===`);
        console.log(`Initial memory: ${Math.round(firstSnapshot / 1024 / 1024)}MB`);
        console.log(`Final memory: ${Math.round(lastSnapshot / 1024 / 1024)}MB`);
        console.log(`Memory growth: ${memoryGrowth.toFixed(2)}%`);

        // Allow up to 200% memory growth for long games
        expect(memoryGrowth).toBeLessThan(200);
      }

      // Validate game ended properly
      expect(gameEnded).toBeTruthy();
      expect(roundCount).toBeGreaterThan(5); // Should take at least 5 rounds naturally
      expect(roundCount).toBeLessThan(MAX_ROUNDS); // Should not hit the safety limit
      expect(metrics.errorCount).toBe(0); // No errors during gameplay
    });

    test('should handle 10+ consecutive rounds without issues', async ({ browser }) => {
      test.setTimeout(1800000); // 30 minutes

      const result = await createGameWith4Players(browser);
      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      // Play exactly 10 rounds to test stability
      for (let round = 1; round <= 10; round++) {
        console.log(`Playing round ${round}/10`);

        // Betting phase - simple strategy for speed
        const bettingOrder = [2, 3, 0, 1];
        for (const playerIndex of bettingOrder) {
          const betBtn = pages[playerIndex].getByTestId('bet-9-with-trump');
          const skipBtn = pages[playerIndex].getByTestId('skip-bet-button');

          if (await betBtn.isVisible({ timeout: 2000 })) {
            await betBtn.click();
          } else if (await skipBtn.isVisible({ timeout: 2000 })) {
            await skipBtn.click();
          }
          await pages[0].waitForTimeout(300);
        }

        // Play 8 tricks
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            // Find current player
            let pageWithTurn = -1;
            for (let i = 0; i < pages.length; i++) {
              try {
                const turnIndicator = pages[i].getByTestId('turn-indicator');
                if (await turnIndicator.isVisible({ timeout: 500 })) {
                  const text = await turnIndicator.textContent();
                  if (text === 'Your turn') {
                    pageWithTurn = i;
                    break;
                  }
                }
              } catch {
                continue;
              }
            }

            if (pageWithTurn !== -1) {
              const currentPage = pages[pageWithTurn];
              const cardToPlay = currentPage.locator('[data-card-value]').first();
              await cardToPlay.click({ force: true });
            }
            await pages[0].waitForTimeout(300);
          }
          await pages[0].waitForTimeout(3500);
        }

        // Wait for scoring and ready up
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        for (const page of pages) {
          const readyBtn = page.getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
        }
        await pages[0].waitForTimeout(1000);
      }

      // Verify we completed 10 rounds successfully
      const roundNumber = await pages[0].locator('text=/Round 11/i').isVisible({ timeout: 5000 });
      expect(roundNumber).toBeTruthy();
    });
  });

  test.describe('Marathon Games - Mixed Players and Bots', () => {
    test('should complete full game with 2 humans and 2 bots from 0-0', async ({ browser }) => {
      test.setTimeout(2400000); // 40 minutes

      const config: GameConfig = {
        humanPlayers: 2,
        botPlayers: 2,
        playerNames: ['Human 1', 'Human 2', 'Bot Alpha', 'Bot Beta']
      };

      const result = await createGameWithBots(browser, config);
      pages = result.pages;
      contexts = result.contexts;
      const botIndices = result.botPlayerIndices;
      gameId = result.gameId!;

      console.log(`Mixed marathon game started with ID: ${gameId}`);
      console.log(`Bot players at indices: ${botIndices.join(', ')}`);

      // Play complete game with mixed players
      const { roundCount, gameEnded } = await playCompleteGame(pages, botIndices, 41);

      // Verify game completed successfully
      expect(gameEnded).toBeTruthy();
      expect(roundCount).toBeGreaterThan(4);
      expect(roundCount).toBeLessThan(20);

      // Verify final state
      await expect(pages[0].locator('text=/Game Over/i')).toBeVisible();

      const winnerText = await pages[0].locator('text=/Team (1|2) Wins!/i').textContent();
      expect(winnerText).toMatch(/Team (1|2) Wins!/);

      console.log(`Mixed game completed in ${roundCount} rounds`);
    });

    test('should handle 15-round marathon with 1 human and 3 bots', async ({ browser }) => {
      test.setTimeout(1800000); // 30 minutes

      const config: GameConfig = {
        humanPlayers: 1,
        botPlayers: 3
      };

      const result = await createGameWithBots(browser, config);
      pages = result.pages;
      contexts = result.contexts;
      const botIndices = result.botPlayerIndices;

      // Play exactly 15 rounds to test extended bot stability
      await playMultipleRounds(pages, 15, botIndices);

      // Check that game is still running smoothly
      const currentPhase = await pages[0].locator('text=/Betting Phase|Playing Phase|Scoring Phase/i').textContent();
      expect(currentPhase).toBeTruthy();

      // Verify bots are still responsive
      const botStatus = await pages[0].locator('text=/Waiting for/i').isVisible({ timeout: 5000 });
      expect(botStatus).toBeTruthy(); // Should be waiting for someone (game still active)
    });
  });

  test.describe('Endurance Testing', () => {
    test('should maintain stable performance over 20+ rounds', async ({ browser }) => {
      test.setTimeout(3600000); // 60 minutes

      const result = await createGameWith4Players(browser);
      pages = result.pages;
      contexts = result.contexts;

      const performanceMetrics: number[] = [];
      let previousRoundTime = Date.now();

      for (let round = 1; round <= 20; round++) {
        const roundStart = Date.now();

        // Quick betting
        const bettingOrder = [2, 3, 0, 1];
        for (const playerIndex of bettingOrder) {
          const betBtn = pages[playerIndex].getByTestId('bet-8-with-trump');
          if (await betBtn.isVisible({ timeout: 1000 })) {
            await betBtn.click();
          }
          await pages[0].waitForTimeout(200);
        }

        // Quick playing
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            let pageWithTurn = -1;
            for (let i = 0; i < pages.length; i++) {
              try {
                const turnIndicator = pages[i].getByTestId('turn-indicator');
                if (await turnIndicator.isVisible({ timeout: 300 })) {
                  const text = await turnIndicator.textContent();
                  if (text === 'Your turn') {
                    pageWithTurn = i;
                    break;
                  }
                }
              } catch {
                continue;
              }
            }

            if (pageWithTurn !== -1) {
              await pages[pageWithTurn].locator('[data-card-value]').first().click({ force: true });
            }
            await pages[0].waitForTimeout(200);
          }
          await pages[0].waitForTimeout(3000);
        }

        // Quick ready
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });
        for (const page of pages) {
          const readyBtn = page.getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 500 })) {
            await readyBtn.click();
          }
        }

        const roundDuration = Date.now() - roundStart;
        performanceMetrics.push(roundDuration);

        console.log(`Round ${round}/20 completed in ${Math.round(roundDuration / 1000)}s`);
      }

      // Analyze performance consistency
      const avgTime = performanceMetrics.reduce((a, b) => a + b, 0) / performanceMetrics.length;
      const variance = performanceMetrics.map(t => Math.pow(t - avgTime, 2)).reduce((a, b) => a + b, 0) / performanceMetrics.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = (stdDev / avgTime) * 100;

      console.log(`\n=== Performance Consistency ===`);
      console.log(`Average round time: ${Math.round(avgTime / 1000)}s`);
      console.log(`Standard deviation: ${Math.round(stdDev / 1000)}s`);
      console.log(`Coefficient of variation: ${coefficientOfVariation.toFixed(2)}%`);

      // Expect consistent performance (CV < 50%)
      expect(coefficientOfVariation).toBeLessThan(50);
    });
  });
});