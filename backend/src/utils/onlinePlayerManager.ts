/**
 * Online Player Management Utilities
 * Sprint 3 Phase 4: Extracted from index.ts
 *
 * Tracks and broadcasts online player status across the application.
 * Updates every 5 seconds with active players (30s activity threshold).
 */

import { Server } from 'socket.io';

/**
 * Online player tracking interface
 */
export interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

// Activity threshold: Players inactive for >30s are filtered out
const ACTIVITY_THRESHOLD = 30000; // 30 seconds

/**
 * Update online player status
 * Called when player joins, changes status, or performs an action
 *
 * @param socketId - Player's socket ID
 * @param playerName - Player's display name
 * @param status - Player's current status
 * @param gameId - Optional game ID if player is in a game
 * @param onlinePlayers - Online players storage Map
 */
export function updateOnlinePlayer(
  socketId: string,
  playerName: string,
  status: 'in_lobby' | 'in_game' | 'in_team_selection',
  gameId: string | undefined,
  onlinePlayers: Map<string, OnlinePlayer>
): void {
  onlinePlayers.set(socketId, {
    socketId,
    playerName,
    status,
    gameId,
    lastActivity: Date.now()
  });
}

/**
 * Broadcast online players list to all connected clients
 * Filters out inactive players (no activity in last 30 seconds)
 *
 * @param io - Socket.io server instance
 * @param onlinePlayers - Online players storage Map
 */
export function broadcastOnlinePlayers(
  io: Server,
  onlinePlayers: Map<string, OnlinePlayer>
): void {
  const now = Date.now();

  // Filter active players (active in last 30 seconds)
  const activePlayers = Array.from(onlinePlayers.values())
    .filter(p => now - p.lastActivity < ACTIVITY_THRESHOLD);

  // Broadcast to all connected clients
  io.emit('online_players_update', activePlayers);
}

/**
 * Start interval to broadcast online players every 5 seconds
 * Returns the interval ID so it can be cleared on shutdown
 *
 * @param io - Socket.io server instance
 * @param onlinePlayers - Online players storage Map
 * @returns Interval ID for cleanup
 */
export function startOnlinePlayersInterval(
  io: Server,
  onlinePlayers: Map<string, OnlinePlayer>
): NodeJS.Timeout {
  return setInterval(() => {
    broadcastOnlinePlayers(io, onlinePlayers);
  }, 5000); // Every 5 seconds
}
