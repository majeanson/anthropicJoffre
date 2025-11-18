/**
 * Type-safe Socket.IO event system
 *
 * Defines all possible client-server and server-client events with their payloads.
 * This ensures type safety for socket.emit() and socket.on() calls.
 */

import {
  Card,
  GameState,
  PlayerSession,
  PlayerStats,
  TrickResult,
  SpectatorGameState,
  LeaderboardEntry,
  GameHistoryEntry,
  OnlinePlayer
} from './game';

/**
 * Server → Client events (what server emits to clients)
 */
export type ServerToClientEvents = {
  game_created: {
    gameId: string;
    gameState: GameState;
    session: PlayerSession;
  };
  player_joined: {
    player: {
      id: string;
      name: string;
      teamId: number | null;
      hand: Card[];
      tricksWon: number;
      pointsWon: number;
      isBot?: boolean;
    };
    gameState: GameState;
    session?: PlayerSession;
  };
  spectator_joined: {
    gameState: SpectatorGameState;
    isSpectator: true;
  };
  spectator_left: {
    success: boolean;
  };
  spectator_update: {
    message: string;
    spectatorCount: number;
  };
  game_updated: GameState;
  round_started: GameState;
  trick_resolved: {
    winnerId: string;
    points: number;
    gameState: GameState;
  };
  round_ended: GameState;
  game_over: {
    winningTeam: 1 | 2;
    gameState: GameState;
  };
  error: {
    message: string;
  };
  invalid_move: {
    message: string;
  };
  invalid_bet: {
    message: string;
  };
  player_left: {
    playerId: string;
    gameState: GameState;
  };
  player_kicked: {
    kickedPlayerId: string;
    gameState: GameState;
  };
  reconnection_successful: {
    gameState: GameState;
    session: PlayerSession;
  };
  reconnection_failed: {
    message: string;
  };
  player_reconnected: {
    playerName: string;
    playerId: string;
    oldSocketId: string;
  };
  player_disconnected: {
    playerId: string;
    waitingForReconnection: boolean;
    reconnectTimeLeft?: number;
  };
  lobby_chat_message: {
    playerName: string;
    message: string;
    timestamp: number;
  };
  lobby_chat_history: {
    messages: Array<{
      playerName: string;
      message: string;
      createdAt: string;
    }>;
  };
  team_selection_chat: {
    playerName: string;
    message: string;
    teamId: 1 | 2;
    timestamp: number;
  };
  game_chat: {
    playerName: string;
    message: string;
    teamId: 1 | 2;
    timestamp: number;
  };
  swap_request_received: {
    fromPlayerId: string;
    fromPlayerName: string;
    willChangeTeams: boolean;
  };
  swap_accepted: {
    message: string;
  };
  swap_rejected: {
    message: string;
  };
  rematch_vote_update: {
    votes: Record<string, boolean>;
    votesNeeded: number;
  };
  rematch_started: {
    gameId: string;
    gameState: GameState;
  };
  player_stats: {
    playerName: string;
    stats: PlayerStats;
  };
  leaderboard: {
    players: LeaderboardEntry[];
  };
  player_history: {
    playerName: string;
    games: GameHistoryEntry[];
  };
  online_players: {
    players: OnlinePlayer[];
  };
  timeout_warning: {
    playerId: string;
    playerName: string;
    secondsRemaining: number;
  };
  auto_action_taken: {
    playerId: string;
    playerName: string;
    phase: string;
  };
  ping: void;
};

/**
 * Client → Server events (what clients emit to server)
 */
export type ClientToServerEvents = {
  create_game: (playerName: string) => void;
  join_game: (data: { gameId: string; playerName: string }) => void;
  spectate_game: (data: { gameId: string; spectatorName?: string }) => void;
  leave_spectate: (data: { gameId: string }) => void;
  select_team: (data: { gameId: string; teamId: 1 | 2 }) => void;
  swap_position: (data: { gameId: string; targetPlayerId: string }) => void;
  request_swap: (data: { gameId: string; targetPlayerId: string }) => void;
  respond_to_swap: (data: { gameId: string; requesterId: string; accepted: boolean }) => void;
  start_game: (data: { gameId: string }) => void;
  place_bet: (data: { gameId: string; amount: number; withoutTrump: boolean }) => void;
  play_card: (data: { gameId: string; card: Card }) => void;
  player_ready: (data: { gameId: string }) => void;
  send_lobby_chat: (data: { playerName: string; message: string }) => void;
  get_lobby_chat: (limit?: number) => void;
  send_team_selection_chat: (data: { gameId: string; message: string }) => void;
  send_game_chat: (data: { gameId: string; message: string }) => void;
  reconnect_to_game: (data: { gameId: string; session: PlayerSession }) => void;
  vote_rematch: (data: { gameId: string }) => void;
  kick_player: (data: { gameId: string; playerIdToKick: string }) => void;
  leave_game: (data: { gameId: string }) => void;
  get_player_stats: (data: { playerName: string }) => void;
  get_leaderboard: (limit?: number) => void;
  get_player_history: (data: { playerName: string; limit?: number }) => void;
  get_game_replay: (data: { gameId: string }) => void;
  __test_set_scores: (data: { team1: number; team2: number }) => void;
  pong: () => void;
};

/**
 * Union type of all server→client event names
 */
export type ServerEventName = keyof ServerToClientEvents;

/**
 * Union type of all client→server event names
 */
export type ClientEventName = keyof ClientToServerEvents;

/**
 * Message that can be queued in ConnectionManager
 */
export type QueuedMessage = {
  [K in ServerEventName]: {
    event: K;
    data: ServerToClientEvents[K];
  };
}[ServerEventName];

/**
 * Helper type to get payload type for a specific event
 */
export type EventPayload<E extends ServerEventName> = ServerToClientEvents[E];
