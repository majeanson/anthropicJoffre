import { useState } from 'react';
import { sounds } from '../utils/sounds';
import { useSettings } from '../contexts/SettingsContext';
import { UICard, Button, UIToggle, UISliderField, UIDivider } from './ui';

interface SettingsContentProps {
  onShowRules: () => void;
  onShowDebug: () => void;
}

export function SettingsContent({ onShowRules, onShowDebug }: SettingsContentProps) {
  const { darkMode, setDarkMode } = useSettings();
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(sounds.getVolume());

  return (
    <div className="space-y-4">
      <UICard variant="bordered" size="lg" className="bg-parchment-200 dark:bg-gray-700">
        <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 text-center">⚙️ Settings</h3>

        <div className="space-y-4">
          {/* Keyboard Navigation Hint - hidden on mobile */}
          <UICard variant="bordered" size="sm" gradient="info" className="hidden sm:block mb-4">
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
              <span>⌨️</span>
              <span>Keyboard Navigation</span>
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
              Navigate the lobby with arrow keys:
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-gray-600 rounded font-mono">← →</kbd>
              <span>Switch tabs</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 mt-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-gray-600 rounded font-mono">↑ ↓</kbd>
              <span>Navigate buttons</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 mt-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-blue-300 dark:border-gray-600 rounded font-mono">Enter</kbd>
              <span>Activate</span>
            </div>
          </UICard>

          {/* Dark Mode */}
          <div>
            <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
              Theme
            </label>
            <Button
              onClick={() => setDarkMode(!darkMode)}
              variant="secondary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-pressed={darkMode}
            >
              <span className="text-xl" aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
              <span>{darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}</span>
            </Button>
          </div>

          {/* Sound Effects */}
          <div>
            <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
              Sound Effects
            </label>
            <UICard variant="bordered" size="sm" className="bg-parchment-100 dark:bg-gray-600 space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-umber-700 dark:text-gray-300">Enable Sounds</span>
                <UIToggle
                  enabled={soundEnabled}
                  onChange={(enabled) => {
                    sounds.setEnabled(enabled);
                    setSoundEnabled(enabled);
                  }}
                  label="Enable Sounds"
                />
              </div>

              {/* Volume Slider */}
              <UISliderField
                value={Math.round(soundVolume * 100)}
                onChange={(value) => {
                  const newVolume = value / 100;
                  sounds.setVolume(newVolume);
                  setSoundVolume(newVolume);
                }}
                fieldLabel="Volume"
                formatValue={(v) => `${v}%`}
              />
            </UICard>
          </div>

          {/* How to Play */}
          <UIDivider size="md" color="muted" />
          <Button
            data-keyboard-nav="how-to-play"
            variant="warning"
            size="lg"
            onClick={() => { sounds.buttonClick(); onShowRules(); }}
            className="w-full"
          >
            📖 How to Play
          </Button>

          {/* About */}
          <UIDivider size="md" color="muted" />
          <div>
            <p className="text-center text-sm text-umber-700 dark:text-gray-300">
              <strong>J⋀ffre</strong>
            </p>
            <p className="text-center text-xs text-umber-600 dark:text-gray-400 mt-1">
              A 4-player trick-taking card game
            </p>
          </div>

          {/* Debug Fun */}
          <UIDivider size="md" color="muted" />
          <Button
            data-keyboard-nav="debug-fun"
            variant="secondary"
            size="lg"
            onClick={() => { sounds.buttonClick(); onShowDebug(); }}
            className="w-full"
          >
            <span aria-hidden="true">🎮</span> Debug Fun
          </Button>

        </div>
      </UICard>
    </div>
  );
}
