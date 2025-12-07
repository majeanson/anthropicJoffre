/**
 * Swap Confirmation Modal
 *
 * Displays a confirmation dialog when another player requests to swap positions.
 * Shows who wants to swap and warns if the swap will change teams.
 * Auto-dismisses after 30 seconds (treated as rejection).
 */

import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

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
  onReject,
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
      setTimeLeft((prev) => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onReject}
      title="Swap Request"
      subtitle={`${timeLeft}s remaining`}
      icon="🔄"
      theme="blue"
      size="sm"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={onReject}>
            Reject
          </Button>
          <Button variant="primary" onClick={onAccept}>
            Accept Swap
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-gray-800 dark:text-gray-200">
          <span className="font-semibold">{fromPlayerName}</span> wants to swap positions with you.
        </p>

        {willChangeTeams && (
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 border-2 border-orange-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-xl" aria-hidden="true">
                ⚠️
              </span>
              <div className="flex-1">
                <p className="font-semibold text-white">Warning: Team Change</p>
                <p className="text-sm text-white/90">This swap will change your team!</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>• Your position and turn order will be swapped</p>
          <p>• Your cards and game progress will be preserved</p>
          {willChangeTeams && <p>• Your team will change due to the new position</p>}
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
          Auto-rejects in {timeLeft} seconds
        </p>
      </div>
    </Modal>
  );
}
