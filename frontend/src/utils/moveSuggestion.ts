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

  // Estimate tricks: high cards, trump cards, special cards
  estimatedTricks += highCards * 0.3;
  estimatedTricks += trumpCount * 0.5;

  return {
    trumpCount,
    highCards,
    estimatedTricks: Math.round(estimatedTricks),
    hasRedZero,
    hasBrownZero,
  };
}

/**
 * Suggest a bet for the current player
 */
export function suggestBet(gameState: GameState, playerId: string): BetSuggestion {
  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) {
    return {
      amount: 7,
      withoutTrump: false,
      skip: true,
      reason: 'Player not found',
    };
  }

  const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
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
    const amount = Math.min(12, strength.estimatedTricks + 2);
    const conservativeAmount = Math.max(7, strength.estimatedTricks);
    return {
      amount,
      withoutTrump: false,
      skip: false,
      reason: `You have a strong hand with ${strength.trumpCount} trump cards and ${strength.highCards} high cards. Bet ${amount} points to maximize your score!`,
      alternatives: `Alternative: Bet ${conservativeAmount} (more conservative) to play it safer, but you're leaving points on the table. With your strong hand, betting high is worth the risk.`,
    };
  }

  // Medium hand - conservative bet
  const baseBet = Math.max(7, Math.min(10, strength.estimatedTricks));
  const amount = highestBet ? Math.max(baseBet, highestBet.amount + 1) : baseBet;
  const aggressiveAmount = Math.min(12, amount + 2);

  return {
    amount,
    withoutTrump: false,
    skip: false,
    reason: `Your hand is decent. Bet ${amount} points - not too risky, not too safe. You have ${strength.trumpCount} trump cards.`,
    alternatives: `Alternatives: Skip to avoid risk (but miss potential points), or bet ${aggressiveAmount} (aggressive) to win big if you get lucky tricks. The middle ground (${amount}) balances risk and reward.`,
  };
}

/**
 * Determine which cards can legally be played
 */
function getPlayableCards(hand: Card[], currentTrick: { card: Card; playerId: string }[]): Card[] {
  if (currentTrick.length === 0) {
    // Leading the trick - all cards are playable
    return hand;
  }

  const ledSuit = currentTrick[0].card.color;
  const hasSuit = hand.some((card) => card.color === ledSuit);

  if (hasSuit) {
    // Must follow suit
    return hand.filter((card) => card.color === ledSuit);
  }

  // Can't follow suit - all cards playable
  return hand;
}

/**
 * Determine if teammate is currently winning the trick
 */
function isTeammateWinning(gameState: GameState, playerId: string, trump: CardColor | null): boolean {
  if (gameState.currentTrick.length === 0) return false;

  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  const playerTeam = player.teamId;

  // Find current winning player
  const currentWinningPlay = gameState.currentTrick.reduce((winning, play) => {
    const winningCard = winning.card;
    const playCard = play.card;

    if (playCard.color === trump && winningCard.color !== trump) return play;
    if (winningCard.color === trump && playCard.color !== trump) return winning;

    if (playCard.color === winningCard.color) {
      return playCard.value > winningCard.value ? play : winning;
    }

    return winning;
  });

  const winningPlayer = gameState.players.find(p => p.id === currentWinningPlay.playerId);
  return winningPlayer?.teamId === playerTeam;
}

/**
 * Suggest the best card to play
 */
