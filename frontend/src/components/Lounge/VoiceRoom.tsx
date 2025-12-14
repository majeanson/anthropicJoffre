/**
 * VoiceRoom - Global voice chat for the lounge
 *
 * A persistent voice channel where anyone in the lounge can chat.
 * Shows who's in the room and their speaking status with visual polish.
 * Supports push-to-talk (PTT) mode.
 *
 * Accessibility: Uses ARIA live regions to announce participant changes
 * for screen reader users.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { LoungeVoiceParticipant } from '../../types/game';
import { Button } from '../ui/Button';

interface VoiceRoomProps {
  playerName: string;
  participants: LoungeVoiceParticipant[];
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  onToggleDeafen?: () => void;
  isInVoice: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened?: boolean;
  error: string | null;
  // Push-to-talk
  isPushToTalk?: boolean;
  onTogglePushToTalk?: () => void;
  pttActive?: boolean;
  onSetPttActive?: (active: boolean) => void;
  // Volume control
  participantVolumes?: Map<string, number>;
  onSetParticipantVolume?: (playerName: string, volume: number) => void;
}

export function VoiceRoom({
  playerName,
  participants,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  onToggleDeafen,
  isInVoice,
  isConnecting,
  isMuted,
  isDeafened = false,
  error,
  isPushToTalk = false,
  onTogglePushToTalk,
  pttActive = false,
  onSetPttActive,
  participantVolumes,
  onSetParticipantVolume,
}: VoiceRoomProps) {
  const speakingCount = participants.filter(p => p.isSpeaking).length;

  // ARIA live region announcement for screen readers
  const [announcement, setAnnouncement] = useState('');
  const prevParticipantsRef = useRef<string[]>([]);

  // Track participant changes and announce them
  useEffect(() => {
    const currentNames = participants.map(p => p.playerName);
    const prevNames = prevParticipantsRef.current;

    // Find who joined
    const joined = currentNames.filter(name => !prevNames.includes(name));
    // Find who left
    const left = prevNames.filter(name => !currentNames.includes(name));

    // Only announce after initial load (when prevNames isn't empty)
    if (prevNames.length > 0 || currentNames.length > 0) {
      if (joined.length > 0) {
        setAnnouncement(`${joined.join(', ')} joined voice chat`);
      } else if (left.length > 0) {
        setAnnouncement(`${left.join(', ')} left voice chat`);
      }
    }

    prevParticipantsRef.current = currentNames;
  }, [participants]);

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  // Keyboard listener for spacebar PTT
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPushToTalk || !isInVoice || !onSetPttActive) return;
    // Only trigger if not typing in an input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      onSetPttActive(true);
    }
  }, [isPushToTalk, isInVoice, onSetPttActive]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isPushToTalk || !isInVoice || !onSetPttActive) return;
    if (e.code === 'Space') {
      e.preventDefault();
      onSetPttActive(false);
    }
  }, [isPushToTalk, isInVoice, onSetPttActive]);

  // Attach keyboard listeners when in PTT mode
  useEffect(() => {
    if (!isPushToTalk || !isInVoice) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk, isInVoice, handleKeyDown, handleKeyUp]);

  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all duration-300
      ${isInVoice
        ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/50'
        : 'bg-skin-secondary border-skin-default'
      }
    `}>
      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Header */}
      <div className={`
        px-4 py-3 border-b
        ${isInVoice
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-skin-tertiary/50 border-skin-default'
        }
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="text-xl">🎙️</span>
              {isInVoice && (
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-display text-skin-primary text-sm uppercase tracking-wider">
                Voice Room
              </h3>
              <p className="text-xs text-skin-muted">
                {participants.length === 0 && 'Empty'}
                {participants.length === 1 && '1 person'}
                {participants.length > 1 && `${participants.length} people`}
                {speakingCount > 0 && (
                  <span className="text-green-400 ml-1">
                    • {speakingCount} speaking
                  </span>
                )}
              </p>
            </div>
          </div>
          {isInVoice && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isDeafened
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {isDeafened ? '🔕 Deafened' : 'Connected'}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Participants */}
        {participants.length > 0 ? (
          <div className="space-y-2 mb-4 max-h-[180px] overflow-y-auto">
            {participants.map((p) => (
              <div
                key={p.socketId}
                className={`
                  flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200
                  ${p.isSpeaking
                    ? 'bg-green-500/20 ring-2 ring-green-500/50 scale-[1.02]'
                    : 'bg-skin-tertiary hover:bg-skin-primary/50'
                  }
                `}
              >
                {/* Avatar with speaking ring */}
                <div className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center
                  ${p.playerName === playerName
                    ? 'bg-skin-accent text-skin-inverse'
                    : 'bg-skin-muted text-skin-secondary'
                  }
                  ${p.isSpeaking ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-skin-tertiary' : ''}
                `}>
                  <span className="text-xs font-bold">
                    {p.playerName.slice(0, 2).toUpperCase()}
                  </span>
                  {/* Muted badge */}
                  {p.isMuted && (
                    <span className="
                      absolute -bottom-1 -right-1
                      w-4 h-4 rounded-full
                      bg-red-500 text-white text-[10px]
                      flex items-center justify-center
                    ">
                      🔇
                    </span>
                  )}
                </div>

                {/* Name and status */}
                <div className="flex-1 min-w-0">
                  <span className={`
                    text-sm truncate block
                    ${p.playerName === playerName ? 'text-skin-accent font-medium' : 'text-skin-primary'}
                  `}>
                    {p.playerName}
                    {p.playerName === playerName && (
                      <span className="text-xs text-skin-muted ml-1">(you)</span>
                    )}
                  </span>
                  {p.isSpeaking && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Speaking...
                    </span>
                  )}
                </div>

                {/* Speaking indicator bars - animated voice activity visualization */}
                {p.isSpeaking && (
                  <div className="flex gap-0.5 items-end h-4">
                    {[
                      { baseHeight: 6, delay: 0 },
                      { baseHeight: 12, delay: 100 },
                      { baseHeight: 8, delay: 200 },
                    ].map((bar, idx) => (
                      <div
                        key={idx}
                        className="w-1 bg-green-500 rounded-full"
                        style={{
                          height: `${bar.baseHeight}px`,
                          animation: 'voiceBar 0.4s ease-in-out infinite alternate',
                          animationDelay: `${bar.delay}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Volume control for other participants (not self) */}
                {p.playerName !== playerName && onSetParticipantVolume && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-skin-muted">🔊</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(participantVolumes?.get(p.playerName) ?? 1) * 100}
                      onChange={(e) => {
                        onSetParticipantVolume(p.playerName, parseInt(e.target.value) / 100);
                      }}
                      className="w-16 h-1 bg-skin-tertiary rounded-lg appearance-none cursor-pointer accent-green-500"
                      title={`Volume: ${Math.round((participantVolumes?.get(p.playerName) ?? 1) * 100)}%`}
                      aria-label={`Volume for ${p.playerName}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 mb-4">
            <div className="
              w-16 h-16 mx-auto mb-3 rounded-2xl
              bg-gradient-to-br from-skin-tertiary to-skin-primary
              flex items-center justify-center
              border-2 border-dashed border-skin-default
            ">
              <span className="text-3xl opacity-40">🔇</span>
            </div>
            <p className="text-sm text-skin-primary mb-1">Voice room is empty</p>
            <p className="text-xs text-skin-muted">Join to start chatting!</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="space-y-2">
          {isInVoice ? (
            <>
              {/* PTT Mode Controls */}
              {isPushToTalk ? (
                <div className="space-y-2">
                  {/* PTT Button - hold to talk */}
                  <button
                    onMouseDown={() => onSetPttActive?.(true)}
                    onMouseUp={() => onSetPttActive?.(false)}
                    onMouseLeave={() => onSetPttActive?.(false)}
                    onTouchStart={() => onSetPttActive?.(true)}
                    onTouchEnd={() => onSetPttActive?.(false)}
                    className={`
                      w-full py-4 rounded-xl font-bold text-lg transition-all
                      select-none touch-manipulation
                      ${pttActive
                        ? 'bg-green-500 text-white scale-[1.02] shadow-lg shadow-green-500/30'
                        : 'bg-skin-tertiary text-skin-primary hover:bg-skin-primary'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">{pttActive ? '🎤' : '🔇'}</span>
                      <span>{pttActive ? 'Speaking...' : 'Hold to Talk'}</span>
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      or hold Spacebar
                    </div>
                  </button>
                  {/* Mode switch and Leave */}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onTogglePushToTalk}
                      className="flex-1"
                    >
                      Switch to Open Mic
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLeaveVoice}
                      className="flex-1"
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              ) : (
                /* Open Mic Mode Controls */
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={isMuted ? 'danger' : 'success'}
                    size="md"
                    onClick={onToggleMute}
                    className="flex-1 min-w-[80px]"
                    leftIcon={<span>{isMuted ? '🔇' : '🎤'}</span>}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                  {onToggleDeafen && (
                    <Button
                      variant={isDeafened ? 'warning' : 'secondary'}
                      size="md"
                      onClick={onToggleDeafen}
                      title={isDeafened ? 'Undeafen (hear others)' : 'Deafen (mute all incoming audio)'}
                      leftIcon={<span>{isDeafened ? '🔕' : '🔔'}</span>}
                    >
                      {isDeafened ? 'Deaf' : ''}
                    </Button>
                  )}
                  {onTogglePushToTalk && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={onTogglePushToTalk}
                      title="Enable Push-to-Talk"
                    >
                      PTT
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={onLeaveVoice}
                  >
                    Leave
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={onJoinVoice}
              fullWidth
              disabled={isConnecting}
              leftIcon={<span>{isConnecting ? '⏳' : '🎤'}</span>}
            >
              {isConnecting ? 'Connecting...' : 'Join Voice Chat'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceRoom;
