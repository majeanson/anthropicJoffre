import { Page, expect } from '@playwright/test';

/**
 * Creates a game with 4 players and advances to the betting phase.
 * Players are assigned to teams 1-2-1-2 by default.
 * Player 2 will be the first dealer after rotation.
 *
 * Uses single-browser context with sessionStorage isolation (multi-tab support).
 * Each page acts as an independent player tab.
 *
 * @returns Object with browser context (singular), page instances, and game ID
 */
export async function createGameWith4Players(browser: any) {
  // Single browser context - sessionStorage provides tab isolation
  const context = await browser.newContext();
  const pages: Page[] = [];
  let gameId: string | null = null;

  // Create 4 pages (tabs) in the same context
  for (let i = 1; i <= 4; i++) {
    const page = await context.newPage();
    await page.goto('/');

    if (i === 1) {
      // Use test IDs for reliable selectors
      await page.getByTestId('create-game-button').click();
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-create-button').click();

      await page.getByTestId('game-id').waitFor({ timeout: 10000 });
      gameId = await page.getByTestId('game-id').textContent();
    } else {
      // Use test IDs for reliable selectors
      await page.getByTestId('join-game-button').click();
      await page.getByTestId('game-id-input').fill(gameId!);
      await page.getByTestId('player-name-input').fill(`Player ${i}`);
      await page.getByTestId('submit-join-button').click();
    }

    pages.push(page);
  }

  // Wait for team selection, then start game using test ID
  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });
  await pages[0].getByTestId('start-game-button').click();

  // Wait for betting phase to begin
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  return { context, pages, gameId };
}

/**
 * Places bets for all 4 players in the correct order and advances to playing phase.
 * Betting order: Player 3, 4, 1, 2 (Player 2 is dealer, bets last).
 *
 * @param pages - Array of page instances for all 4 players
 * @param bets - Bet amounts in PLAYER order [P1, P2, P3, P4]. Default: [9, 9, 7, 8]
 * @param withoutTrump - Whether each player bets without trump, in PLAYER order
 */
export async function placeAllBets(pages: Page[], bets: number[] = [9, 9, 7, 8], withoutTrump: boolean[] = [false, false, false, false]) {
  const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2 (betting order)

  for (let i = 0; i < bettingOrder.length; i++) {
    const pageIndex = bettingOrder[i];
    const page = pages[pageIndex];
    const betAmount = bets[pageIndex];
    const noTrump = withoutTrump[pageIndex];

    // Wait for bet amount button to appear (means it's this player's turn)
    const amountButton = page.getByRole('button', { name: String(betAmount), exact: true });
    await amountButton.waitFor({ state: 'visible', timeout: 15000 });
    await amountButton.click();

    // If without trump, click the "Without Trump" radio option
    if (noTrump) {
      await page.getByText('Without Trump (2x multiplier)').click();
    }

    // Click the Place Bet button
    const placeBetPattern = noTrump
      ? new RegExp(`Place Bet: ${betAmount} \\(No Trump\\)`)
      : new RegExp(`Place Bet: ${betAmount}`);
    await page.getByRole('button', { name: placeBetPattern }).click();

    // Wait for bet to register
    if (i < bettingOrder.length - 1) {
      await pages[0].waitForTimeout(500);
    }
  }

  // Wait for playing phase - check for cards to be visible
  await pages[0].locator('[data-card-value]').first().waitFor({ timeout: 10000 });
}

/**
 * Plays a card from the current player's hand.
 *
 * @param page - The page instance of the player
 * @param cardIndex - Index of the card to play (default: 0 for first card)
 */
export async function playCard(page: Page, cardIndex: number = 0) {
  const cards = page.locator('[data-card-value]');
  const card = cards.nth(cardIndex);
  await card.click();
}

/**
 * Finds which player currently has their turn.
 *
 * @param pages - Array of all player page instances
 * @returns Index of the player with current turn, or -1 if not found
 */
