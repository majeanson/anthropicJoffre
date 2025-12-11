/**
 * HeaderActions Component
 *
 * Group of action buttons for the game header.
 * Handles desktop (with labels) and mobile (icons only) variants.
 */

import { memo } from 'react';
import { HeaderActionButton } from '../ui';
import { VoiceParticipant } from '../../types/game';

interface HeaderActionsProps {
  /** Chat handlers */
  onOpenChat?: () => void;
  unreadChatCount?: number;
  /** Voice chat */
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  voiceError?: string | null;
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
  /** Other features */
  onOpenLeaderboard?: () => void;
  onOpenAchievements?: () => void;
  onOpenFriends?: () => void;
  pendingFriendRequestsCount?: number;
  onOpenSideBets?: () => void;
  openSideBetsCount?: number;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  /** Settings */
  onOpenTutorial?: () => void;
  onOpenSettings: () => void;
  beginnerMode?: boolean;
  /** Mobile variant */
  mobile?: boolean;
}

function HeaderActionsComponent({
  onOpenChat,
  unreadChatCount = 0,
  isVoiceEnabled = false,
  isVoiceMuted = false,
  voiceParticipants = [],
  voiceError,
  onVoiceToggle,
  onVoiceMuteToggle,
  onOpenLeaderboard,
  onOpenAchievements,
  onOpenFriends,
  pendingFriendRequestsCount = 0,
  onOpenSideBets,
  openSideBetsCount = 0,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onOpenTutorial,
  onOpenSettings,
  beginnerMode = false,
  mobile = false,
}: HeaderActionsProps) {
  if (mobile) {
    return (
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

        {onVoiceToggle && (
          <HeaderActionButton
            onClick={onVoiceToggle}
            icon={isVoiceEnabled ? (isVoiceMuted ? '🔇' : '🎙️') : '🎤'}
            badgeCount={isVoiceEnabled ? voiceParticipants.length : undefined}
            title={isVoiceEnabled ? `Voice (${voiceParticipants.length})` : 'Voice'}
            size="sm"
            className="p-1.5"
          />
        )}

        {isVoiceEnabled && onVoiceMuteToggle && (
          <HeaderActionButton
            onClick={onVoiceMuteToggle}
            icon={isVoiceMuted ? '🔇' : '🔊'}
            title={isVoiceMuted ? 'Unmute' : 'Mute'}
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

        {beginnerMode && onOpenTutorial && (
          <HeaderActionButton
            onClick={onOpenTutorial}
            icon="📚"
            title="Tutorial Progress"
            size="sm"
            className="p-1.5"
          />
        )}

        <HeaderActionButton
          onClick={onOpenSettings}
          icon="⚙️"
          title="Settings"
          size="sm"
          className="p-1.5"
        />
      </div>
    );
  }

  return (
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

      {onVoiceToggle && (
        <HeaderActionButton
          onClick={onVoiceToggle}
          icon={isVoiceEnabled ? (isVoiceMuted ? '🔇' : '🎙️') : '🎤'}
          label={isVoiceEnabled ? (isVoiceMuted ? 'Muted' : 'Voice') : 'Voice'}
          badgeCount={isVoiceEnabled ? voiceParticipants.length : undefined}
          title={
            isVoiceEnabled
              ? `Voice Chat (${voiceParticipants.length} in call)${voiceError ? ` - ${voiceError}` : ''}`
              : 'Join Voice Chat'
          }
          testId="header-voice-button"
        />
      )}

      {isVoiceEnabled && onVoiceMuteToggle && (
        <HeaderActionButton
          onClick={onVoiceMuteToggle}
          icon={isVoiceMuted ? '🔇' : '🔊'}
          label={isVoiceMuted ? 'Unmute' : 'Mute'}
          title={isVoiceMuted ? 'Unmute microphone' : 'Mute microphone'}
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

      {beginnerMode && onOpenTutorial && (
        <HeaderActionButton
          onClick={onOpenTutorial}
          icon="📚"
          label="Tutorials"
          title="Tutorial Progress"
          testId="header-tutorial-button"
        />
      )}

      <HeaderActionButton
        onClick={onOpenSettings}
        icon="⚙️"
        label="Settings"
        title="Settings"
        testId="header-settings-button"
      />
    </div>
  );
}

export const HeaderActions = memo(HeaderActionsComponent);
