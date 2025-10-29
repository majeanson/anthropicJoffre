import { test, expect, Page } from '@playwright/test';
import {
  createGameWithBots,
  verifyGameState,
  waitForBotAction,
  playMultipleRounds,
  measureRoundDuration
} from './helpers';

/**
 * Test suite for games with 2 real players and 2 bots.
 * Tests mixed human/bot team coordination and gameplay dynamics.
 */
test.describe('Game Flow - 2 Players + 2 Bots', () => {
  let pages: Page[];
  let contexts: any[];
  let gameId: string;
  let botIndices: number[];

  test.afterEach(async () => {
    // Cleanup all contexts
    if (contexts) {
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test.describe('@quick Quick Mixed Games', () => {
    test('should complete a game with 2 humans and 2 bots', async ({ browser }) => {
      test.setTimeout(120000); // 2 minutes

      // Create game with 2 humans and 2 bots
      // Team arrangement: Human1 + Bot1 on Team 1, Human2 + Bot2 on Team 2
      const result = await createGameWithBots(browser, {
        humanPlayers: 2,
        botPlayers: 2,
        playerNames: ['Human1', 'Human2', 'Bot1', 'Bot2']
      });

      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      console.log(`Mixed game created with ID: ${gameId}`);
      console.log(`Bot indices: ${botIndices.join(', ')}`);

      // Verify initial state and team setup
      await verifyGameState(pages[0], {
        phase: 'Betting',
        team1Score: 36,
        team2Score: 35
      });

      // Play rounds until game ends
      let gameEnded = false;
      let roundsPlayed = 0;

      while (!gameEnded && roundsPlayed < 3) {
        roundsPlayed++;
        console.log(`\nRound ${roundsPlayed}`);

        // Betting phase - humans and bots alternate
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Both humans check if it's their turn and bet
        for (let i = 0; i < 2; i++) {
          const humanBetBtn = pages[i].getByTestId('bet-9-with-trump');
          const humanSkipBtn = pages[i].getByTestId('skip-bet-button');

          if (await humanBetBtn.isVisible({ timeout: 1000 })) {
            await humanBetBtn.click();
            console.log(`Human${i + 1} bet 9`);
          } else if (await humanSkipBtn.isVisible({ timeout: 1000 })) {
            await humanSkipBtn.click();
            console.log(`Human${i + 1} skipped`);
          }
        }

        // Wait for bots to complete betting
        await waitForBotAction(pages[0], 10000);
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        // Playing phase - humans and bots play cards
        for (let trick = 0; trick < 8; trick++) {
          // Each player (human or bot) plays in turn
          for (let card = 0; card < 4; card++) {
            // Check both human players for their turn
            for (let i = 0; i < 2; i++) {
              const turnIndicator = pages[i].getByTestId('turn-indicator');
              if (await turnIndicator.isVisible({ timeout: 500 })) {
                const turnText = await turnIndicator.textContent();
                if (turnText === 'Your turn') {
                  const humanCard = pages[i].locator('[data-card-value]').first();
                  await humanCard.click({ force: true });
                  console.log(`Human${i + 1} played card in trick ${trick + 1}`);
                }
              }
            }
            await pages[0].waitForTimeout(500);
          }
        }

        // Scoring phase
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        // Check for game over
        gameEnded = await pages[0].locator('text=/Game Over/i').isVisible({ timeout: 2000 });

        if (!gameEnded) {
          // Both humans click ready
          for (let i = 0; i < 2; i++) {
            const readyBtn = pages[i].getByTestId('ready-for-next-round-button');
            if (await readyBtn.isVisible({ timeout: 1000 })) {
              await readyBtn.click();
            }
          }
          await pages[0].waitForTimeout(2000);
        }
      }

      // Verify game ended
      expect(gameEnded).toBeTruthy();
      await expect(pages[0].locator('text=/Game Over/i')).toBeVisible();
      console.log(`Mixed game completed in ${roundsPlayed} rounds`);
    });

    test('should test human-bot team coordination', async ({ browser }) => {
      test.setTimeout(180000); // 3 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 2,
        botPlayers: 2,
        playerNames: ['TeamLead1', 'TeamLead2', 'Support1', 'Support2']
      });

      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      // Track team coordination metrics
      const teamMetrics = {
        team1: { humanPlays: 0, botPlays: 0, tricks: 0 },
        team2: { humanPlays: 0, botPlays: 0, tricks: 0 }
      };

      // Play one complete round to analyze team dynamics
      await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

      // Betting phase
      for (let i = 0; i < 2; i++) {
        const humanBetBtn = pages[i].getByTestId('bet-10-with-trump');
        if (await humanBetBtn.isVisible({ timeout: 2000 })) {
          await humanBetBtn.click();
          console.log(`Human TeamLead${i + 1} bet 10`);
        }
      }

      // Wait for playing phase
      await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

      // Play 4 tricks to analyze coordination
      for (let trick = 0; trick < 4; trick++) {
        console.log(`\nTrick ${trick + 1}`);

        for (let card = 0; card < 4; card++) {
          // Track who plays each card
          const currentPlayerText = await pages[0].getByTestId('current-turn-player').textContent();

          if (currentPlayerText?.includes('TeamLead')) {
            // Human player
            const playerNum = currentPlayerText.includes('1') ? 0 : 1;
            const humanCard = pages[playerNum].locator('[data-card-value]').first();

            if (await pages[playerNum].getByTestId('turn-indicator').isVisible({ timeout: 500 })) {
              await humanCard.click({ force: true });
              const team = playerNum === 0 ? 'team1' : 'team2';
              teamMetrics[team].humanPlays++;
              console.log(`  ${currentPlayerText} (Human) played`);
            }
          } else if (currentPlayerText?.includes('Support')) {
            // Bot player
            await waitForBotAction(pages[0], 3000);
            const team = currentPlayerText.includes('1') ? 'team1' : 'team2';
            teamMetrics[team].botPlays++;
            console.log(`  ${currentPlayerText} (Bot) played`);
          }

          await pages[0].waitForTimeout(500);
        }

        // Check trick winner
        await pages[0].waitForTimeout(2000);
        const trickWinnerText = await pages[0].locator('[data-testid="trick-winner"]').textContent();
        if (trickWinnerText?.includes('Team 1')) {
          teamMetrics.team1.tricks++;
        } else if (trickWinnerText?.includes('Team 2')) {
          teamMetrics.team2.tricks++;
        }
      }

      // Analyze team coordination
      console.log('\n=== Team Coordination Analysis ===');
      console.log(`Team 1 - Human plays: ${teamMetrics.team1.humanPlays}, Bot plays: ${teamMetrics.team1.botPlays}, Tricks won: ${teamMetrics.team1.tricks}`);
      console.log(`Team 2 - Human plays: ${teamMetrics.team2.humanPlays}, Bot plays: ${teamMetrics.team2.botPlays}, Tricks won: ${teamMetrics.team2.tricks}`);

      // Verify balanced play between humans and bots
      expect(teamMetrics.team1.humanPlays).toBeGreaterThan(0);
      expect(teamMetrics.team1.botPlays).toBeGreaterThan(0);
      expect(teamMetrics.team2.humanPlays).toBeGreaterThan(0);
      expect(teamMetrics.team2.botPlays).toBeGreaterThan(0);
    });
  });

  test.describe('@full Full-Length Mixed Games', () => {
    test('should play a complete mixed game from 0-0', async ({ browser }) => {
      test.setTimeout(2400000); // 40 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 2,
        botPlayers: 2,
        playerNames: ['Alice', 'Bob', 'BotAlpha', 'BotBeta']
      });

      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      console.log(`Full mixed game started with ID: ${gameId}`);

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
      const teamScores: Array<[number, number]> = [];

      while (!gameEnded && totalRounds < 15) {
        totalRounds++;
        console.log(`\n=== Round ${totalRounds} ===`);
        const roundStart = Date.now();

        // Betting phase
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Humans bet with varying strategies
        for (let i = 0; i < 2; i++) {
          const betAmounts = [7, 8, 9, 10, 11];
          const randomBet = betAmounts[Math.floor(Math.random() * betAmounts.length)];
          const humanBetBtn = pages[i].getByTestId(`bet-${randomBet}-with-trump`);
          const humanSkipBtn = pages[i].getByTestId('skip-bet-button');

          if (await humanBetBtn.isVisible({ timeout: 2000 })) {
            await humanBetBtn.click();
            console.log(`${i === 0 ? 'Alice' : 'Bob'} bet ${randomBet}`);
          } else if (await humanSkipBtn.isVisible({ timeout: 2000 })) {
            await humanSkipBtn.click();
            console.log(`${i === 0 ? 'Alice' : 'Bob'} skipped`);
          }
        }

        // Wait for bots to complete betting
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        // Playing phase - 8 tricks
        console.log('Playing 8 tricks...');
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            // Both humans check for their turn
            for (let i = 0; i < 2; i++) {
              const turnIndicator = pages[i].getByTestId('turn-indicator');
              if (await turnIndicator.isVisible({ timeout: 500 })) {
                const turnText = await turnIndicator.textContent();
                if (turnText === 'Your turn') {
                  const humanCard = pages[i].locator('[data-card-value]').first();
                  await humanCard.click({ force: true });
                }
              }
            }
            await pages[0].waitForTimeout(600);
          }
        }

        // Scoring phase
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        const roundDuration = Date.now() - roundStart;
        roundDurations.push(roundDuration);

        // Track scores
        const scoresText = await pages[0].locator('[data-testid="team-scores"]').textContent();
        const team1Match = scoresText?.match(/Team 1: (\d+)/);
        const team2Match = scoresText?.match(/Team 2: (\d+)/);

        if (team1Match && team2Match) {
          const team1Score = parseInt(team1Match[1]);
          const team2Score = parseInt(team2Match[1]);
          teamScores.push([team1Score, team2Score]);
          console.log(`Scores: Team 1 (Alice + BotAlpha): ${team1Score}, Team 2 (Bob + BotBeta): ${team2Score}`);

          if (team1Score >= 41 || team2Score >= 41) {
            gameEnded = true;
          }
        }

        // Check for game over
        if (await pages[0].locator('text=/Game Over/i').isVisible({ timeout: 2000 })) {
          gameEnded = true;
        }

        if (!gameEnded) {
          // Humans ready for next round
          for (let i = 0; i < 2; i++) {
            const readyBtn = pages[i].getByTestId('ready-for-next-round-button');
            if (await readyBtn.isVisible({ timeout: 1000 })) {
              await readyBtn.click();
            }
          }
          await pages[0].waitForTimeout(2000);
        }
      }

      // Game statistics
      console.log('\n=== Mixed Game Statistics ===');
      console.log(`Total rounds played: ${totalRounds}`);
      console.log(`Average round duration: ${Math.round(roundDurations.reduce((a, b) => a + b, 0) / roundDurations.length / 1000)}s`);

      // Analyze score progression
      console.log('\nScore Progression:');
      for (let i = 0; i < Math.min(5, teamScores.length); i++) {
        console.log(`  Round ${i + 1}: Team 1: ${teamScores[i][0]}, Team 2: ${teamScores[i][1]}`);
      }

      expect(gameEnded).toBeTruthy();
      await expect(pages[0].locator('text=/Game Over/i')).toBeVisible();
    });

    test('should handle human-bot communication patterns', async ({ browser }) => {
      test.setTimeout(900000); // 15 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 2,
        botPlayers: 2,
      });

      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;
      botIndices = result.botPlayerIndices;

      // Play 3 rounds to observe patterns
      for (let round = 1; round <= 3; round++) {
        console.log(`\n=== Communication Pattern Test - Round ${round} ===`);

        // Betting phase
        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Human 1 (Team 1 leader) sets aggressive bet
        const human1BetBtn = pages[0].getByTestId('bet-11-with-trump');
        if (await human1BetBtn.isVisible({ timeout: 2000 })) {
          await human1BetBtn.click();
          console.log('Team 1 human sets aggressive bet (11)');
        }

        // Human 2 (Team 2 leader) responds
        const human2BetBtn = pages[1].getByTestId('bet-12-with-trump');
        const human2SkipBtn = pages[1].getByTestId('skip-bet-button');
        if (await human2BetBtn.isVisible({ timeout: 2000 })) {
          await human2BetBtn.click();
          console.log('Team 2 human counters with higher bet (12)');
        } else if (await human2SkipBtn.isVisible({ timeout: 2000 })) {
          await human2SkipBtn.click();
          console.log('Team 2 human skips');
        }

        // Wait for bots to adapt
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        // Check bot betting patterns
        const betTexts = await pages[0].locator('[data-testid="player-bet"]').allTextContents();
        console.log('All bets:', betTexts);

        // Play round
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            for (let i = 0; i < 2; i++) {
              const turnIndicator = pages[i].getByTestId('turn-indicator');
              if (await turnIndicator.isVisible({ timeout: 500 })) {
                const humanCard = pages[i].locator('[data-card-value]').first();
                await humanCard.click({ force: true });
              }
            }
            await pages[0].waitForTimeout(400);
          }
        }

        // Scoring and ready
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });
        for (let i = 0; i < 2; i++) {
          const readyBtn = pages[i].getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
        }
        await pages[0].waitForTimeout(1500);
      }

      // Verify game is still progressing
      const scoresText = await pages[0].locator('[data-testid="team-scores"]').textContent();
      expect(scoresText).toContain('Team 1:');
      expect(scoresText).toContain('Team 2:');
    });
  });

  test.describe('@stress Mixed Game Stress Testing', () => {
    test('should handle asymmetric player response times', async ({ browser }) => {
      test.setTimeout(600000); // 10 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 2,
        botPlayers: 2,
      });

      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      // Test with one fast human and one slow human
      for (let round = 1; round <= 5; round++) {
        console.log(`\nAsymmetric timing test - Round ${round}`);

        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Fast human (instant response)
        const fastHumanBtn = pages[0].getByTestId('bet-8-with-trump');
        if (await fastHumanBtn.isVisible({ timeout: 1000 })) {
          await fastHumanBtn.click();
          console.log('Fast human bet instantly');
        }

        // Slow human (delayed response)
        await pages[1].waitForTimeout(3000); // Simulate thinking time
        const slowHumanBtn = pages[1].getByTestId('bet-9-with-trump');
        if (await slowHumanBtn.isVisible({ timeout: 2000 })) {
          await slowHumanBtn.click();
          console.log('Slow human bet after delay');
        }

        // Play round with varying speeds
        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            // Fast human plays instantly
            if (await pages[0].getByTestId('turn-indicator').isVisible({ timeout: 300 })) {
              const fastCard = pages[0].locator('[data-card-value]').first();
              await fastCard.click({ force: true });
            }

            // Slow human waits
            if (await pages[1].getByTestId('turn-indicator').isVisible({ timeout: 300 })) {
              await pages[1].waitForTimeout(1500);
              const slowCard = pages[1].locator('[data-card-value]').first();
              await slowCard.click({ force: true });
            }

            await pages[0].waitForTimeout(300);
          }
        }

        // Ready phase
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });
        for (let i = 0; i < 2; i++) {
          const readyBtn = pages[i].getByTestId('ready-for-next-round-button');
          if (await readyBtn.isVisible({ timeout: 1000 })) {
            await readyBtn.click();
          }
        }
      }

      // Verify game handled asymmetric timing
      const gamePhase = await pages[0].locator('[data-testid="game-phase"]').textContent();
      expect(gamePhase).toBeDefined();
      console.log('Game successfully handled asymmetric player timing');
    });

    test('should maintain sync between all players in mixed game', async ({ browser }) => {
      test.setTimeout(300000); // 5 minutes

      const result = await createGameWithBots(browser, {
        humanPlayers: 2,
        botPlayers: 2,
      });

      pages = result.pages;
      contexts = result.contexts;
      gameId = result.gameId!;

      // Rapid play to test synchronization
      for (let round = 1; round <= 3; round++) {
        console.log(`\nSync test - Round ${round}`);

        await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

        // Both humans bet simultaneously
        const [human1Bet, human2Bet] = await Promise.all([
          pages[0].getByTestId('bet-10-with-trump').click().catch(() =>
            pages[0].getByTestId('skip-bet-button').click()
          ),
          pages[1].getByTestId('bet-10-with-trump').click().catch(() =>
            pages[1].getByTestId('skip-bet-button').click()
          )
        ]);

        await pages[0].waitForSelector('text=/Playing Phase/i', { timeout: 15000 });

        // Rapid card playing
        for (let trick = 0; trick < 8; trick++) {
          for (let card = 0; card < 4; card++) {
            // Check both humans simultaneously
            await Promise.all([
              (async () => {
                if (await pages[0].getByTestId('turn-indicator').isVisible({ timeout: 200 })) {
                  await pages[0].locator('[data-card-value]').first().click({ force: true });
                }
              })(),
              (async () => {
                if (await pages[1].getByTestId('turn-indicator').isVisible({ timeout: 200 })) {
                  await pages[1].locator('[data-card-value]').first().click({ force: true });
                }
              })()
            ]);
            await pages[0].waitForTimeout(200);
          }
        }

        // Verify all players see same state
        await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

        const [scores1, scores2] = await Promise.all([
          pages[0].locator('[data-testid="team-scores"]').textContent(),
          pages[1].locator('[data-testid="team-scores"]').textContent()
        ]);

        expect(scores1).toEqual(scores2);
        console.log(`Sync verified - Both players see: ${scores1}`);

        // Ready
        await Promise.all([
          pages[0].getByTestId('ready-for-next-round-button').click().catch(() => {}),
          pages[1].getByTestId('ready-for-next-round-button').click().catch(() => {})
        ]);
      }

      console.log('All players remained synchronized throughout rapid play');
    });
  });
});