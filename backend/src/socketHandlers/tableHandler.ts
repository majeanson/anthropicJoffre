/**
 * Table Handler - Manages lounge tables (pre-game gathering spots)
 *
 * Tables are the social hub where players gather before games.
 * Unlike the old "Create Game" flow, tables let people hang out,
 * chat, and decide when to start playing together.
 *
 * CRITICAL INTEGRATION:
 * - Tables create actual GameState objects when starting
 * - Players transition from table → game seamlessly
 * - Status updates cascade to lounge
 */

import { Server, Socket } from 'socket.io';
import logger from '../utils/logger.js';
import {
  LoungeTable,
  TableSeat,
  CreateTablePayload,
  JoinTablePayload,
  LeaveTablePayload,
  SetSeatPayload,
  AddBotToTablePayload,
  RemoveFromSeatPayload,
  SetReadyPayload,
  StartTableGamePayload,
  ChatMessage,
  GameState,
  Player,
  PlayerSession,
} from '../types/game.js';
import { getLoungePlayerSocketId, removePlayerFromLoungeVoice, updatePlayerStatus } from './loungeHandler.js';

// Generate unique ID (same pattern as elsewhere in codebase)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

function generateGameId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// In-memory storage for tables
const tables = new Map<string, LoungeTable>();

// Track which table each player is at
const playerTables = new Map<string, string>(); // playerName -> tableId

// Track disconnect timeouts for table players
const tableDisconnectTimeouts = new Map<string, NodeJS.Timeout>(); // playerName -> timeout

// Lock for seat assignment to prevent race conditions
// Format: "tableId:position" -> timestamp when locked
const seatLocks = new Map<string, number>();
const SEAT_LOCK_TIMEOUT = 5000; // 5 seconds max lock time

// Helper to acquire seat lock (returns true if acquired)
function acquireSeatLock(tableId: string, position: number): boolean {
  const lockKey = `${tableId}:${position}`;
  const now = Date.now();

  // Clean up stale lock if exists
  const existingLock = seatLocks.get(lockKey);
  if (existingLock && now - existingLock > SEAT_LOCK_TIMEOUT) {
    seatLocks.delete(lockKey);
  }

  // Try to acquire
  if (seatLocks.has(lockKey)) {
    return false; // Already locked
  }

  seatLocks.set(lockKey, now);
  return true;
}

// Release seat lock
function releaseSeatLock(tableId: string, position: number): void {
  seatLocks.delete(`${tableId}:${position}`);
}

// Disconnect grace period (30 seconds)
const TABLE_DISCONNECT_TIMEOUT = 30000;

// Orphan table check interval (5 minutes)
const ORPHAN_CHECK_INTERVAL = 5 * 60 * 1000;
// How long a table can be in_game without a valid game before cleanup (10 minutes)
const ORPHAN_TABLE_TIMEOUT = 10 * 60 * 1000;

// Track when tables entered in_game state
const tableGameStartTimes = new Map<string, number>(); // tableId -> timestamp

// Bot name generator
const BOT_NAMES = ['Bot Alphonse', 'Bot Bertha', 'Bot Claude', 'Bot Diane'];

function generateBotName(existingNames: string[]): string {
  for (const name of BOT_NAMES) {
    if (!existingNames.includes(name)) {
      return name;
    }
  }
  return `Bot ${Math.floor(Math.random() * 1000)}`;
}

function createEmptySeats(): TableSeat[] {
  return [
    { position: 0, teamId: 1, playerName: null, isBot: false, isReady: false },
    { position: 1, teamId: 2, playerName: null, isBot: false, isReady: false },
    { position: 2, teamId: 1, playerName: null, isBot: false, isReady: false },
    { position: 3, teamId: 2, playerName: null, isBot: false, isReady: false },
  ];
}

function getTablePlayerNames(table: LoungeTable): string[] {
  return table.seats
    .filter(s => s.playerName !== null)
    .map(s => s.playerName as string);
}

function broadcastTableUpdate(io: Server, table: LoungeTable): void {
  // Broadcast to all players at this table
  io.to(`table:${table.id}`).emit('table_updated', { table });
  // Also broadcast to lounge for the tables list
  io.to('lounge').emit('lounge_table_updated', { table });
}

/**
 * Clean up a table completely, including making all sockets leave the room.
 * Call this before deleting a table from the tables map.
 */
async function cleanupTableRoom(io: Server, tableId: string): Promise<void> {
  const roomName = `table:${tableId}`;
  try {
    // Get all sockets in this room and make them leave
    const socketsInRoom = await io.in(roomName).fetchSockets();
    for (const socket of socketsInRoom) {
      socket.leave(roomName);
    }
    logger.debug(`Cleaned up table room ${roomName} (${socketsInRoom.length} sockets removed)`);
  } catch (error) {
    logger.warn(`Failed to clean up table room ${roomName}:`, error);
  }
}

