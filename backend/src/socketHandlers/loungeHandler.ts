/**
 * Lounge Handler - Manages the social lounge experience
 *
 * Handles:
 * - Player presence in the lounge
 * - Activity feed (joins, table creations, game results, etc.)
 * - Player status updates
 * - Wave/poke social interactions
 * - Live games list for spectating
 */

import { Server, Socket } from 'socket.io';
import logger from '../utils/logger.js';

// Generate unique ID (same pattern as elsewhere in codebase)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
import {
  LoungeActivity,
  LoungePlayer,
  LoungeVoiceParticipant,
  LiveGame,
  PlayerStatus,
  SetPlayerStatusPayload,
  WaveAtPlayerPayload,
  InviteToTablePayload,
  ActivityEventType,
  ChatMessage,
} from '../types/game.js';
import { getAllTables, getTable } from './tableHandler.js';

// In-memory storage for lounge state
const loungePlayers = new Map<string, LoungePlayer>(); // socketId -> LoungePlayer
const playerNameToSocket = new Map<string, string>(); // playerName -> socketId
const loungeVoice = new Map<string, LoungeVoiceParticipant>(); // socketId -> voice participant
const recentActivities: LoungeActivity[] = []; // Last 50 activities
const loungeChatMessages: ChatMessage[] = []; // Last 100 chat messages
const MAX_ACTIVITIES = 50;
const MAX_CHAT_MESSAGES = 100;

// Track live games
const liveGames = new Map<string, LiveGame>();

function addActivity(
  type: ActivityEventType,
  playerName: string,
  data: LoungeActivity['data']
): LoungeActivity {
  const activity: LoungeActivity = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    playerName,
    data,
  };
  recentActivities.unshift(activity);
  if (recentActivities.length > MAX_ACTIVITIES) {
    recentActivities.pop();
  }
  return activity;
}

