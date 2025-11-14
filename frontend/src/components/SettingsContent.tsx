import { useState } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { sounds } from '../utils/sounds';

interface SettingsContentProps {
  onShowRules: () => void;
  onShowDebugInfo: () => void;
  onShowGlobalDebug?: () => void;
}

export function SettingsContent({ onShowRules, onShowDebugInfo, onShowGlobalDebug }: SettingsContentProps) {
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(sounds.getVolume());

  return (
    <div className="space-y-4">
      <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-6 border-2 border-parchment-400 dark:border-gray-600">
        <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 text-center">⚙️ Settings</h3>

        <div className="space-y-4">
          {/* Dark Mode */}
          <div>
            <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
              Theme
            </label>
            <DarkModeToggle />
          </div>

          {/* Sound Effects */}
          <div>
            <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
              Sound Effects
            </label>
            <div className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-300 dark:border-gray-500 space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-umber-700 dark:text-gray-300">Enable Sounds</span>
                <button
                  onClick={() => {
                    const newEnabled = !soundEnabled;
                    sounds.setEnabled(newEnabled);
                    setSoundEnabled(newEnabled);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    soundEnabled
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-umber-700 dark:text-gray-300">Volume</span>
                  <span className="text-xs text-umber-600 dark:text-gray-400">{Math.round(soundVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundVolume * 100}
                  onChange={(e) => {
                    const newVolume = parseInt(e.target.value) / 100;
                    sounds.setVolume(newVolume);
                    setSoundVolume(newVolume);
                  }}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div className="pt-4 border-t-2 border-parchment-300 dark:border-gray-600">
            <button
              data-keyboard-nav="how-to-play"
              onClick={() => { sounds.buttonClick(); onShowRules(); }}
              className="w-full bg-gradient-to-r from-amber-700 to-orange-700 dark:from-teal-700 dark:to-teal-800 text-white py-3 rounded-lg font-bold hover:from-amber-800 hover:to-orange-800 dark:hover:from-teal-600 dark:hover:to-teal-700 transition-all duration-200 border border-amber-900 dark:border-teal-600 shadow flex items-center justify-center gap-2"
            >
              📖 How to Play
            </button>
          </div>

          {/* About */}
          <div className="pt-4 border-t-2 border-parchment-300 dark:border-gray-600">
            <p className="text-center text-sm text-umber-700 dark:text-gray-300">
              <strong>J⋀ffre</strong>
            </p>
            <p className="text-center text-xs text-umber-600 dark:text-gray-400 mt-1">
              A 4-player trick-taking card game
            </p>
          </div>

          {/* Debug Fun */}
          <div className="pt-4 border-t-2 border-parchment-300 dark:border-gray-600">
            <button
              data-keyboard-nav="debug-fun"
              onClick={() => { sounds.buttonClick(); onShowDebugInfo(); }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 border border-indigo-800 dark:border-indigo-600 shadow flex items-center justify-center gap-2"
            >
              🎮 Debug Fun
            </button>
          </div>

          {/* Global Debug (Homepage Only) */}
          {onShowGlobalDebug && (
            <div className="pt-2">
              <button
                data-keyboard-nav="global-debug"
                onClick={() => { sounds.buttonClick(); onShowGlobalDebug(); }}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-cyan-700 dark:hover:from-blue-600 dark:hover:to-cyan-600 transition-all duration-200 border border-blue-800 dark:border-blue-600 shadow flex items-center justify-center gap-2"
              >
                🌐 Global Debug
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
