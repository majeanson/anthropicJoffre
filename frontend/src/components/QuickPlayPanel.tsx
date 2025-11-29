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
import { UICard, Button, UIBadge, Input, Checkbox } from './ui';

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
    <UICard variant="bordered" size="md" className="bg-parchment-200 dark:bg-gray-700/50">
      <h3 className="text-sm font-bold text-umber-800 dark:text-gray-200 mb-3 text-center">
        Practice with Bots
      </h3>

      {/* Guest Name Input */}
      {isGuest && (
        <div className="mb-3">
          <Input
            id="guestName"
            label="Enter your name to play"
            type="text"
            value={localName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            variant="filled"
            size="sm"
            fullWidth
          />
        </div>
      )}

      {/* Bot Difficulty Selector */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-umber-700 dark:text-gray-300 mb-2">
          Bot Difficulty
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => { sounds.buttonClick(); onBotDifficultyChange && onBotDifficultyChange('easy'); }}
            variant={botDifficulty === 'easy' ? 'primary' : 'ghost'}
            size="sm"
          >
            Easy
          </Button>
          <Button
            onClick={() => { sounds.buttonClick(); onBotDifficultyChange && onBotDifficultyChange('medium'); }}
            variant={botDifficulty === 'medium' ? 'primary' : 'ghost'}
            size="sm"
          >
            Medium
          </Button>
          <Button
            onClick={() => { sounds.buttonClick(); onBotDifficultyChange && onBotDifficultyChange('hard'); }}
            variant={botDifficulty === 'hard' ? 'primary' : 'ghost'}
            size="sm"
          >
            Hard
          </Button>
        </div>
        <p className="text-xs text-umber-600 dark:text-gray-400 mt-2 text-center">
          {botDifficulty === 'easy' && 'Random play, good for beginners'}
          {botDifficulty === 'medium' && 'Strategic play with positional awareness'}
          {botDifficulty === 'hard' && 'Advanced AI with card counting'}
        </p>
      </div>

      {/* Persistence Mode Selector */}
      <UICard variant="bordered" size="sm" className={`bg-parchment-100 dark:bg-gray-800 ${!tierInfo.canPlayRanked ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <Checkbox
            id="rankedMode"
            label="Ranked Mode"
            checked={quickPlayPersistence === 'elo'}
            onChange={(e) => setQuickPlayPersistence(e.target.checked ? 'elo' : 'casual')}
            disabled={!tierInfo.canPlayRanked}
            size="sm"
          />
          <UIBadge
            variant="solid"
            color={quickPlayPersistence === 'elo' && tierInfo.canPlayRanked ? 'warning' : 'gray'}
            size="sm"
          >
            {quickPlayPersistence === 'elo' && tierInfo.canPlayRanked ? '🏆 Ranked' : '🎮 Casual'}
          </UIBadge>
        </div>
        <p className="text-xs text-umber-600 dark:text-gray-400 mt-2">
          {!tierInfo.canPlayRanked
            ? <><span aria-hidden="true">🔒</span> Register an account to enable ranked mode and stats tracking</>
            : quickPlayPersistence === 'elo'
            ? 'Game will be saved to your profile and affect your ranking'
            : 'No stats saved - play without affecting your ELO rating'}
        </p>
      </UICard>

      <Button
        data-testid="quick-play-button"
        data-keyboard-nav="quick-play"
        variant="primary"
        size="lg"
        onClick={handleQuickPlay}
        disabled={!canPlay}
        className="w-full mt-3"
      >
        <span aria-hidden="true">⚡</span>
        <span>{canPlay ? 'Quick Play (1P + 3 Bots)' : 'Enter name to play'}</span>
      </Button>
    </UICard>
  );
}
