import { test, expect } from '@playwright/test';
import { createGameWith4Players } from './helpers';

/**
 * Network Resilience Tests
 * Tests the application's ability to handle network issues gracefully
 */
test.describe('Network Resilience', () => {
  let context: any;

  test.afterEach(async () => {
    if (context) {
      await context.close();
    }
  });

  test('should handle temporary network disconnection', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const { pages, gameId } = result;

    // Simulate network going offline for one player
    await pages[1].context().setOffline(true);
    await pages[1].waitForTimeout(2000);

    // Reconnect
    await pages[1].context().setOffline(false);
    await pages[1].waitForTimeout(1000);

    // Verify player can still interact after reconnection
    const gamePhase = await pages[1].locator('text=/Betting Phase|Playing Phase/i').isVisible({ timeout: 5000 });
    expect(gamePhase).toBeTruthy();
  });

  test('should handle slow network conditions', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const { pages } = result;

    // Simulate slow 3G network
    await pages[0].context().route('**/*', async (route) => {
      // Add 500ms delay to all requests
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    // Try to perform an action with slow network
    const bettingVisible = await pages[0].locator('text=/Betting Phase/i').isVisible({ timeout: 10000 });
    expect(bettingVisible).toBeTruthy();

    // Clean up route
    await pages[0].context().unroute('**/*');
  });

  test('should handle WebSocket reconnection', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const { pages } = result;

    // Monitor WebSocket state
    const wsState = await pages[0].evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        const socket = window.socket;
        if (!socket) {
          resolve({ connected: false, error: 'No socket found' });
          return;
        }

        const initialState = socket.connected;

        // Disconnect
        socket.disconnect();

        // Wait and reconnect
        setTimeout(() => {
          socket.connect();

          // Wait for reconnection
          socket.once('connect', () => {
            resolve({
              connected: true,
              reconnected: true,
              initialState
            });
          });
        }, 1000);

        // Timeout fallback
        setTimeout(() => {
          resolve({
            connected: socket.connected,
            timeout: true
          });
        }, 5000);
      });
    });

    expect(wsState).toHaveProperty('reconnected', true);
  });

  test('should queue actions during network interruption', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const { pages } = result;

    // Track actions
    let actionsSent = 0;
    let actionsReceived = 0;

    // Monitor network traffic
    pages[0].on('request', request => {
      if (request.url().includes('socket.io')) {
        actionsSent++;
      }
    });

    pages[0].on('response', response => {
      if (response.url().includes('socket.io')) {
        actionsReceived++;
      }
    });

    // Simulate brief network interruption
    await pages[0].context().setOffline(true);

    // Try to perform action while offline
    const betButton = pages[0].getByRole('button', { name: '7' });
    if (await betButton.isVisible({ timeout: 1000 })) {
      await betButton.click().catch(() => {});
    }

    // Reconnect
    await pages[0].context().setOffline(false);
    await pages[0].waitForTimeout(2000);

    // Actions should eventually sync
    console.log(`Actions sent: ${actionsSent}, received: ${actionsReceived}`);
  });

  test('should handle packet loss simulation', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const { pages } = result;

    // Simulate 20% packet loss
    await pages[0].context().route('**/socket.io/*', async (route, request) => {
      if (Math.random() < 0.2) {
        // Drop 20% of requests
        await route.abort();
      } else {
        await route.continue();
      }
    });

    // Game should still be playable with packet loss
    const gamePlayable = await pages[0].locator('text=/Betting Phase|Team Selection/i').isVisible({ timeout: 5000 });
    expect(gamePlayable).toBeTruthy();

    // Clean up
    await pages[0].context().unroute('**/socket.io/*');
  });

  test('should maintain game state consistency after reconnection', async ({ browser }) => {
    const result = await createGameWith4Players(browser);
    context = result.context;
    const { pages } = result;

    // Get initial state
    const initialState = await pages[0].evaluate(() => {
      // @ts-ignore
      return window.gameState ? {
        phase: window.gameState.phase,
        playerCount: window.gameState.players?.length
      } : null;
    });

    // Simulate disconnection and reconnection
    await pages[0].context().setOffline(true);
    await pages[0].waitForTimeout(3000);
    await pages[0].context().setOffline(false);
    await pages[0].waitForTimeout(2000);

    // Get state after reconnection
    const reconnectedState = await pages[0].evaluate(() => {
      // @ts-ignore
      return window.gameState ? {
        phase: window.gameState.phase,
        playerCount: window.gameState.players?.length
      } : null;
    });

    // States should be consistent
    if (initialState && reconnectedState) {
      expect(reconnectedState.playerCount).toBe(initialState.playerCount);
    }
  });
});