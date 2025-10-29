import { Page, expect } from '@playwright/test';

/**
 * Enhanced test helpers with improved stability features:
 * - Retry logic for network operations
 * - Better error handling and recovery
 * - Configurable timeouts
 * - Race condition prevention
 */

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  timeout?: number;
  errorMessage?: string;
}

interface GameConfig {
  humanPlayers: number;
  botPlayers: number;
  playerNames?: string[];
  startScores?: { team1: number; team2: number };
  enableAutoplay?: boolean[];
}

// Default timeouts (can be overridden via environment variables)
const TIMEOUTS = {
  SHORT: parseInt(process.env.TIMEOUT_SHORT || '5000'),
  MEDIUM: parseInt(process.env.TIMEOUT_MEDIUM || '10000'),
  LONG: parseInt(process.env.TIMEOUT_LONG || '30000'),
  GAME_CREATE: parseInt(process.env.TIMEOUT_GAME_CREATE || '15000'),
  BET_PLACE: parseInt(process.env.TIMEOUT_BET_PLACE || '20000'),
};

/**
 * Retry wrapper for flaky operations
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    errorMessage = 'Operation failed'
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${error}`);

      if (attempt < maxAttempts) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`${errorMessage} after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Safe navigation with retry logic
 */
async function safeGoto(page: Page, url: string, options: RetryOptions = {}): Promise<void> {
  await retryOperation(
    async () => {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options.timeout || TIMEOUTS.MEDIUM
      });
    },
    { ...options, errorMessage: `Failed to navigate to ${url}` }
  );
}

/**
 * Wait for element with better error reporting
 */
async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' } = {}
): Promise<void> {
  const { timeout = TIMEOUTS.MEDIUM, state = 'visible' } = options;

  try {
    await page.locator(selector).waitFor({ state, timeout });
  } catch (error) {
    // Take screenshot on failure for debugging
    const timestamp = Date.now();
    await page.screenshot({
      path: `e2e/test-results/timeout-${timestamp}.png`,
      fullPage: true
    });

    throw new Error(
      `Timeout waiting for element: ${selector}\n` +
      `State: ${state}, Timeout: ${timeout}ms\n` +
      `Screenshot saved: timeout-${timestamp}.png\n` +
      `URL: ${page.url()}`
    );
  }
}

/**
 * Enhanced game creation with stability improvements
 */
export async function createGameWith4PlayersEnhanced(browser: any) {
  const context = await browser.newContext();
  const pages: Page[] = [];
  let gameId: string | null = null;

  try {
    // Create 4 players with retry logic
    for (let i = 1; i <= 4; i++) {
      const page = await context.newPage();

      // Setup error listeners
      page.on('pageerror', error => {
        console.error(`Page error on Player ${i}:`, error);
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.error(`Console error on Player ${i}:`, msg.text());
        }
      });

      // Navigate with retry
      await safeGoto(page, '/', { maxAttempts: 3 });

      if (i === 1) {
        // Create game with enhanced error handling
        await retryOperation(async () => {
          await page.getByTestId('create-game-button').click();
          await page.getByTestId('player-name-input').fill(`Player ${i}`);
          await page.getByTestId('submit-create-button').click();

          // Wait for game ID with timeout
          await page.getByTestId('game-id').waitFor({
            timeout: TIMEOUTS.GAME_CREATE,
            state: 'visible'
          });

          gameId = await page.getByTestId('game-id').textContent();
          if (!gameId) {
            throw new Error('Game ID is null or empty');
          }
        }, {
          maxAttempts: 2,
          delay: 2000,
          errorMessage: 'Failed to create game'
        });
      } else {
        // Join game with retry logic
        await retryOperation(async () => {
          if (!gameId) {
            throw new Error('No game ID available for joining');
          }

          await page.getByTestId('join-game-button').click();
          await page.getByTestId('game-id-input').fill(gameId);
          await page.getByTestId('player-name-input').fill(`Player ${i}`);
          await page.getByTestId('submit-join-button').click();

          // Verify join was successful
          await waitForElement(page, 'text=Team Selection', {
            timeout: TIMEOUTS.MEDIUM
          });
        }, {
          maxAttempts: 3,
          delay: 1500,
          errorMessage: `Failed to join game as Player ${i}`
        });
      }

      pages.push(page);

      // Small delay between players to prevent race conditions
      if (i < 4) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Start game with verification
    await retryOperation(async () => {
      const startButton = pages[0].getByTestId('start-game-button');
      await startButton.waitFor({ state: 'enabled', timeout: TIMEOUTS.SHORT });
      await startButton.click();

      // Verify game started for all players
      await Promise.all(
        pages.map(page =>
          waitForElement(page, 'text=Betting Phase', {
            timeout: TIMEOUTS.MEDIUM
          })
        )
      );
    }, {
      maxAttempts: 2,
      delay: 1000,
      errorMessage: 'Failed to start game'
    });

    return { context, pages, gameId };

  } catch (error) {
    // Cleanup on failure
    console.error('Game creation failed:', error);
    await context.close();
    throw error;
  }
}

/**
 * Enhanced bet placement with stability improvements
 */
