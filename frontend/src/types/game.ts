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
  pointsWon: number;
  isBot?: boolean; // True if this player is a bot
  botDifficulty?: BotDifficulty; // Difficulty level if this is a bot
  connectionStatus?: ConnectionStatus; // Connection status for real-time feedback
  disconnectedAt?: number; // Timestamp when player disconnected
  reconnectTimeLeft?: number; // Seconds left to reconnect (countdown)
  isEmpty?: boolean; // True if this is an empty seat waiting to be filled
  emptySlotName?: string; // Display name for empty slot (e.g., "Empty Seat" or previous player name)
  beginnerMode?: boolean; // True if player has beginner mode enabled (2x timeout + tutorial tips)
}

export interface Bet {
  playerId: string; // Socket ID - volatile, changes on reconnect. DO NOT use for comparisons/lookups
  playerName: string; // STABLE player identifier - ALWAYS use this for comparisons and lookups
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
  playerId: string; // Socket ID - volatile, changes on reconnect. DO NOT use for comparisons/lookups
  playerName: string; // STABLE player identifier - ALWAYS use this for comparisons and lookups
  card: Card;
}

export interface TrickResult {
  trick: TrickCard[];
  winnerId: string; // Socket ID - volatile, changes on reconnect. DO NOT use for comparisons/lookups
  winnerName: string; // STABLE player identifier - ALWAYS use this for comparisons and lookups
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

  // Raw data for detailed display
  initialHands?: { [playerName: string]: Card[] };
  playerBets?: { [playerName: string]: { amount: number; withoutTrump: boolean } | null };
}

export interface RoundHistory {
  roundNumber: number;
  dealerName: string; // Name of the dealer for this round
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

export interface PlayerTimeout {
  gameId: string;
  playerId: string;
  phase: 'betting' | 'playing';
  startTime: number;
  timeoutDuration: number; // in milliseconds (default 60000 = 60s)
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
  dealerIndex: number;
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
}

export interface PlayerSession {
  gameId: string;
  playerId: string;
  playerName: string;
  token: string;
  timestamp: number;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  teamId: 1 | 2 | null;
  message: string;
  timestamp: number;
}

export interface Spectator {
  id: string;
  name: string;
  joinedAt: number;
}

export interface SpectatorGameState extends Omit<GameState, 'players'> {
  players: Omit<Player, 'hand'>[];
}

// Bot management socket event payloads
export interface ReplaceWithBotPayload {
  gameId: string;
  playerNameToReplace: string;
  requestingPlayerName: string;
}

export interface TakeOverBotPayload {
  gameId: string;
  botNameToReplace: string;
  newPlayerName: string;
}

export interface ChangeBotDifficultyPayload {
  gameId: string;
  botName: string;
  difficulty: BotDifficulty;
}

export interface BotReplacedPayload {
  gameState: GameState;
  replacedPlayerName: string;
  botName: string;
}

export interface BotTakenOverPayload {
  gameState: GameState;
  botName: string;
  newPlayerName: string;
  session: PlayerSession;
}

export interface AvailableBot {
  name: string;
  teamId: 1 | 2;
  difficulty: BotDifficulty;
}

export interface GameFullWithBotsPayload {
  gameId: string;
  availableBots: AvailableBot[];
}

/**
 * Leaderboard entry from database
 * Sync with backend/src/types/game.ts
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
 * Sync with backend/src/types/game.ts
 */
export interface GameHistoryEntry {
  game_id: string;
  winning_team: 1 | 2 | null;
  team1_score: number;
  team2_score: number;
  rounds: number;
  player_names?: string[]; // For recent players feature
  is_finished: boolean;
  created_at: Date | string;
  finished_at: Date | string | null;
  team_id: 1 | 2;
  tricks_won: number;
  points_earned: number;
  bet_amount: number | null;
  bet_won: boolean | null;
  won_game: boolean;
}

/**
 * Online player status
 * Sync with backend/src/types/game.ts
 */
export interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

/**
 * Voice chat participant
 * Sync with backend/src/types/game.ts
 */
export interface VoiceParticipant {
  odId: string;        // Socket ID of the participant
  name: string;        // Display name
  isSpectator: boolean; // True if spectator, false if player
  isMuted: boolean;    // Mute state
  isSpeaking: boolean; // Voice activity indicator
}

// ==================== SIDE BETTING SYSTEM ====================
// Sync with backend/src/types/game.ts

/**
 * Type of side bet
 */
export type SideBetType = 'preset' | 'custom';

/**
 * Preset bet types that can be auto-resolved by the game
 */
export type PresetBetType =
  | 'red_zero_winner'      // Which team wins the trick containing red 0
  | 'brown_zero_victim'    // Which team takes the brown 0 (loses points)
  | 'tricks_over_under'    // Target player wins >= X tricks
  | 'team_score_over_under' // Team scores >= X points in round
  | 'bet_made'             // Betting team makes their bet
  | 'without_trump_success' // "Without trump" bet succeeds
  | 'first_trump_played';  // Who plays the first trump card

/**
 * Status of a side bet
 */
export type SideBetStatus = 'open' | 'active' | 'resolved' | 'cancelled' | 'expired' | 'disputed';

/**
 * How a bet was resolved
 */
export type SideBetResolution = 'auto' | 'manual' | 'expired' | 'refunded';

/**
 * Side bet between players/spectators
 */
export interface SideBet {
  id: number;
  gameId: string;
  betType: SideBetType;
  presetType?: PresetBetType;        // For preset bets
  customDescription?: string;         // For custom bets (free text)
  creatorName: string;                // Who created the bet
  acceptorName?: string;              // Who accepted (null if open)
  amount: number;                     // Coins wagered (1 to creator's balance)
  prediction?: string;                // The bet prediction (e.g., 'team1', '>=5', 'true')
  targetPlayer?: string;              // Who the bet is about (if applicable)
  status: SideBetStatus;
  result?: boolean;                   // null until resolved, true if creator won
  resolvedBy?: SideBetResolution;     // How it was resolved
  roundNumber?: number;               // Which round the bet applies to (null = whole game)
  createdAt: Date;
  acceptedAt?: Date;
  resolvedAt?: Date;
}

/**
 * Socket event payload for creating a side bet
 */
export interface CreateSideBetPayload {
  gameId: string;
  betType: SideBetType;
  presetType?: PresetBetType;
  customDescription?: string;
  amount: number;
  prediction?: string;
  targetPlayer?: string;
  roundNumber?: number;
}

/**
 * Server response for side bet events
 */
export interface SideBetCreatedEvent {
  bet: SideBet;
}

export interface SideBetAcceptedEvent {
  betId: number;
  acceptorName: string;
}

export interface SideBetResolvedEvent {
  betId: number;
  result: boolean;       // true = creator won
  winnerName: string;
  loserName: string;
  coinsAwarded: number;
}

export interface SideBetCancelledEvent {
  betId: number;
  reason: 'creator_cancelled' | 'expired' | 'game_ended';
}

export interface SideBetDisputedEvent {
  betId: number;
  disputedBy: string;
  refundAmount: number;
}

export interface SideBetsListEvent {
  bets: SideBet[];
}
