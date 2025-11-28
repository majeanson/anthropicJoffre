/**
 * Quest System - Game Logic
 *
 * Sprint 19: Daily Engagement System
 *
 * Handles quest progress tracking, completion detection, and reward calculation.
 * Integrates with game events to automatically track player progress.
 */

import { GameState, Player } from '../types/game';

export interface QuestTemplate {
  id: number;
  quest_key: string;
  name: string;
  description: string;
  quest_type: 'easy' | 'medium' | 'hard';
  objective_type: 'wins' | 'games_played' | 'tricks_won' | 'bets_made' | 'special_cards' | 'bet_amount' | 'comeback';
  target_value: number;
  reward_xp: number;
  reward_currency: number;
  icon: string;
  is_active: boolean;
}

export interface PlayerQuest {
  id: number;
  player_name: string;
  quest_template_id: number;
  progress: number;
  completed: boolean;
  date_assigned: string;
  completed_at?: string;
  reward_claimed: boolean;
  claimed_at?: string;
  template?: QuestTemplate; // Populated via JOIN
}

export interface QuestProgress {
  questId: number;
  progressDelta: number;
  newProgress: number;
  completed: boolean;
  questName: string;
}

/**
 * Quest tracking context - what happened in this game?
 */
export interface GameQuestContext {
  playerName: string;
  gameId: string;
  won: boolean;
  tricksWon: number;
  betsMade: number;
  betAmount?: number;
  wonRedZero: boolean;
  usedBrownZeroDefensively: boolean;
  wasComeback: boolean; // Was behind by 10+ points and won
  finalScore: number;
  opponentScore: number;
}

/**
 * Determine if a game qualifies as a "comeback win"
 * A comeback is when a team was behind by 10+ points and still won
 */
export function isGameComeback(gameState: GameState, winningTeam: 1 | 2): boolean {
  const { team1Score, team2Score } = gameState;

  if (winningTeam === 1) {
    // Team 1 won - check if they were ever behind by 10+
    // We'd need round history for this, simplified: check final deficit
    return team1Score > team2Score && team2Score >= (team1Score - 10);
  } else {
    // Team 2 won
    return team2Score > team1Score && team1Score >= (team2Score - 10);
  }
}

/**
 * Extract quest-relevant context from a finished game
 */
export function extractQuestContext(
  gameState: GameState,
  playerName: string,
  gameId: string
): GameQuestContext {
  const player = gameState.players.find(p => p.name === playerName);

  if (!player) {
    throw new Error(`Player ${playerName} not found in game state`);
  }

  const playerTeam = player.teamId;
  const won = gameState.winningTeam === playerTeam;
  const opponentTeam = playerTeam === 1 ? 2 : 1;

  const finalScore = playerTeam === 1 ? gameState.team1Score : gameState.team2Score;
  const opponentScore = opponentTeam === 1 ? gameState.team1Score : gameState.team2Score;

  // Check for special card events from round history
  let wonRedZero = false;
  let usedBrownZeroDefensively = false;

  // Check round history for special cards
  if (gameState.roundHistory && Array.isArray(gameState.roundHistory)) {
    for (const round of gameState.roundHistory) {
      if (round.tricks && Array.isArray(round.tricks)) {
        for (const trick of round.tricks) {
          // Check if player won a trick with Red 0
          if (trick.winnerId === player.id && trick.cards) {
            const playerCard = trick.cards.find((c: any) =>
              c.playerId === player.id && c.card?.color === 'red' && c.card?.value === 0
            );
            if (playerCard) {
              wonRedZero = true;
            }
          }

          // Check if player played Brown 0 defensively (didn't win trick with it)
          if (trick.winnerId !== player.id && trick.cards) {
            const playerCard = trick.cards.find((c: any) =>
              c.playerId === player.id && c.card?.color === 'brown' && c.card?.value === 0
            );
            if (playerCard) {
              usedBrownZeroDefensively = true;
            }
          }
        }
      }
    }
  }

  const wasComeback = won && isGameComeback(gameState, playerTeam);

  return {
    playerName,
    gameId,
    won,
    tricksWon: player.tricksWon || 0,
    betsMade: gameState.roundHistory ? gameState.roundHistory.length : 0, // Each round = 1 bet
    betAmount: gameState.highestBet?.amount,
    wonRedZero,
    usedBrownZeroDefensively,
    wasComeback,
    finalScore,
    opponentScore,
  };
}

/**
 * Calculate quest progress for a given game context
 * Returns how much progress should be added to each quest type
 */
