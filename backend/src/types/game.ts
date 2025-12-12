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

  // Raw data for detailed display (Maps will be serialized to objects for JSON)
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
  playerId: string; // Socket ID - volatile, changes on reconnect. DO NOT use for comparisons/lookups
  playerName: string; // STABLE player identifier - ALWAYS use this for comparisons and lookups
  phase: 'betting' | 'playing';
  startTime: number;
  timeoutDuration: number; // in milliseconds (default 60000 = 60s)
}

export interface TimeoutConfig {
  enabled: boolean;
  bettingTimeout: number; // milliseconds
  playingTimeout: number; // milliseconds
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

// OnlinePlayer interface is now defined in utils/onlinePlayerManager.ts
// Re-export for backward compatibility
export { OnlinePlayer } from '../utils/onlinePlayerManager';

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
  // Achievement expansion tracking (Sprint 21)
  perfect_bets_won?: number;
  clean_games_won?: number;
  clean_game_streak?: number;
  max_bet_won?: number;
  double_red_zeros?: number;
}

/**
 * Voice chat participant
 */
export interface VoiceParticipant {
  odId: string;        // Socket ID of the participant
  name: string;        // Display name
  isSpectator: boolean; // True if spectator, false if player
  isMuted: boolean;    // Mute state
  isSpeaking: boolean; // Voice activity indicator
}

// ==================== SIDE BETTING SYSTEM ====================

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
export type SideBetStatus = 'open' | 'active' | 'pending_resolution' | 'resolved' | 'cancelled' | 'expired' | 'disputed';

/**
 * How a bet was resolved
 */
export type SideBetResolution = 'auto' | 'manual' | 'expired' | 'refunded';

/**
 * Resolution timing options for custom bets
 */
export type ResolutionTiming = 'trick' | 'round' | 'game' | 'manual';

/**
 * Side bet between players/spectators
 */
export interface SideBet {
  id: number;
  gameId: string;
  betType: SideBetType;
  presetType?: PresetBetType;        // For preset bets
  customDescription?: string;         // For custom bets (free text)
  resolutionTiming?: ResolutionTiming; // When to resolve custom bet (trick/round/game/manual)
  creatorName: string;                // Who created the bet
  acceptorName?: string;              // Who accepted (null if open)
  amount: number;                     // Coins wagered (1 to creator's balance)
  prediction?: string;                // The bet prediction (e.g., 'team1', '>=5', 'true')
  targetPlayer?: string;              // Who the bet is about (if applicable)
  status: SideBetStatus;
  result?: boolean;                   // null until resolved, true if creator won
  resolvedBy?: SideBetResolution;     // How it was resolved
  roundNumber?: number;               // Which round the bet applies to (null = whole game)
  trickNumber?: number;               // Which trick the bet was created on (for trick-timed resolution)
  claimedWinner?: string;             // For pending_resolution: who claimed they won
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
  resolutionTiming?: ResolutionTiming;
  amount: number;
  prediction?: string;
  targetPlayer?: string;
  roundNumber?: number;
}

/**
 * Socket event payload for accepting a side bet
 */
export interface AcceptSideBetPayload {
  gameId: string;
  betId: number;
}

/**
 * Socket event payload for cancelling a side bet
 */
export interface CancelSideBetPayload {
  gameId: string;
  betId: number;
}

/**
 * Socket event payload for resolving a custom bet manually
 */
export interface ResolveCustomBetPayload {
  gameId: string;
  betId: number;
  creatorWon: boolean;  // true = creator wins, false = acceptor wins
}

/**
 * Socket event payload for disputing a custom bet resolution
 */
export interface DisputeBetPayload {
  gameId: string;
  betId: number;
}

/**
 * Socket event payload for claiming a bet win (starts confirmation flow)
 */
export interface ClaimBetWinPayload {
  gameId: string;
  betId: number;
}

/**
 * Socket event payload for confirming or rejecting a win claim
 */
