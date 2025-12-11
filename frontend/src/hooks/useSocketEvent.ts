import { useEffect, useRef, useCallback } from 'react';
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
  // Use ref to always have latest handler without causing re-subscriptions
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const eventHandler = (data: T) => {
      handlerRef.current(data);
    };

    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName, ...dependencies]);
}

/**
 * Subscribe to multiple socket events with the same handler
 * Useful when multiple events should trigger the same action
 *
 * @param socket - Socket.io socket instance (can be null)
 * @param eventNames - Array of event names to listen for
 * @param handler - Callback function to handle all events
 * @param deps - Additional dependencies that should trigger re-subscription
 */
export function useSocketEvents<T = unknown>(
  socket: Socket | null,
  eventNames: string[],
  handler: (data: T, eventName: string) => void,
  deps: React.DependencyList = []
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || eventNames.length === 0) return;

    const handlers = eventNames.map((eventName) => {
      const eventHandler = (data: T) => {
        handlerRef.current(data, eventName);
      };
      socket.on(eventName, eventHandler);
      return { eventName, eventHandler };
    });

    return () => {
      handlers.forEach(({ eventName, eventHandler }) => {
        socket.off(eventName, eventHandler);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, JSON.stringify(eventNames), ...deps]);
}

/**
 * Create a typed socket emitter function
 * Returns a memoized emit function that won't cause re-renders
 *
 * @param socket - Socket.io socket instance (can be null)
 * @param eventName - Name of the event to emit
 * @returns Emit function
 */
export function useSocketEmit<T = unknown>(
  socket: Socket | null,
  eventName: string
): (data: T) => void {
  return useCallback(
    (data: T) => {
      if (socket) {
        socket.emit(eventName, data);
      }
    },
    [socket, eventName]
  );
}

export default useSocketEvent;
