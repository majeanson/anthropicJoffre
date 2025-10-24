/**
 * Bot logic for automated card selection on the backend.
 *
 * This module implements the "hard" difficulty bot logic from the frontend
 * for use in server-side timeout handling. When a player times out, the server
 * uses this logic to make intelligent card plays instead of random selection.
 *
 * Strategy priorities:
 * 1. Get rid of brown 0 (-2 points) when safe
 * 2. Win red 0 (+5 points) at minimal cost
 * 3. If partner is winning, dump low cards
 * 4. Positional play based on trick position (1st, 2nd, 3rd, 4th)
 */

import { Card, CardColor, TrickCard, GameState, Player } from '../types/game';

/**
 * Card impact assessment
 */
interface CardImpact {
  card: Card;
  impact: 'low' | 'medium' | 'high';
  isTrump: boolean;
  canWinTrick: boolean;
  isSpecial: boolean; // Red 0 or Brown 0
}

/**
 * Select the best card to play using hard bot logic
 */
export function selectBotCard(gameState: GameState, playerId: string): Card | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.hand.length === 0) return null;

  // Get playable cards
  const playableCards = getPlayableCards(gameState, player.hand);
  if (playableCards.length === 0) return null;

  // Determine position in trick (1st, 2nd, 3rd, 4th)
  const position = gameState.currentTrick.length + 1;

  // Assess impact of each playable card
  const cardImpacts = playableCards.map(card =>
    assessCardImpact(card, gameState, position)
  );

  return selectCardHard(gameState, playerId, cardImpacts, playableCards, position);
}

/**
 * Hard bot: Advanced positional strategy with card counting
 */
function selectCardHard(
  gameState: GameState,
  playerId: string,
  impacts: CardImpact[],
  playableCards: Card[],
  position: number
): Card {
  const currentTrick = gameState.currentTrick;
  const partner = getPartner(gameState, playerId);
  const currentWinner = getCurrentTrickWinner(gameState);

  // Priority 1: Get rid of brown 0 strategically
  const brownZero = impacts.find(i => i.card.color === 'brown' && i.card.value === 0);
  if (brownZero) {
    // Play it if we're not winning or if it's safe
    if (position > 1 && (!currentWinner || currentWinner !== playerId)) {
      return brownZero.card;
    }
  }

  // Priority 2: Win red 0 at minimal cost
  const redZeroInTrick = currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
  if (redZeroInTrick && position > 1) {
    const winningCards = impacts.filter(i => i.canWinTrick).sort((a, b) => a.card.value - b.card.value);
    if (winningCards.length > 0) {
      // Use the lowest card that can win
      return winningCards[0].card;
    }
  }

  // Priority 3: Partner is winning - dump low cards or valuable cards to give points
  if (position >= 3 && partner && currentWinner === partner.id) {
    const lowCards = impacts.filter(i => i.impact === 'low' && !i.isSpecial).sort((a, b) => a.card.value - b.card.value);
    if (lowCards.length > 0) {
      return lowCards[0].card;
    }
  }

  // Priority 4: Positional play based on position
  if (position === 1) {
    // Leading: Use medium-high cards in long suits, avoid trump unless strong
    const nonTrumpMedium = impacts.filter(i => !i.isTrump && i.impact === 'medium');
    if (nonTrumpMedium.length > 0) {
      // Lead from longest suit
      const suitCounts: Record<CardColor, number> = { red: 0, brown: 0, green: 0, blue: 0 };
      playableCards.forEach(card => suitCounts[card.color]++);
      const longestSuit = (Object.entries(suitCounts) as [CardColor, number][]).reduce((max, [color, count]) =>
        count > max.count ? { color, count } : max
      , { color: 'red' as CardColor, count: 0 });

      const longestSuitCards = nonTrumpMedium.filter(i => i.card.color === longestSuit.color);
      if (longestSuitCards.length > 0) {
        return longestSuitCards[0].card;
      }
      return nonTrumpMedium[0].card;
    }
  }

  if (position === 2) {
    // Second to play: Decide whether to win or duck
    const canBeatFirst = impacts.some(i => i.canWinTrick);

    if (canBeatFirst) {
      // Win with lowest possible card
      const winningCards = impacts.filter(i => i.canWinTrick).sort((a, b) => a.card.value - b.card.value);
      return winningCards[0].card;
    } else {
      // Can't win, play lowest
      const lowCards = impacts.filter(i => i.impact === 'low');
      if (lowCards.length > 0) return lowCards[0].card;
    }
  }

  if (position === 3) {
    // Third to play: React to first two cards
    if (partner && currentWinner === partner.id) {
      // Partner winning, play low
      const lowCards = impacts.filter(i => i.impact === 'low');
      if (lowCards.length > 0) return lowCards[0].card;
    } else {
      // Try to win or overtrump
      const winningCards = impacts.filter(i => i.canWinTrick);
      if (winningCards.length > 0) {
        return winningCards.sort((a, b) => a.card.value - b.card.value)[0].card;
      }
    }
  }

  if (position === 4) {
    // Last to play: Know exactly what's needed
    if (partner && currentWinner === partner.id) {
      // Partner winning, dump lowest or give high value card if safe
      const lowCards = impacts.filter(i => i.impact === 'low');
      if (lowCards.length > 0) return lowCards[0].card;
    } else {
      // Enemy winning, win if possible
      const winningCards = impacts.filter(i => i.canWinTrick);
      if (winningCards.length > 0) {
        return winningCards.sort((a, b) => a.card.value - b.card.value)[0].card;
      }
    }
  }

  // Fallback: Play safest medium card
  const safeCards = impacts.filter(i => i.impact === 'medium');
  if (safeCards.length > 0) return safeCards[0].card;

  return playableCards[0];
}

