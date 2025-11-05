/**
 * Match Stats Modal Component
 * Sprint 3 Phase 3.3
 *
 * Shows detailed statistics for a single game/match
 */

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
// import { GameHistoryEntry } from '../types/game';

interface MatchStatsModalProps {
  gameId: string;
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewReplay?: (gameId: string) => void;
}

// interface DetailedMatchStats extends GameHistoryEntry {
//   // Additional detailed stats that might be available
//   player1_name?: string;
//   player2_name?: string;
//   player3_name?: string;
//   player4_name?: string;
//   duration_minutes?: number;
// }

export function MatchStatsModal({ gameId, socket, isOpen, onClose, onViewReplay }: MatchStatsModalProps) {
  // const [matchData, setMatchData] = useState<DetailedMatchStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !gameId) return;

    // For now, we'll use the existing player_history endpoint
    // In the future, this could be enhanced with a dedicated match details endpoint
    setLoading(true);

    // TODO: Implement dedicated match details endpoint on backend
    // For now, this is a placeholder that shows we'd need more data

    setLoading(false);
  }, [isOpen, gameId, socket]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-amber-900 dark:border-gray-600">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-700 to-purple-900 dark:from-gray-700 dark:to-gray-800 p-6 flex items-center justify-between rounded-t-xl border-b-4 border-indigo-950 dark:border-gray-900 z-10">
          <div className="flex items-center gap-4">
            <span className="text-4xl">📊</span>
            <div>
              <h2 className="text-2xl font-bold text-parchment-50">Match Details</h2>
              <p className="text-indigo-200 dark:text-gray-300 text-sm">Game ID: {gameId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full font-bold text-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-700"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400 font-semibold">Loading match details...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Coming Soon Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-6 text-center">
                <span className="text-5xl mb-3 block">🚧</span>
                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  Detailed Match Stats Coming Soon
                </h3>
                <p className="text-blue-700 dark:text-blue-300 mb-4">
                  This feature will show comprehensive match statistics including:
                </p>
                <div className="grid grid-cols-2 gap-3 text-left max-w-2xl mx-auto mb-6">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <span>✓</span>
                    <span>Round-by-round breakdown</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <span>✓</span>
                    <span>Player performance charts</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <span>✓</span>
                    <span>Betting history per round</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <span>✓</span>
                    <span>Card play analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <span>✓</span>
                    <span>Team performance comparison</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <span>✓</span>
                    <span>Special cards breakdown</span>
                  </div>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 italic">
                  Backend API endpoint needed: GET /api/matches/:gameId/details
                </p>
              </div>

              {/* View Replay Button */}
              {onViewReplay && (
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      onViewReplay(gameId);
                      onClose();
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                  >
                    📺 View Full Replay
                  </button>
                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
