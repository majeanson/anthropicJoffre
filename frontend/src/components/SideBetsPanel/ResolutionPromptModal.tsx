/**
 * ResolutionPromptModal Component
 * Modal that appears when timing triggers bet resolution
 */

import type { ResolutionPromptState } from './types';

interface ResolutionPromptModalProps {
  prompt: ResolutionPromptState;
  onClaimWin: () => void;
  onDispute: () => void;
  onClose: () => void;
}

export function ResolutionPromptModal({
  prompt,
  onClaimWin,
  onDispute,
  onClose,
}: ResolutionPromptModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />
      <div
        className="relative bg-[var(--color-bg-secondary)] rounded-xl border-2 border-yellow-500/50 shadow-2xl max-w-md w-full p-6 animate-pulse-once"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="text-4xl">⏰</span>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mt-2">
            Time to Resolve Your Bet!
          </h3>
          <p className="text-sm text-yellow-500 mt-1">{prompt.message}</p>
        </div>

        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 mb-4">
          <p className="text-sm text-[var(--color-text-primary)] font-medium">
            "{prompt.bet.customDescription}"
          </p>
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className="text-[var(--color-text-secondary)]">
              {prompt.bet.creatorName} vs {prompt.bet.acceptorName}
            </span>
            <span className="text-yellow-500 font-medium">
              🪙 {prompt.bet.amount * 2} pot
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-[var(--color-text-secondary)] text-center mb-1">
            Did you win this bet?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClaimWin}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
            >
              Claim Win
            </button>
            <button
              onClick={onDispute}
              className="flex-1 py-3 bg-skin-tertiary hover:bg-skin-secondary text-skin-primary font-medium rounded-lg transition-colors"
            >
              Dispute
            </button>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] text-center">
            The other player must confirm your claim
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs"
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  );
}
