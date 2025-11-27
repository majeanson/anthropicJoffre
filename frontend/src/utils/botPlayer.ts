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
    let baseBet = handStrength.estimatedTricks;

    // IMPROVEMENT #2: Position-based bet adjustment
    // Betting position affects strategy
    const bettingPosition = this.getBettingPosition(gameState, playerIndex);

    if (this.difficulty === 'hard') {
      if (bettingPosition === 'first') {
        // Betting first: Slightly conservative (set the bar, others might outbid)
        baseBet = Math.max(7, baseBet - 0.5);
      } else if (bettingPosition === 'last') {
        // Betting last: More aggressive if good hand (know what to beat)
        if (baseBet >= 8) {
          baseBet = Math.min(12, baseBet + 0.5);
        }
      } else if (isDealer) {
        // Dealer: More aggressive (control trump choice)
        baseBet = Math.min(12, baseBet + 0.5);
      }
    }

    // Adjust for difficulty - limit to skip, 7, or 8 for all bots
    let betAmount: number;
    if (this.difficulty === 'easy') {
      // Easy: Random bet from limited options
      betAmount = Math.random() < 0.5 ? 7 : 8;
    } else if (this.difficulty === 'medium') {
      // Medium: Hand strength with limited options
      betAmount = baseBet >= 8 ? 8 : 7;
    } else {
      // Hard: Precise evaluation but still limited
      betAmount = baseBet >= 8 ? 8 : 7;
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

    // IMPROVEMENT #3: Refined "without trump" strategy
    let withoutTrump = false;
    if (this.difficulty === 'hard') {
      // Check if "without trump" is viable:
      // 1. Need control cards (6s and 7s) in dominant suit
      // 2. Dominant suit must have 5+ cards with a 7
      // 3. Avoid if Red 0 is NOT in dominant suit (wasted +5 points)
      const dominantSuit = handStrength.longestSuit;
      const hasRedZero = player.hand.some(c => c.color === 'red' && c.value === 0);
      const redZeroInDominant = hasRedZero && player.hand.some(c => c.color === dominantSuit.color && c.value === 0 && c.color === 'red');

      // Count control cards in dominant suit
      const controlCardsInDominant = player.hand.filter(c =>
        c.color === dominantSuit.color && c.value >= 6
      ).length;

      // Has a 7 in dominant suit
      const has7InDominant = player.hand.some(c => c.color === dominantSuit.color && c.value === 7);

      // Without trump is good if:
      // - 5+ cards in dominant suit with a 7 and 2+ control cards
      // - Either no Red 0, or Red 0 is in the dominant suit
      const withoutTrumpViable =
        dominantSuit.count >= 5 &&
        has7InDominant &&
        controlCardsInDominant >= 2 &&
        (!hasRedZero || redZeroInDominant);

      withoutTrump = withoutTrumpViable && Math.random() < 0.3;
    } else if (this.difficulty === 'medium') {
      // Medium: Basic check for dominant suit
      const dominantSuit = handStrength.longestSuit;
      const has7InDominant = player.hand.some(c => c.color === dominantSuit.color && c.value === 7);
      withoutTrump = dominantSuit.count >= 5 && has7InDominant && Math.random() < 0.2;
    } else {
      withoutTrump = Math.random() < 0.10;
    }

    return { amount: betAmount, withoutTrump, skipped: false };
  }

  /**
   * Find the best trump color for this hand
   * During betting, bots should assume they'll choose the trump with the MOST cards if they win
   *
   * IMPORTANT: Void suits are NOT chosen during betting - they only help if opponents choose them!
   * During betting, you want the suit where you have the most control (most cards + high cards)
   */
  private static findBestTrump(hand: Card[]): CardColor {
    const suitCounts: Record<CardColor, number> = { red: 0, brown: 0, green: 0, blue: 0 };
    const suitHighCards: Record<CardColor, number> = { red: 0, brown: 0, green: 0, blue: 0 };

    hand.forEach(card => {
      suitCounts[card.color]++;
      if (card.value >= 6) {
        suitHighCards[card.color]++;
      }
    });

    // Find color with best combination of quantity and quality
    // Prioritize suits where we have the most cards (trump control)
    let bestTrump: CardColor = 'red';
    let bestScore = 0;

    (Object.keys(suitCounts) as CardColor[]).forEach(color => {
      const count = suitCounts[color];
      const highCards = suitHighCards[color];
      // Score = number of cards + 2x high cards (value quality matters more)
      const score = count + (highCards * 2);
      if (score > bestScore) {
        bestScore = score;
        bestTrump = color;
      }
    });

    return bestTrump;
  }

  /**
   * Evaluate hand strength for betting decisions
   * If trump is null (betting phase), evaluate with the BEST possible trump choice
   */
  private static evaluateHandStrength(hand: Card[], trump: CardColor | null): HandStrength {
    // During betting, choose the best trump for this hand
    const optimalTrump = trump || this.findBestTrump(hand);

    const trumpCount = hand.filter(c => c.color === optimalTrump).length;
    const trumpStrength = hand.filter(c => c.color === optimalTrump).reduce((sum, c) => sum + c.value, 0);
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

    // Trump cards contribute significantly (using optimal trump if betting)
    estimatedTricks += Math.min(trumpCount, 3); // Each trump likely wins
    estimatedTricks += trumpStrength / 10; // High trump cards add value

    // High value cards in strong suits
    estimatedTricks += highCards * 0.8;

    // Longest suit strength (potential to win if led)
    estimatedTricks += longestSuitColor.count * 0.5;

    // Red 0 bonus (worth going for)
    if (redZero) estimatedTricks += 0.5;

    // Brown 0 penalty (want to avoid)
    if (brownZero) estimatedTricks -= 0.3;

    // IMPROVEMENT: Long trump suit bonus (5+ trump = trump bleed strategy)
    // With 5+ trump, you can:
    // 1. Bleed out opponents' trump (force them to use all their trump)
    // 2. Then your high non-trump cards (like 7 red) become unbeatable
    // 3. Control the game flow and win high-value tricks
    if (trumpCount >= 5) {
      // Base bonus for having 5+ trump (can control trump flow)
      estimatedTricks += 1.5;

      // Additional bonus if you have high trump (6 or 7)
      const trumpHighCards = hand.filter(c => c.color === optimalTrump && c.value >= 6).length;
      if (trumpHighCards >= 1) {
        estimatedTricks += 1.0;
      }

      // Extra bonus for 6+ or 7+ trump (overwhelming trump control)
      if (trumpCount >= 6) estimatedTricks += 1.0;
      if (trumpCount >= 7) estimatedTricks += 1.5;
    }

    // IMPROVEMENT: Non-trump 7 bonus when you have trump control
    // If you have 5+ trump AND a 7 in another suit, that 7 is almost guaranteed to win
    // because you can bleed trump first, then play your 7 (nobody can cut it)
    if (trumpCount >= 5) {
      hand.forEach(card => {
        if (card.value === 7 && card.color !== optimalTrump) {
          estimatedTricks += 1.5; // High-value guaranteed win after trump bleed
        }
      });
    }

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
    const partner = this.getPartner(gameState, playerId);
    const currentWinner = this.getCurrentTrickWinner(gameState);

    // PRIORITY 1: Partner is winning - ADD RED 0 IF SAFE (+5 bonus points!)
    if (position >= 2 && partner && currentWinner === partner.id) {
      const redZero = impacts.find(i => i.card.color === 'red' && i.card.value === 0);
      if (redZero) {
        // Check if any other card we have could beat partner's winning card
        const couldBeatPartner = impacts.some(i =>
          i !== redZero && i.canWinTrick
        );

        // If red 0 won't risk the trick (or is trump), ALWAYS play it!
        if (!couldBeatPartner || redZero.card.color === gameState.trump) {
          return redZero.card;
        }
      }

      // Otherwise play lowest card (avoid brown 0!)
      const lowImpactCards = impacts.filter(i =>
        i.impact === 'low' &&
        !(i.card.color === 'brown' && i.card.value === 0)
      );
      if (lowImpactCards.length > 0) {
        return lowImpactCards[0].card;
      }
    }

    // PRIORITY 2: Try to win red 0 trick (opponent has Red 0)
    const redZeroInTrick = currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
    if (redZeroInTrick && position > 1) {
      const winningCards = impacts.filter(i => i.canWinTrick);
      if (winningCards.length > 0) {
        // Use lowest winning card to win the +5 bonus
        return winningCards.reduce((lowest, curr) =>
          curr.card.value < lowest.card.value ? curr : lowest
        ).card;
      }
    }

    // PRIORITY 3: Get rid of brown 0 when safe (only if partner not winning)
    const brownZero = impacts.find(i => i.card.color === 'brown' && i.card.value === 0);
    if (brownZero && position > 1 && (!partner || currentWinner !== partner.id) && Math.random() < 0.6) {
      return brownZero.card;
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

    // PRIORITY 1: Partner is winning - ADD RED 0 IF SAFE (+5 bonus points!)
    if (position >= 2 && partner && currentWinner === partner.id) {
      const redZero = impacts.find(i => i.card.color === 'red' && i.card.value === 0);
      if (redZero) {
        // Check if any other card we have could beat partner's winning card
        const couldBeatPartner = impacts.some(i =>
          i !== redZero && i.canWinTrick
        );

        // If red 0 won't risk the trick (or is trump), ALWAYS play it!
        if (!couldBeatPartner || redZero.card.color === gameState.trump) {
          return redZero.card;
        }
      }

      // Otherwise dump low cards (avoid brown 0 on partner!)
      const lowCards = impacts.filter(i =>
        i.impact === 'low' &&
        !i.isSpecial &&
        !(i.card.color === 'brown' && i.card.value === 0)
      ).sort((a, b) => a.card.value - b.card.value);
      if (lowCards.length > 0) {
        return lowCards[0].card;
      }
    }

    // PRIORITY 2: Win red 0 at minimal cost (opponent has Red 0)
    const redZeroInTrick = currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
    if (redZeroInTrick && position > 1) {
      const winningCards = impacts.filter(i => i.canWinTrick).sort((a, b) => a.card.value - b.card.value);
      if (winningCards.length > 0) {
        // Use the lowest card that can win the +5 bonus
        return winningCards[0].card;
      }
    }

    // IMPROVEMENT #7: Endgame strategy detection
    const player = gameState.players.find(p => p.id === playerId);
    const tricksRemaining = player ? player.hand.length : 0;
    const isEndgame = tricksRemaining <= 2;

    // IMPROVEMENT #10: Better brown 0 disposal timing - DEFENSIVE POISON STRATEGY
    const brownZero = impacts.find(i => i.card.color === 'brown' && i.card.value === 0);
    if (brownZero) {
      // Determine who's winning the trick
      const opponentWinning = currentWinner && partner && currentWinner !== playerId && currentWinner !== partner.id;
      const partnerWinning = currentWinner && partner && currentWinner === partner.id;
      const canWinTrick = impacts.some(i => i.canWinTrick);

      // PRIORITY 1: POISON opponent's trick if they're winning and we can't win
      if (opponentWinning && !canWinTrick) {
        return brownZero.card; // Give them -2 points! Defensive masterclass
      }

      // PRIORITY 2: Avoid brown 0 if partner is winning (don't hurt your own team!)
      if (partnerWinning) {
        // Skip brown 0 disposal - keep it for later
      } else if (!canWinTrick) {
        // PRIORITY 3: Uncertain who wins, but we can't win - dump it strategically
        // In mid/late game when we can't win, dump it on opponents
        if (position > 1 && (!currentWinner || currentWinner !== playerId)) {
          return brownZero.card;
        }
      }
    }

    // IMPROVEMENT #7: Endgame aggressive/defensive strategy
    if (isEndgame && partner && player) {
      const ourTeam = gameState.players.filter(p => p.teamId === player.teamId);
      const opponentTeam = gameState.players.filter(p => p.teamId !== player.teamId);
      const ourPoints = ourTeam.reduce((sum, p) => sum + p.pointsWon, 0);
      const theirPoints = opponentTeam.reduce((sum, p) => sum + p.pointsWon, 0);

      // Check if Red 0 is still in play
      const playedCards = this.cardMemory.get(gameState.id) || [];
      const redZeroPlayed = playedCards.some(c => c.color === 'red' && c.value === 0);
      const redZeroInTrick = currentTrick.some(tc => tc.card.color === 'red' && tc.card.value === 0);
      const redZeroStillOut = !redZeroPlayed && !redZeroInTrick;

      // CASE 1: Red 0 still out and last 1-2 tricks - MUST secure it!
      if (redZeroStillOut && redZeroInTrick && tricksRemaining <= 2) {
        const winningCards = impacts.filter(i => i.canWinTrick);
        if (winningCards.length > 0) {
          // Use HIGHEST card to guarantee win (+5 points is worth it!)
          return winningCards.sort((a, b) => b.card.value - a.card.value)[0].card;
        }
      }

      // CASE 2: Close to bet target - aggressive play
      const highestBet = gameState.highestBet;
      if (highestBet) {
        const betTarget = highestBet.amount;
        const pointsNeeded = betTarget - ourPoints;

        if (pointsNeeded > 0 && pointsNeeded <= (tricksRemaining * 6)) {
          // We can still make our bet - play aggressively
          const winningCards = impacts.filter(i => i.canWinTrick);
          if (winningCards.length > 0) {
            return winningCards.sort((a, b) => a.card.value - b.card.value)[0].card;
          }
        }

        // CASE 3: Opponent close to their bet - defensive play
        const opponentBetWinning = (theirPoints >= betTarget);
        if (opponentBetWinning && tricksRemaining <= 2) {
          // Deny them points - try to win every trick
          const winningCards = impacts.filter(i => i.canWinTrick);
          if (winningCards.length > 0) {
            return winningCards.sort((a, b) => a.card.value - b.card.value)[0].card;
          }
        }
      }
    }

    // IMPROVEMENT #4: Strategic opening leads
    if (position === 1) {
      const trump = gameState.trump;

      // Count cards per suit
      const suitCounts: Record<CardColor, number> = { red: 0, brown: 0, green: 0, blue: 0 };
      playableCards.forEach(card => suitCounts[card.color]++);

      // Strategy 1: Lead from longest suit (4+ cards) to flush out trumps
      const longestSuit = (Object.entries(suitCounts) as [CardColor, number][]).reduce((max, [color, count]) =>
        count > max.count ? { color, count } : max
      , { color: 'red' as CardColor, count: 0 });

      if (longestSuit.count >= 4 && longestSuit.color !== trump) {
        // Lead medium card from longest suit
        const longestSuitCards = impacts.filter(i =>
          i.card.color === longestSuit.color &&
          i.impact === 'medium'
        );
        if (longestSuitCards.length > 0) {
          return longestSuitCards[0].card;
        }
      }

      // Strategy 2: Lead red non-trump early to force out Red 0
      const tricksPlayed = this.cardMemory.get(gameState.id)?.length || 0;
      if (tricksPlayed < 4 && trump !== 'red') {
        const redNonZero = impacts.find(i =>
          i.card.color === 'red' &&
          i.card.value !== 0 &&
          i.impact === 'medium'
        );
        if (redNonZero) {
          return redNonZero.card;
        }
      }

      // Strategy 3: Lead low trump if partner might have Red 0 (set up bonus trick)
      // Only if we have 3+ trumps (can afford to spend one)
      const trumpCards = playableCards.filter(c => c.color === trump);
      if (trumpCards.length >= 3) {
        const lowTrump = trumpCards.filter(c => c.value <= 3);
        if (lowTrump.length > 0) {
          return lowTrump[0];
        }
      }

      // Strategy 4: Avoid leading singletons (gives away info)
      const nonSingletons = impacts.filter(i => suitCounts[i.card.color] > 1);
      if (nonSingletons.length > 0) {
        // Lead medium card from non-singleton suits
        const mediumNonSingletons = nonSingletons.filter(i => i.impact === 'medium');
        if (mediumNonSingletons.length > 0) {
          return mediumNonSingletons[0].card;
        }
        return nonSingletons[0].card;
      }

      // Fallback: Lead medium-high non-trump
      const nonTrumpMedium = impacts.filter(i => !i.isTrump && i.impact === 'medium');
      if (nonTrumpMedium.length > 0) {
        return nonTrumpMedium[0].card;
      }
    }

    if (position === 2) {
      // Second to play: Decide whether to win or duck
      // IMPROVEMENT #5: Prefer guaranteed wins
      const winningCards = impacts.filter(i => i.canWinTrick);
      if (winningCards.length > 0) {
        // Check for guaranteed wins first
        const guaranteedWins = winningCards.filter(i => this.isGuaranteedWin(i.card, gameState));
        if (guaranteedWins.length > 0) {
          // Use lowest guaranteed winning card
          return guaranteedWins.sort((a, b) => a.card.value - b.card.value)[0].card;
        }
        // Otherwise use lowest winning card
        return winningCards.sort((a, b) => a.card.value - b.card.value)[0].card;
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
        // IMPROVEMENT #5: Prefer guaranteed wins
        const winningCards = impacts.filter(i => i.canWinTrick);
        if (winningCards.length > 0) {
          const guaranteedWins = winningCards.filter(i => this.isGuaranteedWin(i.card, gameState));
          if (guaranteedWins.length > 0) {
            return guaranteedWins.sort((a, b) => a.card.value - b.card.value)[0].card;
          }
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
        // IMPROVEMENT #5: At position 4, we know EXACTLY what's needed
        const winningCards = impacts.filter(i => i.canWinTrick);
        if (winningCards.length > 0) {
          // Use absolute lowest card that can win (no need for guaranteed check, we're last!)
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
   * IMPROVEMENT #5: Check if a card is GUARANTEED to win (card counting)
   * Uses card memory to determine if all higher cards have been played
   */
  private static isGuaranteedWin(card: Card, gameState: GameState): boolean {
    const trick = gameState.currentTrick;
    if (trick.length === 0) return false; // Can't guarantee when leading

    const trump = gameState.trump;
    const ledSuit = trick[0].card.color;
    const playedCards = this.cardMemory.get(gameState.id) || [];

    // If our card is trump
    if (card.color === trump) {
      // Check if all higher trumps have been played
      for (let val = card.value + 1; val <= 7; val++) {
        const higherTrump = playedCards.some(c => c.color === trump && c.value === val);
        if (!higherTrump) {
          return false; // A higher trump could still beat us
        }
      }
      return true; // All higher trumps played, we're guaranteed to win
    }

    // If our card is led suit (and trump hasn't been played in trick)
    if (card.color === ledSuit) {
      const trumpInTrick = trick.some(tc => tc.card.color === trump);
      if (trumpInTrick) return false; // Trump already played, we can't win

      // Check if all higher led suit cards have been played
      for (let val = card.value + 1; val <= 7; val++) {
        const higherLedCard = playedCards.some(c => c.color === ledSuit && c.value === val);
        if (!higherLedCard) {
          return false; // A higher led suit card could beat us
        }
      }

      // Check if trump could still beat us (has anyone shown void in led suit?)
      // For now, conservatively assume trump could be played unless we know otherwise
      return false; // Too risky to guarantee when trump could be played
    }

    // Off-suit non-trump can't win
    return false;
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
   * Determine betting position (first, last, middle)
   * IMPROVEMENT #2: Used for position-based bet adjustment
   */
  private static getBettingPosition(gameState: GameState, _playerIndex: number): 'first' | 'middle' | 'last' {
    const currentBets = gameState.currentBets;
    const validBets = currentBets.filter(b => !b.skipped);

    // First to bet if no valid bets yet
    if (validBets.length === 0) return 'first';

    // Last to bet if 3 bets already placed
    if (validBets.length === 3) return 'last';

    // Otherwise middle
    return 'middle';
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
