/**
 * Swap Confirmation Modal
 *
 * Displays a confirmation dialog when another player requests to swap positions.
 * Shows who wants to swap and warns if the swap will change teams.
 * Auto-dismisses after 30 seconds (treated as rejection).
 */

import { useEffect, useState } from 'react';

interface SwapConfirmationModalProps {
  isOpen: boolean;
  fromPlayerName: string;
  willChangeTeams: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export function SwapConfirmationModal({
  isOpen,
  fromPlayerName,
  willChangeTeams,
  onAccept,
  onReject
}: SwapConfirmationModalProps) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(30);
      return;
    }

    // Auto-reject after 30 seconds
    const autoRejectTimer = setTimeout(() => {
      onReject();
    }, 30000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(autoRejectTimer);
      clearInterval(countdownInterval);
    };
  }, [isOpen, onReject]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onReject}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🔄</span>
            <span>Swap Request</span>
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {timeLeft}s
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-800 dark:text-gray-200">
            <span className="font-semibold">{fromPlayerName}</span> wants to swap positions with you.
          </p>

          {willChangeTeams && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Warning: Team Change
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    This swap will change your team!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>• Your position and turn order will be swapped</p>
            <p>• Your cards and game progress will be preserved</p>
            {willChangeTeams && (
              <p>• Your team will change due to the new position</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onReject}
            className="flex-1 px-4 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-semibold transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg"
          >
            Accept Swap
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
          Auto-rejects in {timeLeft} seconds
        </p>
      </div>
    </div>
  );
}
