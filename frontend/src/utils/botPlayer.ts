import { Card, GameState, CardColor } from '../types/game';

/**
 * Bot difficulty levels
 */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Hand strength evaluation result
 */
interface HandStrength {
  trumpCount: number;
  trumpStrength: number; // Sum of trump card values
  highCards: number; // Cards with value >= 5
  redZero: boolean; // Has the red 0 (+5 points)
  brownZero: boolean; // Has the brown 0 (-2 points)
  longestSuit: { color: CardColor; count: number };
  estimatedTricks: number; // Predicted tricks this hand can win
}

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
 * Bot player AI for automated gameplay with difficulty levels
 */
export class BotPlayer {
  private static difficulty: BotDifficulty = 'medium';
  private static cardMemory: Map<string, Card[]> = new Map(); // Track played cards per game

  /**
   * Set the bot difficulty level
   */
  static setDifficulty(difficulty: BotDifficulty): void {
    this.difficulty = difficulty;
  }

  /**
   * Select a team for the bot (alternates between teams)
   */
  static selectTeam(playerIndex: number): 1 | 2 {
    return (playerIndex % 2 === 0 ? 1 : 2) as 1 | 2;
  }

  /**
   * Make a betting decision based on hand strength
   */
  static makeBet(
    gameState: GameState,
    playerId: string
  ): { amount: number; withoutTrump: boolean; skipped: boolean } {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return { amount: 7, withoutTrump: false, skipped: true };

    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    const isDealer = playerIndex === gameState.dealerIndex;
    const currentBets = gameState.currentBets;
    const hasValidBets = currentBets.some(b => !b.skipped);

    // Evaluate hand strength
    const handStrength = this.evaluateHandStrength(player.hand, gameState.trump);

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
      const conservativeBet = Math.max(7, Math.min(handStrength.estimatedTricks, 9));
      return { amount: conservativeBet, withoutTrump: false, skipped: false };
    }

    // Difficulty-based skip chance
    const skipChance = this.difficulty === 'easy' ? 0.4 : this.difficulty === 'medium' ? 0.25 : 0.15;

    // Skip if hand is weak and not dealer
    if (!isDealer && handStrength.estimatedTricks < 7) {
      if (Math.random() < skipChance) {
        return { amount: 7, withoutTrump: false, skipped: true };
      }
    }

    // Calculate bet amount based on hand strength
    const baseBet = handStrength.estimatedTricks;

    // Adjust for difficulty
    let betAmount: number;
    if (this.difficulty === 'easy') {
      // Easy: Random bet, not strategic
      betAmount = Math.floor(Math.random() * 4) + 7; // 7-10
    } else if (this.difficulty === 'medium') {
      // Medium: Hand strength with some randomness
      betAmount = Math.min(12, Math.max(7, baseBet + Math.floor(Math.random() * 2) - 1));
    } else {
      // Hard: Precise hand evaluation
      betAmount = Math.min(12, Math.max(7, baseBet));
    }

    // If there's a highest bet, must raise (or dealer can match)
    if (highestBet) {
      const minBet = isDealer ? highestBet.amount : highestBet.amount + 1;
      const maxBet = 12;

      if (minBet > maxBet || minBet > betAmount + 2) {
        // Can't raise or hand too weak, skip
        if (!isDealer) {
          return { amount: 7, withoutTrump: false, skipped: true };
        }
      }

      betAmount = Math.max(minBet, betAmount);
      betAmount = Math.min(maxBet, betAmount);
    }

    // Without trump decision based on hand strength
    let withoutTrump = false;
    if (this.difficulty === 'hard') {
      // Hard bots consider without trump if they have strong non-trump suits
      const nonTrumpStrength = handStrength.longestSuit.count >= 4 && handStrength.highCards >= 3;
      withoutTrump = nonTrumpStrength && Math.random() < 0.25;
    } else if (this.difficulty === 'medium') {
      withoutTrump = Math.random() < 0.15;
    } else {
      withoutTrump = Math.random() < 0.10;
    }

