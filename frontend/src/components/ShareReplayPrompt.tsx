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
import { UICard } from './ui/UICard';

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
      <UICard variant="bordered" size="sm" className="mb-6 bg-parchment-100 dark:bg-gray-800/50">
        <p className="text-umber-900 dark:text-gray-300 text-center text-sm">
          <span aria-hidden="true">🎮</span> Share this epic game with friends!
        </p>
      </UICard>

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
          <Button
            variant="primary"
            onClick={handleShareTwitter}
            className="bg-sky-500 hover:bg-sky-600 border-sky-600"
          >
            <span aria-hidden="true">🐦</span> Twitter
          </Button>
          <Button
            variant="primary"
            onClick={handleShareFacebook}
            className="bg-blue-700 hover:bg-blue-800 border-blue-800"
          >
            <span aria-hidden="true">📘</span> Facebook
          </Button>
        </div>

        {/* View Replay */}
        <Button
          variant="success"
          fullWidth
          onClick={() => {
            onViewReplay();
            onClose();
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
