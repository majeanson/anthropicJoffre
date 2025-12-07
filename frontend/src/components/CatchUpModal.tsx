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

export const CatchUpModal = memo(function CatchUpModal({
  gameState,
  currentPlayerId,
  isOpen,
  onClose,
}: CatchUpModalProps) {
  const currentPlayer = gameState.players.find(
    (p) => p.name === currentPlayerId || p.id === currentPlayerId
  );
  const turnPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentTurn = turnPlayer?.name === currentPlayerId || turnPlayer?.id === currentPlayerId;
  const leadingTeam =
    gameState.teamScores.team1 > gameState.teamScores.team2
      ? 1
      : gameState.teamScores.team2 > gameState.teamScores.team1
        ? 2
        : null;

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
        <UICard variant="gradient" size="md" gradient="success">
          <div className="flex items-center gap-3">
            <div className="text-3xl" aria-hidden="true">
              📍
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Current Status</p>
              <p className="text-lg font-bold text-gray-900">
                Round {gameState.roundNumber} - {phaseDisplayName}
              </p>
            </div>
          </div>
        </UICard>

        {/* Team Scores */}
        <UICard variant="gradient" size="md" gradient="success">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl" aria-hidden="true">
              🏆
            </div>
            <div>
              <p className="text-sm font-medium text-green-700">Score</p>
              {leadingTeam && (
                <p className="text-lg font-bold text-gray-900">Team {leadingTeam} is leading!</p>
              )}
              {!leadingTeam && <p className="text-lg font-bold text-gray-900">Tied game!</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <UICard
              variant="gradient"
              gradient="team1"
              size="sm"
              className={`text-center ${currentPlayer?.teamId === 1 ? 'ring-2 ring-team1' : ''}`}
            >
              <p className="text-xs font-semibold text-team1">Team 1</p>
              <p className="text-2xl font-black text-team1">
                {gameState.teamScores.team1}
              </p>
            </UICard>
            <UICard
              variant="gradient"
              gradient="team2"
              size="sm"
              className={`text-center ${currentPlayer?.teamId === 2 ? 'ring-2 ring-team2' : ''}`}
            >
              <p className="text-xs font-semibold text-team2">Team 2</p>
              <p className="text-2xl font-black text-team2">
                {gameState.teamScores.team2}
              </p>
            </UICard>
          </div>
        </UICard>

        {/* Your Turn Indicator */}
        {isCurrentTurn &&
          gameState.phase !== 'team_selection' &&
          gameState.phase !== 'game_over' && (
            <UICard variant="gradient" size="md" gradient="warning">
              <div className="flex items-center gap-3">
                <div className="text-3xl animate-bounce" aria-hidden="true">
                  ✨
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">It's your turn!</p>
                  <p className="text-sm font-medium text-yellow-700">The game is waiting for you</p>
                </div>
              </div>
            </UICard>
          )}

        {/* Waiting Indicator */}
        {!isCurrentTurn &&
          gameState.phase !== 'team_selection' &&
          gameState.phase !== 'game_over' &&
          gameState.phase !== 'scoring' && (
            <UICard variant="gradient" size="md" gradient="info">
              <div className="flex items-center gap-3">
                <div className="text-2xl" aria-hidden="true">
                  ⏳
                </div>
                <div>
                  <p className="text-sm text-blue-800">
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
