/**
 * Tests for Round Statistics Functions
 * Sprint 5 Phase 2.3: Tests for updateTrickStats() helper
 */

import { describe, it, expect } from 'vitest';
import { updateTrickStats, initializeRoundStats, RoundStatsData } from './roundStatistics';
import { TrickCard, Player } from '../types/game';

describe('Round Statistics', () => {
  describe('initializeRoundStats', () => {
    it('should initialize empty stats for all players', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      expect(stats.cardPlayTimes.size).toBe(4);
      expect(stats.trumpsPlayed.size).toBe(4);
      expect(stats.redZerosCollected.size).toBe(4);
      expect(stats.brownZerosReceived.size).toBe(4);

      // All counters should start at 0
      expect(stats.redZerosCollected.get('Player 1')).toBe(0);
      expect(stats.brownZerosReceived.get('Player 1')).toBe(0);
      expect(stats.trumpsPlayed.get('Player 1')).toBe(0);
    });
  });

  describe('updateTrickStats', () => {
    it('should return undefined if stats is undefined', () => {
      const trick: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'red', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'red', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'red', value: 1 } },
      ];

      const result = updateTrickStats(undefined, trick, 'Player 1');

      expect(result).toBeUndefined();
    });

    it('should track red zero collection', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      const trick: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 0 } }, // Red 0 (+5 points)
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'blue', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'blue', value: 1 } },
      ];

      updateTrickStats(stats, trick, 'Player 1');

      expect(stats.redZerosCollected.get('Player 1')).toBe(1);
      expect(stats.brownZerosReceived.get('Player 1')).toBe(0);
    });

    it('should track brown zero collection', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      const trick: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'brown', value: 0 } }, // Brown 0 (-2 points)
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'blue', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'blue', value: 1 } },
      ];

      updateTrickStats(stats, trick, 'Player 1');

      expect(stats.redZerosCollected.get('Player 1')).toBe(0);
      expect(stats.brownZerosReceived.get('Player 1')).toBe(1);
    });

    it('should track both red and brown zeros in same trick', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      const trick: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 0 } }, // Red 0 (+5)
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'brown', value: 0 } }, // Brown 0 (-2)
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'blue', value: 1 } },
      ];

      updateTrickStats(stats, trick, 'Player 1');

      expect(stats.redZerosCollected.get('Player 1')).toBe(1);
      expect(stats.brownZerosReceived.get('Player 1')).toBe(1);
    });

    it('should accumulate stats across multiple tricks', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      // First trick - Player 1 wins red 0
      const trick1: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 0 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'blue', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'blue', value: 1 } },
      ];
      updateTrickStats(stats, trick1, 'Player 1');

      expect(stats.redZerosCollected.get('Player 1')).toBe(1);

      // Second trick - Player 1 wins another red 0
      const trick2: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'green', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 0 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'green', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'green', value: 1 } },
      ];
      updateTrickStats(stats, trick2, 'Player 1');

      expect(stats.redZerosCollected.get('Player 1')).toBe(2);

      // Third trick - Player 2 wins brown 0
      const trick3: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 5 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'blue', value: 7 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'brown', value: 0 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'blue', value: 1 } },
      ];
      updateTrickStats(stats, trick3, 'Player 2');

      expect(stats.brownZerosReceived.get('Player 2')).toBe(1);
      expect(stats.redZerosCollected.get('Player 1')).toBe(2); // Unchanged
    });

    it('should not modify stats if no special cards in trick', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p2', name: 'Player 2', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
        { id: 'p3', name: 'Player 3', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
        { id: 'p4', name: 'Player 4', hand: [], teamId: 2, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      const trick: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'blue', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'green', value: 2 } },
      ];

      updateTrickStats(stats, trick, 'Player 1');

      expect(stats.redZerosCollected.get('Player 1')).toBe(0);
      expect(stats.brownZerosReceived.get('Player 1')).toBe(0);
    });

    it('should return the stats object for chaining', () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player 1', hand: [], teamId: 1, tricksWon: 0, pointsWon: 0 },
      ];

      const stats = initializeRoundStats(players);

      const trick: TrickCard[] = [
        { playerId: 'p1', playerName: 'Player 1', card: { color: 'blue', value: 7 } },
        { playerId: 'p2', playerName: 'Player 2', card: { color: 'red', value: 5 } },
        { playerId: 'p3', playerName: 'Player 3', card: { color: 'blue', value: 3 } },
        { playerId: 'p4', playerName: 'Player 4', card: { color: 'green', value: 2 } },
      ];

      const result = updateTrickStats(stats, trick, 'Player 1');

      expect(result).toBe(stats);
    });
  });
});
