/**
 * GameHeader Component - Multi-Skin Edition
 *
 * Game header with scores, round info, and action buttons.
 * Uses CSS variables for skin compatibility.
 *
 * Refactored to use sub-components:
 * - ScoreDisplay: Team scores with animations
 * - BetTrumpDisplay: Bet/trump indicators
 * - HeaderActions: Action button group
 * - useScoreAnimation: Animation hook
 */

import { useState } from 'react';
import { SettingsPanel } from '../SettingsPanel';
import { TutorialProgressModal } from '../TutorialProgressModal';
import { Button } from '../ui';
import { ConnectionStats } from '../../hooks/useConnectionQuality';
import { CardColor, VoiceParticipant } from '../../types/game';
import { useSettings } from '../../contexts/SettingsContext';
import logger from '../../utils/logger';

import { ScoreDisplay } from './ScoreDisplay';
import { BetTrumpDisplay } from './BetTrumpDisplay';
import { HeaderActions } from './HeaderActions';
import { useScoreAnimation } from './useScoreAnimation';

interface GameHeaderProps {
  gameId: string;
  roundNumber: number;
  team1Score: number;
  team2Score: number;
  onLeaveGame?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenChat?: () => void;
  onOpenBotManagement?: () => void;
  onOpenRules?: () => void;
  onOpenAchievements?: () => void;
  onOpenFriends?: () => void;
  onOpenNotifications?: () => void;
  onOpenSideBets?: () => void;
  unreadNotificationsCount?: number;
  pendingFriendRequestsCount?: number;
  openSideBetsCount?: number;
  botCount?: number;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  isSpectator?: boolean;
  unreadChatCount?: number;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  connectionStats?: ConnectionStats;
  highestBet?: { amount: number; withoutTrump: boolean; playerId: string };
  trump?: CardColor | null;
  bettingTeamId?: 1 | 2 | null;
  // Voice chat props
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  voiceError?: string | null;
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
}

