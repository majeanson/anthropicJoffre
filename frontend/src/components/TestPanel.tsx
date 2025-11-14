import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';

interface TestPanelProps {
  gameState: GameState | null;
  socket: Socket | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TestPanel({ gameState, socket, isOpen, onClose }: TestPanelProps) {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);

  if (!isOpen || !gameState) return null;

  const handleSetScores = () => {
    if (socket) {
      socket.emit('__test_set_scores', { team1: team1Score, team2: team2Score });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="test-panel-title"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 id="test-panel-title" className="text-2xl font-bold flex items-center gap-2">
              🧪 Test Panel
            </h2>
            <p className="text-sm text-green-100">Game State Manipulation</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white dark:bg-gray-800 hover:bg-opacity-20 rounded-lg px-4 py-2 transition-colors font-semibold"
            aria-label="Close test panel"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current State */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-green-200 pb-2">
              📊 Current State
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phase:</span>
                  <p className="text-lg font-bold capitalize">{gameState.phase.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Round:</span>
                  <p className="text-lg font-bold">{gameState.roundNumber}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Team 1 Score:</span>
                  <p className="text-lg font-bold text-orange-600">{gameState.teamScores.team1}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Team 2 Score:</span>
                  <p className="text-lg font-bold text-purple-600">{gameState.teamScores.team2}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Score Manipulation */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-green-200 pb-2">
              🎯 Set Team Scores
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Team 1 Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={team1Score}
                    onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Team 2 Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={team2Score}
                    onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSetScores}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Apply Scores
              </button>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-green-200 pb-2">
              ⚡ Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setTeam1Score(40);
                  setTeam2Score(0);
                }}
                className="bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Team 1 Near Win (40-0)
              </button>
              <button
                onClick={() => {
                  setTeam1Score(0);
                  setTeam2Score(40);
                }}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Team 2 Near Win (0-40)
              </button>
              <button
                onClick={() => {
                  setTeam1Score(35);
                  setTeam2Score(35);
                }}
                className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Close Game (35-35)
              </button>
              <button
                onClick={() => {
                  setTeam1Score(0);
                  setTeam2Score(0);
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Reset Scores (0-0)
              </button>
            </div>
          </section>

          {/* Info */}
          <section>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Warning:</strong> These actions directly modify the game state.
                Use for testing purposes only. Changes affect all connected players.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
