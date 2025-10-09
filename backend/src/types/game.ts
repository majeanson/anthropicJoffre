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
