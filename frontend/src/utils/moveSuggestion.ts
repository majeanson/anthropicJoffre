/**
 * Move Suggestion System for Beginner Mode
 * Analyzes the game state and suggests the best move with explanations
 */

import { Card, GameState, CardColor } from '../types/game';

export interface MoveSuggestion {
  card: Card;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  explanation: string;
  alternatives?: string; // Explanation of other options and why this is better
}

export interface BetSuggestion {
  amount: number;
  withoutTrump: boolean;
  reason: string;
  skip: boolean;
  alternatives?: string; // Explanation of other betting options
}

/**
 * Find the best trump color for this hand
 * During betting, assume you'll choose the trump with the MOST cards if you win
 *
 * IMPORTANT: Void suits are NOT chosen during betting - they only help if opponents choose them!
 * During betting, you want the suit where you have the most control (most cards + high cards)
 */
function findBestTrump(hand: Card[]): CardColor {
  const colorDistribution = new Map<CardColor, number>();
  const colorHighCards = new Map<CardColor, number>();

  // Initialize all colors
  const colors: CardColor[] = ['red', 'brown', 'green', 'blue'];
  colors.forEach(color => {
    colorDistribution.set(color, 0);
    colorHighCards.set(color, 0);
  });

  hand.forEach((card) => {
    colorDistribution.set(card.color, (colorDistribution.get(card.color) || 0) + 1);
    if (card.value >= 6) {
      colorHighCards.set(card.color, (colorHighCards.get(card.color) || 0) + 1);
    }
  });

  // Find color with best combination of quantity and quality
  // Prioritize suits where we have the most cards (trump control)
  let bestTrump: CardColor = 'red';
  let bestScore = 0;

  colorDistribution.forEach((count, color) => {
    const highCards = colorHighCards.get(color) || 0;
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
 * Evaluate hand strength for betting
 * If trump is null (betting phase), evaluate with the BEST possible trump choice
 */
function evaluateHandStrength(hand: Card[], trump: CardColor | null): {
  trumpCount: number;
  highCards: number;
  estimatedTricks: number;
  hasRedZero: boolean;
  hasBrownZero: boolean;
  colorDistribution: Map<CardColor, number>;
  dominantColor: CardColor | null;
  hasSevenInColor: boolean;
  noRedCards: boolean;
  optimalTrump: CardColor;
} {
  // During betting, choose the best trump for this hand
  const optimalTrump = trump || findBestTrump(hand);

  let trumpCount = 0;
  let highCards = 0;
  let estimatedTricks = 0;
  let hasRedZero = false;
  let hasBrownZero = false;
  const colorDistribution = new Map<CardColor, number>();
  let hasSevenInColor = false;
  let noRedCards = true;

  // Track trump high cards separately
  let trumpHighCards = 0;

  hand.forEach((card) => {
    // Count cards by color
    colorDistribution.set(card.color, (colorDistribution.get(card.color) || 0) + 1);

    // Check for red cards
    if (card.color === 'red') {
      noRedCards = false;
    }

    // Count trump cards (using optimal trump if betting)
    if (card.color === optimalTrump) {
      trumpCount++;
      if (card.value >= 6) {
        trumpHighCards++;
      }
      if (card.value >= 5) estimatedTricks += 1;
      if (card.value === 7) {
        estimatedTricks += 0.5;
        hasSevenInColor = true;
      }
    }

    // Count high cards (6 or 7)
    if (card.value >= 6) {
      highCards++;
      if (card.value === 7) hasSevenInColor = true;
    }

    // Check for special cards
    if (card.value === 0 && card.color === 'red') hasRedZero = true;
    if (card.value === 0 && card.color === 'brown') hasBrownZero = true;
  });

  // Find dominant color (color with most cards)
  let dominantColor: CardColor | null = null;
  let maxCount = 0;
  colorDistribution.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  });

  // IMPROVEMENT: Long trump suit bonus (5+ trump = trump bleed strategy)
  // With 5+ trump, you can:
  // 1. Bleed out opponents' trump (force them to use all their trump)
  // 2. Then your high non-trump cards (like 7 red) become unbeatable
  // 3. Control the game flow and win high-value tricks
  if (trumpCount >= 5) {
    // Base bonus for having 5+ trump (can control trump flow)
    estimatedTricks += 1.5;

    // Additional bonus if you have high trump (6 or 7)
    // With high trump + many trump, you can guarantee winning key tricks
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
    highCards,
    estimatedTricks,
    hasRedZero,
    hasBrownZero,
    colorDistribution,
    dominantColor,
    hasSevenInColor,
    noRedCards,
    optimalTrump,
  };
}

/**
 * Suggest a bet for the current player
 * Difficulty guide: 7 or skip = normal, 8 = medium, 9-10 = hard, 11-12 = very hard
 */
export function suggestBet(gameState: GameState, playerName: string): BetSuggestion {
  const player = gameState.players.find((p) => p.name === playerName);
  if (!player) {
    return {
      amount: 7,
      withoutTrump: false,
      skip: true,
      reason: 'Player not found',
    };
  }

  const playerIndex = gameState.players.findIndex((p) => p.name === playerName);
  const isDealer = playerIndex === gameState.dealerIndex;

  // Evaluate hand strength
  const strength = evaluateHandStrength(player.hand, gameState.trump);

  // Find highest bet
  const validBets = gameState.currentBets.filter((b) => !b.skipped);
  const highestBet = validBets.length > 0
    ? validBets.reduce((max, b) => (b.amount > max.amount ? b : max))
    : null;

  // Check if dominant color makes "without trump" viable
  const dominantColorCount = strength.dominantColor ? strength.colorDistribution.get(strength.dominantColor) || 0 : 0;
  const isWithoutTrumpViable = dominantColorCount >= 5 && strength.hasSevenInColor; // Need 5+ cards and a 7 in dominant color

  // CASE 1: Weak hand (< 5 estimated tricks) - Suggest SKIP or 7
  if (strength.estimatedTricks < 5 && !isDealer) {
    return {
      amount: 7,
      withoutTrump: false,
      skip: true,
      reason: `Weak hand - Skip is safest (${strength.trumpCount} ${strength.optimalTrump} if you choose trump, ${strength.highCards} high cards)`,
      alternatives: `Alternative: Bet 7 (normal difficulty) if you're feeling lucky, but you'll likely lose points.`,
    };
  }

  // CASE 2: Very strong hand (10+ tricks possible) - Suggest 11-12 (VERY HARD)
  if (strength.estimatedTricks >= 9 || (strength.trumpCount >= 6 && strength.highCards >= 4)) {
    const suggestedAmount = Math.min(12, 10 + Math.floor(strength.estimatedTricks - 8));

    // Check if "without trump" makes sense
    if (isWithoutTrumpViable && dominantColorCount >= 6) {
      return {
        amount: suggestedAmount,
        withoutTrump: true,
        skip: false,
        reason: `🔥 VERY HARD BET with "Without Trump" (doubles points!) - ${dominantColorCount} ${strength.dominantColor} cards including high cards`,
        alternatives: `Alternative: Bet ${suggestedAmount} with trump for normal play (still very hard). Without trump doubles your points but you must control the game with your ${strength.dominantColor} suit!`,
      };
    }

    return {
      amount: suggestedAmount,
      withoutTrump: false,
      skip: false,
      reason: `🔥 VERY HARD - Excellent hand! (${strength.trumpCount} ${strength.optimalTrump} trump, ${strength.highCards} high cards)`,
      alternatives: highestBet
        ? `Alternative: Match current bet (${highestBet.amount}) to play safer, but you're leaving points on the table.`
        : `Alternative: Bet 9-10 (hard) for less risk.`,
    };
  }

  // CASE 3: Strong hand (7-9 tricks) - Suggest 9-10 (HARD)
  if (strength.estimatedTricks >= 7 || (strength.trumpCount >= 4 && strength.highCards >= 3)) {
    const suggestedAmount = 9 + (strength.estimatedTricks >= 8 ? 1 : 0);

    // Check for "without trump" possibility
    if (isWithoutTrumpViable) {
      return {
        amount: suggestedAmount,
        withoutTrump: true,
        skip: false,
        reason: `⚡ HARD BET with "Without Trump" (doubles points!) - ${dominantColorCount} ${strength.dominantColor} cards with control`,
        alternatives: `Alternative: Bet ${suggestedAmount} with ${strength.optimalTrump} trump for normal play. Without trump is risky but doubles your points if you win with your ${strength.dominantColor} suit!`,
      };
    }

    return {
      amount: suggestedAmount,
      withoutTrump: false,
      skip: false,
      reason: `⚡ HARD - Strong hand (${strength.trumpCount} ${strength.optimalTrump} trump, ${strength.highCards} high cards)`,
      alternatives: `Alternative: Bet 8 (medium) for less pressure.`,
    };
  }

  // CASE 4: Good hand with no red cards (void suit advantage) - Suggest 8-9
  if (strength.noRedCards && strength.trumpCount >= 3) {
    // Check if optimal trump is red (void in red)
    const isVoidRed = strength.optimalTrump === 'red';

    return {
      amount: isVoidRed ? 9 : 8,
      withoutTrump: false,
      skip: false,
      reason: isVoidRed
        ? `✂️ FUNKY - Void in red! Make red trump to cut all red tricks for +5 points (${strength.trumpCount} ${strength.optimalTrump} cards)`
        : `✂️ MEDIUM - No red cards! Cut Red 0 with ${strength.optimalTrump} trump (${strength.trumpCount} cards)`,
      alternatives: isVoidRed
        ? `Void suits are powerful! Every time red is led, you cut with ${strength.optimalTrump} trump. Alternative: Bet 8 for less risk.`
        : `Alternative: Bet 7 to play safe, or 9 if you're confident in controlling Red 0 tricks.`,
    };
  }

  // CASE 5: Medium hand (5-6 tricks) - Suggest 8 (MEDIUM)
  if (strength.estimatedTricks >= 5 || strength.trumpCount >= 3) {
    return {
      amount: 8,
      withoutTrump: false,
      skip: false,
      reason: `📊 MEDIUM - Decent hand (${strength.trumpCount} ${strength.optimalTrump} trump, ${strength.highCards} high cards)`,
      alternatives: isDealer
        ? `As dealer, you must bet or raise. Bet 8 for a balanced risk.`
        : `Alternative: Skip to avoid risk, or bet 7 (normal) for minimum commitment.`,
    };
  }

  // CASE 6: Marginal hand - Suggest 7 (NORMAL) or skip
  return {
    amount: 7,
    withoutTrump: false,
    skip: !isDealer,
    reason: isDealer
      ? `📋 NORMAL - As dealer, bet 7 (minimum) - ${strength.trumpCount} ${strength.optimalTrump} trump`
      : `📋 NORMAL - Marginal hand (${strength.trumpCount} ${strength.optimalTrump} trump), skip is safer`,
    alternatives: isDealer
      ? `As dealer, you must bet. 7 is the safest minimum bet.`
      : `Alternative: Bet 7 if you feel lucky, but skipping avoids losing points.`,
  };
}

/**
 * Get all playable cards based on suit-following rules
 */
function getPlayableCards(hand: Card[], currentTrick: { card: Card; playerId: string }[]): Card[] {
  if (currentTrick.length === 0) {
    return hand; // Leading - can play any card
  }

  const ledSuit = currentTrick[0].card.color;
  const cardsInSuit = hand.filter((c) => c.color === ledSuit);

  // Must follow suit if possible
  if (cardsInSuit.length > 0) {
    return cardsInSuit;
  }

  // No cards in led suit - can play any card
  return hand;
}

/**
 * Determine who is currently winning the trick
 */
function getTrickWinner(currentTrick: { card: Card; playerName: string }[], trump: CardColor | null): { card: Card; playerName: string } {
  return currentTrick.reduce((winning, play) => {
    const winningCard = winning.card;
    const playCard = play.card;

    // Trump beats non-trump
    if (playCard.color === trump && winningCard.color !== trump) return play;
    if (winningCard.color === trump && playCard.color !== trump) return winning;

    // Same suit - higher value wins
    if (playCard.color === winningCard.color) {
      return playCard.value > winningCard.value ? play : winning;
    }

    return winning;
  });
}

/**
 * Check if a card can beat the current winning card
 */
function canBeatCard(myCard: Card, winningCard: Card, _ledSuit: CardColor, trump: CardColor | null): boolean {
  // My card is trump, winning card is not
  if (myCard.color === trump && winningCard.color !== trump) return true;

  // Winning card is trump, my card is not
  if (winningCard.color === trump && myCard.color !== trump) return false;

  // Both same color (either both trump or both led suit)
  if (myCard.color === winningCard.color) {
    return myCard.value > winningCard.value;
  }

  // Different non-trump colors - can't beat
  return false;
}

/**
 * Check if this card is GUARANTEED to win (no unplayed cards can beat it)
 * This accounts for cards already played in the trick and ensures we play high enough to win
 */
function isGuaranteedWin(myCard: Card, currentTrick: { card: Card }[], trump: CardColor | null): boolean {
  const ledSuit = currentTrick.length > 0 ? currentTrick[0].card.color : myCard.color;
  const playedCards = currentTrick.map(t => t.card);

  // If my card is trump
  if (myCard.color === trump) {
    // Check if any higher trump values could still be unplayed
    for (let val = myCard.value + 1; val <= 7; val++) {
      const alreadyPlayed = playedCards.some(c => c.color === trump && c.value === val);
      if (!alreadyPlayed) {
        // A higher trump could still beat us
        return false;
      }
    }
    return true; // All higher trumps have been played
  }

  // If my card is led suit (not trump)
  if (myCard.color === ledSuit) {
    // Check if any higher cards in led suit could beat us
    for (let val = myCard.value + 1; val <= 7; val++) {
      const alreadyPlayed = playedCards.some(c => c.color === ledSuit && c.value === val);
      if (!alreadyPlayed) {
        return false; // A higher led suit card could beat us
      }
    }

    // Check if trump could still beat us
    if (trump && trump !== ledSuit) {
      const trumpPlayed = playedCards.some(c => c.color === trump);
      if (!trumpPlayed) {
        return false; // Trump could still beat us
      }
    }

    return true; // Safe - no higher led suit cards and no trump
  }

  // My card is neither trump nor led suit - can't win
  return false;
}

// Note: This function is kept for future enhancements but not currently used
// It could be useful for more sophisticated probability calculations
// function countBetterCards(myCard: Card, _ledSuit: CardColor, trump: CardColor | null, trickSoFar: { card: Card }[]): number {
//   const playedCards = trickSoFar.map(t => t.card);
//   let betterCount = 0;
//
//   // Count cards that could beat mine
//   for (let val = myCard.value + 1; val <= 7; val++) {
//     // Check if this card has been played
//     const alreadyPlayed = playedCards.some(c => c.color === myCard.color && c.value === val);
//     if (!alreadyPlayed) betterCount++;
//   }
//
//   // If my card is not trump and trump hasn't been played, count trump cards as better
//   if (myCard.color !== trump && trump) {
//     const trumpPlayed = playedCards.some(c => c.color === trump);
//     if (!trumpPlayed) betterCount += 3; // Conservative estimate
//   }
//
//   return betterCount;
// }

/**
 * Suggest the best card to play - with full team awareness
 */
export function suggestMove(gameState: GameState, playerName: string): MoveSuggestion | null {
  const player = gameState.players.find((p) => p.name === playerName);
  if (!player || gameState.phase !== 'playing') return null;

  const playableCards = getPlayableCards(player.hand, gameState.currentTrick);
  if (playableCards.length === 0) return null;

  // Check if only one playable card
  if (playableCards.length === 1) {
    const onlyCard = playableCards[0];
    return {
      card: onlyCard,
      priority: 'high',
      reason: 'Only playable card',
      explanation: `You can only play ${onlyCard.value} ${onlyCard.color} - it's your only legal option!`,
    };
  }

  const currentTrick = gameState.currentTrick;
  const trump = gameState.trump;
  const myTeamId = player.teamId;

  // Find teammate
  const teammate = gameState.players.find(p => p.teamId === myTeamId && p.name !== playerName);
  const teammateInTrick = currentTrick.find(t => t.playerName === teammate?.name);

  // Determine current winner and if it's teammate
  let currentWinner: { card: Card; playerName: string } | null = null;
  let teammateWinning = false;

  if (currentTrick.length > 0) {
    currentWinner = getTrickWinner(currentTrick, trump);
    teammateWinning = currentWinner.playerName === teammate?.name;
  }

  // CASE 1: Leading the trick (first to play)
  if (currentTrick.length === 0) {
    const trumpCards = playableCards.filter((c) => c.color === trump);
    const nonTrumpCards = playableCards.filter((c) => c.color !== trump);

    // Priority: Lead with high trump to win
    if (trumpCards.length > 0) {
      const highestTrump = trumpCards.reduce((max, card) => card.value > max.value ? card : max);

      return {
        card: highestTrump,
        priority: 'high',
        reason: 'Lead with high trump to control',
        explanation: `Leading with ${highestTrump.value} ${highestTrump.color} (trump) gives you the best chance to win this trick!`,
        alternatives: nonTrumpCards.length > 0
          ? `You could save trump by leading non-trump, but you'd risk losing the trick.`
          : undefined,
      };
    }

    // Play highest non-trump to try winning
    if (nonTrumpCards.length > 0) {
      const highestNonTrump = nonTrumpCards.reduce((max, card) => card.value > max.value ? card : max);

      return {
        card: highestNonTrump,
        priority: 'medium',
        reason: 'Lead with high card',
        explanation: `Leading with ${highestNonTrump.value} ${highestNonTrump.color} gives you a good chance to win, especially if others don't have trump.`,
      };
    }
  }

  // CASE 2: Teammate is winning - ADD RED 0 IF SAFE
  if (teammateWinning && currentWinner) {
    const redZero = playableCards.find(c => c.value === 0 && c.color === 'red');
    const ledSuit = currentTrick[0].card.color;

    // Check if red 0 can be beaten
    if (redZero) {
      const canBeBeaten = playableCards.some(c =>
        c !== redZero && canBeatCard(c, currentWinner.card, ledSuit, trump)
      );

      // If red 0 won't risk the trick, ALWAYS play it for bonus points!
      if (!canBeBeaten || redZero.color === trump) {
        return {
          card: redZero,
          priority: 'high',
          reason: '🎯 ADD RED 0 BONUS (+5 points)!',
          explanation: `Your teammate is winning with ${currentWinner.card.value} ${currentWinner.card.color}. Play Red 0 to add +5 bonus points to your team's trick! This is the #1 priority when safe.`,
        };
      }
    }

    // Otherwise, play lowest card to save high cards
    const lowestCard = playableCards.reduce((min, card) => {
      // Never waste red 0 if we have it
      if (card.value === 0 && card.color === 'red') return min;
      // Avoid brown 0 if possible
      if (card.value === 0 && card.color === 'brown') return min.value === 0 && min.color === 'brown' ? min : card;
      return card.value < min.value ? card : min;
    });

    return {
      card: lowestCard,
      priority: 'low',
      reason: 'Teammate winning - save high cards',
      explanation: `Your teammate is winning with ${currentWinner.card.value} ${currentWinner.card.color}. Play your lowest card (${lowestCard.value} ${lowestCard.color}) to save powerful cards for later tricks.`,
      alternatives: redZero ? `Red 0 would add bonus points but might risk the trick if beaten.` : undefined,
    };
  }

  // CASE 3: Teammate is LOSING or not in trick - TRY TO WIN
  const ledSuit = currentTrick[0].card.color;
  const winningCard = currentWinner ? currentWinner.card : currentTrick[0].card;

  // Find cards that can win CURRENTLY
  const potentialWinningCards = playableCards.filter(c => canBeatCard(c, winningCard, ledSuit, trump));

  if (potentialWinningCards.length > 0) {
    // Find cards that are GUARANTEED to win (accounting for unplayed cards)
    const guaranteedWinningCards = potentialWinningCards.filter(c => isGuaranteedWin(c, currentTrick, trump));

    // Prefer guaranteed wins
    const cardsToConsider = guaranteedWinningCards.length > 0 ? guaranteedWinningCards : potentialWinningCards;

    // Check if trick has red 0 (high value)
    const trickHasRedZero = currentTrick.some(t => t.card.value === 0 && t.card.color === 'red');
    const redZeroInHand = cardsToConsider.find(c => c.value === 0 && c.color === 'red');

    // If trick has red 0, try to win it with GUARANTEED win!
    if (trickHasRedZero) {
      const bestCard = guaranteedWinningCards.length > 0
        ? guaranteedWinningCards.reduce((min, card) => card.value < min.value ? card : min)
        : potentialWinningCards.reduce((max, card) => card.value > max.value ? card : max); // Play highest if no guaranteed win

      return {
        card: bestCard,
        priority: 'high',
        reason: '🔴 WIN RED 0 TRICK (+5 points)!',
        explanation: `Opponent has Red 0 in this trick! Play ${bestCard.value} ${bestCard.color} to ${guaranteedWinningCards.length > 0 ? 'GUARANTEE the win' : 'try to win it'} and get the +5 bonus points for your team.`,
      };
    }

    // Play red 0 if we have it and can win
    if (redZeroInHand && guaranteedWinningCards.includes(redZeroInHand)) {
      return {
        card: redZeroInHand,
        priority: 'high',
        reason: 'WIN with Red 0 (+5 points)',
        explanation: `Play Red 0 to win this trick AND get the +5 bonus points! This is a high-value trick worth fighting for.`,
      };
    }

    // Otherwise play lowest GUARANTEED winning card (or highest if no guarantee)
    const bestCard = guaranteedWinningCards.length > 0
      ? guaranteedWinningCards.reduce((min, card) => card.value < min.value ? card : min)
      : potentialWinningCards.reduce((max, card) => card.value > max.value ? card : max);

    const isGuaranteed = guaranteedWinningCards.includes(bestCard);

    return {
      card: bestCard,
      priority: 'high',
      reason: isGuaranteed ? 'GUARANTEE the win' : 'Try to win',
      explanation: `${teammateInTrick ? 'Your teammate couldn\'t win' : 'You can win this trick'}. Play ${bestCard.value} ${bestCard.color} to ${isGuaranteed ? 'GUARANTEE the win (higher cards already played)' : 'try to take it (but watch out for higher cards)'}!`,
    };
  }

  // CASE 4: Can't win - throw away lowest (avoid brown 0 if possible)
  const brownZero = playableCards.find(c => c.value === 0 && c.color === 'brown');
  const nonBrownCards = playableCards.filter(c => !(c.value === 0 && c.color === 'brown'));

  if (nonBrownCards.length > 0) {
    const lowestNonBrown = nonBrownCards.reduce((min, card) => card.value < min.value ? card : min);

    return {
      card: lowestNonBrown,
      priority: 'low',
      reason: 'Can\'t win - throw lowest',
      explanation: `You can't win this trick. Play ${lowestNonBrown.value} ${lowestNonBrown.color} (your lowest non-brown-0) to save better cards.`,
      alternatives: brownZero ? `Avoid Brown 0 to not give -2 points to opponents if they win.` : undefined,
    };
  }

  // Last resort: must play brown 0
  if (brownZero) {
    return {
      card: brownZero,
      priority: 'low',
      reason: 'Only option left',
      explanation: `You can't win and only have Brown 0 left. This will give -2 points to whoever wins the trick, but you have no choice.`,
    };
  }

  // Fallback: play lowest card
  const lowestCard = playableCards.reduce((min, card) => card.value < min.value ? card : min);
  return {
    card: lowestCard,
    priority: 'low',
    reason: 'Throw away low card',
    explanation: `Play ${lowestCard.value} ${lowestCard.color} to minimize the value you're giving up.`,
  };
}
