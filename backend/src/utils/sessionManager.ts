/**
 * Session Management Utilities
 * Sprint 3 Phase 4: Extracted from index.ts
 *
 * Handles player session creation, validation, and token generation
 * for reconnection support with 15-minute timeout.
 */

import crypto from 'crypto';
import { PlayerSession } from '../types/game';

// Session timeout: 15 minutes = 900000ms (for mobile AFK)
const SESSION_TIMEOUT = 900000;

/**
 * Generate a secure random session token
 * Uses crypto.randomBytes for cryptographic security
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and store a player session
 * Used when players join or create games
 *
 * @param gameId - Game identifier
 * @param playerId - Socket ID of the player
 * @param playerName - Player's display name
 * @param playerSessions - Session storage Map
 * @returns Created PlayerSession object
 */
export function createPlayerSession(
  gameId: string,
  playerId: string,
  playerName: string,
  playerSessions: Map<string, PlayerSession>
): PlayerSession {
  const token = generateSessionToken();
  const session: PlayerSession = {
    gameId,
    playerId,
    playerName,
    token,
    timestamp: Date.now(),
  };
  playerSessions.set(token, session);
  return session;
}

/**
 * Validate a session token
 * Checks if token exists and hasn't expired (15 minutes)
 *
 * @param token - Session token to validate
 * @param playerSessions - Session storage Map
 * @returns PlayerSession if valid, null if expired or not found
 */
export function validateSessionToken(
  token: string,
  playerSessions: Map<string, PlayerSession>
): PlayerSession | null {
  const session = playerSessions.get(token);
  if (!session) return null;

  // Check if session is expired (15 minutes)
  if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
    playerSessions.delete(token);
    return null;
  }

  return session;
}
