/**
 * Memory Management Utility
 *
 * Monitors and manages server memory usage to prevent out-of-memory crashes
 * on Railway's free tier (512MB limit).
 *
 * Features:
 * - Automatic cleanup of old/inactive data when memory is high
 * - Periodic memory monitoring and logging
 * - Proactive cleanup before critical thresholds
 */

import { GameState } from '../types/game';

export interface MemoryManagerConfig {
  // Memory thresholds (as percentage of heap)
  warningThreshold: number;    // Start logging warnings
  cleanupThreshold: number;    // Start aggressive cleanup
  criticalThreshold: number;   // Emergency cleanup

  // Monitoring
  monitoringInterval: number;  // How often to check memory (ms)

  // Cleanup policies
  maxPreviousStates: number;   // Max previous game states to keep
  maxFinishedGames: number;    // Max finished games to keep in memory
  inactiveGameTimeout: number; // Delete games with no activity (ms)
}

const DEFAULT_CONFIG: MemoryManagerConfig = {
  warningThreshold: 70,
  cleanupThreshold: 80,
  criticalThreshold: 90,
  monitoringInterval: 30000, // 30 seconds
  maxPreviousStates: 10,     // Only keep 10 recent previous states
  maxFinishedGames: 5,       // Only keep 5 finished games
  inactiveGameTimeout: 900000, // 15 minutes
};

export class MemoryManager {
  private config: MemoryManagerConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<MemoryManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(
    games: Map<string, GameState>,
    previousGameStates: Map<string, GameState>,
    gameFinishTimes: Map<string, number>,
    gameCreationTimes: Map<string, number>,
    onCleanup?: () => void
  ): void {
    this.monitoringInterval = setInterval(() => {
      const memUsage = this.getMemoryUsage();

      if (memUsage.heapUsedPercent >= this.config.criticalThreshold) {
        console.error(`🚨 [RAM] CRITICAL memory usage: ${memUsage.heapUsedPercent}% (${memUsage.heapUsedMB}MB / ${memUsage.heapTotalMB}MB)`);
        this.emergencyCleanup(games, previousGameStates, gameFinishTimes, gameCreationTimes);
        onCleanup?.();
      } else if (memUsage.heapUsedPercent >= this.config.cleanupThreshold) {
        console.warn(`⚠️ [RAM] High memory usage: ${memUsage.heapUsedPercent}% (${memUsage.heapUsedMB}MB / ${memUsage.heapTotalMB}MB)`);
        this.aggressiveCleanup(games, previousGameStates, gameFinishTimes, gameCreationTimes);
        onCleanup?.();
      } else if (memUsage.heapUsedPercent >= this.config.warningThreshold) {
        console.log(`ℹ️ [RAM] Memory usage: ${memUsage.heapUsedPercent}% (${memUsage.heapUsedMB}MB / ${memUsage.heapTotalMB}MB)`);
      }
    }, this.config.monitoringInterval);

    console.log(`[MemoryManager] Started monitoring (interval: ${this.config.monitoringInterval}ms)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[MemoryManager] Stopped monitoring');
    }
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      heapUsedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };
  }

  /**
   * Aggressive cleanup when memory is high (80-90%)
   */
  private aggressiveCleanup(
    games: Map<string, GameState>,
    previousGameStates: Map<string, GameState>,
    gameFinishTimes: Map<string, number>,
    gameCreationTimes: Map<string, number>
  ): void {
    console.log('[MemoryManager] Running aggressive cleanup...');

    const beforeMem = this.getMemoryUsage();
    let cleaned = 0;

    // 1. Clean up previous game states (keep only most recent)
    if (previousGameStates.size > this.config.maxPreviousStates) {
      const toDelete = previousGameStates.size - this.config.maxPreviousStates;
      const keys = Array.from(previousGameStates.keys()).slice(0, toDelete);
      keys.forEach(key => previousGameStates.delete(key));
      cleaned += keys.length;
      console.log(`[MemoryManager] Removed ${keys.length} old previous states`);
    }

    // 2. Clean up finished games (keep only most recent)
    const finishedGames = Array.from(games.entries())
      .filter(([_, game]) => game.phase === 'game_over')
      .sort((a, b) => {
        const timeA = gameFinishTimes.get(a[0]) || 0;
        const timeB = gameFinishTimes.get(b[0]) || 0;
        return timeB - timeA; // Newest first
      });

    if (finishedGames.length > this.config.maxFinishedGames) {
      const toDelete = finishedGames.slice(this.config.maxFinishedGames);
      toDelete.forEach(([gameId]) => {
        games.delete(gameId);
        gameFinishTimes.delete(gameId);
        gameCreationTimes.delete(gameId);
        previousGameStates.delete(gameId);
        cleaned++;
      });
      console.log(`[MemoryManager] Removed ${toDelete.length} old finished games`);
    }

    // 3. Clean up inactive games (no activity for 15+ minutes)
    const now = Date.now();
    const inactiveGames: string[] = [];

    games.forEach((game, gameId) => {
      const createdAt = gameCreationTimes.get(gameId) || now;
      const finishedAt = gameFinishTimes.get(gameId);
      const relevantTime = finishedAt || createdAt;
      const age = now - relevantTime;

      if (age > this.config.inactiveGameTimeout) {
        inactiveGames.push(gameId);
      }
    });

    inactiveGames.forEach(gameId => {
      games.delete(gameId);
      gameFinishTimes.delete(gameId);
      gameCreationTimes.delete(gameId);
      previousGameStates.delete(gameId);
      cleaned++;
    });

    if (inactiveGames.length > 0) {
      console.log(`[MemoryManager] Removed ${inactiveGames.length} inactive games`);
    }

    const afterMem = this.getMemoryUsage();
    const freed = beforeMem.heapUsedMB - afterMem.heapUsedMB;
    console.log(`[MemoryManager] Cleanup complete: Freed ${freed}MB, removed ${cleaned} items`);
  }

  /**
   * Emergency cleanup when memory is critical (90%+)
   */
  private emergencyCleanup(
    games: Map<string, GameState>,
    previousGameStates: Map<string, GameState>,
    gameFinishTimes: Map<string, number>,
    gameCreationTimes: Map<string, number>
  ): void {
    console.error('[MemoryManager] Running EMERGENCY cleanup...');

    const beforeMem = this.getMemoryUsage();

    // 1. Clear ALL previous states
    const prevStatesCount = previousGameStates.size;
    previousGameStates.clear();
    console.error(`[MemoryManager] Cleared ${prevStatesCount} previous game states`);

    // 2. Delete ALL finished games
    const finishedGames = Array.from(games.entries())
      .filter(([_, game]) => game.phase === 'game_over');

    finishedGames.forEach(([gameId]) => {
      games.delete(gameId);
      gameFinishTimes.delete(gameId);
      gameCreationTimes.delete(gameId);
    });
    console.error(`[MemoryManager] Deleted ${finishedGames.length} finished games`);

    // 3. Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.error('[MemoryManager] Forced garbage collection');
    }

    const afterMem = this.getMemoryUsage();
    const freed = beforeMem.heapUsedMB - afterMem.heapUsedMB;
    console.error(`[MemoryManager] Emergency cleanup complete: Freed ${freed}MB`);
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager();
