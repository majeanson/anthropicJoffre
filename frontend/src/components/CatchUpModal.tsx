import { memo } from 'react';
import { GameState } from '../types/game';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface CatchUpModalProps {
  gameState: GameState;
  currentPlayerId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CatchUpModal = memo(function CatchUpModal({ gameState, currentPlayerId, isOpen, onClose }: CatchUpModalProps) {

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome Back!"
      subtitle="You've successfully reconnected"
      icon="🎉"
      theme="green"
      size="lg"
      footer={
        <Button variant="success" onClick={onClose} fullWidth>
          Continue Playing
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Round and Phase */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-700 dark:border-green-700">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-700 dark:border-green-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl" aria-hidden="true">🏆</div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
              {leadingTeam && (
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  Team {leadingTeam} is leading!
                </p>
              )}
              {!leadingTeam && (
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  Tied game!
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`text-center p-3 rounded-lg ${
                currentPlayer?.teamId === 1
                  ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-600 dark:border-orange-700'
                  : 'bg-orange-50 dark:bg-orange-900/10 border border-orange-400 dark:border-orange-800'
              }`}
            >
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Team 1</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{gameState.teamScores.team1}</p>
            </div>
            <div
              className={`text-center p-3 rounded-lg ${
                currentPlayer?.teamId === 2
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-600 dark:border-purple-700'
                  : 'bg-purple-50 dark:bg-purple-900/10 border border-purple-400 dark:border-purple-800'
              }`}
            >
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Team 2</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{gameState.teamScores.team2}</p>
            </div>
          </div>
        </div>

        {/* Your Turn Indicator */}
        {isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && (
          <div className="bg-green-100/30 dark:bg-green-900/20 border-2 border-green-600 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce" aria-hidden="true">✨</div>
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  It's your turn!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  The game is waiting for you
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Waiting Indicator */}
        {!isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && gameState.phase !== 'scoring' && (
          <div className="bg-blue-100/30 dark:bg-blue-900/20 border-2 border-blue-600 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl" aria-hidden="true">⏳</div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
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
    </Modal>
  );
});