    return { amount: betAmount, withoutTrump, skipped: false };
  }

  /**
   * Evaluate hand strength for betting decisions
   */
  private static evaluateHandStrength(hand: Card[], trump: CardColor | null): HandStrength {
    const trumpCount = trump ? hand.filter(c => c.color === trump).length : 0;
    const trumpStrength = trump ? hand.filter(c => c.color === trump).reduce((sum, c) => sum + c.value, 0) : 0;
    const highCards = hand.filter(c => c.value >= 5).length;
    const redZero = hand.some(c => c.color === 'red' && c.value === 0);
    const brownZero = hand.some(c => c.color === 'brown' && c.value === 0);

    // Find longest suit
    const suitCounts: Record<CardColor, number> = { red: 0, brown: 0, green: 0, blue: 0 };
    hand.forEach(card => suitCounts[card.color]++);
    const longestSuitColor = (Object.entries(suitCounts) as [CardColor, number][]).reduce((max, [color, count]) =>
      count > max.count ? { color, count } : max
    , { color: 'red' as CardColor, count: 0 });

    // Estimate tricks bot can win
    let estimatedTricks = 0;

    // Trump cards contribute significantly
    if (trump) {
      estimatedTricks += Math.min(trumpCount, 3); // Each trump likely wins
      estimatedTricks += trumpStrength / 10; // High trump cards add value
    }

    // High value cards in strong suits
    estimatedTricks += highCards * 0.8;

    // Longest suit strength (potential to win if led)
    estimatedTricks += longestSuitColor.count * 0.5;

    // Red 0 bonus (worth going for)
    if (redZero) estimatedTricks += 0.5;

    // Brown 0 penalty (want to avoid)
    if (brownZero) estimatedTricks -= 0.3;

    return {
      trumpCount,
      trumpStrength,
      highCards,
      redZero,
      brownZero,
      longestSuit: longestSuitColor,
      estimatedTricks: Math.round(estimatedTricks)
    };
  }

  /**
   * Select a card to play using positional and strategic awareness
   */
  static playCard(gameState: GameState, playerId: string): Card | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.hand.length === 0) return null;

    // Update card memory
    this.updateCardMemory(gameState);

    // Get playable cards
    const playableCards = this.getPlayableCards(gameState, player.hand);
    if (playableCards.length === 0) return null;

    // Determine position in trick (1st, 2nd, 3rd, 4th)
    const position = gameState.currentTrick.length + 1;

    // Assess impact of each playable card
    const cardImpacts = playableCards.map(card =>
      this.assessCardImpact(card, gameState, position)
    );

    // Different strategies based on difficulty
    if (this.difficulty === 'easy') {
      return this.selectCardEasy(cardImpacts, playableCards);
    } else if (this.difficulty === 'medium') {
      return this.selectCardMedium(gameState, playerId, cardImpacts, playableCards, position);
    } else {
      return this.selectCardHard(gameState, playerId, cardImpacts, playableCards, position);
    }
  }

  /**
   * Easy bot: Simple random-ish selection with basic rules
   */
  private static selectCardEasy(impacts: CardImpact[], playableCards: Card[]): Card {
    // 70% random, 30% avoid brown 0 if possible
    const brownZero = impacts.find(i => i.card.color === 'brown' && i.card.value === 0);
    if (brownZero && Math.random() < 0.3) {
      return brownZero.card;
    }

    // Otherwise random
    return playableCards[Math.floor(Math.random() * playableCards.length)];
  }

  /**
   * Medium bot: Positional awareness with moderate strategy
   */
  private static selectCardMedium(
    gameState: GameState,
    playerId: string,
    impacts: CardImpact[],
    playableCards: Card[],
    position: number
  ): Card {
    const currentTrick = gameState.currentTrick;

    // Rule: Get rid of brown 0 when safe
    const brownZero = impacts.find(i => i.card.color === 'brown' && i.card.value === 0);
    if (brownZero && position > 1 && Math.random() < 0.6) {
      return brownZero.card;
    }

    // Rule: If partner is winning (3rd/4th position), play low
    if (position >= 3) {
      const partner = this.getPartner(gameState, playerId);
      const currentWinner = this.getCurrentTrickWinner(gameState);
      if (partner && currentWinner === partner.id) {
        const lowImpactCards = impacts.filter(i => i.impact === 'low');
        if (lowImpactCards.length > 0) {
          return lowImpactCards[0].card;
        }
      }
    }

    // Rule: Try to win red 0
    const redZeroInTrick = currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
    if (redZeroInTrick && position > 1) {
      const winningCards = impacts.filter(i => i.canWinTrick);
      if (winningCards.length > 0) {
        // Use lowest winning card
        return winningCards.reduce((lowest, curr) =>
          curr.card.value < lowest.card.value ? curr : lowest
        ).card;
      }
    }

    // Position 1: Lead with medium cards
    if (position === 1) {
      const mediumCards = impacts.filter(i => i.impact === 'medium');
      if (mediumCards.length > 0) {
        return mediumCards[Math.floor(Math.random() * mediumCards.length)].card;
      }
    }

    // Position 2-4: Play highest if trying to win, lowest if partner winning
    const highCards = impacts.filter(i => i.impact === 'high');
    if (highCards.length > 0 && Math.random() < 0.5) {
      return highCards[0].card;
    }

    // Default: Play medium impact card
    const mediumCards = impacts.filter(i => i.impact === 'medium');
    if (mediumCards.length > 0) {
      return mediumCards[0].card;
    }

    return playableCards[0];
  }

  /**
   * Hard bot: Advanced positional strategy with card counting
   */
  private static selectCardHard(
    gameState: GameState,
    playerId: string,
    impacts: CardImpact[],
    playableCards: Card[],
    position: number
  ): Card {
    const currentTrick = gameState.currentTrick;
    const partner = this.getPartner(gameState, playerId);
    const currentWinner = this.getCurrentTrickWinner(gameState);

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
      // Leading: Use card counting to determine safe leads
      // Lead with medium-high cards in long suits, avoid trump unless strong
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
  private static assessCardImpact(
    card: Card,
    gameState: GameState,
    position: number
  ): CardImpact {
    const trump = gameState.trump;
    const isTrump = card.color === trump;
    const isSpecial = (card.color === 'red' && card.value === 0) || (card.color === 'brown' && card.value === 0);

    // Determine if this card can win the current trick
    const canWinTrick = position === 1 ? true : this.canCardWinTrick(card, gameState);

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
  private static canCardWinTrick(card: Card, gameState: GameState): boolean {
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
   * Update card memory with played cards
   */
  private static updateCardMemory(gameState: GameState): void {
    const gameId = gameState.id;

    if (!this.cardMemory.has(gameId)) {
      this.cardMemory.set(gameId, []);
    }

    const memory = this.cardMemory.get(gameId)!;

    // Add cards from current trick that aren't already in memory
    gameState.currentTrick.forEach(tc => {
      const alreadyTracked = memory.some(c => c.color === tc.card.color && c.value === tc.card.value);
      if (!alreadyTracked) {
        memory.push(tc.card);
      }
    });

    // Add cards from previous tricks
    if (gameState.previousTrick) {
      gameState.previousTrick.trick.forEach(tc => {
        const alreadyTracked = memory.some(c => c.color === tc.card.color && c.value === tc.card.value);
        if (!alreadyTracked) {
          memory.push(tc.card);
        }
      });
    }
  }

  /**
   * Get all cards that have been played this round
   * (Currently unused but kept for future card counting enhancements)
   */
  // @ts-ignore - Unused for now but will be used for advanced card counting
  private static getPlayedCards(gameState: GameState): Card[] {
    const played: Card[] = [];

    // Cards from completed tricks
    gameState.currentRoundTricks.forEach(trickResult => {
      trickResult.trick.forEach(tc => played.push(tc.card));
    });

    // Cards from current trick
    gameState.currentTrick.forEach(tc => played.push(tc.card));

    return played;
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
   * Get a delay for bot actions (makes gameplay feel more natural)
   */
  static getActionDelay(): number {
    // Difficulty affects thinking time
    const baseDelay = this.difficulty === 'easy' ? 300 :
                      this.difficulty === 'medium' ? 500 : 800;
    const variance = this.difficulty === 'easy' ? 500 :
                     this.difficulty === 'medium' ? 800 : 1200;

    return Math.floor(Math.random() * variance) + baseDelay;
  }

  /**
   * Clear card memory for a specific game (call when game ends)
   */
  static clearMemory(gameId: string): void {
    this.cardMemory.delete(gameId);
  }
}
