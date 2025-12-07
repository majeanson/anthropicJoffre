/**
 * BetCard Component
 * Displays a single bet with appropriate actions based on variant
 */

import type { SideBet } from '../../types/game';
import { formatTeamPrediction, getBetDescription, getResolutionTimingInfo } from './utils';

interface BetCardProps {
  bet: SideBet;
  playerName: string;
  playerTeamId: 1 | 2;
  isSpectator: boolean;
  onAccept?: (betId: number) => void;
  onCancel?: (betId: number) => void;
  onClaimWin?: (betId: number) => void;
  onDispute?: (betId: number) => void;
  onConfirmResolution?: (betId: number, confirmed: boolean) => void;
  balance?: number;
  variant: 'open' | 'myOpen' | 'active' | 'history';
}

export function BetCard({
  bet,
  playerName,
  playerTeamId,
  isSpectator,
  onAccept,
  onCancel,
  onClaimWin,
  onDispute,
  onConfirmResolution,
  balance = 0,
  variant,
}: BetCardProps) {
  const isParticipant = bet.creatorName === playerName || bet.acceptorName === playerName;
  const isCustom = bet.betType === 'custom';
  const isCreator = bet.creatorName === playerName;
  const creatorPrediction = formatTeamPrediction(bet.prediction, playerTeamId, isSpectator);
  const timingInfo = getResolutionTimingInfo(bet);

  // Resolution timing badge
  const ResolutionTimingBadge = () => {
    if (!timingInfo) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${timingInfo.color}`}>
        <span>{timingInfo.icon}</span>
        <span>{timingInfo.label}</span>
        {timingInfo.trickNumber && (
          <span className="text-[var(--color-text-secondary)]">(Trick {timingInfo.trickNumber})</span>
        )}
        {timingInfo.roundNumber && (
          <span className="text-[var(--color-text-secondary)]">(R{timingInfo.roundNumber})</span>
        )}
      </span>
    );
  };

  // Open bet from another player
  if (variant === 'open') {
    return (
      <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-default)]">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-[var(--color-text-secondary)]">{bet.creatorName}</span>
          <span className="text-yellow-500 font-medium">🪙 {bet.amount}</span>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] mb-1">{getBetDescription(bet)}</p>
        {bet.prediction && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            {bet.creatorName} bets:{' '}
            <span className="text-[var(--color-text-primary)] font-medium">
              {formatTeamPrediction(bet.prediction, playerTeamId, isSpectator)}
            </span>
          </p>
        )}
        <button
          onClick={() => onAccept?.(bet.id)}
          disabled={balance < bet.amount}
          className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-skin-tertiary disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
        >
          {balance < bet.amount ? 'Not enough coins' : 'Accept Bet (opposite side)'}
        </button>
      </div>
    );
  }

  // My open bet waiting for opponent
  if (variant === 'myOpen') {
    return (
      <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-yellow-500/30">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-yellow-500">Waiting for opponent...</span>
          <span className="text-yellow-500 font-medium">🪙 {bet.amount}</span>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] mb-1">{getBetDescription(bet)}</p>
        {bet.prediction && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            Your bet:{' '}
            <span className="text-yellow-400 font-medium">
              {formatTeamPrediction(bet.prediction, playerTeamId, isSpectator)}
            </span>
          </p>
        )}
        <button
          onClick={() => onCancel?.(bet.id)}
          className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded border border-red-500/30 transition-colors"
        >
          Cancel Bet
        </button>
      </div>
    );
  }

  // Active bet
  if (variant === 'active') {
    return (
      <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-green-500/30">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs text-green-400">
            {bet.creatorName} vs {bet.acceptorName}
          </span>
          <span className="text-yellow-500 font-medium">🪙 {bet.amount * 2}</span>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] mb-1">{getBetDescription(bet)}</p>

        {/* Resolution timing badge for custom bets */}
        {timingInfo && (
          <div className="mb-2">
            <ResolutionTimingBadge />
          </div>
        )}

        {bet.prediction && isParticipant && (
          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            {isCreator ? (
              <>
                You bet:{' '}
                <span className="text-green-400 font-medium">{creatorPrediction}</span>
              </>
            ) : (
              <>
                You bet against:{' '}
                <span className="text-purple-400 font-medium">{creatorPrediction}</span>
              </>
            )}
          </p>
        )}

        {/* Manual resolution for custom bets */}
        {isCustom && isParticipant && bet.status === 'active' && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onClaimWin?.(bet.id)}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
            >
              Claim Win
            </button>
            <button
              onClick={() => onDispute?.(bet.id)}
              className="flex-1 py-2 bg-skin-tertiary hover:bg-skin-secondary text-skin-primary text-xs rounded transition-colors"
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
                Waiting for{' '}
                {bet.claimedWinner === bet.creatorName ? bet.acceptorName : bet.creatorName} to
                confirm...
              </div>
            ) : isParticipant ? (
              <div className="space-y-2">
                <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                  {bet.claimedWinner} claims they won!
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onConfirmResolution?.(bet.id, true)}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => onConfirmResolution?.(bet.id, false)}
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
  }

  // History variant
  const isWinner =
    bet.status === 'resolved' &&
    ((bet.result === true && bet.creatorName === playerName) ||
      (bet.result === false && bet.acceptorName === playerName));
  const isLoser =
    bet.status === 'resolved' &&
    ((bet.result === true && bet.acceptorName === playerName) ||
      (bet.result === false && bet.creatorName === playerName));
  const wasParticipant = bet.creatorName === playerName || bet.acceptorName === playerName;

  return (
    <div
      className={`p-3 bg-[var(--color-bg-tertiary)] rounded-lg border ${
        isWinner
          ? 'border-green-500/50'
          : isLoser
            ? 'border-red-500/50'
            : bet.status === 'disputed'
              ? 'border-skin-default'
              : bet.status === 'cancelled'
                ? 'border-yellow-500/30'
                : 'border-[var(--color-border-default)]'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm text-[var(--color-text-primary)]">{getBetDescription(bet)}</span>
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
              ? 'text-skin-muted'
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
}
