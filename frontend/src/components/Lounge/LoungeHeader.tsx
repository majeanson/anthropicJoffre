/**
 * LoungeHeader - Top bar for the lounge
 *
 * Shows branding, user info, quick voice access, and settings.
 * Includes back button to return to main lobby.
 */

import { useState, useRef, useEffect } from 'react';
import { User } from '../../types/auth';
import { LoungePlayer, LoungeVoiceParticipant } from '../../types/game';
import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';

interface PendingInvite {
  tableId: string;
  tableName: string;
  hostName: string;
  inviterName: string;
  receivedAt: number;
}

interface LoungeHeaderProps {
  user: User | null;
  playerName: string;
  onlinePlayers: LoungePlayer[];
  voiceParticipants: LoungeVoiceParticipant[];
  isInVoice: boolean;
  onJoinVoice: () => void;
  onShowLogin: () => void;
  onShowRegister: () => void;
  onViewProfile: (playerName: string) => void;
  onBackToLobby?: () => void;
  pendingInvites?: PendingInvite[];
  onAcceptInvite?: (tableId: string) => void;
  onDismissInvite?: (tableId: string) => void;
}

export function LoungeHeader({
  user,
  playerName,
  onlinePlayers,
  voiceParticipants,
  isInVoice,
  onJoinVoice,
  onShowLogin,
  onShowRegister,
  onViewProfile,
  onBackToLobby,
  pendingInvites = [],
  onAcceptInvite,
  onDismissInvite,
}: LoungeHeaderProps) {
  const [showInvitesDropdown, setShowInvitesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowInvitesDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-skin-secondary border-b-2 border-skin-default px-4 py-3 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        {/* Left: Back button + Branding */}
        <div className="flex items-center gap-3">
          {onBackToLobby && (
            <button
              onClick={() => {
                onBackToLobby();
                sounds.buttonClick();
              }}
              className="
                p-2 rounded-lg
                bg-skin-tertiary hover:bg-skin-primary
                text-skin-secondary hover:text-skin-primary
                transition-colors
                hidden md:flex items-center gap-1
              "
              title="Back to Lobby"
            >
              <span className="text-lg">←</span>
              <span className="text-sm">Lobby</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-3xl">🎴</span>
              {/* Animated glow effect */}
              <div className="absolute inset-0 animate-pulse opacity-50 blur-sm">
                <span className="text-3xl">🎴</span>
              </div>
            </div>
            <div>
              <h1 className="font-display text-skin-primary text-xl uppercase tracking-wider">
                Jaffre Lounge
              </h1>
              <p className="text-xs text-skin-muted flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {onlinePlayers.length} player{onlinePlayers.length !== 1 ? 's' : ''} online
              </p>
            </div>
          </div>
        </div>

        {/* Center: Voice indicator (desktop only) */}
        <div className="hidden md:flex items-center gap-2">
          {voiceParticipants.length > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30">
              <span className="text-green-500 animate-pulse">🎙️</span>
              <span className="text-sm text-skin-primary font-medium">
                {voiceParticipants.length} in voice
              </span>
              {!isInVoice && (
                <Button variant="success" size="xs" onClick={onJoinVoice}>
                  Join
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-skin-tertiary text-skin-muted">
              <span>🎙️</span>
              <span className="text-sm">Voice room empty</span>
              <Button variant="ghost" size="xs" onClick={onJoinVoice}>
                Start
              </Button>
            </div>
          )}
        </div>

        {/* Right: Invites + User info */}
        <div className="flex items-center gap-3">
          {/* Pending Invites Indicator */}
          {pendingInvites.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setShowInvitesDropdown(!showInvitesDropdown);
                  sounds.buttonClick();
                }}
                className="
                  relative p-2 rounded-lg
                  bg-skin-tertiary hover:bg-skin-primary
                  text-skin-primary
                  transition-colors
                "
                title={`${pendingInvites.length} pending invite${pendingInvites.length !== 1 ? 's' : ''}`}
              >
                <span className="text-xl">📨</span>
                <span className="
                  absolute -top-1 -right-1
                  min-w-[18px] h-[18px] px-1
                  bg-red-500 text-white
                  text-xs font-bold
                  rounded-full
                  flex items-center justify-center
                  animate-pulse
                ">
                  {pendingInvites.length}
                </span>
              </button>

              {/* Dropdown */}
              {showInvitesDropdown && (
                <div className="
                  absolute right-0 top-full mt-2
                  w-72 max-h-80 overflow-y-auto
                  bg-skin-secondary border border-skin-default
                  rounded-xl shadow-xl
                  z-50
                ">
                  <div className="p-3 border-b border-skin-default">
                    <h3 className="font-medium text-skin-primary text-sm">
                      Table Invites
                    </h3>
                  </div>
                  <div className="divide-y divide-skin-default">
                    {pendingInvites.map((invite) => (
                      <div key={invite.tableId} className="p-3 hover:bg-skin-tertiary transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-skin-primary truncate">
                              {invite.tableName}
                            </p>
                            <p className="text-xs text-skin-muted">
                              From {invite.inviterName}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="success"
                              size="xs"
                              onClick={() => {
                                onAcceptInvite?.(invite.tableId);
                                setShowInvitesDropdown(false);
                              }}
                            >
                              Join
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => onDismissInvite?.(invite.tableId)}
                              title="Dismiss"
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <button
              onClick={() => onViewProfile(playerName)}
              className="
                flex items-center gap-2 px-3 py-2 rounded-xl
                bg-gradient-to-r from-skin-tertiary to-skin-secondary
                hover:from-skin-primary hover:to-skin-tertiary
                border border-skin-default
                transition-all duration-200
                group
              "
            >
              <div className="
                w-9 h-9 rounded-full
                bg-gradient-to-br from-skin-accent to-skin-accent/70
                flex items-center justify-center
                text-skin-inverse font-bold text-sm
                ring-2 ring-skin-accent/30
                group-hover:ring-skin-accent/50
                transition-all
              ">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-skin-primary">
                  {user.username}
                </div>
                <div className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Online
                </div>
              </div>
            </button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onShowLogin}>
                Login
              </Button>
              <Button variant="primary" size="sm" onClick={onShowRegister}>
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default LoungeHeader;
