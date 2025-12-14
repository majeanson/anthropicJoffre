/**
 * Lounge Voice Hook
 * Full WebRTC implementation for lounge voice chat
 *
 * Features:
 * - Microphone permission handling
 * - WebRTC peer-to-peer audio connections
 * - Mute/unmute functionality
 * - Speaking detection
 * - Automatic peer connection management
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Peer {
  id: string;
  playerName: string;
  connection: RTCPeerConnection;
  audioElement?: HTMLAudioElement;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface UseLoungeVoiceProps {
  socket: Socket | null;
}

interface UseLoungeVoiceReturn {
  isInVoice: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  error: string | null;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  // Push-to-talk
  isPushToTalk: boolean;
  togglePushToTalk: () => void;
  pttActive: boolean;
  setPttActive: (active: boolean) => void;
  // Volume control
  participantVolumes: Map<string, number>;
  setParticipantVolume: (playerName: string, volume: number) => void;
}

// ICE servers for NAT traversal
// STUN servers are free but only work for ~80% of NAT configurations
// TURN servers (relay) are needed for strict NATs but require hosted service
// Popular TURN providers: Twilio, Xirsys, or self-hosted CoTURN
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    // Free Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // Add TURN servers via environment variables if available
    // Format: VITE_TURN_URL, VITE_TURN_USERNAME, VITE_TURN_CREDENTIAL
    ...(import.meta.env.VITE_TURN_URL ? [{
      urls: import.meta.env.VITE_TURN_URL as string,
      username: import.meta.env.VITE_TURN_USERNAME as string,
      credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
    }] : []),
  ],
  // Prefer relay candidates for more reliable connections when TURN is available
  iceTransportPolicy: import.meta.env.VITE_TURN_URL ? 'all' : 'all',
};

/**
 * Hook to manage lounge voice chat with full WebRTC audio
 */
