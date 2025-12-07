import { GameState } from '../../types/game';
import { Socket } from 'socket.io-client';

export type DebugPanelTabType = 'build' | 'gameState' | 'automation' | 'serverHealth' | 'testControls';

export interface HealthData {
  status: string;
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  database: {
    pool: {
      total: number;
      idle: number;
      utilization: string;
    };
  };
  cache: {
    size: number;
    keys: number;
  };
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    heapUtilization: string;
  };
  game: {
    activeGames: number;
    connectedSockets: number;
    onlinePlayers: number;
  };
  errorHandling: {
    totalCalls: number;
    totalErrors: number;
    errorRate: string;
    successRate: string;
  };
}

export interface TabProps {
  gameState: GameState | null;
  gameId: string;
  socket: Socket | null;
}

export interface BuildTabProps {
  // No additional props needed
}

export interface ServerHealthTabProps {
  socket: Socket | null;
}

export interface TestControlsTabProps {
  gameState: GameState | null;
  socket: Socket | null;
}
