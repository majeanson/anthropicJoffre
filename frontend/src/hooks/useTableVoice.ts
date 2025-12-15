/**
 * Table Voice Hook
 * WebRTC implementation for table-scoped voice chat
 *
 * Similar to useLoungeVoice but scoped to a specific table.
 * Players in a table can voice chat with only others at the same table.
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

interface UseTableVoiceProps {
  socket: Socket | null;
  tableId: string;
}

interface UseTableVoiceReturn {
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
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    ...(import.meta.env.VITE_TURN_URL ? [{
      urls: import.meta.env.VITE_TURN_URL as string,
      username: import.meta.env.VITE_TURN_USERNAME as string,
      credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
    }] : []),
  ],
  iceTransportPolicy: import.meta.env.VITE_TURN_URL ? 'all' : 'all',
};

/**
 * Hook to manage table-scoped voice chat with full WebRTC audio
 */
export function useTableVoice({ socket, tableId }: UseTableVoiceProps): UseTableVoiceReturn {
  const [isInVoice, setIsInVoice] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [pttActive, setPttActiveState] = useState(false);
  const [participantVolumes, setParticipantVolumes] = useState<Map<string, number>>(new Map());
  const preDeafenVolumes = useRef<Map<string, number>>(new Map());

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
          socket.emit('table_voice_ice', {
            tableId,
            targetPeerId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`Table voice peer ${playerName} connection: ${pc.connectionState}`);

        if (pc.connectionState === 'failed') {
          console.log(`[TableVoice] Connection to ${playerName} failed, attempting ICE restart...`);
          pc.createOffer({ iceRestart: true })
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit('table_voice_offer', {
                tableId,
                targetPeerId: peerId,
                sdp: pc.localDescription,
              });
            })
            .catch((err) => {
              console.error(`[TableVoice] ICE restart failed for ${playerName}:`, err);
              peersRef.current.delete(peerId);
              pc.close();
            });
        }

        if (pc.connectionState === 'disconnected') {
          setTimeout(() => {
            const currentPeer = peersRef.current.get(peerId);
            if (currentPeer && currentPeer.connection.connectionState === 'disconnected') {
              console.log(`[TableVoice] Peer ${playerName} still disconnected, cleaning up...`);
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
            socket.emit('table_voice_offer', {
              tableId,
              targetPeerId: peerId,
              sdp: pc.localDescription,
            });
          })
          .catch((err) => console.error('Offer error:', err));
      }

      return pc;
    },
    [socket, tableId]
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
          socket.emit('table_voice_speaking', { tableId, isSpeaking });
        }
      }, 100);
    } catch (err) {
      console.warn('Speaking detection error:', err);
    }
  }, [socket, tableId]);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      setupSpeakingDetection();

      socket.emit('join_table_voice', { tableId });
      setIsInVoice(true);
    } catch (err) {
      console.error('[TableVoice] Failed to get microphone:', err);
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
  }, [socket, tableId, isInVoice, isConnecting, setupSpeakingDetection]);

  // Leave voice
  const leaveVoice = useCallback(() => {
    if (socket) {
      socket.emit('leave_table_voice', { tableId });
    }
    cleanup();
    setIsInVoice(false);
    setIsMuted(false);
    setError(null);
  }, [socket, tableId, cleanup]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);

        if (socket) {
          socket.emit('table_voice_mute', { tableId, isMuted: !isMuted });
        }
      }
    }
  }, [isMuted, socket, tableId]);

  // Toggle push-to-talk mode
  const togglePushToTalk = useCallback(() => {
    setIsPushToTalk(prev => {
      const newValue = !prev;
      if (newValue && localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsMuted(true);
          socket?.emit('table_voice_mute', { tableId, isMuted: true });
        }
      }
      return newValue;
    });
  }, [socket, tableId]);

  // Set PTT active
  const setPttActive = useCallback((active: boolean) => {
    if (!isPushToTalk || !localStreamRef.current) return;

    setPttActiveState(active);
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = active;
      setIsMuted(!active);
      socket?.emit('table_voice_mute', { tableId, isMuted: !active });
    }
  }, [isPushToTalk, socket, tableId]);

  // Set volume for a specific participant
  const setParticipantVolume = useCallback((playerName: string, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    setParticipantVolumes(prev => {
      const newMap = new Map(prev);
      newMap.set(playerName, clampedVolume);
      return newMap;
    });

    if (!isDeafened) {
      peersRef.current.forEach((peer) => {
        if (peer.playerName === playerName && peer.audioElement) {
          peer.audioElement.volume = clampedVolume;
        }
      });
    }
  }, [isDeafened]);

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const newDeafened = !prev;

      if (newDeafened) {
        peersRef.current.forEach((peer) => {
          if (peer.audioElement) {
            preDeafenVolumes.current.set(peer.playerName, peer.audioElement.volume);
            peer.audioElement.volume = 0;
          }
        });
      } else {
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

    const handleVoiceJoined = (data: {
      tableId: string;
      participants: Array<{ socketId: string; playerName: string; isMuted: boolean }>;
    }) => {
      if (data.tableId !== tableId) return;
      setIsInVoice(true);
      data.participants.forEach((p) => {
        if (!peersRef.current.has(p.socketId)) {
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

    const handlePeerJoined = (data: { tableId: string; participant: { socketId: string; playerName: string } }) => {
      if (data.tableId !== tableId) return;
      if (isInVoice && localStreamRef.current) {
        createPeerConnection(data.participant.socketId, data.participant.playerName, true);
      }
    };

    const handlePeerLeft = (data: { tableId: string; playerName: string }) => {
      if (data.tableId !== tableId) return;
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

    const handleOffer = async (data: {
      tableId: string;
      peerId: string;
      playerName: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      if (data.tableId !== tableId || !localStreamRef.current) return;

      const pc = createPeerConnection(data.peerId, data.playerName, false);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('table_voice_answer', {
          tableId,
          targetPeerId: data.peerId,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error('Handle offer error:', err);
      }
    };

    const handleAnswer = async (data: { tableId: string; peerId: string; sdp: RTCSessionDescriptionInit }) => {
      if (data.tableId !== tableId) return;
      const peer = peersRef.current.get(data.peerId);
      if (peer) {
        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err) {
          console.error('Handle answer error:', err);
        }
      }
    };

    const handleIceCandidate = async (data: { tableId: string; peerId: string; candidate: RTCIceCandidateInit }) => {
      if (data.tableId !== tableId) return;
      const peer = peersRef.current.get(data.peerId);
      if (peer && data.candidate) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Add ICE candidate error:', err);
        }
      }
    };

    socket.on('table_voice_joined', handleVoiceJoined);
    socket.on('table_voice_participant_joined', handlePeerJoined);
    socket.on('table_voice_participant_left', handlePeerLeft);
    socket.on('table_voice_offer', handleOffer);
    socket.on('table_voice_answer', handleAnswer);
    socket.on('table_voice_ice', handleIceCandidate);

    return () => {
      socket.off('table_voice_joined', handleVoiceJoined);
      socket.off('table_voice_participant_joined', handlePeerJoined);
      socket.off('table_voice_participant_left', handlePeerLeft);
      socket.off('table_voice_offer', handleOffer);
      socket.off('table_voice_answer', handleAnswer);
      socket.off('table_voice_ice', handleIceCandidate);
    };
  }, [socket, tableId, isInVoice, createPeerConnection]);

  // Cleanup on unmount or tableId change
  useEffect(() => {
    return () => {
      if (isInVoice && socket) {
        socket.emit('leave_table_voice', { tableId });
      }
      cleanup();
    };
  }, [tableId]);

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
    isPushToTalk,
    togglePushToTalk,
    pttActive,
    setPttActive,
    participantVolumes,
    setParticipantVolume,
  };
}