export async function findCurrentPlayerIndex(pages: Page[]): Promise<number> {
  // Try multiple times with increasing waits for multi-browser sync
  for (let attempt = 0; attempt < 3; attempt++) {
    // Check pages sequentially to avoid "Target crashed" errors
    for (let i = 0; i < pages.length; i++) {
      try {
        // First try the turn-indicator (shows during active play with countdown)
        const turnIndicator = pages[i].getByTestId('turn-indicator');
        const hasCountdown = await turnIndicator.isVisible({ timeout: attempt === 0 ? 500 : 2000 });
        if (hasCountdown) {
          const text = await turnIndicator.textContent();
          if (text === 'Your turn') {
            return i;
          }
        }
      } catch {
        // Turn indicator might not be visible yet
      }

      // Also check if current-turn-player shows this player's name
      // (this shows before the countdown/turn-indicator appears)
      try {
        const playerName = `Player ${i + 1}`;
        const currentTurnText = await pages[i].getByTestId('current-turn-player').textContent();
        if (currentTurnText && currentTurnText.includes(playerName)) {
          return i;
        }
      } catch {
        // Page might not have current-turn-player element yet
      }
    }

    // If not found, wait before retrying
    if (attempt < 2) {
      await pages[0].waitForTimeout(1000);
    }
  }

  return -1;
}

/**
 * Plays one complete trick (4 cards, one from each player).
 * Automatically finds the current player for each card and plays it.
 *
 * @param pages - Array of all player page instances
 */
export async function playFullTrick(pages: Page[]) {
  for (let i = 0; i < 4; i++) {
    await pages[0].waitForTimeout(200);

    // Find current player using the helper function
    const pageWithTurn = await findCurrentPlayerIndex(pages);

    if (pageWithTurn === -1) {
      throw new Error(`Could not find current player at card ${i + 1} of trick`);
    }

    const currentPage = pages[pageWithTurn];
    const card = currentPage.locator('[data-card-value]').first();
    await card.click({ force: true });

    await pages[0].waitForTimeout(300);
  }

  // Wait for trick to resolve and next turn to start
  await pages[0].waitForTimeout(3500); // Wait for trick resolution
}

/**
 * Plays a complete round (8 tricks) and waits for scoring phase.
 *
 * @param pages - Array of all player page instances
 */
export async function playFullRound(pages: Page[]) {
  for (let trick = 0; trick < 8; trick++) {
    await playFullTrick(pages);
  }

  // Wait for scoring phase to appear
  await pages[0].getByTestId('scoring-phase-heading').waitFor({ timeout: 10000 });
}

// ===== NEW BOT AND COMPREHENSIVE TESTING UTILITIES =====

export interface GameConfig {
  humanPlayers: number;
  botPlayers: number;
  startScores?: { team1: number; team2: number };
  playerNames?: string[];
}

/**
 * Creates a game with a mix of human players and bots.
 *
 * Uses single-browser context with sessionStorage isolation (multi-tab support).
 *
 * @param browser - Browser instance
 * @param config - Configuration for human and bot players
 * @returns Object with context (singular), pages, gameId, and bot information
 */
export async function createGameWithBots(browser: any, config: GameConfig) {
  const totalPlayers = config.humanPlayers + config.botPlayers;
  // Single browser context - sessionStorage provides tab isolation
  const context = await browser.newContext();
  const pages: Page[] = [];
  const botPlayerIndices: number[] = [];
  let gameId: string | null = null;

  // Create human players first
  for (let i = 0; i < config.humanPlayers; i++) {
    const page = await context.newPage();
    await page.goto('/');

    const playerName = config.playerNames?.[i] || `Player ${i + 1}`;

    if (i === 0) {
      // First player creates the game
      await page.getByTestId('create-game-button').click();
      await page.getByTestId('player-name-input').fill(playerName);
      await page.getByTestId('submit-create-button').click();

      await page.getByTestId('game-id').waitFor({ timeout: 10000 });
      gameId = await page.getByTestId('game-id').textContent();
    } else {
      // Other human players join
      await page.getByTestId('join-game-button').click();
      await page.getByTestId('game-id-input').fill(gameId!);
      await page.getByTestId('player-name-input').fill(playerName);
      await page.getByTestId('submit-join-button').click();
    }

    pages.push(page);
  }

  // Create bot players
  for (let i = config.humanPlayers; i < totalPlayers; i++) {
    const page = await context.newPage();
    await page.goto('/');

    const botName = config.playerNames?.[i] || `Bot ${i - config.humanPlayers + 1}`;

    await page.getByTestId('join-game-button').click();
    await page.getByTestId('game-id-input').fill(gameId!);
    await page.getByTestId('player-name-input').fill(botName);
    await page.getByTestId('submit-join-button').click();

    pages.push(page);
    botPlayerIndices.push(i);
  }

  // Wait for team selection
  await pages[0].waitForSelector('text=Team Selection', { timeout: 10000 });

  // Set initial scores if provided
  if (config.startScores) {
    await pages[0].evaluate((scores) => {
      // @ts-ignore
      if (window.socket) {
        // @ts-ignore
        window.socket.emit('__test_set_scores', scores);
      }
    }, config.startScores);
    await pages[0].waitForTimeout(500);
  }

  // Start the game first
  await pages[0].getByTestId('start-game-button').click();

  // Wait for betting phase
  await pages[0].waitForSelector('text=Betting Phase', { timeout: 10000 });

  // Small delay to ensure UI is ready
  await pages[0].waitForTimeout(1000);

  // Enable autoplay for bot players AFTER game starts (when button is visible)
  for (const botIndex of botPlayerIndices) {
    await enableAutoplayForPlayer(pages[botIndex]);
  }

  return { context, pages, gameId, botPlayerIndices };
}

