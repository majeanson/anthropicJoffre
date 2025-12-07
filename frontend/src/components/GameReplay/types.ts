/**
 * GameReplay Component Types
 */

import { Socket } from 'socket.io-client';
import { RoundHistory, Card as CardType } from '../../types/game';

export interface ReplayData {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: (1 | 2)[];
  round_history: RoundHistory[];
  trump_suit: string;
  game_duration_seconds: number;
  is_bot_game: boolean;
  created_at: string;
  finished_at: string;
}

export interface GameReplayProps {
  gameId: string;
  socket: Socket | null;
  onClose: () => void;
}

export type PlaySpeed = 0.5 | 1 | 2;

export interface CurrentRoundData {
  currentRound: RoundHistory | null;
  currentTricks: RoundHistory['tricks'];
  hasNextRound: boolean;
  hasPrevRound: boolean;
  hasNextTrick: boolean;
  hasPrevTrick: boolean;
}

export interface PlaybackControlsProps {
  isPlaying: boolean;
  playSpeed: PlaySpeed;
  hasNextTrick: boolean;
  hasPrevTrick: boolean;
  hasNextRound: boolean;
  hasPrevRound: boolean;
  totalRounds: number;
  currentRoundIndex: number;
  onPlayPause: () => void;
  onNextTrick: () => void;
  onPrevTrick: () => void;
  onSetSpeed: (speed: PlaySpeed) => void;
  onJumpToRound: (index: number) => void;
}

export interface ReplayHeaderProps {
  gameId: string;
  totalRounds: number;
  onShare: () => void;
  onClose: () => void;
}

export interface ReplayInfoBarProps {
  replayData: ReplayData;
}

export interface TrickDisplayProps {
  trick: RoundHistory['tricks'][0];
  playerNames: string[];
  playerTeams: (1 | 2)[];
  playedCards: Set<string>;
}

export interface PlayerHandsDisplayProps {
  startingHands: Record<string, CardType[]>;
  playerNames: string[];
  playerTeams: (1 | 2)[];
  playedCards: Set<string>;
}

export interface RoundInfoProps {
  currentRound: RoundHistory;
  currentRoundIndex: number;
  totalRounds: number;
  currentTrickIndex: number;
  totalTricks: number;
}
