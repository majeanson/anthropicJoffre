/**
 * LoungeHeader - Top bar for the lounge
 *
 * Shows branding, user info, quick voice access, and settings.
 * Includes back button to return to main lobby.
 */

import { useState, useRef, useEffect } from 'react';
import { User } from '../../types/auth';
import { LoungePlayer, LoungeVoiceParticipant, PlayerStatus } from '../../types/game';
import { Button } from '../ui/Button';
import { sounds } from '../../utils/sounds';

// Status configuration for display
const statusConfig: Record<PlayerStatus, { icon: string; label: string; color: string }> = {
  in_lounge: { icon: '●', label: 'Available', color: 'text-green-500' },
  at_table: { icon: '◆', label: 'At Table', color: 'text-blue-500' },
  playing: { icon: '▶', label: 'Playing', color: 'text-purple-500' },
  spectating: { icon: '◎', label: 'Spectating', color: 'text-yellow-500' },
  away: { icon: '◯', label: 'Away', color: 'text-gray-500' },
  looking_for_game: { icon: '★', label: 'Looking for Game', color: 'text-orange-500' },
};

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
  /** Current player status */
  currentStatus?: PlayerStatus;
  /** Whether the user is auto-away (vs manually set) */
  isAutoAway?: boolean;
  /** Set manual away status */
  onSetAway?: () => void;
  /** Clear away status and return to available */
  onClearAway?: () => void;
  /** Set status to looking for game */
  onSetLookingForGame?: () => void;
  /** Current status message */
  currentStatusMessage?: string;
  /** Set status with optional message */
  onSetStatusWithMessage?: (status: PlayerStatus, message?: string) => void;
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
  currentStatus = 'in_lounge',
  isAutoAway = false,
  onSetAway,
  onClearAway,
  onSetLookingForGame,
  currentStatusMessage,
  onSetStatusWithMessage,
}: LoungeHeaderProps) {
  const [showInvitesDropdown, setShowInvitesDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusMessageInput, setStatusMessageInput] = useState(currentStatusMessage || '');
  const [showMessageInput, setShowMessageInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowInvitesDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync status message input with prop
  useEffect(() => {
    setStatusMessageInput(currentStatusMessage || '');
  }, [currentStatusMessage]);

  // Focus message input when shown
  useEffect(() => {
    if (showMessageInput && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [showMessageInput]);

  // Get current status config
  const status = statusConfig[currentStatus] || statusConfig.in_lounge;
  const canChangeStatus = currentStatus === 'in_lounge' || currentStatus === 'away' || currentStatus === 'looking_for_game';

  // Handle setting status with message
  const handleSetStatus = (newStatus: PlayerStatus) => {
    if (onSetStatusWithMessage) {
      onSetStatusWithMessage(newStatus, statusMessageInput || undefined);
    } else if (newStatus === 'away' && onSetAway) {
      onSetAway();
    } else if (newStatus === 'in_lounge' && onClearAway) {
      onClearAway();
    } else if (newStatus === 'looking_for_game' && onSetLookingForGame) {
      onSetLookingForGame();
    }
    setShowStatusDropdown(false);
    setShowMessageInput(false);
    sounds.buttonClick();
  };

  // Handle saving just the message without changing status
  const handleSaveMessage = () => {
    if (onSetStatusWithMessage) {
      onSetStatusWithMessage(currentStatus, statusMessageInput || undefined);
    }
    setShowMessageInput(false);
    sounds.buttonClick();
  };

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
                min-w-[44px] min-h-[44px] p-2 rounded-lg
                bg-skin-tertiary hover:bg-skin-primary active:scale-95
                text-skin-secondary hover:text-skin-primary
                transition-all
                flex items-center justify-center gap-1
              "
              title="Back to Lobby"
              aria-label="Back to Lobby"
            >
              <span className="text-lg">←</span>
              <span className="text-sm hidden sm:inline">Lobby</span>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowInvitesDropdown(!showInvitesDropdown);
                    sounds.buttonClick();
                  } else if (e.key === 'Escape' && showInvitesDropdown) {
                    setShowInvitesDropdown(false);
                  }
                }}
                className="
                  relative p-2 rounded-lg
                  bg-skin-tertiary hover:bg-skin-primary
                  text-skin-primary
                  transition-colors
                  focus:outline-none focus:ring-2 focus:ring-skin-accent
                "
                title={`${pendingInvites.length} pending invite${pendingInvites.length !== 1 ? 's' : ''}`}
                aria-expanded={showInvitesDropdown}
                aria-haspopup="true"
                aria-label={`${pendingInvites.length} pending table invite${pendingInvites.length !== 1 ? 's' : ''}`}
              >
                <span className="text-xl" role="img" aria-hidden="true">📨</span>
                <span className="
                  absolute -top-1 -right-1
                  min-w-[18px] h-[18px] px-1
                  bg-red-500 text-white
                  text-xs font-bold
                  rounded-full
                  flex items-center justify-center
                  animate-pulse
                " aria-hidden="true">
                  {pendingInvites.length}
                </span>
              </button>

              {/* Dropdown */}
              {showInvitesDropdown && (
                <div
                  className="
                    absolute right-0 top-full mt-2
                    w-72 max-h-80 overflow-y-auto
                    bg-skin-secondary border border-skin-default
                    rounded-xl shadow-xl
                    z-50
                  "
                  role="menu"
                  aria-label="Table invites"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowInvitesDropdown(false);
                    }
                  }}
                >
                  <div className="p-3 border-b border-skin-default">
                    <h3 className="font-medium text-skin-primary text-sm">
                      Table Invites
                    </h3>
                  </div>
                  <div className="divide-y divide-skin-default" role="group">
                    {pendingInvites.map((invite) => (
                      <div key={invite.tableId} className="p-3 hover:bg-skin-tertiary transition-colors" role="menuitem">
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
                              aria-label={`Dismiss invite from ${invite.inviterName}`}
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
            <div className="flex items-center gap-2">
              {/* Status Dropdown */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  onClick={() => {
                    if (canChangeStatus) {
                      setShowStatusDropdown(!showStatusDropdown);
                      sounds.buttonClick();
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl
                    bg-gradient-to-r from-skin-tertiary to-skin-secondary
                    ${canChangeStatus ? 'hover:from-skin-primary hover:to-skin-tertiary cursor-pointer' : 'cursor-default'}
                    border border-skin-default
                    transition-all duration-200
                    group
                  `}
                  title={canChangeStatus ? 'Click to change status' : `Status: ${status.label}`}
                  aria-expanded={showStatusDropdown}
                  aria-haspopup="true"
                >
                  <div className="
                    w-9 h-9 rounded-full
                    bg-gradient-to-br from-skin-accent to-skin-accent/70
                    flex items-center justify-center
                    text-skin-inverse font-bold text-sm
                    ring-2 ring-skin-accent/30
                    group-hover:ring-skin-accent/50
                    transition-all
                    relative
                  ">
                    {user.username.slice(0, 2).toUpperCase()}
                    {/* Status indicator dot */}
                    <span className={`
                      absolute -bottom-0.5 -right-0.5
                      w-3 h-3 rounded-full
                      ${currentStatus === 'away' ? 'bg-gray-500' :
                        currentStatus === 'looking_for_game' ? 'bg-orange-500' :
                        currentStatus === 'playing' ? 'bg-purple-500' :
                        currentStatus === 'at_table' ? 'bg-blue-500' :
                        'bg-green-500'}
                      border-2 border-skin-secondary
                    `} />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium text-skin-primary">
                      {user.username}
                    </div>
                    <div className={`text-xs ${status.color} flex items-center gap-1`}>
                      <span>{status.icon}</span>
                      <span>{currentStatusMessage || status.label}</span>
                      {isAutoAway && currentStatus === 'away' && (
                        <span className="text-skin-muted">(auto)</span>
                      )}
                      {canChangeStatus && <span className="text-skin-muted">▼</span>}
                    </div>
                  </div>
                </button>

                {/* Status dropdown menu */}
                {showStatusDropdown && canChangeStatus && (
                  <div
                    className="
                      absolute right-0 top-full mt-2
                      w-72 bg-skin-secondary border border-skin-default
                      rounded-xl shadow-xl z-50 overflow-hidden
                    "
                    role="menu"
                    aria-label="Set your status"
                  >
                    {/* Status message input section */}
                    <div className="p-3 border-b border-skin-default">
                      <label className="text-xs text-skin-muted uppercase tracking-wider block mb-2">
                        Status Message
                      </label>
                      <div className="flex gap-2">
                        <input
                          ref={messageInputRef}
                          type="text"
                          value={statusMessageInput}
                          onChange={(e) => setStatusMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveMessage();
                            }
                          }}
                          placeholder="What are you up to?"
                          maxLength={100}
                          className="
                            flex-1 px-3 py-2 text-sm
                            bg-skin-tertiary border border-skin-default rounded-lg
                            text-skin-primary placeholder-skin-muted
                            focus:outline-none focus:ring-2 focus:ring-skin-accent
                          "
                        />
                        <button
                          onClick={handleSaveMessage}
                          className="
                            px-3 py-2 text-sm font-medium
                            bg-skin-accent text-skin-inverse rounded-lg
                            hover:bg-skin-accent/80 transition-colors
                          "
                        >
                          Save
                        </button>
                      </div>
                      {statusMessageInput && (
                        <button
                          onClick={() => {
                            setStatusMessageInput('');
                            if (onSetStatusWithMessage) {
                              onSetStatusWithMessage(currentStatus, undefined);
                            }
                            sounds.buttonClick();
                          }}
                          className="text-xs text-skin-muted hover:text-skin-primary mt-1"
                        >
                          Clear message
                        </button>
                      )}
                    </div>

                    <div className="p-2 border-b border-skin-default">
                      <span className="text-xs text-skin-muted uppercase tracking-wider">Set Status</span>
                    </div>

                    {/* Available */}
                    <button
                      onClick={() => handleSetStatus('in_lounge')}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        hover:bg-skin-tertiary transition-colors
                        ${currentStatus === 'in_lounge' ? 'bg-green-500/10' : ''}
                      `}
                      role="menuitem"
                    >
                      <span className="text-green-500 text-lg">●</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-skin-primary">Available</div>
                        <div className="text-xs text-skin-muted">Ready to chat and play</div>
                      </div>
                      {currentStatus === 'in_lounge' && <span className="ml-auto text-green-500">✓</span>}
                    </button>

                    {/* Looking for Game */}
                    <button
                      onClick={() => handleSetStatus('looking_for_game')}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        hover:bg-skin-tertiary transition-colors
                        ${currentStatus === 'looking_for_game' ? 'bg-orange-500/10' : ''}
                      `}
                      role="menuitem"
                    >
                      <span className="text-orange-500 text-lg">★</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-skin-primary">Looking for Game</div>
                        <div className="text-xs text-skin-muted">Actively seeking players</div>
                      </div>
                      {currentStatus === 'looking_for_game' && <span className="ml-auto text-orange-500">✓</span>}
                    </button>

                    {/* Away */}
                    <button
                      onClick={() => handleSetStatus('away')}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3
                        hover:bg-skin-tertiary transition-colors
                        ${currentStatus === 'away' ? 'bg-gray-500/10' : ''}
                      `}
                      role="menuitem"
                    >
                      <span className="text-gray-500 text-lg">◯</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-skin-primary">Away</div>
                        <div className="text-xs text-skin-muted">Step away from keyboard</div>
                      </div>
                      {currentStatus === 'away' && <span className="ml-auto text-gray-500">✓</span>}
                    </button>

                    {isAutoAway && currentStatus === 'away' && (
                      <div className="px-4 py-2 bg-skin-tertiary/50 border-t border-skin-default">
                        <p className="text-xs text-skin-muted">
                          You were marked away due to inactivity. Any activity will restore your status.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile button */}
              <button
                onClick={() => onViewProfile(playerName)}
                className="p-2 rounded-lg hover:bg-skin-tertiary transition-colors"
                title="View Profile"
              >
                <span className="text-lg">👤</span>
              </button>
            </div>
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
