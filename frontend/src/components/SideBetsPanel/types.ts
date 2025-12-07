/**
 * SideBetsPanel Types
 */

import { Socket } from 'socket.io-client';
import type { SideBet } from '../../types/game';

export type SideBetsPanelTabType = 'active' | 'history';

export interface SideBetsPanelProps {
  socket: Socket | null;
  gameId: string;
  playerName: string;
  playerTeamId: 1 | 2;
  isWithoutTrump?: boolean;
  isSpectator?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenBetsCountChange?: (count: number) => void;
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ResolutionPromptState {
  bet: SideBet;
  timing: string;
  message: string;
}

// Props for sub-components
export interface BetCardProps {
  bet: SideBet;
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
  onAccept?: (betId: number) => void;
  onCancel?: (betId: number) => void;
  onClaimWin?: (betId: number) => void;
  onDispute?: (betId: number) => void;
  onConfirmResolution?: (betId: number, confirmed: boolean) => void;
  balance?: number;
  variant: 'open' | 'myOpen' | 'active' | 'history';
}

export interface OpenBetsSectionProps {
  openBets: SideBet[];
  myOpenBets: SideBet[];
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
  balance: number;
  onAccept: (betId: number) => void;
  onCancel: (betId: number) => void;
}

export interface ActiveBetsSectionProps {
  activeBets: SideBet[];
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
  onClaimWin: (betId: number) => void;
  onDispute: (betId: number) => void;
  onConfirmResolution: (betId: number, confirmed: boolean) => void;
}

export interface HistorySectionProps {
  resolvedBets: SideBet[];
  playerName: string;
}

export interface ResolutionPromptModalProps {
  prompt: ResolutionPromptState;
  onClaimWin: () => void;
  onDispute: () => void;
  onClose: () => void;
}
