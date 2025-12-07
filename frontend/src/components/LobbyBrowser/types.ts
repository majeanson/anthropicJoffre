export interface LobbyGame {
  gameId: string;
  phase: string;
  persistenceMode: 'elo' | 'casual';
  playerCount: number;
  humanPlayerCount: number;
  botPlayerCount: number;
  isJoinable: boolean;
  isInProgress: boolean;
  teamScores: {
    team1: number;
    team2: number;
  };
  roundNumber: number;
  createdAt: number;
  players: Array<{
    name: string;
    teamId: 1 | 2;
    isBot: boolean;
  }>;
}

export interface RecentGame {
  game_id: string;
  winning_team: 1 | 2;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: (1 | 2)[];
  is_bot_game: boolean;
  game_duration_seconds: number;
  created_at: string;
  finished_at: string;
}

export type LobbyBrowserTabType = 'active' | 'recent';
export type GameModeFilter = 'all' | 'ranked' | 'casual';
export type SortOption = 'newest' | 'players' | 'score';
