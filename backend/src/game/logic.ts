import { Card, CardColor, TrickCard, Player, Bet } from '../types/game';

export const getCardPoints = (card: Card): number => {
  // Special cards
  if (card.color === 'red' && card.value === 0) return 5;
  if (card.color === 'brown' && card.value === 0) return -2;
  return 0;
};

export const determineWinner = (
  trick: TrickCard[],
  trump: CardColor | null
): string => {
  if (trick.length === 0) throw new Error('Empty trick');

  let winningCard = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];

    // If current card is trump and winning card is not
    if (trump && current.card.color === trump && winningCard.card.color !== trump) {
      winningCard = current;
    }
    // If both are trump or both are not trump, compare values
    else if (
      (trump && current.card.color === trump && winningCard.card.color === trump) ||
      (current.card.color !== trump && winningCard.card.color !== trump)
    ) {
      if (current.card.value > winningCard.card.value) {
        winningCard = current;
      }
    }
  }

  return winningCard.playerId;
};

export const calculateTrickPoints = (trick: TrickCard[]): number => {
  return trick.reduce((sum, tc) => sum + getCardPoints(tc.card), 0);
};

export const calculateRoundScore = (
  player: Player,
  bet: Bet
): number => {
  const tricksWon = player.tricksWon;
  const betAmount = bet.amount;
  const multiplier = bet.withoutTrump ? 2 : 1;

  if (tricksWon >= betAmount) {
    return betAmount * multiplier;
  } else {
    return -betAmount * multiplier;
  }
};

export const getHighestBet = (bets: Bet[]): Bet | null => {
  if (bets.length === 0) return null;

  return bets.reduce((highest, current) => {
    if (current.amount > highest.amount) return current;
    if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) {
      return current;
    }
    return highest;
  });
};