/**
 * Assess the impact of playing a card
 */
function assessCardImpact(
  card: Card,
  gameState: GameState,
  position: number
): CardImpact {
  const trump = gameState.trump;
  const isTrump = card.color === trump;
  const isSpecial = (card.color === 'red' && card.value === 0) || (card.color === 'brown' && card.value === 0);

  // Determine if this card can win the current trick
  const canWinTrick = position === 1 ? true : canCardWinTrick(card, gameState);

  // Assess impact level
  let impact: 'low' | 'medium' | 'high';

  if (isTrump) {
    // Trump cards
    if (card.value >= 6) impact = 'high'; // High trump is very valuable
    else if (card.value >= 4) impact = 'medium';
    else impact = 'low';
  } else {
    // Non-trump cards
    if (card.value >= 6) impact = 'high'; // High cards can win tricks
    else if (card.value >= 3) impact = 'medium';
    else impact = 'low';
  }

  // Special cards adjustment
  if (card.color === 'red' && card.value === 0) impact = 'high'; // Red 0 is valuable
  if (card.color === 'brown' && card.value === 0) impact = 'low'; // Brown 0 is bad

  return { card, impact, isTrump, canWinTrick, isSpecial };
}

/**
 * Check if a card can win the current trick
 */
function canCardWinTrick(card: Card, gameState: GameState): boolean {
  const trick = gameState.currentTrick;
  if (trick.length === 0) return true; // First card always "wins" initially

  const trump = gameState.trump;
  const ledSuit = trick[0].card.color;

  // Find current best card
  let currentBest = trick[0].card;
  for (const tc of trick) {
    if (tc.card.color === trump && currentBest.color !== trump) {
      currentBest = tc.card;
    } else if (tc.card.color === currentBest.color && tc.card.value > currentBest.value) {
      currentBest = tc.card;
    } else if (tc.card.color === ledSuit && currentBest.color !== ledSuit && currentBest.color !== trump) {
      currentBest = tc.card;
    }
  }

  // Check if our card beats current best
  if (card.color === trump) {
    return currentBest.color !== trump || card.value > currentBest.value;
  }

  if (card.color === ledSuit) {
    return currentBest.color !== trump && card.value > currentBest.value;
  }

  return false; // Off-suit non-trump can't win
}

/**
 * Get list of cards that are legal to play
 */
function getPlayableCards(gameState: GameState, hand: Card[]): Card[] {
  // If no cards in trick, all cards are playable
  if (gameState.currentTrick.length === 0) return hand;

  // Get led suit
  const ledSuit = gameState.currentTrick[0].card.color;
  const cardsInLedSuit = hand.filter(c => c.color === ledSuit);

  // If player has led suit, they must play it
  if (cardsInLedSuit.length > 0) {
    return cardsInLedSuit;
  }

  // Otherwise, all cards are playable
  return hand;
}

/**
 * Get the bot's partner player
 */
function getPartner(gameState: GameState, playerId: string): Player | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  const partner = gameState.players.find(p => p.id !== playerId && p.teamId === player.teamId);
  return partner || null;
}

/**
 * Determine who is currently winning the trick
 */
function getCurrentTrickWinner(gameState: GameState): string | null {
  const trick = gameState.currentTrick;
  if (trick.length === 0) return null;

  const trump = gameState.trump;
  const ledSuit = trick[0].card.color;

  let winner = trick[0];

  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];

    // Trump beats non-trump
    if (current.card.color === trump && winner.card.color !== trump) {
      winner = current;
      continue;
    }

    // If winner is trump but current isn't, winner stays
    if (winner.card.color === trump && current.card.color !== trump) {
      continue;
    }

    // Both trump or both non-trump: higher value wins (within led suit)
    if (current.card.color === winner.card.color) {
      if (current.card.value > winner.card.value) {
        winner = current;
      }
    } else if (current.card.color === ledSuit && winner.card.color !== ledSuit && winner.card.color !== trump) {
      // Led suit beats off-suit (when neither is trump)
      winner = current;
    }
  }

  return winner.playerId;
}
