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

// Sort cards by color then value
export const sortHand = (hand: Card[]): Card[] => {
  const colorOrder: Record<CardColor, number> = {
    'red': 0,
    'brown': 1,
    'green': 2,
    'blue': 3,
  };

  return [...hand].sort((a, b) => {
    // First sort by color
    const colorDiff = colorOrder[a.color] - colorOrder[b.color];
    if (colorDiff !== 0) return colorDiff;

    // Then sort by value
    return a.value - b.value;
  });
};

export const dealCards = (deck: Card[], numPlayers: number = 4): Card[][] => {
  const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
  deck.forEach((card, index) => {
    hands[index % numPlayers].push(card);
  });

  // Sort each hand by color then value
  return hands.map(hand => sortHand(hand));
};
