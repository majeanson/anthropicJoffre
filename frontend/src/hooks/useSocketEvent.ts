import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

/**
 * Custom hook to subscribe to socket.io events with automatic cleanup
 *
 * @param socket - Socket.io socket instance
 * @param eventName - Name of the event to listen to
 * @param handler - Event handler function
 * @param dependencies - Additional dependencies to trigger re-subscription (optional)
 *
 * @example
 * useSocketEvent(socket, 'game_updated', (gameState) => {
 *   setGameState(gameState);
 * }, []);
 */
export function useSocketEvent<T = unknown>(
  socket: Socket | null,
  eventName: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
): void {
  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName, ...dependencies]);
}
