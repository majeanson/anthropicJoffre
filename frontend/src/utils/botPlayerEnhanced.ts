import { Card, GameState, CardColor, CardValue, Player, Bet } from '../types/game';

/**
 * Enhanced Bot AI with Advanced Strategic Concepts
 *
 * Key Improvements:
 * 1. Partner awareness and coordination
 * 2. Card counting and probability calculations
 * 3. Red 0 pursuit strategy (requires partner coordination)
 * 4. Brown 0 avoidance strategy
 * 5. Realistic betting ranges (7-8 normal, 9-10 rare, 11-12 exceptional)
 * 6. Color management and hand strength evaluation
 * 7. Smart leading strategies
 * 8. Non-trump bet evaluation
 */

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface HandAnalysis {
  // Basic metrics
  trumpCount: number;
  trumpStrength: number;
  highCards: number;

  // Special cards
  hasRed0: boolean;
  hasBrown0: boolean;

  // Color analysis
  colorDistribution: Record<CardColor, number>;
  longestSuit: { color: CardColor; count: number };
  hasFourOfSameColor: boolean;

  // Strategic evaluation
  canControlRed0: boolean;  // Has high cards to win red 0
  vulnerableToBrown0: boolean;  // Risk of getting brown 0
  suitControl: Record<CardColor, boolean>;  // Can control each suit

  // Betting evaluation
  estimatedTricks: number;
  recommendedBet: number;
  shouldBetWithoutTrump: boolean;
  handQuality: 'weak' | 'normal' | 'strong' | 'exceptional';
}

interface CardMemory {
  playedCards: Card[];
  remainingCards: Map<string, Card>;  // key: "color-value"
  highestRemainingByColor: Record<CardColor, number>;
  red0Status: 'in_hand' | 'played' | 'unknown';
  brown0Status: 'in_hand' | 'played' | 'unknown';
  partnerSignals: string[];  // Track partner's plays for signals
}

interface PlayDecision {
  card: Card;
  reasoning: string;
  priority: number;
}

export class EnhancedBotPlayer {
  private static difficulty: BotDifficulty = 'medium';
  private static gameMemory: Map<string, CardMemory> = new Map();

  /**
   * Initialize a new game memory
   */
  static initializeGameMemory(gameId: string): void {
    const memory: CardMemory = {
      playedCards: [],
      remainingCards: new Map(),
      highestRemainingByColor: { red: 7, brown: 7, green: 7, blue: 7 },
      red0Status: 'unknown',
      brown0Status: 'unknown',
      partnerSignals: []
    };

    // Initialize all cards as remaining
    const colors: CardColor[] = ['red', 'brown', 'green', 'blue'];
    for (const color of colors) {
      for (let value = 0; value <= 7; value++) {
        memory.remainingCards.set(`${color}-${value}`, { color, value: value as CardValue });
      }
    }

    this.gameMemory.set(gameId, memory);
  }

  /**
   * Set bot difficulty
   */
  static setDifficulty(difficulty: BotDifficulty): void {
    this.difficulty = difficulty;
  }

  /**
   * Select team for bot (ensures balance)
   */
  static selectTeam(playerIndex: number): 1 | 2 {
    // Alternate teams for balance
    return (playerIndex % 2 === 0 ? 1 : 2) as 1 | 2;
  }

