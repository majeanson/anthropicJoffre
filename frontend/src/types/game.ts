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
  pointsWon: number;
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
  dealerIndex: number;
  teamScores: {
    team1: number;
    team2: number;
  };
  roundNumber: number;
  roundHistory: RoundHistory[];
}
