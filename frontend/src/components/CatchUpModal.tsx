import { memo, useEffect, useCallback } from 'react';
import { GameState } from '../types/game';
import { colors } from '../design-system';

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

  const currentPlayer = gameState.players.find(p => p.name === currentPlayerId || p.id === currentPlayerId);
  const turnPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentTurn = turnPlayer?.name === currentPlayerId || turnPlayer?.id === currentPlayerId;
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn" onKeyDown={(e) => e.stopPropagation()}>
      <div
        style={{
          background: `linear-gradient(to bottom right, ${colors.warning.start}, ${colors.warning.end})`,
          borderColor: colors.warning.border
        }}
        className="rounded-2xl p-8 max-w-md w-full mx-4 border-4 shadow-2xl animate-slideUp"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white mb-2">
            <span aria-hidden="true">🎉</span> Welcome Back!
          </h2>
          <p className="text-white/90 font-semibold">
            You've successfully reconnected
          </p>
        </div>

        {/* Game Status */}
        <div className="space-y-4 mb-6">
          {/* Round and Phase */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2" style={{ borderColor: colors.warning.border }}>
            <div className="flex items-center gap-3">
              <div className="text-3xl" aria-hidden="true">📍</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current Status</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Round {gameState.roundNumber} - {phaseDisplayName}
                </p>
              </div>
            </div>
          </div>

          {/* Team Scores */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2" style={{ borderColor: colors.warning.border }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl" aria-hidden="true">🏆</div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                {leadingTeam && (
                  <p className="text-lg font-bold" style={{ color: colors.success.end }}>
                    Team {leadingTeam} is leading!
                  </p>
                )}
                {!leadingTeam && (
                  <p className="text-lg font-bold" style={{ color: colors.info.end }}>
                    Tied game!
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                style={currentPlayer?.teamId === 1 ? {
                  backgroundColor: `${colors.team1.start}20`,
                  borderColor: colors.team1.border,
                  borderWidth: '2px'
                } : {
                  backgroundColor: `${colors.team1.start}10`,
                  borderColor: `${colors.team1.border}80`,
                  borderWidth: '1px'
                }}
                className="text-center p-3 rounded-lg"
              >
                <p className="text-xs font-semibold" style={{ color: colors.team1.end }}>Team 1</p>
                <p className="text-2xl font-black" style={{ color: colors.team1.end }}>{gameState.teamScores.team1}</p>
              </div>
              <div
                style={currentPlayer?.teamId === 2 ? {
                  backgroundColor: `${colors.team2.start}20`,
                  borderColor: colors.team2.border,
                  borderWidth: '2px'
                } : {
                  backgroundColor: `${colors.team2.start}10`,
                  borderColor: `${colors.team2.border}80`,
                  borderWidth: '1px'
                }}
                className="text-center p-3 rounded-lg"
              >
                <p className="text-xs font-semibold" style={{ color: colors.team2.end }}>Team 2</p>
                <p className="text-2xl font-black" style={{ color: colors.team2.end }}>{gameState.teamScores.team2}</p>
              </div>
            </div>
          </div>

          {/* Your Turn Indicator */}
          {isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && (
            <div
              style={{
                backgroundColor: `${colors.success.start}20`,
                borderColor: colors.success.border
              }}
              className="border-2 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-bounce" aria-hidden="true">✨</div>
                <div>
                  <p className="text-lg font-bold" style={{ color: colors.success.end }}>
                    It's your turn!
                  </p>
                  <p className="text-sm" style={{ color: colors.success.end }}>
                    The game is waiting for you
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Waiting Indicator */}
          {!isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && gameState.phase !== 'scoring' && (
            <div
              style={{
                backgroundColor: `${colors.info.start}20`,
                borderColor: colors.info.border
              }}
              className="border-2 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl" aria-hidden="true">⏳</div>
                <div>
                  <p className="text-sm" style={{ color: colors.info.end }}>
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
          style={{
            background: `linear-gradient(to right, ${colors.success.start}, ${colors.success.end})`
          }}
          className="w-full text-white py-4 rounded-xl font-black text-lg shadow-lg transition-all transform hover:scale-105 hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-offset-2"
        >
          Continue Playing
        </button>
      </div>
    </div>
  );
});
