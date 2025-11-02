/**
 * REST API Routes
 *
 * Sprint 3 Refactoring: Extracted from index.ts
 * All REST API endpoints for the Trick Card Game backend
 *
 * Endpoints:
 * - GET  /                           - Root/welcome
 * - GET  /api/health                 - Basic health check
 * - GET  /api/health/detailed        - Detailed health metrics
 * - GET  /api/metrics/error-boundaries - Error boundary statistics
 * - GET  /api/metrics/response-times - Response time analytics
 * - POST /api/__test/set-game-state  - Test-only state manipulation
 * - GET  /api/games/lobby            - List active/joinable games
 * - GET  /api/games/recent           - List recent finished games
 * - GET  /api/games/history          - Legacy endpoint for game history
 * - GET  /api/games/:gameId          - Get specific game details
 * - GET  /api/players/:playerName/games - Get player's game history
 * - GET  /api/players/online         - List online players
 * - GET  /api/stats/:playerName      - Get player statistics
 * - GET  /api/leaderboard            - Global leaderboard
 */

import { Express, Request, Response } from 'express';
import express from 'express';
import { Server } from 'socket.io';
import { GameState, Player, GamePhase } from '../types/game';
import {
  getPlayerStats,
  getLeaderboard,
  getAllFinishedGames,
  getRecentGames,
  markGameFinished,
  updateGameStats,
  calculateEloChange,
  getPoolStats,
  query,
} from '../db';
import {
  loadGameState as loadGameFromDB,
  listActiveGames,
  getPlayerGames,
} from '../db/gameState';
import { getOnlinePlayers } from '../db/presence';
import * as PersistenceManager from '../db/persistenceManager';
import { queryCache } from '../utils/queryCache';
import { getAllMetrics } from '../middleware/errorBoundary';
import { responseTimeTracker } from '../utils/responseTime';
import logger from '../utils/logger';

/**
 * Dependencies needed by the routes
 */
export interface RoutesDependencies {
  games: Map<string, GameState>;
  gameCreationTimes: Map<string, number>;
  io: Server;
  corsOrigin: string | string[];
  allowedOrigins: string[];
  getGame: (gameId: string) => Promise<GameState | undefined>;
  emitGameUpdate: (gameId: string, gameState: GameState) => void;
  formatUptime: (seconds: number) => string;
  formatBytes: (bytes: number) => string;
}

/**
 * Helper: Emit game update to all clients in the game room
 */
function emitGameUpdateLocal(
  io: Server,
  gameId: string,
  gameState: GameState
): void {
  io.to(gameId).emit('game_updated', gameState);
}

/**
 * Register all REST API routes
 */