function broadcastActivity(
  io: Server,
  type: string,
  playerName: string,
  data: Record<string, unknown>
): void {
  io.to('lounge').emit('lounge_activity', {
    id: generateId(),
    type,
    timestamp: Date.now(),
    playerName,
    data,
  });
}

/**
 * Dependencies needed by table handler to create games
 */
export interface TableHandlerDependencies {
  games: Map<string, GameState>;
  io: Server;
  createSession: (playerName: string, socketId: string, gameId: string, isBot: boolean) => Promise<PlayerSession>;
  updateOnlinePlayer: (socketId: string, playerName: string, status: 'in_lobby' | 'in_game' | 'in_team_selection', gameId?: string) => void;
  emitGameUpdate: (gameId: string, gameState: GameState) => void;
}

// Store dependencies for use in handlers
let deps: TableHandlerDependencies | null = null;

export function setupTableHandler(io: Server, socket: Socket, dependencies?: TableHandlerDependencies): void {
  // Store dependencies if provided
  if (dependencies) {
    deps = dependencies;
  }

  // Get player name from socket.data (set during authentication/connection)
  const getPlayerName = (): string => socket.data.playerName || 'Anonymous';

  // ============================================================================
  // create_table - Create a new table
  // ============================================================================
  socket.on('create_table', (payload: CreateTablePayload) => {
    try {
      const playerName = getPlayerName();
      const { name, settings } = payload;

      // Validate
      if (!name || name.trim().length === 0) {
        socket.emit('error', { message: 'Table name is required', context: 'create_table' });
        return;
      }

      if (name.length > 30) {
        socket.emit('error', { message: 'Table name too long (max 30 chars)', context: 'create_table' });
        return;
      }

      // Check if player is already at a table
      if (playerTables.has(playerName)) {
        socket.emit('error', { message: 'You are already at a table', context: 'create_table' });
        return;
      }

      const tableId = generateId().slice(0, 8).toUpperCase();
      const seats = createEmptySeats();

      // Host sits at position 0 (Team 1)
      seats[0].playerName = playerName;
      seats[0].isReady = false;

      const table: LoungeTable = {
        id: tableId,
        name: name.trim(),
        hostName: playerName,
        createdAt: Date.now(),
        seats,
        settings: {
          persistenceMode: settings?.persistenceMode || 'casual',
          allowBots: settings?.allowBots !== false,
          isPrivate: settings?.isPrivate || false,
          maxSpectators: settings?.maxSpectators || 10,
        },
        status: 'gathering',
        chatMessages: [],
      };

      tables.set(tableId, table);
      playerTables.set(playerName, tableId);

      // Join socket room for this table
      socket.join(`table:${tableId}`);

      // Remove from lounge voice if they were in it
      removePlayerFromLoungeVoice(io, playerName);

      logger.info(`Table created: ${tableId} by ${playerName}`);

      socket.emit('table_created', { table });
      broadcastTableUpdate(io, table);
      broadcastActivity(io, 'table_created', playerName, {
        tableName: table.name,
        tableId: table.id,
      });
    } catch (error) {
      logger.error('Error creating table:', error);
      socket.emit('error', { message: 'Failed to create table', context: 'create_table' });
    }
  });

  // ============================================================================
  // join_table - Join an existing table (takes first available seat)
  // ============================================================================
  socket.on('join_table', (payload: JoinTablePayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, seatPosition } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'join_table' });
        return;
      }

      if (table.status !== 'gathering' && table.status !== 'post_game') {
        socket.emit('error', { message: 'Table is not accepting players', context: 'join_table' });
        return;
      }

      // Check if table is private (only allow joining via invite)
      if (table.settings.isPrivate) {
        // Allow if already at table or if host (returning after disconnect)
        const isAtTable = table.seats.some(s => s.playerName === playerName);
        const isHost = table.hostName === playerName;
        if (!isAtTable && !isHost) {
          socket.emit('error', { message: 'This table is private. You need an invite to join.', context: 'join_table' });
          return;
        }
      }

      // Check if player is already at a different table
      const currentTableId = playerTables.get(playerName);
      if (currentTableId && currentTableId !== tableId) {
        socket.emit('error', { message: 'You are already at another table', context: 'join_table' });
        return;
      }

      // Check if already at this table
      if (table.seats.some(s => s.playerName === playerName)) {
        // Already seated - just join the socket room
        socket.join(`table:${tableId}`);
        socket.emit('table_joined', { table });
        return;
      }

      // Find an empty seat with atomic lock to prevent race conditions
      let targetSeat: TableSeat | undefined;
      if (seatPosition !== undefined) {
        targetSeat = table.seats.find(s => s.position === seatPosition && s.playerName === null && !s.isBot);
      } else {
        targetSeat = table.seats.find(s => s.playerName === null && !s.isBot);
      }

      if (!targetSeat) {
        socket.emit('error', { message: 'No available seats', context: 'join_table' });
        return;
      }

      // Try to acquire lock on this seat to prevent race conditions
      if (!acquireSeatLock(tableId, targetSeat.position)) {
        socket.emit('error', { message: 'Seat is being claimed by another player', context: 'join_table' });
        return;
      }

      // Double-check seat is still empty after acquiring lock
      if (targetSeat.playerName !== null || targetSeat.isBot) {
        releaseSeatLock(tableId, targetSeat.position);
        socket.emit('error', { message: 'Seat was just taken', context: 'join_table' });
        return;
      }

      targetSeat.playerName = playerName;
      targetSeat.isReady = false;
      playerTables.set(playerName, tableId);

      // Release the lock now that seat is assigned
      releaseSeatLock(tableId, targetSeat.position);

      socket.join(`table:${tableId}`);

      // Remove from lounge voice if they were in it
      removePlayerFromLoungeVoice(io, playerName);

      // Update player status in lounge to 'at_table'
      updatePlayerStatus(io, playerName, 'at_table', undefined, tableId);

      // Clear any disconnect timeout for this player
      const timeout = tableDisconnectTimeouts.get(playerName);
      if (timeout) {
        clearTimeout(timeout);
        tableDisconnectTimeouts.delete(playerName);
      }

      // Add system message
      table.chatMessages.push({
        playerId: 'system',
        playerName: 'System',
        teamId: null,
        message: `${playerName} joined the table`,
        timestamp: Date.now(),
      });

      logger.info(`${playerName} joined table ${tableId} at position ${targetSeat.position}`);

      socket.emit('table_joined', { table });
      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error joining table:', error);
      socket.emit('error', { message: 'Failed to join table', context: 'join_table' });
    }
  });

  // ============================================================================
  // sit_at_table - Sit at a specific seat (for players already at table)
  // ============================================================================
  socket.on('sit_at_table', (payload: { tableId: string; position: number }) => {
    try {
      const playerName = getPlayerName();
      const { tableId, position } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'sit_at_table' });
        return;
      }

      // Check if player is already seated somewhere
      const currentSeat = table.seats.find(s => s.playerName === playerName);
      if (currentSeat) {
        socket.emit('error', { message: 'You are already seated', context: 'sit_at_table' });
        return;
      }

      const targetSeat = table.seats.find(s => s.position === position);
      if (!targetSeat) {
        socket.emit('error', { message: 'Invalid seat position', context: 'sit_at_table' });
        return;
      }

      if (targetSeat.playerName !== null || targetSeat.isBot) {
        socket.emit('error', { message: 'Seat is occupied', context: 'sit_at_table' });
        return;
      }

      // Try to acquire lock on this seat to prevent race conditions
      if (!acquireSeatLock(tableId, position)) {
        socket.emit('error', { message: 'Seat is being claimed by another player', context: 'sit_at_table' });
        return;
      }

      // Double-check seat is still empty after acquiring lock
      if (targetSeat.playerName !== null || targetSeat.isBot) {
        releaseSeatLock(tableId, position);
        socket.emit('error', { message: 'Seat was just taken', context: 'sit_at_table' });
        return;
      }

      // Sit down
      targetSeat.playerName = playerName;
      targetSeat.isReady = false;
      playerTables.set(playerName, tableId);

      // Release the lock now that seat is assigned
      releaseSeatLock(tableId, position);

      // Join socket room if not already
      socket.join(`table:${tableId}`);

      logger.info(`${playerName} sat at position ${position} at table ${tableId}`);

      socket.emit('seat_taken', { tableId, position });
      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error sitting at table:', error);
      socket.emit('error', { message: 'Failed to sit at table', context: 'sit_at_table' });
    }
  });

  // ============================================================================
  // stand_from_table - Stand up from current seat (stay at table but not seated)
  // ============================================================================
  socket.on('stand_from_table', (payload: { tableId: string }) => {
    try {
      const playerName = getPlayerName();
      const { tableId } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'stand_from_table' });
        return;
      }

      const seat = table.seats.find(s => s.playerName === playerName);
      if (!seat) {
        socket.emit('error', { message: 'You are not seated', context: 'stand_from_table' });
        return;
      }

      // Can't stand if you're the only player and host
      const humanPlayers = table.seats.filter(s => s.playerName && !s.isBot);
      if (humanPlayers.length === 1 && table.hostName === playerName) {
        socket.emit('error', { message: 'Host cannot stand up alone. Leave the table instead.', context: 'stand_from_table' });
        return;
      }

      // Stand up (but stay at table tracking)
      seat.playerName = null;
      seat.isReady = false;
      // Note: Keep playerTables entry - they're still "at" the table, just not seated

      // Reset table status if was ready, and reset ALL players' ready state
      const wasReady = table.status === 'ready';
      if (wasReady) {
        table.status = 'gathering';
        // Reset all human players' ready state when table goes back to gathering
        table.seats.forEach(s => {
          if (s.playerName && !s.isBot) {
            s.isReady = false;
          }
        });
        // Add system message to explain the reset
        table.chatMessages.push({
          playerId: 'system',
          playerName: 'System',
          teamId: null,
          message: `${playerName} stood up - ready status reset`,
          timestamp: Date.now(),
        });
      }

      logger.info(`${playerName} stood up at table ${tableId}`);

      socket.emit('stood_up', { tableId });
      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error standing from table:', error);
      socket.emit('error', { message: 'Failed to stand from table', context: 'stand_from_table' });
    }
  });

  // ============================================================================
  // leave_table - Leave a table entirely
  // ============================================================================
  socket.on('leave_table', (payload: LeaveTablePayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'leave_table' });
        return;
      }

      const seat = table.seats.find(s => s.playerName === playerName);
      if (!seat) {
        // Not seated, just leave the socket room
        playerTables.delete(playerName);
        socket.leave(`table:${tableId}`);
        socket.emit('table_left', { tableId });
        return;
      }

      // Remove player from seat
      seat.playerName = null;
      seat.isReady = false;
      playerTables.delete(playerName);

      socket.leave(`table:${tableId}`);

      // Update player status in lounge back to 'in_lounge'
      updatePlayerStatus(io, playerName, 'in_lounge', undefined, undefined);

      // Add system message
      table.chatMessages.push({
        playerId: 'system',
        playerName: 'System',
        teamId: null,
        message: `${playerName} left the table`,
        timestamp: Date.now(),
      });

      // Check remaining human players (exclude bots)
      const remainingHumans = table.seats.filter(s => s.playerName !== null && !s.isBot);

      // If no human players remain, delete the table (bots can't play alone)
      if (remainingHumans.length === 0) {
        io.to(`table:${tableId}`).emit('table_deleted', { tableId });
        io.to('lounge').emit('lounge_table_deleted', { tableId });
        // Clean up socket room before deleting table
        cleanupTableRoom(io, tableId);
        tables.delete(tableId);
        tableGameStartTimes.delete(tableId);
        logger.info(`Table ${tableId} deleted (only bots remaining)`);
        return;
      }

      // If host left, transfer to another human player
      if (table.hostName === playerName) {
        table.hostName = remainingHumans[0].playerName as string;
        table.chatMessages.push({
          playerId: 'system',
          playerName: 'System',
          teamId: null,
          message: `${table.hostName} is now the host`,
          timestamp: Date.now(),
        });
      }

      // Reset status if was ready
      if (table.status === 'ready') {
        table.status = 'gathering';
        // Reset all human players' ready state when table goes back to gathering
        table.seats.forEach(s => {
          if (s.playerName && !s.isBot) {
            s.isReady = false;
          }
        });
      }

      logger.info(`${playerName} left table ${tableId}`);

      socket.emit('table_left', { tableId });
      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error leaving table:', error);
      socket.emit('error', { message: 'Failed to leave table', context: 'leave_table' });
    }
  });

  // ============================================================================
  // set_seat - Change seat position (move from current to new seat)
  // ============================================================================
  socket.on('set_seat', (payload: SetSeatPayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, seatPosition } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'set_seat' });
        return;
      }

      const currentSeat = table.seats.find(s => s.playerName === playerName);
      if (!currentSeat) {
        socket.emit('error', { message: 'You are not at this table', context: 'set_seat' });
        return;
      }

      const targetSeat = table.seats.find(s => s.position === seatPosition);
      if (!targetSeat) {
        socket.emit('error', { message: 'Invalid seat position', context: 'set_seat' });
        return;
      }

      if (targetSeat.playerName !== null || targetSeat.isBot) {
        socket.emit('error', { message: 'Seat is occupied', context: 'set_seat' });
        return;
      }

      // Move player
      currentSeat.playerName = null;
      currentSeat.isReady = false;
      targetSeat.playerName = playerName;
      targetSeat.isReady = false;

      logger.info(`${playerName} moved to seat ${seatPosition} at table ${tableId}`);

      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error changing seat:', error);
      socket.emit('error', { message: 'Failed to change seat', context: 'set_seat' });
    }
  });

  // ============================================================================
  // add_bot_to_table - Add a bot to an empty seat (host only)
  // ============================================================================
  socket.on('add_bot_to_table', (payload: AddBotToTablePayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, seatPosition, difficulty } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'add_bot_to_table' });
        return;
      }

      if (table.hostName !== playerName) {
        socket.emit('error', { message: 'Only the host can add bots', context: 'add_bot_to_table' });
        return;
      }

      if (!table.settings.allowBots) {
        socket.emit('error', { message: 'Bots are not allowed at this table', context: 'add_bot_to_table' });
        return;
      }

      const targetSeat = table.seats.find(s => s.position === seatPosition);
      if (!targetSeat) {
        socket.emit('error', { message: 'Invalid seat position', context: 'add_bot_to_table' });
        return;
      }

      if (targetSeat.playerName !== null || targetSeat.isBot) {
        socket.emit('error', { message: 'Seat is occupied', context: 'add_bot_to_table' });
        return;
      }

      // Validate bot difficulty
      const validDifficulties = ['easy', 'medium', 'hard'];
      const botDifficulty = validDifficulties.includes(difficulty) ? difficulty : 'medium';

      const existingNames = getTablePlayerNames(table);
      const botName = generateBotName(existingNames);

      targetSeat.playerName = botName;
      targetSeat.isBot = true;
      targetSeat.botDifficulty = botDifficulty;
      targetSeat.isReady = true; // Bots are always ready

      // Check if table is now ready
      const allFilled = table.seats.every(s => s.playerName !== null);
      const allReady = table.seats.every(s => s.isReady);
      if (allFilled && allReady) {
        table.status = 'ready';
      }

      logger.info(`Bot ${botName} added to table ${tableId} at position ${seatPosition}`);

      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error adding bot:', error);
      socket.emit('error', { message: 'Failed to add bot', context: 'add_bot_to_table' });
    }
  });

  // ============================================================================
  // remove_from_seat - Remove player/bot from seat (host only)
  // ============================================================================
  socket.on('remove_from_seat', (payload: RemoveFromSeatPayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, seatPosition } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'remove_from_seat' });
        return;
      }

      if (table.hostName !== playerName) {
        socket.emit('error', { message: 'Only the host can remove players', context: 'remove_from_seat' });
        return;
      }

      const targetSeat = table.seats.find(s => s.position === seatPosition);
      if (!targetSeat) {
        socket.emit('error', { message: 'Invalid seat position', context: 'remove_from_seat' });
        return;
      }

      if (targetSeat.playerName === null) {
        socket.emit('error', { message: 'Seat is empty', context: 'remove_from_seat' });
        return;
      }

      // Can't remove the host
      if (targetSeat.playerName === table.hostName) {
        socket.emit('error', { message: 'Cannot remove the host', context: 'remove_from_seat' });
        return;
      }

      const removedName = targetSeat.playerName;
      const wasBot = targetSeat.isBot;

      // If it's a human player, notify them
      if (!wasBot && removedName) {
        playerTables.delete(removedName);

        // Update player status in lounge back to 'in_lounge'
        updatePlayerStatus(io, removedName, 'in_lounge', undefined, undefined);

        // Broadcast to table room
        io.to(`table:${tableId}`).emit('player_removed_from_table', {
          tableId,
          playerName: removedName,
        });

        // Also send directly to the removed player's socket (they may have left the room)
        const removedSocketId = getLoungePlayerSocketId(removedName);
        if (removedSocketId) {
          io.to(removedSocketId).emit('player_removed_from_table', {
            tableId,
            playerName: removedName,
          });
        }
      }

      targetSeat.playerName = null;
      targetSeat.isBot = false;
      targetSeat.botDifficulty = undefined;
      targetSeat.isReady = false;

      // Reset status if was ready, and reset ALL players' ready state
      if (table.status === 'ready') {
        table.status = 'gathering';
        // Reset all human players' ready state when table goes back to gathering
        table.seats.forEach(s => {
          if (s.playerName && !s.isBot) {
            s.isReady = false;
          }
        });
      }

      // Add system message
      table.chatMessages.push({
        playerId: 'system',
        playerName: 'System',
        teamId: null,
        message: `${removedName} was removed from the table`,
        timestamp: Date.now(),
      });

      logger.info(`${removedName} removed from table ${tableId}`);

      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error removing from seat:', error);
      socket.emit('error', { message: 'Failed to remove from seat', context: 'remove_from_seat' });
    }
  });

  // ============================================================================
  // set_ready - Toggle ready status
  // ============================================================================
  socket.on('set_ready', (payload: SetReadyPayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, isReady } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'set_ready' });
        return;
      }

      const seat = table.seats.find(s => s.playerName === playerName);
      if (!seat) {
        socket.emit('error', { message: 'You are not at this table', context: 'set_ready' });
        return;
      }

      seat.isReady = isReady;

      // Check if all seats are filled and ready
      const allFilled = table.seats.every(s => s.playerName !== null);
      const allReady = table.seats.every(s => s.isReady);

      if (allFilled && allReady) {
        table.status = 'ready';
      } else {
        table.status = 'gathering';
      }

      logger.info(`${playerName} set ready=${isReady} at table ${tableId}`);

      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error setting ready:', error);
      socket.emit('error', { message: 'Failed to set ready', context: 'set_ready' });
    }
  });

  // ============================================================================
  // start_table_game - Start the game (host only) - CREATES ACTUAL GAME
  // ============================================================================
  socket.on('start_table_game', async (payload: StartTableGamePayload) => {
    const { tableId } = payload;

    try {
      const playerName = getPlayerName();

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'start_table_game' });
        return;
      }

      if (table.hostName !== playerName) {
        socket.emit('error', { message: 'Only the host can start the game', context: 'start_table_game' });
        return;
      }

      // Check all seats are filled
      const allFilled = table.seats.every(s => s.playerName !== null);
      if (!allFilled) {
        socket.emit('error', { message: 'All seats must be filled to start', context: 'start_table_game' });
        return;
      }

      // Check all are ready
      const allReady = table.seats.every(s => s.isReady);
      if (!allReady) {
        socket.emit('error', { message: 'All players must be ready', context: 'start_table_game' });
        return;
      }

      // Check minimum human players (at least 1 human required, 2 recommended for proper gameplay)
      const humanCount = table.seats.filter(s => s.playerName && !s.isBot).length;
      if (humanCount < 1) {
        socket.emit('error', { message: 'At least one human player is required', context: 'start_table_game' });
        return;
      }

      // Check if we have dependencies to create a game
      if (!deps) {
        logger.error('Table handler dependencies not set - cannot create game');
        socket.emit('error', { message: 'Game system unavailable', context: 'start_table_game' });
        return;
      }

      // Create the actual game
      const gameId = generateGameId();
      const hasBots = table.seats.some(s => s.isBot);

      // Create players from seats
      const players: Player[] = table.seats.map((seat, index) => ({
        id: seat.isBot ? `bot-${seat.position}-${Date.now()}` : `player-${seat.position}`,
        name: seat.playerName!,
        teamId: seat.teamId as 1 | 2,
        hand: [],
        tricksWon: 0,
        pointsWon: 0,
        isBot: seat.isBot,
        botDifficulty: seat.botDifficulty,
      }));

      // Create game state
      const gameState: GameState = {
        id: gameId,
        creatorId: socket.id,
        persistenceMode: table.settings.persistenceMode || 'casual',
        isBotGame: hasBots,
        phase: 'team_selection', // Start at team selection so they can verify teams
        players,
        currentBets: [],
        highestBet: null,
        trump: null,
        currentTrick: [],
        previousTrick: null,
        currentPlayerIndex: 0,
        dealerIndex: 0,
        teamScores: { team1: 0, team2: 0 },
        roundNumber: 1,
        roundHistory: [],
        currentRoundTricks: [],
        tableId, // Link back to table
      };

      // Store game in games map
      deps.games.set(gameId, gameState);

      // Update table status
      table.status = 'in_game';
      table.gameId = gameId;
      tableGameStartTimes.set(tableId, Date.now());

      // Have all human players join the game room
      for (const seat of table.seats) {
        if (!seat.isBot && seat.playerName) {
          // Create session for each player
          try {
            await deps.createSession(seat.playerName, socket.id, gameId, false);
          } catch (err) {
            logger.warn(`Failed to create session for ${seat.playerName}:`, err);
          }

          // Update online player status
          deps.updateOnlinePlayer(socket.id, seat.playerName, 'in_team_selection', gameId);
        }
      }

      // Join all table sockets to the game room
      // Join all table sockets to the game room and leave the table room
      // Important: Leave table room to prevent receiving duplicate events
      const tableRoom = io.sockets.adapter.rooms.get(`table:${tableId}`);
      if (tableRoom) {
        for (const socketId of tableRoom) {
          const playerSocket = io.sockets.sockets.get(socketId);
          if (playerSocket) {
            playerSocket.join(gameId);
            playerSocket.leave(`table:${tableId}`);
          }
        }
      }

      logger.info(`Game ${gameId} created from table ${tableId}`);

      // Emit to table players that the game has started
      // This is the event the frontend expects!
      io.to(`table:${tableId}`).emit('table_game_started', {
        gameId,
        tableId,
        gameState,
      });

      // Also emit game state to game room
      deps.emitGameUpdate(gameId, gameState);

      // Update lounge with table status
      broadcastTableUpdate(io, table);
      broadcastActivity(io, 'table_started', playerName, {
        tableName: table.name,
        tableId: table.id,
        gameId,
      });

    } catch (error) {
      logger.error('Error starting table game:', error);

      // Rollback table status if it was changed
      const table = tables.get(tableId);
      if (table && table.status === 'in_game') {
        table.status = 'ready';
        table.gameId = undefined;
        broadcastTableUpdate(io, table);
      }

      socket.emit('error', { message: 'Failed to start game', context: 'start_table_game' });
    }
  });

  // ============================================================================
  // table_chat - Send chat message to table
  // ============================================================================
  socket.on('table_chat', (payload: { tableId: string; message: string }) => {
    try {
      const playerName = getPlayerName();
      const { tableId, message } = payload;

      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'table_chat' });
        return;
      }

      const seat = table.seats.find(s => s.playerName === playerName);
      if (!seat) {
        socket.emit('error', { message: 'You are not at this table', context: 'table_chat' });
        return;
      }

      const chatMessage: ChatMessage = {
        playerId: socket.id,
        playerName,
        teamId: seat.teamId,
        message: message.slice(0, 500), // Limit message length
        timestamp: Date.now(),
      };

      table.chatMessages.push(chatMessage);

      // Keep only last 100 messages
      if (table.chatMessages.length > 100) {
        table.chatMessages = table.chatMessages.slice(-100);
      }

      io.to(`table:${tableId}`).emit('table_chat_message', { message: chatMessage });
    } catch (error) {
      logger.error('Error sending table chat:', error);
      socket.emit('error', { message: 'Failed to send message', context: 'table_chat' });
    }
  });

  // ============================================================================
  // get_tables - Get all public tables (for lounge view)
  // ============================================================================
  socket.on('get_tables', () => {
    try {
      const tableList = Array.from(tables.values())
        .filter(t => !t.settings.isPrivate)
        .map(t => ({
          ...t,
          chatMessages: [], // Don't send chat history in list
        }));
      socket.emit('tables_list', { tables: tableList });
    } catch (error) {
      logger.error('Error getting tables:', error);
      socket.emit('error', { message: 'Failed to get tables', context: 'get_tables' });
    }
  });

  // ============================================================================
  // get_table - Get specific table details
  // ============================================================================
  socket.on('get_table', (payload: { tableId: string }) => {
    try {
      const playerName = getPlayerName();
      const { tableId } = payload;
      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'get_table' });
        return;
      }

      // Check if table is private and player has access
      if (table.settings.isPrivate) {
        const isAtTable = table.seats.some(s => s.playerName === playerName);
        const isHost = table.hostName === playerName;

        if (!isAtTable && !isHost) {
          socket.emit('error', { message: 'This table is private', context: 'get_table' });
          return;
        }
      }

      socket.emit('table_details', { table });
    } catch (error) {
      logger.error('Error getting table:', error);
      socket.emit('error', { message: 'Failed to get table', context: 'get_table' });
    }
  });

  // ============================================================================
  // disconnect - Handle player disconnect with grace period
  // ============================================================================
  socket.on('disconnect', () => {
    const playerName = getPlayerName();
    const tableId = playerTables.get(playerName);

    if (!tableId) return;

    const table = tables.get(tableId);
    if (!table) {
      playerTables.delete(playerName);
      return;
    }

    const seat = table.seats.find(s => s.playerName === playerName);
    if (!seat) {
      playerTables.delete(playerName);
      return;
    }

    // If table is in game, don't remove - game handler handles it
    if (table.status === 'in_game') {
      return;
    }

    // Set a timeout to remove player after grace period
    const timeout = setTimeout(() => {
      tableDisconnectTimeouts.delete(playerName);

      // Re-check if player is still disconnected
      const currentTable = tables.get(tableId);
      if (!currentTable) return;

      const currentSeat = currentTable.seats.find(s => s.playerName === playerName);
      if (!currentSeat) return;

      // Remove player
      currentSeat.playerName = null;
      currentSeat.isReady = false;
      playerTables.delete(playerName);

      // Update lounge status back to 'in_lounge' (they disconnected from table)
      // Note: They may be fully offline, but updatePlayerStatus handles that gracefully
      updatePlayerStatus(io, playerName, 'in_lounge', undefined, undefined);

      // Add system message
      currentTable.chatMessages.push({
        playerId: 'system',
        playerName: 'System',
        teamId: null,
        message: `${playerName} disconnected`,
        timestamp: Date.now(),
      });

      // Check remaining human players (exclude bots)
      const remainingHumans = currentTable.seats.filter(s => s.playerName !== null && !s.isBot);

      // If no human players remain, delete the table (bots can't play alone)
      if (remainingHumans.length === 0) {
        io.to(`table:${tableId}`).emit('table_deleted', { tableId });
        io.to('lounge').emit('lounge_table_deleted', { tableId });
        // Clean up socket room before deleting table
        cleanupTableRoom(io, tableId);
        tables.delete(tableId);
        tableGameStartTimes.delete(tableId);
        logger.info(`Table ${tableId} deleted (all humans disconnected, only bots remaining)`);
        return;
      }

      // If host left, transfer to another human player
      if (currentTable.hostName === playerName) {
        currentTable.hostName = remainingHumans[0].playerName as string;
        currentTable.chatMessages.push({
          playerId: 'system',
          playerName: 'System',
          teamId: null,
          message: `${currentTable.hostName} is now the host`,
          timestamp: Date.now(),
        });
      }

      // Reset status if was ready
      if (currentTable.status === 'ready') {
        currentTable.status = 'gathering';
        // Reset all human players' ready state when table goes back to gathering
        currentTable.seats.forEach(s => {
          if (s.playerName && !s.isBot) {
            s.isReady = false;
          }
        });
      }

      broadcastTableUpdate(io, currentTable);
      logger.info(`${playerName} removed from table ${tableId} after disconnect timeout`);
    }, TABLE_DISCONNECT_TIMEOUT);

    tableDisconnectTimeouts.set(playerName, timeout);

    // Add pending disconnect message
    table.chatMessages.push({
      playerId: 'system',
      playerName: 'System',
      teamId: null,
      message: `${playerName} disconnected (waiting to reconnect...)`,
      timestamp: Date.now(),
    });

    broadcastTableUpdate(io, table);
  });
}

