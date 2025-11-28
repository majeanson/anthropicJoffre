/**
 * QuickPlayPanel Component
 * Sprint 4 Phase 4.2: Extracted from Lobby.tsx
 * Sprint 21: Updated for 3-tier user system
 *
 * Handles Quick Play functionality:
 * - Bot difficulty selection
 * - Persistence mode (ranked/casual) toggle
 * - Quick Play button
 * - Guest player name input (for users without a name)
 *
 * Tier restrictions:
 * - Guest: Can play but must enter a name first
 * - LocalStorage: Can only play casual (ranked disabled)
 * - Authenticated: Full access to ranked mode
 */

import { useState } from 'react';
import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { getUserTierInfo } from '../utils/userTier';
import { colors } from '../design-system';

interface QuickPlayPanelProps {
  botDifficulty: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  quickPlayPersistence: 'elo' | 'casual';
  setQuickPlayPersistence: (mode: 'elo' | 'casual') => void;
  onQuickPlay: (difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual', playerName?: string) => void;
  user: User | null;
  playerName?: string;
  onPlayerNameChange?: (name: string) => void;
}

export function QuickPlayPanel({
  botDifficulty,
  onBotDifficultyChange,
  quickPlayPersistence,
  setQuickPlayPersistence,
  onQuickPlay,
  user,
  playerName = '',
  onPlayerNameChange,
}: QuickPlayPanelProps) {
  const tierInfo = getUserTierInfo(user, playerName);
  const isGuest = tierInfo.tier === 'guest';
  const [localName, setLocalName] = useState('');

  // Use provided playerName or local state for guests
  const effectiveName = playerName || localName;
  const canPlay = effectiveName.trim().length > 0;

  const handleNameChange = (name: string) => {
    setLocalName(name);
    if (onPlayerNameChange) {
      onPlayerNameChange(name);
    }
  };

  const handleQuickPlay = () => {
    sounds.buttonClick();
    // Save to localStorage if guest enters a name
    if (isGuest && localName.trim()) {
      localStorage.setItem('playerName', localName.trim());
    }
    onQuickPlay(botDifficulty, quickPlayPersistence, effectiveName);
  };

  return (
    <div className="bg-parchment-200 dark:bg-gray-700/50 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-600">
      <h3 className="text-sm font-bold text-umber-800 dark:text-gray-200 mb-3 text-center">
        Practice with Bots
      </h3>

      {/* Guest Name Input */}
      {isGuest && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-umber-700 dark:text-gray-300 mb-2">
            Enter your name to play
          </label>
          <input
            type="text"
            value={localName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="w-full px-3 py-2 rounded-lg border-2 border-umber-300 dark:border-gray-600 bg-parchment-50 dark:bg-gray-800 text-umber-800 dark:text-gray-200 placeholder-umber-400 dark:placeholder-gray-500 focus:border-umber-500 dark:focus:border-purple-500 focus:outline-none text-sm"
          />
        </div>
      )}

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
      <div className={`bg-parchment-100 dark:bg-gray-800 border-2 border-umber-300 dark:border-gray-600 rounded-lg p-3 ${!tierInfo.canPlayRanked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <label className={`flex items-center gap-2 flex-1 ${tierInfo.canPlayRanked ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
            <input
              type="checkbox"
              checked={quickPlayPersistence === 'elo'}
              onChange={(e) => setQuickPlayPersistence(e.target.checked ? 'elo' : 'casual')}
              disabled={!tierInfo.canPlayRanked}
              className="w-4 h-4 text-umber-600 dark:text-purple-600 bg-parchment-50 dark:bg-gray-700 border-umber-300 dark:border-gray-500 rounded focus:ring-umber-500 dark:focus:ring-purple-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium text-umber-800 dark:text-gray-200">
              Ranked Mode
            </span>
          </label>
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
            quickPlayPersistence === 'elo' && tierInfo.canPlayRanked
              ? 'bg-amber-200 dark:bg-purple-900 text-amber-900 dark:text-purple-200'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            <span aria-hidden="true">{quickPlayPersistence === 'elo' && tierInfo.canPlayRanked ? '🏆' : '🎮'}</span> {quickPlayPersistence === 'elo' && tierInfo.canPlayRanked ? 'Ranked' : 'Casual'}
          </span>
        </div>
        <p className="text-xs text-umber-600 dark:text-gray-400 mt-2">
          {!tierInfo.canPlayRanked
            ? <><span aria-hidden="true">🔒</span> Register an account to enable ranked mode and stats tracking</>
            : quickPlayPersistence === 'elo'
            ? 'Game will be saved to your profile and affect your ranking'
            : 'No stats saved - play without affecting your ELO rating'}
        </p>
      </div>

      <button
        data-testid="quick-play-button"
        data-keyboard-nav="quick-play"
        onClick={handleQuickPlay}
        disabled={!canPlay}
        style={canPlay ? {
          background: `linear-gradient(to right, ${colors.primary.start}, ${colors.primary.end})`,
          borderColor: colors.primary.border
        } : undefined}
        className={`w-full mt-3 py-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 border shadow focus-visible:ring-2 focus-visible:ring-offset-2 ${
          canPlay
            ? 'text-white focus-visible:ring-purple-500'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-400 dark:border-gray-500 focus-visible:ring-gray-400'
        }`}
      >
        <span aria-hidden="true">⚡</span>
        <span>{canPlay ? 'Quick Play (1P + 3 Bots)' : 'Enter name to play'}</span>
      </button>
    </div>
  );
}