/**
 * Enables autoplay mode for a specific player.
 *
 * @param page - Page instance of the player
 */
export async function enableAutoplayForPlayer(page: Page) {
  try {
    // First check if we're in a phase where autoplay button exists
    const inBettingPhase = await page.locator('text=/Betting Phase/i').isVisible({ timeout: 1000 }).catch(() => false);
    const inPlayingPhase = await page.locator('text=/Playing Phase|Trump/i').isVisible({ timeout: 1000 }).catch(() => false);

    if (!inBettingPhase && !inPlayingPhase) {
      console.log('Not in betting or playing phase - autoplay button not available yet');
      return false;
    }

    // Try multiple selectors for the autoplay button
    const selectors = [
      'button:has-text("Manual")',
      'button:has-text("Auto")',
      '[aria-label*="autoplay" i]',
      'button[title*="Autoplay" i]',
      'text=/Manual|Auto/i'
    ];

    let autoplayButton = null;
    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 500 })) {
          autoplayButton = button;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!autoplayButton) {
      console.log('Autoplay button not found with any selector');
      return false;
    }

    // Check current state and toggle if needed
    const buttonText = await autoplayButton.textContent();
    if (buttonText?.toLowerCase().includes('manual')) {
      await autoplayButton.click();
      await page.waitForTimeout(300);
      console.log('Autoplay enabled successfully');
      return true;
    } else if (buttonText?.toLowerCase().includes('auto')) {
      console.log('Autoplay already enabled');
      return true;
    }
  } catch (error) {
    console.error('Error enabling autoplay:', error);
    return false;
  }
}

/**
 * Waits for a bot to make its decision.
 *
 * @param page - Page instance to monitor
 * @param timeout - Maximum time to wait (default: 5000ms)
 */
export async function waitForBotAction(page: Page, timeout: number = 5000) {
  // Wait for either "Waiting for other players" or a state change
  // Use try-catch to prevent timeout errors from failing the test
  try {
    await page.waitForSelector('text=/Waiting for other players/i', { timeout });
  } catch (error) {
    // Timeout is acceptable - bot may have already acted
    // Just wait a bit for UI to update
    await page.waitForTimeout(1000);
  }
}

/**
 * Plays multiple complete rounds.
 *
 * @param pages - Array of all player page instances
 * @param roundCount - Number of rounds to play
 * @param botIndices - Indices of bot players (will act automatically)
 */
export async function playMultipleRounds(pages: Page[], roundCount: number, botIndices: number[] = []) {
  for (let round = 0; round < roundCount; round++) {
    console.log(`Playing round ${round + 1}/${roundCount}`);

    // Wait for betting phase
    await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 15000 });

    // Betting phase - bots will bet automatically, humans need to bet
    for (let i = 0; i < 4; i++) {
      const currentPlayerIndex = await findCurrentPlayerIndex(pages);

      if (currentPlayerIndex !== -1 && !botIndices.includes(currentPlayerIndex)) {
        // Human player needs to bet
        const page = pages[currentPlayerIndex];
        const skipBtn = page.getByTestId('skip-bet-button');
        const bet8Btn = page.getByTestId('bet-8-with-trump');

        // Try to bet 8, otherwise skip
        if (await bet8Btn.isVisible({ timeout: 1000 })) {
          await bet8Btn.click();
        } else if (await skipBtn.isVisible({ timeout: 1000 })) {
          await skipBtn.click();
        }
      } else {
        // Bot will bet automatically
        await waitForBotAction(pages[0]);
      }

      await pages[0].waitForTimeout(500);
    }

    // Playing phase - play 8 tricks
    await playFullRound(pages);

    // Wait for scoring phase and click ready
    await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 10000 });

    // All players click ready (bots will auto-ready)
    for (let i = 0; i < pages.length; i++) {
      if (!botIndices.includes(i)) {
        const readyBtn = pages[i].getByTestId('ready-for-next-round-button');
        if (await readyBtn.isVisible({ timeout: 1000 })) {
          await readyBtn.click();
        }
      }
    }

    await pages[0].waitForTimeout(1000);
  }
}

