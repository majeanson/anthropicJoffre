/**
 * ShareReplayPrompt Component
 * Sprint 16 Day 5 | Refactored Sprint 19B
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
import { Modal, Button } from './ui';
import { sounds } from '../utils/sounds';
import { colors } from '../design-system';

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
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isWinner ? 'Victory!' : 'Game Over'}
      subtitle={`Team ${winningTeam} Wins!`}
      icon={isWinner ? <span className="animate-bounce">🏆</span> : undefined}
      theme="green"
      size="sm"
    >
      {/* Score Display */}
      <div className="flex justify-center gap-4 text-xl mb-6">
        <span className={`font-bold ${winningTeam === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
          Team 1: {finalScore.team1}
        </span>
        <span className="text-gray-500">-</span>
        <span className={`font-bold ${winningTeam === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
          Team 2: {finalScore.team2}
        </span>
      </div>

      {/* Share message */}
      <div className="bg-parchment-100 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border-2 border-parchment-200 dark:border-gray-700">
        <p className="text-umber-900 dark:text-gray-300 text-center text-sm">
          <span aria-hidden="true">🎮</span> Share this epic game with friends!
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Copy Link */}
        <Button
          variant={copied ? 'secondary' : 'primary'}
          fullWidth
          onClick={handleCopyLink}
        >
          {copied ? <><span aria-hidden="true">✓</span> Link Copied!</> : <><span aria-hidden="true">🔗</span> Copy Replay Link</>}
        </Button>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShareTwitter}
            className="py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
          >
            <span aria-hidden="true">🐦</span> Twitter
          </button>
          <button
            onClick={handleShareFacebook}
            className="py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          >
            <span aria-hidden="true">📘</span> Facebook
          </button>
        </div>

        {/* View Replay */}
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            onViewReplay();
            onClose();
          }}
          style={{
            background: `linear-gradient(to right, ${colors.success.start}, ${colors.success.end})`,
            borderColor: colors.success.border
          }}
        >
          <span aria-hidden="true">📺</span> Watch Replay
        </Button>

        {/* Close */}
        <Button
          variant="secondary"
          fullWidth
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      {/* Game ID footer */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Game ID: <span className="font-mono">{gameId}</span>
        </p>
      </div>
    </Modal>
  );
}
