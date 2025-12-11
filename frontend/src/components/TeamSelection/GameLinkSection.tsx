/**
 * GameLinkSection Component
 *
 * Displays the game ID and provides a copy link button.
 * Shows a toast notification when the link is copied.
 */

import { memo, useState, useCallback, RefObject } from 'react';
import { ElegantButton } from '../ui/Button';

interface GameLinkSectionProps {
  /** Game ID to display */
  gameId: string;
  /** Ref for the copy link button (keyboard navigation) */
  copyLinkButtonRef?: RefObject<HTMLButtonElement>;
}

function GameLinkSectionComponent({ gameId, copyLinkButtonRef }: GameLinkSectionProps) {
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCopyGameLink = useCallback(async () => {
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
      // Silently fail
    }
  }, [gameId]);

  return (
    <>
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)] mb-2 font-body">Game ID:</p>
        <div
          className="
            p-3
            rounded-[var(--radius-md)]
            border border-[var(--color-border-default)]
            bg-[var(--color-bg-tertiary)]
          "
        >
          <div data-testid="game-id" className="font-mono text-lg text-center text-skin-accent">
            {gameId}
          </div>
        </div>

        <ElegantButton
          ref={copyLinkButtonRef}
          onClick={handleCopyGameLink}
          size="md"
          fullWidth
          className="mt-3"
          glow
        >
          🔗 Copy Game Link
        </ElegantButton>
      </div>

      {/* Toast Notification */}
      {showCopyToast && (
        <div
          className="
            fixed top-4 left-1/2 transform -translate-x-1/2
            px-6 py-3 rounded-[var(--radius-lg)]
            border-2 animate-bounce z-50
            flex items-center gap-2
            font-display uppercase tracking-wider text-sm
            bg-skin-status-success border-skin-status-success text-skin-inverse
            shadow-[0_0_20px_var(--color-success)]
          "
        >
          <span>✅</span>
          <span>Game link copied!</span>
        </div>
      )}
    </>
  );
}

export const GameLinkSection = memo(GameLinkSectionComponent);
