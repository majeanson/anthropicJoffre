/**
 * XP Gain Popup Component
 *
 * Floating "+X XP" text that appears near action source or top-center,
 * rises upward with fade out, and auto-dismisses after animation.
 * Supports stacking multiple gains.
 */

import { useEffect, useState, memo, useCallback } from 'react';
import { sounds } from '../utils/sounds';

interface XPGain {
  id: string;
  amount: number;
  timestamp: number;
}

interface XPGainPopupProps {
  gains: XPGain[];
  onRemoveGain: (id: string) => void;
}

// Individual floating XP indicator
const XPFloater = memo(function XPFloater({
  gain,
  index,
  onComplete,
}: {
  gain: XPGain;
  index: number;
  onComplete: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in immediately
    requestAnimationFrame(() => setIsVisible(true));

    // Play sound on mount
    sounds.xpGain();

    // Dismiss after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(gain.id), 300); // Wait for fade-out
    }, 1200);

    return () => clearTimeout(timer);
  }, [gain.id, onComplete]);

  // Stack offset - newer items appear higher
  const stackOffset = index * 30;

  return (
    <div
      className={`
        absolute left-1/2 transform -translate-x-1/2
        pointer-events-none select-none
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        top: `calc(50% - ${stackOffset}px)`,
        animation: isVisible ? 'xpRise 1.2s ease-out forwards' : undefined,
      }}
    >
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg shadow-amber-500/30">
        <span className="text-lg font-bold text-white drop-shadow-sm">+{gain.amount}</span>
        <span className="text-sm font-semibold text-amber-100">XP</span>
      </div>
    </div>
  );
});

export function XPGainPopup({ gains, onRemoveGain }: XPGainPopupProps) {
  if (gains.length === 0) return null;

  return (
    <>
      {/* Inject keyframes animation */}
      <style>
        {`
          @keyframes xpRise {
            0% {
              transform: translate(-50%, 0);
              opacity: 1;
            }
            70% {
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -60px);
              opacity: 0;
            }
          }
        `}
      </style>

      <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
        <div className="relative h-32 w-40">
          {gains.slice(-5).map((gain, index) => (
            <XPFloater key={gain.id} gain={gain} index={index} onComplete={onRemoveGain} />
          ))}
        </div>
      </div>
    </>
  );
}

// Hook for managing XP gain popups
export function useXPGainPopup() {
  const [gains, setGains] = useState<XPGain[]>([]);

  const addGain = useCallback((amount: number) => {
    const newGain: XPGain = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      amount,
      timestamp: Date.now(),
    };
    setGains((prev) => [...prev, newGain]);
  }, []);

  const removeGain = useCallback((id: string) => {
    setGains((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return {
    gains,
    addGain,
    removeGain,
    XPGainPopupComponent: <XPGainPopup gains={gains} onRemoveGain={removeGain} />,
  };
}

export default XPGainPopup;