export function registerRoutes(app: Express, deps: RoutesDependencies): void {
  const {
    games,
    gameCreationTimes,
    io,
    corsOrigin,
    allowedOrigins,
    getGame,
    formatUptime,
    formatBytes,
  } = deps;

  // ============================================================================
  // Admin Endpoints
  // ============================================================================

  // Cleanup obsolete 6-character game IDs
  app.post('/api/admin/cleanup-obsolete-games', async (req: Request, res: Response) => {
    try {
      // Delete from active_games table
      const activeGamesResult = await query(
        `DELETE FROM active_games WHERE LENGTH(game_id) = 6 RETURNING game_id`,
        []
      );

      // Delete from games table (finished games)
      const finishedGamesResult = await query(
        `DELETE FROM games WHERE LENGTH(id) = 6 RETURNING id`,
        []
      );

      // Delete from game_sessions table
      const sessionsResult = await query(
        `DELETE FROM game_sessions WHERE LENGTH(game_id) = 6 RETURNING game_id`,
        []
      );

      const deletedCount = {
        activeGames: activeGamesResult.rowCount || 0,
        finishedGames: finishedGamesResult.rowCount || 0,
        sessions: sessionsResult.rowCount || 0,
      };

      console.log(`[Cleanup] Purged obsolete 6-char game IDs:`, deletedCount);

      res.json({
        success: true,
        message: 'Successfully purged obsolete 6-character game IDs',
        deletedCount,
        activeGames: activeGamesResult.rows.map((r: any) => r.game_id || r.id),
        finishedGames: finishedGamesResult.rows.map((r: any) => r.game_id || r.id),
      });
    } catch (error) {
      console.error('[Cleanup] Failed to purge obsolete game IDs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purge obsolete game IDs',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ============================================================================
  // Root Endpoint
  // ============================================================================

  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Trick Card Game API',
      status: 'running',
      endpoints: {
        health: '/api/health',
        history: '/api/games/history',
        lobby: '/api/games/lobby',
        socket: '/socket.io',
      },
    });
  });

  // ============================================================================
  // Health Check Endpoints
  // ============================================================================

  app.get('/api/health', (req: Request, res: Response) => {
    const poolStats = getPoolStats();
    const cacheStats = queryCache.getStats();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        configured: process.env.DATABASE_URL ? true : false,
        pool: {
          total: poolStats.totalCount,
          idle: poolStats.idleCount,
          waiting: poolStats.waitingCount,
        },
      },
      cache: {
        size: cacheStats.size,
        keys: cacheStats.keys.length,
      },
      cors: corsOrigin,
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
    });
  });

  app.get('/api/health/detailed', (req: Request, res: Response) => {
    try {
      const poolStats = getPoolStats();
      const cacheStats = queryCache.getStats();
      const memUsage = process.memoryUsage();
      const errorMetrics = getAllMetrics();

      // Calculate error rates
      let totalHandlerCalls = 0;
      let totalHandlerErrors = 0;
      errorMetrics.forEach((value) => {
        totalHandlerCalls += value.totalCalls;
        totalHandlerErrors += value.totalErrors;
      });

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(process.uptime()),
          formatted: formatUptime(process.uptime()),
        },
        environment: process.env.NODE_ENV || 'development',

        // Database health
        database: {
          configured: !!process.env.DATABASE_URL,
          pool: {
            total: poolStats.totalCount,
            idle: poolStats.idleCount,
            waiting: poolStats.waitingCount,
            utilization:
              poolStats.totalCount > 0
                ? `${Math.round(
                    ((poolStats.totalCount - poolStats.idleCount) /
                      poolStats.totalCount) *
                      100
                  )}%`
                : '0%',
          },
        },

        // Cache health
        cache: {
          enabled: true,
          size: cacheStats.size,
          keys: cacheStats.keys.length,
          sampleKeys: cacheStats.keys.slice(0, 5), // First 5 cache keys
        },

        // Memory health
        memory: {
          heapUsed: formatBytes(memUsage.heapUsed),
          heapTotal: formatBytes(memUsage.heapTotal),
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: formatBytes(memUsage.rss),
          external: formatBytes(memUsage.external),
          heapUtilization: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
        },

        // Game state health
        game: {
          activeGames: games.size,
          connectedSockets: io.sockets.sockets.size,
        },

        // Error handling health
        errorHandling: {
          totalHandlers: errorMetrics.size,
          totalCalls: totalHandlerCalls,
          totalErrors: totalHandlerErrors,
          errorRate:
            totalHandlerCalls > 0
              ? `${((totalHandlerErrors / totalHandlerCalls) * 100).toFixed(2)}%`
              : '0%',
          successRate:
            totalHandlerCalls > 0
              ? `${(
                  ((totalHandlerCalls - totalHandlerErrors) / totalHandlerCalls) *
                  100
                ).toFixed(2)}%`
              : '100%',
        },

        // CORS configuration
        cors: {
          mode: corsOrigin === '*' ? 'development' : 'production',
          origin: corsOrigin === '*' ? 'All origins (wildcard)' : allowedOrigins,
          credentials: true,
          methods: ['GET', 'POST'],
          clientUrlConfigured: !!process.env.CLIENT_URL,
          totalAllowedOrigins: corsOrigin === '*' ? 'unlimited' : allowedOrigins.length,
        },

        // WebSocket configuration
        websocket: {
          compressionEnabled: true,
          compressionThreshold: '1KB',
          compressionLevel: 3,
        },

        // Performance monitoring
        performance: {
          responseTime: {
            totalEndpoints: responseTimeTracker.getSummary().totalEndpoints,
            totalRequests: responseTimeTracker.getSummary().totalRequests,
            avgResponseTime:
              Math.round(responseTimeTracker.getSummary().avgResponseTime * 100) / 100 +
              'ms',
            slowEndpoints: responseTimeTracker.getSummary().slowEndpoints.length,
          },
        },
      });
    } catch (error) {
      logger.error('Error generating detailed health check', { error });
      res.status(500).json({
        status: 'error',
        message: 'Failed to generate health check',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ============================================================================
  // Metrics Endpoints
  // ============================================================================

  app.get('/api/metrics/error-boundaries', (req: Request, res: Response) => {
    try {
      const metrics = getAllMetrics();
      const formattedMetrics: Record<string, any> = {};

      metrics.forEach((value, key) => {
        formattedMetrics[key] = {
          totalCalls: value.totalCalls,
          totalErrors: value.totalErrors,
          totalSuccess: value.totalSuccess,
          errorRate:
            value.totalCalls > 0
              ? ((value.totalErrors / value.totalCalls) * 100).toFixed(2) + '%'
              : '0%',
          successRate:
            value.totalCalls > 0
              ? ((value.totalSuccess / value.totalCalls) * 100).toFixed(2) + '%'
              : '0%',
          averageExecutionTime: value.averageExecutionTime.toFixed(2) + 'ms',
          lastError: value.lastError?.toISOString() || null,
          errorsByType: Object.fromEntries(value.errorsByType),
        };
      });

      res.json({
        timestamp: new Date().toISOString(),
        totalHandlers: metrics.size,
        handlers: formattedMetrics,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
  });

  app.get('/api/metrics/response-times', (req: Request, res: Response) => {
    try {
      const summary = responseTimeTracker.getSummary();
      const allMetrics = responseTimeTracker.getAllMetrics();

      // Format metrics with rounded values for readability
      const formattedMetrics = allMetrics.map((metric) => ({
        name: metric.name,
        count: metric.count,
        min: Math.round(metric.min * 100) / 100,
        max: Math.round(metric.max * 100) / 100,
        avg: Math.round(metric.avg * 100) / 100,
        p50: Math.round(metric.p50 * 100) / 100,
        p95: Math.round(metric.p95 * 100) / 100,
        p99: Math.round(metric.p99 * 100) / 100,
      }));

      // Add alerting information
      const slowEndpoints = formattedMetrics.filter((m) => m.p95 > 100);
      const verySlowEndpoints = formattedMetrics.filter((m) => m.p95 > 200);

      res.json({
        timestamp: new Date().toISOString(),
        summary: {
          totalEndpoints: summary.totalEndpoints,
          totalRequests: summary.totalRequests,
          avgResponseTime: Math.round(summary.avgResponseTime * 100) / 100,
        },
        alerts: {
          slowEndpoints: slowEndpoints.length,
          verySlowEndpoints: verySlowEndpoints.length,
        },
        metrics: formattedMetrics,
        // Separate sections for quick reference
        performance: {
          fastest: formattedMetrics.slice(-5).reverse(), // Top 5 fastest
          slowest: formattedMetrics.slice(0, 5), // Top 5 slowest
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve response time metrics' });
    }
  });

  // ============================================================================
  // Test/Admin Endpoints
  // ============================================================================

  app.post('/api/__test/set-game-state', express.json(), async (req: Request, res: Response) => {
    try {
      const { gameId, teamScores, phase } = req.body;

      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      const game = games.get(gameId);
      if (!game) {
        return res.status(404).json({ error: `Game ${gameId} not found` });
      }

      console.log(`TEST API: Manipulating game state for ${gameId}`);

      // Set team scores if provided
      if (teamScores) {
        if (typeof teamScores.team1 === 'number') {
          game.teamScores.team1 = teamScores.team1;
        }
        if (typeof teamScores.team2 === 'number') {
          game.teamScores.team2 = teamScores.team2;
        }
        console.log(
          `TEST API: Set scores to Team1=${game.teamScores.team1}, Team2=${game.teamScores.team2}`
        );

        // Check if game should be over (team >= 41)
        if (game.teamScores.team1 >= 41 || game.teamScores.team2 >= 41) {
          game.phase = 'game_over';
          const winningTeam = game.teamScores.team1 >= 41 ? 1 : 2;
          console.log(`TEST API: Game over triggered, Team ${winningTeam} wins`);

          // Save stats for all human players (conditional on persistence mode)
          (async () => {
            try {
              await PersistenceManager.markGameFinished(gameId, winningTeam, game.persistenceMode);
              console.log(
                `TEST API: Game ${gameId} marked as finished (${game.persistenceMode} mode), Team ${winningTeam} won`
              );

              const humanPlayers = game.players.filter((p) => !p.isBot);
              const createdAtMs = gameCreationTimes.get(gameId) || Date.now();
              const gameDurationMinutes = Math.floor(
                (Date.now() - createdAtMs) / 1000 / 60
              );

              // Calculate ELO changes (returns 0 for casual mode)
              const eloChanges = await PersistenceManager.calculateEloChangesForGame(
                game.players,
                winningTeam,
                game.persistenceMode
              );

              for (const player of humanPlayers) {
                const won = player.teamId === winningTeam;
                const eloChange = eloChanges.get(player.name) || 0;

                await PersistenceManager.updateGameStats(
                  player.name,
                  {
                    won,
                    gameRounds: game.roundNumber,
                    gameDurationMinutes,
                  },
                  eloChange,
                  game.persistenceMode
                );

                console.log(
                  `TEST API: Updated game stats for ${player.name}: ${won ? 'WIN' : 'LOSS'}, ELO ${eloChange > 0 ? '+' : ''}${eloChange}`
                );
              }
            } catch (error) {
              console.error('TEST API: Error finalizing game:', error);
            }
          })();

          // Emit game_over event
          io.to(game.id).emit('game_over', {
            winningTeam,
            gameState: game,
          });
        }
      }

      // Set phase if provided (and not already set to game_over by score logic)
      if (phase && game.phase !== 'game_over') {
        // Validate phase value
        const validPhases: GamePhase[] = [
          'team_selection',
          'betting',
          'playing',
          'scoring',
          'game_over',
        ];
        if (validPhases.includes(phase as GamePhase)) {
          game.phase = phase as GamePhase;
          console.log(`TEST API: Set phase to ${phase}`);
        } else {
          console.error(
            `TEST API: Invalid phase '${phase}' - must be one of: ${validPhases.join(', ')}`
          );
        }
      }

      // Emit game update
      emitGameUpdateLocal(io, game.id, game);

      res.json({
        success: true,
        gameId: game.id,
        phase: game.phase,
        teamScores: game.teamScores,
      });
    } catch (error) {
      console.error('TEST API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================================================
  // Game Endpoints
  // ============================================================================

  app.get('/api/games/lobby', async (req: Request, res: Response) => {
    try {
      // Load games from DB if not in memory (in case server restarted)
      const dbGames = await listActiveGames({ isPublic: true, limit: 100 });

      // Merge with in-memory games
      const gameMap = new Map<string, any>();

      // Add in-memory games first
      Array.from(games.values()).forEach((game) => {
        gameMap.set(game.id, game);
      });

      // Add DB games that aren't in memory
      for (const dbGame of dbGames) {
        if (!gameMap.has(dbGame.gameId)) {
          try {
            // Load full game state from DB
            const fullGame = await loadGameFromDB(dbGame.gameId);

            // Validate the loaded game has required properties
            if (
              fullGame &&
              fullGame.id &&
              fullGame.players &&
              Array.isArray(fullGame.players)
            ) {
              // Only add to map if game is in team_selection phase (joinable)
              if (fullGame.phase === 'team_selection') {
                gameMap.set(fullGame.id, fullGame);
              } else {
                console.log(
                  '[Lobby] Skipping non-joinable DB game:',
                  fullGame.id,
                  'phase:',
                  fullGame.phase
                );
              }
            } else {
              console.warn('[Lobby] Invalid game loaded from DB:', dbGame.gameId);
            }
          } catch (error) {
            console.error('[Lobby] Failed to load game from DB:', dbGame.gameId, error);
          }
        }
      }

      const activeGames = Array.from(gameMap.values())
        .filter((game: GameState) => {
          // Pre-filter: Only include games with valid structure
          if (!game || !game.id || !game.players || !Array.isArray(game.players)) {
            console.warn('[Lobby] Filtering out invalid game:', game?.id);
            return false;
          }
          // Filter out obsolete 6-character game IDs (current format is 8 characters)
          if (game.id.length === 6) {
            console.log('[Lobby] Filtering out obsolete 6-char game ID:', game.id);
            return false;
          }
          return true;
        })
        .map((game: GameState) => {
          // Get actual player count (not including bots unless specified)
          const humanPlayerCount = game.players.filter((p: Player) => !p.isBot).length;
          const botPlayerCount = game.players.filter((p: Player) => p.isBot).length;

          // Check if game is joinable (can join if not full, or if there are bots to replace)
          const isJoinable =
            game.phase === 'team_selection' &&
            (game.players.length < 4 || botPlayerCount > 0);

          // Check if game is in progress
          const isInProgress =
            game.phase === 'betting' ||
            game.phase === 'playing' ||
            game.phase === 'scoring';

          return {
            gameId: game.id,
            phase: game.phase,
            playerCount: game.players.length,
            humanPlayerCount,
            botPlayerCount,
            isJoinable,
            isInProgress,
            teamScores: game.teamScores,
            roundNumber: game.roundNumber,
            createdAt: gameCreationTimes.get(game.id) || Date.now(),
            players: game.players.map((p: Player) => ({
              name: p.name,
              teamId: p.teamId,
              isBot: p.isBot || false,
            })),
          };
        })
        // Only show joinable games in the active games list
        .filter((game) => game.isJoinable);

      // Sort by creation time (newest first)
      activeGames.sort((a, b) => b.createdAt - a.createdAt);

      res.json({
        games: activeGames,
        total: activeGames.length,
        joinable: activeGames.filter((g) => g.isJoinable).length,
        inProgress: activeGames.filter((g) => g.isInProgress).length,
      });
    } catch (error) {
      console.error('Error fetching lobby games:', error);
      res.status(500).json({ error: 'Failed to fetch lobby games' });
    }
  });

  app.get('/api/games/recent', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const gamesData = await getAllFinishedGames(limit, offset);
      res.json({ games: gamesData });
    } catch (error) {
      console.error('Error fetching recent games:', error);
      res.status(500).json({ error: 'Failed to fetch recent games' });
    }
  });

  app.get('/api/games/history', async (req: Request, res: Response) => {
    try {
      const history = await getRecentGames(10);
      res.json(history);
    } catch (error) {
      console.error('Error fetching game history:', error);
      res.status(500).json({ error: 'Failed to fetch game history' });
    }
  });

  app.get('/api/games/:gameId', async (req: Request, res: Response) => {
    try {
      const { gameId } = req.params;
      const game = await getGame(gameId);

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Return game with metadata
      res.json({
        gameId: game.id,
        phase: game.phase,
        playerCount: game.players.length,
        players: game.players.map((p) => ({
          name: p.name,
          teamId: p.teamId,
          isBot: p.isBot || false,
        })),
        teamScores: game.teamScores,
        roundNumber: game.roundNumber,
        isJoinable: game.phase === 'team_selection' && game.players.length < 4,
        createdAt: gameCreationTimes.get(game.id) || Date.now(),
      });
    } catch (error) {
      console.error('Error fetching game:', error);
      res.status(500).json({ error: 'Failed to fetch game' });
    }
  });

  // ============================================================================
  // Player Endpoints
  // ============================================================================

  app.get('/api/players/:playerName/games', async (req: Request, res: Response) => {
    try {
      const { playerName } = req.params;

      // Define response format
      interface PlayerGameSummary {
        gameId: string;
        playerNames: string[];
        teamIds: (number | null)[];
        createdAt: number;
        isFinished: boolean;
        team1Score?: number;
        team2Score?: number;
      }

      // Get games from database
      const dbGames = await getPlayerGames(playerName);

      // Transform dbGames (GameListItem[]) to PlayerGameSummary[]
      const dbGamesSummary: PlayerGameSummary[] = dbGames.map((g) => ({
        gameId: g.gameId,
        playerNames: g.playerNames,
        teamIds: g.playerNames.map((name) => g.teamAssignments[name] || null),
        createdAt: g.createdAt instanceof Date ? g.createdAt.getTime() : g.createdAt,
        isFinished: g.status === 'finished',
        team1Score: undefined, // Not available from GameListItem
        team2Score: undefined, // Not available from GameListItem
      }));

      // Also check in-memory games and transform to PlayerGameSummary
      const inMemoryGames: PlayerGameSummary[] = Array.from(games.values())
        .filter((game: GameState) => game.players.some((p: Player) => p.name === playerName))
        .map((game: GameState) => ({
          gameId: game.id,
          playerNames: game.players.map((p) => p.name),
          teamIds: game.players.map((p) => p.teamId),
          createdAt: gameCreationTimes.get(game.id) || Date.now(),
          isFinished: game.phase === 'game_over',
          team1Score: game.phase === 'game_over' ? game.teamScores.team1 : undefined,
          team2Score: game.phase === 'game_over' ? game.teamScores.team2 : undefined,
        }));

      // Merge results (prefer in-memory)
      const gameMapLocal = new Map<string, PlayerGameSummary>();
      dbGamesSummary.forEach((g) => gameMapLocal.set(g.gameId, g));
      inMemoryGames.forEach((g) => gameMapLocal.set(g.gameId, g));

      const playerGames = Array.from(gameMapLocal.values()).sort(
        (a, b) => b.createdAt - a.createdAt
      );

      res.json({
        playerName,
        games: playerGames,
        total: playerGames.length,
      });
    } catch (error) {
      console.error('Error fetching player games:', error);
      res.status(500).json({ error: 'Failed to fetch player games' });
    }
  });

  app.get('/api/players/online', async (req: Request, res: Response) => {
    try {
      const onlinePlayersData = await getOnlinePlayers();
      res.json({
        players: onlinePlayersData,
        total: onlinePlayersData.length,
      });
    } catch (error) {
      console.error('Error fetching online players:', error);
      res.status(500).json({ error: 'Failed to fetch online players' });
    }
  });

  app.get('/api/stats/:playerName', async (req: Request, res: Response) => {
    try {
      const { playerName } = req.params;
      const stats = await getPlayerStats(playerName);

      if (!stats) {
        return res.status(404).json({ error: 'Player not found' });
      }

      res.json(stats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      res.status(500).json({ error: 'Failed to fetch player stats' });
    }
  });

  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const excludeBots = req.query.excludeBots !== 'false'; // Default to true

      const leaderboard = await getLeaderboard(limit, excludeBots);
      res.json({
        players: leaderboard,
        total: leaderboard.length,
      });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });
}
