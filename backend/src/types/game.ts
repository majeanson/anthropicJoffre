export type CardColor = 'red' | 'brown' | 'green' | 'blue';
export type CardValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Card {
  color: CardColor;
  value: CardValue;
}

export interface Player {
  id: string;
  name: string;
  teamId: 1 | 2;
  hand: Card[];
  tricksWon: number;
  pointsWon: number; // Points earned from tricks and special cards
  isBot?: boolean; // True if this player is a bot
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
  playerId: string;
  card: Card;
}

export interface TrickResult {
  trick: TrickCard[];
  winnerId: string;
  points: number;
}

export interface RoundStatistics {
  fastestPlay?: { playerId: string; playerName: string; timeMs: number };
  mostAggressiveBidder?: { playerId: string; playerName: string; bidAmount: number };
  trumpMaster?: { playerId: string; playerName: string; trumpsPlayed: number };
  luckyPlayer?: { playerId: string; playerName: string; reason: string };
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
}

export interface GameState {
  id: string;
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
  playersReady?: string[]; // Array of player IDs who are ready for next round
  roundEndTimestamp?: number; // Timestamp when round ended (for 60s timer)
  rematchVotes?: string[]; // Array of player IDs who voted for rematch
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
