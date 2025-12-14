/**
 * Lounge Handler - Manages the social lounge experience
 *
 * Handles:
 * - Player presence in the lounge
 * - Activity feed (joins, table creations, game results, etc.)
 * - Player status updates
 * - Wave/poke social interactions
 * - Live games list for spectating
 * - Persistent chat with reactions, replies, and media
 * - Typing indicators
 */

import { Server, Socket } from 'socket.io';
import logger from '../utils/logger.js';
import { getFriendsWithStatus, getFriendsAmong } from '../db/friends.js';
import { rateLimiters, getSocketIP } from '../utils/rateLimiter.js';
import { sanitizeChatMessage } from '../utils/sanitization.js';
import { getBlockedPlayers, blockPlayerComprehensive, unblockPlayer, isBlockedEitherWay } from '../db/blocks.js';
import { extractUrls, fetchLinkPreview } from '../utils/linkPreview.js';
import {
  saveLoungeMessage,
  getRecentLoungeMessages,
  editLoungeMessage,
  deleteLoungeMessage,
  toggleReaction,
  getMessageReactions,
  searchLoungeMessages,
  getMessagesMentioning,
} from '../db/loungeMessages.js';

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
  LoungeChatMessage,
  LoungeChatPayload,
  EditMessagePayload,
  DeleteMessagePayload,
  ToggleReactionPayload,
  TypingIndicatorPayload,
} from '../types/game.js';
import { getAllTables, getTable } from './tableHandler.js';

/**
 * Enrich lounge players with friend status relative to the requesting player.
 * Each player sees their own friends marked with isFriend=true.
 */
async function enrichPlayersWithFriendStatus(
  players: LoungePlayer[],
  requestingPlayerName: string
): Promise<LoungePlayer[]> {
  try {
    // Get requesting player's friends list
    const friends = await getFriendsWithStatus(requestingPlayerName);
    const friendNames = new Set(friends.map(f => f.player_name));

    // Enrich each player with isFriend status
    return players.map(player => ({
      ...player,
      isFriend: friendNames.has(player.playerName),
    }));
  } catch (error) {
    logger.error('Error enriching players with friend status:', error);
    // Return players without friend info rather than failing
    return players;
  }
}

// In-memory storage for lounge state
const loungePlayers = new Map<string, LoungePlayer>(); // socketId -> LoungePlayer
const playerNameToSocket = new Map<string, string>(); // playerName -> socketId
const loungeVoice = new Map<string, LoungeVoiceParticipant>(); // socketId -> voice participant
const recentActivities: LoungeActivity[] = []; // Last 50 activities
const typingPlayers = new Map<string, NodeJS.Timeout>(); // playerName -> timeout (auto-clear after 3s)
const MAX_ACTIVITIES = 50;

