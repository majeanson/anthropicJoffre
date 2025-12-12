/**
 * Lounge Voice Hook
 * Handles microphone permission and state for lounge voice chat
 * (Note: Full WebRTC implementation would be needed for actual audio)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface UseLoungeVoiceProps {
  socket: Socket | null;
}

interface UseLoungeVoiceReturn {
  isInVoice: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  error: string | null;
  joinVoice: () => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
}

/**
 * Hook to manage lounge voice chat
 * Requests microphone permission and tracks state
 */
export function useLoungeVoice({ socket }: UseLoungeVoiceProps): UseLoungeVoiceReturn {
  const [isInVoice, setIsInVoice] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref for local media stream
  const localStreamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  // Join voice - requests microphone permission
  const joinVoice = useCallback(async () => {
    if (!socket) {
      setError('Not connected');
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
  }, [socket]);

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
        audioTrack.enabled = isMuted; // Toggle
        setIsMuted(!isMuted);

        // Notify server of mute state change
        if (socket) {
          socket.emit('lounge_voice_mute', { isMuted: !isMuted });
        }
      }
    }
  }, [isMuted, socket]);

  // Listen for voice_joined confirmation
  useEffect(() => {
    if (!socket) return;

    const handleVoiceJoined = () => {
      setIsInVoice(true);
    };

    socket.on('lounge_voice_joined', handleVoiceJoined);

    return () => {
      socket.off('lounge_voice_joined', handleVoiceJoined);
    };
  }, [socket]);

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
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
}
