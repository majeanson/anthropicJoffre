import { useSettings } from '../contexts/SettingsContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  botCount?: number;
  onOpenBotManagement?: () => void;
  onLeaveGame?: () => void;
  onOpenRules?: () => void;
  isSpectator?: boolean;
}

export function SettingsPanel({
  isOpen,
  onClose,
  soundEnabled = true,
  onSoundToggle,
  autoplayEnabled = false,
  onAutoplayToggle,
  botCount = 0,
  onOpenBotManagement,
  onLeaveGame,
  onOpenRules,
  isSpectator = false
}: SettingsPanelProps) {
  const { darkMode, setDarkMode } = useSettings();

  if (!isOpen) return null;

  const handleBotManagement = () => {
    onClose();
    onOpenBotManagement?.();
  };

  const handleLeaveGame = () => {
    onClose();
    onLeaveGame?.();
  };

  const handleRules = () => {
    onClose();
    onOpenRules?.();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        data-testid="settings-backdrop"
      />

      {/* Settings Panel */}
      <div
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 bg-parchment-100 dark:bg-gray-800 border-2 border-amber-700 dark:border-gray-600 rounded-lg shadow-2xl z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-in"
        onClick={(e) => e.stopPropagation()}
        data-testid="settings-panel"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 px-4 py-2 rounded-t-md border-b-2 border-amber-800 dark:border-gray-600 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span>⚙️</span>
            <span>Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-300 transition-colors text-xl font-bold"
            title="Close Settings"
            data-testid="settings-close-button"
          >
            ✕
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-3">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between" data-testid="settings-dark-mode">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{darkMode ? '🌙' : '☀️'}</span>
              <span className="text-umber-900 dark:text-gray-100 font-semibold">Dark Mode</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                darkMode ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              title={darkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Toggle */}
          {onSoundToggle && (
            <div className="flex items-center justify-between" data-testid="settings-sound">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{soundEnabled ? '🔊' : '🔇'}</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Sound</span>
              </div>
              <button
                onClick={onSoundToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Autoplay Toggle */}
          {!isSpectator && onAutoplayToggle && (
            <div className="flex items-center justify-between" data-testid="settings-autoplay">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{autoplayEnabled ? '⚡' : '🎮'}</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Autoplay</span>
              </div>
              <button
                onClick={onAutoplayToggle}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoplayEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={autoplayEnabled ? 'Disable Autoplay' : 'Enable Autoplay'}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    autoplayEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-amber-700/30 dark:border-gray-600"></div>

          {/* Bot Management Button */}
          {!isSpectator && onOpenBotManagement && (
            <button
              onClick={handleBotManagement}
              className="w-full bg-parchment-200 dark:bg-gray-700 hover:bg-parchment-300 dark:hover:bg-gray-600 border border-amber-700 dark:border-gray-600 rounded px-3 py-2 transition-colors flex items-center justify-between"
              data-testid="settings-bot-management"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="text-umber-900 dark:text-gray-100 font-semibold">Bot Management</span>
              </div>
              <span className="text-umber-700 dark:text-gray-300 text-sm">({botCount}/3)</span>
            </button>
          )}

          {/* Rules Button */}
          {onOpenRules && (
            <button
              onClick={handleRules}
              className="w-full bg-parchment-200 dark:bg-gray-700 hover:bg-parchment-300 dark:hover:bg-gray-600 border border-amber-700 dark:border-gray-600 rounded px-3 py-2 transition-colors flex items-center gap-2"
              data-testid="settings-rules"
            >
              <span className="text-2xl">📖</span>
              <span className="text-umber-900 dark:text-gray-100 font-semibold">How to Play</span>
            </button>
          )}

          {/* Divider */}
          <div className="border-t border-amber-700/30 dark:border-gray-600"></div>

          {/* Leave Game Button */}
          {onLeaveGame && (
            <button
              onClick={handleLeaveGame}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-3 rounded transition-all shadow-md flex items-center justify-center gap-2"
              data-testid="settings-leave-game"
            >
              <span className="text-2xl">🚪</span>
              <span>Leave Game</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
