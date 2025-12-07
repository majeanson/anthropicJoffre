import { useState } from 'react';
import { sounds } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface JoinWithIdSectionProps {
  onJoinGame: (gameId: string) => void;
  onClose: () => void;
}

export function JoinWithIdSection({ onJoinGame, onClose }: JoinWithIdSectionProps) {
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [gameId, setGameId] = useState('');

  return (
    <div
      className="
        rounded-[var(--radius-lg)]
        border border-[var(--color-border-default)]
        bg-[var(--color-bg-tertiary)]
        overflow-hidden
      "
    >
      <button
        onClick={() => {
          setShowJoinInput(!showJoinInput);
          sounds.buttonClick();
        }}
        className="
          w-full px-4 py-3
          flex items-center justify-between
          text-left
          hover:bg-[var(--color-bg-secondary)]
          transition-colors duration-[var(--duration-fast)]
        "
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔑</span>
          <span className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm">
            Join with Game ID
          </span>
        </div>
        <span className="text-[var(--color-text-muted)]">{showJoinInput ? '▲' : '▼'}</span>
      </button>

      {showJoinInput && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-border-subtle)]">
          <div className="pt-3">
            <Input
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              variant="default"
              size="md"
              leftIcon={<span className="text-sm">🎮</span>}
            />
          </div>
          <Button
            data-testid="join-game-button"
            onClick={() => {
              if (gameId.trim()) {
                onJoinGame(gameId.trim());
                onClose();
              }
            }}
            disabled={!gameId.trim()}
            variant="success"
            size="md"
            fullWidth
          >
            Join Game
          </Button>
        </div>
      )}
    </div>
  );
}
