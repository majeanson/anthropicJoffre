/**
 * Keyboard Shortcuts Help Modal
 * Task 10 - Phase 2
 *
 * Shows all available keyboard shortcuts for Game Boy-style navigation.
 * Press "?" to open.
 */

import { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhase?: 'lobby' | 'team_selection' | 'betting' | 'playing';
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  currentPhase = 'lobby',
}: KeyboardShortcutsModalProps) {
  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-blue-500/30 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b-2 border-blue-500 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">⌨️</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                <p className="text-blue-100 text-sm">Game Boy-style navigation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl leading-none transition-colors"
              aria-label="Close keyboard shortcuts help"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Global Shortcuts */}
          <ShortcutSection
            title="Global Shortcuts"
            icon="🌍"
            shortcuts={[
              { keys: ['?'], description: 'Show this help' },
              { keys: ['Escape'], description: 'Close modals / Go back' },
              { keys: ['Tab'], description: 'Navigate forward' },
              { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
              { keys: ['c'], description: 'Toggle chat', condition: 'In game' },
              { keys: ['d'], description: 'Toggle debug panel', condition: 'Dev mode' },
            ]}
          />

          {/* Lobby Phase */}
          <ShortcutSection
            title="Lobby Phase"
            icon="🏠"
            active={currentPhase === 'lobby'}
            shortcuts={[
              { keys: ['c'], description: 'Create new game' },
              { keys: ['r'], description: 'Refresh lobby list' },
              { keys: ['l'], description: 'Toggle leaderboard' },
              { keys: ['f'], description: 'Toggle friends panel' },
              { keys: ['1', '2', '3'], description: 'Quick join game by number' },
              { keys: ['Enter'], description: 'Join selected game' },
            ]}
          />

          {/* Team Selection Phase */}
          <ShortcutSection
            title="Team Selection"
            icon="👥"
            active={currentPhase === 'team_selection'}
            shortcuts={[
              { keys: ['1'], description: 'Select Team 1 (Orange)' },
              { keys: ['2'], description: 'Select Team 2 (Purple)' },
              { keys: ['←', '→'], description: 'Navigate between players' },
              { keys: ['Space'], description: 'Swap with selected player' },
              { keys: ['s'], description: 'Start game', condition: 'When ready' },
            ]}
          />

          {/* Betting Phase */}
          <ShortcutSection
            title="Betting Phase"
            icon="💰"
            active={currentPhase === 'betting'}
            shortcuts={[
              { keys: ['↑'], description: 'Increase bet amount' },
              { keys: ['↓'], description: 'Decrease bet amount' },
              { keys: ['t'], description: 'Toggle "without trump"' },
              { keys: ['Enter'], description: 'Place bet' },
              { keys: ['s'], description: 'Skip bet', condition: 'When allowed' },
            ]}
          />

          {/* Playing Phase - Game Boy Style! */}
          <ShortcutSection
            title="Playing Phase (Game Boy Style!)"
            icon="🎮"
            active={currentPhase === 'playing'}
            shortcuts={[
              { keys: ['←'], description: 'Select previous card' },
              { keys: ['→'], description: 'Select next card' },
              { keys: ['↑'], description: 'Highlight selected card' },
              { keys: ['Enter'], description: 'Play selected card' },
              { keys: ['Space'], description: 'Play selected card (alt)' },
              { keys: ['1-8'], description: 'Quick play card by position' },
              { keys: ['p'], description: 'Toggle previous trick view' },
            ]}
          />

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-lg font-bold text-blue-400 mb-2">💡 Pro Tips</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• All keyboard shortcuts work without touching the mouse!</li>
              <li>• Use Tab to navigate between buttons and inputs</li>
              <li>• Press Escape to quickly close any modal or panel</li>
              <li>• Arrow keys work in all phases for quick navigation</li>
              <li>• Number keys (1-8) provide instant card selection during play</li>
            </ul>
          </div>

          {/* Got it button for keyboard navigation */}
          <button
            onClick={onClose}
            autoFocus
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shortcut section component
 */
interface ShortcutSectionProps {
  title: string;
  icon: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    condition?: string;
  }>;
  active?: boolean;
}

function ShortcutSection({ title, icon, shortcuts, active }: ShortcutSectionProps) {
  return (
    <div
      className={`rounded-lg p-4 border-2 transition-colors ${
        active
          ? 'bg-blue-900/30 border-blue-500'
          : 'bg-gray-800/50 border-gray-700'
      }`}
    >
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>{icon}</span>
        <span className={active ? 'text-blue-400' : 'text-gray-200'}>{title}</span>
        {active && (
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            Current Phase
          </span>
        )}
      </h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex gap-1.5 flex-wrap items-center">
              {shortcut.keys.map((key, i) => (
                <div key={i} className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-200 shadow-sm min-w-[2rem] text-center">
                    {key}
                  </kbd>
                  {i < shortcut.keys.length - 1 && shortcut.keys.length > 1 && (
                    <span className="text-gray-500 text-xs">or</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm text-gray-300">{shortcut.description}</span>
              {shortcut.condition && (
                <span className="ml-2 text-xs text-gray-500 italic">
                  ({shortcut.condition})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
