import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../../types/game';
import * as Sentry from '@sentry/react';
import { Button, UICard, Input } from '../ui';

interface TestControlsTabProps {
  gameState: GameState | null;
  socket: Socket | null;
}

export function TestControlsTab({ gameState, socket }: TestControlsTabProps) {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);

  const handleSetScores = () => {
    if (socket) {
      socket.emit('__test_set_scores', { team1: team1Score, team2: team2Score });
    }
  };

  const handleTestFrontendSentry = () => {
    Sentry.captureException(new Error('🧪 Test Error - Frontend Sentry Integration'), {
      level: 'error',
      tags: { test: true, source: 'unified_debug_panel', type: 'manual_test' },
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
    <div className="space-y-4 animate-slide-in">
      {/* Current State */}
      {gameState && (
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
            <span>📊</span> Current State
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-800/50 rounded p-3">
              <span className="text-xs text-gray-400">Phase</span>
              <p className="text-sm font-bold capitalize text-white">
                {gameState.phase.replace('_', ' ')}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded p-3">
              <span className="text-xs text-gray-400">Round</span>
              <p className="text-sm font-bold text-white">{gameState.roundNumber}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-3">
              <span className="text-xs text-gray-400">Team 1 Score</span>
              <p className="text-sm font-bold text-orange-400">{gameState.teamScores.team1}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-3">
              <span className="text-xs text-gray-400">Team 2 Score</span>
              <p className="text-sm font-bold text-purple-400">{gameState.teamScores.team2}</p>
            </div>
          </div>
        </div>
      )}

      {/* Score Manipulation */}
      <UICard variant="gradient" gradient="success" size="md">
        <h3 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
          <span>🎯</span> Set Team Scores
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">Team 1 Score</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={team1Score}
              onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
              variant="filled"
              size="md"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">Team 2 Score</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={team2Score}
              onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
              variant="filled"
              size="md"
            />
          </div>
        </div>
        <Button onClick={handleSetScores} variant="success" size="md" className="w-full">
          Apply Scores
        </Button>
      </UICard>

      {/* Quick Actions */}
      <UICard variant="gradient" gradient="primary" size="md">
        <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              setTeam1Score(40);
              setTeam2Score(0);
            }}
            variant="warning"
            size="sm"
          >
            Team 1 Near Win (40-0)
          </Button>
          <Button
            onClick={() => {
              setTeam1Score(0);
              setTeam2Score(40);
            }}
            variant="secondary"
            size="sm"
          >
            Team 2 Near Win (0-40)
          </Button>
          <Button
            onClick={() => {
              setTeam1Score(35);
              setTeam2Score(35);
            }}
            variant="primary"
            size="sm"
          >
            Close Game (35-35)
          </Button>
          <Button
            onClick={() => {
              setTeam1Score(0);
              setTeam2Score(0);
            }}
            variant="ghost"
            size="sm"
          >
            Reset Scores (0-0)
          </Button>
        </div>
      </UICard>

      {/* Developer Resources */}
      <UICard variant="gradient" gradient="primary" size="md">
        <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
          <span>🔧</span> Developer Resources
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() =>
              window.open('https://69291bd0d238365e7e12f66c-nqeyaruzoe.chromatic.com/', '_blank')
            }
            variant="secondary"
            size="md"
          >
            📖 Open Storybook
          </Button>
          <Button
            onClick={() =>
              window.open(
                'https://sentry.io/organizations/marc-3h/issues/?project=4510241709293568',
                '_blank'
              )
            }
            variant="warning"
            size="md"
          >
            🐛 Open Sentry
          </Button>
        </div>
      </UICard>

      {/* Sentry Testing */}
      <UICard variant="gradient" gradient="error" size="md">
        <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
          <span>🚨</span> Sentry Error Tracking Tests
        </h3>
        <p className="text-sm text-gray-300 mb-3">
          Test Sentry error tracking integration for both frontend and backend.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={handleTestFrontendSentry} variant="danger" size="md">
            📱 Test Frontend Sentry
          </Button>
          <Button onClick={handleTestBackendSentry} disabled={!socket} variant="warning" size="md">
            🖥️ Test Backend Sentry
          </Button>
        </div>
        <UICard variant="elevated" size="sm" className="mt-3 !bg-blue-900/30 !border-blue-500">
          <p className="text-xs text-blue-300">
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

      {/* Warning */}
      <UICard variant="gradient" gradient="warning" size="md">
        <p className="text-sm text-yellow-300">
          <strong>⚠️ Warning:</strong> These actions directly modify the game state. Use for testing
          purposes only. Changes affect all connected players.
        </p>
      </UICard>
    </div>
  );
}
