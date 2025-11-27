/**
 * BotThinkingIndicator Component
 * IMPROVEMENT #11: Bot thinking tooltips UI
 *
 * Shows what the bot is thinking when it makes a move
 * Displays brief explanatory messages about bot decisions
 */

import { useEffect, useState } from 'react';

interface BotThinkingIndicatorProps {
  botName: string;
  action: string; // e.g., "Leading 7 red to flush out trumps", "Adding Red 0 for +5 bonus!"
  visible: boolean;
  onDismiss: () => void;
}

export function BotThinkingIndicator({ botName, action, visible, onDismiss }: BotThinkingIndicatorProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsShowing(true);
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onDismiss, 300); // Wait for fade-out animation
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible && !isShowing) return null;

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isShowing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-blue-300 max-w-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
            <span className="text-xl animate-pulse">🤖</span>
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold opacity-90">{botName} is thinking...</div>
            <div className="text-sm font-bold mt-0.5">{action}</div>
          </div>
          <button
            onClick={() => {
              setIsShowing(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
