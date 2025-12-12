/**
 * Lounge Component Types
 *
 * Local types for Lounge components.
 * Core types are in types/game.ts
 */

import { Socket } from 'socket.io-client';
import {
  LoungeTable,
  LoungeActivity,
  LoungePlayer,
  LoungeVoiceParticipant,
  LiveGame,
  ChatMessage,
  PlayerStatus,
} from '../../types/game';
import { User } from '../../types/auth';

export interface LoungeProps {
  socket: Socket | null;
  playerName: string;
  user: User | null;
  onJoinGame: (gameId: string) => void;
  onCreateGame: () => void;
  onSpectateGame: (gameId: string) => void;
}

export interface LoungeState {
  tables: LoungeTable[];
  activities: LoungeActivity[];
  voiceParticipants: LoungeVoiceParticipant[];
  onlinePlayers: LoungePlayer[];
  liveGames: LiveGame[];
  loungeMessages: ChatMessage[];
}

export interface VoiceRoomProps {
  socket: Socket | null;
  playerName: string;
  participants: LoungeVoiceParticipant[];
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  isInVoice: boolean;
}

export interface TablesViewProps {
  tables: LoungeTable[];
  onCreateTable: () => void;
  onJoinTable: (tableId: string) => void;
  onViewTable: (tableId: string) => void;
  playerName: string;
}

export interface TableCardProps {
  table: LoungeTable;
  onJoin: () => void;
  onView: () => void;
  isJoinable: boolean;
}

export interface ActivityFeedProps {
  activities: LoungeActivity[];
  onPlayerClick: (playerName: string) => void;
  onTableClick: (tableId: string) => void;
}

export interface WhoIsHereProps {
  players: LoungePlayer[];
  playerName: string;
  onWave: (targetName: string) => void;
  onInvite: (targetName: string) => void;
  onViewProfile: (playerName: string) => void;
  onMessage: (playerName: string) => void;
}

export interface LoungeChatProps {
  socket: Socket | null;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  playerName: string;
  onlinePlayers: LoungePlayer[];
}

export interface LiveGamesProps {
  games: LiveGame[];
  onSpectate: (gameId: string) => void;
}

// Re-export types for convenience
export type {
  LoungeTable,
  LoungeActivity,
  LoungePlayer,
  LoungeVoiceParticipant,
  LiveGame,
  ChatMessage,
  PlayerStatus,
};
