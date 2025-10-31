/**
 * Test Stability Helpers
 *
 * Utilities to improve E2E test reliability and reduce flakiness.
 * These helpers implement:
 * - Automatic retry logic with exponential backoff
 * - Better wait strategies (avoid arbitrary timeouts)
 * - Page cleanup to prevent memory leaks
 * - Performance monitoring
 */

import { Page, expect } from '@playwright/test';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  timeoutMs?: number;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 500,
  maxDelay: 5000,
  backoffFactor: 2,
  timeoutMs: 30000,
};

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {},
  operationName: string = 'operation'
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();

  let attempt = 0;
  let delay = fullConfig.initialDelay;

  while (attempt < fullConfig.maxAttempts) {
    attempt++;

    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`✓ ${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      const elapsed = Date.now() - startTime;

      if (elapsed > fullConfig.timeoutMs) {
        throw new Error(
          `${operationName} timed out after ${elapsed}ms (${attempt} attempts). Last error: ${error}`
        );
      }

      if (attempt >= fullConfig.maxAttempts) {
        throw new Error(
          `${operationName} failed after ${attempt} attempts. Last error: ${error}`
        );
      }

      console.log(
        `⚠ ${operationName} failed (attempt ${attempt}/${fullConfig.maxAttempts}), retrying in ${delay}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * fullConfig.backoffFactor, fullConfig.maxDelay);
    }
  }

  throw new Error(`${operationName} exhausted all retry attempts`);
}

/**
 * Wait for a condition to be true with polling
 * Better than arbitrary waitForTimeout as it exits as soon as condition is met
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    pollInterval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 10000,
    pollInterval = 200,
    errorMessage = 'Condition not met within timeout',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`${errorMessage} (waited ${timeout}ms)`);
}

/**
 * Wait for element with retry logic
 */
export async function waitForElementStable(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    state?: 'attached' | 'visible' | 'hidden';
  } = {}
): Promise<void> {
  const { timeout = 10000, state = 'visible' } = options;

  await retryWithBackoff(
    async () => {
      await page.waitForSelector(selector, { timeout: timeout / 3, state });
    },
    { maxAttempts: 3, timeoutMs: timeout },
    `waitForElement(${selector})`
  );
}

/**
 * Click element with retry logic (handles detached elements)
 */
export async function clickElementStable(
  page: Page,
  selector: string,
  options: {
    timeout?: number;
    force?: boolean;
  } = {}
): Promise<void> {
  const { timeout = 10000, force = false } = options;

  await retryWithBackoff(
    async () => {
      await page.click(selector, { timeout: timeout / 3, force });
    },
    { maxAttempts: 3, timeoutMs: timeout },
    `clickElement(${selector})`
  );
}

/**
 * Type text with retry logic
 */
export async function fillInputStable(
  page: Page,
  selector: string,
  text: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  await retryWithBackoff(
    async () => {
      await page.fill(selector, text, { timeout: timeout / 3 });
    },
    { maxAttempts: 3, timeoutMs: timeout },
    `fillInput(${selector})`
  );
}

/**
 * Get text content with retry logic
 */