  /**
   * Make an intelligent betting decision
   */
  static makeBet(
    gameState: GameState,
    playerId: string
  ): { amount: number; withoutTrump: boolean; skipped: boolean } {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return { amount: 7, withoutTrump: false, skipped: true };

    // Analyze hand
    const analysis = this.analyzeHand(player.hand, gameState.trump);

    // Get betting context
    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    const isDealer = playerIndex === gameState.dealerIndex;
    const currentBets = gameState.currentBets.filter(b => !b.skipped);
    const highestBet = this.getHighestBet(currentBets);
    const hasValidBets = currentBets.length > 0;

    // Dealer must bet if everyone skipped
    if (isDealer && !hasValidBets) {
      return {
        amount: analysis.recommendedBet,
        withoutTrump: false,
        skipped: false
      };
    }

    // Skip decision based on hand quality and difficulty
    if (!isDealer && !hasValidBets) {
      const skipThresholds = {
        easy: { weak: 0.6, normal: 0.3 },
        medium: { weak: 0.4, normal: 0.2 },
        hard: { weak: 0.3, normal: 0.1 }
      };

      const threshold = skipThresholds[this.difficulty][
        analysis.handQuality === 'weak' ? 'weak' : 'normal'
      ];

      if (Math.random() < threshold) {
        return { amount: 7, withoutTrump: false, skipped: true };
      }
    }

    // Calculate bet amount based on analysis
    let betAmount = analysis.recommendedBet;

    // Adjust for highest bet
    if (highestBet) {
      const minBet = isDealer ? highestBet.amount : highestBet.amount + 1;

      // Skip if we need to overbid significantly
      if (!isDealer && minBet > betAmount + 2) {
        return { amount: 7, withoutTrump: false, skipped: true };
      }

      betAmount = Math.max(minBet, betAmount);
      betAmount = Math.min(12, betAmount);
    }

    // Without trump decision
    let withoutTrump = analysis.shouldBetWithoutTrump;

    // Override for difficulty levels
    if (this.difficulty === 'easy') {
      withoutTrump = Math.random() < 0.05;  // Rarely bet without trump
    } else if (this.difficulty === 'medium') {
      withoutTrump = withoutTrump && Math.random() < 0.7;  // Sometimes follow recommendation
    }

    return {
      amount: betAmount,
      withoutTrump,
      skipped: false
    };
  }

