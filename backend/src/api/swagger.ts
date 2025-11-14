/**
 * Swagger API Documentation Configuration
 * Sprint 11: Security & Production - REST API Documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trick Card Game API',
      version: '2.0.0',
      description: 'REST API for the multiplayer trick card game',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: process.env.BACKEND_URL || 'https://api.trickcard.game',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        PlayerStats: {
          type: 'object',
          properties: {
            player_name: { type: 'string' },
            games_played: { type: 'integer' },
            games_won: { type: 'integer' },
            total_tricks_won: { type: 'integer' },
            total_points_scored: { type: 'integer' },
            highest_single_round_score: { type: 'integer' },
            betting_success_rate: { type: 'number' },
            trump_cards_played: { type: 'integer' },
            red_zeros_captured: { type: 'integer' },
            brown_zeros_captured: { type: 'integer' },
            win_rate: { type: 'number' },
            avg_tricks_per_game: { type: 'number' },
            avg_points_per_game: { type: 'number' },
          },
        },
        GameInfo: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            hostName: { type: 'string' },
            players: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  teamId: { type: 'integer', nullable: true },
                },
              },
            },
            phase: {
              type: 'string',
              enum: ['team_selection', 'betting', 'playing', 'scoring', 'game_over'],
            },
            round: { type: 'integer' },
            spectatorCount: { type: 'integer' },
            hasPassword: { type: 'boolean' },
            isRanked: { type: 'boolean' },
          },
        },
        LeaderboardEntry: {
          type: 'object',
          properties: {
            player_name: { type: 'string' },
            games_played: { type: 'integer' },
            games_won: { type: 'integer' },
            win_rate: { type: 'number' },
            total_points_scored: { type: 'integer' },
            avg_points_per_game: { type: 'number' },
          },
        },
        GameHistoryEntry: {
          type: 'object',
          properties: {
            game_id: { type: 'string' },
            player_name: { type: 'string' },
            team_id: { type: 'integer' },
            won: { type: 'boolean' },
            final_score: { type: 'integer' },
            tricks_won: { type: 'integer' },
            points_scored: { type: 'integer' },
            rounds_played: { type: 'integer' },
            ended_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: ['./src/api/swaggerRoutes.ts', './src/api/auth.ts'], // Files containing annotations
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Serve Swagger JSON
  app.get('/api/docs/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Trick Card Game API Docs',
  }));
}