/**
 * Verifies the current game state matches expectations.
 *
 * @param page - Page instance to check
 * @param expectedState - Expected state values
 */
export async function verifyGameState(page: Page, expectedState: {
  phase?: string;
  team1Score?: number;
  team2Score?: number;
  roundNumber?: number;
}) {
  if (expectedState.phase) {
    const phaseText = await page.locator('text=/' + expectedState.phase + '/i').first();
    await expect(phaseText).toBeVisible({ timeout: 10000 });
  }

  if (expectedState.team1Score !== undefined || expectedState.team2Score !== undefined) {
    // Wait for team scores element to be visible first
    const scoresElement = page.locator('[data-testid="team-scores"]');
    await scoresElement.waitFor({ state: 'visible', timeout: 10000 });

    // Then get the text content
    const scores = await scoresElement.textContent();
    if (expectedState.team1Score !== undefined) {
      expect(scores).toContain(`Team 1: ${expectedState.team1Score}`);
    }
    if (expectedState.team2Score !== undefined) {
      expect(scores).toContain(`Team 2: ${expectedState.team2Score}`);
    }
  }

  if (expectedState.roundNumber !== undefined) {
    const roundText = await page.locator('text=/Round ' + expectedState.roundNumber + '/i').first();
    await expect(roundText).toBeVisible({ timeout: 10000 });
  }
}

/**
 * Measures the duration of a round from betting to scoring.
 *
 * @param pages - Array of all player page instances
 * @returns Duration in milliseconds
 */
export async function measureRoundDuration(pages: Page[]): Promise<number> {
  const startTime = Date.now();

  // Wait for betting phase to start
  await pages[0].waitForSelector('text=/Betting Phase/i', { timeout: 10000 });

  // Play through the round (assuming bots or automated play)
  await pages[0].waitForSelector('text=/Scoring Phase/i', { timeout: 300000 });

  const endTime = Date.now();
  return endTime - startTime;
}

/**
 * Verifies score progression over multiple rounds.
 *
 * @param page - Page instance to monitor
 * @param expectedProgression - Array of expected score pairs [team1, team2]
 */
export async function verifyScoreProgression(page: Page, expectedProgression: Array<[number, number]>) {
  for (const [expectedTeam1, expectedTeam2] of expectedProgression) {
    await verifyGameState(page, {
      team1Score: expectedTeam1,
      team2Score: expectedTeam2
    });
  }
}

/**
 * Plays a complete game from start to finish.
 *
 * @param pages - Array of all player page instances
 * @param botIndices - Indices of bot players
 * @param targetScore - Score to reach for game end (default: 41)
 */
export async function playCompleteGame(pages: Page[], botIndices: number[] = [], targetScore: number = 41) {
  let gameEnded = false;
  let roundCount = 0;
  const maxRounds = 20; // Safety limit

  while (!gameEnded && roundCount < maxRounds) {
    roundCount++;
    console.log(`Starting round ${roundCount}`);

    await playMultipleRounds(pages, 1, botIndices);

    // Check if game has ended
    const gameOverElement = pages[0].locator('text=/Game Over/i');
    gameEnded = await gameOverElement.isVisible({ timeout: 1000 });

    if (!gameEnded) {
      // Check scores
      const scoresText = await pages[0].locator('[data-testid="team-scores"]').textContent();
      const team1Match = scoresText?.match(/Team 1: (\d+)/);
      const team2Match = scoresText?.match(/Team 2: (\d+)/);

      if (team1Match && team2Match) {
        const team1Score = parseInt(team1Match[1]);
        const team2Score = parseInt(team2Match[1]);

        if (team1Score >= targetScore || team2Score >= targetScore) {
          console.log(`Game should end - Team 1: ${team1Score}, Team 2: ${team2Score}`);
          gameEnded = true;
        }
      }
    }
  }

  return { roundCount, gameEnded };
}