  /**
   * Analyze hand strength with advanced metrics
   */
  private static analyzeHand(hand: Card[], trump: CardColor | null): HandAnalysis {
    const analysis: HandAnalysis = {
      trumpCount: 0,
      trumpStrength: 0,
      highCards: 0,
      hasRed0: false,
      hasBrown0: false,
      colorDistribution: { red: 0, brown: 0, green: 0, blue: 0 },
      longestSuit: { color: 'red', count: 0 },
      hasFourOfSameColor: false,
      canControlRed0: false,
      vulnerableToBrown0: false,
      suitControl: { red: false, brown: false, green: false, blue: false },
      estimatedTricks: 0,
      recommendedBet: 7,
      shouldBetWithoutTrump: false,
      handQuality: 'normal'
    };

    // Count cards by color and value
    hand.forEach(card => {
      analysis.colorDistribution[card.color]++;

      if (card.color === trump) {
        analysis.trumpCount++;
        analysis.trumpStrength += card.value;
      }

      if (card.value >= 5) analysis.highCards++;
      if (card.color === 'red' && card.value === 0) analysis.hasRed0 = true;
      if (card.color === 'brown' && card.value === 0) analysis.hasBrown0 = true;
    });

    // Find longest suit
    for (const [color, count] of Object.entries(analysis.colorDistribution) as [CardColor, number][]) {
      if (count > analysis.longestSuit.count) {
        analysis.longestSuit = { color, count };
      }

      // Check for 4+ of same color (strong for non-trump)
      if (count >= 4) {
        analysis.hasFourOfSameColor = true;
      }

      // Check suit control (having 6 or 7 in a suit)
      const hasHighCard = hand.some(c => c.color === color && c.value >= 6);
      if (hasHighCard && count >= 2) {
        analysis.suitControl[color] = true;
      }
    }

    // Red 0 control analysis
    if (analysis.hasRed0) {
      // Need high cards in same suit or trump to protect it
      const redHighCards = hand.filter(c => c.color === 'red' && c.value >= 5).length;
      const canProtect = redHighCards >= 1 || analysis.trumpCount >= 2;
      analysis.canControlRed0 = canProtect;
    } else {
      // Can we win red 0 from opponent?
      const hasRed7 = hand.some(c => c.color === 'red' && c.value === 7);
      const hasHighTrump = !!trump && hand.some(c => c.color === trump && c.value >= 5);
      analysis.canControlRed0 = hasRed7 || hasHighTrump;
    }

    // Brown 0 vulnerability
    if (analysis.hasBrown0) {
      analysis.vulnerableToBrown0 = true;  // Always vulnerable if we have it
    } else {
      // Are we vulnerable to receiving it?
      const brownCards = hand.filter(c => c.color === 'brown').length;
      const lowBrownCards = hand.filter(c => c.color === 'brown' && c.value <= 3).length;
      analysis.vulnerableToBrown0 = brownCards > 0 && lowBrownCards === brownCards;
    }

    // Estimate tricks with refined algorithm
    let tricks = 0;

    // Trump tricks
    if (trump) {
      tricks += Math.min(analysis.trumpCount, 3);  // Each trump likely wins
      if (analysis.trumpStrength >= 15) tricks += 1;  // Bonus for strong trump
    }

    // High card tricks
    const colors: CardColor[] = ['red', 'brown', 'green', 'blue'];
    for (const color of colors) {
      if (color === trump) continue;

      const colorCards = hand.filter(c => c.color === color);
      const has7 = colorCards.some(c => c.value === 7);
      const has6 = colorCards.some(c => c.value === 6);

      if (has7) tricks += 0.8;  // 7 likely wins
      if (has6 && !has7) tricks += 0.5;  // 6 might win if 7 is out

      // Long suit advantage
      if (analysis.colorDistribution[color] >= 4) {
        tricks += 0.5;  // Control advantage
      }
    }

    // Special card adjustments
    if (analysis.hasRed0 && analysis.canControlRed0) {
      tricks += 0.5;  // Bonus for controlling red 0
    }
    if (analysis.hasBrown0) {
      tricks -= 0.3;  // Penalty for brown 0 risk
    }

    analysis.estimatedTricks = Math.round(tricks);

    // Calculate recommended bet (7-8 normal, 9-10 rare, 11-12 exceptional)
    if (analysis.estimatedTricks >= 11) {
      analysis.recommendedBet = 11 + (Math.random() < 0.3 ? 1 : 0);  // 11-12
      analysis.handQuality = 'exceptional';
    } else if (analysis.estimatedTricks >= 9) {
      analysis.recommendedBet = 9 + (Math.random() < 0.4 ? 1 : 0);  // 9-10
      analysis.handQuality = 'strong';
    } else if (analysis.estimatedTricks >= 7) {
      analysis.recommendedBet = 7 + (Math.random() < 0.6 ? 1 : 0);  // 7-8
      analysis.handQuality = 'normal';
    } else {
      analysis.recommendedBet = 7;
      analysis.handQuality = 'weak';
    }

    // Without trump evaluation
    if (analysis.hasFourOfSameColor && analysis.longestSuit.count >= 4) {
      const suitColor = analysis.longestSuit.color;
      const hasControl = analysis.suitControl[suitColor];
      const hasManyHighCards = analysis.highCards >= 4;

      // Need strong colored hand AND control
      analysis.shouldBetWithoutTrump = hasControl && hasManyHighCards && !analysis.hasBrown0;
    }

    return analysis;
  }

