/**
 * PlayingPhase Component Types
 *
 * Centralized type definitions for the PlayingPhase component and sub-components.
 */

import { Socket } from 'socket.io-client';
import { GameState, Card as CardType, TrickCard, Player, ChatMessage, VoiceParticipant } from '../../types/game';
import { ConnectionStats } from '../../hooks/useConnectionQuality';
import type { MoveSuggestion } from '../../utils/moveSuggestion';
import type { AchievementProgress } from '../../types/achievements';

// ============================================================================
// Main Component Props
// ============================================================================

export interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
  isSpectator?: boolean;
  currentTrickWinnerId?: string | null;
  onLeaveGame?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  onOpenBotManagement?: () => void;
  onOpenAchievements?: () => void;
  onOpenFriends?: () => void;
  pendingFriendRequestsCount?: number;
  onClickPlayer?: (playerName: string) => void;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  connectionStats?: ConnectionStats;
  // Voice chat props
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  voiceError?: string | null;
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
}

// ============================================================================
// ScoreBoard Types
// ============================================================================

export interface ScoreBoardProps {
  gameState: GameState;
  isCurrentTurn: boolean;
  onAutoplayTimeout: () => void;
}

// ============================================================================
// TrickArea Types
// ============================================================================

export interface TrickWinnerInfo {
  playerName: string;
  points: number;
  teamId: 1 | 2;
  position: 'bottom' | 'left' | 'top' | 'right';
}

export interface TrickAreaProps {
  gameState: GameState;
  currentPlayerIndex: number;
  currentTrickWinnerId: string | null;
  isSpectator: boolean;
  trickWinner?: TrickWinnerInfo | null;
  onClickPlayer?: (playerName: string) => void;
  botThinkingMap: Map<string, string>;
  openThinkingButtons: Set<string>;
  onToggleBotThinking: (botName: string) => void;
  currentSuggestion: MoveSuggestion | null;
  suggestionOpen: boolean;
  onToggleSuggestion: () => void;
  beginnerMode: boolean;
  isCurrentTurn: boolean;
  /** Map of player names to their top achievement badges */
  playerAchievements?: Map<string, AchievementProgress[]>;
}

// ============================================================================
// PlayerHand Types
// ============================================================================

export interface PlayerHandProps {
  hand: CardType[];
  isCurrentTurn: boolean;
  currentTrick: TrickCard[];
  currentPlayerIndex: number;
  roundNumber: number;
  animationsEnabled: boolean;
  isSpectator: boolean;
  onPlayCard: (card: CardType) => void;
  onSetPlayEffect?: (effect: { card: CardType; position: { x: number; y: number } } | null) => void;
  queuedCard?: CardType | null;
  onQueueCard?: (card: CardType | null) => void;
  /** Current trump color - cards of this color will have a pulse effect */
  trump?: string | null;
}

// ============================================================================
// PlayerPosition Types
// ============================================================================

export interface PlayerPositionProps {
  player: Player | null;
  isYou: boolean;
  isWinner: boolean;
  isThinking: boolean;
  onClickPlayer?: (playerName: string) => void;
  botThinking: string | null;
  botThinkingOpen: boolean;
  onToggleBotThinking: () => void;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  showSuggestion: boolean;
  suggestion: MoveSuggestion | null;
  suggestionOpen: boolean;
  onToggleSuggestion: () => void;
  /** Optional achievement badges to display */
  achievementBadges?: AchievementProgress[];
}