export function setupLoungeHandler(io: Server, socket: Socket): void {
  // Get player name from socket.data (set during authentication/connection)
  const getPlayerName = (): string => socket.data.playerName || 'Anonymous';

  // Join the lounge
  socket.on('join_lounge', () => {
    try {
      const playerName = getPlayerName();

      // Leave any previous lounge connection for this player (handles reconnection)
      const existingSocketId = playerNameToSocket.get(playerName);
      if (existingSocketId && existingSocketId !== socket.id) {
        // Clean up old socket's entries
        loungePlayers.delete(existingSocketId);
        loungeVoice.delete(existingSocketId);

        // Try to remove old socket from lounge room (may already be disconnected)
        const oldSocket = io.sockets.sockets.get(existingSocketId);
        if (oldSocket) {
          oldSocket.leave('lounge');
          oldSocket.leave('lounge_voice');
        }
      }

      const player: LoungePlayer = {
        socketId: socket.id,
        playerName,
        status: 'in_lounge',
        lastActivity: Date.now(),
      };

      loungePlayers.set(socket.id, player);
      playerNameToSocket.set(playerName, socket.id);

      socket.join('lounge');

      // Send current lounge state
      socket.emit('lounge_state', {
        tables: getAllTables().filter(t => !t.settings.isPrivate),
        activities: recentActivities,
        voiceParticipants: Array.from(loungeVoice.values()),
        onlinePlayers: Array.from(loungePlayers.values()),
        liveGames: Array.from(liveGames.values()),
        chatMessages: loungeChatMessages,
      });

      // Broadcast join to others
      const activity = addActivity('player_joined_lounge', playerName, {});
      io.to('lounge').emit('lounge_activity', activity);
      io.to('lounge').emit('lounge_player_joined', { player });

      logger.info(`${playerName} joined the lounge`);
    } catch (error) {
      logger.error('Error joining lounge:', error);
      socket.emit('error', { message: 'Failed to join lounge', context: 'join_lounge' });
    }
  });

  // Leave the lounge
  socket.on('leave_lounge', () => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);
      if (player) {
        loungePlayers.delete(socket.id);
        playerNameToSocket.delete(playerName);
        loungeVoice.delete(socket.id);

        socket.leave('lounge');

        const activity = addActivity('player_left_lounge', playerName, {});
        io.to('lounge').emit('lounge_activity', activity);
        io.to('lounge').emit('lounge_player_left', { playerName });

        logger.info(`${playerName} left the lounge`);
      }
    } catch (error) {
      logger.error('Error leaving lounge:', error);
    }
  });

  // Update player status
  socket.on('set_player_status', (payload: SetPlayerStatusPayload) => {
    try {
      const playerName = getPlayerName();
      const { status } = payload;
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'set_player_status' });
        return;
      }

      const oldStatus = player.status;
      player.status = status;
      player.lastActivity = Date.now();

      io.to('lounge').emit('lounge_player_status_changed', {
        playerName,
        status,
        oldStatus,
      });

      // Special activity for LFG
      if (status === 'looking_for_game' && oldStatus !== 'looking_for_game') {
        const activity = addActivity('player_looking_for_game', playerName, {});
        io.to('lounge').emit('lounge_activity', activity);
      }

      logger.info(`${playerName} changed status to ${status}`);
    } catch (error) {
      logger.error('Error setting status:', error);
      socket.emit('error', { message: 'Failed to set status', context: 'set_player_status' });
    }
  });

  // Wave at another player
  socket.on('wave_at_player', (payload: WaveAtPlayerPayload) => {
    try {
      const playerName = getPlayerName();
      const { targetPlayerName } = payload;

      if (targetPlayerName === playerName) {
        socket.emit('error', { message: "You can't wave at yourself", context: 'wave_at_player' });
        return;
      }

      const targetSocketId = playerNameToSocket.get(targetPlayerName);
      if (!targetSocketId) {
        socket.emit('error', { message: 'Player not found in lounge', context: 'wave_at_player' });
        return;
      }

      // Send wave notification to target
      io.to(targetSocketId).emit('player_waved_at_you', {
        playerName,
        timestamp: Date.now(),
      });

      // Add to activity feed
      const activity = addActivity('player_waved', playerName, {
        targetPlayer: targetPlayerName,
      });
      io.to('lounge').emit('lounge_activity', activity);

      socket.emit('wave_sent', { targetPlayerName });

      logger.info(`${playerName} waved at ${targetPlayerName}`);
    } catch (error) {
      logger.error('Error waving:', error);
      socket.emit('error', { message: 'Failed to wave', context: 'wave_at_player' });
    }
  });

  // Invite player to table
  socket.on('invite_to_table', (payload: InviteToTablePayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, targetPlayerName } = payload;

      const table = getTable(tableId);
      if (!table) {
        socket.emit('error', { message: 'Table not found', context: 'invite_to_table' });
        return;
      }

      // Check sender is at the table
      const senderAtTable = table.seats.some(s => s.playerName === playerName);
      if (!senderAtTable) {
        socket.emit('error', { message: 'You must be at the table to invite', context: 'invite_to_table' });
        return;
      }

      const targetSocketId = playerNameToSocket.get(targetPlayerName);
      if (!targetSocketId) {
        socket.emit('error', { message: 'Player not found in lounge', context: 'invite_to_table' });
        return;
      }

      // Send invite to target
      io.to(targetSocketId).emit('table_invite_received', {
        tableId,
        tableName: table.name,
        hostName: table.hostName,
        inviterName: playerName,
      });

      socket.emit('invite_sent', { targetPlayerName, tableId });

      logger.info(`${playerName} invited ${targetPlayerName} to table ${tableId}`);
    } catch (error) {
      logger.error('Error inviting:', error);
      socket.emit('error', { message: 'Failed to invite', context: 'invite_to_table' });
    }
  });

  // Join lounge voice
  socket.on('join_lounge_voice', () => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);
      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'join_lounge_voice' });
        return;
      }

      const participant: LoungeVoiceParticipant = {
        socketId: socket.id,
        playerName,
        isMuted: false,
        isSpeaking: false,
        joinedAt: Date.now(),
      };

      loungeVoice.set(socket.id, participant);

      socket.join('lounge_voice');

      io.to('lounge').emit('lounge_voice_participant_joined', { participant });
      socket.emit('lounge_voice_joined', {
        participants: Array.from(loungeVoice.values()),
      });

      logger.info(`${playerName} joined lounge voice`);
    } catch (error) {
      logger.error('Error joining voice:', error);
      socket.emit('error', { message: 'Failed to join voice', context: 'join_lounge_voice' });
    }
  });

  // Leave lounge voice
  socket.on('leave_lounge_voice', () => {
    try {
      const playerName = getPlayerName();
      const participant = loungeVoice.get(socket.id);
      if (participant) {
        loungeVoice.delete(socket.id);
        socket.leave('lounge_voice');

        io.to('lounge').emit('lounge_voice_participant_left', { playerName });

        logger.info(`${playerName} left lounge voice`);
      }
    } catch (error) {
      logger.error('Error leaving voice:', error);
    }
  });

  // Toggle mute in lounge voice
  socket.on('lounge_voice_mute', (payload: { isMuted: boolean }) => {
    try {
      const playerName = getPlayerName();
      const participant = loungeVoice.get(socket.id);
      if (participant) {
        participant.isMuted = payload.isMuted;
        io.to('lounge').emit('lounge_voice_participant_updated', {
          playerName,
          isMuted: payload.isMuted,
        });
      }
    } catch (error) {
      logger.error('Error toggling mute:', error);
    }
  });

  // Voice speaking indicator
  socket.on('lounge_voice_speaking', (payload: { isSpeaking: boolean }) => {
    try {
      const playerName = getPlayerName();
      const participant = loungeVoice.get(socket.id);
      if (participant) {
        participant.isSpeaking = payload.isSpeaking;
        io.to('lounge').emit('lounge_voice_participant_speaking', {
          playerName,
          isSpeaking: payload.isSpeaking,
        });
      }
    } catch (error) {
      logger.error('Error updating speaking:', error);
    }
  });

  // Get online players
  socket.on('get_lounge_players', () => {
    try {
      socket.emit('lounge_players', {
        players: Array.from(loungePlayers.values()),
      });
    } catch (error) {
      logger.error('Error getting players:', error);
    }
  });

  // Get recent activities
  socket.on('get_lounge_activities', () => {
    try {
      socket.emit('lounge_activities', { activities: recentActivities });
    } catch (error) {
      logger.error('Error getting activities:', error);
    }
  });

  // Get live games
  socket.on('get_live_games', () => {
    try {
      socket.emit('live_games', { games: Array.from(liveGames.values()) });
    } catch (error) {
      logger.error('Error getting live games:', error);
    }
  });

  // Send chat message to lounge
  socket.on('lounge_chat', (payload: { message: string }) => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'lounge_chat' });
        return;
      }

      const { message } = payload;
      if (!message || message.trim().length === 0) {
        return;
      }

      const chatMessage: ChatMessage = {
        playerId: socket.id,
        playerName,
        teamId: null,
        message: message.slice(0, 500), // Limit message length
        timestamp: Date.now(),
      };

      loungeChatMessages.push(chatMessage);

      // Keep only last 100 messages
      if (loungeChatMessages.length > MAX_CHAT_MESSAGES) {
        loungeChatMessages.shift();
      }

      io.to('lounge').emit('lounge_chat_message', { message: chatMessage });

      logger.info(`Lounge chat from ${playerName}: ${message.slice(0, 50)}...`);
    } catch (error) {
      logger.error('Error sending lounge chat:', error);
      socket.emit('error', { message: 'Failed to send message', context: 'lounge_chat' });
    }
  });

  // Get chat history
  socket.on('get_lounge_chat', () => {
    try {
      socket.emit('lounge_chat_history', { messages: loungeChatMessages });
    } catch (error) {
      logger.error('Error getting chat history:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const playerName = getPlayerName();
    const player = loungePlayers.get(socket.id);
    if (player) {
      loungePlayers.delete(socket.id);
      playerNameToSocket.delete(playerName);
      loungeVoice.delete(socket.id);

      const activity = addActivity('player_left_lounge', playerName, {});
      io.to('lounge').emit('lounge_activity', activity);
      io.to('lounge').emit('lounge_player_left', { playerName });
    }
  });
}

// Export functions for other handlers to update lounge state

export function updatePlayerStatus(
  io: Server,
  playerName: string,
  status: PlayerStatus,
  gameId?: string,
  tableId?: string
): void {
  const socketId = playerNameToSocket.get(playerName);
  if (socketId) {
    const player = loungePlayers.get(socketId);
    if (player) {
      player.status = status;
      player.gameId = gameId;
      player.tableId = tableId;
      player.lastActivity = Date.now();

      io.to('lounge').emit('lounge_player_status_changed', {
        playerName,
        status,
        gameId,
        tableId,
      });
    }
  }
}

export function addLoungeActivity(
  io: Server,
  type: ActivityEventType,
  playerName: string,
  data: LoungeActivity['data']
): void {
  const activity = addActivity(type, playerName, data);
  io.to('lounge').emit('lounge_activity', activity);
}

export function updateLiveGame(io: Server, game: LiveGame): void {
  liveGames.set(game.gameId, game);
  io.to('lounge').emit('live_game_updated', { game });
}

export function removeLiveGame(io: Server, gameId: string): void {
  liveGames.delete(gameId);
  io.to('lounge').emit('live_game_removed', { gameId });
}

export function getLoungePlayerSocketId(playerName: string): string | undefined {
  return playerNameToSocket.get(playerName);
}

export function isPlayerInLounge(playerName: string): boolean {
  return playerNameToSocket.has(playerName);
}

/**
 * Remove player from lounge voice chat when they join a table.
 * This ensures they don't stay in the lounge voice room while at a table.
 */
export function removePlayerFromLoungeVoice(io: Server, playerName: string): void {
  const socketId = playerNameToSocket.get(playerName);
  if (!socketId) return;

  const participant = loungeVoice.get(socketId);
  if (participant) {
    loungeVoice.delete(socketId);

    // Try to remove from socket room
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave('lounge_voice');
    }

    io.to('lounge').emit('lounge_voice_participant_left', { playerName });
    logger.info(`${playerName} auto-removed from lounge voice (joined table)`);
  }
}
