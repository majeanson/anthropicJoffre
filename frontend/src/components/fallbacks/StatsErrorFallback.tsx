/**
 * PlayerStatsModal Fallback Component
 * Sprint 6 Task 6: React Error Boundaries
 *
 * Fallback UI when PlayerStatsModal encounters an error
 */

import { Modal, Button } from '../ui';

interface StatsErrorFallbackProps {
  onClose?: () => void;
}

export function StatsErrorFallback({ onClose }: StatsErrorFallbackProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose || (() => window.location.reload())}
      title="Stats Error"
      icon="📊"
      theme="red"
      size="sm"
      testId="stats-error-fallback"
    >
      <div className="text-center">
        <p className="text-gray-300 mb-6">
          Failed to load player statistics. The data may be temporarily unavailable.
        </p>
        <div className="space-y-3">
          <Button onClick={onClose || (() => window.location.reload())} variant="primary" fullWidth>
            Close Stats
          </Button>
          <Button onClick={() => window.location.reload()} variant="secondary" fullWidth>
            Reload Page
          </Button>
        </div>
      </div>
    </Modal>
  );
}