export function calculateQuestProgress(
  quest: PlayerQuest & { template?: QuestTemplate },
  context: GameQuestContext
): number {
  const template = quest.template;

  if (!template) {
    return 0;
  }

  // Already completed, no more progress
  if (quest.completed) {
    return 0;
  }

  let progressDelta = 0;

  switch (template.objective_type) {
    case 'wins':
      if (context.won) {
        progressDelta = 1;
      }
      break;

    case 'games_played':
      progressDelta = 1; // Always increments
      break;

    case 'tricks_won':
      progressDelta = context.tricksWon;
      break;

    case 'bets_made':
      progressDelta = context.betsMade;
      break;

    case 'special_cards':
      // Check quest key to determine which special card
      if (template.quest_key === 'win_red_zero' && context.wonRedZero) {
        progressDelta = 1;
      } else if (template.quest_key === 'win_brown_zero' && context.usedBrownZeroDefensively) {
        progressDelta = 1;
      }
      break;

    case 'bet_amount':
      // Quest requires betting X+ amount and winning
      if (context.won && context.betAmount && context.betAmount >= template.target_value) {
        progressDelta = 1;
      }
      break;

    case 'comeback':
      if (context.wasComeback) {
        progressDelta = 1;
      }
      break;

    default:
      progressDelta = 0;
  }

  return progressDelta;
}

/**
 * Check if a quest is now completed after adding progress
 */
export function isQuestCompleted(
  currentProgress: number,
  progressDelta: number,
  targetValue: number
): boolean {
  return (currentProgress + progressDelta) >= targetValue;
}

/**
 * Calculate XP required for a given level
 * Exponential curve: Level 1 = 100 XP, Level 2 = 150 XP, Level 3 = 225 XP, etc.
 * Formula: baseXP * (1.5 ^ (level - 1))
 */
export function calculateXPForLevel(level: number): number {
  const baseXP = 100;
  return Math.floor(baseXP * Math.pow(1.5, level - 1));
}

/**
 * Calculate total XP required to reach a level
 */
export function calculateTotalXPForLevel(targetLevel: number): number {
  let totalXP = 0;
  for (let level = 1; level < targetLevel; level++) {
    totalXP += calculateXPForLevel(level);
  }
  return totalXP;
}

/**
 * Calculate current level from total XP
 */
export function calculateLevelFromXP(totalXP: number): { level: number; currentLevelXP: number; nextLevelXP: number } {
  let level = 1;
  let xpSoFar = 0;

  while (true) {
    const xpForNextLevel = calculateXPForLevel(level);

    if (xpSoFar + xpForNextLevel > totalXP) {
      // Found the level!
      const currentLevelXP = totalXP - xpSoFar;
      const nextLevelXP = xpForNextLevel;

      return {
        level,
        currentLevelXP,
        nextLevelXP,
      };
    }

    xpSoFar += xpForNextLevel;
    level++;

    // Safety: cap at level 50
    if (level > 50) {
      return {
        level: 50,
        currentLevelXP: totalXP - xpSoFar,
        nextLevelXP: calculateXPForLevel(50),
      };
    }
  }
}

/**
 * Validate quest claim - ensure player can claim rewards
 */
export function canClaimQuestReward(quest: PlayerQuest): {
  canClaim: boolean;
  reason?: string;
} {
  if (!quest.completed) {
    return { canClaim: false, reason: 'Quest not completed' };
  }

  if (quest.reward_claimed) {
    return { canClaim: false, reason: 'Reward already claimed' };
  }

  // Check if quest is from today (can only claim today's quests)
  const today = new Date().toISOString().split('T')[0];
  const questDate = quest.date_assigned.split('T')[0];

  if (questDate !== today) {
    return { canClaim: false, reason: 'Quest expired (not from today)' };
  }

  return { canClaim: true };
}

/**
 * Get quest difficulty multiplier for rewards
 */
export function getQuestDifficultyMultiplier(questType: 'easy' | 'medium' | 'hard'): number {
  switch (questType) {
    case 'easy':
      return 1.0;
    case 'medium':
      return 1.5;
    case 'hard':
      return 2.0;
    default:
      return 1.0;
  }
}

/**
 * Format quest progress as a percentage
 */
export function formatQuestProgress(progress: number, target: number): string {
  const percentage = Math.min(100, Math.floor((progress / target) * 100));
  return `${percentage}%`;
}

/**
 * Get quest progress display string
 */
export function getQuestProgressDisplay(progress: number, target: number): string {
  return `${Math.min(progress, target)}/${target}`;
}
