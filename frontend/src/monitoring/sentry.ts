/**
 * Sentry Error Tracking Configuration (Frontend)
 *
 * Captures and reports errors to Sentry for monitoring and debugging.
 */

import * as Sentry from '@sentry/react';
import { GameState } from '../types/game';

/**
 * Initialize Sentry for React
 *
 * Should be called before React app mounts.
 * Uses VITE_SENTRY_DSN environment variable.
 */
export function initSentry(): void {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!sentryDsn) {
    console.log('ℹ️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, adjust this to a lower value (e.g., 0.1 for 10%)
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Capture Replay for session debugging (10% of sessions)
    replaysSessionSampleRate: 0.1,
    // If error occurs, capture 100% of those sessions
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive game state information
      if (event.contexts?.game) {
        const game = event.contexts.game as any;
        // Remove player hands (cards are sensitive)
        if (game.players) {
          game.players = game.players.map((player: any) => ({
            ...player,
            hand: player.hand ? `[${player.hand.length} cards]` : [],
          }));
        }
      }

      return event;
    },
  });

  console.log('✅ Sentry error tracking initialized (Frontend)');
}

/**
 * Capture an exception with game context
 */
export function captureException(error: Error, gameContext?: {
  gameId?: string;
  gameState?: GameState;
  playerId?: string;
  playerName?: string;
  isSpectator?: boolean;
}): void {
  Sentry.withScope((scope) => {
    // Add game context
    if (gameContext) {
      scope.setContext('game', {
        gameId: gameContext.gameId,
        phase: gameContext.gameState?.phase,
        roundNumber: gameContext.gameState?.roundNumber,
        playerCount: gameContext.gameState?.players.length,
        isSpectator: gameContext.isSpectator,
      });

      if (gameContext.playerId) {
        scope.setUser({
          id: gameContext.playerId,
          username: gameContext.playerName,
        });
      }
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message (for non-error important events)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb (for debugging context)
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: 'info',
  });
}

/**
 * Track user action breadcrumbs
 */
export function trackUserAction(action: string, details?: Record<string, any>): void {
  addBreadcrumb('user-action', action, details);
}

/**
 * Track game state changes
 */
export function trackGameStateChange(gameId: string, phase: string, data?: Record<string, any>): void {
  addBreadcrumb('game-state', `Game ${gameId} entered ${phase} phase`, data);
}

/**
 * Set user context
 */
export function setUserContext(playerId: string, playerName?: string): void {
  Sentry.setUser({
    id: playerId,
    username: playerName,
  });
}

/**
 * Clear user context (on logout/leave game)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}
