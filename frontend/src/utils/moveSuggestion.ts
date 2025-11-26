/**
 * Move Suggestion System for Beginner Mode
 * Analyzes the game state and suggests the best move with explanations
 */

import { Card, GameState, CardColor } from '../types/game';

interface MoveSuggestion {
  card: Card;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  explanation: string;
  alternatives?: string; // Explanation of other options and why this is better
}

interface BetSuggestion {
  amount: number;
  withoutTrump: boolean;
  reason: string;
  skip: boolean;
  alternatives?: string; // Explanation of other betting options
}

/**
 * Evaluate hand strength for betting
 */
function evaluateHandStrength(hand: Card[], trump: CardColor | null): {
  trumpCount: number;
  highCards: number;
  estimatedTricks: number;
  hasRedZero: boolean;
  hasBrownZero: boolean;
} {
  let trumpCount = 0;
  let highCards = 0;
  let estimatedTricks = 0;
  let hasRedZero = false;
  let hasBrownZero = false;

  hand.forEach((card) => {
    if (trump && card.color === trump) {
      trumpCount++;
      if (card.value >= 5) estimatedTricks += 1;
      if (card.value >= 7) estimatedTricks += 0.5;
    }
    if (card.value >= 6) highCards++;
    if (card.value === 0 && card.color === 'red') hasRedZero = true;
    if (card.value === 0 && card.color === 'brown') hasBrownZero = true;
  });

  return {
    trumpCount,
    highCards,
    estimatedTricks,
    hasRedZero,
    hasBrownZero,
  };
}

/**
 * Suggest a bet for the current player
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

  // Weak hand - suggest skip
  if (strength.estimatedTricks < 5 && !isDealer) {
    return {
      amount: 7,
      withoutTrump: false,
      skip: true,
      reason: `Your hand is weak (estimated ${strength.estimatedTricks} tricks). Skipping is safer unless you're feeling lucky!`,
      alternatives: `Alternative: Bet 7 (minimum) if you're feeling confident, but with only ${strength.trumpCount} trump cards and ${strength.highCards} high cards, you'll likely lose points if you don't meet the bet.`,
    };
  }

  // Strong hand - suggest aggressive bet
  if (strength.estimatedTricks >= 8) {
    const suggestedAmount = Math.min(12, Math.max(10, Math.floor(strength.estimatedTricks) + 2));
    const shouldRaise = highestBet ? suggestedAmount > highestBet.amount : true;

    return {
      amount: shouldRaise ? suggestedAmount : (highestBet?.amount || 10) + 1,
      withoutTrump: false,
      skip: false,
      reason: `Strong hand! You have ${strength.trumpCount} trump cards and ${strength.highCards} high cards. Bid aggressively!`,
      alternatives: highestBet
        ? `Alternative: Match the current bet (${highestBet.amount}) to play it safer, but you're likely leaving points on the table with this strong hand.`
        : `Alternative: Bet lower (8-9) if you want to play conservatively, but your hand can likely win more tricks than that.`,
    };
  }

  // Medium hand - suggest moderate bet
  const suggestedAmount = Math.max(7, Math.min(9, Math.floor(strength.estimatedTricks) + 1));
  return {
    amount: suggestedAmount,
    withoutTrump: false,
    skip: false,
    reason: `Moderate hand with ${strength.trumpCount} trump cards. Bet ${suggestedAmount} for a balanced approach.`,
    alternatives: `Alternative: ${isDealer ? 'As dealer, you must bet or raise.' : 'You could skip to avoid risk, but your hand has potential.'}`,
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

  // Find cards that can win
  const winningCards = playableCards.filter(c => canBeatCard(c, winningCard, ledSuit, trump));

  if (winningCards.length > 0) {
    // Check if trick has red 0 (high value)
    const trickHasRedZero = currentTrick.some(t => t.card.value === 0 && t.card.color === 'red');
    const redZeroInHand = winningCards.find(c => c.value === 0 && c.color === 'red');

    // If trick has red 0, try to win it!
    if (trickHasRedZero) {
      const lowestWinningCard = winningCards.reduce((min, card) => card.value < min.value ? card : min);

      return {
        card: lowestWinningCard,
        priority: 'high',
        reason: '🔴 WIN RED 0 TRICK (+5 points)!',
        explanation: `Opponent has Red 0 in this trick! Play ${lowestWinningCard.value} ${lowestWinningCard.color} to win it and get the +5 bonus points for your team. Always prevent opponents from getting red 0!`,
      };
    }

    // Play red 0 if we have it and can win
    if (redZeroInHand) {
      return {
        card: redZeroInHand,
        priority: 'high',
        reason: 'WIN with Red 0 (+5 points)',
        explanation: `Play Red 0 to win this trick AND get the +5 bonus points! This is a high-value trick worth fighting for.`,
      };
    }

    // Otherwise play lowest winning card
    const lowestWinningCard = winningCards.reduce((min, card) => card.value < min.value ? card : min);

    return {
      card: lowestWinningCard,
      priority: 'high',
      reason: 'Win the trick',
      explanation: `${teammateInTrick ? 'Your teammate couldn\'t win' : 'You can win this trick'}. Play ${lowestWinningCard.value} ${lowestWinningCard.color} to take it!`,
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