/**
 * Sets game state via REST API (more reliable than UI interactions).
 * Use this instead of TestPanel UI for manipulating game state in tests.
 *
 * @param page - Page instance (used to get gameId from URL context)
 * @param gameId - Game ID to manipulate
 * @param options - State to set: teamScores { team1, team2 } and/or phase
 * @returns API response with success status and updated state
 */
export async function setGameStateViaAPI(
  page: Page,
  gameId: string,
  options: {
    teamScores?: { team1: number; team2: number };
    phase?: string;
  }
) {
  const response = await page.evaluate(
    async ({ gameId, teamScores, phase }) => {
      const res = await fetch('http://localhost:3000/api/__test/set-game-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          teamScores,
          phase,
        }),
      });

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    },
    { gameId, ...options }
  );

  console.log(`TEST API: Set game state for ${gameId}:`, response);

  // Give a moment for Socket.io events to propagate
  await page.waitForTimeout(500);

  return response;
}

/**
 * Creates a game using Quick Play (single player + 3 server-side bots).
 * More stable than multi-page approach for long-running tests.
 *
 * Returns same interface as createGameWith4Players for backward compatibility,
 * but only pages[0] is a real page (others are references to it).
 *
 * @param browser - Playwright browser instance
 * @returns Object with context, pages array (all point to same page), and gameId
 */
export async function createQuickPlayGame(browser: any) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/');

  // Use Quick Play to create game with 3 server-side bots
  await page.getByTestId('quick-play-button').click();
  await page.getByTestId('game-id').waitFor({ state: 'visible', timeout: 10000 });
  const gameId = (await page.getByTestId('game-id').textContent())!;

  // Wait for bots to join (3 bots)
  await page.waitForTimeout(2000);

  // Start the game
  await page.getByTestId('start-game-button').click();

  // Wait for betting phase
  await page.waitForSelector('text=/Betting Phase/i', { state: 'visible', timeout: 10000 });

  // For backward compatibility, return array with same page 4 times
  // Tests that iterate pages[0-3] will still work, just accessing same page
  const pages = [page, page, page, page];

  return { context, pages, gameId };
}

/**
 * Places bets using autoplay for all players except the human.
 * Simplifies betting phase for single-player + bots tests.
 *
 * @param page - The page instance of the human player
 * @param betAmount - Bet amount for human player (default: 8)
 */
export async function placeAllBetsWithAutoplay(page: Page, betAmount: number = 8) {
  // Wait for betting controls to be available
  await page.waitForSelector('text=/Select Bet Amount/i', { timeout: 10000 });

  // Place human player's bet
  const betButton = page.getByRole('button', { name: String(betAmount), exact: true });
  await betButton.waitFor({ state: 'visible', timeout: 10000 });
  await betButton.click();

  const placeBetButton = page.getByRole('button', { name: new RegExp(`Place Bet: ${betAmount}`) });
  await placeBetButton.waitFor({ state: 'visible', timeout: 5000 });
  await placeBetButton.click();

  // Wait for bots to complete betting
  await waitForBotAction(page, 15000);

  // Wait for playing phase - check for cards to be visible
  await page.locator('[data-card-value]').first().waitFor({ timeout: 10000 });
}

/**
 * Plays a complete game using autoplay until game over.
 * Useful for testing game completion, stats recording, etc.
 *
 * @param page - Page instance of the player
 * @param maxRounds - Maximum rounds to wait (default: 20)
 * @returns True if game completed, false if timeout
 */
export async function playCompleteGameWithAutoplay(page: Page, maxRounds: number = 20): Promise<boolean> {
  // Enable autoplay for human player
  await enableAutoplayForPlayer(page);

  // Wait for game completion or max rounds
  for (let i = 0; i < maxRounds; i++) {
    // Check if game is over
    const isGameOver = await page.locator('text=/Game Over/i').isVisible({ timeout: 2000 }).catch(() => false);
    if (isGameOver) {
      console.log(`Game completed after ${i + 1} rounds`);
      return true;
    }

    // Wait for round to progress
    await page.waitForTimeout(5000);
  }

  console.log(`Game still running after ${maxRounds} rounds`);
  return false;
}