export function useLoungeVoice({ socket }: UseLoungeVoiceProps): UseLoungeVoiceReturn {
  const [isInVoice, setIsInVoice] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Push-to-talk state
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [pttActive, setPttActiveState] = useState(false);
  // Volume control per participant
  const [participantVolumes, setParticipantVolumes] = useState<Map<string, number>>(new Map());
  // Store pre-deafen volumes for restoration
  const preDeafenVolumes = useRef<Map<string, number>>(new Map());

  // Refs for local media and peers
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, Peer>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup all peer connections
  const cleanupPeers = useCallback(() => {
    peersRef.current.forEach((peer) => {
      peer.connection.close();
      if (peer.audioElement) {
        peer.audioElement.pause();
        peer.audioElement.srcObject = null;
      }
    });
    peersRef.current.clear();
  }, []);

  // Cleanup local media stream
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    cleanupPeers();
  }, [cleanupPeers]);

  // Create a peer connection
  const createPeerConnection = useCallback(
    (peerId: string, playerName: string, isInitiator: boolean) => {
      if (!localStreamRef.current || !socket) return null;

      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio track
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // Handle incoming audio
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteStream) {
          const audio = new Audio();
          audio.srcObject = remoteStream;
          audio.autoplay = true;
          audio.volume = 1.0;
          audio.play().catch((err) => console.warn('Audio play error:', err));

          const peer = peersRef.current.get(peerId);
          if (peer) {
            peer.audioElement = audio;
          }
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('lounge_voice_ice', {
            targetPeerId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle connection state changes - attempt reconnection on failure
      pc.onconnectionstatechange = () => {
        console.log(`Peer ${playerName} connection: ${pc.connectionState}`);

        // Attempt to reconnect when connection fails
        if (pc.connectionState === 'failed') {
          console.log(`[Voice] Connection to ${playerName} failed, attempting ICE restart...`);

          // Try ICE restart first
          pc.createOffer({ iceRestart: true })
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit('lounge_voice_offer', {
                targetPeerId: peerId,
                sdp: pc.localDescription,
              });
            })
            .catch((err) => {
              console.error(`[Voice] ICE restart failed for ${playerName}:`, err);

              // If ICE restart fails, remove peer - server will re-signal
              peersRef.current.delete(peerId);
              pc.close();
            });
        }

        // Clean up disconnected peers after a timeout
        if (pc.connectionState === 'disconnected') {
          // Give it 5 seconds to recover before cleanup
          setTimeout(() => {
            const currentPeer = peersRef.current.get(peerId);
            if (currentPeer && currentPeer.connection.connectionState === 'disconnected') {
              console.log(`[Voice] Peer ${playerName} still disconnected, cleaning up...`);
              currentPeer.connection.close();
              if (currentPeer.audioElement) {
                currentPeer.audioElement.pause();
                currentPeer.audioElement.srcObject = null;
              }
              peersRef.current.delete(peerId);
            }
          }, 5000);
        }
      };

      // Store peer
      const peer: Peer = {
        id: peerId,
        playerName,
        connection: pc,
        isMuted: false,
        isSpeaking: false,
      };
      peersRef.current.set(peerId, peer);

      // If initiator, create and send offer
      if (isInitiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit('lounge_voice_offer', {
              targetPeerId: peerId,
              sdp: pc.localDescription,
            });
          })
          .catch((err) => console.error('Offer error:', err));
      }

      return pc;
    },
    [socket]
  );

  // Set up speaking detection
  const setupSpeakingDetection = useCallback(() => {
    if (!localStreamRef.current || !socket) return;

    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(localStreamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      let wasSpeaking = false;

      speakingIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const isSpeaking = average > 25;

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          socket.emit('lounge_voice_speaking', { isSpeaking });
        }
      }, 100);
    } catch (err) {
      console.warn('Speaking detection error:', err);
    }
  }, [socket]);

  // Join voice
  const joinVoice = useCallback(async () => {
    if (!socket) {
      setError('Not connected');
      return;
    }

    if (isInVoice || isConnecting) return;

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
      setupSpeakingDetection();

      // Join voice channel on server
      socket.emit('join_lounge_voice');
      setIsInVoice(true);
    } catch (err) {
      console.error('[LoungeVoice] Failed to get microphone:', err);
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
  }, [socket, isInVoice, isConnecting, setupSpeakingDetection]);

  // Leave voice
  const leaveVoice = useCallback(() => {
    if (socket) {
      socket.emit('leave_lounge_voice');
    }
    cleanup();
    setIsInVoice(false);
    setIsMuted(false);
    setError(null);
  }, [socket, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle (if muted, enable; if not muted, disable)
        setIsMuted(!isMuted);

        if (socket) {
          socket.emit('lounge_voice_mute', { isMuted: !isMuted });
        }
      }
    }
  }, [isMuted, socket]);

  // Toggle push-to-talk mode
  const togglePushToTalk = useCallback(() => {
    setIsPushToTalk(prev => {
      const newValue = !prev;
      if (newValue && localStreamRef.current) {
        // When enabling PTT, mute the microphone by default
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsMuted(true);
          socket?.emit('lounge_voice_mute', { isMuted: true });
        }
      }
      return newValue;
    });
  }, [socket]);

  // Set PTT active (called when holding PTT key/button)
  const setPttActive = useCallback((active: boolean) => {
    if (!isPushToTalk || !localStreamRef.current) return;

    setPttActiveState(active);
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = active;
      setIsMuted(!active);
      socket?.emit('lounge_voice_mute', { isMuted: !active });
    }
  }, [isPushToTalk, socket]);

  // Set volume for a specific participant
  const setParticipantVolume = useCallback((playerName: string, volume: number) => {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // Update state
    setParticipantVolumes(prev => {
      const newMap = new Map(prev);
      newMap.set(playerName, clampedVolume);
      return newMap;
    });

    // Apply to audio element (unless deafened)
    if (!isDeafened) {
      peersRef.current.forEach((peer) => {
        if (peer.playerName === playerName && peer.audioElement) {
          peer.audioElement.volume = clampedVolume;
        }
      });
    }
  }, [isDeafened]);

  // Toggle deafen (mute all incoming audio)
  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const newDeafened = !prev;

      if (newDeafened) {
        // Save current volumes and set all to 0
        peersRef.current.forEach((peer) => {
          if (peer.audioElement) {
            preDeafenVolumes.current.set(peer.playerName, peer.audioElement.volume);
            peer.audioElement.volume = 0;
          }
        });
      } else {
        // Restore volumes
        peersRef.current.forEach((peer) => {
          if (peer.audioElement) {
            const savedVolume = preDeafenVolumes.current.get(peer.playerName) ?? 1;
            peer.audioElement.volume = savedVolume;
          }
        });
        preDeafenVolumes.current.clear();
      }

      return newDeafened;
    });
  }, []);

  // Socket event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // When we join, receive list of existing peers
    const handleVoiceJoined = (data: {
      participants: Array<{ socketId: string; playerName: string; isMuted: boolean }>;
    }) => {
      setIsInVoice(true);
      // Wait for existing peers to send us offers
      data.participants.forEach((p) => {
        if (!peersRef.current.has(p.socketId)) {
          // Placeholder peer, will be updated when we receive offer
          peersRef.current.set(p.socketId, {
            id: p.socketId,
            playerName: p.playerName,
            connection: new RTCPeerConnection(),
            isMuted: p.isMuted,
            isSpeaking: false,
          });
        }
      });
    };

    // New peer joined - we initiate connection to them
    const handlePeerJoined = (data: { participant: { socketId: string; playerName: string } }) => {
      if (isInVoice && localStreamRef.current) {
        createPeerConnection(data.participant.socketId, data.participant.playerName, true);
      }
    };

    // Peer left
    const handlePeerLeft = (data: { playerName: string }) => {
      peersRef.current.forEach((peer, id) => {
        if (peer.playerName === data.playerName) {
          peer.connection.close();
          if (peer.audioElement) {
            peer.audioElement.pause();
            peer.audioElement.srcObject = null;
          }
          peersRef.current.delete(id);
        }
      });
    };

    // Received offer from a peer
    const handleOffer = async (data: {
      peerId: string;
      playerName: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (!localStreamRef.current) return;

      const pc = createPeerConnection(data.peerId, data.playerName, false);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('lounge_voice_answer', {
          targetPeerId: data.peerId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('Handle offer error:', err);
      }
    };

    // Received answer from a peer
    const handleAnswer = async (data: { peerId: string; sdp: RTCSessionDescriptionInit }) => {
      const peer = peersRef.current.get(data.peerId);
      if (peer) {
        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
          console.error('Handle answer error:', err);
        }
      }
    };

    // Received ICE candidate
    const handleIceCandidate = async (data: { peerId: string; candidate: RTCIceCandidateInit }) => {
      const peer = peersRef.current.get(data.peerId);
      if (peer && data.candidate) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Add ICE candidate error:', err);
        }
      }
    };

    socket.on('lounge_voice_joined', handleVoiceJoined);
    socket.on('lounge_voice_participant_joined', handlePeerJoined);
    socket.on('lounge_voice_participant_left', handlePeerLeft);
    socket.on('lounge_voice_offer', handleOffer);
    socket.on('lounge_voice_answer', handleAnswer);
    socket.on('lounge_voice_ice', handleIceCandidate);

    return () => {
      socket.off('lounge_voice_joined', handleVoiceJoined);
      socket.off('lounge_voice_participant_joined', handlePeerJoined);
      socket.off('lounge_voice_participant_left', handlePeerLeft);
      socket.off('lounge_voice_offer', handleOffer);
      socket.off('lounge_voice_answer', handleAnswer);
      socket.off('lounge_voice_ice', handleIceCandidate);
    };
  }, [socket, isInVoice, createPeerConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInVoice && socket) {
        socket.emit('leave_lounge_voice');
      }
      cleanup();
    };
  }, []);

  return {
    isInVoice,
    isConnecting,
    isMuted,
    isDeafened,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
    // Push-to-talk
    isPushToTalk,
    togglePushToTalk,
    pttActive,
    setPttActive,
    // Volume control
    participantVolumes,
    setParticipantVolume,
  };
}
