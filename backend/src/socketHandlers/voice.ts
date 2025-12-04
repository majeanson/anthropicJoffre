/**
 * Voice Chat Socket.io Handlers
 * WebRTC signaling for peer-to-peer voice communication
 *
 * Handles all voice-related socket events:
 * - voice_join: Join voice channel for a game
 * - voice_leave: Leave voice channel
 * - voice_offer/answer/ice_candidate: WebRTC signaling
 * - voice_mute_update: Broadcast mute state changes
 */

import { Socket, Server } from 'socket.io';
import { GameState, VoiceParticipant } from '../types/game';
import { Logger } from 'winston';

// WebRTC signaling types (browser types, defined here for Node.js)
interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

/**
 * Dependencies needed by the voice handlers
 */
export interface VoiceHandlersDependencies {
  // State Maps
  games: Map<string, GameState>;
  voiceParticipants: Map<string, Map<string, VoiceParticipant>>; // gameId -> (socketId -> participant)

  // Socket.io
  io: Server;

  // Utility
  logger: Logger;
  errorBoundaries: import('../middleware/errorBoundary').ErrorBoundaries;
}

/**
 * Register all voice-related Socket.io handlers
 */
export function registerVoiceHandlers(socket: Socket, deps: VoiceHandlersDependencies): void {
  const {
    games,
    voiceParticipants,
    io,
    logger,
    errorBoundaries,
  } = deps;

  // ============================================================================
  // voice_join - Join voice channel for a game
  // ============================================================================
  socket.on('voice_join', errorBoundaries.gameAction('voice_join')((payload: { gameId: string }) => {
    const { gameId } = payload;

    if (!gameId) {
      socket.emit('voice_error', { message: 'Game ID is required' });
      return;
    }

    const game = games.get(gameId);
    if (!game) {
      socket.emit('voice_error', { message: 'Game not found' });
      return;
    }

    // Check if user is a player or spectator (spectators are in socket.io room)
    const player = game.players.find(p => p.id === socket.id);
    const spectatorRoom = io.sockets.adapter.rooms.get(`${gameId}-spectators`);
    const isSpectator = !player && spectatorRoom?.has(socket.id);

    if (!player && !isSpectator) {
      socket.emit('voice_error', { message: 'You are not in this game' });
      return;
    }

    const participantName = player?.name || 'Spectator';

    // Initialize voice participants map for this game if needed
    if (!voiceParticipants.has(gameId)) {
      voiceParticipants.set(gameId, new Map());
    }

    const gameVoiceParticipants = voiceParticipants.get(gameId)!;

    // Check if already in voice
    if (gameVoiceParticipants.has(socket.id)) {
      socket.emit('voice_error', { message: 'Already in voice channel' });
      return;
    }

    // Add participant
    const participant: VoiceParticipant = {
      odId: socket.id,
      name: participantName,
      isSpectator: !player,
      isMuted: false,
      isSpeaking: false,
    };

    gameVoiceParticipants.set(socket.id, participant);

    // Join the voice room
    socket.join(`voice-${gameId}`);

    logger.info('Player joined voice channel', {
      gameId,
      socketId: socket.id,
      playerName: participantName,
      isSpectator: !player,
    });

    // Notify all voice participants about the new joiner
    io.to(`voice-${gameId}`).emit('voice_participant_joined', {
      odId: socket.id,
      name: participantName,
      isSpectator: !player,
    });

    // Send current voice state to the new participant
    const participantsList = Array.from(gameVoiceParticipants.values());
    socket.emit('voice_state', { participants: participantsList });

    // Also broadcast updated participant list to all
    io.to(`voice-${gameId}`).emit('voice_state', { participants: participantsList });
  }));

  // ============================================================================
  // voice_leave - Leave voice channel
  // ============================================================================
  socket.on('voice_leave', errorBoundaries.gameAction('voice_leave')((payload: { gameId: string }) => {
    const { gameId } = payload;

    if (!gameId) {
      socket.emit('voice_error', { message: 'Game ID is required' });
      return;
    }

    handleVoiceLeave(socket, gameId, voiceParticipants, io, logger);
  }));

  // ============================================================================
  // voice_offer - WebRTC offer signaling
  // ============================================================================
  socket.on('voice_offer', errorBoundaries.gameAction('voice_offer')((payload: {
    gameId: string;
    targetId: string;
    offer: RTCSessionDescriptionInit;
  }) => {
    const { gameId, targetId, offer } = payload;

    if (!gameId || !targetId || !offer) {
      socket.emit('voice_error', { message: 'Invalid voice offer payload' });
      return;
    }

    const gameVoiceParticipants = voiceParticipants.get(gameId);
    if (!gameVoiceParticipants?.has(socket.id)) {
      socket.emit('voice_error', { message: 'You are not in the voice channel' });
      return;
    }

    logger.debug('Relaying voice offer', {
      gameId,
      fromId: socket.id,
      targetId,
    });

    // Relay offer to target
    io.to(targetId).emit('voice_offer_received', {
      fromId: socket.id,
      offer,
    });
  }));

  // ============================================================================
  // voice_answer - WebRTC answer signaling
  // ============================================================================
  socket.on('voice_answer', errorBoundaries.gameAction('voice_answer')((payload: {
    gameId: string;
    targetId: string;
    answer: RTCSessionDescriptionInit;
  }) => {
    const { gameId, targetId, answer } = payload;

    if (!gameId || !targetId || !answer) {
      socket.emit('voice_error', { message: 'Invalid voice answer payload' });
      return;
    }

    const gameVoiceParticipants = voiceParticipants.get(gameId);
    if (!gameVoiceParticipants?.has(socket.id)) {
      socket.emit('voice_error', { message: 'You are not in the voice channel' });
      return;
    }

    logger.debug('Relaying voice answer', {
      gameId,
      fromId: socket.id,
      targetId,
    });

    // Relay answer to target
    io.to(targetId).emit('voice_answer_received', {
      fromId: socket.id,
      answer,
    });
  }));

  // ============================================================================
  // voice_ice_candidate - ICE candidate signaling
  // ============================================================================
  socket.on('voice_ice_candidate', errorBoundaries.gameAction('voice_ice_candidate')((payload: {
    gameId: string;
    targetId: string;
    candidate: RTCIceCandidateInit;
  }) => {
    const { gameId, targetId, candidate } = payload;

    if (!gameId || !targetId || !candidate) {
      socket.emit('voice_error', { message: 'Invalid ICE candidate payload' });
      return;
    }

    const gameVoiceParticipants = voiceParticipants.get(gameId);
    if (!gameVoiceParticipants?.has(socket.id)) {
      socket.emit('voice_error', { message: 'You are not in the voice channel' });
      return;
    }

    // Relay ICE candidate to target
    io.to(targetId).emit('voice_ice_candidate_received', {
      fromId: socket.id,
      candidate,
    });
  }));

  // ============================================================================
  // voice_mute_update - Broadcast mute state changes
  // ============================================================================
  socket.on('voice_mute_update', errorBoundaries.gameAction('voice_mute_update')((payload: {
    gameId: string;
    isMuted: boolean;
  }) => {
    const { gameId, isMuted } = payload;

    if (!gameId || typeof isMuted !== 'boolean') {
      socket.emit('voice_error', { message: 'Invalid mute update payload' });
      return;
    }

    const gameVoiceParticipants = voiceParticipants.get(gameId);
    const participant = gameVoiceParticipants?.get(socket.id);

    if (!participant) {
      socket.emit('voice_error', { message: 'You are not in the voice channel' });
      return;
    }

    // Update mute state
    participant.isMuted = isMuted;

    logger.debug('Voice mute state updated', {
      gameId,
      socketId: socket.id,
      playerName: participant.name,
      isMuted,
    });

    // Broadcast mute state change to all voice participants
    io.to(`voice-${gameId}`).emit('voice_mute_changed', {
      odId: socket.id,
      isMuted,
    });
  }));

  // ============================================================================
  // Handle disconnection - Clean up voice state
  // ============================================================================
  socket.on('disconnect', () => {
    // Find and clean up any voice channels this socket was in
    for (const [gameId, gameVoiceParticipants] of voiceParticipants.entries()) {
      if (gameVoiceParticipants.has(socket.id)) {
        handleVoiceLeave(socket, gameId, voiceParticipants, io, logger);
      }
    }
  });
}