export async function placeAllBetsEnhanced(
  pages: Page[],
  bets: number[] = [9, 9, 7, 8],
  withoutTrump: boolean[] = [false, false, false, false]
) {
  const bettingOrder = [2, 3, 0, 1]; // P3, P4, P1, P2 (betting order)

  for (let i = 0; i < bettingOrder.length; i++) {
    const pageIndex = bettingOrder[i];
    const page = pages[pageIndex];
    const betAmount = bets[pageIndex];
    const noTrump = withoutTrump[pageIndex];
    const playerNum = pageIndex + 1;

    await retryOperation(async () => {
      // Wait for player's turn
      const amountButton = page.getByRole('button', {
        name: String(betAmount),
        exact: true
      });

      await amountButton.waitFor({
        state: 'visible',
        timeout: TIMEOUTS.BET_PLACE
      });

      // Click with retry for stale elements
      await retryOperation(
        async () => await amountButton.click(),
        { maxAttempts: 2, delay: 500 }
      );

      // Handle without trump option
      if (noTrump) {
        const trumpOption = page.getByText('Without Trump (2x multiplier)');
        await trumpOption.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
        await trumpOption.click();
      }

      // Place the bet
      const placeBetPattern = noTrump
        ? new RegExp(`Place Bet: ${betAmount} \\(No Trump\\)`)
        : new RegExp(`Place Bet: ${betAmount}`);

      const placeBetButton = page.getByRole('button', { name: placeBetPattern });
      await placeBetButton.waitFor({ state: 'enabled', timeout: TIMEOUTS.SHORT });
      await placeBetButton.click();

      // Verify bet was placed
      await page.waitForSelector('text=Waiting for other players to bet', {
        timeout: TIMEOUTS.SHORT
      });

      console.log(`Player ${playerNum} placed bet: ${betAmount}${noTrump ? ' (No Trump)' : ''}`);

    }, {
      maxAttempts: 2,
      delay: 1000,
      errorMessage: `Failed to place bet for Player ${playerNum}`
    });

    // Delay between bets to prevent race conditions
    if (i < bettingOrder.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 750));
    }
  }

  // Verify playing phase started for all players
  await Promise.all(
    pages.map(page =>
      page.locator('[data-card-value]').first().waitFor({
        timeout: TIMEOUTS.MEDIUM
      })
    )
  );
}

/**
 * Play a card with enhanced error handling
 */
export async function playCardEnhanced(
  page: Page,
  cardSelector?: string,
  options: { verifyPlay?: boolean; timeout?: number } = {}
) {
  const { verifyPlay = true, timeout = TIMEOUTS.MEDIUM } = options;

  await retryOperation(async () => {
    // Select card
    const card = cardSelector
      ? page.locator(cardSelector)
      : page.locator('[data-card-value]').first();

    // Verify card is playable
    const isDisabled = await card.getAttribute('data-disabled');
    if (isDisabled === 'true') {
      throw new Error('Selected card is not playable');
    }

    // Get card details before playing
    const cardValue = await card.getAttribute('data-card-value');
    const cardSuit = await card.getAttribute('data-card-suit');

    // Click the card
    await card.click({ force: true });

    if (verifyPlay) {
      // Verify card was played (disappears from hand)
      await expect(card).not.toBeVisible({ timeout });
      console.log(`Played card: ${cardValue} of ${cardSuit}`);
    }

  }, {
    maxAttempts: 2,
    delay: 500,
    errorMessage: 'Failed to play card'
  });
}

/**
 * Wait for specific game state with timeout
 */
export async function waitForGameState(
  page: Page,
  state: 'betting' | 'playing' | 'scoring' | 'gameover',
  timeout: number = TIMEOUTS.LONG
): Promise<void> {
  const stateSelectors = {
    betting: 'text=/Betting Phase/i',
    playing: '[data-card-value]',
    scoring: 'text=/Scoring|Round Score/i',
    gameover: 'text=/Game Over|Final Score/i'
  };

  const selector = stateSelectors[state];
  await waitForElement(page, selector, { timeout });
}

/**
 * Verify game synchronization across all players
 */
export async function verifyGameSync(
  pages: Page[],
  check: (page: Page) => Promise<string>
): Promise<boolean> {
  const results = await Promise.all(pages.map(check));
  const firstResult = results[0];

  const allMatch = results.every(result => result === firstResult);

  if (!allMatch) {
    console.error('Game state mismatch:', results);
    return false;
  }

  return true;
}

/**
 * Safe cleanup function
 */
export async function cleanupGame(context: any): Promise<void> {
  if (!context) return;

  try {
    // Give time for any pending operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Close all pages first
    const pages = context.pages();
    for (const page of pages) {
      try {
        await page.close();
      } catch (error) {
        console.log('Error closing page:', error);
      }
    }

    // Then close context
    await context.close();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

/**
 * Monitor test performance
 */
export class TestPerformanceMonitor {
  private startTime: number = 0;
  private checkpoints: Map<string, number> = new Map();

  start(): void {
    this.startTime = Date.now();
    this.checkpoints.clear();
  }

  checkpoint(name: string): void {
    const elapsed = Date.now() - this.startTime;
    this.checkpoints.set(name, elapsed);
    console.log(`[${elapsed}ms] ${name}`);
  }

  getReport(): string {
    const total = Date.now() - this.startTime;
    let report = `\nTest Performance Report (Total: ${total}ms)\n`;
    report += '=' .repeat(50) + '\n';

    let lastTime = 0;
    for (const [name, time] of this.checkpoints) {
      const delta = time - lastTime;
      report += `${name}: ${time}ms (+${delta}ms)\n`;
      lastTime = time;
    }

    return report;
  }
}

// Export all enhanced functions
export default {
  createGameWith4PlayersEnhanced,
  placeAllBetsEnhanced,
  playCardEnhanced,
  waitForGameState,
  verifyGameSync,
  cleanupGame,
  TestPerformanceMonitor,
  TIMEOUTS,
  retryOperation,
  waitForElement,
  safeGoto,
};