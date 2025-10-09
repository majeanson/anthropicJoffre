import { test, expect, Page } from '@playwright/test';

/**
 * Full Game Flow Test - Simulates a complete predetermined game
 * This test plays through an entire game from start to finish with predetermined actions
 */

test.describe('Full Game Flow', () => {
  let pages: Page[];
  let gameId: string;

  test('should play through a complete game with predetermined actions', async ({ browser }) => {
    pages = [];

    test.setTimeout(600000); // 10 minutes for full game

    // === PHASE 1: Lobby & Team Selection ===
    console.log('=== PHASE 1: Lobby & Team Selection ===');

    // Create single context with 4 pages (lighter on resources)
    const context = await browser.newContext();

    for (let i = 1; i <= 4; i++) {
      const page = await context.newPage();
      pages.push(page);

      await page.goto('http://localhost:5173');

      if (i === 1) {
        // Player 1 creates game
        await page.getByRole('button', { name: /create/i }).click();
        await page.fill('input[type="text"]', `Player ${i}`);
        await page.getByRole('button', { name: /create/i }).click();

        // Get game ID
        await page.waitForSelector('.font-mono', { timeout: 10000 });
        const gameIdElement = page.locator('.font-mono');
        gameId = (await gameIdElement.textContent()) || '';
        console.log(`Game created with ID: ${gameId}`);
      } else {
        // Other players join
        await page.getByRole('button', { name: /join/i }).first().click();
        await page.fill('input[placeholder*="game id" i]', gameId);
        await page.fill('input[placeholder*="name" i]', `Player ${i}`);
        await page.getByRole('button', { name: /^join$/i }).click();
        console.log(`Player ${i} joined`);
      }
    }

    // Wait for team selection
    await Promise.race(pages.map(page =>
      page.waitForSelector('text=/team selection/i', { timeout: 15000 })
    ));

    console.log('Teams auto-assigned, ready to start...');

    // Teams are auto-assigned alternating (P1 & P3 on Team 1, P2 & P4 on Team 2)
    // Wait a moment for all players to be on team selection screen
    await pages[0].waitForTimeout(1000);

    // Start game (wait for it to be enabled - requires 4 players with balanced teams)
    const startButton = pages[0].getByRole('button', { name: /start game/i });
    await expect(startButton).toBeEnabled({ timeout: 10000 });
    await startButton.click();
    console.log('Game started');

    // HACK: Set initial scores to 25-25 for faster testing to 41
    await pages[0].evaluate(() => {
      // @ts-ignore - accessing window socket for testing
      if (window.socket) {
        // @ts-ignore
        window.socket.emit('__test_set_scores', { team1: 25, team2: 25 });
      }
    });
    await pages[0].waitForTimeout(500);

    // === PHASE 2: Round 1 - Betting ===
    console.log('\n=== PHASE 2: Round 1 - Betting ===');

    // Wait for betting phase
    await Promise.race(pages.map(page =>
      page.waitForSelector('text=/betting phase/i', { timeout: 15000 })
    ));

    // Dealer is P2 (index 1) after rotation
    // Betting order: P3, P4, P1, P2 (dealer last)

    // P3 (index 2) bets 9
    console.log('P3 betting 9...');
    await pages[2].waitForSelector('button:has-text("9")', { timeout: 15000 });
    await pages[2].locator('button:has-text("9")').first().click();
    await pages[2].waitForTimeout(500);

    // P4 (index 3) bets 10
    console.log('P4 betting 10...');
    await pages[3].waitForSelector('button:has-text("10")', { timeout: 15000 });
    await pages[3].locator('button:has-text("10")').first().click();
    await pages[3].waitForTimeout(500);

    // P1 (index 0) skips
    console.log('P1 skipping...');
    await pages[0].waitForSelector('button:has-text("SKIP")', { timeout: 15000 });
    await pages[0].locator('button:has-text("SKIP")').click();
    await pages[0].waitForTimeout(500);

    // P2 (index 1, dealer) matches with 10
    console.log('P2 (dealer) matching with 10...');
    await pages[1].waitForSelector('button:has-text("10")', { timeout: 15000 });
    await pages[1].locator('button:has-text("10")').first().click();
    await pages[1].waitForTimeout(500);

    // === PHASE 3: Play rounds until a team reaches 41 points ===
    console.log('\n=== PHASE 3: Playing Rounds Until 41 Points ===');

    async function playRound() {
      console.log('  Playing 8 tricks...');

      for (let trick = 1; trick <= 8; trick++) {
        // Wait for cards to be available
        await pages[0].waitForSelector('[data-card-value]', { timeout: 15000 });

        // Each player plays a card
        for (let i = 0; i < 4; i++) {
          const cards = await pages[i].locator('[data-card-value]').all();

          for (const card of cards) {
            const disabled = await card.evaluate(el =>
              el.classList.contains('opacity-50')
            );

            if (!disabled) {
              await card.click({ force: true });
              await pages[0].waitForTimeout(600);
              break;
            }
          }
        }
        await pages[0].waitForTimeout(500);
      }
    }

    async function doBetting() {
      console.log('  Betting...');

      // Simple betting: each player bets 8 if they can, or skip
      for (let i = 0; i < 4; i++) {
        await pages[0].waitForTimeout(500);

        const page = pages[i];
        const skipBtn = page.locator('button:has-text("SKIP")');
        const bet8Btn = page.locator('button:has-text("8")').first();

        try {
          if (await skipBtn.isVisible({ timeout: 2000 })) {
            await skipBtn.click();
          } else if (await bet8Btn.isVisible({ timeout: 2000 })) {
            await bet8Btn.click();
          }
        } catch {}
      }

      await pages[0].waitForTimeout(1000);
    }

    async function getScores(): Promise<{ team1: number; team2: number }> {
      try {
        const text = await pages[0].textContent('body');
        if (!text) return { team1: 0, team2: 0 };

        // Look for patterns like "Team 1: 25" or "Team 1 Score: 25"
        const team1Match = text.match(/Team 1[:\s]+(\d+)/i);
        const team2Match = text.match(/Team 2[:\s]+(\d+)/i);

        return {
          team1: team1Match ? parseInt(team1Match[1]) : 0,
          team2: team2Match ? parseInt(team2Match[1]) : 0,
        };
      } catch {
        return { team1: 0, team2: 0 };
      }
    }

    async function isGameOver(): Promise<boolean> {
      const text = await pages[0].textContent('body');
      return text?.toLowerCase().includes('game over') || false;
    }

    let roundCount = 1;
    const maxRounds = 15;

    console.log('\n📊 Starting score tracking from 25-25...');
    let scores = await getScores();
    console.log(`Initial Scores - Team 1: ${scores.team1}, Team 2: ${scores.team2}`);

    while (roundCount <= maxRounds) {
      console.log(`\n--- Round ${roundCount} ---`);

      // Play the round
      await playRound();

      // Wait for scoring/next round
      await pages[0].waitForTimeout(4000);

      // Get updated scores
      const newScores = await getScores();
      const team1Change = newScores.team1 - scores.team1;
      const team2Change = newScores.team2 - scores.team2;

      console.log(`📊 Round ${roundCount} Results:`);
      console.log(`   Team 1: ${scores.team1} → ${newScores.team1} (${team1Change >= 0 ? '+' : ''}${team1Change})`);
      console.log(`   Team 2: ${scores.team2} → ${newScores.team2} (${team2Change >= 0 ? '+' : ''}${team2Change})`);

      scores = newScores;

      // Check game over
      if (await isGameOver()) {
        console.log('\n🏆 GAME OVER!');
        const winner = scores.team1 >= 41 ? 1 : 2;
        console.log(`   Winner: Team ${winner}`);
        console.log(`   Final Score - Team 1: ${scores.team1}, Team 2: ${scores.team2}`);
        break;
      }

      // Next round betting
      await doBetting();

      roundCount++;
    }

    console.log(`\n=== GAME COMPLETE - ${roundCount} rounds ===`);
    expect(await isGameOver()).toBeTruthy();

    // Cleanup
    for (const page of pages) {
      await page.close();
    }
  });
});
