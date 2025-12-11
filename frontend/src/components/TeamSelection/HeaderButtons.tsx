/**
 * HeaderButtons Component
 *
 * Top-left action buttons: Leave, Find Players, Voice Chat controls.
 */

import { memo, RefObject } from 'react';
import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';
import { VoiceParticipant } from '../../types/game';

interface HeaderButtonsProps {
  /** Callback when leave game is clicked */
  onLeaveGame?: () => void;
  /** Callback to toggle social sidebar */
  onToggleSocialSidebar: () => void;
  /** Voice chat props */
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
  /** Ref for leave button (keyboard navigation) */
  leaveButtonRef?: RefObject<HTMLButtonElement>;
}

function HeaderButtonsComponent({
  onLeaveGame,
  onToggleSocialSidebar,
  isVoiceEnabled = false,
  isVoiceMuted = false,
  voiceParticipants = [],
  onVoiceToggle,
  onVoiceMuteToggle,
  leaveButtonRef,
}: HeaderButtonsProps) {
  return (
    <div className="absolute top-4 left-4 flex gap-2 z-10">
      {onLeaveGame && (
        <Button
          ref={leaveButtonRef}
          onClick={() => {
            sounds.buttonClick();
            onLeaveGame();
          }}
          variant="danger"
          size="sm"
          title="Leave Game"
        >
          🚪 Leave
        </Button>
      )}
      <Button
        onClick={() => {
          sounds.buttonClick();
          onToggleSocialSidebar();
        }}
        variant="success"
        size="sm"
        title="Find players to invite"
      >
        👥 Find Players
      </Button>
      {/* Voice Chat Buttons */}
      {onVoiceToggle && (
        <Button
          onClick={() => {
            sounds.buttonClick();
            onVoiceToggle();
          }}
          variant={isVoiceEnabled ? 'success' : 'secondary'}
          size="sm"
          title={
            isVoiceEnabled
              ? `Voice Chat (${voiceParticipants.length} in call)`
              : 'Join Voice Chat'
          }
        >
          {isVoiceEnabled ? (isVoiceMuted ? '🔇' : '🎙️') : '🎤'} Voice
          {isVoiceEnabled && ` (${voiceParticipants.length})`}
        </Button>
      )}
      {isVoiceEnabled && onVoiceMuteToggle && (
        <Button
          onClick={() => {
            sounds.buttonClick();
            onVoiceMuteToggle();
          }}
          variant={isVoiceMuted ? 'warning' : 'secondary'}
          size="sm"
          title={isVoiceMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isVoiceMuted ? '🔇 Unmute' : '🔊 Mute'}
        </Button>
      )}
    </div>
  );
}

export const HeaderButtons = memo(HeaderButtonsComponent);
