/**
 * Monitoring and Metrics Module
 *
 * Tracks game metrics, performance, and user engagement using Prometheus client.
 * Metrics are exposed at /metrics endpoint for scraping.
 */

import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

// Create a Registry to register metrics
export const register = new Registry();

// Collect default system metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

/**
 * Game Metrics
 */

// Total games created
export const gamesCreatedTotal = new Counter({
  name: 'games_created_total',
  help: 'Total number of games created',
  registers: [register],
});

// Active games (currently in progress)
export const activeGamesGauge = new Gauge({
  name: 'active_games',
  help: 'Number of games currently in progress',
  registers: [register],
});

// Total rounds played
export const roundsPlayedTotal = new Counter({
  name: 'rounds_played_total',
  help: 'Total number of rounds played across all games',
  registers: [register],
});

// Games completed
export const gamesCompletedTotal = new Counter({
  name: 'games_completed_total',
  help: 'Total number of games that reached game_over',
  registers: [register],
});

// Game duration histogram
export const gameDurationHistogram = new Histogram({
  name: 'game_duration_seconds',
  help: 'Duration of completed games in seconds',
  buckets: [60, 300, 600, 1200, 1800, 3600], // 1min, 5min, 10min, 20min, 30min, 1hr
  registers: [register],
});

/**
 * Player Metrics
 */

// Active connections
export const activeConnectionsGauge = new Gauge({
  name: 'active_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Total players joined
export const playersJoinedTotal = new Counter({
  name: 'players_joined_total',
  help: 'Total number of times players joined games',
  registers: [register],
});

// Bot players created
export const botPlayersCreatedTotal = new Counter({
  name: 'bot_players_created_total',
  help: 'Total number of bot players spawned',
  registers: [register],
});

// Spectators joined
export const spectatorsJoinedTotal = new Counter({
  name: 'spectators_joined_total',
  help: 'Total number of times spectators joined games',
  registers: [register],
});

/**
 * Gameplay Metrics
 */

// Bets placed
export const betsPlacedTotal = new Counter({
  name: 'bets_placed_total',
  help: 'Total number of bets placed',
  labelNames: ['skipped'], // Track skipped vs non-skipped
  registers: [register],
});

// Cards played
export const cardsPlayedTotal = new Counter({
  name: 'cards_played_total',
  help: 'Total number of cards played',
  registers: [register],
});

// Tricks resolved
export const tricksResolvedTotal = new Counter({
  name: 'tricks_resolved_total',
  help: 'Total number of tricks resolved',
  registers: [register],
});

/**
 * Performance Metrics
 */

// Socket.IO event processing time
export const eventProcessingHistogram = new Histogram({
  name: 'socketio_event_duration_seconds',
  help: 'Time taken to process Socket.IO events',
  labelNames: ['event_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1], // 1ms to 1s
  registers: [register],
});

// Database query duration
export const dbQueryHistogram = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Time taken for database queries',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2], // 10ms to 2s
  registers: [register],
});

/**
 * Reconnection Metrics
 */

// Successful reconnections
export const reconnectionsSuccessTotal = new Counter({
  name: 'reconnections_success_total',
  help: 'Total number of successful reconnections',
  registers: [register],
});

// Failed reconnections
export const reconnectionsFailedTotal = new Counter({
  name: 'reconnections_failed_total',
  help: 'Total number of failed reconnection attempts',
  registers: [register],
});

// Disconnections
export const disconnectionsTotal = new Counter({
  name: 'disconnections_total',
  help: 'Total number of player disconnections',
  registers: [register],
});

/**
 * Chat Metrics
 */

// Chat messages sent
export const chatMessagesSentTotal = new Counter({
  name: 'chat_messages_sent_total',
  help: 'Total number of chat messages sent',
  labelNames: ['phase'], // team_selection, betting, playing, scoring
  registers: [register],
});

/**
 * Rematch Metrics
 */

// Rematch votes
export const rematchVotesTotal = new Counter({
  name: 'rematch_votes_total',
  help: 'Total number of rematch votes',
  registers: [register],
});

// Rematches started
export const rematchesStartedTotal = new Counter({
  name: 'rematches_started_total',
  help: 'Total number of rematches that actually started',
  registers: [register],
});

/**
 * Error Metrics
 */

// Total errors
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors encountered',
  labelNames: ['error_type'], // invalid_move, invalid_bet, game_not_found, etc.
  registers: [register],
});

// Rate limit violations
export const rateLimitViolationsTotal = new Counter({
  name: 'rate_limit_violations_total',
  help: 'Total number of rate limit violations',
  labelNames: ['event_name'],
  registers: [register],
});

/**
 * Helper Functions
 */

/**
 * Track event processing time
 * Usage: const end = trackEventProcessing('create_game'); ... end();
 */
export function trackEventProcessing(eventName: string): () => void {
  const end = eventProcessingHistogram.labels(eventName).startTimer();
  return end;
}

/**
 * Track database query time
 * Usage: const end = trackDbQuery('save_game'); ... end();
 */
export function trackDbQuery(queryType: string): () => void {
  const end = dbQueryHistogram.labels(queryType).startTimer();
  return end;
}

/**
 * Get current metrics summary (for debugging/admin panel)
 */
export async function getMetricsSummary(): Promise<{
  games: {
    total: number;
    active: number;
    completed: number;
  };
  players: {
    activeConnections: number;
    totalJoined: number;
    bots: number;
    spectators: number;
  };
  gameplay: {
    rounds: number;
    bets: number;
    cards: number;
    tricks: number;
  };
  chat: {
    messages: number;
  };
  reconnections: {
    success: number;
    failed: number;
    disconnections: number;
  };
  errors: {
    total: number;
    rateLimitViolations: number;
  };
}> {
  const metrics = await register.getMetricsAsJSON();

  // Helper to extract metric value
  const getValue = (name: string, labels?: Record<string, string>): number => {
    const metric = metrics.find((m: any) => m.name === name);
    if (!metric || !metric.values) return 0;

    if (labels) {
      const match = metric.values.find((v: any) =>
        Object.entries(labels).every(([key, value]) => v.labels[key] === value)
      );
      return match?.value || 0;
    }

    // For counters/gauges without labels
    return metric.values[0]?.value || 0;
  };

  return {
    games: {
      total: getValue('games_created_total'),
      active: getValue('active_games'),
      completed: getValue('games_completed_total'),
    },
    players: {
      activeConnections: getValue('active_connections'),
      totalJoined: getValue('players_joined_total'),
      bots: getValue('bot_players_created_total'),
      spectators: getValue('spectators_joined_total'),
    },
    gameplay: {
      rounds: getValue('rounds_played_total'),
      bets: getValue('bets_placed_total'),
      cards: getValue('cards_played_total'),
      tricks: getValue('tricks_resolved_total'),
    },
    chat: {
      messages: getValue('chat_messages_sent_total'),
    },
    reconnections: {
      success: getValue('reconnections_success_total'),
      failed: getValue('reconnections_failed_total'),
      disconnections: getValue('disconnections_total'),
    },
    errors: {
      total: getValue('errors_total'),
      rateLimitViolations: getValue('rate_limit_violations_total'),
    },
  };
}
