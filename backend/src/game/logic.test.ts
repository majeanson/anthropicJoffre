import {
  determineWinner,
  calculateRoundScore,
  getHighestBet,
  isBetHigher,
  getCardPoints,
  calculateTrickPoints,
} from './logic';
import { TrickCard, Bet, Player, Card } from '../types/game';

describe('Game Logic', () => {
  describe('getCardPoints', () => {
    it('should return 5 points for red 0', () => {
      const card: Card = { color: 'red', value: 0 };
      expect(getCardPoints(card)).toBe(5);
    });

    it('should return -3 points for brown 0', () => {
      const card: Card = { color: 'brown', value: 0 };
      expect(getCardPoints(card)).toBe(-3);
    });

    it('should return 0 points for normal cards', () => {
      const normalCards: Card[] = [
        { color: 'red', value: 7 },
        { color: 'blue', value: 0 },
        { color: 'green', value: 5 },
        { color: 'brown', value: 7 },
      ];

      normalCards.forEach(card => {
        expect(getCardPoints(card)).toBe(0);
      });
    });
  });

  describe('calculateTrickPoints', () => {
    it('should calculate total points including special cards', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 7 } },      // 0 points
        { playerId: 'p2', card: { color: 'red', value: 0 } },      // 5 points
        { playerId: 'p3', card: { color: 'brown', value: 0 } },    // -3 points
        { playerId: 'p4', card: { color: 'blue', value: 5 } },     // 0 points
      ];

      expect(calculateTrickPoints(trick)).toBe(2); // 0 + 5 - 3 + 0 = 2
    });

    it('should return 0 for trick with no special cards', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', card: { color: 'blue', value: 5 } },
        { playerId: 'p3', card: { color: 'green', value: 3 } },
        { playerId: 'p4', card: { color: 'brown', value: 2 } },
      ];

      expect(calculateTrickPoints(trick)).toBe(0);
    });
  });

  describe('determineWinner', () => {
    it('should throw error for empty trick', () => {
      expect(() => determineWinner([], null)).toThrow('Empty trick');
    });

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

    it('should pick trump 0 over led suit 7', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 7 } },    // Led suit, highest value
        { playerId: 'p2', card: { color: 'blue', value: 0 } },   // Trump, lowest value
      ];

      expect(determineWinner(trick, 'blue')).toBe('p2'); // Trump wins
    });

    it('should pick higher trump when multiple trumps', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'blue', value: 2 } },   // Trump
        { playerId: 'p2', card: { color: 'blue', value: 6 } },   // Trump (higher)
        { playerId: 'p3', card: { color: 'blue', value: 1 } },   // Trump (lower)
      ];

      expect(determineWinner(trick, 'blue')).toBe('p2');
    });

    it('should handle single card trick', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 5 } },
      ];

      expect(determineWinner(trick, null)).toBe('p1');
    });

    it('should keep first card when all equal values', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', card: { color: 'red', value: 5 } },
        { playerId: 'p2', card: { color: 'red', value: 5 } },
      ];

      expect(determineWinner(trick, null)).toBe('p1');
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

  describe('isBetHigher', () => {
    it('should return true when bet1 has higher amount', () => {
      const bet1: Bet = { playerId: 'p1', amount: 10, withoutTrump: false };
      const bet2: Bet = { playerId: 'p2', amount: 8, withoutTrump: false };
      expect(isBetHigher(bet1, bet2)).toBe(true);
    });

    it('should return false when bet1 has lower amount', () => {
      const bet1: Bet = { playerId: 'p1', amount: 7, withoutTrump: false };
      const bet2: Bet = { playerId: 'p2', amount: 9, withoutTrump: false };
      expect(isBetHigher(bet1, bet2)).toBe(false);
    });

    it('should prioritize without trump when amounts are equal', () => {
      const bet1: Bet = { playerId: 'p1', amount: 8, withoutTrump: true };
      const bet2: Bet = { playerId: 'p2', amount: 8, withoutTrump: false };
      expect(isBetHigher(bet1, bet2)).toBe(true);
    });

    it('should return false when both bets are identical', () => {
      const bet1: Bet = { playerId: 'p1', amount: 8, withoutTrump: false };
      const bet2: Bet = { playerId: 'p2', amount: 8, withoutTrump: false };
      expect(isBetHigher(bet1, bet2)).toBe(false);
    });

    it('should return false when withoutTrump is reversed but amounts equal', () => {
      const bet1: Bet = { playerId: 'p1', amount: 8, withoutTrump: false };
      const bet2: Bet = { playerId: 'p2', amount: 8, withoutTrump: true };
      expect(isBetHigher(bet1, bet2)).toBe(false);
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

    it('should filter out skipped bets', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p2', amount: 8, withoutTrump: false },
        { playerId: 'p3', amount: 0, withoutTrump: false, skipped: true },
      ];

      const highest = getHighestBet(bets);
      expect(highest?.playerId).toBe('p2');
    });

    it('should return null when all bets are skipped', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 0, withoutTrump: false, skipped: true },
        { playerId: 'p2', amount: 0, withoutTrump: false, skipped: true },
      ];

      const highest = getHighestBet(bets);
      expect(highest).toBeNull();
    });

    it('should give dealer priority when bets are exactly equal', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 8, withoutTrump: false },
        { playerId: 'dealer', amount: 8, withoutTrump: false },
      ];

      const highest = getHighestBet(bets, 'dealer');
      expect(highest?.playerId).toBe('dealer');
    });

    it('should not give dealer priority when without trump differs', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 8, withoutTrump: true },
        { playerId: 'dealer', amount: 8, withoutTrump: false },
      ];

      const highest = getHighestBet(bets, 'dealer');
      expect(highest?.playerId).toBe('p1'); // without trump wins
    });

    it('should handle multiple equal bets with dealer in middle', () => {
      const bets: Bet[] = [
        { playerId: 'p1', amount: 9, withoutTrump: false },
        { playerId: 'dealer', amount: 9, withoutTrump: false },
        { playerId: 'p3', amount: 9, withoutTrump: false },
      ];

      const highest = getHighestBet(bets, 'dealer');
      expect(highest?.playerId).toBe('dealer');
    });
  });
});
