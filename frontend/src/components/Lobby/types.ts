/**
 * Lobby Component Types
 */

import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../../utils/botPlayerEnhanced';
import { OnlinePlayer } from '../../types/game';
import type { SocialPanelTabType } from '../SocialPanel';

export type LobbyMode = 'menu' | 'create' | 'join' | 'spectate' | 'bot';
export type LobbyMainTab = 'play' | 'social' | 'stats' | 'settings';
/** @deprecated Use SocialPanelTabType instead */
export type LobbySocialTab = SocialPanelTabType;
export type JoinType = 'player' | 'spectator';

export interface LobbyProps {
  onCreateGame: (playerName: string, persistenceMode?: 'elo' | 'casual') => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onSpectateGame: (gameId: string, spectatorName?: string) => void;
  onQuickPlay: (
    difficulty: BotDifficulty,
    persistenceMode: 'elo' | 'casual',
    playerName?: string
  ) => void;
  onRejoinGame?: () => void;
  hasValidSession?: boolean;
  autoJoinGameId?: string;
  onlinePlayers: OnlinePlayer[];
  socket: Socket | null;
  botDifficulty?: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
  onShowProgress?: () => void;
  onShowWhyRegister?: () => void;
  onOpenLounge?: () => void;
}
