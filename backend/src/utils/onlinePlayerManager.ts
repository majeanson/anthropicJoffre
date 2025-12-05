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
  lookingForGame?: boolean;  // True if player is actively looking for teammates
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
  onlinePlayers: Map<string, OnlinePlayer>,
  lookingForGame?: boolean
): void {
  const existing = onlinePlayers.get(socketId);
  onlinePlayers.set(socketId, {
    socketId,
    playerName,
    status,
    gameId,
    lastActivity: Date.now(),
    // Preserve LFG status if not explicitly set, clear if joining a game
    lookingForGame: lookingForGame !== undefined
      ? lookingForGame
      : (status === 'in_lobby' ? existing?.lookingForGame : false)
  });
}

/**
 * Set "Looking for Game" status for a player
 */
export function setLookingForGame(
  socketId: string,
  lookingForGame: boolean,
  onlinePlayers: Map<string, OnlinePlayer>
): boolean {
  const player = onlinePlayers.get(socketId);
  if (!player) return false;

  // Can only set LFG when in lobby
  if (player.status !== 'in_lobby') return false;

  player.lookingForGame = lookingForGame;
  player.lastActivity = Date.now();
  return true;
}

/**
 * Get list of players looking for game
 */
export function getPlayersLookingForGame(
  onlinePlayers: Map<string, OnlinePlayer>
): OnlinePlayer[] {
  const now = Date.now();
  return Array.from(onlinePlayers.values())
    .filter(p => p.lookingForGame === true)
    .filter(p => p.status === 'in_lobby')
    .filter(p => now - p.lastActivity < ACTIVITY_THRESHOLD)
    .filter(p => !p.playerName.startsWith('Bot '));
}

/**
 * Broadcast online players list to all connected clients
 * Filters out inactive players (no activity in last 30 seconds)
 * Also filters out bots (defense-in-depth - bots should never be added, but filter here as backup)
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
  // Also filter out bots as defense-in-depth (bots should not be added to the map, but filter here as backup)
  const activePlayers = Array.from(onlinePlayers.values())
    .filter(p => now - p.lastActivity < ACTIVITY_THRESHOLD)
    .filter(p => !p.playerName.startsWith('Bot '));

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
