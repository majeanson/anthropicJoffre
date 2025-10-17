import { Card, CardColor, TrickCard, Player, Bet } from '../types/game';

export const getCardPoints = (card: Card): number => {
  // Special cards
  if (card.color === 'red' && card.value === 0) return 5;
  if (card.color === 'brown' && card.value === 0) return -3;
  return 0;
};

export const determineWinner = (
  trick: TrickCard[],
  trump: CardColor | null
): string => {
  if (trick.length === 0) throw new Error('Empty trick');

  const ledSuit = trick[0].card.color; // First card determines the led sui
  let winningCard = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];
    const currentIsTrump = trump && current.card.color === trump;
    const winningIsTrump = trump && winningCard.card.color === trump;
    const currentIsLedSuit = current.card.color === ledSuit;
    const winningIsLedSuit = winningCard.card.color === ledSuit;

    // Trump always beats non-trump
    if (currentIsTrump && !winningIsTrump) {
      winningCard = current;
    }
    // If both are trump, higher value wins
    else if (currentIsTrump && winningIsTrump) {
      if (current.card.value > winningCard.card.value) {
        winningCard = current;
      }
    }
    // If winning card is trump, current can't beat it (unless also trump, handled above)
    else if (winningIsTrump) {
      // Do nothing, trump stays winning
    }
    // Led suit beats off-suit (when no trump involved)
    else if (currentIsLedSuit && !winningIsLedSuit) {
      winningCard = current;
    }
    // If both are led suit, higher value wins
    else if (currentIsLedSuit && winningIsLedSuit) {
      if (current.card.value > winningCard.card.value) {
        winningCard = current;
      }
    }
    // Both are off-suit (not trump, not led suit) - keep the winning card as is
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
  const pointsWon = player.pointsWon;
  const betAmount = bet.amount;
  const multiplier = bet.withoutTrump ? 2 : 1;

  if (pointsWon >= betAmount) {
    return betAmount * multiplier;
  } else {
    return -betAmount * multiplier;
  }
};

export const isBetHigher = (bet1: Bet, bet2: Bet): boolean => {
  // bet1 is higher if amount is greater
  if (bet1.amount > bet2.amount) return true;
  // bet1 is higher if same amount but withoutTrump
  if (bet1.amount === bet2.amount && bet1.withoutTrump && !bet2.withoutTrump) return true;
  return false;
};

export const getHighestBet = (bets: Bet[]): Bet | null => {
  if (bets.length === 0) return null;

  // Filter out skipped bets
  const validBets = bets.filter(bet => !bet.skipped);
  if (validBets.length === 0) return null;

  return validBets.reduce((highest, current) => {
    if (isBetHigher(current, highest)) return current;
    return highest;
  });
};
