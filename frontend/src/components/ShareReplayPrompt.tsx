/**
 * ShareReplayPrompt Component
 * Sprint 16 Day 5
 *
 * Post-game modal prompting users to share their replay.
 * Appears after game over with social sharing options.
 *
 * Features:
 * - Copy replay link to clipboard
 * - Share to social media (Twitter, Facebook, etc.)
 * - Quick stats summary
 * - Celebration animation for winners
 *
 * Usage:
 * ```tsx
 * <ShareReplayPrompt
 *   gameId={gameId}
 *   winningTeam={gameState.winningTeam}
 *   finalScore={{ team1: 42, team2: 35 }}
 *   playerTeam={playerTeam}
 *   onClose={() => setShowShare(false)}
 *   onViewReplay={() => openReplay(gameId)}
 * />
 * ```
 */

import { useState } from 'react';
import { sounds } from '../utils/sounds';

interface ShareReplayPromptProps {
  gameId: string;
  winningTeam: 1 | 2;
  finalScore: { team1: number; team2: number };
  playerTeam?: 1 | 2; // Undefined for spectators
  onClose: () => void;
  onViewReplay: () => void;
}

export function ShareReplayPrompt({
  gameId,
  winningTeam,
  finalScore,
  playerTeam,
  onClose,
  onViewReplay
}: ShareReplayPromptProps) {
  const [copied, setCopied] = useState(false);

  const isWinner = playerTeam === winningTeam;
  const replayUrl = `${window.location.origin}?replay=${gameId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(replayUrl);
    sounds.buttonClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareTwitter = () => {
    const text = isWinner
      ? `I just won a game of Jaffre! Final score: ${finalScore.team1} - ${finalScore.team2}. Watch the replay:`
      : `Just finished an epic game of Jaffre! Final score: ${finalScore.team1} - ${finalScore.team2}. Watch the replay:`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(replayUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(replayUrl)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-emerald-500/50 p-8 max-w-md w-full shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with celebration */}
        <div className="text-center mb-6">
          {isWinner && (
            <div className="text-6xl mb-3 animate-bounce">
              🏆
            </div>
          )}
          <h2 className="text-3xl font-bold text-emerald-400 mb-2">
            {isWinner ? 'Victory!' : 'Game Over'}
          </h2>
          <p className="text-gray-300 text-lg">
            Team {winningTeam} Wins!
          </p>
          <div className="mt-3 flex justify-center gap-4 text-xl">
            <span className={`font-bold ${winningTeam === 1 ? 'text-emerald-400' : 'text-gray-400'}`}>
              Team 1: {finalScore.team1}
            </span>
            <span className="text-gray-500">-</span>
            <span className={`font-bold ${winningTeam === 2 ? 'text-emerald-400' : 'text-gray-400'}`}>
              Team 2: {finalScore.team2}
            </span>
          </div>
        </div>

        {/* Share message */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
          <p className="text-gray-300 text-center text-sm">
            🎮 Share this epic game with friends!
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copied ? '✓ Link Copied!' : '🔗 Copy Replay Link'}
          </button>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareTwitter}
              className="py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>🐦</span> Twitter
            </button>
            <button
              onClick={handleShareFacebook}
              className="py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>📘</span> Facebook
            </button>
          </div>

          {/* View Replay */}
          <button
            onClick={() => {
              onViewReplay();
              onClose();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors"
          >
            📺 Watch Replay
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>

        {/* Game ID footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Game ID: <span className="font-mono">{gameId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
