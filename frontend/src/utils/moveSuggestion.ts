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
 *
 * SCORING SYSTEM:
 * - Each trump card adds base value (higher cards = more certain wins)
 * - High non-trump cards add partial value (can win if not cut)
 * - Long trump suits get bonus (trump control)
 * - Red 0 in hand = +1 point potential
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
  let nonTrumpHighCards = 0;

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
      // Trump card trick estimation:
      // 7 trump = almost guaranteed win (0.95)
      // 6 trump = likely win (0.85)
      // 5 trump = good chance (0.7)
      // 4 trump = decent chance (0.5)
      // 3 trump = some chance (0.35)
      // Lower = can beat non-trump but risky
      if (card.value === 7) {
        estimatedTricks += 0.95;
        hasSevenInColor = true;
      } else if (card.value === 6) {
        estimatedTricks += 0.85;
      } else if (card.value === 5) {
        estimatedTricks += 0.7;
      } else if (card.value === 4) {
        estimatedTricks += 0.5;
      } else if (card.value === 3) {
        estimatedTricks += 0.35;
      } else if (card.value >= 1) {
        estimatedTricks += 0.25; // Low trump still beats non-trump
      }
    } else {
      // Non-trump high cards (6 or 7) can win if not cut
      // Value depends on how many trump we have (more trump = opponents have less to cut)
      if (card.value === 7) {
        nonTrumpHighCards++;
        hasSevenInColor = true;
      } else if (card.value === 6) {
        nonTrumpHighCards++;
      }
    }

    // Count all high cards (6 or 7)
    if (card.value >= 6) {
      highCards++;
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

  // Non-trump high card value depends on trump count
  // More trump = less likely opponents can cut your high cards
  hand.forEach(card => {
    if (card.color !== optimalTrump) {
      if (card.value === 7) {
        // 7 non-trump: high chance to win if we have trump control
        if (trumpCount >= 5) {
          estimatedTricks += 0.85; // Very likely to win after trump bleed
        } else if (trumpCount >= 4) {
          estimatedTricks += 0.6;
        } else if (trumpCount >= 3) {
          estimatedTricks += 0.45;
        } else {
          estimatedTricks += 0.3; // Can still win sometimes
        }
      } else if (card.value === 6) {
        // 6 non-trump: moderate chance
        if (trumpCount >= 5) {
          estimatedTricks += 0.7;
        } else if (trumpCount >= 4) {
          estimatedTricks += 0.45;
        } else if (trumpCount >= 3) {
          estimatedTricks += 0.3;
        } else {
          estimatedTricks += 0.2;
        }
      } else if (card.value === 5) {
        // 5 non-trump: small chance
        if (trumpCount >= 5) {
          estimatedTricks += 0.4;
        } else if (trumpCount >= 4) {
          estimatedTricks += 0.25;
        } else {
          estimatedTricks += 0.15;
        }
      }
    }
  });

  // Long trump suit bonus (5+ trump = trump bleed strategy)
  // With 5+ trump, you can bleed out opponents' trump
  if (trumpCount >= 5) {
    // Base bonus for trump control
    estimatedTricks += 0.5;

    // Additional bonus for overwhelming trump
    if (trumpCount >= 6) estimatedTricks += 0.5;
    if (trumpCount >= 7) estimatedTricks += 0.75;
  }

  // Red 0 bonus - ALWAYS worth considering (+5 points = 6 total for that trick)
  // The question is: can we WIN the trick with it, or at least give it to teammate?
  if (hasRedZero) {
    // Red 0 is always in hand at start - the value depends on our ability to control when to play it
    // With trump control, we can ensure we or teammate wins when we play it
    if (trumpCount >= 4) {
      estimatedTricks += 1.0; // High confidence we can win or support red 0 trick
    } else if (trumpCount >= 3) {
      estimatedTricks += 0.75;
    } else if (trumpCount >= 2) {
      estimatedTricks += 0.5;
    } else {
      estimatedTricks += 0.25; // Still valuable but harder to control
    }
  }

  // Brown 0 penalty consideration (-2 points per trick that contains it)
  // If we're likely to WIN tricks (high trump control), we might accidentally win Brown 0 tricks
  // This is a risk factor that reduces our effective estimated points
  if (hasBrownZero) {
    // With many trump, we're more likely to win unwanted Brown 0 tricks
    // The penalty is that each Brown 0 trick we win is worth -2 instead of +1 (net -3 compared to normal)
    // But if we're cautious, we can try to dump Brown 0 when opponent is winning
    if (trumpCount >= 5) {
      estimatedTricks -= 0.4; // High trump = hard to avoid winning Brown 0
    } else if (trumpCount >= 4) {
      estimatedTricks -= 0.25;
    } else {
      // With fewer trump, easier to lose on purpose / dump Brown 0
      estimatedTricks -= 0.1;
    }
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
 *
 * IMPORTANT: Each player has Red 0 (+5 bonus) worth ~6 points total
 * Normal tricks = 1 point each, so 8 tricks + Red 0 = ~13 points possible
 *
 * Thresholds (estimated tricks/points):
 * - < 4: Weak - Skip recommended
 * - 4-5: Marginal - Bet 7 or skip
 * - 5-6: Decent - Bet 7-8
 * - 6-7: Good - Bet 8-9
 * - 7-8: Strong - Bet 9-10
 * - 8+: Excellent - Bet 10-12
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
  const isWithoutTrumpViable = dominantColorCount >= 5 && strength.hasSevenInColor;

  // Round estimated tricks for display
  const estTricks = Math.round(strength.estimatedTricks * 10) / 10;

  // Build hand summary
  const specialCards = [];
  if (strength.hasRedZero) specialCards.push('Red 0 +5');
  if (strength.hasBrownZero) specialCards.push('Brown 0 -2');
  const specialCardsStr = specialCards.length > 0 ? `, ${specialCards.join(', ')}` : '';
  const handSummary = `~${estTricks} pts est. (${strength.trumpCount} ${strength.optimalTrump} trump, ${strength.highCards} high cards${specialCardsStr})`;

  // CASE 1: Weak hand (< 4 estimated) - Suggest SKIP
  if (strength.estimatedTricks < 4 && !isDealer) {
    return {
      amount: 7,
      withoutTrump: false,
      skip: true,
      reason: `⚠️ Weak hand - Skip recommended | ${handSummary}`,
      alternatives: `Alternative: Bet 7 if you're feeling lucky, but risky with this hand.`,
    };
  }

  // CASE 2: Excellent hand (8+ tricks) - Suggest 10-12
  if (strength.estimatedTricks >= 8 || (strength.trumpCount >= 6 && strength.highCards >= 4)) {
    const suggestedAmount = Math.min(12, Math.floor(strength.estimatedTricks + 2));

    if (isWithoutTrumpViable && dominantColorCount >= 6) {
      return {
        amount: suggestedAmount,
        withoutTrump: true,
        skip: false,
        reason: `🔥 EXCELLENT with "No Trump" (2x points!) | ${handSummary}`,
        alternatives: `Alternative: Bet ${suggestedAmount} with trump for safer play.`,
      };
    }

    return {
      amount: suggestedAmount,
      withoutTrump: false,
      skip: false,
      reason: `🔥 EXCELLENT hand! Bet high | ${handSummary}`,
      alternatives: highestBet
        ? `Alternative: Match ${highestBet.amount} to play safer.`
        : `Alternative: Bet 9 for less pressure.`,
    };
  }

  // CASE 3: Strong hand (7-8 tricks) - Suggest 9-10
  if (strength.estimatedTricks >= 7 || (strength.trumpCount >= 4 && strength.highCards >= 3)) {
    const suggestedAmount = strength.estimatedTricks >= 7.5 ? 10 : 9;

    if (isWithoutTrumpViable) {
      return {
        amount: suggestedAmount,
        withoutTrump: true,
        skip: false,
        reason: `⚡ STRONG with "No Trump" option | ${handSummary}`,
        alternatives: `Alternative: Bet ${suggestedAmount} with ${strength.optimalTrump} trump.`,
      };
    }

    return {
      amount: suggestedAmount,
      withoutTrump: false,
      skip: false,
      reason: `⚡ STRONG hand | ${handSummary}`,
      alternatives: `Alternative: Bet 8 for less pressure.`,
    };
  }

  // CASE 4: Good hand (6-7 tricks) - Suggest 8-9
  if (strength.estimatedTricks >= 6) {
    const suggestedAmount = strength.estimatedTricks >= 6.5 ? 9 : 8;

    return {
      amount: suggestedAmount,
      withoutTrump: false,
      skip: false,
      reason: `✅ GOOD hand | ${handSummary}`,
      alternatives: isDealer
        ? `As dealer, this is a solid betting hand.`
        : `Alternative: Bet 7 for minimum risk.`,
    };
  }

  // CASE 5: Decent hand (5-6 tricks) - Suggest 7-8
  if (strength.estimatedTricks >= 5) {
    return {
      amount: 8,
      withoutTrump: false,
      skip: false,
      reason: `📊 DECENT hand | ${handSummary}`,
      alternatives: isDealer
        ? `As dealer, bet 8 for balanced risk.`
        : `Alternative: Skip or bet 7 for safety.`,
    };
  }

  // CASE 6: Marginal hand (4-5 tricks) - Suggest 7 or skip
  if (strength.estimatedTricks >= 4) {
    return {
      amount: 7,
      withoutTrump: false,
      skip: !isDealer,
      reason: isDealer
        ? `📋 MARGINAL - Bet 7 (must bet as dealer) | ${handSummary}`
        : `📋 MARGINAL - Skip or bet 7 | ${handSummary}`,
      alternatives: isDealer
        ? `As dealer, 7 is your safest option.`
        : `Alternative: Bet 7 if others skipped and you want to try.`,
    };
  }

  // CASE 7: Weak hand (< 4 tricks) - Dealer must bet
  return {
    amount: 7,
    withoutTrump: false,
    skip: !isDealer,
    reason: isDealer
      ? `⚠️ WEAK but must bet as dealer | ${handSummary}`
      : `⚠️ WEAK - Skip recommended | ${handSummary}`,
    alternatives: isDealer
      ? `As dealer, you must bet. 7 minimizes risk.`
      : `Alternative: Bet 7 only if feeling very lucky.`,
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

  // CASE 4: Can't win - DEFENSIVE PLAY based on who's winning
  const brownZero = playableCards.find(c => c.value === 0 && c.color === 'brown');
  const opponentWinning = currentWinner && currentWinner.playerName !== teammate?.name && currentWinner.playerName !== playerName;

  // If OPPONENT is winning and we have brown 0, POISON their trick!
  if (opponentWinning && brownZero) {
    return {
      card: brownZero,
      priority: 'high',
      reason: '💀 POISON opponent\'s trick!',
      explanation: `Opponent is winning. Play Brown 0 to give them -2 points! This turns their winning trick into a penalty. Defensive play at its best!`,
    };
  }

  // If TEAMMATE is winning, avoid brown 0
  const nonBrownCards = playableCards.filter(c => !(c.value === 0 && c.color === 'brown'));

  if (nonBrownCards.length > 0) {
    const lowestNonBrown = nonBrownCards.reduce((min, card) => card.value < min.value ? card : min);

    return {
      card: lowestNonBrown,
      priority: 'low',
      reason: teammateWinning ? 'Teammate winning - save cards' : 'Can\'t win - throw lowest',
      explanation: `You can't win this trick. Play ${lowestNonBrown.value} ${lowestNonBrown.color} (your lowest non-brown-0) to ${teammateWinning ? 'help your teammate' : 'save better cards'}.`,
      alternatives: brownZero && !teammateWinning ? `Brown 0 would poison the trick if opponent wins, but save it if uncertain.` : undefined,
    };
  }

  // Last resort: must play brown 0
  if (brownZero) {
    return {
      card: brownZero,
      priority: 'low',
      reason: opponentWinning ? '💀 POISON opponent\'s trick!' : 'Only option left',
      explanation: opponentWinning
        ? `Opponent is winning. Brown 0 will give them -2 points! Turn their win into a penalty.`
        : `You can't win and only have Brown 0 left. This will give -2 points to whoever wins the trick, but you have no choice.`,
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