// ============================================================================
// Exported helper functions for other handlers
// ============================================================================

export function getTable(tableId: string): LoungeTable | undefined {
  return tables.get(tableId);
}

export function setTableGameId(tableId: string, gameId: string): void {
  const table = tables.get(tableId);
  if (table) {
    table.gameId = gameId;
    table.status = 'in_game';
  }
}

export function returnTableToPostGame(io: Server, tableId: string): void {
  const table = tables.get(tableId);
  if (table) {
    const previousGameId = table.gameId;
    table.status = 'post_game';
    table.gameId = undefined;
    tableGameStartTimes.delete(tableId); // Clean up tracking

    // Reset ready states for human players
    table.seats.forEach(s => {
      if (!s.isBot) {
        s.isReady = false;
      }
    });

    // Emit table_game_finished to table room so frontend knows to transition back
    io.to(`table:${tableId}`).emit('table_game_finished', {
      tableId,
      previousGameId,
    });

    broadcastTableUpdate(io, table);
    broadcastActivity(io, 'game_finished', table.hostName, {
      tableName: table.name,
      tableId: table.id,
    });

    logger.info(`Table ${tableId} (${table.name}) returned to post_game state`);
  }
}

export function getAllTables(): LoungeTable[] {
  return Array.from(tables.values());
}

