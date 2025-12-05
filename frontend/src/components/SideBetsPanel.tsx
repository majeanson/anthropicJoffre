/**
 * Side Bets Panel Component
 *
 * Displays active side bets and allows players to create/accept bets.
 * Mobile-friendly slide-out panel controlled by header button.
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type {
  SideBet,
  SideBetCreatedEvent,
  SideBetAcceptedEvent,
  SideBetResolvedEvent,
  SideBetCancelledEvent,
  SideBetDisputedEvent,
  SideBetsListEvent,
} from '../types/game';
import CreateBetModal from './CreateBetModal';

interface SideBetsPanelProps {
  socket: Socket | null;
  gameId: string;
  playerName: string;
  isSpectator?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenBetsCountChange?: (count: number) => void;
}

// Preset bet type labels for display
const PRESET_LABELS: Record<string, string> = {
  red_zero_winner: 'Red 0 Winner',
  brown_zero_victim: 'Brown 0 Victim',
  tricks_over_under: 'Tricks Over/Under',
  team_score_over_under: 'Score Over/Under',
  bet_made: 'Bet Made',
  without_trump_success: 'Without Trump',
  first_trump_played: 'First Trump',
};

export default function SideBetsPanel({
  socket,
  gameId,
  playerName,
  isSpectator: _isSpectator = false,
  isOpen,
  onClose,
  onOpenBetsCountChange,
}: SideBetsPanelProps) {
  void _isSpectator; // Reserved for future spectator-specific features
  const [bets, setBets] = useState<SideBet[]>([]);
  const [balance, setBalance] = useState(100);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

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
      const mappedBets = newBets.map(b => ({
        ...b,
        createdAt: new Date(b.createdAt),
        acceptedAt: b.acceptedAt ? new Date(b.acceptedAt) : undefined,
        resolvedAt: b.resolvedAt ? new Date(b.resolvedAt) : undefined,
      }));
      setBets(mappedBets);
      // Notify parent of open bets count (bets from others)
      const openCount = mappedBets.filter(b => b.status === 'open' && b.creatorName !== playerName).length;
      onOpenBetsCountChange?.(openCount);
    };

    const handleBetCreated = ({ bet }: SideBetCreatedEvent) => {
      setBets(prev => {
        const newBets = [{
          ...bet,
          createdAt: new Date(bet.createdAt),
        }, ...prev];
        // Update open bets count
        const openCount = newBets.filter(b => b.status === 'open' && b.creatorName !== playerName).length;
        onOpenBetsCountChange?.(openCount);
        return newBets;
      });
      if (bet.creatorName !== playerName) {
        showNotification(`${bet.creatorName} created a bet for ${bet.amount} coins!`, 'info');
      }
    };

    const handleBetAccepted = ({ betId, acceptorName }: SideBetAcceptedEvent) => {
      setBets(prev => {
        const newBets = prev.map(b =>
          b.id === betId
            ? { ...b, acceptorName, status: 'active' as const, acceptedAt: new Date() }
            : b
        );
        // Update open bets count
        const openCount = newBets.filter(b => b.status === 'open' && b.creatorName !== playerName).length;
        onOpenBetsCountChange?.(openCount);
        return newBets;
      });
      showNotification(`${acceptorName} accepted a bet!`, 'info');
    };

    const handleBetResolved = ({
      betId,
      winnerName,
      coinsAwarded,
    }: SideBetResolvedEvent) => {
      setBets(prev =>
        prev.map(b =>
          b.id === betId
            ? { ...b, status: 'resolved' as const, resolvedAt: new Date() }
            : b
        )
      );
      const isWinner = winnerName === playerName;
      showNotification(
        isWinner
          ? `You won ${coinsAwarded} coins!`
          : `${winnerName} won ${coinsAwarded} coins`,
        isWinner ? 'success' : 'info'
      );
    };

    const handleBetCancelled = ({ betId }: SideBetCancelledEvent) => {
      setBets(prev => {
        const newBets = prev.map(b =>
          b.id === betId ? { ...b, status: 'cancelled' as const } : b
        );
        // Update open bets count
        const openCount = newBets.filter(b => b.status === 'open' && b.creatorName !== playerName).length;
        onOpenBetsCountChange?.(openCount);
        return newBets;
      });
    };

    const handleBetDisputed = ({ betId, refundAmount }: SideBetDisputedEvent) => {
      setBets(prev =>
        prev.map(b =>
          b.id === betId ? { ...b, status: 'disputed' as const } : b
        )
      );
      showNotification(`Bet disputed - ${refundAmount} coins refunded to both`, 'info');
    };

    const handleBalanceUpdated = ({ balance: newBalance }: { balance: number }) => {
      setBalance(newBalance);
    };

    socket.on('side_bets_list', handleBetsList);
    socket.on('side_bet_created', handleBetCreated);
    socket.on('side_bet_accepted', handleBetAccepted);
    socket.on('side_bet_resolved', handleBetResolved);
    socket.on('side_bet_cancelled', handleBetCancelled);
    socket.on('side_bet_disputed', handleBetDisputed);
    socket.on('balance_updated', handleBalanceUpdated);

    return () => {
      socket.off('side_bets_list', handleBetsList);
      socket.off('side_bet_created', handleBetCreated);
      socket.off('side_bet_accepted', handleBetAccepted);
      socket.off('side_bet_resolved', handleBetResolved);
      socket.off('side_bet_cancelled', handleBetCancelled);
      socket.off('side_bet_disputed', handleBetDisputed);
      socket.off('balance_updated', handleBalanceUpdated);
    };
  }, [socket, playerName, onOpenBetsCountChange]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleAcceptBet = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('accept_side_bet', { gameId, betId });
  }, [socket, gameId]);

  const handleCancelBet = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('cancel_side_bet', { gameId, betId });
  }, [socket, gameId]);

  const handleResolveBet = useCallback((betId: number, creatorWon: boolean) => {
    if (!socket) return;
    socket.emit('resolve_custom_bet', { gameId, betId, creatorWon });
  }, [socket, gameId]);

  const handleDisputeBet = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('dispute_bet', { gameId, betId });
  }, [socket, gameId]);

  // Filter bets by status
  const openBets = bets.filter(b => b.status === 'open' && b.creatorName !== playerName);
  const myOpenBets = bets.filter(b => b.status === 'open' && b.creatorName === playerName);
  const activeBets = bets.filter(b => b.status === 'active');
  const resolvedBets = bets.filter(b => b.status === 'resolved' || b.status === 'disputed');

  const getBetDescription = (bet: SideBet): string => {
    if (bet.betType === 'custom') {
      return bet.customDescription || 'Custom bet';
    }
    return PRESET_LABELS[bet.presetType || ''] || bet.presetType || 'Preset bet';
  };

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

        {/* Content */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto p-4 space-y-4">
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

          {/* Open bets to accept */}
          {openBets.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Open Bets ({openBets.length})
              </h3>
              <div className="space-y-2">
                {openBets.map(bet => (
                  <div
                    key={bet.id}
                    className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-default)]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {bet.creatorName}
                      </span>
                      <span className="text-yellow-500 font-medium">
                        🪙 {bet.amount}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-primary)] mb-2">
                      {getBetDescription(bet)}
                    </p>
                    {bet.prediction && (
                      <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                        Prediction: {bet.prediction}
                      </p>
                    )}
                    <button
                      onClick={() => handleAcceptBet(bet.id)}
                      disabled={balance < bet.amount}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      {balance < bet.amount ? 'Not enough coins' : 'Accept Bet'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My open bets */}
          {myOpenBets.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Your Open Bets ({myOpenBets.length})
              </h3>
              <div className="space-y-2">
                {myOpenBets.map(bet => (
                  <div
                    key={bet.id}
                    className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-yellow-500/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-yellow-500">
                        Waiting for opponent...
                      </span>
                      <span className="text-yellow-500 font-medium">
                        🪙 {bet.amount}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-primary)] mb-2">
                      {getBetDescription(bet)}
                    </p>
                    <button
                      onClick={() => handleCancelBet(bet.id)}
                      className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded border border-red-500/30 transition-colors"
                    >
                      Cancel Bet
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active bets */}
          {activeBets.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Active Bets ({activeBets.length})
              </h3>
              <div className="space-y-2">
                {activeBets.map(bet => {
                  const isParticipant =
                    bet.creatorName === playerName || bet.acceptorName === playerName;
                  const isCustom = bet.betType === 'custom';

                  return (
                    <div
                      key={bet.id}
                      className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-green-500/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-green-400">
                          {bet.creatorName} vs {bet.acceptorName}
                        </span>
                        <span className="text-yellow-500 font-medium">
                          🪙 {bet.amount * 2}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--color-text-primary)] mb-2">
                        {getBetDescription(bet)}
                      </p>

                      {/* Manual resolution for custom bets */}
                      {isCustom && isParticipant && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() =>
                              handleResolveBet(bet.id, bet.creatorName === playerName)
                            }
                            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                          >
                            I Won
                          </button>
                          <button
                            onClick={() =>
                              handleResolveBet(bet.id, bet.creatorName !== playerName)
                            }
                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                          >
                            I Lost
                          </button>
                          <button
                            onClick={() => handleDisputeBet(bet.id)}
                            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent resolved */}
          {resolvedBets.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Recent Results
              </h3>
              <div className="space-y-2">
                {resolvedBets.slice(0, 5).map(bet => (
                  <div
                    key={bet.id}
                    className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-default)] opacity-75"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {getBetDescription(bet)}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          bet.status === 'disputed' ? 'text-gray-400' : 'text-green-400'
                        }`}
                      >
                        {bet.status === 'disputed' ? 'Refunded' : 'Resolved'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {bets.length === 0 && (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <span className="text-4xl mb-2 block">🎲</span>
              <p className="text-sm">No bets yet</p>
              <p className="text-xs mt-1">Create a bet to get started!</p>
            </div>
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
          balance={balance}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Overlay when panel is open - reduced opacity */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
    </>
  );
}