export function GameHeader({
  gameId,
  roundNumber,
  team1Score,
  team2Score,
  onLeaveGame,
  onOpenLeaderboard,
  onOpenChat,
  onOpenBotManagement,
  onOpenRules,
  onOpenAchievements,
  onOpenFriends,
  onOpenNotifications,
  onOpenSideBets,
  unreadNotificationsCount = 0,
  pendingFriendRequestsCount = 0,
  openSideBetsCount = 0,
  botCount = 0,
  autoplayEnabled = false,
  onAutoplayToggle,
  isSpectator = false,
  unreadChatCount = 0,
  soundEnabled = true,
  onSoundToggle,
  connectionStats,
  highestBet,
  trump,
  bettingTeamId,
  isVoiceEnabled = false,
  isVoiceMuted = false,
  voiceParticipants = [],
  voiceError,
  onVoiceToggle,
  onVoiceMuteToggle,
}: GameHeaderProps) {
  const { beginnerMode } = useSettings();
  const [linkCopied, setLinkCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tutorialProgressOpen, setTutorialProgressOpen] = useState(false);

  // Use score animation hook
  const { team1, team2, animatedTeam1Score, animatedTeam2Score } = useScoreAnimation(
    team1Score,
    team2Score
  );

  const handleCopyGameLink = async () => {
    const gameLink = `${window.location.origin}?gameId=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      logger.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="border-b-2 shadow-lg z-40 relative overflow-visible border-skin-accent bg-gradient-to-r from-skin-secondary to-skin-tertiary">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5">
        {/* Desktop: Single row */}
        <div className="hidden md:flex items-center gap-3">
          {/* Game Info - Clickable to copy link */}
          <Button
            onClick={handleCopyGameLink}
            variant="ghost"
            size="xs"
            title="Click to copy game link"
          >
            <p className="text-xs font-mono font-bold text-skin-secondary">
              {linkCopied ? '✓ Copied!' : gameId}
            </p>
          </Button>

          <div className="px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0 bg-skin-tertiary">
            <p className="text-xs font-bold text-skin-primary" data-testid="round-number">
              R{roundNumber}
            </p>
          </div>

          {/* Connection Status Indicator */}
          {connectionStats && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0 bg-skin-tertiary"
              title={`Connection: ${connectionStats.quality}${connectionStats.ping ? ` (${connectionStats.ping}ms)` : ''}`}
              role="status"
              aria-label={`Connection quality: ${connectionStats.quality}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  connectionStats.quality === 'offline'
                    ? 'bg-red-500 animate-pulse'
                    : connectionStats.quality === 'poor'
                      ? 'bg-red-500'
                      : connectionStats.quality === 'fair'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                }`}
              />
              {connectionStats.quality === 'offline' && (
                <span className="text-[10px] text-red-400 font-semibold">Offline</span>
              )}
              {connectionStats.quality === 'poor' && (
                <span className="text-[10px] text-red-400 font-semibold">Poor</span>
              )}
            </div>
          )}

          {/* Bet and Trump Display */}
          <BetTrumpDisplay highestBet={highestBet} trump={trump} />

          {/* Team Scores */}
          <ScoreDisplay
            team1Score={animatedTeam1Score}
            team2Score={animatedTeam2Score}
            team1ScoreChange={team1.scoreChange}
            team2ScoreChange={team2.scoreChange}
            team1Flash={team1.flash}
            team2Flash={team2.flash}
            bettingTeamId={bettingTeamId}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <HeaderActions
            onOpenChat={onOpenChat}
            unreadChatCount={unreadChatCount}
            isVoiceEnabled={isVoiceEnabled}
            isVoiceMuted={isVoiceMuted}
            voiceParticipants={voiceParticipants}
            voiceError={voiceError}
            onVoiceToggle={onVoiceToggle}
            onVoiceMuteToggle={onVoiceMuteToggle}
            onOpenLeaderboard={onOpenLeaderboard}
            onOpenAchievements={onOpenAchievements}
            onOpenFriends={onOpenFriends}
            pendingFriendRequestsCount={pendingFriendRequestsCount}
            onOpenSideBets={onOpenSideBets}
            openSideBetsCount={openSideBetsCount}
            onOpenNotifications={onOpenNotifications}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenTutorial={() => setTutorialProgressOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            beginnerMode={beginnerMode}
          />
        </div>

        {/* Mobile: Two rows */}
        <div className="md:hidden space-y-1">
          {/* Row 1: Game Info and Scores */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopyGameLink}
              variant="ghost"
              size="xs"
              title="Click to copy game link"
            >
              <p className="text-xs font-mono font-bold text-skin-secondary">
                {linkCopied ? '✓' : gameId}
              </p>
            </Button>

            <div className="px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0 bg-skin-tertiary">
              <p className="text-xs font-bold text-skin-primary">R{roundNumber}</p>
            </div>

            {/* Mobile Connection Status Indicator */}
            {connectionStats && (
              <div
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0 bg-skin-tertiary"
                title={`Connection: ${connectionStats.quality}${connectionStats.ping ? ` (${connectionStats.ping}ms)` : ''}`}
                role="status"
                aria-label={`Connection quality: ${connectionStats.quality}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStats.quality === 'offline'
                      ? 'bg-red-500 animate-pulse'
                      : connectionStats.quality === 'poor'
                        ? 'bg-red-500'
                        : connectionStats.quality === 'fair'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                />
                {connectionStats.quality === 'offline' && (
                  <span className="text-[10px] text-red-400 font-semibold">!</span>
                )}
              </div>
            )}

            {/* Mobile Bet and Trump Display */}
            <BetTrumpDisplay highestBet={highestBet} trump={trump} mobile />

            <div className="flex-1" />

            {/* Mobile Scores */}
            <ScoreDisplay
              team1Score={animatedTeam1Score}
              team2Score={animatedTeam2Score}
              team1ScoreChange={team1.scoreChange}
              team2ScoreChange={team2.scoreChange}
              team1Flash={team1.flash}
              team2Flash={team2.flash}
              bettingTeamId={bettingTeamId}
              mobile
            />
          </div>

          {/* Row 2: Action Buttons */}
          <HeaderActions
            onOpenChat={onOpenChat}
            unreadChatCount={unreadChatCount}
            isVoiceEnabled={isVoiceEnabled}
            isVoiceMuted={isVoiceMuted}
            voiceParticipants={voiceParticipants}
            voiceError={voiceError}
            onVoiceToggle={onVoiceToggle}
            onVoiceMuteToggle={onVoiceMuteToggle}
            onOpenLeaderboard={onOpenLeaderboard}
            onOpenAchievements={onOpenAchievements}
            onOpenFriends={onOpenFriends}
            pendingFriendRequestsCount={pendingFriendRequestsCount}
            onOpenSideBets={onOpenSideBets}
            openSideBetsCount={openSideBetsCount}
            onOpenTutorial={() => setTutorialProgressOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            beginnerMode={beginnerMode}
            mobile
          />
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        botCount={botCount}
        onOpenBotManagement={onOpenBotManagement}
        onLeaveGame={onLeaveGame}
        onOpenRules={onOpenRules}
        isSpectator={isSpectator}
        connectionStats={connectionStats}
      />

      {/* Tutorial Progress Modal */}
      {beginnerMode && (
        <TutorialProgressModal
          isOpen={tutorialProgressOpen}
          onClose={() => setTutorialProgressOpen(false)}
        />
      )}
    </div>
  );
}
