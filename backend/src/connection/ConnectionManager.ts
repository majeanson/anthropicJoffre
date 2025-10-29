import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'events';

/**
 * Connection status for tracking individual sockets
 */
interface ConnectionInfo {
  socket: Socket;
  playerId: string | null;
  playerName: string | null;
  gameId: string | null;
  isBot: boolean;
  connectedAt: number;
  lastHeartbeat: number;
  disconnectedAt: number | null;
  reconnectionAttempts: number;
  messageQueue: Array<{ event: string; data: any }>;
  isAlive: boolean;
}

/**
 * Configuration for ConnectionManager
 */
interface ConnectionManagerConfig {
  heartbeatInterval?: number;      // How often to ping clients (default: 25s)
  heartbeatTimeout?: number;       // When to consider connection dead (default: 60s)
  maxReconnectionTime?: number;    // Max time to wait for reconnection (default: 5 min)
  messageQueueLimit?: number;      // Max queued messages per connection (default: 100)
  enableLogging?: boolean;         // Enable detailed connection logs (default: false)
}

/**
 * WebSocket Connection Manager
 *
 * Handles:
 * - Automatic heartbeat mechanism to detect dead connections
 * - Connection state tracking and cleanup
 * - Message queuing during disconnections
 * - Graceful reconnection handling
 * - Connection pooling and management
 */
export class ConnectionManager extends EventEmitter {
  private io: Server;
  private connections: Map<string, ConnectionInfo> = new Map(); // socketId -> ConnectionInfo
  private playerConnections: Map<string, string> = new Map(); // playerName -> socketId
  private config: Required<ConnectionManagerConfig>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(io: Server, config: ConnectionManagerConfig = {}) {
    super();
    this.io = io;
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 25000,
      heartbeatTimeout: config.heartbeatTimeout || 60000,
      maxReconnectionTime: config.maxReconnectionTime || 5 * 60 * 1000,
      messageQueueLimit: config.messageQueueLimit || 100,
      enableLogging: config.enableLogging || false
    };

