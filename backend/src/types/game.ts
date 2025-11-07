export type CardColor = 'red' | 'brown' | 'green' | 'blue';
export type CardValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Card {
  color: CardColor;
  value: CardValue;
}

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface Player {
  id: string;
  name: string;
  teamId: 1 | 2;
  hand: Card[];
  tricksWon: number;
  pointsWon: number; // Points earned from tricks and special cards
  isBot?: boolean; // True if this player is a bot
  botDifficulty?: BotDifficulty; // Difficulty level if this is a bot
  connectionStatus?: ConnectionStatus; // Connection status for real-time feedback
  disconnectedAt?: number; // Timestamp when player disconnected
  reconnectTimeLeft?: number; // Seconds left to reconnect (countdown)
  isEmpty?: boolean; // True if this is an empty seat waiting to be filled
  emptySlotName?: string; // Display name for empty slot (e.g., "Empty Seat" or previous player name)
}

export interface Bet {
  playerId: string;
  amount: number; // 7-12, or -1 for skip
  withoutTrump: boolean;
  skipped?: boolean; // True if player skipped their bet
}

export type GamePhase =
  | 'team_selection'
  | 'betting'
  | 'playing'
  | 'scoring'
  | 'game_over';

export interface TrickCard {
  playerId: string; // Socket ID (changes on reconnect) - kept for backwards compat
  playerName: string; // STABLE identifier - use this for lookups
  card: Card;
}

export interface TrickResult {
  trick: TrickCard[];
  winnerId: string; // Socket ID (changes on reconnect) - kept for backwards compat
  winnerName: string; // STABLE identifier - use this for lookups
  points: number;
}

export interface RoundStatistics {
  // Performance-based stats
  trickMaster?: { playerId: string; playerName: string; tricksWon: number };
  pointLeader?: { playerId: string; playerName: string; pointsEarned: number };
  perfectBet?: { playerId: string; playerName: string; betAmount: number };
  teamMVP?: { playerId: string; playerName: string; contribution: number };
  trumpMaster?: { playerId: string; playerName: string; trumpsPlayed: number };
  luckyPlayer?: { playerId: string; playerName: string; redZeros: number };

  // Starting hand stats
  monochrome?: { playerId: string; playerName: string };
  suitedUp?: { playerId: string; playerName: string; suit: string; count: number };
  luckySevens?: { playerId: string; playerName: string; sevensCount: number };
  rainbow?: { playerId: string; playerName: string };
  lowball?: { playerId: string; playerName: string; avgValue: number };
  highRoller?: { playerId: string; playerName: string; avgValue: number };
  trumpHeavy?: { playerId: string; playerName: string; trumpCount: number };

  // Raw data for detailed display (Maps will be serialized to objects for JSON)
  initialHands?: { [playerName: string]: Card[] };
  playerBets?: { [playerName: string]: { amount: number; withoutTrump: boolean } | null };
}

export interface RoundHistory {
  roundNumber: number;
  bets: Bet[];
  highestBet: Bet;
  offensiveTeam: 1 | 2;
  offensivePoints: number;
  defensivePoints: number;
  betAmount: number;
  withoutTrump: boolean;
  betMade: boolean;
  roundScore: {
    team1: number;
    team2: number;
  };
  cumulativeScore: {
    team1: number;
    team2: number;
  };
  tricks: TrickResult[]; // All tricks played in this round
  trump: CardColor | null; // Trump suit for this round
  statistics?: RoundStatistics; // Fun stats for this round
  playerStats?: Array<{
    playerName: string;
    tricksWon: number;
    pointsWon: number;
    redZerosCollected: number;
    brownZerosReceived: number;
  }>;
}

