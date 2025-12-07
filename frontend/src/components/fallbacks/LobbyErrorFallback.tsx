/**
 * LobbyBrowser Fallback Component
 * Sprint 6 Task 6: React Error Boundaries
 *
 * Fallback UI when LobbyBrowser encounters an error
 */

import { Modal, Button } from '../ui';

interface LobbyErrorFallbackProps {
  onClose?: () => void;
}

export function LobbyErrorFallback({ onClose }: LobbyErrorFallbackProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose || (() => window.location.reload())}
      title="Lobby Error"
      icon="🎲"
      theme="red"
      size="sm"
      testId="lobby-error-fallback"
    >
      <div className="text-center">
        <p className="text-skin-secondary mb-6">
          Failed to load the game lobby. The server may be temporarily unavailable.
        </p>
        <div className="space-y-3">
          <Button onClick={onClose || (() => window.location.reload())} variant="primary" fullWidth>
            Close Lobby Browser
          </Button>
          <Button onClick={() => window.location.reload()} variant="secondary" fullWidth>
            Reload Page
          </Button>
        </div>
      </div>
    </Modal>
  );
}
