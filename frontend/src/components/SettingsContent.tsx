/**
 * SettingsContent Component - Retro Gaming Edition
 *
 * Settings panel with retro gaming aesthetic:
 * - Theme/Skin selection
 * - Sound settings
 * - Keyboard navigation hints
 * - Debug options
 */

import { useState } from 'react';
import { sounds } from '../utils/sounds';
import { useSettings } from '../contexts/SettingsContext';
import { useSkin } from '../contexts/SkinContext';
import { Button, NeonButton } from './ui/Button';
import { SkinSelectorDropdown } from './SkinSelector';

interface SettingsContentProps {
  onShowRules: () => void;
  onShowDebug: () => void;
}

export function SettingsContent({ onShowRules, onShowDebug }: SettingsContentProps) {
  useSettings(); // Provides theme context
  useSkin(); // Provides skin context
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(sounds.getVolume());

  return (
    <div className="space-y-4">
      {/* Main Settings Card */}
      <div
        className="
          p-5
          rounded-[var(--radius-lg)]
          border border-[var(--color-border-default)]
          bg-[var(--color-bg-tertiary)]
        "
      >
        <h3
          className="text-lg font-display uppercase tracking-wider text-center mb-6"
          style={{
            color: 'var(--color-text-primary)',
            textShadow: '0 0 10px var(--color-glow)',
          }}
        >
          Settings
        </h3>

        <div className="space-y-5">
          {/* Keyboard Navigation Hint - hidden on mobile */}
          <div
            className="
              hidden sm:block
              p-4
              rounded-[var(--radius-md)]
              border border-[var(--color-text-accent)]/30
              bg-[var(--color-text-accent)]/5
            "
          >
            <h4 className="text-xs font-display uppercase tracking-wider text-[var(--color-text-accent)] mb-3 flex items-center gap-2">
              <span>⌨️</span>
              <span>Keyboard Navigation</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                <kbd
                  className="
                    px-2 py-1
                    bg-[var(--color-bg-secondary)]
                    border border-[var(--color-border-default)]
                    rounded-[var(--radius-sm)]
                    font-mono text-[var(--color-text-muted)]
                  "
                >
                  ← →
                </kbd>
                <span className="font-body">Switch tabs</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                <kbd
                  className="
                    px-2 py-1
                    bg-[var(--color-bg-secondary)]
                    border border-[var(--color-border-default)]
                    rounded-[var(--radius-sm)]
                    font-mono text-[var(--color-text-muted)]
                  "
                >
                  ↑ ↓
                </kbd>
                <span className="font-body">Navigate buttons</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                <kbd
                  className="
                    px-2 py-1
                    bg-[var(--color-bg-secondary)]
                    border border-[var(--color-border-default)]
                    rounded-[var(--radius-sm)]
                    font-mono text-[var(--color-text-muted)]
                  "
                >
                  Enter
                </kbd>
                <span className="font-body">Activate</span>
              </div>
            </div>
          </div>

          {/* Visual Theme / Skin */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Visual Theme
            </label>
            <SkinSelectorDropdown />
          </div>

          {/* Sound Effects */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Sound Effects
            </label>
            <div
              className="
                p-4
                rounded-[var(--radius-md)]
                border border-[var(--color-border-default)]
                bg-[var(--color-bg-secondary)]
                space-y-4
              "
            >
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)] font-body">Enable Sounds</span>
                <button
                  onClick={() => {
                    const newEnabled = !soundEnabled;
                    sounds.setEnabled(newEnabled);
                    setSoundEnabled(newEnabled);
                    if (newEnabled) sounds.buttonClick();
                  }}
                  className={`
                    w-12 h-6
                    rounded-full
                    relative
                    transition-all duration-[var(--duration-fast)]
                    ${soundEnabled
                      ? 'bg-[var(--color-success)]'
                      : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]'
                    }
                  `}
                  style={{
                    boxShadow: soundEnabled ? '0 0 10px var(--color-success)' : 'none',
                  }}
                  aria-label="Enable Sounds"
                  aria-pressed={soundEnabled}
                >
                  <div
                    className={`
                      absolute top-1 w-4 h-4
                      rounded-full
                      bg-white
                      transition-all duration-[var(--duration-fast)]
                      ${soundEnabled ? 'right-1' : 'left-1'}
                    `}
                  />
                </button>
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--color-text-muted)] font-body">Volume</span>
                  <span className="text-xs text-[var(--color-text-accent)] font-display">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(soundVolume * 100)}
                  onChange={(e) => {
                    const newVolume = parseInt(e.target.value) / 100;
                    sounds.setVolume(newVolume);
                    setSoundVolume(newVolume);
                  }}
                  className="
                    w-full h-2
                    rounded-full
                    appearance-none
                    cursor-pointer
                    bg-[var(--color-bg-tertiary)]
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[var(--color-text-accent)]
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_var(--color-glow)]
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-[var(--color-text-accent)]
                    [&::-moz-range-thumb]:border-none
                    [&::-moz-range-thumb]:cursor-pointer
                  "
                  style={{
                    background: `linear-gradient(to right, var(--color-text-accent) 0%, var(--color-text-accent) ${soundVolume * 100}%, var(--color-bg-tertiary) ${soundVolume * 100}%, var(--color-bg-tertiary) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)] my-4" />

          {/* How to Play */}
          <NeonButton
            data-keyboard-nav="how-to-play"
            size="lg"
            onClick={() => { sounds.buttonClick(); onShowRules(); }}
            fullWidth
            leftIcon={<span>📖</span>}
            glow
          >
            How to Play
          </NeonButton>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)] my-4" />

          {/* About */}
          <div className="text-center py-2">
            <p
              className="font-display text-lg uppercase tracking-wider"
              style={{
                color: 'var(--color-text-primary)',
                textShadow: '0 0 5px var(--color-glow)',
              }}
            >
              J⋀ffre
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-body">
              A 4-player trick-taking card game
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)] my-4" />

          {/* Debug Fun */}
          <Button
            data-keyboard-nav="debug-fun"
            variant="ghost"
            size="lg"
            onClick={() => { sounds.buttonClick(); onShowDebug(); }}
            fullWidth
            leftIcon={<span>🎮</span>}
          >
            Debug Fun
          </Button>
        </div>
      </div>
    </div>
  );
}
