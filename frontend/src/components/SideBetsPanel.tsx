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
  SideBetWinClaimedEvent,
  SideBetsListEvent,
  SideBetPromptResolutionEvent,
} from '../types/game';
import CreateBetModal from './CreateBetModal';
import { sounds } from '../utils/sounds';

interface SideBetsPanelProps {
  socket: Socket | null;
  gameId: string;
  playerName: string;
  playerTeamId: 1 | 2;
  isWithoutTrump?: boolean;
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

// Resolution timing labels
const RESOLUTION_TIMING_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  trick: { label: 'After Trick', icon: '⚡', color: 'text-blue-400' },
  round: { label: 'End of Round', icon: '🔄', color: 'text-purple-400' },
  game: { label: 'End of Game', icon: '🏁', color: 'text-orange-400' },
  manual: { label: 'Manual', icon: '👆', color: 'text-gray-400' },
};

// Helper to format team prediction relative to viewer
const formatTeamPrediction = (prediction: string | undefined, viewerTeamId: 1 | 2, isSpectator: boolean = false): string => {
  if (!prediction) return '';
  if (prediction === 'true') return 'Yes';
  if (prediction === 'false') return 'No';
  if (isSpectator) {
    // Spectators see Team 1/Team 2
    if (prediction === 'team1') return 'Team 1';
    if (prediction === 'team2') return 'Team 2';
  } else {
    // Players see My Team/Their Team
    if (prediction === 'team1') return viewerTeamId === 1 ? 'My Team' : 'Their Team';
    if (prediction === 'team2') return viewerTeamId === 2 ? 'My Team' : 'Their Team';
  }
  return prediction;
};

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
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [resolutionPrompt, setResolutionPrompt] = useState<{
    bet: SideBet;
    timing: string;
    message: string;
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
      loserName,
      coinsAwarded,
      streakBonus,
      winnerStreak,
      streakMultiplier,
    }: SideBetResolvedEvent) => {
      setBets(prev =>
        prev.map(b =>
          b.id === betId
            ? { ...b, status: 'resolved' as const, resolvedAt: new Date() }
            : b
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

    const handleWinClaimed = ({ betId, claimedBy, bet }: SideBetWinClaimedEvent) => {
      // Update the bet status
      setBets(prev =>
        prev.map(b =>
          b.id === betId ? { ...b, status: 'pending_resolution' as const, claimedWinner: claimedBy } : b
        )
      );
      // Notify the other party
      const isOtherParty = (bet.creatorName === playerName || bet.acceptorName === playerName) && claimedBy !== playerName;
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

  const handleAcceptBet = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('accept_side_bet', { gameId, betId });
  }, [socket, gameId]);

  const handleCancelBet = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('cancel_side_bet', { gameId, betId });
  }, [socket, gameId]);

  const handleClaimWin = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('claim_bet_win', { gameId, betId });
  }, [socket, gameId]);

  const handleConfirmResolution = useCallback((betId: number, confirmed: boolean) => {
    if (!socket) return;
    socket.emit('confirm_bet_resolution', { gameId, betId, confirmed });
  }, [socket, gameId]);

  const handleDisputeBet = useCallback((betId: number) => {
    if (!socket) return;
    socket.emit('dispute_bet', { gameId, betId });
  }, [socket, gameId]);

  // Filter bets by status
  const openBets = bets.filter(b => b.status === 'open' && b.creatorName !== playerName);
  const myOpenBets = bets.filter(b => b.status === 'open' && b.creatorName === playerName);
  const activeBets = bets.filter(b => b.status === 'active' || b.status === 'pending_resolution');
  const resolvedBets = bets.filter(b => b.status === 'resolved' || b.status === 'disputed' || b.status === 'cancelled');

  // Get bet description with context
  const getBetDescription = (bet: SideBet): string => {
    if (bet.betType === 'custom') {
      return bet.customDescription || 'Custom bet';
    }
    return PRESET_LABELS[bet.presetType || ''] || bet.presetType || 'Preset bet';
  };

  // Get resolution timing badge for custom bets
  const getResolutionTimingBadge = (bet: SideBet) => {
    if (bet.betType !== 'custom' || !bet.resolutionTiming) return null;
    const timing = RESOLUTION_TIMING_LABELS[bet.resolutionTiming];
    if (!timing) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${timing.color}`}>
        <span>{timing.icon}</span>
        <span>{timing.label}</span>
        {bet.resolutionTiming === 'trick' && bet.trickNumber && (
          <span className="text-[var(--color-text-secondary)]">(Trick {bet.trickNumber})</span>
        )}
        {bet.resolutionTiming === 'round' && bet.roundNumber && (
          <span className="text-[var(--color-text-secondary)]">(R{bet.roundNumber})</span>
        )}
      </span>
    );
  };

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
                    <p className="text-sm text-[var(--color-text-primary)] mb-1">
                      {getBetDescription(bet)}
                    </p>
                    {bet.prediction && (
                      <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                        {bet.creatorName} bets: <span className="text-[var(--color-text-primary)] font-medium">{formatTeamPrediction(bet.prediction, playerTeamId, isSpectator)}</span>
                      </p>
                    )}
                    <button
                      onClick={() => handleAcceptBet(bet.id)}
                      disabled={balance < bet.amount}
                      className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                    >
                      {balance < bet.amount ? 'Not enough coins' : 'Accept Bet (opposite side)'}
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
                    <p className="text-sm text-[var(--color-text-primary)] mb-1">
                      {getBetDescription(bet)}
                    </p>
                    {bet.prediction && (
                      <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                        Your bet: <span className="text-yellow-400 font-medium">{formatTeamPrediction(bet.prediction, playerTeamId, isSpectator)}</span>
                      </p>
                    )}
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
                  const isCreator = bet.creatorName === playerName;
                  const creatorPrediction = formatTeamPrediction(bet.prediction, playerTeamId, isSpectator);

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
                      <p className="text-sm text-[var(--color-text-primary)] mb-1">
                        {getBetDescription(bet)}
                      </p>
                      {/* Resolution timing badge for custom bets */}
                      {getResolutionTimingBadge(bet) && (
                        <div className="mb-2">
                          {getResolutionTimingBadge(bet)}
                        </div>
                      )}
                      {bet.prediction && isParticipant && (
                        <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                          {isCreator ? (
                            <>You bet: <span className="text-green-400 font-medium">{creatorPrediction}</span></>
                          ) : (
                            <>You bet against: <span className="text-purple-400 font-medium">{creatorPrediction}</span></>
                          )}
                        </p>
                      )}

                      {/* Manual resolution for custom bets */}
                      {isCustom && isParticipant && bet.status === 'active' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleClaimWin(bet.id)}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                          >
                            Claim Win
                          </button>
                          <button
                            onClick={() => handleDisputeBet(bet.id)}
                            className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                          >
                            Dispute
                          </button>
                        </div>
                      )}

                      {/* Pending resolution - waiting for confirmation */}
                      {isCustom && bet.status === 'pending_resolution' && (
                        <div className="mt-2">
                          {bet.claimedWinner === playerName ? (
                            <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                              Waiting for {bet.claimedWinner === bet.creatorName ? bet.acceptorName : bet.creatorName} to confirm...
                            </div>
                          ) : isParticipant ? (
                            <div className="space-y-2">
                              <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                                {bet.claimedWinner} claims they won!
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleConfirmResolution(bet.id, true)}
                                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleConfirmResolution(bet.id, false)}
                                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                                >
                                  Dispute
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                              {bet.claimedWinner} claims win - awaiting confirmation
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
            <>
              {resolvedBets.length > 0 ? (
                <div className="space-y-2">
                  {resolvedBets.map(bet => {
                    const isWinner = bet.status === 'resolved' &&
                      ((bet.result === true && bet.creatorName === playerName) ||
                       (bet.result === false && bet.acceptorName === playerName));
                    const isLoser = bet.status === 'resolved' &&
                      ((bet.result === true && bet.acceptorName === playerName) ||
                       (bet.result === false && bet.creatorName === playerName));
                    const wasParticipant = bet.creatorName === playerName || bet.acceptorName === playerName;

                    return (
                      <div
                        key={bet.id}
                        className={`p-3 bg-[var(--color-bg-tertiary)] rounded-lg border ${
                          isWinner
                            ? 'border-green-500/50'
                            : isLoser
                            ? 'border-red-500/50'
                            : bet.status === 'disputed'
                            ? 'border-gray-500/50'
                            : bet.status === 'cancelled'
                            ? 'border-yellow-500/30'
                            : 'border-[var(--color-border-default)]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm text-[var(--color-text-primary)]">
                            {getBetDescription(bet)}
                          </span>
                          <span className="text-yellow-500 font-medium text-sm">
                            🪙 {bet.status === 'cancelled' ? bet.amount : bet.amount * 2}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {bet.creatorName} vs {bet.acceptorName || '?'}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              bet.status === 'disputed'
                                ? 'text-gray-400'
                                : bet.status === 'cancelled'
                                ? 'text-yellow-400'
                                : isWinner
                                ? 'text-green-400'
                                : isLoser
                                ? 'text-red-400'
                                : 'text-blue-400'
                            }`}
                          >
                            {bet.status === 'disputed'
                              ? 'Disputed (Refunded)'
                              : bet.status === 'cancelled'
                              ? 'Cancelled'
                              : wasParticipant
                              ? isWinner
                                ? `+${bet.amount * 2} (Won)`
                                : `-${bet.amount} (Lost)`
                              : 'Resolved'}
                          </span>
                        </div>
                        {bet.resolvedAt && (
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1 opacity-75">
                            {new Date(bet.resolvedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <span className="text-4xl mb-2 block">📜</span>
                  <p className="text-sm">No bet history</p>
                  <p className="text-xs mt-1">Completed bets will appear here</p>
                </div>
              )}
            </>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setResolutionPrompt(null)}
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
              <p className="text-sm text-yellow-500 mt-1">
                {resolutionPrompt.message}
              </p>
            </div>

            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 mb-4">
              <p className="text-sm text-[var(--color-text-primary)] font-medium">
                "{resolutionPrompt.bet.customDescription}"
              </p>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-[var(--color-text-secondary)]">
                  {resolutionPrompt.bet.creatorName} vs {resolutionPrompt.bet.acceptorName}
                </span>
                <span className="text-yellow-500 font-medium">
                  🪙 {resolutionPrompt.bet.amount * 2} pot
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-[var(--color-text-secondary)] text-center mb-1">
                Did you win this bet?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePromptClaimWin}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                >
                  Claim Win
                </button>
                <button
                  onClick={handlePromptDispute}
                  className="flex-1 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
                >
                  Dispute
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] text-center">
                The other player must confirm your claim
              </p>
              <button
                onClick={() => setResolutionPrompt(null)}
                className="w-full py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs"
              >
                Decide Later
              </button>
            </div>
          </div>
        </div>
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