// Helper to convert DB message to frontend format
function dbMessageToLoungeChatMessage(dbMsg: {
  message_id: number;
  player_name: string;
  message_text: string;
  media_type?: string | null;
  media_url?: string | null;
  media_thumbnail_url?: string | null;
  media_alt_text?: string | null;
  reply_to_id?: number | null;
  reply_to?: { message_id: number; player_name: string; message_text: string } | null;
  is_edited?: boolean;
  edited_at?: string | null;
  mentions?: string[];
  reactions?: { emoji: string; count: number; players: string[] }[];
  created_at: string;
}): LoungeChatMessage {
  return {
    messageId: dbMsg.message_id,
    playerName: dbMsg.player_name,
    message: dbMsg.message_text,
    timestamp: new Date(dbMsg.created_at).getTime(),
    mediaType: dbMsg.media_type as 'gif' | 'image' | 'link' | null | undefined,
    mediaUrl: dbMsg.media_url,
    mediaThumbnailUrl: dbMsg.media_thumbnail_url,
    mediaAltText: dbMsg.media_alt_text,
    replyToId: dbMsg.reply_to_id,
    replyTo: dbMsg.reply_to ? {
      messageId: dbMsg.reply_to.message_id,
      playerName: dbMsg.reply_to.player_name,
      message: dbMsg.reply_to.message_text,
    } : null,
    isEdited: dbMsg.is_edited || false,
    editedAt: dbMsg.edited_at ? new Date(dbMsg.edited_at).getTime() : null,
    mentions: dbMsg.mentions || [],
    reactions: dbMsg.reactions || [],
  };
}

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
  socket.on('join_lounge', async () => {
    try {
      const playerName = getPlayerName();

      // Leave any previous lounge connection for this player (handles reconnection)
      const existingSocketId = playerNameToSocket.get(playerName);
      if (existingSocketId && existingSocketId !== socket.id) {
        // Notify others if player was in voice before cleaning up
        const wasInVoice = loungeVoice.has(existingSocketId);
        if (wasInVoice) {
          io.to('lounge').emit('lounge_voice_participant_left', { playerName });
        }

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

      // Enrich online players with friend status (relative to joining player)
      const allPlayers = Array.from(loungePlayers.values());
      const enrichedPlayers = await enrichPlayersWithFriendStatus(allPlayers, playerName);

      // Load chat messages from database
      const dbMessages = await getRecentLoungeMessages(100);
      const chatMessages = dbMessages.map(dbMessageToLoungeChatMessage);

      // Get current typing players (exclude self)
      const currentTyping = Array.from(typingPlayers.keys()).filter(p => p !== playerName);

      // Get blocked players for this user
      const blockedPlayers = await getBlockedPlayers(playerName);
      const blockedNames = blockedPlayers.map(b => b.blocked_name);

      // Send current lounge state with enriched friend info
      socket.emit('lounge_state', {
        tables: getAllTables().filter(t => !t.settings.isPrivate),
        activities: recentActivities,
        voiceParticipants: Array.from(loungeVoice.values()),
        onlinePlayers: enrichedPlayers,
        liveGames: Array.from(liveGames.values()),
        chatMessages,
        typingPlayers: currentTyping,
        blockedPlayers: blockedNames,
      });

      // Broadcast join to others - each existing player needs their own view
      const activity = addActivity('player_joined_lounge', playerName, {});
      io.to('lounge').emit('lounge_activity', activity);

      // Get all existing player names (excluding the joining player)
      const existingPlayerNames = Array.from(loungePlayers.values())
        .filter(p => p.playerName !== playerName)
        .map(p => p.playerName);

      // Batch query: find which existing players are friends with the new player
      // This is O(1) DB query instead of O(n) queries!
      const friendsOfNewPlayer = await getFriendsAmong(playerName, existingPlayerNames);

      // Send player_joined to each other lounge member with their specific isFriend status
      for (const [socketId, loungePlayer] of loungePlayers.entries()) {
        if (socketId !== socket.id) {
          const existingSocket = io.sockets.sockets.get(socketId);
          if (existingSocket) {
            // Check if the new player is a friend of this existing player (from batch result)
            const isFriend = friendsOfNewPlayer.has(loungePlayer.playerName);
            existingSocket.emit('lounge_player_joined', {
              player: { ...player, isFriend },
            });
          }
        }
      }

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
      const { status, statusMessage } = payload;
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'set_player_status' });
        return;
      }

      const oldStatus = player.status;
      player.status = status;
      player.lastActivity = Date.now();

      // Handle status message (sanitize and limit length)
      if (statusMessage !== undefined) {
        const sanitizedMessage = statusMessage.trim().slice(0, 100); // Max 100 chars
        player.statusMessage = sanitizedMessage || undefined;
      }

      io.to('lounge').emit('lounge_player_status_changed', {
        playerName,
        status,
        statusMessage: player.statusMessage,
        oldStatus,
      });

      // Special activity for LFG
      if (status === 'looking_for_game' && oldStatus !== 'looking_for_game') {
        const activity = addActivity('player_looking_for_game', playerName, {});
        io.to('lounge').emit('lounge_activity', activity);
      }

      logger.info(`${playerName} changed status to ${status}${player.statusMessage ? ` (${player.statusMessage})` : ''}`);
    } catch (error) {
      logger.error('Error setting status:', error);
      socket.emit('error', { message: 'Failed to set status', context: 'set_player_status' });
    }
  });

  // Wave at another player
  socket.on('wave_at_player', async (payload: WaveAtPlayerPayload) => {
    try {
      const playerName = getPlayerName();
      const { targetPlayerName } = payload;

      // Rate limiting for waves
      const ip = getSocketIP(socket);
      const rateLimit = rateLimiters.loungeInvites.checkLimit(playerName, ip);
      if (!rateLimit.allowed) {
        socket.emit('error', { message: 'Too many waves. Please slow down.', context: 'wave_at_player' });
        return;
      }
      rateLimiters.loungeInvites.recordRequest(playerName, ip);

      if (targetPlayerName === playerName) {
        socket.emit('error', { message: "You can't wave at yourself", context: 'wave_at_player' });
        return;
      }

      // Check if either player has blocked the other
      const blocked = await isBlockedEitherWay(playerName, targetPlayerName);
      if (blocked) {
        socket.emit('error', { message: 'Cannot wave to this player', context: 'wave_at_player' });
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
  socket.on('invite_to_table', async (payload: InviteToTablePayload) => {
    try {
      const playerName = getPlayerName();
      const { tableId, targetPlayerName } = payload;

      // Rate limiting for invites
      const ip = getSocketIP(socket);
      const rateLimit = rateLimiters.loungeInvites.checkLimit(playerName, ip);
      if (!rateLimit.allowed) {
        socket.emit('error', { message: 'Too many invites. Please slow down.', context: 'invite_to_table' });
        return;
      }
      rateLimiters.loungeInvites.recordRequest(playerName, ip);

      // Prevent self-invite
      if (targetPlayerName === playerName) {
        socket.emit('error', { message: 'You cannot invite yourself', context: 'invite_to_table' });
        return;
      }

      // Check if either player has blocked the other
      const blocked = await isBlockedEitherWay(playerName, targetPlayerName);
      if (blocked) {
        socket.emit('error', { message: 'Cannot invite this player', context: 'invite_to_table' });
        return;
      }

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

      // For private tables, only host can invite
      if (table.settings.isPrivate && table.hostName !== playerName) {
        socket.emit('error', { message: 'Only the host can invite to a private table', context: 'invite_to_table' });
        return;
      }

      // Check if target is already at the table
      const targetAtTable = table.seats.some(s => s.playerName === targetPlayerName);
      if (targetAtTable) {
        socket.emit('error', { message: 'Player is already at this table', context: 'invite_to_table' });
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

  // WebRTC signaling: Send SDP offer to a specific peer
  socket.on('lounge_voice_offer', (data: { targetPeerId: string; sdp: { type: string; sdp: string } }) => {
    try {
      const playerName = getPlayerName();
      const { targetPeerId, sdp } = data;

      // Verify sender is in voice room
      if (!loungeVoice.has(socket.id)) {
        return;
      }

      // Forward the offer to the target peer
      io.to(targetPeerId).emit('lounge_voice_offer', {
        peerId: socket.id,
        playerName,
        sdp,
      });

      logger.debug(`${playerName} sent voice offer to ${targetPeerId}`);
    } catch (error) {
      logger.error('Error forwarding voice offer:', error);
    }
  });

  // WebRTC signaling: Send SDP answer to a specific peer
  socket.on('lounge_voice_answer', (data: { targetPeerId: string; sdp: { type: string; sdp: string } }) => {
    try {
      const playerName = getPlayerName();
      const { targetPeerId, sdp } = data;

      // Verify sender is in voice room
      if (!loungeVoice.has(socket.id)) {
        return;
      }

      // Forward the answer to the target peer
      io.to(targetPeerId).emit('lounge_voice_answer', {
        peerId: socket.id,
        playerName,
        sdp,
      });

      logger.debug(`${playerName} sent voice answer to ${targetPeerId}`);
    } catch (error) {
      logger.error('Error forwarding voice answer:', error);
    }
  });

  // WebRTC signaling: Send ICE candidate to a specific peer
  socket.on('lounge_voice_ice', (data: { targetPeerId: string; candidate: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null } }) => {
    try {
      const { targetPeerId, candidate } = data;

      // Verify sender is in voice room
      if (!loungeVoice.has(socket.id)) {
        return;
      }

      // Forward the ICE candidate to the target peer
      io.to(targetPeerId).emit('lounge_voice_ice', {
        peerId: socket.id,
        candidate,
      });
    } catch (error) {
      logger.error('Error forwarding ICE candidate:', error);
    }
  });

  // Get online players
  socket.on('get_lounge_players', async () => {
    try {
      const playerName = getPlayerName();
      const allPlayers = Array.from(loungePlayers.values());
      const enrichedPlayers = await enrichPlayersWithFriendStatus(allPlayers, playerName);
      socket.emit('lounge_players', {
        players: enrichedPlayers,
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

  // Send chat message to lounge (with media and reply support)
  socket.on('lounge_chat', async (payload: LoungeChatPayload) => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'lounge_chat' });
        return;
      }

      // Rate limiting for chat messages
      const ip = getSocketIP(socket);
      const rateLimit = rateLimiters.chat.checkLimit(playerName, ip);
      if (!rateLimit.allowed) {
        socket.emit('error', { message: 'Too many messages. Please slow down.', context: 'lounge_chat' });
        return;
      }
      rateLimiters.chat.recordRequest(playerName, ip);

      const { message, mediaType, mediaUrl, mediaThumbnailUrl, mediaAltText, replyToId } = payload;

      // Allow empty message only if media is present
      if ((!message || message.trim().length === 0) && !mediaUrl) {
        return;
      }

      // Enforce max message length (2000 chars for richer messages)
      const MAX_MESSAGE_LENGTH = 2000;
      if (message && message.length > MAX_MESSAGE_LENGTH) {
        socket.emit('error', { message: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`, context: 'lounge_chat' });
        return;
      }

      // Sanitize message to prevent XSS attacks
      let sanitizedMessage: string = '';
      if (message) {
        try {
          sanitizedMessage = sanitizeChatMessage(message);
        } catch {
          socket.emit('error', { message: 'Invalid message content', context: 'lounge_chat' });
          return;
        }
      }

      // Clear typing indicator since user just sent a message
      const existingTimeout = typingPlayers.get(playerName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingPlayers.delete(playerName);
        io.to('lounge').emit('lounge_typing_stopped', { playerName });
      }

      // Save to database
      const dbMessage = await saveLoungeMessage({
        playerName,
        messageText: sanitizedMessage || '[media]',
        mediaType: mediaType || null,
        mediaUrl: mediaUrl || null,
        mediaThumbnailUrl: mediaThumbnailUrl || null,
        mediaAltText: mediaAltText || null,
        replyToId: replyToId || null,
      });

      if (!dbMessage) {
        socket.emit('error', { message: 'Failed to save message', context: 'lounge_chat' });
        return;
      }

      // Get full message with reply preview if needed
      let fullMessages = [dbMessage];
      if (replyToId) {
        fullMessages = await getRecentLoungeMessages(1, dbMessage.message_id + 1);
        if (fullMessages.length === 0) {
          fullMessages = [dbMessage];
        }
      }

      const chatMessage = dbMessageToLoungeChatMessage(fullMessages[fullMessages.length - 1] || dbMessage);

      // Fetch link preview if message contains URLs (do this asynchronously)
      const urls = extractUrls(sanitizedMessage);
      if (urls.length > 0) {
        // Fetch preview for first URL only (to avoid spamming)
        fetchLinkPreview(urls[0]).then((preview) => {
          if (preview && (preview.title || preview.description)) {
            chatMessage.linkPreview = preview;
            // Update the broadcast message with link preview
            io.to('lounge').emit('lounge_message_updated', {
              messageId: chatMessage.messageId,
              linkPreview: preview,
            });
          }
        }).catch((err) => {
          logger.debug(`Failed to fetch link preview: ${err}`);
        });
      }

      // Broadcast to all lounge members
      io.to('lounge').emit('lounge_chat_message', { message: chatMessage });

      // Check for @mentions and notify mentioned players
      const mentions = sanitizedMessage.match(/@([A-Za-z0-9_]+)/g) || [];
      for (const mention of mentions) {
        const mentionedName = mention.slice(1); // Remove @ prefix
        const mentionedSocketId = playerNameToSocket.get(mentionedName);
        if (mentionedSocketId && mentionedSocketId !== socket.id) {
          io.to(mentionedSocketId).emit('lounge_mention', {
            messageId: chatMessage.messageId,
            mentionedBy: playerName,
            messagePreview: sanitizedMessage.slice(0, 100),
          });
        }
      }

      logger.info(`Lounge chat from ${playerName}: ${sanitizedMessage.slice(0, 50)}${mediaUrl ? ' [+media]' : ''}`);
    } catch (error) {
      logger.error('Error sending lounge chat:', error);
      socket.emit('error', { message: 'Failed to send message', context: 'lounge_chat' });
    }
  });

  // Get chat history with pagination
  socket.on('get_lounge_chat', async (payload?: { beforeId?: number; limit?: number }) => {
    try {
      const limit = Math.min(payload?.limit || 100, 100);
      const beforeId = payload?.beforeId;

      const dbMessages = await getRecentLoungeMessages(limit, beforeId);
      const messages = dbMessages.map(dbMessageToLoungeChatMessage);

      socket.emit('lounge_chat_history', {
        messages,
        hasMore: messages.length === limit,
      });
    } catch (error) {
      logger.error('Error getting chat history:', error);
    }
  });

  // Typing indicator
  socket.on('lounge_typing', (payload: TypingIndicatorPayload) => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);

      if (!player) return;

      // Clear existing timeout
      const existingTimeout = typingPlayers.get(playerName);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      if (payload.isTyping) {
        // Set typing indicator with auto-expire after 3 seconds
        const timeout = setTimeout(() => {
          typingPlayers.delete(playerName);
          io.to('lounge').emit('lounge_typing_stopped', { playerName });
        }, 3000);

        typingPlayers.set(playerName, timeout);
        socket.to('lounge').emit('lounge_typing_started', { playerName });
      } else {
        typingPlayers.delete(playerName);
        socket.to('lounge').emit('lounge_typing_stopped', { playerName });
      }
    } catch (error) {
      logger.error('Error handling typing indicator:', error);
    }
  });

  // Toggle reaction on a message
  socket.on('toggle_reaction', async (payload: ToggleReactionPayload) => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'toggle_reaction' });
        return;
      }

      const { messageId, emoji } = payload;

      // Validate emoji (simple validation - allow common emojis)
      if (!emoji || emoji.length > 10) {
        socket.emit('error', { message: 'Invalid emoji', context: 'toggle_reaction' });
        return;
      }

      const result = await toggleReaction(messageId, playerName, emoji);

      // Get updated reactions for this message
      const reactions = await getMessageReactions(messageId);

      // Broadcast reaction update to all lounge members
      io.to('lounge').emit('lounge_reaction_updated', {
        messageId,
        reactions,
        changedBy: playerName,
        emoji,
        added: result.added,
      });

      logger.info(`${playerName} ${result.added ? 'added' : 'removed'} ${emoji} reaction on message ${messageId}`);
    } catch (error) {
      logger.error('Error toggling reaction:', error);
      socket.emit('error', { message: 'Failed to update reaction', context: 'toggle_reaction' });
    }
  });

  // Edit a message
  socket.on('edit_message', async (payload: EditMessagePayload) => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'edit_message' });
        return;
      }

      const { messageId, newText } = payload;

      // Validate new text
      if (!newText || newText.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty', context: 'edit_message' });
        return;
      }

      if (newText.length > 2000) {
        socket.emit('error', { message: 'Message too long', context: 'edit_message' });
        return;
      }

      // Sanitize
      let sanitizedText: string;
      try {
        sanitizedText = sanitizeChatMessage(newText);
      } catch {
        socket.emit('error', { message: 'Invalid message content', context: 'edit_message' });
        return;
      }

      // Try to edit (15 minute window)
      const updatedMessage = await editLoungeMessage(messageId, playerName, sanitizedText, 15);

      if (!updatedMessage) {
        socket.emit('error', { message: 'Cannot edit message (not yours or too old)', context: 'edit_message' });
        return;
      }

      // Broadcast edit to all lounge members
      io.to('lounge').emit('lounge_message_edited', {
        messageId,
        newText: sanitizedText,
        editedAt: Date.now(),
      });

      logger.info(`${playerName} edited message ${messageId}`);
    } catch (error) {
      logger.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message', context: 'edit_message' });
    }
  });

  // Delete a message
  socket.on('delete_message', async (payload: DeleteMessagePayload) => {
    try {
      const playerName = getPlayerName();
      const player = loungePlayers.get(socket.id);

      if (!player) {
        socket.emit('error', { message: 'Not in lounge', context: 'delete_message' });
        return;
      }

      const { messageId } = payload;

      // Try to delete (only own messages for non-admins)
      const deleted = await deleteLoungeMessage(messageId, playerName, false);

      if (!deleted) {
        socket.emit('error', { message: 'Cannot delete message (not yours)', context: 'delete_message' });
        return;
      }

      // Broadcast deletion to all lounge members
      io.to('lounge').emit('lounge_message_deleted', {
        messageId,
        deletedBy: playerName,
      });

      logger.info(`${playerName} deleted message ${messageId}`);
    } catch (error) {
      logger.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message', context: 'delete_message' });
    }
  });

  // Search messages
  socket.on('search_lounge_messages', async (payload: { query: string; limit?: number }) => {
    try {
      const { query, limit = 50 } = payload;

      if (!query || query.trim().length < 2) {
        socket.emit('error', { message: 'Search query too short', context: 'search_lounge_messages' });
        return;
      }

      const results = await searchLoungeMessages(query, Math.min(limit, 100));
      const messages = results.map(dbMessageToLoungeChatMessage);

      socket.emit('lounge_search_results', {
        query,
        messages,
        count: messages.length,
      });
    } catch (error) {
      logger.error('Error searching messages:', error);
      socket.emit('error', { message: 'Search failed', context: 'search_lounge_messages' });
    }
  });

  // Get messages mentioning a player
  socket.on('get_mentions', async (payload?: { limit?: number }) => {
    try {
      const playerName = getPlayerName();
      const limit = Math.min(payload?.limit || 50, 100);

      const results = await getMessagesMentioning(playerName, limit);
      const messages = results.map(dbMessageToLoungeChatMessage);

      socket.emit('lounge_mentions', { messages });
    } catch (error) {
      logger.error('Error getting mentions:', error);
    }
  });

  // Block a player
  socket.on('block_player', async (payload: { targetPlayerName: string; reason?: string }) => {
    try {
      const playerName = getPlayerName();
      const { targetPlayerName, reason } = payload;

      if (targetPlayerName === playerName) {
        socket.emit('error', { message: 'You cannot block yourself', context: 'block_player' });
        return;
      }

      const result = await blockPlayerComprehensive(playerName, targetPlayerName, reason);

      if (result.blocked) {
        socket.emit('player_blocked', {
          blockedName: targetPlayerName,
          friendshipRemoved: result.friendshipRemoved,
        });
        logger.info(`${playerName} blocked ${targetPlayerName}`);
      } else {
        socket.emit('error', { message: 'Failed to block player', context: 'block_player' });
      }
    } catch (error) {
      logger.error('Error blocking player:', error);
      socket.emit('error', { message: 'Failed to block player', context: 'block_player' });
    }
  });

  // Unblock a player
  socket.on('unblock_player', async (payload: { targetPlayerName: string }) => {
    try {
      const playerName = getPlayerName();
      const { targetPlayerName } = payload;

      const success = await unblockPlayer(playerName, targetPlayerName);

      if (success) {
        socket.emit('player_unblocked', { unblockedName: targetPlayerName });
        logger.info(`${playerName} unblocked ${targetPlayerName}`);
      } else {
        socket.emit('error', { message: 'Player was not blocked', context: 'unblock_player' });
      }
    } catch (error) {
      logger.error('Error unblocking player:', error);
      socket.emit('error', { message: 'Failed to unblock player', context: 'unblock_player' });
    }
  });

  // Get blocked players list
  socket.on('get_blocked_players', async () => {
    try {
      const playerName = getPlayerName();
      const blockedPlayers = await getBlockedPlayers(playerName);

      socket.emit('blocked_players', {
        players: blockedPlayers.map(b => ({
          playerName: b.blocked_name,
          blockedAt: b.created_at,
          reason: b.reason,
        })),
      });
    } catch (error) {
      logger.error('Error getting blocked players:', error);
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

      // Clean up typing indicator
      const typingTimeout = typingPlayers.get(playerName);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingPlayers.delete(playerName);
        io.to('lounge').emit('lounge_typing_stopped', { playerName });
      }

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
  if (!socketId) {
    // Player is not in the lounge - this is normal if they're not using lounge features
    logger.debug(`updatePlayerStatus: ${playerName} not found in lounge (may not be in lounge)`);
    return;
  }

  const player = loungePlayers.get(socketId);
  if (!player) {
    // Socket ID exists in map but player data doesn't - this is a bug/race condition
    logger.warn(`updatePlayerStatus: Socket ${socketId} found for ${playerName} but no player data exists`);
    // Clean up the stale mapping
    playerNameToSocket.delete(playerName);
    return;
  }

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

  logger.debug(`${playerName} status updated to ${status}${tableId ? ` (table: ${tableId})` : ''}${gameId ? ` (game: ${gameId})` : ''}`);
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
