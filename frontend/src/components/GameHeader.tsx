import { useSettings } from '../contexts/SettingsContext';

interface GameHeaderProps {
  gameId: string;
  roundNumber: number;
  team1Score: number;
  team2Score: number;
  onLeaveGame?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenChat?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  isSpectator?: boolean;
  unreadChatCount?: number;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}

export function GameHeader({
  gameId,
  roundNumber,
  team1Score,
  team2Score,
  onLeaveGame,
  onOpenLeaderboard,
  onOpenChat,
  autoplayEnabled = false,
  onAutoplayToggle,
  isSpectator = false,
  unreadChatCount = 0,
  soundEnabled = true,
  onSoundToggle
}: GameHeaderProps) {
  const { darkMode, setDarkMode } = useSettings();

  return (
    <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 border-b-2 border-amber-800 dark:border-gray-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5">
        {/* Single responsive row - All items on same horizontal line */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Game Info */}
          <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
            <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">{gameId}</p>
          </div>
          <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
            <p className="text-xs text-white dark:text-gray-100 font-bold">R{roundNumber}</p>
          </div>

          {/* Team Scores */}
          <div className="bg-orange-500 dark:bg-orange-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0">
            <p className="text-xs text-white/90 font-semibold">T1</p>
            <p className="text-base text-white font-black">{team1Score}</p>
          </div>
          <div className="text-white dark:text-gray-300 font-bold text-sm flex-shrink-0">:</div>
          <div className="bg-purple-500 dark:bg-purple-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0">
            <p className="text-xs text-white/90 font-semibold">T2</p>
            <p className="text-base text-white font-black">{team2Score}</p>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Chat Button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="relative bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Chat"
              >
                <span className="text-base md:text-lg">💬</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Chat</span>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Leaderboard Button */}
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Leaderboard"
              >
                <span className="text-base md:text-lg">🏆</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Stats</span>
              </button>
            )}

            {/* Autoplay Toggle */}
            {!isSpectator && onAutoplayToggle && (
              <button
                onClick={onAutoplayToggle}
                className={`p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border flex items-center gap-1.5 ${
                  autoplayEnabled
                    ? 'bg-green-500/80 hover:bg-green-500 border-green-600'
                    : 'bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 border-white/30 dark:border-gray-600'
                }`}
                title={autoplayEnabled ? 'Autoplay ON' : 'Autoplay OFF'}
              >
                <span className="text-base md:text-lg">{autoplayEnabled ? '🤖' : '🎮'}</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">
                  {autoplayEnabled ? 'Auto' : 'Manual'}
                </span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              <span className="text-base md:text-lg">{darkMode ? '🌙' : '☀️'}</span>
              <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Sound Toggle */}
            {onSoundToggle && (
              <button
                onClick={onSoundToggle}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title={soundEnabled ? 'Sound ON' : 'Sound OFF'}
              >
                <span className="text-base md:text-lg">{soundEnabled ? '🔊' : '🔇'}</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">
                  {soundEnabled ? 'On' : 'Off'}
                </span>
              </button>
            )}

            {/* Leave Game Button */}
            {onLeaveGame && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to leave the game?')) {
                    onLeaveGame();
                  }
                }}
                className="bg-red-500/80 hover:bg-red-500 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-red-600 flex items-center gap-1.5"
                title="Leave Game"
              >
                <span className="text-base md:text-lg">🚪</span>
                <span className="hidden md:inline text-white font-semibold text-sm">Leave</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
