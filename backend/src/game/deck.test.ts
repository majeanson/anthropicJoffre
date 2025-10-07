import { createDeck, shuffleDeck, dealCards } from './deck';

describe('Deck Functions', () => {
  describe('createDeck', () => {
    it('should create a deck with 32 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(32);
    });

    it('should have 8 cards of each color', () => {
      const deck = createDeck();
      const colors = ['red', 'brown', 'green', 'blue'];

      colors.forEach(color => {
        const cardsOfColor = deck.filter(card => card.color === color);
        expect(cardsOfColor).toHaveLength(8);
      });
    });

    it('should have values from 0 to 7', () => {
      const deck = createDeck();
      const values = deck.map(card => card.value);

      for (let i = 0; i <= 7; i++) {
        expect(values).toContain(i);
      }
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck with the same cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);

      expect(shuffled).toHaveLength(deck.length);

      // Check all cards are still present
      deck.forEach(card => {
        const found = shuffled.some(
          c => c.color === card.color && c.value === card.value
        );
        expect(found).toBe(true);
      });
    });

    it('should not modify the original deck', () => {
      const deck = createDeck();
      const original = [...deck];
      shuffleDeck(deck);

      expect(deck).toEqual(original);
    });
  });

  describe('dealCards', () => {
    it('should deal cards evenly to 4 players', () => {
      const deck = createDeck();
      const hands = dealCards(deck, 4);

      expect(hands).toHaveLength(4);
      hands.forEach(hand => {
        expect(hand).toHaveLength(8);
      });
    });

    it('should distribute all cards', () => {
      const deck = createDeck();
      const hands = dealCards(deck, 4);

      const totalCards = hands.reduce((sum, hand) => sum + hand.length, 0);
      expect(totalCards).toBe(32);
    });

    it('should not duplicate any cards', () => {
      const deck = createDeck();
      const hands = dealCards(deck, 4);

      const allDealtCards = hands.flat();
      const uniqueCards = new Set(
        allDealtCards.map(c => `${c.color}-${c.value}`)
      );

      expect(uniqueCards.size).toBe(32);
    });
  });
});