export function suggestMove(gameState: GameState, playerId: string): MoveSuggestion | null {
  const player = gameState.players.find((p) => p.id === playerId);
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
  const teammateWinning = isTeammateWinning(gameState, playerId, trump);

  // CASE 1: Leading the trick (first to play)
  if (currentTrick.length === 0) {
    const trumpCards = playableCards.filter((c) => c.color === trump);
    const nonTrumpCards = playableCards.filter((c) => c.color !== trump);
    const redZero = playableCards.find((c) => c.value === 0 && c.color === 'red');

    // Play high trump if you have it
    if (trumpCards.length > 0) {
      const highestTrump = trumpCards.reduce((max, card) =>
        card.value > max.value ? card : max
      );
      const lowestNonTrump = nonTrumpCards.length > 0
        ? nonTrumpCards.reduce((min, card) => card.value < min.value ? card : min)
        : null;

      return {
        card: highestTrump,
        priority: 'high',
        reason: 'Lead with a high trump',
        explanation: `Leading with a high trump card (${highestTrump.value}) puts pressure on other players and gives you a strong chance to win the trick!`,
        alternatives: lowestNonTrump
          ? `Alternative: Lead with low non-trump (${lowestNonTrump.value} ${lowestNonTrump.color}) to save trump for later, but you risk losing the trick. Leading trump is more aggressive and guarantees you control.`
          : `No other options - you only have trump cards.`,
      };
    }

    // Play red 0 to win bonus points
    if (redZero && nonTrumpCards.length > 1) {
      const otherNonTrump = nonTrumpCards.filter(c => !(c.value === 0 && c.color === 'red'));
      const lowestOther = otherNonTrump.reduce((min, card) => card.value < min.value ? card : min, otherNonTrump[0]);

      return {
        card: redZero,
        priority: 'medium',
        reason: 'Try to win the Red 0 (+5 points)',
        explanation: `Leading with Red 0 allows you to control the trick and potentially win the +5 bonus points!`,
        alternatives: lowestOther
          ? `Alternative: Lead with ${lowestOther.value} ${lowestOther.color} to save Red 0 for a trick you're sure to win, but you might miss the bonus if you don't draw it out now.`
          : 'Red 0 is your best option for potential bonus points.',
      };
    }

    // Play lowest non-trump card
    if (nonTrumpCards.length > 0) {
      const lowestCard = nonTrumpCards.reduce((min, card) =>
        card.value < min.value ? card : min
      );
      const highestNonTrump = nonTrumpCards.reduce((max, card) => card.value > max.value ? card : max);

      return {
        card: lowestCard,
        priority: 'low',
        reason: 'Save high cards for later',
        explanation: `Leading with a low card (${lowestCard.value} ${lowestCard.color}) saves your powerful cards for more important tricks.`,
        alternatives: highestNonTrump.value > lowestCard.value
          ? `Alternative: Lead high (${highestNonTrump.value} ${highestNonTrump.color}) to try winning the trick, but you're using your best card early. Low card strategy plays it safe.`
          : 'This is your only non-trump option.',
      };
    }
  }

  // CASE 2: Following suit
  const ledSuit = currentTrick[0].card.color;
  const followSuitCards = playableCards.filter((c) => c.color === ledSuit);

  if (followSuitCards.length > 0) {
    // Check if we can win the trick
    const currentWinningCard = currentTrick.reduce((winning, play) => {
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

    const canWin = followSuitCards.some((card) => {
      if (trump && currentWinningCard.card.color === trump && card.color !== trump) {
        return false; // Can't beat trump with non-trump
      }
      return card.value > currentWinningCard.card.value;
    });

    if (canWin) {
      // Check if teammate is winning
      if (teammateWinning) {
        // Teammate winning - play lowest to support
        const lowestCard = followSuitCards.reduce((min, card) =>
          card.value < min.value ? card : min
        );
        return {
          card: lowestCard,
          priority: 'low',
          reason: 'Teammate winning - play low',
          explanation: `Your teammate is winning! Play your lowest card (${lowestCard.value} ${lowestCard.color}) to let them take the trick.`,
          alternatives: `You could overtake with a higher card, but that wastes your team's high cards unnecessarily.`,
        };
      }

      // Win the trick with lowest winning card
      const winningCards = followSuitCards.filter(
        (card) => card.value > currentWinningCard.card.value
      );
      const lowestWinner = winningCards.reduce((min, card) =>
        card.value < min.value ? card : min
      );

      return {
        card: lowestWinner,
        priority: 'high',
        reason: 'Win this trick!',
        explanation: `Your ${lowestWinner.value} ${lowestWinner.color} can win the trick. Playing the lowest winning card saves your higher cards for later.`,
      };
    } else {
      // Can't win - play lowest card
      const lowestCard = followSuitCards.reduce((min, card) =>
        card.value < min.value ? card : min
      );

      return {
        card: lowestCard,
        priority: 'low',
        reason: "Can't win - play lowest",
        explanation: `You can't win this trick, so play your lowest card (${lowestCard.value} ${lowestCard.color}) to save better cards.`,
      };
    }
  }

  // CASE 3: Can't follow suit - use trump or dump
  const trumpCards = playableCards.filter((c) => c.color === trump);

  if (trumpCards.length > 0) {
    // Check if worth winning with trump
    const hasRedZero = currentTrick.some((p) => p.card.value === 0 && p.card.color === 'red');
    const hasBrownZero = currentTrick.some((p) => p.card.value === 0 && p.card.color === 'brown');

    if (hasRedZero) {
      // Win the red zero!
      const lowestTrump = trumpCards.reduce((min, card) =>
        card.value < min.value ? card : min
      );
      return {
        card: lowestTrump,
        priority: 'high',
        reason: 'Win the Red 0 (+5 points)!',
        explanation: `Use your lowest trump (${lowestTrump.value}) to win the trick with Red 0 for a +5 point bonus!`,
      };
    }

    if (!hasBrownZero && currentTrick.length >= 2) {
      // Worth trumping a normal trick
      const lowestTrump = trumpCards.reduce((min, card) =>
        card.value < min.value ? card : min
      );
      return {
        card: lowestTrump,
        priority: 'medium',
        reason: 'Use trump to win',
        explanation: `Play your lowest trump (${lowestTrump.value}) to win this trick.`,
      };
    }
  }

  // CASE 4: Dump worst card (but NOT if teammate is winning!)
  const brownZero = playableCards.find((c) => c.value === 0 && c.color === 'brown');
  if (brownZero && !teammateWinning) {
    // Only dump Brown 0 if opponent is winning
    return {
      card: brownZero,
      priority: 'high',
      reason: 'Dump the Brown 0 (-2 points)',
      explanation: `Get rid of the Brown 0 now! It's worth -2 points, so let the opponent take that penalty.`,
      alternatives: `Don't dump if your teammate is winning - you'd give them the penalty!`,
    };
  }

  // If teammate is winning and we have Brown 0, play something else
  if (teammateWinning && brownZero) {
    const otherCards = playableCards.filter(c => !(c.value === 0 && c.color === 'brown'));
    if (otherCards.length > 0) {
      const lowestOther = otherCards.reduce((min, card) => card.value < min.value ? card : min);
      return {
        card: lowestOther,
        priority: 'medium',
        reason: 'Teammate winning - avoid Brown 0',
        explanation: `Your teammate is winning! Play ${lowestOther.value} ${lowestOther.color} instead of Brown 0 to avoid giving them the -2 penalty.`,
      };
    }
  }

  // Play lowest card
  const lowestCard = playableCards.reduce((min, card) =>
    card.value < min.value ? card : min
  );

  return {
    card: lowestCard,
    priority: 'low',
    reason: 'Dump lowest card',
    explanation: `You can't follow suit, so dump your lowest card (${lowestCard.value} ${lowestCard.color}).`,
  };
}
