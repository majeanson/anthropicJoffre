/**
 * VoiceRoom - Global voice chat for the lounge
 *
 * A persistent voice channel where anyone in the lounge can chat.
 * Shows who's in the room and their speaking status with visual polish.
 */

import { LoungeVoiceParticipant } from '../../types/game';
import { Button } from '../ui/Button';

interface VoiceRoomProps {
  playerName: string;
  participants: LoungeVoiceParticipant[];
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onToggleMute: () => void;
  isInVoice: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  error: string | null;
}

export function VoiceRoom({
  playerName,
  participants,
  onJoinVoice,
  onLeaveVoice,
  onToggleMute,
  isInVoice,
  isConnecting,
  isMuted,
  error,
}: VoiceRoomProps) {
  const speakingCount = participants.filter(p => p.isSpeaking).length;

  return (
    <div className={`
      rounded-xl border-2 overflow-hidden transition-all duration-300
      ${isInVoice
        ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/50'
        : 'bg-skin-secondary border-skin-default'
      }
    `}>
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
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">
              Connected
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

                {/* Speaking indicator bars */}
                {p.isSpeaking && (
                  <div className="flex gap-0.5 items-end h-4">
                    {[1, 2, 3].map((bar) => (
                      <div
                        key={bar}
                        className="w-1 bg-green-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 12 + 4}px`,
                          animationDelay: `${bar * 100}ms`,
                        }}
                      />
                    ))}
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
        <div className="flex gap-2">
          {isInVoice ? (
            <>
              <Button
                variant={isMuted ? 'danger' : 'success'}
                size="md"
                onClick={onToggleMute}
                className="flex-1"
                leftIcon={<span>{isMuted ? '🔇' : '🎤'}</span>}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={onLeaveVoice}
                className="flex-1"
              >
                Leave
              </Button>
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
