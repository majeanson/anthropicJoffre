/**
 * Connection Quality Hook
 * Sprint 6: Connection Quality Monitoring
 *
 * Measures Socket.IO connection latency and quality
 * Provides real-time ping measurement and connection status
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface ConnectionStats {
  ping: number | null;
  quality: ConnectionQuality;
  lastUpdate: number;
}

const PING_INTERVAL = 5000; // Measure ping every 5 seconds
const PING_TIMEOUT = 3000; // Consider ping failed after 3 seconds

/**
 * Determine connection quality based on ping
 */
function getConnectionQuality(ping: number | null): ConnectionQuality {
  if (ping === null) return 'offline';
  if (ping < 100) return 'excellent';
  if (ping < 200) return 'good';
  if (ping < 400) return 'fair';
  return 'poor';
}

/**
 * Hook to monitor connection quality
 *
 * Measures round-trip latency by sending periodic ping messages
 * and calculating response time.
 *
 * @param socket - Socket.IO instance
 * @returns Connection statistics and quality
 */
export function useConnectionQuality(socket: Socket | null) {
  const [stats, setStats] = useState<ConnectionStats>({
    ping: null,
    quality: 'offline',
    lastUpdate: Date.now(),
  });

  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPingTimeRef = useRef<number>(0);

  /**
   * Measure ping latency
   */
  const measurePing = useCallback(() => {
    if (!socket || !socket.connected) {
      setStats((prev) => ({
        ...prev,
        ping: null,
        quality: 'offline',
        lastUpdate: Date.now(),
      }));
      return;
    }

    const startTime = Date.now();
    lastPingTimeRef.current = startTime;

    // Clear any existing timeout
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
    }

    // Set timeout for ping failure
    pingTimeoutRef.current = setTimeout(() => {
      // Ping took too long - consider it poor quality
      setStats({
        ping: PING_TIMEOUT,
        quality: 'poor',
        lastUpdate: Date.now(),
      });
    }, PING_TIMEOUT);

    // Send ping and measure response time
    socket.emit('ping_measurement', { timestamp: startTime }, (response: { timestamp: number }) => {
      // Clear timeout since we got a response
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }

      // Only update if this is the latest ping
      if (response.timestamp === lastPingTimeRef.current) {
        const latency = Date.now() - startTime;
        const quality = getConnectionQuality(latency);

        setStats({
          ping: latency,
          quality,
          lastUpdate: Date.now(),
        });
      }
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    // Initial measurement
    measurePing();

    // Set up interval for periodic measurements
    pingIntervalRef.current = setInterval(() => {
      measurePing();
    }, PING_INTERVAL);

    // Update quality when connection status changes
    const handleConnect = () => {
      measurePing();
    };

    const handleDisconnect = () => {
      setStats((prev) => ({
        ...prev,
        ping: null,
        quality: 'offline',
        lastUpdate: Date.now(),
      }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (pingTimeoutRef.current) {
        clearTimeout(pingTimeoutRef.current);
        pingTimeoutRef.current = null;
      }
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, measurePing]);

  return stats;
}
