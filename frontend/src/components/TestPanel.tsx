import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../types/game';
import * as Sentry from '@sentry/react';
import { Modal, Button, Input } from './ui';
import { UICard } from './ui/UICard';

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

  const handleTestFrontendSentry = () => {
    // Trigger a test error in Sentry (frontend)
    Sentry.captureException(new Error('🧪 Test Error - Frontend Sentry Integration'), {
      level: 'error',
      tags: {
        test: true,
        source: 'debug_panel',
        type: 'manual_test',
      },
      extra: {
        gameId: gameState?.id,
        playerCount: gameState?.players.length,
        phase: gameState?.phase,
        timestamp: new Date().toISOString(),
      },
    });
    alert('✅ Frontend Sentry test error sent! Check your Sentry dashboard.');
  };

  const handleTestBackendSentry = () => {
    // Trigger a test error in backend via socket event
    if (socket) {
      socket.emit('__test_sentry_error', {
        message: '🧪 Test Error - Backend Sentry Integration',
        gameId: gameState?.id,
      });
      alert('✅ Backend Sentry test request sent! Check your Sentry dashboard in ~10 seconds.');
    } else {
      alert('❌ Socket not connected. Cannot test backend Sentry.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧪 Test Panel"
      subtitle="Game State Manipulation"
      theme="green"
      size="lg"
    >
      <div className="space-y-6">
        {/* Current State */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-green-200 pb-2">
            📊 Current State
          </h3>
          <UICard variant="bordered" size="md">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Phase:
                </span>
                <p className="text-lg font-bold capitalize">{gameState.phase.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Round:
                </span>
                <p className="text-lg font-bold">{gameState.roundNumber}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Team 1 Score:
                </span>
                <p className="text-lg font-bold text-orange-600">{gameState.teamScores.team1}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Team 2 Score:
                </span>
                <p className="text-lg font-bold text-purple-600">{gameState.teamScores.team2}</p>
              </div>
            </div>
          </UICard>
        </section>

        {/* Score Manipulation */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-green-200 pb-2">
            🎯 Set Team Scores
          </h3>
          <UICard variant="bordered" size="md">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                type="number"
                label="Team 1 Score"
                min={0}
                max={100}
                value={team1Score}
                onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
              />
              <Input
                type="number"
                label="Team 2 Score"
                min={0}
                max={100}
                value={team2Score}
                onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
              />
            </div>
            <Button variant="success" fullWidth onClick={handleSetScores}>
              Apply Scores
            </Button>
          </UICard>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-green-200 pb-2">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="warning"
              onClick={() => {
                setTeam1Score(40);
                setTeam2Score(0);
              }}
            >
              Team 1 Near Win (40-0)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTeam1Score(0);
                setTeam2Score(40);
              }}
            >
              Team 2 Near Win (0-40)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTeam1Score(35);
                setTeam2Score(35);
              }}
            >
              Close Game (35-35)
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setTeam1Score(0);
                setTeam2Score(0);
              }}
            >
              Reset Scores (0-0)
            </Button>
          </div>
        </section>

        {/* Developer Links */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
            🔧 Developer Resources
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={() =>
                window.open('https://69291bd0d238365e7e12f66c-nqeyaruzoe.chromatic.com/', '_blank')
              }
            >
              <span aria-hidden="true">📖</span> Open Storybook
            </Button>
            <Button
              variant="warning"
              onClick={() =>
                window.open(
                  'https://sentry.io/organizations/marc-3h/issues/?project=4510241709293568',
                  '_blank'
                )
              }
            >
              <span aria-hidden="true">🐛</span> Open Sentry
            </Button>
          </div>
        </section>

        {/* Sentry Testing */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-red-200 pb-2">
            🚨 Sentry Error Tracking Tests
          </h3>
          <UICard variant="bordered" size="md">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Test Sentry error tracking integration for both frontend and backend.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <Button variant="danger" onClick={handleTestFrontendSentry}>
                <span aria-hidden="true">📱</span> Test Frontend Sentry
              </Button>
              <Button variant="warning" onClick={handleTestBackendSentry} disabled={!socket}>
                <span aria-hidden="true">🖥️</span> Test Backend Sentry
              </Button>
            </div>
            <UICard variant="gradient" gradient="info" size="sm">
              <p className="text-xs text-white">
                <strong>💡 Tip:</strong> After testing, check your Sentry dashboard at{' '}
                <a
                  href="https://sentry.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-200"
                >
                  sentry.io
                </a>{' '}
                to verify errors appear and configure alerts.
              </p>
            </UICard>
          </UICard>
        </section>

        {/* Info */}
        <UICard variant="gradient" gradient="warning" size="sm">
          <p className="text-sm text-white">
            <strong>⚠️ Warning:</strong> These actions directly modify the game state. Use for
            testing purposes only. Changes affect all connected players.
          </p>
        </UICard>
      </div>
    </Modal>
  );
}
