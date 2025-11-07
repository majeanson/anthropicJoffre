/**
 * QuickPlayPanel Component
 * Sprint 4 Phase 4.2: Extracted from Lobby.tsx
 *
 * Handles Quick Play functionality:
 * - Bot difficulty selection
 * - Persistence mode (ranked/casual) toggle
 * - Quick Play button
 */

import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';

interface QuickPlayPanelProps {
  botDifficulty: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  quickPlayPersistence: 'elo' | 'casual';
  setQuickPlayPersistence: (mode: 'elo' | 'casual') => void;
  onQuickPlay: (difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual') => void;
}

export function QuickPlayPanel({
  botDifficulty,
  onBotDifficultyChange,
  quickPlayPersistence,
  setQuickPlayPersistence,
  onQuickPlay,
}: QuickPlayPanelProps) {
  return (
    <div className="bg-parchment-200 dark:bg-gray-700/50 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-600">
      <h3 className="text-sm font-bold text-umber-800 dark:text-gray-200 mb-3 text-center">
        Practice with Bots
      </h3>

      {/* Bot Difficulty Selector */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-umber-700 dark:text-gray-300 mb-2">
          Bot Difficulty
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => { sounds.buttonClick(); onBotDifficultyChange && onBotDifficultyChange('easy'); }}
            className={`py-2 px-3 rounded font-bold transition-all duration-200 text-xs ${
              botDifficulty === 'easy'
                ? 'bg-umber-600 dark:bg-slate-600 text-white shadow-md scale-105 border border-umber-800 dark:border-slate-500'
                : 'bg-parchment-100 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
            }`}
          >
            Easy
          </button>
          <button
            onClick={() => { sounds.buttonClick(); onBotDifficultyChange && onBotDifficultyChange('medium'); }}
            className={`py-2 px-3 rounded font-bold transition-all duration-200 text-xs ${
              botDifficulty === 'medium'
                ? 'bg-umber-600 dark:bg-slate-600 text-white shadow-md scale-105 border border-umber-800 dark:border-slate-500'
                : 'bg-parchment-100 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => { sounds.buttonClick(); onBotDifficultyChange && onBotDifficultyChange('hard'); }}
            className={`py-2 px-3 rounded font-bold transition-all duration-200 text-xs ${
              botDifficulty === 'hard'
                ? 'bg-umber-600 dark:bg-slate-600 text-white shadow-md scale-105 border border-umber-800 dark:border-slate-500'
                : 'bg-parchment-100 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
            }`}
          >
            Hard
          </button>
        </div>
        <p className="text-xs text-umber-600 dark:text-gray-400 mt-2 text-center">
          {botDifficulty === 'easy' && 'Random play, good for beginners'}
          {botDifficulty === 'medium' && 'Strategic play with positional awareness'}
          {botDifficulty === 'hard' && 'Advanced AI with card counting'}
        </p>
      </div>

      {/* Persistence Mode Selector */}
      <div className="bg-parchment-100 dark:bg-gray-800 border-2 border-umber-300 dark:border-gray-600 rounded-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={quickPlayPersistence === 'elo'}
              onChange={(e) => setQuickPlayPersistence(e.target.checked ? 'elo' : 'casual')}
              className="w-4 h-4 text-umber-600 dark:text-purple-600 bg-parchment-50 dark:bg-gray-700 border-umber-300 dark:border-gray-500 rounded focus:ring-umber-500 dark:focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-umber-800 dark:text-gray-200">
              Ranked Mode
            </span>
          </label>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            quickPlayPersistence === 'elo'
              ? 'bg-amber-200 dark:bg-purple-900 text-amber-900 dark:text-purple-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            {quickPlayPersistence === 'elo' ? '🏆 Ranked' : '🎮 Casual'}
          </span>
        </div>
        <p className="text-xs text-umber-600 dark:text-gray-400 mt-2">
          {quickPlayPersistence === 'elo'
            ? 'Game will be saved to your profile and affect your ranking'
            : 'No stats saved - play without affecting your ELO rating'}
        </p>
      </div>

      <button
        data-testid="quick-play-button"
        onClick={() => { sounds.buttonClick(); onQuickPlay(botDifficulty, quickPlayPersistence); }}
        className="w-full bg-gradient-to-r from-umber-700 to-amber-800 dark:from-violet-700 dark:to-violet-800 text-white py-4 rounded-lg font-bold hover:from-umber-800 hover:to-amber-900 dark:hover:from-violet-600 dark:hover:to-violet-700 transition-all duration-200 flex items-center justify-center gap-2 border border-umber-900 dark:border-violet-600 shadow"
      >
        <span>⚡</span>
        <span>Quick Play (1P + 3 Bots)</span>
      </button>
    </div>
  );
}