export async function getTextContentStable(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<string | null> {
  const { timeout = 10000 } = options;

  return await retryWithBackoff(
    async () => {
      const element = await page.waitForSelector(selector, { timeout: timeout / 3 });
      return await element?.textContent();
    },
    { maxAttempts: 3, timeoutMs: timeout },
    `getTextContent(${selector})`
  );
}

/**
 * Clean up page resources to prevent memory leaks
 */
export async function cleanupPage(page: Page): Promise<void> {
  try {
    // Cancel all pending network requests
    await page.evaluate(() => {
      // @ts-ignore
      if (window.performance && window.performance.getEntries) {
        // Clear resource timing
        performance.clearResourceTimings();
      }
    });

    // Clear console messages
    await page.evaluate(() => {
      if (console.clear) console.clear();
    });

    console.log('✓ Page cleanup completed');
  } catch (error) {
    console.warn('⚠ Page cleanup failed (non-critical):', error);
  }
}

/**
 * Close all pages in context and cleanup
 */
export async function cleanupContext(context: any): Promise<void> {
  try {
    const pages = context.pages();
    for (const page of pages) {
      await cleanupPage(page);
      await page.close();
    }
    await context.close();
    console.log(`✓ Context cleanup completed (${pages.length} pages closed)`);
  } catch (error) {
    console.warn('⚠ Context cleanup failed:', error);
  }
}

/**
 * Monitor page memory usage
 */
export async function getMemoryUsage(page: Page): Promise<number | null> {
  try {
    return await page.evaluate(() => {
      // @ts-ignore
      if (window.performance && window.performance.memory) {
        // @ts-ignore
        return window.performance.memory.usedJSHeapSize;
      }
      return null;
    });
  } catch {
    return null;
  }
}

/**
 * Wait for network to be idle (no pending requests)
 */
export async function waitForNetworkIdle(
  page: Page,
  options: {
    timeout?: number;
    idleTime?: number;
  } = {}
): Promise<void> {
  const { timeout = 10000, idleTime = 500 } = options;

  await page.waitForLoadState('networkidle', { timeout });

  // Additional wait to ensure stability
  await new Promise(resolve => setTimeout(resolve, idleTime));
}

/**
 * Safe navigation with retry
 */
export async function navigateStable(
  page: Page,
  url: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 30000 } = options;

  await retryWithBackoff(
    async () => {
      await page.goto(url, { timeout: timeout / 3, waitUntil: 'domcontentloaded' });
    },
    { maxAttempts: 3, timeoutMs: timeout },
    `navigate(${url})`
  );
}

/**
 * Wait for game phase transition with timeout
 */
export async function waitForGamePhase(
  page: Page,
  phaseName: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 15000 } = options;

  await waitForCondition(
    async () => {
      try {
        const phaseElement = await page.locator(`text=${phaseName}`).first();
        return await phaseElement.isVisible({ timeout: 500 });
      } catch {
        return false;
      }
    },
    {
      timeout,
      pollInterval: 300,
      errorMessage: `Game phase "${phaseName}" not reached`,
    }
  );

  console.log(`✓ Reached game phase: ${phaseName}`);
}

/**
 * Wait for player turn with improved detection
 */
export async function waitForPlayerTurn(
  page: Page,
  playerName: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 10000 } = options;

  await waitForCondition(
    async () => {
      try {
        // Check for turn indicator
        const turnIndicator = await page.getByTestId('turn-indicator').textContent({ timeout: 500 });
        if (turnIndicator?.includes('Your turn')) {
          return true;
        }

        // Check for current turn player display
        const currentTurn = await page.getByTestId('current-turn-player').textContent({ timeout: 500 });
        if (currentTurn?.includes(playerName)) {
          return true;
        }

        return false;
      } catch {
        return false;
      }
    },
    {
      timeout,
      pollInterval: 300,
      errorMessage: `Player "${playerName}" turn not detected`,
    }
  );
}

/**
 * Batch cleanup for multiple contexts
 */
export async function cleanupMultipleContexts(contexts: any[]): Promise<void> {
  console.log(`Cleaning up ${contexts.length} contexts...`);

  for (let i = 0; i < contexts.length; i++) {
    try {
      await cleanupContext(contexts[i]);
    } catch (error) {
      console.warn(`⚠ Failed to cleanup context ${i}:`, error);
    }
  }

  console.log('✓ All contexts cleaned up');
}

/**
 * Performance metrics for debugging
 */
export interface PerformanceMetrics {
  memoryUsageMB: number | null;
  pageCount: number;
  timestamp: number;
}

export async function collectMetrics(context: any): Promise<PerformanceMetrics> {
  const pages = context.pages();
  const memoryBytes = pages.length > 0 ? await getMemoryUsage(pages[0]) : null;

  return {
    memoryUsageMB: memoryBytes ? Math.round(memoryBytes / 1024 / 1024) : null,
    pageCount: pages.length,
    timestamp: Date.now(),
  };
}

/**
 * Log performance metrics
 */
export function logMetrics(metrics: PerformanceMetrics, label: string = ''): void {
  const prefix = label ? `[${label}]` : '';
  console.log(
    `${prefix} Memory: ${metrics.memoryUsageMB ?? 'N/A'}MB, ` +
    `Pages: ${metrics.pageCount}, ` +
    `Time: ${new Date(metrics.timestamp).toISOString()}`
  );
}