    this.startHeartbeat();
    this.startCleanup();
  }

  /**
   * Register a new socket connection
   */
  registerConnection(socket: Socket): void {
    const connectionInfo: ConnectionInfo = {
      socket,
      playerId: null,
      playerName: null,
      gameId: null,
      isBot: false,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
      disconnectedAt: null,
      reconnectionAttempts: 0,
      messageQueue: [],
      isAlive: true
    };

    this.connections.set(socket.id, connectionInfo);
    this.log(`New connection registered: ${socket.id}`);

    // Setup heartbeat ping/pong
    socket.on('pong', () => {
      const conn = this.connections.get(socket.id);
      if (conn) {
        conn.lastHeartbeat = Date.now();
        conn.isAlive = true;
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket.id);
    });

    this.emit('connection_registered', { socketId: socket.id });
  }

  /**
   * Associate a player with a connection
   */
  associatePlayer(socketId: string, playerName: string, playerId: string, gameId: string, isBot: boolean = false): void {
    const conn = this.connections.get(socketId);
    if (!conn) {
      this.log(`Cannot associate player: connection ${socketId} not found`);
      return;
    }

    // If player was previously connected, mark old connection for cleanup
    const oldSocketId = this.playerConnections.get(playerName);
    if (oldSocketId && oldSocketId !== socketId) {
      const oldConn = this.connections.get(oldSocketId);
      if (oldConn) {
        this.log(`Player ${playerName} reconnecting from ${oldSocketId} to ${socketId}`);

        // Transfer queued messages to new connection
        if (oldConn.messageQueue.length > 0) {
          conn.messageQueue = [...oldConn.messageQueue];
          this.log(`Transferred ${conn.messageQueue.length} queued messages to new connection`);
        }

        // Clean up old connection
        this.connections.delete(oldSocketId);
      }
    }

    conn.playerId = playerId;
    conn.playerName = playerName;
    conn.gameId = gameId;
    conn.isBot = isBot;
    this.playerConnections.set(playerName, socketId);

    this.log(`Player associated: ${playerName} (${playerId}) on socket ${socketId}`);
    this.emit('player_associated', { socketId, playerName, playerId, gameId });

    // Flush any queued messages
    this.flushMessageQueue(socketId);
  }

  /**
   * Queue a message for a player (used when connection is temporarily down)
   */
  queueMessage(socketId: string, event: string, data: any): boolean {
    const conn = this.connections.get(socketId);
    if (!conn) return false;

    if (conn.messageQueue.length >= this.config.messageQueueLimit) {
      this.log(`Message queue full for ${socketId}, dropping oldest message`);
      conn.messageQueue.shift(); // Remove oldest
    }

    conn.messageQueue.push({ event, data });
    this.log(`Queued message '${event}' for ${socketId} (queue size: ${conn.messageQueue.length})`);
    return true;
  }

  /**
   * Send a message to a socket, queuing if connection is down
   */
  sendToSocket(socketId: string, event: string, data: any): boolean {
    const conn = this.connections.get(socketId);
    if (!conn) {
      this.log(`Cannot send message: socket ${socketId} not found`);
      return false;
    }

    if (!conn.isAlive || conn.disconnectedAt) {
      // Queue message for later delivery
      return this.queueMessage(socketId, event, data);
    }

    try {
      conn.socket.emit(event, data);
      return true;
    } catch (error) {
      this.log(`Error sending message to ${socketId}: ${error}`);
      return this.queueMessage(socketId, event, data);
    }
  }

  /**
   * Send a message to all sockets in a game room
   */
  sendToRoom(gameId: string, event: string, data: any): void {
    this.io.to(gameId).emit(event, data);
  }

  /**
   * Flush queued messages for a socket
   */
  private flushMessageQueue(socketId: string): void {
    const conn = this.connections.get(socketId);
    if (!conn || conn.messageQueue.length === 0) return;

    this.log(`Flushing ${conn.messageQueue.length} queued messages for ${socketId}`);

    const queue = [...conn.messageQueue];
    conn.messageQueue = [];

    for (const { event, data } of queue) {
      try {
        conn.socket.emit(event, data);
      } catch (error) {
        this.log(`Error flushing message '${event}' to ${socketId}: ${error}`);
        // Re-queue if failed
        conn.messageQueue.push({ event, data });
      }
    }
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socketId: string): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    conn.disconnectedAt = Date.now();
    conn.isAlive = false;

    this.log(`Connection ${socketId} disconnected (player: ${conn.playerName || 'unknown'})`);

    // Don't immediately remove - allow for reconnection window
    // Cleanup will happen in periodic cleanup if no reconnection
    this.emit('connection_lost', {
      socketId,
      playerName: conn.playerName,
      playerId: conn.playerId,
      gameId: conn.gameId,
      canReconnect: !conn.isBot // Bots don't need reconnection
    });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((conn, socketId) => {
        if (conn.disconnectedAt) return; // Skip disconnected

        const timeSinceLastHeartbeat = Date.now() - conn.lastHeartbeat;

        if (timeSinceLastHeartbeat > this.config.heartbeatTimeout) {
          // Connection appears dead
          this.log(`Heartbeat timeout for ${socketId} (${timeSinceLastHeartbeat}ms since last heartbeat)`);
          conn.isAlive = false;

          // Emit event for app to handle
          this.emit('connection_timeout', {
            socketId,
            playerName: conn.playerName,
            timeSinceLastHeartbeat
          });

          // Force disconnect if socket still thinks it's connected
          try {
            conn.socket.disconnect(true);
          } catch (error) {
            this.log(`Error forcing disconnect for ${socketId}: ${error}`);
          }
        } else {
          // Send ping
          conn.isAlive = false; // Will be set to true on pong
          conn.socket.emit('ping');
        }
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * Start periodic cleanup of stale connections
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const toDelete: string[] = [];

      this.connections.forEach((conn, socketId) => {
        if (!conn.disconnectedAt) return; // Still connected

        const timeSinceDisconnect = now - conn.disconnectedAt;

        // Clean up if:
        // 1. Bot connection (no need to wait)
        // 2. Exceeded max reconnection time
        // 3. No player associated (anonymous connection)
        if (
          conn.isBot ||
          timeSinceDisconnect > this.config.maxReconnectionTime ||
          !conn.playerName
        ) {
          this.log(`Cleaning up stale connection ${socketId} (disconnected ${timeSinceDisconnect}ms ago)`);
          toDelete.push(socketId);

          if (conn.playerName) {
            this.playerConnections.delete(conn.playerName);
          }

          this.emit('connection_cleaned', {
            socketId,
            playerName: conn.playerName,
            playerId: conn.playerId,
            gameId: conn.gameId,
            queuedMessages: conn.messageQueue.length
          });
        }
      });

      toDelete.forEach(socketId => this.connections.delete(socketId));

      if (toDelete.length > 0) {
        this.log(`Cleaned up ${toDelete.length} stale connections`);
      }
    }, 30000); // Run every 30 seconds
  }

  /**
   * Get connection info for a socket
   */
  getConnection(socketId: string): ConnectionInfo | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Get socket ID for a player
   */
  getSocketIdForPlayer(playerName: string): string | undefined {
    return this.playerConnections.get(playerName);
  }

  /**
   * Check if a player is currently connected
   */
  isPlayerConnected(playerName: string): boolean {
    const socketId = this.playerConnections.get(playerName);
    if (!socketId) return false;

    const conn = this.connections.get(socketId);
    return conn ? conn.isAlive && !conn.disconnectedAt : false;
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): Map<string, ConnectionInfo> {
    const active = new Map<string, ConnectionInfo>();
    this.connections.forEach((conn, socketId) => {
      if (conn.isAlive && !conn.disconnectedAt) {
        active.set(socketId, conn);
      }
    });
    return active;
  }

  /**
   * Get statistics about connections
   */
  getStats() {
    let totalConnections = 0;
    let activeConnections = 0;
    let disconnectedConnections = 0;
    let botConnections = 0;
    let totalQueuedMessages = 0;

    this.connections.forEach(conn => {
      totalConnections++;
      if (conn.isAlive && !conn.disconnectedAt) activeConnections++;
      if (conn.disconnectedAt) disconnectedConnections++;
      if (conn.isBot) botConnections++;
      totalQueuedMessages += conn.messageQueue.length;
    });

    return {
      totalConnections,
      activeConnections,
      disconnectedConnections,
      botConnections,
      uniquePlayers: this.playerConnections.size,
      totalQueuedMessages,
      uptimeMs: Date.now() - (this.connections.size > 0 ? Math.min(...Array.from(this.connections.values()).map(c => c.connectedAt)) : Date.now())
    };
  }

  /**
   * Gracefully shutdown the connection manager
   */
  shutdown(): void {
    this.log('Shutting down ConnectionManager...');

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Disconnect all connections gracefully
    this.connections.forEach((conn, socketId) => {
      try {
        conn.socket.disconnect(true);
      } catch (error) {
        this.log(`Error disconnecting socket ${socketId}: ${error}`);
      }
    });

    this.connections.clear();
    this.playerConnections.clear();

    this.log('ConnectionManager shutdown complete');
  }

  /**
   * Log with optional enable/disable
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[ConnectionManager] ${message}`);
    }
  }
}
