import { useState } from 'react';
import { SettingsPanel } from './SettingsPanel';

interface GameHeaderProps {
  gameId: string;
  roundNumber: number;
  team1Score: number;
  team2Score: number;
  onLeaveGame?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenChat?: () => void;
  onOpenBotManagement?: () => void;
  onOpenRules?: () => void;
  botCount?: number;
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
  onOpenBotManagement,
  onOpenRules,
  botCount = 0,
  autoplayEnabled = false,
  onAutoplayToggle,
  isSpectator = false,
  unreadChatCount = 0,
  soundEnabled = true,
  onSoundToggle
}: GameHeaderProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleCopyGameLink = async () => {
    const gameLink = `${window.location.origin}?gameId=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 border-b-2 border-amber-800 dark:border-gray-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5">
        {/* Desktop: Single row - All items on same horizontal line */}
        <div className="hidden md:flex items-center gap-3">
          {/* Game Info - Clickable to copy link */}
          <button
            onClick={handleCopyGameLink}
            className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0 hover:bg-white/30 dark:hover:bg-black/30 transition-all cursor-pointer border border-transparent hover:border-white/50"
            title="Click to copy game link"
          >
            <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">
              {linkCopied ? '✓ Copied!' : gameId}
            </p>
          </button>
          <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
            <p className="text-xs text-white dark:text-gray-100 font-bold" data-testid="round-number">R{roundNumber}</p>
          </div>

          {/* Team Scores */}
          <div className="flex items-center gap-1" data-testid="team-scores">
            <span className="sr-only">Team 1: {team1Score} Team 2: {team2Score}</span>
            <div className="bg-orange-500 dark:bg-orange-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0">
              <p className="text-xs text-white/90 font-semibold">T1</p>
              <p className="text-base text-white font-black">{team1Score}</p>
            </div>
            <div className="text-white dark:text-gray-300 font-bold text-sm flex-shrink-0">:</div>
            <div className="bg-purple-500 dark:bg-purple-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0">
              <p className="text-xs text-white/90 font-semibold">T2</p>
              <p className="text-base text-white font-black">{team2Score}</p>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Chat Button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="relative bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Chat"
                data-testid="header-chat-button"
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
                data-testid="header-leaderboard-button"
              >
                <span className="text-base md:text-lg">🏆</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Stats</span>
              </button>
            )}

            {/* Settings Button - Opens unified settings panel */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
              title="Settings"
              data-testid="header-settings-button"
            >
              <span className="text-base md:text-lg">⚙️</span>
              <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile: Two rows */}
        <div className="md:hidden space-y-1">
          {/* Row 1: Game Info and Scores */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyGameLink}
              className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0 active:bg-white/30 dark:active:bg-black/30"
              title="Click to copy game link"
            >
              <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">
                {linkCopied ? '✓' : gameId}
              </p>
            </button>
            <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
              <p className="text-xs text-white dark:text-gray-100 font-bold">R{roundNumber}</p>
            </div>

            <div className="flex-1"></div>

            <div className="flex items-center gap-1">
              <div className="bg-orange-500 dark:bg-orange-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0">
                <p className="text-xs text-white/90 font-semibold">T1</p>
                <p className="text-base text-white font-black">{team1Score}</p>
              </div>
              <div className="text-white dark:text-gray-300 font-bold text-sm flex-shrink-0">:</div>
              <div className="bg-purple-500 dark:bg-purple-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0">
                <p className="text-xs text-white/90 font-semibold">T2</p>
                <p className="text-base text-white font-black">{team2Score}</p>
              </div>
            </div>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center justify-center gap-1">
            {/* Chat Button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="relative bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center"
                title="Chat"
              >
                <span className="text-base">💬</span>
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
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600"
                title="Leaderboard"
              >
                <span className="text-base">🏆</span>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600"
              title="Settings"
            >
              <span className="text-base">⚙️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        botCount={botCount}
        onOpenBotManagement={onOpenBotManagement}
        onLeaveGame={onLeaveGame}
        onOpenRules={onOpenRules}
        isSpectator={isSpectator}
      />
    </div>
  );
}
