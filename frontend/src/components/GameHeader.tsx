import { useState, useRef, useEffect } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 border-b-2 border-amber-800 dark:border-gray-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5">
        {/* Mobile: Single row with Game ID, Round, Controls */}
        <div className="flex md:hidden items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
              <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">{gameId}</p>
            </div>
            <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
              <p className="text-xs text-white dark:text-gray-100 font-bold">R{roundNumber}</p>
            </div>
          </div>
          {/* Controls Dropdown - Mobile */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 px-2 py-1 rounded backdrop-blur-sm transition-all duration-200 flex items-center gap-1 border border-white/30 dark:border-gray-600"
            >
              <span className="text-white dark:text-gray-100 font-bold text-xs">Menu</span>
              {(unreadChatCount > 0 && !dropdownOpen) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-amber-600 dark:border-gray-600 overflow-hidden z-50 animate-slideDown">
                {/* Chat */}
                {onOpenChat && (
                  <button
                    onClick={() => {
                      onOpenChat();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-2 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">💬</span>
                      <span className="text-umber-900 dark:text-gray-100 font-semibold">Chat</span>
                    </div>
                    {unreadChatCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Leaderboard */}
                {onOpenLeaderboard && (
                  <button
                    onClick={() => {
                      onOpenLeaderboard();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <span className="text-xl">🏆</span>
                    <span className="text-umber-900 dark:text-gray-100 font-semibold">Leaderboard</span>
                  </button>
                )}

                {/* Autoplay Toggle */}
                {!isSpectator && onAutoplayToggle && (
                  <button
                    onClick={() => {
                      onAutoplayToggle();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-3 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{autoplayEnabled ? '🤖' : '🎮'}</span>
                      <span className="text-umber-900 dark:text-gray-100 font-semibold">Autoplay</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      autoplayEnabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {autoplayEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {/* Dark Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDarkMode(!darkMode);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-3 border-b border-parchment-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
                    <span className="text-umber-900 dark:text-gray-100 font-semibold">Dark Mode</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    darkMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {darkMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Sound Toggle */}
                {onSoundToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSoundToggle();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-3 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
                      <span className="text-umber-900 dark:text-gray-100 font-semibold">Sound</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      soundEnabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {soundEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {/* Leave Game */}
                {onLeaveGame && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to leave the game?')) {
                        onLeaveGame();
                        setDropdownOpen(false);
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <span className="text-xl">🚪</span>
                    <span className="font-semibold">Leave Game</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Scores row */}
        <div className="flex md:hidden items-center justify-center gap-2">
          <div className="bg-orange-500 dark:bg-orange-600 px-2 py-0.5 rounded shadow-md">
            <p className="text-xs text-white/90 font-semibold">T1</p>
            <p className="text-base text-white font-black text-center">{team1Score}</p>
          </div>
          <div className="text-white dark:text-gray-300 font-bold text-sm">:</div>
          <div className="bg-purple-500 dark:bg-purple-600 px-2 py-0.5 rounded shadow-md">
            <p className="text-xs text-white/90 font-semibold">T2</p>
            <p className="text-base text-white font-black text-center">{team2Score}</p>
          </div>
        </div>

        {/* Desktop: Single row layout */}
        <div className="hidden md:flex items-center justify-between gap-3">
          {/* Left: Game Info and Scores on same horizontal plane */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
              <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">{gameId}</p>
            </div>
            <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
              <p className="text-xs text-white dark:text-gray-100 font-bold">R{roundNumber}</p>
            </div>

            {/* Scores inline with game info */}
            <div className="flex items-center gap-2 ml-2">
              <div className="bg-orange-500 dark:bg-orange-600 px-2 py-1 rounded shadow-md flex items-center gap-1">
                <p className="text-xs text-white/90 font-semibold">T1</p>
                <p className="text-base text-white font-black">{team1Score}</p>
              </div>
              <div className="text-white dark:text-gray-300 font-bold text-sm">:</div>
              <div className="bg-purple-500 dark:bg-purple-600 px-2 py-1 rounded shadow-md flex items-center gap-1">
                <p className="text-xs text-white/90 font-semibold">T2</p>
                <p className="text-base text-white font-black">{team2Score}</p>
              </div>
            </div>
          </div>

          {/* Right: Controls Dropdown */}
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 px-3 py-1.5 rounded backdrop-blur-sm transition-all duration-200 flex items-center gap-1 border border-white/30 dark:border-gray-600"
            >
              <span className="text-white dark:text-gray-100 font-bold text-sm">Controls</span>
              <span className="text-white dark:text-gray-100 text-xs">{dropdownOpen ? '▲' : '▼'}</span>
              {(unreadChatCount > 0 && !dropdownOpen) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-amber-600 dark:border-gray-600 overflow-hidden z-50 animate-slideDown">
                {/* Chat */}
                {onOpenChat && (
                  <button
                    onClick={() => {
                      onOpenChat();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-2 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">💬</span>
                      <span className="text-umber-900 dark:text-gray-100 font-semibold">Chat</span>
                    </div>
                    {unreadChatCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Leaderboard */}
                {onOpenLeaderboard && (
                  <button
                    onClick={() => {
                      onOpenLeaderboard();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <span className="text-xl">🏆</span>
                    <span className="text-umber-900 dark:text-gray-100 font-semibold">Leaderboard</span>
                  </button>
                )}

                {/* Autoplay Toggle */}
                {!isSpectator && onAutoplayToggle && (
                  <button
                    onClick={() => {
                      onAutoplayToggle();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-3 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{autoplayEnabled ? '🤖' : '🎮'}</span>
                      <span className="text-umber-900 dark:text-gray-100 font-semibold">Autoplay</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      autoplayEnabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {autoplayEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {/* Dark Mode Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDarkMode(!darkMode);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-3 border-b border-parchment-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
                    <span className="text-umber-900 dark:text-gray-100 font-semibold">Dark Mode</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    darkMode
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}>
                    {darkMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Sound Toggle */}
                {onSoundToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSoundToggle();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-parchment-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between gap-3 border-b border-parchment-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{soundEnabled ? '🔊' : '🔇'}</span>
                      <span className="text-umber-900 dark:text-gray-100 font-semibold">Sound</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      soundEnabled
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {soundEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {/* Leave Game */}
                {onLeaveGame && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to leave the game?')) {
                        onLeaveGame();
                        setDropdownOpen(false);
                      }
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                  >
                    <span className="text-xl">🚪</span>
                    <span className="font-semibold">Leave Game</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
