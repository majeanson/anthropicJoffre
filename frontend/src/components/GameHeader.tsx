/**
 * GameHeader Component - Multi-Skin Edition
 *
 * Game header with scores, round info, and action buttons.
 * Uses CSS variables for skin compatibility.
 */

import { useState, useRef, useEffect } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { TutorialProgressModal } from './TutorialProgressModal';
import { HeaderActionButton, Button } from './ui';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { CardColor, VoiceParticipant } from '../types/game';
import { useCountUp } from '../hooks/useCountUp';
import { useSettings } from '../contexts/SettingsContext';
import logger from '../utils/logger';

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

  // Score change animation state
  const prevTeam1ScoreRef = useRef(team1Score);
  const prevTeam2ScoreRef = useRef(team2Score);
  const [team1ScoreChange, setTeam1ScoreChange] = useState<number | null>(null);
  const [team2ScoreChange, setTeam2ScoreChange] = useState<number | null>(null);
  const [team1Flash, setTeam1Flash] = useState<'green' | 'red' | null>(null);
  const [team2Flash, setTeam2Flash] = useState<'green' | 'red' | null>(null);

  // Animated score values
  const animatedTeam1Score = useCountUp(team1Score, 500);
  const animatedTeam2Score = useCountUp(team2Score, 500);

  // Detect score changes and trigger animations
  useEffect(() => {
    const team1Change = team1Score - prevTeam1ScoreRef.current;
    const team2Change = team2Score - prevTeam2ScoreRef.current;

    if (team1Change !== 0) {
      setTeam1ScoreChange(team1Change);
      setTeam1Flash(team1Change > 0 ? 'green' : 'red');
      setTimeout(() => setTeam1Flash(null), 500);
      setTimeout(() => setTeam1ScoreChange(null), 1500);
    }

    if (team2Change !== 0) {
      setTeam2ScoreChange(team2Change);
      setTeam2Flash(team2Change > 0 ? 'green' : 'red');
      setTimeout(() => setTeam2Flash(null), 500);
      setTimeout(() => setTeam2ScoreChange(null), 1500);
    }

    prevTeam1ScoreRef.current = team1Score;
    prevTeam2ScoreRef.current = team2Score;
  }, [team1Score, team2Score]);

  // Helper to get trump color using CSS variables for skin compatibility
  const getTrumpColorStyle = (color: CardColor | null | undefined): React.CSSProperties => {
    if (!color) return { backgroundColor: 'var(--color-text-muted)' };
    const colorMap: Record<CardColor, string> = {
      red: 'var(--color-suit-red)',
      brown: 'var(--color-suit-brown)',
      green: 'var(--color-suit-green)',
      blue: 'var(--color-suit-blue)'
    };
    return { backgroundColor: colorMap[color] };
  };

  const getTrumpColorName = (color: CardColor | null | undefined): string => {
    if (!color) return '?';
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

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
    <div
      className="border-b-2 shadow-lg z-40 relative overflow-visible"
      style={{
        background: 'linear-gradient(to right, var(--color-bg-secondary), var(--color-bg-tertiary))',
        borderColor: 'var(--color-border-accent)',
      }}
    >
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
            <p
              className="text-xs font-mono font-bold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {linkCopied ? '✓ Copied!' : gameId}
            </p>
          </Button>

          <div
            className="px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <p
              className="text-xs font-bold"
              style={{ color: 'var(--color-text-primary)' }}
              data-testid="round-number"
            >
              R{roundNumber}
            </p>
          </div>

          {/* Bet and Trump Display */}
          {(highestBet || trump) && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              {highestBet && (
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Bet:</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{highestBet.amount}</span>
                  {highestBet.withoutTrump && (
                    <span className="text-xs font-bold" style={{ color: 'var(--color-warning)' }} title="Without Trump">!</span>
                  )}
                </div>
              )}
              {highestBet && trump && <span style={{ color: 'var(--color-text-muted)' }}>|</span>}
              {trump && (
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Trump:</span>
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={getTrumpColorStyle(trump)}
                    title={getTrumpColorName(trump)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Team Scores */}
          <div className="flex items-center gap-1" data-testid="team-scores">
            <span className="sr-only">Team 1: {team1Score} Team 2: {team2Score}</span>

            {/* Team 1 Score */}
            <div
              className={`relative px-2 py-1 rounded-[var(--radius-md)] shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${
                team1Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''
              } ${team1Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}
              style={{
                backgroundColor: 'var(--color-team1-primary)',
                boxShadow: bettingTeamId === 1 ? '0 0 0 2px var(--color-warning), 0 0 10px var(--color-warning)' : undefined,
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--color-team1-text)', opacity: 0.9 }}>T1</p>
              <p className="text-base font-black" style={{ color: 'var(--color-team1-text)' }}>{animatedTeam1Score}</p>
              {team1ScoreChange !== null && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap z-[9999]">
                  <span style={{ color: team1ScoreChange > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {team1ScoreChange > 0 ? '+' : ''}{team1ScoreChange}
                  </span>
                </div>
              )}
            </div>

            <div className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>:</div>

            {/* Team 2 Score */}
            <div
              className={`relative px-2 py-1 rounded-[var(--radius-md)] shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${
                team2Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''
              } ${team2Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}
              style={{
                backgroundColor: 'var(--color-team2-primary)',
                boxShadow: bettingTeamId === 2 ? '0 0 0 2px var(--color-warning), 0 0 10px var(--color-warning)' : undefined,
              }}
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--color-team2-text)', opacity: 0.9 }}>T2</p>
              <p className="text-base font-black" style={{ color: 'var(--color-team2-text)' }}>{animatedTeam2Score}</p>
              {team2ScoreChange !== null && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap z-[9999]">
                  <span style={{ color: team2ScoreChange > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {team2ScoreChange > 0 ? '+' : ''}{team2ScoreChange}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenChat && (
              <HeaderActionButton
                onClick={onOpenChat}
                icon="💬"
                label="Chat"
                badgeCount={unreadChatCount}
                title="Chat"
                testId="header-chat-button"
              />
            )}

            {/* Voice Chat Button */}
            {onVoiceToggle && (
              <HeaderActionButton
                onClick={onVoiceToggle}
                icon={isVoiceEnabled ? (isVoiceMuted ? "🔇" : "🎙️") : "🎤"}
                label={isVoiceEnabled ? (isVoiceMuted ? "Muted" : "Voice") : "Voice"}
                badgeCount={isVoiceEnabled ? voiceParticipants.length : undefined}
                title={isVoiceEnabled
                  ? `Voice Chat (${voiceParticipants.length} in call)${voiceError ? ` - ${voiceError}` : ''}`
                  : "Join Voice Chat"
                }
                testId="header-voice-button"
              />
            )}

            {/* Mute Button - only when voice enabled */}
            {isVoiceEnabled && onVoiceMuteToggle && (
              <HeaderActionButton
                onClick={onVoiceMuteToggle}
                icon={isVoiceMuted ? "🔇" : "🔊"}
                label={isVoiceMuted ? "Unmute" : "Mute"}
                title={isVoiceMuted ? "Unmute microphone" : "Mute microphone"}
                testId="header-mute-button"
              />
            )}

            {onOpenLeaderboard && (
              <HeaderActionButton
                onClick={onOpenLeaderboard}
                icon="🏆"
                label="Stats"
                title="Leaderboard"
                testId="header-leaderboard-button"
              />
            )}

            {onOpenAchievements && (
              <HeaderActionButton
                onClick={onOpenAchievements}
                icon="🏅"
                label="Achievements"
                title="Achievements"
                testId="header-achievements-button"
              />
            )}

            {onOpenFriends && (
              <HeaderActionButton
                onClick={onOpenFriends}
                icon="👥"
                label="Friends"
                badgeCount={pendingFriendRequestsCount}
                title="Friends"
                testId="header-friends-button"
              />
            )}

            {onOpenSideBets && (
              <HeaderActionButton
                onClick={onOpenSideBets}
                icon="🎲"
                label="Bets"
                badgeCount={openSideBetsCount}
                title="Side Bets"
                testId="header-sidebets-button"
              />
            )}

            {onOpenNotifications && (
              <HeaderActionButton
                onClick={onOpenNotifications}
                icon="🔔"
                label="Notifications"
                badgeCount={unreadNotificationsCount}
                title="Notifications"
                testId="header-notifications-button"
              />
            )}

            {beginnerMode && (
              <HeaderActionButton
                onClick={() => setTutorialProgressOpen(true)}
                icon="📚"
                label="Tutorials"
                title="Tutorial Progress"
                testId="header-tutorial-button"
              />
            )}

            <HeaderActionButton
              onClick={() => setSettingsOpen(true)}
              icon="⚙️"
              label="Settings"
              title="Settings"
              testId="header-settings-button"
            />
          </div>
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
              <p className="text-xs font-mono font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                {linkCopied ? '✓' : gameId}
              </p>
            </Button>

            <div
              className="px-2 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0"
              style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>R{roundNumber}</p>
            </div>

            {/* Mobile Bet and Trump Display */}
            {(highestBet || trump) && (
              <div
                className="flex items-center gap-0.5 px-1.5 py-1 rounded-[var(--radius-md)] backdrop-blur-sm flex-shrink-0"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                {highestBet && (
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {highestBet.amount}{highestBet.withoutTrump ? '!' : ''}
                  </span>
                )}
                {trump && (
                  <div className="w-2.5 h-2.5 rounded-sm" style={getTrumpColorStyle(trump)} />
                )}
              </div>
            )}

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              {/* Team 1 Score Mobile */}
              <div
                className={`relative px-2 py-1 rounded-[var(--radius-md)] shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${
                  team1Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''
                } ${team1Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}
                style={{
                  backgroundColor: 'var(--color-team1-primary)',
                  boxShadow: bettingTeamId === 1 ? '0 0 0 2px var(--color-warning)' : undefined,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--color-team1-text)', opacity: 0.9 }}>T1</p>
                <p className="text-base font-black" style={{ color: 'var(--color-team1-text)' }}>{animatedTeam1Score}</p>
                {team1ScoreChange !== null && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap z-[9999]">
                    <span style={{ color: team1ScoreChange > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {team1ScoreChange > 0 ? '+' : ''}{team1ScoreChange}
                    </span>
                  </div>
                )}
              </div>

              <div className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--color-text-primary)' }}>:</div>

              {/* Team 2 Score Mobile */}
              <div
                className={`relative px-2 py-1 rounded-[var(--radius-md)] shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${
                  team2Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''
                } ${team2Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}
                style={{
                  backgroundColor: 'var(--color-team2-primary)',
                  boxShadow: bettingTeamId === 2 ? '0 0 0 2px var(--color-warning)' : undefined,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--color-team2-text)', opacity: 0.9 }}>T2</p>
                <p className="text-base font-black" style={{ color: 'var(--color-team2-text)' }}>{animatedTeam2Score}</p>
                {team2ScoreChange !== null && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap z-[9999]">
                    <span style={{ color: team2ScoreChange > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                      {team2ScoreChange > 0 ? '+' : ''}{team2ScoreChange}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {onOpenChat && (
              <HeaderActionButton
                onClick={onOpenChat}
                icon="💬"
                badgeCount={unreadChatCount}
                title="Chat"
                size="sm"
                className="p-1.5"
              />
            )}

            {/* Voice Chat Button - Mobile */}
            {onVoiceToggle && (
              <HeaderActionButton
                onClick={onVoiceToggle}
                icon={isVoiceEnabled ? (isVoiceMuted ? "🔇" : "🎙️") : "🎤"}
                badgeCount={isVoiceEnabled ? voiceParticipants.length : undefined}
                title={isVoiceEnabled ? `Voice (${voiceParticipants.length})` : "Voice"}
                size="sm"
                className="p-1.5"
              />
            )}

            {/* Mute Button - Mobile (only when voice enabled) */}
            {isVoiceEnabled && onVoiceMuteToggle && (
              <HeaderActionButton
                onClick={onVoiceMuteToggle}
                icon={isVoiceMuted ? "🔇" : "🔊"}
                title={isVoiceMuted ? "Unmute" : "Mute"}
                size="sm"
                className="p-1.5"
              />
            )}

            {onOpenLeaderboard && (
              <HeaderActionButton
                onClick={onOpenLeaderboard}
                icon="🏆"
                title="Leaderboard"
                size="sm"
                className="p-1.5"
              />
            )}

            {onOpenAchievements && (
              <HeaderActionButton
                onClick={onOpenAchievements}
                icon="🏅"
                title="Achievements"
                size="sm"
                className="p-1.5"
              />
            )}

            {onOpenFriends && (
              <HeaderActionButton
                onClick={onOpenFriends}
                icon="👥"
                badgeCount={pendingFriendRequestsCount}
                title="Friends"
                size="sm"
                className="p-1.5"
              />
            )}

            {onOpenSideBets && (
              <HeaderActionButton
                onClick={onOpenSideBets}
                icon="🎲"
                badgeCount={openSideBetsCount}
                title="Side Bets"
                size="sm"
                className="p-1.5"
              />
            )}

            {beginnerMode && (
              <HeaderActionButton
                onClick={() => setTutorialProgressOpen(true)}
                icon="📚"
                title="Tutorial Progress"
                size="sm"
                className="p-1.5"
              />
            )}

            <HeaderActionButton
              onClick={() => setSettingsOpen(true)}
              icon="⚙️"
              title="Settings"
              size="sm"
              className="p-1.5"
            />
          </div>
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