export interface ConfirmBetResolutionPayload {
  gameId: string;
  betId: number;
  confirmed: boolean;  // true = confirm the claim, false = dispute
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
  streakBonus?: number;       // Bonus coins from streak multiplier
  winnerStreak?: number;      // Winner's new streak count
  streakMultiplier?: number;  // Applied multiplier (1.0, 1.25, 1.5, 2.0)
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

export interface SideBetWinClaimedEvent {
  betId: number;
  claimedBy: string;
  otherParty: string;  // The person who needs to confirm
  bet: SideBet;
}

export interface SideBetsListEvent {
  bets: SideBet[];
}

export interface SideBetPromptResolutionEvent {
  bet: SideBet;
  timing: 'trick' | 'round' | 'game';
  message: string;
}

// ==================== SOCIAL LOUNGE SYSTEM ====================

/**
 * Player status in the lounge
 */
export type PlayerStatus =
  | 'in_lounge'      // Hanging out, available to chat/play
  | 'at_table'       // Sitting at a table, waiting for game
  | 'playing'        // In active game
  | 'spectating'     // Watching a game
  | 'away'           // AFK / Do Not Disturb
  | 'looking_for_game'; // Actively seeking players (highlighted)

/**
 * A table in the lounge (pre-game gathering spot)
 */
export interface LoungeTable {
  id: string;
  name: string;
  hostName: string;
  createdAt: number;
  seats: TableSeat[];
  settings: TableSettings;
  status: 'gathering' | 'ready' | 'in_game' | 'post_game';
  gameId?: string; // Set when game starts
  chatMessages: ChatMessage[];
}

/**
 * A seat at a table
 */
export interface TableSeat {
  position: 0 | 1 | 2 | 3; // 0,2 = Team 1, 1,3 = Team 2
  teamId: 1 | 2;
  playerName: string | null;
  isBot: boolean;
  botDifficulty?: BotDifficulty;
  isReady: boolean;
}

/**
 * Table game settings
 */
export interface TableSettings {
  persistenceMode: 'elo' | 'casual';
  allowBots: boolean;
  isPrivate: boolean;
  maxSpectators: number;
}

/**
 * Activity event in the lounge
 */
export type ActivityEventType =
  | 'player_joined_lounge'
  | 'player_left_lounge'
  | 'table_created'
  | 'table_started'
  | 'game_finished'
  | 'player_looking_for_game'
  | 'player_waved'
  | 'achievement_unlocked';

export interface LoungeActivity {
  id: string;
  type: ActivityEventType;
  timestamp: number;
  playerName: string;
  data: {
    targetPlayer?: string;
    tableName?: string;
    tableId?: string;
    gameResult?: {
      winningTeam: 1 | 2;
      score: string; // e.g., "42-38"
    };
    achievementName?: string;
  };
}

/**
 * Lounge state for a player
 */
export interface LoungeState {
  tables: LoungeTable[];
  activities: LoungeActivity[];
  voiceParticipants: LoungeVoiceParticipant[];
  onlinePlayers: LoungePlayer[];
  liveGames: LiveGame[];
}

/**
 * Player in the lounge with status
 */
export interface LoungePlayer {
  socketId: string;
  playerName: string;
  status: PlayerStatus;
  tableId?: string;
  gameId?: string;
  lastActivity: number;
  isFriend?: boolean;
}

/**
 * Voice participant in lounge voice room
 */
export interface LoungeVoiceParticipant {
  socketId: string;
  playerName: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: number;
}

/**
 * A live game that can be spectated
 */
export interface LiveGame {
  gameId: string;
  team1Players: string[];
  team2Players: string[];
  team1Score: number;
  team2Score: number;
  phase: GamePhase;
  currentTrick: number;
  totalTricks: number;
  spectatorCount: number;
}

// Socket event payloads for lounge
export interface CreateTablePayload {
  name: string;
  settings: TableSettings;
}

export interface JoinTablePayload {
  tableId: string;
  seatPosition?: 0 | 1 | 2 | 3;
}

export interface LeaveTablePayload {
  tableId: string;
}

export interface SetSeatPayload {
  tableId: string;
  seatPosition: 0 | 1 | 2 | 3;
}

export interface AddBotToTablePayload {
  tableId: string;
  seatPosition: 0 | 1 | 2 | 3;
  difficulty: BotDifficulty;
}

export interface RemoveFromSeatPayload {
  tableId: string;
  seatPosition: 0 | 1 | 2 | 3;
}

export interface SetReadyPayload {
  tableId: string;
  isReady: boolean;
}

export interface StartTableGamePayload {
  tableId: string;
}

export interface TableUpdatedEvent {
  table: LoungeTable;
}

export interface WaveAtPlayerPayload {
  targetPlayerName: string;
}

export interface InviteToTablePayload {
  tableId: string;
  targetPlayerName: string;
}

export interface TableInviteReceivedEvent {
  tableId: string;
  tableName: string;
  hostName: string;
  inviterName: string;
}

export interface SetPlayerStatusPayload {
  status: PlayerStatus;
}
