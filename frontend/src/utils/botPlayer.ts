import { Card, GameState } from '../types/game';

/**
 * Bot player AI for automated gameplay
 */
export class BotPlayer {
  /**
   * Select a team for the bot (alternates between teams)
   */
  static selectTeam(playerIndex: number): 1 | 2 {
    return (playerIndex % 2 === 0 ? 1 : 2) as 1 | 2;
  }

  /**
   * Make a betting decision for the bot
   */
  static makeBet(
    gameState: GameState,
    playerId: string
  ): { amount: number; withoutTrump: boolean; skipped: boolean } {
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    const isDealer = playerIndex === gameState.dealerIndex;
    const currentBets = gameState.currentBets;

    // Check if there are any valid bets
    const hasValidBets = currentBets.some(b => !b.skipped);

    // Find highest bet
    const validBets = currentBets.filter(b => !b.skipped);
    const highestBet = validBets.length > 0
      ? validBets.reduce((highest, current) => {
          if (current.amount > highest.amount) return current;
          if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) return current;
          return highest;
        })
      : null;

    // Dealer must bet if no one else has
    if (isDealer && !hasValidBets) {
      return { amount: 7, withoutTrump: false, skipped: false };
    }

    // 30% chance to skip if allowed
    if (!isDealer && Math.random() < 0.3) {
      return { amount: 7, withoutTrump: false, skipped: true };
    }

    // If there's a highest bet, must raise (or dealer can match)
    if (highestBet) {
      const minBet = isDealer ? highestBet.amount : highestBet.amount + 1;
      const maxBet = 12;

      if (minBet > maxBet) {
        // Can't raise, skip
        return { amount: 7, withoutTrump: false, skipped: true };
      }

      // Pick a random bet between min and max
      const amount = Math.floor(Math.random() * (maxBet - minBet + 1)) + minBet;
      const withoutTrump = Math.random() < 0.2; // 20% chance for without trump

      return { amount, withoutTrump, skipped: false };
    }

    // No bets yet, make a random bet between 7-10
    const amount = Math.floor(Math.random() * 4) + 7; // 7-10
    const withoutTrump = Math.random() < 0.15; // 15% chance for without trump

    return { amount, withoutTrump, skipped: false };
  }

  /**
   * Select a card to play using smart strategy
   */
  static playCard(gameState: GameState, playerId: string): Card | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.hand.length === 0) return null;

    // Get playable cards
    const playableCards = this.getPlayableCards(gameState, player.hand);

    if (playableCards.length === 0) return null;

    // Get current trick info
    const currentTrick = gameState.currentTrick;
    const isFirstCard = currentTrick.length === 0;
    const trump = gameState.trump;

    // RULE 2 & 3: Prioritize getting red 0 and avoiding brown 0
    const redZero = playableCards.find(c => c.color === 'red' && c.value === 0);
    const brownZero = playableCards.find(c => c.color === 'brown' && c.value === 0);

    // If we have brown 0 and can play it, do so to get rid of it
    if (brownZero && currentTrick.length > 0) {
      const ledSuit = currentTrick[0].card.color;
      // Play brown 0 if it's the led suit or if we're out of led suit
      if (brownZero.color === ledSuit || playableCards.every(c => c.color !== ledSuit)) {
        return brownZero;
      }
    }

    // RULE 4: If partner is winning and we're playing 3rd or 4th, play lowest card
    if (currentTrick.length >= 2) {
      const partner = this.getPartner(gameState, playerId);
      const currentWinner = this.getCurrentTrickWinner(gameState);

      if (partner && currentWinner === partner.id) {
        // Partner is winning, play lowest card
        const lowestCard = playableCards.reduce((lowest, card) =>
          card.value < lowest.value ? card : lowest
        );
        return lowestCard;
      }
    }

    // RULE 2: Try to win red 0 if it's in the trick
    const redZeroInTrick = currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
    if (redZeroInTrick && !isFirstCard) {
      // Try to win the trick to get red 0
      const winningCard = this.selectWinningCard(gameState, playableCards);
      if (winningCard) return winningCard;
    }

    // RULE 1: Play highest valid card, unless it's trump winning on non-trump
    if (!isFirstCard) {
      const ledSuit = currentTrick[0].card.color;
      const isTrumpLed = ledSuit === trump;

      // If led suit is not trump, and we can win with a non-trump card
      if (!isTrumpLed) {
        const nonTrumpCards = playableCards.filter(c => c.color !== trump);
        if (nonTrumpCards.length > 0) {
          // Play highest non-trump card
          const highestNonTrump = nonTrumpCards.reduce((highest, card) =>
            card.value > highest.value ? card : highest
          );
          return highestNonTrump;
        }
      }

      // Otherwise play highest card (including trump if needed)
      const highestCard = playableCards.reduce((highest, card) =>
        card.value > highest.value ? card : highest
      );
      return highestCard;
    }

    // First card: avoid leading with valuable cards unless necessary
    // Prefer to lead with medium cards
    const sortedCards = [...playableCards].sort((a, b) => a.value - b.value);
    const midIndex = Math.floor(sortedCards.length / 2);
    return sortedCards[midIndex];
  }

  /**
   * Get list of cards that are legal to play
   */
  private static getPlayableCards(gameState: GameState, hand: Card[]): Card[] {
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
  private static getPartner(gameState: GameState, playerId: string): { id: string; teamId: number } | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return null;

    const partner = gameState.players.find(p => p.id !== playerId && p.teamId === player.teamId);
    return partner || null;
  }

  /**
   * Determine who is currently winning the trick
   */
  private static getCurrentTrickWinner(gameState: GameState): string | null {
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

  /**
   * Select a card that will win the current trick
   */
  private static selectWinningCard(gameState: GameState, playableCards: Card[]): Card | null {
    const trick = gameState.currentTrick;
    if (trick.length === 0) return null;

    const trump = gameState.trump;
    const ledSuit = trick[0].card.color;

    // Find current highest card
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

    // Find a card that beats the current best
    const trumpCards = playableCards.filter(c => c.color === trump);
    const ledSuitCards = playableCards.filter(c => c.color === ledSuit);

    // If current best is not trump, try trump first
    if (currentBest.color !== trump && trumpCards.length > 0) {
      return trumpCards.reduce((highest, card) => card.value > highest.value ? card : highest);
    }

    // Try to beat with led suit
    const beatingCards = ledSuitCards.filter(c => c.value > currentBest.value);
    if (beatingCards.length > 0) {
      return beatingCards.reduce((highest, card) => card.value > highest.value ? card : highest);
    }

    // Can't beat, return null
    return null;
  }

  /**
   * Get a delay for bot actions (makes gameplay feel more natural)
   */
  static getActionDelay(): number {
    // Random delay between 500-1500ms
    return Math.floor(Math.random() * 1000) + 500;
  }
}