export interface GameState {
  id: string;
  creatorId: string; // Socket ID of the player who created the game
  persistenceMode: 'elo' | 'casual'; // ELO = full database persistence, Casual = memory-only
  isBotGame: boolean; // True if game was created via Quick Play (has bots)
  phase: GamePhase;
  players: Player[];
  currentBets: Bet[];
  highestBet: Bet | null;
  trump: CardColor | null;
  currentTrick: TrickCard[];
  previousTrick: TrickResult | null;
  currentPlayerIndex: number;
  dealerIndex: number; // Index of the current dealer
  teamScores: {
    team1: number;
    team2: number;
  };
  roundNumber: number;
  roundHistory: RoundHistory[];
  currentRoundTricks: TrickResult[]; // Tricks completed in current round (before endRound)
  playersReady?: string[]; // Array of player names who are ready for next round (stable across reconnections)
  roundEndTimestamp?: number; // Timestamp when round ended (for 60s timer)
  rematchVotes?: string[]; // Array of player names who voted for rematch (stable across reconnections)
  currentTimeout?: PlayerTimeout; // Current active timeout for turn-based phases
  afkWarnings?: Map<string, number>; // playerId -> warning count (kick after 3)
}

export interface GameHistory {
  id: number;
  gameId: string;
  winningTeam: 1 | 2;
  finalScores: {
    team1: number;
    team2: number;
  };
  rounds: number;
  createdAt: Date;
}

export interface PlayerSession {
  gameId: string;
  playerId: string;
  playerName: string;
  token: string;
  timestamp: number;
}

export interface PlayerTimeout {
  gameId: string;
  playerId: string;
  phase: 'betting' | 'playing';
  startTime: number;
  timeoutDuration: number; // in milliseconds (default 60000 = 60s)
}

export interface TimeoutConfig {
  enabled: boolean;
  bettingTimeout: number; // milliseconds
  playingTimeout: number; // milliseconds
}

export interface Spectator {
  id: string;
  name: string;
  joinedAt: number;
}

export interface SpectatorGameState extends Omit<GameState, 'players'> {
  players: Omit<Player, 'hand'>[];
}

/**
 * Leaderboard entry from database
 */
export interface LeaderboardEntry {
  player_name: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
  elo_rating: number;
  highest_rating: number;
  total_tricks_won: number;
  total_points_earned: number;
  total_rounds_played: number;
  rounds_won: number;
  rounds_win_percentage: number;
  avg_tricks_per_round: number;
  bet_success_rate: number;
  avg_points_per_round: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

/**
 * Game history entry for a player
 */
export interface GameHistoryEntry {
  game_id: string;
  winning_team: 1 | 2 | null;
  team1_score: number;
  team2_score: number;
  rounds: number;
  is_finished: boolean;
  created_at: Date;
  finished_at: Date | null;
  team_id: 1 | 2;
  tricks_won: number;
  points_earned: number;
  bet_amount: number | null;
  bet_won: boolean | null;
  won_game: boolean;
}

/**
 * Game replay data from database
 */
export interface GameReplayData {
  game_id: string;
  winning_team: 1 | 2 | null;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names: string[];
  player_teams: Array<1 | 2>;
  round_history: RoundHistory[];
  trump_suit: CardColor | null;
  game_duration_seconds: number;
  is_bot_game: boolean;
  is_finished: boolean;
  created_at: Date;
  finished_at: Date | null;
}

/**
 * Online player status
 */
export interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

/**
 * Player statistics from database
 */
export interface PlayerStats {
  id: number;
  player_name: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_abandoned: number;
  win_percentage: number;
  total_tricks_won: number;
  total_points_earned: number;
  avg_tricks_per_game: number;
  total_bets_made: number;
  bets_won: number;
  bets_lost: number;
  avg_bet_amount: number;
  total_bet_amount: number;
  highest_bet: number;
  without_trump_bets: number;
  trump_cards_played: number;
  red_zeros_collected: number;
  brown_zeros_received: number;
  elo_rating: number;
  highest_rating: number;
  is_bot: boolean;
  created_at: Date;
  updated_at: Date;
  // Additional calculated fields from query
  total_rounds_played?: number;
  rounds_won?: number;
  rounds_win_percentage?: number;
  avg_tricks_per_round?: number;
  bet_success_rate?: number;
  avg_points_per_round?: number;
  ranking_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  current_win_streak?: number;
  current_loss_streak?: number;
  best_win_streak?: number;
}