export function getPlayerTable(playerName: string): string | undefined {
  return playerTables.get(playerName);
}

export function clearPlayerFromTable(playerName: string): void {
  const tableId = playerTables.get(playerName);
  if (tableId) {
    const table = tables.get(tableId);
    if (table) {
      const seat = table.seats.find(s => s.playerName === playerName);
      if (seat) {
        seat.playerName = null;
        seat.isReady = false;
      }
    }
    playerTables.delete(playerName);
  }
}

/**
 * Start periodic cleanup of orphaned tables stuck in in_game state.
 * Called once during server startup.
 */
export function startTableOrphanCleanup(io: Server, games: Map<string, unknown>): void {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [tableId, table] of tables.entries()) {
      // Only check tables in in_game status
      if (table.status !== 'in_game') continue;

      // Check if the game still exists
      const gameExists = table.gameId && games.has(table.gameId);
      if (gameExists) continue;

      // Check if enough time has passed since game started
      const startTime = tableGameStartTimes.get(tableId);
      if (startTime && now - startTime < ORPHAN_TABLE_TIMEOUT) continue;

      // Table is orphaned - return it to post_game
      logger.warn(`Cleaning up orphaned table ${tableId} (${table.name}) - game ${table.gameId} no longer exists`);
      returnTableToPostGame(io, tableId);
      cleanedCount++;
    }

    if (cleanedCount > 0) {
      logger.info(`Orphan cleanup: returned ${cleanedCount} tables to post_game`);
    }
  }, ORPHAN_CHECK_INTERVAL);

  logger.info('Table orphan cleanup started (checking every 5 minutes)');
}
