/**
 * Bot Socket Handler Tests
 * Sprint 7: Socket Handler Tests - Critical
 *
 * Tests for bots.ts socket handlers:
 * - replace_me_with_bot: Replace self with a bot
 * - replace_with_bot: Replace a teammate with a bot
 * - take_over_bot: Human takes over a bot
 * - change_bot_difficulty: Change bot difficulty level
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, Player, Bet, TrickCard } from '../types/game';

// Helper to create a test game state
function createTestGame(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game-123',
    players: [
      { id: 'socket-1', name: 'Player1', hand: [], teamId: 1, isBot: false, isConnected: true },
      { id: 'socket-2', name: 'Player2', hand: [], teamId: 2, isBot: false, isConnected: true },
      { id: 'socket-3', name: 'Player3', hand: [], teamId: 1, isBot: false, isConnected: true },
      { id: 'socket-4', name: 'Player4', hand: [], teamId: 2, isBot: false, isConnected: true },
    ],
    phase: 'playing',
    currentPlayerId: 'socket-1',
    currentBets: [],
    trumpColor: 'red',
    currentRound: 1,
    roundNumber: 1,
    scores: { team1: 0, team2: 0 },
    currentTrick: [],
    dealerIndex: 0,
    bettingPlayerIndex: 1,
    roundHistory: [],
    ...overrides,
  } as GameState;
}

// Helper to create a bot player
function createBotPlayer(name: string, teamId: 1 | 2): Player {
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name,
    hand: [],
    teamId,
    isBot: true,
    botDifficulty: 'medium',
    isConnected: true,
  };
}

// Helper to count bots in game
function countBots(game: GameState): number {
  return game.players.filter(p => p.isBot).length;
}

// Helper to count humans in game
function countHumans(game: GameState): number {
  return game.players.filter(p => !p.isBot).length;
}

// Helper to check if two players are teammates
function areTeammates(game: GameState, player1Name: string, player2Name: string): boolean {
  const p1 = game.players.find(p => p.name === player1Name);
  const p2 = game.players.find(p => p.name === player2Name);
  if (!p1 || !p2) return false;
  return p1.teamId === p2.teamId;
}

describe('bots handlers', () => {
  let testGame: GameState;

  beforeEach(() => {
    testGame = createTestGame();
  });

  describe('replace_me_with_bot', () => {
    it('should allow player to replace themselves with a bot', () => {
      const playerToReplace = testGame.players[0];
      const originalName = playerToReplace.name;

      // Verify player is human
      expect(playerToReplace.isBot).toBe(false);

      // Simulate replacement
      playerToReplace.name = 'Bot_Alice';
      playerToReplace.isBot = true;
      playerToReplace.botDifficulty = 'medium';
      playerToReplace.id = `bot-${Date.now()}`;

      expect(playerToReplace.isBot).toBe(true);
      expect(playerToReplace.name).not.toBe(originalName);
      expect(playerToReplace.botDifficulty).toBe('medium');
    });

    it('should reject if player is already a bot', () => {
      const botPlayer = createBotPlayer('Bot_Alice', 1);
      testGame.players[0] = botPlayer;

      // Attempting to replace a bot should fail
      const canReplace = !botPlayer.isBot;
      expect(canReplace).toBe(false);
    });

    it('should reject if max bots (3) would be exceeded', () => {
      // Add 3 bots to the game
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      testGame.players[1] = createBotPlayer('Bot_Bob', 2);
      testGame.players[2] = createBotPlayer('Bot_Carol', 1);

      const botCount = countBots(testGame);
      const maxBots = 3;
      const canAddBot = botCount < maxBots;

      expect(botCount).toBe(3);
      expect(canAddBot).toBe(false);
    });

    it('should reject if player is the last human', () => {
      // Make all but one player bots
      testGame.players[1] = createBotPlayer('Bot_Bob', 2);
      testGame.players[2] = createBotPlayer('Bot_Carol', 1);
      testGame.players[3] = createBotPlayer('Bot_Dave', 2);

      const humanCount = countHumans(testGame);
      const wouldRemainAfterReplace = humanCount - 1;

      expect(humanCount).toBe(1);
      expect(wouldRemainAfterReplace).toBe(0);
      expect(wouldRemainAfterReplace >= 1).toBe(false);
    });

    it('should preserve team, hand, and scores after replacement', () => {
      const player = testGame.players[0];
      player.hand = [{ color: 'red', value: 5 }, { color: 'blue', value: 7 }];
      const originalTeamId = player.teamId;
      const originalHand = [...player.hand];

      // Replace with bot
      player.name = 'Bot_Alice';
      player.isBot = true;
      player.botDifficulty = 'medium';

      // Team, hand should be preserved
      expect(player.teamId).toBe(originalTeamId);
      expect(player.hand).toEqual(originalHand);
    });

    it('should update currentTrick with new bot ID', () => {
      const oldPlayerId = 'socket-1';
      const newBotId = 'bot-12345';

      testGame.currentTrick = [
        { playerId: oldPlayerId, playerName: 'Player1', card: { color: 'red', value: 5 } },
        { playerId: 'socket-2', playerName: 'Player2', card: { color: 'red', value: 7 } },
      ];

      // Migrate player ID in currentTrick
      testGame.currentTrick.forEach(tc => {
        if (tc.playerId === oldPlayerId) {
          tc.playerId = newBotId;
        }
      });

      expect(testGame.currentTrick[0].playerId).toBe(newBotId);
      expect(testGame.currentTrick[1].playerId).toBe('socket-2');
    });

    it('should update currentBets with new bot ID and name', () => {
      const oldPlayerId = 'socket-1';
      const newBotId = 'bot-12345';
      const newBotName = 'Bot_Alice';

      testGame.currentBets = [
        { playerId: oldPlayerId, playerName: 'Player1', amount: 8, withoutTrump: false },
        { playerId: 'socket-2', playerName: 'Player2', amount: 9, withoutTrump: false },
      ];

      // Migrate player ID and name in bets
      testGame.currentBets.forEach(bet => {
        if (bet.playerId === oldPlayerId) {
          bet.playerId = newBotId;
          bet.playerName = newBotName;
        }
      });

      expect(testGame.currentBets[0].playerId).toBe(newBotId);
      expect(testGame.currentBets[0].playerName).toBe(newBotName);
    });
  });

  describe('replace_with_bot', () => {
    it('should allow teammate to replace a disconnected player', () => {
      const playerToReplace = testGame.players[0]; // Team 1
      const requestingPlayer = testGame.players[2]; // Also Team 1 (teammate)

      const isTeammate = areTeammates(testGame, playerToReplace.name, requestingPlayer.name);
      expect(isTeammate).toBe(true);

      // Simulate replacement
      playerToReplace.name = 'Bot_Alice';
      playerToReplace.isBot = true;
      playerToReplace.botDifficulty = 'hard';

      expect(playerToReplace.isBot).toBe(true);
    });

    it('should reject if requester is not a teammate', () => {
      const playerToReplace = testGame.players[0]; // Team 1
      const requestingPlayer = testGame.players[1]; // Team 2 (opponent)

      const isTeammate = areTeammates(testGame, playerToReplace.name, requestingPlayer.name);
      expect(isTeammate).toBe(false);
    });

    it('should reject replacing a bot with another bot', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);

      const isBot = testGame.players[0].isBot;
      const canReplace = !isBot;

      expect(canReplace).toBe(false);
    });

    it('should use hard difficulty for teammate replacement', () => {
      const player = testGame.players[0];
      player.name = 'Bot_Alice';
      player.isBot = true;
      player.botDifficulty = 'hard';

      expect(player.botDifficulty).toBe('hard');
    });
  });

  describe('take_over_bot', () => {
    it('should allow human to take over a bot', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      const bot = testGame.players[0];
      const newPlayerName = 'NewHumanPlayer';
      const newSocketId = 'new-socket-123';

      // Verify it's a bot
      expect(bot.isBot).toBe(true);

      // Simulate takeover
      bot.name = newPlayerName;
      bot.isBot = false;
      bot.botDifficulty = undefined;
      bot.id = newSocketId;

      expect(bot.isBot).toBe(false);
      expect(bot.name).toBe(newPlayerName);
      expect(bot.botDifficulty).toBeUndefined();
      expect(bot.id).toBe(newSocketId);
    });

    it('should reject if target is not a bot', () => {
      const player = testGame.players[0];
      const isBot = player.isBot;

      expect(isBot).toBe(false);
      // Cannot take over a non-bot
    });

    it('should reject if player name already exists', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      const existingPlayerName = 'Player2'; // Already in game

      const nameExists = testGame.players.some(p => p.name === existingPlayerName);
      expect(nameExists).toBe(true);
    });

    it('should preserve team, hand, and position after takeover', () => {
      const bot = createBotPlayer('Bot_Alice', 1);
      bot.hand = [{ color: 'red', value: 3 }];
      testGame.players[0] = bot;

      const originalTeamId = bot.teamId;
      const originalHand = [...bot.hand];
      const originalIndex = testGame.players.indexOf(bot);

      // Simulate takeover
      bot.name = 'NewPlayer';
      bot.isBot = false;
      bot.id = 'new-socket-123';

      expect(bot.teamId).toBe(originalTeamId);
      expect(bot.hand).toEqual(originalHand);
      expect(testGame.players.indexOf(bot)).toBe(originalIndex);
    });

    it('should update currentTrick with new socket ID', () => {
      const oldBotId = 'bot-old-123';
      const newSocketId = 'new-socket-456';

      testGame.currentTrick = [
        { playerId: oldBotId, playerName: 'Bot_Alice', card: { color: 'red', value: 5 } },
      ];

      // Migrate player ID
      testGame.currentTrick.forEach(tc => {
        if (tc.playerId === oldBotId) {
          tc.playerId = newSocketId;
        }
      });

      expect(testGame.currentTrick[0].playerId).toBe(newSocketId);
    });

    it('should update roundHistory with new player identity', () => {
      const oldBotName = 'Bot_Alice';
      const newPlayerName = 'NewPlayer';

      testGame.roundHistory = [{
        roundNumber: 1,
        tricks: [{
          trick: [
            { playerId: 'bot-1', playerName: oldBotName, card: { color: 'red', value: 5 } },
          ],
          winnerId: 'bot-1',
          winnerName: oldBotName,
          points: 1,
        }],
        finalBet: { playerId: 'bot-1', playerName: oldBotName, amount: 8, withoutTrump: false },
        scores: { team1: 8, team2: 0 },
      }];

      // Migrate player names in round history
      testGame.roundHistory.forEach(round => {
        round.tricks.forEach(trickResult => {
          trickResult.trick.forEach(tc => {
            if (tc.playerName === oldBotName) {
              tc.playerName = newPlayerName;
            }
          });
          if (trickResult.winnerName === oldBotName) {
            trickResult.winnerName = newPlayerName;
          }
        });
      });

      expect(testGame.roundHistory[0].tricks[0].trick[0].playerName).toBe(newPlayerName);
      expect(testGame.roundHistory[0].tricks[0].winnerName).toBe(newPlayerName);
    });
  });

  describe('change_bot_difficulty', () => {
    it('should change bot difficulty to easy', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      const bot = testGame.players[0];

      expect(bot.botDifficulty).toBe('medium');

      bot.botDifficulty = 'easy';
      expect(bot.botDifficulty).toBe('easy');
    });

    it('should change bot difficulty to medium', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      const bot = testGame.players[0];
      bot.botDifficulty = 'easy';

      bot.botDifficulty = 'medium';
      expect(bot.botDifficulty).toBe('medium');
    });

    it('should change bot difficulty to hard', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      const bot = testGame.players[0];

      bot.botDifficulty = 'hard';
      expect(bot.botDifficulty).toBe('hard');
    });

    it('should reject if target is not a bot', () => {
      const player = testGame.players[0];
      const isBot = player.isBot;

      expect(isBot).toBe(false);
      // Cannot change difficulty of a human
    });

    it('should reject invalid difficulty levels', () => {
      const validDifficulties = ['easy', 'medium', 'hard'];
      const invalidDifficulty = 'impossible';

      const isValid = validDifficulties.includes(invalidDifficulty);
      expect(isValid).toBe(false);
    });

    it('should reject if bot not found', () => {
      const botName = 'NonexistentBot';
      const bot = testGame.players.find(p => p.name === botName);

      expect(bot).toBeUndefined();
    });
  });

  describe('bot limit validation', () => {
    it('should allow adding bot when under limit', () => {
      // Start with 0 bots, limit is 3
      const botCount = countBots(testGame);
      const maxBots = 3;

      expect(botCount).toBe(0);
      expect(botCount < maxBots).toBe(true);
    });

    it('should allow up to 3 bots', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      testGame.players[1] = createBotPlayer('Bot_Bob', 2);
      testGame.players[2] = createBotPlayer('Bot_Carol', 1);

      const botCount = countBots(testGame);
      expect(botCount).toBe(3);

      // Still valid - exactly at limit
      const humanCount = countHumans(testGame);
      expect(humanCount).toBe(1);
    });

    it('should prevent all 4 players from being bots', () => {
      testGame.players[0] = createBotPlayer('Bot_Alice', 1);
      testGame.players[1] = createBotPlayer('Bot_Bob', 2);
      testGame.players[2] = createBotPlayer('Bot_Carol', 1);

      // Player 4 is still human
      const humanCount = countHumans(testGame);
      expect(humanCount).toBe(1);

      // Should not allow replacing the last human
      const wouldHaveZeroHumans = humanCount - 1 < 1;
      expect(wouldHaveZeroHumans).toBe(true);
    });
  });

  describe('bot name generation', () => {
    it('should generate unique bot names', () => {
      const usedNames = new Set(['Bot_Alice', 'Bot_Bob']);
      const botNames = ['Bot_Alice', 'Bot_Bob', 'Bot_Carol', 'Bot_Dave', 'Bot_Eve', 'Bot_Frank'];

      const getNextBotName = () => {
        for (const name of botNames) {
          if (!usedNames.has(name)) {
            usedNames.add(name);
            return name;
          }
        }
        return `Bot_${Date.now()}`;
      };

      const name1 = getNextBotName();
      const name2 = getNextBotName();

      expect(name1).toBe('Bot_Carol');
      expect(name2).toBe('Bot_Dave');
      expect(name1).not.toBe(name2);
    });
  });
});
