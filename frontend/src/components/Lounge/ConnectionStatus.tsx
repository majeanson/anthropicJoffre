/**
 * ConnectionStatus - Shows socket connection state
 *
 * Displays a banner when disconnected or reconnecting to alert users
 * that their actions may not be saved/received.
 */

import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ConnectionStatusProps {
  socket: Socket | null;
}

export function ConnectionStatus({ socket }: ConnectionStatusProps) {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    if (!socket) {
      setStatus('disconnected');
      return;
    }

    // Set initial status
    setStatus(socket.connected ? 'connected' : 'disconnected');

    const handleConnect = () => {
      setStatus('connected');
      setReconnectAttempt(0);
    };

    const handleDisconnect = () => {
      setStatus('disconnected');
    };

    const handleReconnecting = (attempt: number) => {
      setStatus('reconnecting');
      setReconnectAttempt(attempt);
    };

    const handleReconnectError = () => {
      setStatus('disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.io.on('reconnect_attempt', handleReconnecting);
    socket.io.on('reconnect_error', handleReconnectError);
    socket.io.on('reconnect_failed', handleReconnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.io.off('reconnect_attempt', handleReconnecting);
      socket.io.off('reconnect_error', handleReconnectError);
      socket.io.off('reconnect_failed', handleReconnectError);
    };
  }, [socket]);

  // Don't show anything when connected
  if (status === 'connected') {
    return null;
  }

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium
        transition-all duration-300 animate-slide-down
        ${status === 'reconnecting'
          ? 'bg-yellow-500/90 text-yellow-950'
          : 'bg-red-500/90 text-white'
        }
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center gap-2">
        {status === 'reconnecting' ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-yellow-950 border-t-transparent rounded-full animate-spin" />
            <span>Reconnecting{reconnectAttempt > 1 ? ` (attempt ${reconnectAttempt})` : ''}...</span>
          </>
        ) : (
          <>
            <span>⚠️</span>
            <span>Connection lost. Messages may not be sent.</span>
            <button
              onClick={() => socket?.connect()}
              className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            >
              Retry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;
