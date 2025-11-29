/**
 * GameReplay Fallback Component
 * Sprint 6 Task 6: React Error Boundaries
 *
 * Fallback UI when GameReplay encounters an error
 */

import { Modal, Button } from '../ui';

interface ReplayErrorFallbackProps {
  onClose?: () => void;
}

export function ReplayErrorFallback({ onClose }: ReplayErrorFallbackProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose || (() => window.location.reload())}
      title="Replay Error"
      icon="📹"
      theme="red"
      size="sm"
      testId="replay-error-fallback"
    >
      <div className="text-center">
        <p className="text-gray-300 mb-6">
          Failed to load or play the game replay. The replay data may be corrupted or unavailable.
        </p>
        <div className="space-y-3">
          <Button
            onClick={onClose || (() => window.location.reload())}
            variant="primary"
            fullWidth
          >
            Close Replay
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="secondary"
            fullWidth
          >
            Reload Page
          </Button>
        </div>
      </div>
    </Modal>
  );
}
