/**
 * SettingsContent Component - Unified Preferences Edition
 *
 * Settings panel with consolidated preferences:
 * - Visual Theme/Skin selection
 * - Sound settings with volume control
 * - Animation toggle
 * - Keyboard navigation hints
 * - Debug options
 */

import { useState } from 'react';
import { sounds } from '../utils/sounds';
import { useSettings } from '../contexts/SettingsContext';
import { useSkin, useCardSkin, useSpecialCardSkins } from '../contexts/SkinContext';
import { resetTutorialProgress, getTutorialStats } from '../utils/tutorialProgress';
import { Button, NeonButton } from './ui/Button';
import { SkinSelectorDropdown } from './SkinSelector';
import { CardSkinDropdown } from './CardSkinSelector';
import { SpecialCardSkinDropdown } from './SpecialCardSkinSelector';

interface SettingsContentProps {
  onShowRules: () => void;
  onShowDebug: () => void;
}

// Toggle Switch Component for reusability
function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <span className="text-sm text-[var(--color-text-secondary)] font-body">{label}</span>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          w-12 h-6
          rounded-full
          relative
          transition-all duration-[var(--duration-fast)]
          flex-shrink-0 ml-3
          ${enabled
            ? 'bg-[var(--color-success)]'
            : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)]'
          }
        `}
        style={{
          boxShadow: enabled ? '0 0 10px var(--color-success)' : 'none',
        }}
        aria-label={label}
        aria-pressed={enabled}
      >
        <div
          className={`
            absolute top-1 w-4 h-4
            rounded-full
            bg-white
            transition-all duration-[var(--duration-fast)]
            ${enabled ? 'right-1' : 'left-1'}
          `}
        />
      </button>
    </div>
  );
}

export function SettingsContent({ onShowRules, onShowDebug }: SettingsContentProps) {
  const { animationsEnabled, setAnimationsEnabled } = useSettings();
  useSkin();
  useCardSkin(); // Initialize card skin context
  useSpecialCardSkins(); // Initialize special card skin context
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(sounds.getVolume());
  const [tutorialStats, setTutorialStats] = useState(getTutorialStats());

  const handleResetTutorial = () => {
    resetTutorialProgress();
    setTutorialStats(getTutorialStats());
    sounds.buttonClick();
  };

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
          Preferences
        </h3>

        <div className="space-y-5">
          {/* Visual Theme / Skin */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              🎨 Visual Theme
            </label>
            <SkinSelectorDropdown />
          </div>

          {/* Card Skin */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              🃏 Card Style
            </label>
            <CardSkinDropdown />
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Unlock more card styles by leveling up!
            </p>
          </div>

          {/* Special Card Skins - Red 0 & Brown 0 */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              🔥 Red Zero Skin (+5 Points)
            </label>
            <SpecialCardSkinDropdown cardType="red_zero" />
          </div>

          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              🌍 Brown Zero Skin (-2 Points)
            </label>
            <SpecialCardSkinDropdown cardType="brown_zero" />
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Unlock special card skins through achievements!
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)]" />

          {/* Sound & Animation Settings */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              🔊 Audio & Effects
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
              <ToggleSwitch
                enabled={soundEnabled}
                onChange={(enabled) => {
                  sounds.setEnabled(enabled);
                  setSoundEnabled(enabled);
                  if (enabled) sounds.buttonClick();
                }}
                label="Sound Effects"
                description="Card plays, notifications, UI feedback"
              />

              {/* Volume Slider */}
              {soundEnabled && (
                <div className="pt-2">
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
              )}

              {/* Animation Toggle */}
              <div className="border-t border-[var(--color-border-subtle)] pt-4">
                <ToggleSwitch
                  enabled={animationsEnabled}
                  onChange={setAnimationsEnabled}
                  label="Animations"
                  description="Card animations, glows, transitions"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)]" />

          {/* Tutorial Progress */}
          <div>
            <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
              📚 Tutorial Progress
            </label>
            <div
              className="
                p-4
                rounded-[var(--radius-md)]
                border border-[var(--color-border-default)]
                bg-[var(--color-bg-secondary)]
                space-y-3
              "
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)] font-body">
                  Completed: {tutorialStats.completed}/{tutorialStats.total}
                </span>
                <span className="text-sm text-[var(--color-text-accent)] font-display">
                  {tutorialStats.percentage}%
                </span>
              </div>
              <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[var(--color-success)] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${tutorialStats.percentage}%` }}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetTutorial}
                fullWidth
                className="mt-2"
              >
                🔄 Reset Tutorial Progress
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)]" />

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
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <kbd className="px-2 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] font-mono text-[var(--color-text-muted)]">
                  ← →
                </kbd>
                <span className="font-body">Tabs</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <kbd className="px-2 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] font-mono text-[var(--color-text-muted)]">
                  ↑ ↓
                </kbd>
                <span className="font-body">Navigate</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <kbd className="px-2 py-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] font-mono text-[var(--color-text-muted)]">
                  Enter
                </kbd>
                <span className="font-body">Activate</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--color-border-subtle)]" />

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
