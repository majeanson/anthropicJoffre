/**
 * Sentry Error Tracking Configuration (Backend)
 *
 * Captures and reports errors to Sentry for monitoring and debugging.
 */

import * as Sentry from '@sentry/node';
import { GameState } from '../types/game';

/**
 * Initialize Sentry
 *
 * Should be called at application startup.
 * Uses SENTRY_DSN environment variable.
 */
export function initSentry(): void {
  const sentryDsn = process.env.SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!sentryDsn) {
    console.log('ℹ️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // In production, adjust this to a lower value (e.g., 0.1 for 10%)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Integrate with Node.js frameworks
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js tracing
      // new Sentry.Integrations.Express({ app }), // Can be added later
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive information from context
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

  console.log('✅ Sentry error tracking initialized');
}

/**
 * Capture an exception with game context
 */
export function captureException(error: Error, gameContext?: {
  gameId?: string;
  gameState?: GameState;
  playerId?: string;
  playerName?: string;
  event?: string;
}): void {
  Sentry.withScope((scope) => {
    // Add game context
    if (gameContext) {
      scope.setContext('game', {
        gameId: gameContext.gameId,
        phase: gameContext.gameState?.phase,
        roundNumber: gameContext.gameState?.roundNumber,
        playerCount: gameContext.gameState?.players.length,
      });

      if (gameContext.playerId) {
        scope.setUser({
          id: gameContext.playerId,
          username: gameContext.playerName,
        });
      }

      if (gameContext.event) {
        scope.setTag('socket_event', gameContext.event);
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
 * Track game event breadcrumbs
 */
export function trackGameEvent(event: string, gameId: string, data?: Record<string, any>): void {
  addBreadcrumb('game', `${event} in game ${gameId}`, data);
}

/**
 * Flush Sentry events (useful before shutting down)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return Sentry.close(timeout);
}
