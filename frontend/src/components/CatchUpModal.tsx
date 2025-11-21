import { memo, useEffect, useCallback } from 'react';
import { GameState } from '../types/game';

interface CatchUpModalProps {
  gameState: GameState;
  currentPlayerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CatchUpModal = memo(function CatchUpModal({ gameState, currentPlayerId, isOpen, onClose }: CatchUpModalProps) {
  // Handle keyboard: Escape or Enter to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;
  const leadingTeam = gameState.teamScores.team1 > gameState.teamScores.team2 ? 1 :
                      gameState.teamScores.team2 > gameState.teamScores.team1 ? 2 : null;

  const phaseDisplayName = {
    team_selection: 'Team Selection',
    betting: 'Betting',
    playing: 'Playing',
    scoring: 'Round Summary',
    game_over: 'Game Over',
  }[gameState.phase];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 max-w-md w-full mx-4 border-4 border-amber-600 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-amber-900 mb-2">
            🎉 Welcome Back!
          </h2>
          <p className="text-amber-700 font-semibold">
            You've successfully reconnected
          </p>
        </div>

        {/* Game Status */}
        <div className="space-y-4 mb-6">
          {/* Round and Phase */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-amber-300">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📍</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Status</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Round {gameState.roundNumber} - {phaseDisplayName}
                </p>
              </div>
            </div>
          </div>

          {/* Team Scores */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-amber-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">🏆</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                {leadingTeam && (
                  <p className="text-lg font-bold text-green-600">
                    Team {leadingTeam} is leading!
                  </p>
                )}
                {!leadingTeam && (
                  <p className="text-lg font-bold text-blue-600">
                    Tied game!
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`text-center p-3 rounded-lg ${
                currentPlayer?.teamId === 1 ? 'bg-orange-100 border-2 border-orange-400' : 'bg-orange-50 border border-orange-200'
              }`}>
                <p className="text-xs text-orange-600 font-semibold">Team 1</p>
                <p className="text-2xl font-black text-orange-700">{gameState.teamScores.team1}</p>
              </div>
              <div className={`text-center p-3 rounded-lg ${
                currentPlayer?.teamId === 2 ? 'bg-purple-100 border-2 border-purple-400' : 'bg-purple-50 border border-purple-200'
              }`}>
                <p className="text-xs text-purple-600 font-semibold">Team 2</p>
                <p className="text-2xl font-black text-purple-700">{gameState.teamScores.team2}</p>
              </div>
            </div>
          </div>

          {/* Your Turn Indicator */}
          {isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-bounce">✨</div>
                <div>
                  <p className="text-lg font-bold text-green-700">
                    It's your turn!
                  </p>
                  <p className="text-sm text-green-600">
                    The game is waiting for you
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Waiting Indicator */}
          {!isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && gameState.phase !== 'scoring' && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏳</div>
                <div>
                  <p className="text-sm text-blue-700">
                    Waiting for{' '}
                    <span className="font-bold">
                      {gameState.players[gameState.currentPlayerIndex]?.name}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          autoFocus
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 rounded-xl font-black text-lg shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-offset-2"
        >
          Continue Playing
        </button>
      </div>
    </div>
  );
});
