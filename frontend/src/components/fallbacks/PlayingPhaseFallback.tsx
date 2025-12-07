/**
 * PlayingPhase Fallback Component
 * Sprint 6 Task 6: React Error Boundaries
 *
 * Fallback UI when PlayingPhase encounters an error
 */

import { UICard, Button } from '../ui';

export function PlayingPhaseFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-skin-primary to-skin-secondary flex items-center justify-center p-4">
      <UICard variant="elevated" size="lg" className="border-2 border-red-500 max-w-md text-center">
        <div className="text-6xl mb-4">🎮</div>
        <h2 className="text-2xl font-bold text-skin-primary mb-4">Game Error</h2>
        <p className="text-skin-secondary mb-6">
          Something went wrong during gameplay. Your game state should be preserved.
        </p>
        <div className="space-y-3">
          <Button onClick={() => window.location.reload()} variant="success" fullWidth>
            Reload Game
          </Button>
          <Button onClick={() => window.history.back()} variant="secondary" fullWidth>
            Return to Lobby
          </Button>
        </div>
        <p className="text-xs text-skin-muted mt-4">
          If this persists, please refresh the page or contact support
        </p>
      </UICard>
    </div>
  );
}
