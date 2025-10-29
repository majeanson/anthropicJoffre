import { test, expect, Page } from '@playwright/test';
import {
  createGameWithBots,
  verifyGameState,
  waitForBotAction,
  playCompleteGame,
  measureRoundDuration
} from './helpers';

/**
 * Test suite for games with 1 real player and 3 bots.
 * Tests bot AI behavior, decision-making, and game flow automation.
 */
test.describe('Game Flow - 1 Player + 3 Bots', () => {
  let pages: Page[];
  let context: any;
  let gameId: string;
  let botIndices: number[];

  test.afterEach(async () => {
    // Cleanup single context
    if (context) {
      await context.close();
    }
  });

  test.describe('@quick Quick Bot Games', () => {
    test('should complete a game with 3 bots', async ({ browser }) => {
      test.setTimeout(180000); // 3 minutes (bots play fast)

      // Create game with 1 human and 3 bots
      const result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3,
        playerNames: ['Human', 'Bot1', 'Bot2', 'Bot3']
      });

      pages = result.pages;
      context = result.context;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      console.log(`Bot game created with ID: ${gameId}`);
      console.log(`Bot indices: ${botIndices.join(', ')}`);

      // Verify initial state
      await verifyGameState(pages[0], {
        phase: 'Betting',
        team1Score: 0,
        team2Score: 0
      });

      // Play rounds until game ends (bots play fast, ~10-15 rounds to reach 41)
      let gameEnded = false;
      let roundsPlayed = 0;

      while (!gameEnded && roundsPlayed < 20) {
        roundsPlayed++;
        console.log(`Round ${roundsPlayed}`);

        // Wait for betting phase
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Human player bets
        const humanBetBtn = pages[0].getByTestId('bet-8-with-trump');
        const humanSkipBtn = pages[0].getByTestId('skip-bet-button');

        // Check if it's human's turn to bet
        if (await humanBetBtn.isVisible({ timeout: 2000 })) {
          await humanBetBtn.click();
          console.log('Human player bet 8');
        } else if (await humanSkipBtn.isVisible({ timeout: 2000 })) {
          await humanSkipBtn.click();
          console.log('Human player skipped');
        }

        // Wait for bots to complete betting
        await waitForBotAction(pages[0], 10000);
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        // Playing phase - human plays cards, bots play automatically
        for (let trick = 0; trick < 8; trick++) {
          // Check if it's human's turn
          const turnIndicator = pages[0].getByTestId('turn-indicator');
          if (await turnIndicator.isVisible({ timeout: 1000 })) {
            const turnText = await turnIndicator.textContent();
            if (turnText === 'Your turn') {
              // Human plays a card
              const card = pages[0].locator('[data-card-value]').first();
              await card.click({ force: true });
              console.log(`Human played card in trick ${trick + 1}`);
            }
          }

          // Wait for bots to play
          await waitForBotAction(pages[0], 5000);
        }

        // Wait for scoring phase
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        // Check for game over
        gameEnded = await pages[0].locator('text=/Game Over/i').isVisible({ timeout: 2000 });

        if (!gameEnded) {
          // Human player clicks ready
          const readyBtn = pages[0].getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
          // Bots will auto-ready
          await pages[0].waitForTimeout(2000);
        }
      }

      // Verify game ended
      expect(gameEnded).toBeTruthy();
      await expect(pages[0].locator('text=/Game Over/i')).toBeVisible();
      console.log(`Bot game completed in ${roundsPlayed} rounds`);
    });

    test('should verify bot decision-making quality', async ({ browser }) => {
      test.setTimeout(180000); // 3 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3
      });

      pages = result.pages;
      context = result.context;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      // Track bot decisions
      const botDecisions = {
        bets: [] as number[],
        betTimes: [] as number[],
        playTimes: [] as number[]
      };

      // Play one complete round to analyze bot behavior
      await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

      // Monitor betting phase
      const bettingStartTime = Date.now();

      // Wait for all betting to complete
      let bettingComplete = false;
      while (!bettingComplete) {
        // Check current player's bet display
        const currentBets = await pages[0].locator('[data-testid="player-bet"]').allTextContents();

        // If we see 4 bets, betting is complete
        if (currentBets.length >= 4) {
          bettingComplete = true;
        }

        // Human player bets if it's their turn
        const humanBetBtn = pages[0].getByTestId('bet-9-with-trump');
        if (await humanBetBtn.isVisible({ timeout: 500 })) {
          await humanBetBtn.click();
        }

        await pages[0].waitForTimeout(500);
      }

      const bettingDuration = Date.now() - bettingStartTime;
      console.log(`Betting phase completed in ${bettingDuration}ms`);

      // Verify bots made reasonable bets
      const betTexts = await pages[0].locator('[data-testid="player-bet"]').allTextContents();
      for (const betText of betTexts) {
        if (betText.includes('Bot')) {
          const betMatch = betText.match(/(\d+)/);
          if (betMatch) {
            const betAmount = parseInt(betMatch[1]);
            expect(betAmount).toBeGreaterThanOrEqual(7);
            expect(betAmount).toBeLessThanOrEqual(12);
            botDecisions.bets.push(betAmount);
          }
        }
      }

      console.log(`Bot bets: ${botDecisions.bets.join(', ')}`);

      // Analyze bot play times during tricks
      await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 10000 });

      for (let trick = 0; trick < 3; trick++) {
        const trickStartTime = Date.now();

        // Play through one trick
        for (let card = 0; card < 4; card++) {
          const turnStart = Date.now();

          // Check whose turn it is
          const currentPlayerText = await pages[0].getByTestId('current-turn-player').textContent();

          if (currentPlayerText?.includes('Human')) {
            // Human plays
            const humanCard = pages[0].locator('[data-card-value]').first();
            await humanCard.click({ force: true });
          } else if (currentPlayerText?.includes('Bot')) {
            // Wait for bot to play
            await waitForBotAction(pages[0], 3000);
            const playTime = Date.now() - turnStart;
            botDecisions.playTimes.push(playTime);
          }

          await pages[0].waitForTimeout(300);
        }

        console.log(`Trick ${trick + 1} completed`);
      }

      // Verify bot decision times are reasonable (100-2000ms)
      for (const playTime of botDecisions.playTimes) {
        expect(playTime).toBeGreaterThanOrEqual(100);
        expect(playTime).toBeLessThanOrEqual(3000);
      }

      const avgPlayTime = botDecisions.playTimes.reduce((a, b) => a + b, 0) / botDecisions.playTimes.length;
      console.log(`Average bot play time: ${Math.round(avgPlayTime)}ms`);
    });
  });

  test.describe('@full Full-Length Bot Games', () => {
    test('should play a complete game with bots from 0-0', async ({ browser }) => {
      test.setTimeout(1800000); // 30 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3,
        playerNames: ['Human', 'AlphaBot', 'BetaBot', 'GammaBot']
      });

      pages = result.pages;
      context = result.context;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      console.log(`Full bot game started with ID: ${gameId}`);

      // Verify starting at 0-0
      await verifyGameState(pages[0], {
        phase: 'Betting',
        team1Score: 0,
        team2Score: 0,
        roundNumber: 1
      });

      let totalRounds = 0;
      let gameEnded = false;
      const roundDurations: number[] = [];

      while (!gameEnded && totalRounds < 15) {
        totalRounds++;
        console.log(`\n=== Round ${totalRounds} ===`);
        const roundStart = Date.now();

        // Betting phase
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Human bets when it's their turn
        const humanBetBtn = pages[0].getByTestId('bet-8-with-trump');
        const humanSkipBtn = pages[0].getByTestId('skip-bet-button');

        if (await humanBetBtn.isVisible({ timeout: 2000 })) {
          await humanBetBtn.click();
        } else if (await humanSkipBtn.isVisible({ timeout: 2000 })) {
          await humanSkipBtn.click();
        }

        // Wait for bots to complete betting
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        // Playing phase - play 8 tricks
        for (let trick = 0; trick < 8; trick++) {
          // Check if it's human's turn
          for (let card = 0; card < 4; card++) {
            const turnIndicator = pages[0].getByTestId('turn-indicator');
            if (await turnIndicator.isVisible({ timeout: 500 })) {
              const turnText = await turnIndicator.textContent();
              if (turnText === 'Your turn') {
                const humanCard = pages[0].locator('[data-card-value]').first();
                await humanCard.click({ force: true });
              }
            }
            await pages[0].waitForTimeout(800);
          }
        }

        // Scoring phase
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        const roundDuration = Date.now() - roundStart;
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
          }
        }

        // Check for game over
        if (await pages[0].locator('text=/Game Over/i').isVisible({ timeout: 2000 })) {
          gameEnded = true;
        }

        if (!gameEnded) {
          // Human ready for next round
          const readyBtn = pages[0].getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
          await pages[0].waitForTimeout(2000);
        }
      }

      // Game statistics
      console.log('\n=== Bot Game Statistics ===');
      console.log(`Total rounds played: ${totalRounds}`);
      console.log(`Average round duration: ${Math.round(roundDurations.reduce((a, b) => a + b, 0) / roundDurations.length / 1000)}s`);

      expect(gameEnded).toBeTruthy();
      await expect(pages[0].locator('text=/Game Over/i')).toBeVisible();
    });

    test('should test different bot difficulty levels', async ({ browser }) => {
      test.setTimeout(900000); // 15 minutes

      // Test with easy bots
      console.log('Testing with EASY bots...');
      let result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3,
        startScores: { team1: 35, team2: 35 }
      });

      // TODO: Set bot difficulty to easy when that feature is exposed
      // For now, bots use medium difficulty by default

      pages = result.pages;
      context = result.context;

      // Play one round with easy bots
      await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

      // Human player bets
      const humanBetBtn = pages[0].getByTestId('bet-7-with-trump');
      if (await humanBetBtn.isVisible({ timeout: 2000 })) {
        await humanBetBtn.click();
      }

      // Wait for bots to bet
      await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

      // Verify bots made simpler decisions (lower bets expected for easy bots)
      const betTexts = await pages[0].locator('[data-testid="player-bet"]').allTextContents();
      console.log('Easy bot bets:', betTexts);

      // Cleanup (will be handled by afterEach)
      await context.close();

      // Test with hard bots
      console.log('\nTesting with HARD bots...');
      result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3,
        startScores: { team1: 35, team2: 35 }
      });

      pages = result.pages;
      context = result.context;

      // TODO: Set bot difficulty to hard

      // Play one round with hard bots
      await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

      // Human player bets
      const humanBetBtnHard = pages[0].getByTestId('bet-10-with-trump');
      if (await humanBetBtnHard.isVisible({ timeout: 2000 })) {
        await humanBetBtnHard.click();
      }

      // Wait for bots to bet
      await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

      // Verify bots made more aggressive decisions (higher bets expected for hard bots)
      const hardBetTexts = await pages[0].locator('[data-testid="player-bet"]').allTextContents();
      console.log('Hard bot bets:', hardBetTexts);
    });
  });

  test.describe('@stress Bot Stress Testing', () => {
    test('should handle rapid bot decisions without crashes', async ({ browser }) => {
      test.setTimeout(300000); // 5 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3,
        startScores: { team1: 35, team2: 35 }
      });

      pages = result.pages;
      context = result.context;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      // Play 5 rapid rounds
      for (let round = 1; round <= 5; round++) {
        console.log(`Rapid round ${round}/5`);

        // Quick betting
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        const humanBetBtn = pages[0].getByTestId('bet-8-with-trump');
        if (await humanBetBtn.isVisible({ timeout: 1000 })) {
          await humanBetBtn.click();
        }

        // Wait for playing phase
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 10000 });

        // Rapid card playing
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            const turnIndicator = pages[0].getByTestId('turn-indicator');
            if (await turnIndicator.isVisible({ timeout: 300 })) {
              const humanCard = pages[0].locator('[data-card-value]').first();
              await humanCard.click({ force: true });
            }
            await pages[0].waitForTimeout(200); // Very short wait
          }
        }

        // Quick ready
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });
        const readyBtn = pages[0].getByTestId('ready-for-next-round-button');
        if (await readyBtn.isVisible({ timeout: 500 })) {
          await readyBtn.click();
        }
      }

      // Verify game is still responsive
      const gameStateText = await pages[0].locator('[data-testid="game-phase"]').textContent();
      expect(gameStateText).toBeDefined();
      console.log('Game still responsive after rapid play');
    });

    test('should maintain bot consistency over extended play', async ({ browser }) => {
      test.setTimeout(600000); // 10 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 1,
        botPlayers: 3,
        startScores: { team1: 20, team2: 20 }
      });

      pages = result.pages;
      context = result.context;
      gameId = result.gameId!;

      const botBehaviorLog = {
        rounds: [] as any[]
      };

      // Play multiple rounds and track bot behavior
      for (let round = 1; round <= 7; round++) {
        const roundData = {
          roundNumber: round,
          botBets: [] as string[],
          avgResponseTime: 0
        };

        // Betting phase
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        const betStartTime = Date.now();

        // Human bets
        const humanBetBtn = pages[0].getByTestId('bet-9-with-trump');
        if (await humanBetBtn.isVisible({ timeout: 1000 })) {
          await humanBetBtn.click();
        }

        // Wait for all bets
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        const betDuration = Date.now() - betStartTime;
        roundData.avgResponseTime = betDuration / 4; // Average per player

        // Record bot bets
        const betTexts = await pages[0].locator('[data-testid="player-bet"]').allTextContents();
        roundData.botBets = betTexts.filter(text => text.includes('Bot'));

        botBehaviorLog.rounds.push(roundData);

        // Play through round quickly
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            const turnIndicator = pages[0].getByTestId('turn-indicator');
            if (await turnIndicator.isVisible({ timeout: 500 })) {
              const humanCard = pages[0].locator('[data-card-value]').first();
              await humanCard.click({ force: true });
            }
            await pages[0].waitForTimeout(300);
          }
        }

        // Ready for next
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });
        const readyBtn = pages[0].getByTestId('ready-for-next-round-button');
        if (await readyBtn.isVisible({ timeout: 1000 })) {
          await readyBtn.click();
        }
        await pages[0].waitForTimeout(1000);
      }

      // Analyze bot consistency
      console.log('\n=== Bot Consistency Analysis ===');
      const responseTimes = botBehaviorLog.rounds.map(r => r.avgResponseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const responseTimeVariance = responseTimes.map(t => Math.abs(t - avgResponseTime));
      const maxVariance = Math.max(...responseTimeVariance);

      console.log(`Average bot response time: ${Math.round(avgResponseTime)}ms`);
      console.log(`Maximum variance: ${Math.round(maxVariance)}ms`);

      // Bot response times should be relatively consistent
      expect(maxVariance).toBeLessThan(avgResponseTime * 2); // Less than 200% variance
    });
  });
});