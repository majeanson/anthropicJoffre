/**
 * StatsPanel Component
 * Sprint 4 Phase 4.2: Extracted from Lobby.tsx
 *
 * Displays player statistics buttons:
 * - My Stats
 * - Global Leaderboard
 * - Recent Games
 */

import { Socket } from 'socket.io-client';
import { sounds } from '../utils/sounds';

interface StatsPanelProps {
  socket: Socket | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  setSelectedPlayerName: (name: string) => void;
  setShowPlayerStats: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowBrowser: (show: boolean) => void;
}

export function StatsPanel({
  socket,
  playerName,
  setPlayerName,
  setSelectedPlayerName,
  setShowPlayerStats,
  setShowLeaderboard,
  setShowBrowser,
}: StatsPanelProps) {
  return (
    <div className="space-y-3">
      <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-6 border-2 border-parchment-400 dark:border-gray-600 text-center">
        <p className="text-4xl mb-3">📊</p>
        <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4">Player Statistics</h3>

        <div className="space-y-3">
          <button
            data-keyboard-nav="my-stats"
            onClick={() => {
              if (!socket) return;
              sounds.buttonClick();
              if (!playerName.trim()) {
                const name = window.prompt('Enter your player name to view stats:');
                if (name && name.trim()) {
                  setPlayerName(name.trim());
                  setSelectedPlayerName(name.trim());
                  setShowPlayerStats(true);
                }
              } else {
                setSelectedPlayerName(playerName);
                setShowPlayerStats(true);
              }
            }}
            className="w-full bg-gradient-to-r from-umber-700 to-amber-800 dark:from-blue-700 dark:to-blue-800 text-white py-4 rounded-lg font-bold hover:from-umber-800 hover:to-amber-900 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 border border-umber-900 dark:border-blue-600 shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!socket}
          >
            <span className="text-xl">📊</span>
            My Stats
          </button>

          <button
            data-keyboard-nav="leaderboard"
            onClick={() => {
              if (socket) {
                sounds.buttonClick();
                setShowLeaderboard(true);
              }
            }}
            className="w-full bg-gradient-to-r from-amber-700 to-orange-700 dark:from-indigo-700 dark:to-indigo-800 text-white py-4 rounded-lg font-bold hover:from-amber-800 hover:to-orange-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-200 border border-amber-900 dark:border-indigo-600 shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!socket}
          >
            <span className="text-xl">🏆</span>
            Global Leaderboard
          </button>

          <button
            data-keyboard-nav="recent-games"
            onClick={() => {
              sounds.buttonClick();
              setShowBrowser(true);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-800 text-white py-4 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 dark:hover:from-purple-600 dark:hover:to-pink-700 transition-all duration-200 border border-purple-800 dark:border-pink-600 shadow flex items-center justify-center gap-2"
          >
            <span className="text-xl">📜</span>
            Recent Games
          </button>
        </div>

        {!socket && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-4">
            ⚠️ Connect to server to view stats
          </p>
        )}
      </div>
    </div>
  );
}
