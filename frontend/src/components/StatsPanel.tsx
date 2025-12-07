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
import { Button } from './ui/Button';

interface StatsPanelProps {
  socket: Socket | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  setSelectedPlayerName: (name: string) => void;
  setShowPlayerStats: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowBrowser: (show: boolean) => void;
  onShowProgress?: () => void;
}

export function StatsPanel({
  socket,
  playerName,
  setPlayerName,
  setSelectedPlayerName,
  setShowPlayerStats,
  setShowLeaderboard,
  setShowBrowser,
  onShowProgress,
}: StatsPanelProps) {
  return (
    <div className="space-y-3">
      <div className="bg-parchment-200 rounded-lg p-6 border-2 border-parchment-400 text-center">
        <p className="text-4xl mb-3">📊</p>
        <h3 className="text-xl font-bold text-umber-900 mb-4">
          Player Statistics
        </h3>

        <div className="space-y-3">
          <Button
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
            variant="primary"
            size="lg"
            fullWidth
            disabled={!socket}
          >
            <span className="text-xl">📊</span>
            My Stats
          </Button>

          <Button
            data-keyboard-nav="leaderboard"
            onClick={() => {
              if (socket) {
                sounds.buttonClick();
                setShowLeaderboard(true);
              }
            }}
            variant="warning"
            size="lg"
            fullWidth
            disabled={!socket}
          >
            <span className="text-xl">🏆</span>
            Global Leaderboard
          </Button>

          <Button
            data-keyboard-nav="recent-games"
            onClick={() => {
              sounds.buttonClick();
              setShowBrowser(true);
            }}
            variant="secondary"
            fullWidth
            className="py-4"
          >
            <span className="text-xl">📜</span>
            Recent Games
          </Button>

          {/* Progress & Rewards Button */}
          {onShowProgress && (
            <Button
              data-keyboard-nav="progress"
              onClick={() => {
                sounds.buttonClick();
                onShowProgress();
              }}
              variant="secondary"
              size="lg"
              fullWidth
            >
              <span className="text-xl">🏆</span>
              Progress & Rewards
            </Button>
          )}
        </div>

        {!socket && (
          <p className="text-sm text-red-600 mt-4">
            ⚠️ Connect to server to view stats
          </p>
        )}
      </div>
    </div>
  );
}
