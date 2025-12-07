/**
 * PlaybackControls Component
 * Playback controls for the game replay
 */

import { Button } from '../ui';
import type { PlaybackControlsProps } from './types';

export function PlaybackControls({
  isPlaying,
  playSpeed,
  hasNextTrick,
  hasPrevTrick,
  hasNextRound,
  hasPrevRound,
  totalRounds,
  currentRoundIndex,
  onPlayPause,
  onNextTrick,
  onPrevTrick,
  onSetSpeed,
  onJumpToRound,
}: PlaybackControlsProps) {
  return (
    <div className="bg-skin-primary rounded-xl p-4 md:p-6 shadow-lg border border-skin-default">
      <h3 className="text-base md:text-lg font-black text-skin-primary mb-3 md:mb-4">
        Playback Controls
      </h3>

      {/* Speed Control */}
      <div className="mb-3 md:mb-4">
        <p className="text-xs md:text-sm text-skin-muted mb-2">Speed:</p>
        <div className="flex gap-2">
          {([0.5, 1, 2] as const).map((speed) => (
            <Button
              key={speed}
              data-testid={`speed-${speed}x`}
              onClick={() => onSetSpeed(speed)}
              variant={playSpeed === speed ? 'primary' : 'ghost'}
              size="sm"
            >
              {speed}x
            </Button>
          ))}
        </div>
      </div>

      {/* Play/Pause & Navigation */}
      <div className="flex items-center justify-center gap-3 md:gap-2 mb-3 md:mb-4">
        <Button
          data-testid="prev-trick-button"
          onClick={onPrevTrick}
          disabled={!hasPrevTrick && !hasPrevRound}
          variant="ghost"
          size="md"
          aria-label="Previous trick"
        >
          ⏮️
        </Button>
        <Button
          data-testid="play-pause-button"
          onClick={onPlayPause}
          variant="primary"
          size="lg"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
        <Button
          data-testid="next-trick-button"
          onClick={onNextTrick}
          disabled={!hasNextTrick && !hasNextRound}
          variant="ghost"
          size="md"
          aria-label="Next trick"
        >
          ⏭️
        </Button>
      </div>

      {/* Round Jump Buttons */}
      <div className="border-t pt-3 md:pt-4 border-skin-default">
        <p className="text-xs md:text-sm text-skin-muted mb-2">Jump to Round:</p>
        <div className="grid grid-cols-5 md:grid-cols-3 gap-1">
          {Array.from({ length: totalRounds }).map((_, idx) => (
            <Button
              key={idx}
              data-testid={`round-jump-${idx + 1}`}
              onClick={() => onJumpToRound(idx)}
              variant={idx === currentRoundIndex ? 'primary' : 'ghost'}
              size="xs"
            >
              R{idx + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