  /**
   * Play a card with advanced strategy
   */
  static playCard(gameState: GameState, playerId: string): Card | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.hand.length === 0) return null;

    // Initialize or update game memory
    if (!this.gameMemory.has(gameState.id)) {
      this.initializeGameMemory(gameState.id);
    }
    this.updateMemory(gameState);

    // Get legal plays
    const legalPlays = this.getLegalPlays(gameState, player.hand);
    if (legalPlays.length === 0) return null;
    if (legalPlays.length === 1) return legalPlays[0];

    // Get position and partner info
    const position = gameState.currentTrick.length + 1;
    const partner = this.getPartner(gameState, playerId);
    const memory = this.gameMemory.get(gameState.id)!;

    // Generate play decisions for each card
    const decisions = legalPlays.map(card =>
      this.evaluatePlay(card, gameState, playerId, position, partner, memory)
    );

    // Sort by priority and apply difficulty adjustments
    decisions.sort((a, b) => b.priority - a.priority);

    if (this.difficulty === 'easy') {
      // Easy: 30% optimal, 70% random
      return Math.random() < 0.3 ? decisions[0].card :
        legalPlays[Math.floor(Math.random() * legalPlays.length)];
    } else if (this.difficulty === 'medium') {
      // Medium: 70% optimal, 30% suboptimal
      return Math.random() < 0.7 ? decisions[0].card :
        decisions[Math.min(1, decisions.length - 1)].card;
    } else {
      // Hard: Always optimal
      return decisions[0].card;
    }
  }

  /**
   * Evaluate a potential play
   */
  private static evaluatePlay(
    card: Card,
    gameState: GameState,
    playerId: string,
    position: number,
    partner: Player | null,
    memory: CardMemory
  ): PlayDecision {
    const trick = gameState.currentTrick;
    let priority = 50;  // Base priority
    let reasoning = '';

    // Special card handling
    if (card.color === 'brown' && card.value === 0) {
      // Brown 0 - try to dump it safely
      if (position > 1) {
        const winner = this.getCurrentTrickWinner(gameState);
        if (partner && winner === partner.id) {
          // NEVER give brown 0 to partner!
          priority = 0;
          reasoning = 'Avoid giving brown 0 to partner';
        } else if (winner !== playerId) {
          // Good opportunity to dump on opponent
          priority = 90;
          reasoning = 'Dump brown 0 on opponent';
        }
      } else {
        // Leading with brown 0 is terrible
        priority = 10;
        reasoning = 'Avoid leading brown 0';
      }

      return { card, reasoning, priority };
    }

    if (card.color === 'red' && card.value === 0) {
      // Red 0 - try to win it ourselves or give to partner
      if (position === 1) {
        // Leading red 0 is risky
        priority = 20;
        reasoning = 'Risky to lead red 0';
      } else {
        const winner = this.getCurrentTrickWinner(gameState);
        if (winner === playerId || (partner && winner === partner.id)) {
          priority = 85;
          reasoning = 'Safe to play red 0';
        } else {
          priority = 15;
          reasoning = 'Risk losing red 0';
        }
      }

      return { card, reasoning, priority };
    }

    // Position-specific logic
    if (position === 1) {
      // Leading logic
      priority = this.evaluateLeadingPlay(card, gameState, memory);
      reasoning = 'Leading play';
    } else if (position === 2) {
      // Second to play
      const canWin = this.canCardWinTrick(card, gameState);
      if (canWin) {
        // Check if it's worth winning
        const trickValue = this.evaluateTrickValue(trick);
        priority = 50 + trickValue;
        reasoning = 'Can win trick';
      } else {
        priority = 40 - card.value;  // Play low if can't win
        reasoning = 'Cannot win, playing low';
      }
    } else if (position === 3) {
      // Third to play - critical position
      const winner = this.getCurrentTrickWinner(gameState);
      if (partner && winner === partner.id) {
        // Partner winning - support them
        priority = 30 - card.value;  // Play low
        reasoning = 'Partner winning, playing low';
      } else {
        // Opponent winning - try to take it
        const canWin = this.canCardWinTrick(card, gameState);
        if (canWin) {
          priority = 70;
          reasoning = 'Taking trick from opponent';
        } else {
          priority = 35 - card.value;
          reasoning = 'Cannot win, playing low';
        }
      }
    } else {
      // Fourth to play - perfect information
      const winner = this.getCurrentTrickWinner(gameState);
      const trickValue = this.evaluateTrickValue(trick);

      if (partner && winner === partner.id) {
        // Partner winning
        if (trickValue > 5) {
          priority = 20;  // Don't waste good cards
          reasoning = 'Partner winning valuable trick';
        } else {
          priority = 30 - card.value;
          reasoning = 'Partner winning, dumping low';
        }
      } else {
        // Opponent winning
        const canWin = this.canCardWinTrick(card, gameState);
        if (canWin && trickValue >= 0) {
          // Worth taking
          priority = 80 + trickValue;
          reasoning = 'Taking valuable trick';
        } else {
          priority = 25 - card.value;
          reasoning = 'Not worth taking, playing low';
        }
      }
    }

    return { card, reasoning, priority };
  }

  /**
   * Evaluate leading play with smart strategies
   */
  private static evaluateLeadingPlay(card: Card, gameState: GameState, memory: CardMemory): number {
    const trump = gameState.trump;

    // Don't lead with special cards early
    if (card.color === 'red' && card.value === 0) return 20;
    if (card.color === 'brown' && card.value === 0) return 10;

    // Avoid wasting high cards
    if (card.value === 6) {
      // Check if 7 of same color has been played
      const seven = `${card.color}-7`;
      if (memory.remainingCards.has(seven)) {
        return 30;  // Don't waste 6 when 7 is still out
      }
      return 60;  // 6 is good if 7 is gone
    }

    if (card.value === 7) {
      // Leading with 7 is strong but predictable
      return 65;
    }

    // Leading with high brown early is good (to dump brown 0)
    if (card.color === 'brown' && card.value >= 5 && memory.brown0Status !== 'played') {
      return 70;  // Force out brown cards
    }

    // Leading trump is situational
    if (card.color === trump) {
      // Draw out opponent trumps if we have many
      const trumpCount = gameState.players[gameState.currentPlayerIndex]?.hand
        .filter(c => c.color === trump).length || 0;
      if (trumpCount >= 3) {
        return 55;  // Draw trumps
      }
      return 35;  // Save trumps
    }

    // Medium cards (3-5) are good leads
    if (card.value >= 3 && card.value <= 5) {
      return 50;
    }

    // Low cards are okay leads
    return 40;
  }

  /**
   * Evaluate the value of winning current trick
   */
  private static evaluateTrickValue(trick: { playerId: string; card: Card }[]): number {
    let value = 1;  // Base value

    trick.forEach(tc => {
      if (tc.card.color === 'red' && tc.card.value === 0) {
        value += 5;  // Red 0 is very valuable
      } else if (tc.card.color === 'brown' && tc.card.value === 0) {
        value -= 3;  // Brown 0 is bad
      }
    });

    return value;
  }

  /**
   * Update card memory with played cards
   */
  private static updateMemory(gameState: GameState): void {
    const memory = this.gameMemory.get(gameState.id);
    if (!memory) return;

    // Track current trick
    gameState.currentTrick.forEach(tc => {
      const key = `${tc.card.color}-${tc.card.value}`;
      if (memory.remainingCards.has(key)) {
        memory.remainingCards.delete(key);
        memory.playedCards.push(tc.card);

        // Update special card status
        if (tc.card.color === 'red' && tc.card.value === 0) {
          memory.red0Status = 'played';
        }
        if (tc.card.color === 'brown' && tc.card.value === 0) {
          memory.brown0Status = 'played';
        }

        // Update highest remaining
        if (tc.card.value === memory.highestRemainingByColor[tc.card.color]) {
          // Find new highest
          for (let v = tc.card.value - 1; v >= 0; v--) {
            if (memory.remainingCards.has(`${tc.card.color}-${v}`)) {
              memory.highestRemainingByColor[tc.card.color] = v;
              break;
            }
          }
        }
      }
    });

    // Update from our hand (to track special cards we hold)
    const player = gameState.players[gameState.currentPlayerIndex];
    if (player) {
      const hasRed0 = player.hand.some(c => c.color === 'red' && c.value === 0);
      const hasBrown0 = player.hand.some(c => c.color === 'brown' && c.value === 0);

      if (hasRed0 && memory.red0Status === 'unknown') {
        memory.red0Status = 'in_hand';
      }
      if (hasBrown0 && memory.brown0Status === 'unknown') {
        memory.brown0Status = 'in_hand';
      }
    }
  }

  /**
   * Get legal plays based on trick-taking rules
   */
  private static getLegalPlays(gameState: GameState, hand: Card[]): Card[] {
    if (gameState.currentTrick.length === 0) {
      return hand;  // Can play any card when leading
    }

    const ledSuit = gameState.currentTrick[0].card.color;
    const sameSuitCards = hand.filter(c => c.color === ledSuit);

    // Must follow suit if possible
    if (sameSuitCards.length > 0) {
      return sameSuitCards;
    }

    // Otherwise can play any card
    return hand;
  }

  /**
   * Check if card can win current trick
   */
  private static canCardWinTrick(card: Card, gameState: GameState): boolean {
    const trick = gameState.currentTrick;
    if (trick.length === 0) return true;

    const trump = gameState.trump;
    const ledSuit = trick[0].card.color;

    // Find current best card
    let currentBest = trick[0].card;
    let currentBestValue = this.getCardPower(currentBest, trump, ledSuit);

    for (const tc of trick.slice(1)) {
      const power = this.getCardPower(tc.card, trump, ledSuit);
      if (power > currentBestValue) {
        currentBest = tc.card;
        currentBestValue = power;
      }
    }

    // Check if our card beats it
    const ourPower = this.getCardPower(card, trump, ledSuit);
    return ourPower > currentBestValue;
  }

  /**
   * Calculate card power for comparison
   */
  private static getCardPower(card: Card, trump: CardColor | null, ledSuit: CardColor): number {
    if (card.color === trump) {
      return 100 + card.value;  // Trump always wins
    }
    if (card.color === ledSuit) {
      return 50 + card.value;  // Led suit next best
    }
    return card.value;  // Off-suit can't win
  }

  /**
   * Get current trick winner
   */
  private static getCurrentTrickWinner(gameState: GameState): string | null {
    const trick = gameState.currentTrick;
    if (trick.length === 0) return null;

    const trump = gameState.trump;
    const ledSuit = trick[0].card.color;

    let winner = trick[0];
    let winnerPower = this.getCardPower(winner.card, trump, ledSuit);

    for (const tc of trick.slice(1)) {
      const power = this.getCardPower(tc.card, trump, ledSuit);
      if (power > winnerPower) {
        winner = tc;
        winnerPower = power;
      }
    }

    return winner.playerId;
  }

  /**
   * Get partner player
   */
  private static getPartner(gameState: GameState, playerId: string): Player | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return null;

    return gameState.players.find(p => p.id !== playerId && p.teamId === player.teamId) || null;
  }

  /**
   * Get highest bet from current bets
   */
  private static getHighestBet(bets: Bet[]): Bet | null {
    if (bets.length === 0) return null;

    return bets.reduce((highest, current) => {
      if (current.amount > highest.amount) return current;
      if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) {
        return current;
      }
      return highest;
    });
  }

  /**
   * Get action delay for natural feel
   */
  static getActionDelay(): number {
    const base = { easy: 400, medium: 700, hard: 1000 };
    const variance = { easy: 600, medium: 900, hard: 1200 };

    return base[this.difficulty] + Math.floor(Math.random() * variance[this.difficulty]);
  }

  /**
   * Clear game memory
   */
  static clearMemory(gameId: string): void {
    this.gameMemory.delete(gameId);
  }
}