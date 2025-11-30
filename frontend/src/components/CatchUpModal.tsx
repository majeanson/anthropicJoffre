import { memo } from 'react';
import { GameState } from '../types/game';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { UICard } from './ui/UICard';

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
        <UICard variant="bordered" size="md" className="bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-600">
          <div className="flex items-center gap-3">
            <div className="text-3xl" aria-hidden="true">📍</div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Current Status</p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100">
                Round {gameState.roundNumber} - {phaseDisplayName}
              </p>
            </div>
          </div>
        </UICard>

        {/* Team Scores */}
        <UICard variant="bordered" size="md" className="bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl" aria-hidden="true">🏆</div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">Score</p>
              {leadingTeam && (
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  Team {leadingTeam} is leading!
                </p>
              )}
              {!leadingTeam && (
                <p className="text-lg font-bold text-green-800 dark:text-green-200">
                  Tied game!
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <UICard
              variant={currentPlayer?.teamId === 1 ? "gradient" : "bordered"}
              gradient={currentPlayer?.teamId === 1 ? "team1" : undefined}
              size="sm"
              className="text-center"
            >
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">Team 1</p>
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{gameState.teamScores.team1}</p>
            </UICard>
            <UICard
              variant={currentPlayer?.teamId === 2 ? "gradient" : "bordered"}
              gradient={currentPlayer?.teamId === 2 ? "team2" : undefined}
              size="sm"
              className="text-center"
            >
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">Team 2</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{gameState.teamScores.team2}</p>
            </UICard>
          </div>
        </UICard>

        {/* Your Turn Indicator */}
        {isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && (
          <UICard variant="bordered" size="md" className="bg-emerald-50 dark:bg-emerald-900 border-emerald-400 dark:border-emerald-600">
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce" aria-hidden="true">✨</div>
              <div>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  It's your turn!
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  The game is waiting for you
                </p>
              </div>
            </div>
          </UICard>
        )}

        {/* Waiting Indicator */}
        {!isCurrentTurn && gameState.phase !== 'team_selection' && gameState.phase !== 'game_over' && gameState.phase !== 'scoring' && (
          <UICard variant="bordered" size="md" className="bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-600">
            <div className="flex items-center gap-3">
              <div className="text-2xl" aria-hidden="true">⏳</div>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Waiting for{' '}
                  <span className="font-bold">
                    {gameState.players[gameState.currentPlayerIndex]?.name}
                  </span>
                </p>
              </div>
            </div>
          </UICard>
        )}
      </div>
    </Modal>
  );
});
