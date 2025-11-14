import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface SocketContextType {
  socket: Socket | null;
  reconnecting: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      // Enable both transports for Railway compatibility
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setReconnecting(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.io.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
      setReconnecting(true);
    });

    newSocket.io.on('reconnect', () => {
      console.log('Reconnected successfully');
      setReconnecting(false);
    });

    newSocket.io.on('reconnect_failed', () => {
      console.log('Reconnection failed');
      setReconnecting(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, reconnecting }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
