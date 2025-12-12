/**
 * Table Handler - Manages lounge tables (pre-game gathering spots)
 *
 * Tables are the social hub where players gather before games.
 * Unlike the old "Create Game" flow, tables let people hang out,
 * chat, and decide when to start playing together.
 */

import { Server, Socket } from 'socket.io';
import logger from '../utils/logger.js';

// Generate unique ID (same pattern as elsewhere in codebase)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
import {
  LoungeTable,
  TableSeat,
  TableSettings,
  CreateTablePayload,
  JoinTablePayload,
  LeaveTablePayload,
  SetSeatPayload,
  AddBotToTablePayload,
  RemoveFromSeatPayload,
  SetReadyPayload,
  StartTableGamePayload,
  ChatMessage,
  BotDifficulty,
} from '../types/game.js';

// In-memory storage for tables (consider Redis for production)
const tables = new Map<string, LoungeTable>();

// Track which table each player is at
const playerTables = new Map<string, string>(); // playerName -> tableId

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

export function setupTableHandler(io: Server, socket: Socket): void {
  // Get player name from socket.data (set during authentication/connection)
  const getPlayerName = (): string => socket.data.playerName || 'Anonymous';

  // Create a new table
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

  // Join an existing table
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

      // Check if player is already at a different table
      const currentTableId = playerTables.get(playerName);
      if (currentTableId && currentTableId !== tableId) {
        socket.emit('error', { message: 'You are already at another table', context: 'join_table' });
        return;
      }

      // Check if already at this table
      if (table.seats.some(s => s.playerName === playerName)) {
        socket.emit('error', { message: 'You are already at this table', context: 'join_table' });
        return;
      }

      // Find an empty seat
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

      targetSeat.playerName = playerName;
      targetSeat.isReady = false;
      playerTables.set(playerName, tableId);

      socket.join(`table:${tableId}`);

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

  // Leave a table
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
        socket.emit('error', { message: 'You are not at this table', context: 'leave_table' });
        return;
      }

      // Remove player from seat
      seat.playerName = null;
      seat.isReady = false;
      playerTables.delete(playerName);

      socket.leave(`table:${tableId}`);

      // Add system message
      table.chatMessages.push({
        playerId: 'system',
        playerName: 'System',
        teamId: null,
        message: `${playerName} left the table`,
        timestamp: Date.now(),
      });

      // If host left, transfer host or delete table
      if (table.hostName === playerName) {
        const remainingPlayers = table.seats.filter(s => s.playerName !== null && !s.isBot);
        if (remainingPlayers.length > 0) {
          table.hostName = remainingPlayers[0].playerName as string;
          table.chatMessages.push({
            playerId: 'system',
            playerName: 'System',
            teamId: null,
            message: `${table.hostName} is now the host`,
            timestamp: Date.now(),
          });
        } else {
          // No players left, delete table
          tables.delete(tableId);
          io.to(`table:${tableId}`).emit('table_deleted', { tableId });
          io.to('lounge').emit('lounge_table_deleted', { tableId });
          logger.info(`Table ${tableId} deleted (no players)`);
          return;
        }
      }

      logger.info(`${playerName} left table ${tableId}`);

      socket.emit('table_left', { tableId });
      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error leaving table:', error);
      socket.emit('error', { message: 'Failed to leave table', context: 'leave_table' });
    }
  });

  // Change seat at table
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

  // Add a bot to a seat
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

      const existingNames = getTablePlayerNames(table);
      const botName = generateBotName(existingNames);

      targetSeat.playerName = botName;
      targetSeat.isBot = true;
      targetSeat.botDifficulty = difficulty || 'medium';
      targetSeat.isReady = true; // Bots are always ready

      logger.info(`Bot ${botName} added to table ${tableId} at position ${seatPosition}`);

      broadcastTableUpdate(io, table);
    } catch (error) {
      logger.error('Error adding bot:', error);
      socket.emit('error', { message: 'Failed to add bot', context: 'add_bot_to_table' });
    }
  });

  // Remove player/bot from seat
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
      if (!wasBot) {
        playerTables.delete(removedName);
        io.to(`table:${tableId}`).emit('player_removed_from_table', {
          tableId,
          playerName: removedName,
        });
      }

      targetSeat.playerName = null;
      targetSeat.isBot = false;
      targetSeat.botDifficulty = undefined;
      targetSeat.isReady = false;

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

  // Toggle ready status
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

  // Start the game (host only)
  socket.on('start_table_game', (payload: StartTableGamePayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId } = payload;

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

      // Check all are ready (or allow host to override)
      const allReady = table.seats.every(s => s.isReady);
      if (!allReady) {
        // For now, require all ready. Could add host override later.
        socket.emit('error', { message: 'All players must be ready', context: 'start_table_game' });
        return;
      }

      table.status = 'in_game';

      // Emit event to create the actual game
      // The main game handler will pick this up and create a game with these players
      io.to(`table:${tableId}`).emit('table_game_starting', {
        tableId,
        players: table.seats.map(s => ({
          name: s.playerName,
          teamId: s.teamId,
          isBot: s.isBot,
          botDifficulty: s.botDifficulty,
        })),
        settings: table.settings,
      });

      logger.info(`Game starting from table ${tableId}`);

      broadcastTableUpdate(io, table);
      broadcastActivity(io, 'table_started', playerName, {
        tableName: table.name,
        tableId: table.id,
      });
    } catch (error) {
      logger.error('Error starting table game:', error);
      socket.emit('error', { message: 'Failed to start game', context: 'start_table_game' });
    }
  });

  // Send chat message to table
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

  // Get all tables (for lounge view)
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

  // Get specific table details
  socket.on('get_table', (payload: { tableId: string }) => {
    try {
      const { tableId } = payload;
      const table = tables.get(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'get_table' });
        return;
      }
      socket.emit('table_details', { table });
    } catch (error) {
      logger.error('Error getting table:', error);
      socket.emit('error', { message: 'Failed to get table', context: 'get_table' });
    }
  });

  // Handle disconnect - remove from table
  socket.on('disconnect', () => {
    const playerName = getPlayerName();
    const tableId = playerTables.get(playerName);
    if (tableId) {
      const table = tables.get(tableId);
      if (table) {
        const seat = table.seats.find(s => s.playerName === playerName);
        if (seat) {
          seat.playerName = null;
          seat.isReady = false;
          playerTables.delete(playerName);

          // Add system message
          table.chatMessages.push({
            playerId: 'system',
            playerName: 'System',
            teamId: null,
            message: `${playerName} disconnected`,
            timestamp: Date.now(),
          });

          // Handle host leaving
          if (table.hostName === playerName) {
            const remainingPlayers = table.seats.filter(s => s.playerName !== null && !s.isBot);
            if (remainingPlayers.length > 0) {
              table.hostName = remainingPlayers[0].playerName as string;
            } else {
              // Delete empty table
              tables.delete(tableId);
              io.to('lounge').emit('lounge_table_deleted', { tableId });
              return;
            }
          }

          broadcastTableUpdate(io, table);
        }
      }
    }
  });
}

// Export helper functions for other handlers
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

export function returnTableToPostGame(tableId: string): void {
  const table = tables.get(tableId);
  if (table) {
    table.status = 'post_game';
    table.gameId = undefined;
    // Reset ready states
    table.seats.forEach(s => {
      if (!s.isBot) {
        s.isReady = false;
      }
    });
  }
}

export function getAllTables(): LoungeTable[] {
  return Array.from(tables.values());
}
