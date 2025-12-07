/**
 * PlayerStatsModal Types
 *
 * Type definitions for the PlayerStatsModal component and its sub-components.
 * PlayerStats is re-exported from usePlayerStats hook (single source of truth).
 */

import { Socket } from 'socket.io-client';
import { GameHistoryEntry } from '../../types/game';

// Re-export PlayerStats from hook to maintain single source of truth
export { type PlayerStats } from '../../hooks/usePlayerStats';

// Namespace-specific tab type to avoid collisions with other components
export type PlayerStatsModalTabType = 'round' | 'game' | 'history' | 'profile';

// These are now re-exported from useGameHistory hook for consistency
export type { HistoryTab as HistoryTabType, ResultFilter as ResultFilterType, SortBy as SortByType, SortOrder as SortOrderType } from '../../hooks/useGameHistory';

export interface RoundStatsTabProps {
  stats: import('../../hooks/usePlayerStats').PlayerStats;
}

export interface GameStatsTabProps {
  stats: import('../../hooks/usePlayerStats').PlayerStats;
}

export interface HistoryTabProps {
  playerName: string;
  socket: Socket;
  gameHistory: GameHistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
  onRetry: () => void;
  onViewReplay?: (gameId: string) => void;
  onViewDetails: (gameId: string) => void;
  onClose: () => void;
}

export interface ProfileTabProps {
  playerName: string;
  isOwnProfile: boolean;
  onSwitchTab: (tab: PlayerStatsModalTabType) => void;
}