/**
 * Helper function to handle voice leave (used by explicit leave and disconnect)
 */
function handleVoiceLeave(
  socket: Socket,
  gameId: string,
  voiceParticipants: Map<string, Map<string, VoiceParticipant>>,
  io: Server,
  logger: Logger
): void {
  const gameVoiceParticipants = voiceParticipants.get(gameId);

  if (!gameVoiceParticipants) {
    return;
  }

  const participant = gameVoiceParticipants.get(socket.id);
  if (!participant) {
    return;
  }

  // Remove participant
  gameVoiceParticipants.delete(socket.id);

  // Leave the voice room
  socket.leave(`voice-${gameId}`);

  logger.info('Player left voice channel', {
    gameId,
    socketId: socket.id,
    playerName: participant.name,
  });

  // Notify remaining participants
  io.to(`voice-${gameId}`).emit('voice_participant_left', {
    odId: socket.id,
  });

  // Broadcast updated participant list
  const participantsList = Array.from(gameVoiceParticipants.values());
  io.to(`voice-${gameId}`).emit('voice_state', { participants: participantsList });

  // Clean up empty game voice channels
  if (gameVoiceParticipants.size === 0) {
    voiceParticipants.delete(gameId);
  }
}

/**
 * Clean up voice participants when a game ends
 */
export function cleanupGameVoice(
  gameId: string,
  voiceParticipants: Map<string, Map<string, VoiceParticipant>>,
  io: Server,
  logger: Logger
): void {
  const gameVoiceParticipants = voiceParticipants.get(gameId);

  if (!gameVoiceParticipants || gameVoiceParticipants.size === 0) {
    return;
  }

  logger.info('Cleaning up voice channel for ended game', {
    gameId,
    participantCount: gameVoiceParticipants.size,
  });

  // Notify all participants that voice is ending
  io.to(`voice-${gameId}`).emit('voice_state', { participants: [] });

  // Remove the game's voice participants
  voiceParticipants.delete(gameId);
}
