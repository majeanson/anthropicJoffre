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
}

export interface Bet {
  playerId: string;
  amount: number;
  withoutTrump: boolean;
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

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentBets: Bet[];
  highestBet: Bet | null;
  trump: CardColor | null;
  currentTrick: TrickCard[];
  currentPlayerIndex: number;
  teamScores: {
    team1: number;
    team2: number;
  };
  roundNumber: number;
}
