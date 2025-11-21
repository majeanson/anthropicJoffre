/**
 * Socket Connection Hook
 * Sprint 5 Phase 1: Extracted from App.tsx
 *
 * Manages Socket.io connection lifecycle:
 * - Initial connection with reconnection strategy
 * - Connection event handlers
 * - Session validation
 * - Reconnection state management
 */

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { PlayerSession } from '../types/game';
import { useAuth } from '../contexts/AuthContext';
import { CONFIG } from '../config/constants';

const SESSION_TIMEOUT = 900000; // 15 minutes

/**
 * Check if there's a valid session in sessionStorage
 * Uses sessionStorage for multi-tab isolation
 *
 * @returns True if valid session exists, false otherwise
 */
export function checkValidSession(): boolean {
  const sessionData = sessionStorage.getItem('gameSession');
  if (!sessionData) return false;

  try {
    const session: PlayerSession = JSON.parse(sessionData);
    const SHORT_TIMEOUT = 120000; // 2 minutes
    if (Date.now() - session.timestamp > SHORT_TIMEOUT) {
      sessionStorage.removeItem('gameSession');
      return false;
    }
    return true;
  } catch (e) {
    sessionStorage.removeItem('gameSession');
    return false;
  }
}

/**
 * Socket connection hook with reconnection management
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Session validation and cleanup
 * - Reconnection state tracking
 * - Connection error handling
 *
 * @returns Socket instance, reconnecting state, and error state
 */
export function useSocketConnection() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Pre-warm the server with a ping before establishing WebSocket connection
    // This helps wake up the server if it's in cold start (Railway free tier)
    const prewarmServer = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        await fetch(`${CONFIG.API_BASE_URL}/api/ping`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (error) {
        // Silently fail - server might be cold starting
      }
    };

    // Start pre-warming immediately
    prewarmServer();

    const token = getAccessToken();

    const newSocket = io(CONFIG.SOCKET_URL, {
      // Enable both transports for Railway compatibility
      transports: ['websocket', 'polling'],
      // Enable automatic reconnection with exponential backoff
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Connection timeout
      timeout: 10000,
      // Send JWT token for authentication
      auth: {
        token: token || undefined,
      },
    });

    setSocket(newSocket);

    // Expose socket on window for E2E tests
    if (typeof window !== 'undefined') {
      (window as unknown as { socket?: Socket }).socket = newSocket;
    }

    // Connection event handlers
    newSocket.on('connect', () => {
      setError(''); // Clear any connection errors
      setReconnectAttempt(0); // Reset attempt counter on successful connection
    });

    newSocket.on('connect_error', () => {
      setReconnecting(false);

      // If we have a stale session, clear it
      const sessionData = sessionStorage.getItem('gameSession');
      if (sessionData) {
        try {
          const session: PlayerSession = JSON.parse(sessionData);
          if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
            sessionStorage.removeItem('gameSession');
          }
        } catch (e) {
          sessionStorage.removeItem('gameSession');
        }
      }
    });

    newSocket.on('disconnect', (reason) => {
      // Don't immediately clear state - allow for reconnection
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, clear session
        sessionStorage.removeItem('gameSession');
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setReconnecting(true);
      setReconnectAttempt(attemptNumber);
    });

    newSocket.on('reconnect', () => {
      setReconnecting(false);
      setReconnectAttempt(0);
    });

    newSocket.on('reconnect_failed', () => {
      setReconnecting(false);
      setReconnectAttempt(0);
      setError('Unable to reconnect to server. Please refresh the page.');
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [isAuthenticated, getAccessToken]); // Reconnect when authentication changes

  return { socket, reconnecting, reconnectAttempt, error, setError };
}
