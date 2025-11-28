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
import { colors } from '../design-system';

interface StatsPanelProps {
  socket: Socket | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  setSelectedPlayerName: (name: string) => void;
  setShowPlayerStats: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowBrowser: (show: boolean) => void;
  onShowQuests?: () => void;
  onShowRewardsCalendar?: () => void;
}

export function StatsPanel({
  socket,
  playerName,
  setPlayerName,
  setSelectedPlayerName,
  setShowPlayerStats,
  setShowLeaderboard,
  setShowBrowser,
  onShowQuests,
  onShowRewardsCalendar,
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
            className="w-full bg-gradient-to-r from-umber-700 to-amber-800 dark:from-blue-700 dark:to-blue-800 text-white py-4 rounded-lg font-bold hover:from-umber-800 hover:to-amber-900 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 border border-umber-900 dark:border-blue-600 shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2"
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
            className="w-full bg-gradient-to-r from-amber-700 to-orange-700 dark:from-indigo-700 dark:to-indigo-800 text-white py-4 rounded-lg font-bold hover:from-amber-800 hover:to-orange-800 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-200 border border-amber-900 dark:border-indigo-600 shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2"
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
            className={`w-full bg-gradient-to-r ${colors.gradients.special} hover:${colors.gradients.specialHover} text-white py-4 rounded-lg font-bold transition-all duration-200 border border-purple-800 dark:border-pink-600 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2`}
          >
            <span className="text-xl">📜</span>
            Recent Games
          </button>

          {/* Sprint 19: Quest System Buttons */}
          {onShowQuests && (
            <button
              data-keyboard-nav="daily-quests"
              onClick={() => {
                sounds.buttonClick();
                onShowQuests();
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-800 text-white py-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-700 transition-all duration-200 border border-blue-800 dark:border-purple-600 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <span className="text-xl">📋</span>
              Daily Quests
            </button>
          )}

          {onShowRewardsCalendar && (
            <button
              data-keyboard-nav="rewards-calendar"
              onClick={() => {
                sounds.buttonClick();
                onShowRewardsCalendar();
              }}
              className="w-full bg-gradient-to-r from-pink-600 to-orange-600 dark:from-pink-700 dark:to-orange-800 text-white py-4 rounded-lg font-bold hover:from-pink-700 hover:to-orange-700 dark:hover:from-pink-600 dark:hover:to-orange-700 transition-all duration-200 border border-pink-800 dark:border-orange-600 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <span className="text-xl">🎁</span>
              Rewards Calendar
            </button>
          )}
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
