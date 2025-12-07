/**
 * ReplayHeader Component
 * Header section of the game replay viewer
 */

import { Button } from '../ui';
import type { ReplayHeaderProps } from './types';

export function ReplayHeader({ gameId, totalRounds, onShare, onClose }: ReplayHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 md:px-8 py-4 md:py-6 rounded-t-lg md:rounded-t-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <span className="text-2xl md:text-4xl" aria-hidden="true">
            🎮
          </span>
          <div className="min-w-0">
            <h2 className="text-xl md:text-3xl font-black">Game Replay</h2>
            <p className="text-emerald-100 text-xs md:text-sm mt-1 truncate">
              ID: {gameId} • {totalRounds} rounds
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Share Button */}
          <Button
            onClick={onShare}
            variant="ghost"
            size="sm"
            className="!bg-white/20 hover:!bg-white/30 !text-white !border-0"
            aria-label="Copy replay link"
            leftIcon={<span aria-hidden="true">🔗</span>}
          >
            <span className="hidden md:inline">Share</span>
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="!bg-transparent !border-0 !text-white hover:!text-emerald-100 !text-2xl md:!text-4xl !p-1"
            aria-label="Close replay viewer"
          >
            ×
          </Button>
        </div>
      </div>
    </div>
  );
}
