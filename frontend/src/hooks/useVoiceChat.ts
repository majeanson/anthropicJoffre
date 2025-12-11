/**
 * Voice Chat Hook
 * WebRTC peer-to-peer voice communication with Socket.io signaling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { VoiceParticipant } from '../types/game';
import logger from '../utils/logger';

// ICE servers for NAT traversal (using free public STUN servers)
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface UseVoiceChatProps {
  socket: Socket | null;
  gameId: string | null;
  isSpectator?: boolean; // Used for participant name display
}

interface UseVoiceChatReturn {
  // State
  isVoiceEnabled: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  participants: VoiceParticipant[];
  error: string | null;

  // Actions
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
}

/**
 * Hook to manage WebRTC voice chat
 */
export function useVoiceChat({
  socket,
  gameId,
  isSpectator: _isSpectator = false, // Reserved for future use (spectator name in voice)
}: UseVoiceChatProps): UseVoiceChatReturn {
  // Suppress unused variable warning
  void _isSpectator;
  // State
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs for WebRTC resources
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    // Remove audio elements
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.srcObject = null;
      audio.remove();
    });
    remoteAudioElementsRef.current.clear();

    setParticipants([]);
  }, []);

  // Create peer connection for a remote participant
  const createPeerConnection = useCallback(
    (remoteId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      // Handle incoming remote stream
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream) {
          let audioElement = remoteAudioElementsRef.current.get(remoteId);
          if (!audioElement) {
            audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            audioElement.id = `voice-audio-${remoteId}`;
            document.body.appendChild(audioElement);
            remoteAudioElementsRef.current.set(remoteId, audioElement);
          }
          audioElement.srcObject = remoteStream;
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && gameId) {
          socket.emit('voice_ice_candidate', {
            gameId,
            targetId: remoteId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        logger.debug(`[Voice] Connection to ${remoteId}: ${pc.connectionState}`);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          // Connection failed, could implement retry logic here
          logger.warn(`[Voice] Connection to ${remoteId} ${pc.connectionState}`);
        }
      };

      peerConnectionsRef.current.set(remoteId, pc);
      return pc;
    },
    [socket, gameId]
  );

  // Initiate connection to a remote participant
  const initiateConnection = useCallback(
    async (remoteId: string) => {
      const pc = createPeerConnection(remoteId);

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socket && gameId) {
          socket.emit('voice_offer', {
            gameId,
            targetId: remoteId,
            offer: pc.localDescription,
          });
        }
      } catch (err) {
        console.error('[Voice] Failed to create offer:', err);
      }
    },
    [socket, gameId, createPeerConnection]
  );

  // Handle receiving an offer
  const handleOffer = useCallback(
    async (fromId: string, offer: RTCSessionDescriptionInit) => {
      let pc = peerConnectionsRef.current.get(fromId);
      if (!pc) {
        pc = createPeerConnection(fromId);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket && gameId) {
          socket.emit('voice_answer', {
            gameId,
            targetId: fromId,
            answer: pc.localDescription,
          });
        }
      } catch (err) {
        console.error('[Voice] Failed to handle offer:', err);
      }
    },
    [socket, gameId, createPeerConnection]
  );

  // Handle receiving an answer
  const handleAnswer = useCallback(async (fromId: string, answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionsRef.current.get(fromId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('[Voice] Failed to handle answer:', err);
      }
    }
  }, []);

  // Handle receiving ICE candidate
  const handleIceCandidate = useCallback(async (fromId: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionsRef.current.get(fromId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('[Voice] Failed to add ICE candidate:', err);
      }
    }
  }, []);

  // Join voice channel
  const joinVoice = useCallback(async () => {
    if (!socket || !gameId) {
      setError('Not connected to game');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;

      // Join voice channel on server
      socket.emit('voice_join', { gameId });
      setIsVoiceEnabled(true);
    } catch (err) {
      console.error('[Voice] Failed to get microphone:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError('Unable to access microphone.');
        }
      } else {
        setError('Unable to access microphone.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [socket, gameId]);

  // Leave voice channel
  const leaveVoice = useCallback(() => {
    if (socket && gameId) {
      socket.emit('voice_leave', { gameId });
    }
    cleanup();
    setIsVoiceEnabled(false);
    setIsMuted(false);
    setError(null);
  }, [socket, gameId, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle (if muted, enable; if not muted, disable)
        setIsMuted(!isMuted);

        // Notify server of mute state change
        if (socket && gameId) {
          socket.emit('voice_mute_update', { gameId, isMuted: !isMuted });
        }
      }
    }
  }, [isMuted, socket, gameId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Voice state update (full participant list)
    const handleVoiceState = (data: { participants: VoiceParticipant[] }) => {
      setParticipants(data.participants);

      // If we just joined and there are other participants, connect to them
      if (isVoiceEnabled) {
        data.participants.forEach((p) => {
          // Don't connect to ourselves
          if (p.odId !== socket.id && !peerConnectionsRef.current.has(p.odId)) {
            // Initiator is determined by comparing socket IDs (lower ID initiates)
            if (socket.id && socket.id < p.odId) {
              initiateConnection(p.odId);
            }
          }
        });
      }
    };

    // New participant joined
    const handleParticipantJoined = (data: {
      odId: string;
      name: string;
      isSpectator: boolean;
    }) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.odId === data.odId);
        if (exists) return prev;
        return [...prev, { ...data, isMuted: false, isSpeaking: false }];
      });

      // Connect to new participant if we're in voice
      if (isVoiceEnabled && data.odId !== socket.id) {
        // Initiator is determined by comparing socket IDs (lower ID initiates)
        if (socket.id && socket.id < data.odId) {
          initiateConnection(data.odId);
        }
      }
    };

    // Participant left
    const handleParticipantLeft = (data: { odId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.odId !== data.odId));

      // Clean up peer connection and audio element
      const pc = peerConnectionsRef.current.get(data.odId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.odId);
      }
      const audio = remoteAudioElementsRef.current.get(data.odId);
      if (audio) {
        audio.srcObject = null;
        audio.remove();
        remoteAudioElementsRef.current.delete(data.odId);
      }
    };

    // WebRTC signaling events
    const handleOfferReceived = (data: { fromId: string; offer: RTCSessionDescriptionInit }) => {
      handleOffer(data.fromId, data.offer);
    };

    const handleAnswerReceived = (data: { fromId: string; answer: RTCSessionDescriptionInit }) => {
      handleAnswer(data.fromId, data.answer);
    };

    const handleIceCandidateReceived = (data: {
      fromId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      handleIceCandidate(data.fromId, data.candidate);
    };

    // Mute state changed
    const handleMuteChanged = (data: { odId: string; isMuted: boolean }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.odId === data.odId ? { ...p, isMuted: data.isMuted } : p))
      );
    };

    // Voice error
    const handleVoiceError = (data: { message: string }) => {
      setError(data.message);
    };

    // Register listeners
    socket.on('voice_state', handleVoiceState);
    socket.on('voice_participant_joined', handleParticipantJoined);
    socket.on('voice_participant_left', handleParticipantLeft);
    socket.on('voice_offer_received', handleOfferReceived);
    socket.on('voice_answer_received', handleAnswerReceived);
    socket.on('voice_ice_candidate_received', handleIceCandidateReceived);
    socket.on('voice_mute_changed', handleMuteChanged);
    socket.on('voice_error', handleVoiceError);

    // Cleanup on unmount or socket change
    return () => {
      socket.off('voice_state', handleVoiceState);
      socket.off('voice_participant_joined', handleParticipantJoined);
      socket.off('voice_participant_left', handleParticipantLeft);
      socket.off('voice_offer_received', handleOfferReceived);
      socket.off('voice_answer_received', handleAnswerReceived);
      socket.off('voice_ice_candidate_received', handleIceCandidateReceived);
      socket.off('voice_mute_changed', handleMuteChanged);
      socket.off('voice_error', handleVoiceError);
    };
  }, [socket, isVoiceEnabled, initiateConnection, handleOffer, handleAnswer, handleIceCandidate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isVoiceEnabled && socket && gameId) {
        socket.emit('voice_leave', { gameId });
      }
      cleanup();
    };
  }, []);

  // Leave voice when gameId changes (switching games)
  useEffect(() => {
    if (!gameId && isVoiceEnabled) {
      leaveVoice();
    }
  }, [gameId, isVoiceEnabled, leaveVoice]);

  return {
    isVoiceEnabled,
    isConnecting,
    isMuted,
    participants,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
