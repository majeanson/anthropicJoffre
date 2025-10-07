import { Card, CardColor, CardValue } from '../types/game';

const COLORS: CardColor[] = ['red', 'brown', 'green', 'blue'];
const VALUES: CardValue[] = [0, 1, 2, 3, 4, 5, 6, 7];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const color of COLORS) {
    for (const value of VALUES) {
      deck.push({ color, value });
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const dealCards = (deck: Card[], numPlayers: number = 4): Card[][] => {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, index) => {
    hands[index % numPlayers].push(card);
  });
  return hands;
};
