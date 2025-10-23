import { determineWinner, calculateRoundScore, getHighestBet } from './logic';
import { TrickCard, Bet, Player } from '../types/game';

describe('Game Logic', () => {
  describe('determineWinner', () => {
    it('should determine winner based on highest led suit card when no trump', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 3 } },  // led suit
        { playerId: 'p2', card: { color: 'blue', value: 7 } }, // off-suit (higher value but wrong suit)
        { playerId: 'p3', card: { color: 'red', value: 5 } },  // led suit (wins)
        { playerId: 'p4', card: { color: 'brown', value: 4 } },
      ];

      const winner = determineWinner(trick, null);
      expect(winner).toBe('p3'); // p3 has highest led suit card
    });

    it('should determine winner when trump card is played', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 2 } },
        { playerId: 'p3', card: { color: 'green', value: 5 } },
        { playerId: 'p4', card: { color: 'brown', value: 4 } },
      ];

      const winner = determineWinner(trick, 'blue');
      expect(winner).toBe('p2');
    });

    it('should determine winner when multiple trump cards are played', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 3 } },
        { playerId: 'p2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', card: { color: 'green', value: 2 } },
        { playerId: 'p4', card: { color: 'red', value: 4 } },
      ];

      const winner = determineWinner(trick, 'red');
      expect(winner).toBe('p2');
    });
  });

  describe('calculateRoundScore', () => {
    it('should calculate positive score when bet is met', () => {
      const player: Player = {
        id: 'p1',
        name: 'Player 1',
        teamId: 1,
        hand: [],
        tricksWon: 8,
        pointsWon: 8,
      };

      const bet: Bet = {
        playerId: 'p1',
        amount: 7,
        withoutTrump: false,
      };

      const score = calculateRoundScore(player, bet);
      expect(score).toBe(7);
    });

    it('should calculate negative score when bet is not met', () => {
      const player: Player = {
        id: 'p1',
        name: 'Player 1',
        teamId: 1,
        hand: [],
        tricksWon: 5,
        pointsWon: 5,
      };

      const bet: Bet = {
        playerId: 'p1',
        amount: 7,
        withoutTrump: false,
      };

      const score = calculateRoundScore(player, bet);
      expect(score).toBe(-7);
    });

    it('should double score when without trump', () => {
      const player: Player = {
        id: 'p1',
        name: 'Player 1',
        teamId: 1,
        hand: [],
        tricksWon: 8,
        pointsWon: 8,
      };

      const bet: Bet = {
        playerId: 'p1',
        amount: 8,
        withoutTrump: true,
      };

      const score = calculateRoundScore(player, bet);
      expect(score).toBe(16);
    });
  });

  describe('getHighestBet', () => {
    it('should return the highest bet by amount', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 7, withoutTrump: false },
        { playerId: 'p2', amount: 10, withoutTrump: false },
        { playerId: 'p3', amount: 8, withoutTrump: false },
      ];

      const highest = getHighestBet(bets);
      expect(highest?.playerId).toBe('p2');
    });

    it('should prioritize without trump when amounts are equal', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 8, withoutTrump: false },
        { playerId: 'p2', amount: 8, withoutTrump: true },
      ];

      const highest = getHighestBet(bets);
      expect(highest?.playerId).toBe('p2');
    });

    it('should return null for empty bets', () => {
      const highest = getHighestBet([]);
      expect(highest).toBeNull();
    });
  });
});
