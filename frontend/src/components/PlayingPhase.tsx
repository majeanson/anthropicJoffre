/**
 * PlayingPhase Component Export
 *
 * This file has been refactored into focused components for better maintainability.
 * Original file (1,191 lines) has been split into:
 *
 * - PlayingPhase/index.tsx (~400 lines) - Main orchestrator
 * - PlayingPhase/PlayerPosition.tsx (~130 lines) - Player badge component
 * - PlayingPhase/TrickArea.tsx (~300 lines) - Circular trick layout
 * - PlayingPhase/PlayerHand.tsx (~330 lines) - Hand display with keyboard navigation
 * - PlayingPhase/ScoreBoard.tsx (~230 lines) - Team scores with animations
 *
 * Total: ~1,390 lines across 5 focused files (vs 1,191 lines in single file)
 *
 * Backup of original file: PlayingPhase.tsx.backup
 */

export { PlayingPhase } from './PlayingPhase/index';
