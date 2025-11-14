/**
 * Swagger Annotated Routes
 * Sprint 11: REST API Documentation with OpenAPI/Swagger
 *
 * This file contains Swagger/OpenAPI annotations for all REST endpoints
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns basic health status of the API server
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 version:
 *                   type: string
 *                 activeGames:
 *                   type: integer
 *                 totalGames:
 *                   type: integer
 */

/**
 * @swagger
 * /api/games/lobby:
 *   get:
 *     summary: List active games
 *     description: Returns a list of all active games that can be joined or spectated
 *     tags:
 *       - Games
 *     responses:
 *       200:
 *         description: List of active games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameInfo'
 *                 total:
 *                   type: integer
 */

/**
 * @swagger
 * /api/games/recent:
 *   get:
 *     summary: List recent finished games
 *     description: Returns a list of recently finished games for replay
 *     tags:
 *       - Games
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of games to return
 *     responses:
 *       200:
 *         description: List of recent games
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 games:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 */

/**
 * @swagger
 * /api/games/{gameId}:
 *   get:
 *     summary: Get game details
 *     description: Returns detailed information about a specific game
 *     tags:
 *       - Games
 *     parameters:
 *       - in: path
 *         name: gameId
 *         required: true
 *         schema:
 *           type: string
 *         description: The game ID
 *     responses:
 *       200:
 *         description: Game details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Game not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/stats/{playerName}:
 *   get:
 *     summary: Get player statistics
 *     description: Returns comprehensive statistics for a specific player
 *     tags:
 *       - Players
 *     parameters:
 *       - in: path
 *         name: playerName
 *         required: true
 *         schema:
 *           type: string
 *         description: The player's username
 *     responses:
 *       200:
 *         description: Player statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlayerStats'
 *       404:
 *         description: Player not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get global leaderboard
 *     description: Returns the top players based on various metrics
 *     tags:
 *       - Players
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of players to return
 *       - in: query
 *         name: excludeBots
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to exclude bot players
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *                 total:
 *                   type: integer
 */

/**
 * @swagger
 * /api/player-history/{playerName}:
 *   get:
 *     summary: Get player game history
 *     description: Returns a list of games played by a specific player
 *     tags:
 *       - Players
 *     parameters:
 *       - in: path
 *         name: playerName
 *         required: true
 *         schema:
 *           type: string
 *         description: The player's username
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of games to return
 *     responses:
 *       200:
 *         description: Player's game history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 playerName:
 *                   type: string
 *                 games:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GameHistoryEntry'
 *       404:
 *         description: Player not found
 */

/**
 * @swagger
 * /api/players/online:
 *   get:
 *     summary: List online players
 *     description: Returns a list of currently online players
 *     tags:
 *       - Players
 *     responses:
 *       200:
 *         description: List of online players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 players:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       playerName:
 *                         type: string
 *                       gameId:
 *                         type: string
 *                         nullable: true
 *                       inGame:
 *                         type: boolean
 *                       lastActivity:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 */

export {}; // Make this a module