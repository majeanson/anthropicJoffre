/**
 * Quest Completed Toast Component
 *
 * Shows a celebratory notification when a quest is completed.
 * Purple theme (matches quest panel), shows reward (coins + XP),
 * with mini confetti burst effect.
 */

import { useEffect, useState, memo, useCallback } from 'react';
import { sounds } from '../utils/sounds';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

export interface QuestCompletion {
  id: string;
  questName: string;
  rewardXp: number;
  rewardCurrency: number;
  icon: string;
  questType: 'easy' | 'medium' | 'hard';
}

interface QuestCompletedToastProps {
  quest: QuestCompletion | null;
  onDismiss: () => void;
}

// Confetti particle component
const ConfettiParticle = memo(function ConfettiParticle({
  index,
  color,
}: {
  index: number;
  color: string;
}) {
  const angle = (index / 12) * 360;
  const distance = 60 + Math.random() * 40;
  const delay = Math.random() * 0.1;
  const duration = 0.6 + Math.random() * 0.4;

  return (
    <div
      className="absolute w-2 h-2 rounded-full"
      style={
        {
          backgroundColor: color,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          animation: `confettiBurst ${duration}s ease-out ${delay}s forwards`,
          '--angle': `${angle}deg`,
          '--distance': `${distance}px`,
        } as React.CSSProperties
      }
    />
  );
});

export const QuestCompletedToast = memo(function QuestCompletedToast({
  quest,
  onDismiss,
}: QuestCompletedToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setShowConfetti(false);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  useEffect(() => {
    if (quest) {
      // Fade in
      requestAnimationFrame(() => {
        setIsVisible(true);
        setShowConfetti(true);
      });

      // Play quest complete sound
      sounds.questComplete();

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [quest, handleClose]);

  if (!quest) return null;

  const confettiColors = ['#a855f7', '#c084fc', '#e879f9', '#f0abfc', '#fcd34d', '#38bdf8'];

  const getQuestTypeBadge = () => {
    switch (quest.questType) {
      case 'easy':
        return { text: 'Easy', className: 'bg-green-500/20 text-green-400' };
      case 'medium':
        return { text: 'Medium', className: 'bg-yellow-500/20 text-yellow-400' };
      case 'hard':
        return { text: 'Hard', className: 'bg-red-500/20 text-red-400' };
    }
  };

  const badge = getQuestTypeBadge();

  return (
    <>
      {/* Inject confetti animation */}
      <style>
        {`
          @keyframes confettiBurst {
            0% {
              transform: translate(-50%, -50%) rotate(0deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(
                calc(-50% + cos(var(--angle)) * var(--distance)),
                calc(-50% + sin(var(--angle)) * var(--distance))
              ) rotate(720deg) scale(0);
              opacity: 0;
            }
          }
          @keyframes questPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>

      <div
        className={`
          fixed top-24 left-1/2 transform -translate-x-1/2 z-[10000]
          transition-all duration-400 ease-out
          ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 -translate-y-4'}
        `}
      >
        {/* Confetti container */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {confettiColors.flatMap((color, colorIndex) =>
              [0, 1].map((i) => (
                <ConfettiParticle
                  key={`${colorIndex}-${i}`}
                  index={colorIndex * 2 + i}
                  color={color}
                />
              ))
            )}
          </div>
        )}

        <UICard
          variant="gradient"
          gradient="team2"
          size="lg"
          className="shadow-[0_0_30px_rgba(147,51,234,0.4)] relative overflow-visible"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-2 right-2 text-white/70 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Close quest notification"
          >
            ×
          </Button>

          <div className="flex items-center gap-4">
            {/* Quest Icon with animation */}
            <div
              className="text-5xl"
              style={{ animation: 'questPulse 0.6s ease-in-out 2' }}
              aria-hidden="true"
            >
              {quest.icon || '🎯'}
            </div>

            {/* Content */}
            <div className="text-white flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-white/90">
                  Quest Complete!
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${badge.className}`}>
                  {badge.text}
                </span>
              </div>

              <div className="font-bold text-lg mb-2 truncate">{quest.questName}</div>

              {/* Rewards */}
              <div className="flex items-center gap-4 text-sm">
                {quest.rewardXp > 0 && (
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                    <span className="text-yellow-300">+{quest.rewardXp}</span>
                    <span className="text-white/80">XP</span>
                  </div>
                )}
                {quest.rewardCurrency > 0 && (
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                    <span>🪙</span>
                    <span className="text-yellow-300">+{quest.rewardCurrency}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Star decoration */}
            <div className="text-4xl animate-pulse" aria-hidden="true">
              ⭐
            </div>
          </div>

          {/* Progress bar animation (completion effect) */}
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white animate-progress-fill" />
          </div>
        </UICard>
      </div>
    </>
  );
});

// Hook for managing quest completion toasts
export function useQuestCompletedToast() {
  const [completedQuest, setCompletedQuest] = useState<QuestCompletion | null>(null);
  const [, setQueue] = useState<QuestCompletion[]>([]);

  const showQuestCompleted = useCallback(
    (quest: QuestCompletion) => {
      if (completedQuest) {
        // Queue if one is already showing
        setQueue((prev) => [...prev, quest]);
      } else {
        setCompletedQuest(quest);
      }
    },
    [completedQuest]
  );

  const dismissQuest = useCallback(() => {
    setCompletedQuest(null);
    // Show next in queue after small delay
    setTimeout(() => {
      setQueue((prev) => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          setCompletedQuest(next);
          return rest;
        }
        return prev;
      });
    }, 300);
  }, []);

  return {
    completedQuest,
    showQuestCompleted,
    dismissQuest,
    QuestCompletedToastComponent: (
      <QuestCompletedToast quest={completedQuest} onDismiss={dismissQuest} />
    ),
  };
}

export default QuestCompletedToast;
