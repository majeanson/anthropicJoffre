/**
 * Side Bet Toast Component
 *
 * Displays live betting notifications that appear at the top of the screen,
 * visible even when the side bets panel is closed. Includes:
 * - New bet created notifications
 * - Bet accepted notifications
 * - Win/loss celebrations with streak info
 */

import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import type {
  SideBetCreatedEvent,
  SideBetAcceptedEvent,
  SideBetResolvedEvent,
} from '../types/game';

interface SideBetToastProps {
  socket: Socket | null;
  playerName: string;
  enabled?: boolean;
}

interface Toast {
  id: string;
  type: 'created' | 'accepted' | 'won' | 'lost';
  message: string;
  subMessage?: string;
  coins?: number;
  streakBonus?: number;
  streak?: number;
  timestamp: number;
}

export function SideBetToast({ socket, playerName, enabled = true }: SideBetToastProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'timestamp'>) => {
    const newToast: Toast = {
      ...toast,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setToasts(prev => [newToast, ...prev].slice(0, 3)); // Keep max 3 toasts
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!socket || !enabled) return;

    const handleBetCreated = ({ bet }: SideBetCreatedEvent) => {
      // Only show toast if not our own bet
      if (bet.creatorName !== playerName) {
        addToast({
          type: 'created',
          message: `${bet.creatorName} created a bet`,
          subMessage: bet.customDescription || bet.presetType || 'Side bet',
          coins: bet.amount,
        });
      }
    };

    const handleBetAccepted = ({ acceptorName }: SideBetAcceptedEvent) => {
      // Show when someone accepts any bet
      if (acceptorName !== playerName) {
        addToast({
          type: 'accepted',
          message: `${acceptorName} accepted a bet!`,
          subMessage: 'Game on!',
        });
      }
    };

    const handleBetResolved = ({
      winnerName,
      loserName,
      coinsAwarded,
      streakBonus,
      winnerStreak,
    }: SideBetResolvedEvent) => {
      const isWinner = winnerName === playerName;
      const isLoser = loserName === playerName;

      if (isWinner) {
        addToast({
          type: 'won',
          message: 'You won a bet!',
          coins: coinsAwarded,
          streakBonus: streakBonus || 0,
          streak: winnerStreak,
        });
        // Win sound is played in SideBetsPanel
      } else if (isLoser) {
        addToast({
          type: 'lost',
          message: 'You lost a bet',
          subMessage: `${winnerName} won ${coinsAwarded} coins`,
        });
        // Loss sound is played in SideBetsPanel
      } else {
        // Show others' wins if significant streak
        if (winnerStreak && winnerStreak >= 3) {
          addToast({
            type: 'won',
            message: `${winnerName} is on fire!`,
            subMessage: `${winnerStreak} win streak`,
            coins: coinsAwarded,
          });
        }
      }
    };

    socket.on('side_bet_created', handleBetCreated);
    socket.on('side_bet_accepted', handleBetAccepted);
    socket.on('side_bet_resolved', handleBetResolved);

    return () => {
      socket.off('side_bet_created', handleBetCreated);
      socket.off('side_bet_accepted', handleBetAccepted);
      socket.off('side_bet_resolved', handleBetResolved);
    };
  }, [socket, playerName, enabled, addToast]);

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(t => now - t.timestamp < 5000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!enabled || toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            animate-slide-in-right
            p-3 rounded-lg shadow-xl border
            min-w-[240px] max-w-[320px]
            backdrop-blur-sm
            ${toast.type === 'won'
              ? 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 border-green-400/50 text-white'
              : toast.type === 'lost'
              ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 border-red-400/50 text-white'
              : toast.type === 'accepted'
              ? 'bg-gradient-to-r from-blue-500/80 to-indigo-600/80 border-blue-400/50 text-white'
              : 'bg-[var(--color-bg-secondary)]/95 border-yellow-500/50 text-[var(--color-text-primary)]'
            }
          `}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <span className="text-2xl flex-shrink-0">
              {toast.type === 'won' ? '🏆' :
               toast.type === 'lost' ? '💔' :
               toast.type === 'accepted' ? '🤝' : '🎲'}
            </span>

            <div className="flex-1 min-w-0">
              {/* Main message */}
              <p className="font-bold text-sm truncate">{toast.message}</p>

              {/* Sub message */}
              {toast.subMessage && (
                <p className="text-xs opacity-90 truncate">{toast.subMessage}</p>
              )}

              {/* Coins */}
              {toast.coins && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold">
                    {toast.type === 'won' ? '+' : ''}{toast.coins} 🪙
                  </span>
                  {toast.streakBonus && toast.streakBonus > 0 && (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                      +{toast.streakBonus} bonus
                    </span>
                  )}
                </div>
              )}

              {/* Streak badge */}
              {toast.streak && toast.streak >= 3 && (
                <div className="mt-1 text-xs flex items-center gap-1">
                  <span>🔥</span>
                  <span className="font-medium">{toast.streak} win streak</span>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="opacity-60 hover:opacity-100 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SideBetToast;
