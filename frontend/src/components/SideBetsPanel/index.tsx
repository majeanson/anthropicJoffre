/**
 * SideBetsPanel Component
 *
 * Displays active side bets and allows players to create/accept bets.
 * Mobile-friendly slide-out panel controlled by header button.
 *
 * Refactored to use sub-components for better maintainability.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  SideBet,
  SideBetCreatedEvent,
  SideBetAcceptedEvent,
  SideBetResolvedEvent,
  SideBetCancelledEvent,
  SideBetDisputedEvent,
  SideBetWinClaimedEvent,
  SideBetsListEvent,
  SideBetPromptResolutionEvent,
} from '../../types/game';
import CreateBetModal from '../CreateBetModal';
import { sounds } from '../../utils/sounds';
import { SideBetsPanelProps, SideBetsPanelTabType, NotificationState, ResolutionPromptState } from './types';
import { OpenBetsSection } from './OpenBetsSection';
import { ActiveBetsSection } from './ActiveBetsSection';
import { HistorySection } from './HistorySection';
import { ResolutionPromptModal } from './ResolutionPromptModal';

export default function SideBetsPanel({
  socket,
  gameId,
  playerName,
  playerTeamId,
  isWithoutTrump = false,
  isSpectator = false,
  isOpen,
  onClose,
  onOpenBetsCountChange,
}: SideBetsPanelProps) {
  const [bets, setBets] = useState<SideBet[]>([]);
  const [balance, setBalance] = useState(100);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<SideBetsPanelTabType>('active');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [resolutionPrompt, setResolutionPrompt] = useState<ResolutionPromptState | null>(null);

  // Close panel/modal on Escape key for accessibility
  useEffect(() => {
    if (!isOpen && !resolutionPrompt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Priority: close resolution prompt first, then main panel
        if (resolutionPrompt) {
          setResolutionPrompt(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, resolutionPrompt]);

  // Fetch bets only when panel is opened
  useEffect(() => {
    if (!socket || !gameId || !isOpen) return;

    socket.emit('get_side_bets', { gameId });
    socket.emit('get_balance', { gameId });
  }, [socket, gameId, isOpen]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleBetsList = ({ bets: newBets }: SideBetsListEvent) => {
      const mappedBets = newBets.map((b) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        acceptedAt: b.acceptedAt ? new Date(b.acceptedAt) : undefined,
        resolvedAt: b.resolvedAt ? new Date(b.resolvedAt) : undefined,
      }));
      setBets(mappedBets);
      // Notify parent of open bets count (bets from others)
      const openCount = mappedBets.filter(
        (b) => b.status === 'open' && b.creatorName !== playerName
      ).length;
      onOpenBetsCountChange?.(openCount);
    };

    const handleBetCreated = ({ bet }: SideBetCreatedEvent) => {
      setBets((prev) => {
        const newBets = [
          {
            ...bet,
            createdAt: new Date(bet.createdAt),
          },
          ...prev,
        ];
        // Update open bets count
        const openCount = newBets.filter(
          (b) => b.status === 'open' && b.creatorName !== playerName
        ).length;
        onOpenBetsCountChange?.(openCount);
        return newBets;
      });
      if (bet.creatorName !== playerName) {
        showNotification(`${bet.creatorName} created a bet for ${bet.amount} coins!`, 'info');
      }
    };

    const handleBetAccepted = ({ betId, acceptorName }: SideBetAcceptedEvent) => {
      setBets((prev) => {
        const newBets = prev.map((b) =>
          b.id === betId
            ? { ...b, acceptorName, status: 'active' as const, acceptedAt: new Date() }
            : b
        );
        // Update open bets count
        const openCount = newBets.filter(
          (b) => b.status === 'open' && b.creatorName !== playerName
        ).length;
        onOpenBetsCountChange?.(openCount);
        return newBets;
      });
      showNotification(`${acceptorName} accepted a bet!`, 'info');
    };

    const handleBetResolved = ({
      betId,
      winnerName,
      loserName,
      coinsAwarded,
      streakBonus,
      winnerStreak,
      streakMultiplier,
    }: SideBetResolvedEvent) => {
      setBets((prev) =>
        prev.map((b) =>
          b.id === betId ? { ...b, status: 'resolved' as const, resolvedAt: new Date() } : b
        )
      );
      const isWinner = winnerName === playerName;
      const isLoser = loserName === playerName;

      // Play sound if player was a participant
      if (isWinner) {
        sounds.sideBetWon();
      } else if (isLoser) {
        sounds.sideBetLost();
      }

      // Build notification message with streak info
      let message: string;
      if (isWinner) {
        message = `You won ${coinsAwarded} coins!`;
        if (streakBonus && streakBonus > 0) {
          message += ` 🔥 ${streakMultiplier}x streak bonus (+${streakBonus})!`;
        }
        if (winnerStreak && winnerStreak >= 3) {
          message += ` Win streak: ${winnerStreak}`;
        }
      } else if (isLoser) {
        message = `You lost! ${winnerName} won ${coinsAwarded} coins`;
      } else {
        message = `${winnerName} won ${coinsAwarded} coins`;
        if (winnerStreak && winnerStreak >= 3) {
          message += ` (${winnerStreak} win streak!)`;
        }
      }

      showNotification(message, isWinner ? 'success' : 'info');
    };

    const handleBetCancelled = ({ betId }: SideBetCancelledEvent) => {
      setBets((prev) => {
        const newBets = prev.map((b) =>
          b.id === betId ? { ...b, status: 'cancelled' as const } : b
        );
        // Update open bets count
        const openCount = newBets.filter(
          (b) => b.status === 'open' && b.creatorName !== playerName
        ).length;
        onOpenBetsCountChange?.(openCount);
        return newBets;
      });
    };

    const handleBetDisputed = ({ betId, refundAmount }: SideBetDisputedEvent) => {
      setBets((prev) =>
        prev.map((b) => (b.id === betId ? { ...b, status: 'disputed' as const } : b))
      );
      showNotification(`Bet disputed - ${refundAmount} coins refunded to both`, 'info');
    };

    const handleWinClaimed = ({ betId, claimedBy, bet }: SideBetWinClaimedEvent) => {
      // Update the bet status
      setBets((prev) =>
        prev.map((b) =>
          b.id === betId
            ? { ...b, status: 'pending_resolution' as const, claimedWinner: claimedBy }
            : b
        )
      );
      // Notify the other party
      const isOtherParty =
        (bet.creatorName === playerName || bet.acceptorName === playerName) &&
        claimedBy !== playerName;
      if (isOtherParty) {
        showNotification(`${claimedBy} claims they won! Please confirm or dispute.`, 'info');
        sounds.chatNotification();
      }
    };

    const handleBalanceUpdated = ({ balance: newBalance }: { balance: number }) => {
      setBalance(newBalance);
    };

    const handlePromptResolution = ({ bet, timing, message }: SideBetPromptResolutionEvent) => {
      // Only show prompt if player is a participant
      const isParticipant = bet.creatorName === playerName || bet.acceptorName === playerName;
      if (isParticipant) {
        setResolutionPrompt({ bet, timing, message });
        sounds.chatNotification();
      }
    };

    socket.on('side_bets_list', handleBetsList);
    socket.on('side_bet_created', handleBetCreated);
    socket.on('side_bet_accepted', handleBetAccepted);
    socket.on('side_bet_resolved', handleBetResolved);
    socket.on('side_bet_cancelled', handleBetCancelled);
    socket.on('side_bet_disputed', handleBetDisputed);
    socket.on('side_bet_win_claimed', handleWinClaimed);
    socket.on('balance_updated', handleBalanceUpdated);
    socket.on('side_bet_prompt_resolution', handlePromptResolution);

    return () => {
      socket.off('side_bets_list', handleBetsList);
      socket.off('side_bet_created', handleBetCreated);
      socket.off('side_bet_accepted', handleBetAccepted);
      socket.off('side_bet_resolved', handleBetResolved);
      socket.off('side_bet_cancelled', handleBetCancelled);
      socket.off('side_bet_disputed', handleBetDisputed);
      socket.off('side_bet_win_claimed', handleWinClaimed);
      socket.off('balance_updated', handleBalanceUpdated);
      socket.off('side_bet_prompt_resolution', handlePromptResolution);
    };
  }, [socket, playerName, onOpenBetsCountChange]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleAcceptBet = useCallback(
    (betId: number) => {
      if (!socket) return;
      socket.emit('accept_side_bet', { gameId, betId });
    },
    [socket, gameId]
  );

  const handleCancelBet = useCallback(
    (betId: number) => {
      if (!socket) return;
      socket.emit('cancel_side_bet', { gameId, betId });
    },
    [socket, gameId]
  );

  const handleClaimWin = useCallback(
    (betId: number) => {
      if (!socket) return;
      socket.emit('claim_bet_win', { gameId, betId });
    },
    [socket, gameId]
  );

  const handleConfirmResolution = useCallback(
    (betId: number, confirmed: boolean) => {
      if (!socket) return;
      socket.emit('confirm_bet_resolution', { gameId, betId, confirmed });
    },
    [socket, gameId]
  );

  const handleDisputeBet = useCallback(
    (betId: number) => {
      if (!socket) return;
      socket.emit('dispute_bet', { gameId, betId });
    },
    [socket, gameId]
  );

  // Filter bets by status
  const openBets = bets.filter((b) => b.status === 'open' && b.creatorName !== playerName);
  const myOpenBets = bets.filter((b) => b.status === 'open' && b.creatorName === playerName);
  const activeBets = bets.filter((b) => b.status === 'active' || b.status === 'pending_resolution');
  const resolvedBets = bets.filter(
    (b) => b.status === 'resolved' || b.status === 'disputed' || b.status === 'cancelled'
  );

  // Handle prompt resolution action - now uses claim flow
  const handlePromptClaimWin = useCallback(() => {
    if (!resolutionPrompt) return;
    handleClaimWin(resolutionPrompt.bet.id);
    setResolutionPrompt(null);
  }, [resolutionPrompt, handleClaimWin]);

  const handlePromptDispute = useCallback(() => {
    if (!resolutionPrompt) return;
    handleDisputeBet(resolutionPrompt.bet.id);
    setResolutionPrompt(null);
  }, [resolutionPrompt, handleDisputeBet]);

  return (
    <>
      {/* Side panel - fully opaque */}
      <div
        className={`fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-default)] shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)] bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <h2 className="font-bold text-[var(--color-text-primary)]">Side Bets</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-yellow-500 font-medium">
              <span>🪙</span>
              <span>{balance}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-default)]">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'active'
                ? 'text-yellow-500 border-b-2 border-yellow-500'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-yellow-500 border-b-2 border-yellow-500'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-10rem)] overflow-y-auto p-4 space-y-4">
          {/* Notification */}
          {notification && (
            <div
              className={`p-3 rounded-lg text-sm ${
                notification.type === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : notification.type === 'error'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Active Tab Content */}
          {activeTab === 'active' && (
            <>
              <OpenBetsSection
                openBets={openBets}
                myOpenBets={myOpenBets}
                playerName={playerName}
                playerTeamId={playerTeamId}
                isSpectator={isSpectator}
                balance={balance}
                onAccept={handleAcceptBet}
                onCancel={handleCancelBet}
              />

              <ActiveBetsSection
                activeBets={activeBets}
                playerName={playerName}
                playerTeamId={playerTeamId}
                isSpectator={isSpectator}
                onClaimWin={handleClaimWin}
                onDispute={handleDisputeBet}
                onConfirmResolution={handleConfirmResolution}
              />

              {/* Empty state for active tab */}
              {openBets.length === 0 && myOpenBets.length === 0 && activeBets.length === 0 && (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <span className="text-4xl mb-2 block">🎲</span>
                  <p className="text-sm">No active bets</p>
                  <p className="text-xs mt-1">Create a bet to get started!</p>
                </div>
              )}
            </>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <HistorySection
              resolvedBets={resolvedBets}
              playerName={playerName}
              playerTeamId={playerTeamId}
              isSpectator={isSpectator}
            />
          )}
        </div>

        {/* Footer - Create bet button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-medium rounded-lg transition-all shadow-lg"
          >
            Create Bet
          </button>
        </div>
      </div>

      {/* Create Bet Modal */}
      {showCreateModal && (
        <CreateBetModal
          socket={socket}
          gameId={gameId}
          playerName={playerName}
          playerTeamId={playerTeamId}
          isWithoutTrump={isWithoutTrump}
          isSpectator={isSpectator}
          balance={balance}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Resolution Prompt Modal - appears when timing triggers */}
      {resolutionPrompt && (
        <ResolutionPromptModal
          prompt={resolutionPrompt}
          onClaimWin={handlePromptClaimWin}
          onDispute={handlePromptDispute}
          onClose={() => setResolutionPrompt(null)}
        />
      )}

      {/* Overlay when panel is open - reduced opacity, keyboard handled by Escape listener */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
          role="presentation"
          aria-hidden="true"
        />
      )}
    </>
  );
}

// Re-export types
export type { SideBetsPanelProps, SideBetsPanelTabType } from './types';
