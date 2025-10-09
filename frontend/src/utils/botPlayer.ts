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
   * Select a card to play
   */
  static playCard(gameState: GameState, playerId: string): Card | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.hand.length === 0) return null;

    // Get playable cards
    const playableCards = this.getPlayableCards(gameState, player.hand);

    if (playableCards.length === 0) return null;

    // Simple strategy: random playable card
    // TODO: Could add more sophisticated AI here
    const randomIndex = Math.floor(Math.random() * playableCards.length);
    return playableCards[randomIndex];
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
   * Get a delay for bot actions (makes gameplay feel more natural)
   */
  static getActionDelay(): number {
    // Random delay between 500-1500ms
    return Math.floor(Math.random() * 1000) + 500;
  }
}
