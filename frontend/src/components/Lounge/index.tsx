/**
 * Lounge - The Social Hub
 *
 * A "hang out first, play games second" experience.
 * Users come here to chat, see who's online, join voice,
 * and organically form tables to play games.
 *
 * Layout:
 * - Desktop: Multi-column with voice, chat, tables, and players visible
 * - Mobile: Tabbed interface with quick access to key features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { User } from '../../types/auth';
import {
  LoungeTable,
  LoungeActivity,
  LoungePlayer,
  LoungeVoiceParticipant,
  LiveGame,
  LoungeChatMessage,
  LoungeChatPayload,
  GameState,
} from '../../types/game';
import { VoiceRoom } from './VoiceRoom';
import { TablesView } from './TablesView';
import { ActivityFeed } from './ActivityFeed';
import { WhoIsHere } from './WhoIsHere';
import { LoungeChat } from './LoungeChat';
import { LiveGamesView } from './LiveGamesView';
import { LoungeHeader } from './LoungeHeader';
import { TableRoom } from './TableRoom';
import { CreateTableModal } from './CreateTableModal';
import { ConnectionStatus } from './ConnectionStatus';
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { useLoungeVoice } from '../../hooks/useLoungeVoice';
import { useAutoAway } from '../../hooks/useAutoAway';
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications';
import { sounds } from '../../utils/sounds';
import { Toast, ToastContainer } from '../ui/Toast';
import { ErrorBoundary } from '../ErrorBoundary';

/**
 * Lightweight fallback UI for when a lounge section crashes.
 * Allows the rest of the lounge to continue functioning.
 */
function SectionErrorFallback({ section }: { section: string }) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
      <p className="text-red-400 text-sm">{section} temporarily unavailable</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-xs text-skin-secondary hover:text-skin-primary underline"
      >
        Reload page
      </button>
    </div>
  );
}

interface LoungeProps {
  socket: Socket | null;
  playerName: string;
  user: User | null;
  onSpectateGame: (gameId: string) => void;
  onViewProfile: (playerName: string) => void;
  onOpenMessages: (playerName?: string) => void;
  onShowLogin: () => void;
  onShowRegister: () => void;
  onBackToLobby?: () => void;
  onJoinGame?: (gameId: string, playerName: string) => void;
  /** Direct game state setter for table games (already joined) */
  onTableGameStart?: (gameId: string, gameState: GameState) => void;
  /** Callback to update current table ID (for social features like invite from friends panel) */
  onTableChange?: (tableId: string | null) => void;
  /** Initial tab to show (defaults to 'chat' for mobile-first experience) */
  initialTab?: MobileTab;
}

type MobileTab = 'tables' | 'chat' | 'players' | 'games';

// Valid tab names for URL hash
const VALID_TABS: MobileTab[] = ['tables', 'chat', 'players', 'games'];

/**
 * Get initial tab from URL hash or default to 'chat'
 */
function getInitialTab(): MobileTab {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.slice(1); // Remove #
    if (VALID_TABS.includes(hash as MobileTab)) {
      return hash as MobileTab;
    }
  }
  return 'chat'; // Default to chat for mobile-first
}

export function Lounge({
  socket,
  playerName,
  user,
  onSpectateGame,
  onViewProfile,
  onOpenMessages,
  onShowLogin,
  onShowRegister,
  onBackToLobby,
  onJoinGame,
  onTableGameStart,
  onTableChange,
  initialTab,
}: LoungeProps) {
  // Lounge state
  const [tables, setTables] = useState<LoungeTable[]>([]);
  const [activities, setActivities] = useState<LoungeActivity[]>([]);
  const [voiceParticipants, setVoiceParticipants] = useState<LoungeVoiceParticipant[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<LoungePlayer[]>([]);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loungeMessages, setLoungeMessages] = useState<LoungeChatMessage[]>([]);
  const [typingPlayers, setTypingPlayers] = useState<string[]>([]);
  const [blockedPlayers, setBlockedPlayers] = useState<string[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Track seen message IDs to prevent duplicates on reconnection
  const seenMessageIds = useRef<Set<number>>(new Set());

  // Voice chat with microphone permission handling
  const {
    isInVoice,
    isConnecting: isVoiceConnecting,
    isMuted,
    isDeafened,
    error: voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
    // Push-to-talk
    isPushToTalk,
    togglePushToTalk,
    pttActive,
    setPttActive,
    // Volume control
    participantVolumes,
    setParticipantVolume,
  } = useLoungeVoice({ socket });

  // Get current player's status from onlinePlayers list
  const currentPlayer = onlinePlayers.find(p => p.playerName === playerName);
  const currentStatus = currentPlayer?.status || 'in_lounge';

  // Auto-away detection - automatically set status to 'away' after 5 minutes of inactivity
  const {
    isAutoAway,
    setManualAway,
    clearManualAway,
  } = useAutoAway({
    socket,
    isInLounge: !!currentPlayer,
    currentStatus,
    timeout: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });

  // Browser notifications for mentions, waves, invites
  const { showNotification, requestPermission, permission } = useBrowserNotifications();

  // Request notification permission on first user interaction
  useEffect(() => {
    if (permission === 'default') {
      const handleInteraction = () => {
        requestPermission();
        window.removeEventListener('click', handleInteraction);
      };
      window.addEventListener('click', handleInteraction);
      return () => window.removeEventListener('click', handleInteraction);
    }
  }, [permission, requestPermission]);

  // Local state
  const [mobileTab, setMobileTab] = useState<MobileTab>(initialTab || getInitialTab());
  const mobileTabRef = useRef<MobileTab>(initialTab || getInitialTab()); // Ref for socket handlers

  // Keep ref in sync with state for socket handlers
  useEffect(() => {
    mobileTabRef.current = mobileTab;
    // Clear unread count when switching to chat tab
    if (mobileTab === 'chat') {
      setUnreadChatCount(0);
    }
    // Update URL hash for bookmarking/sharing (without triggering page reload)
    if (typeof window !== 'undefined') {
      const newHash = `#${mobileTab}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
      }
    }
  }, [mobileTab]);

  // Handle browser back/forward navigation with hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (VALID_TABS.includes(hash as MobileTab)) {
        setMobileTab(hash as MobileTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningTableId, setJoiningTableId] = useState<string | null>(null); // Track pending join

  // Pending invites (for private tables)
  const [pendingInvites, setPendingInvites] = useState<Array<{
    tableId: string;
    tableName: string;
    hostName: string;
    inviterName: string;
    receivedAt: number;
  }>>([]);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    variant: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);

  // Get the selected table object
  const selectedTable = tables.find(t => t.id === selectedTableId);

  // Notify parent when table selection changes (for invite functionality)
  useEffect(() => {
    onTableChange?.(selectedTableId);
  }, [selectedTableId, onTableChange]);

  // Join lounge on mount
  useEffect(() => {
    if (socket && playerName) {
      socket.emit('join_lounge');

      return () => {
        socket.emit('leave_lounge');
      };
    }
  }, [socket, playerName]);

  // Handle browser visibility changes - rejoin lounge when tab becomes visible
  // This ensures state stays synchronized after the tab was backgrounded
  useEffect(() => {
    if (!socket || !playerName) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socket.connected) {
        // Re-request lounge state to sync up after being backgrounded
        socket.emit('join_lounge');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [socket, playerName]);

  // Handle socket disconnect - clear UI state to prevent stale data
  useSocketEvent(socket, 'disconnect', () => {
    setSelectedTableId(null);
    setJoiningTableId(null);
    setShowCreateModal(false);
  });

  // Timeout for pending join to prevent stuck state
  useEffect(() => {
    if (!joiningTableId) return;

    const timeout = setTimeout(() => {
      setJoiningTableId(null);
      setToastMessage({
        message: 'Join request timed out. Please try again.',
        variant: 'error',
        title: 'Timeout',
      });
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [joiningTableId]);

  // Handle initial lounge state
  useSocketEvent(socket, 'lounge_state', (data: {
    tables: LoungeTable[];
    activities: LoungeActivity[];
    voiceParticipants: LoungeVoiceParticipant[];
    onlinePlayers: LoungePlayer[];
    liveGames: LiveGame[];
    chatMessages?: LoungeChatMessage[];
    typingPlayers?: string[];
    blockedPlayers?: string[];
  }) => {
    setTables(data.tables);
    setActivities(data.activities);
    setVoiceParticipants(data.voiceParticipants);
    setOnlinePlayers(data.onlinePlayers);
    setLiveGames(data.liveGames);
    if (data.chatMessages) {
      setLoungeMessages(data.chatMessages);
      // Populate seen IDs from loaded history
      data.chatMessages.forEach(msg => seenMessageIds.current.add(msg.messageId));
    }
    if (data.typingPlayers) {
      setTypingPlayers(data.typingPlayers);
    }
    if (data.blockedPlayers) {
      setBlockedPlayers(data.blockedPlayers);
    }
  });

  // Block/unblock responses
  useSocketEvent(socket, 'player_blocked', (data: { blockedName: string; friendshipRemoved: boolean }) => {
    setBlockedPlayers(prev => [...prev, data.blockedName]);
    setToastMessage({
      message: `You have blocked ${data.blockedName}${data.friendshipRemoved ? ' and removed them from your friends' : ''}`,
      variant: 'success',
      title: 'Player Blocked',
    });
  });

  useSocketEvent(socket, 'player_unblocked', (data: { unblockedName: string }) => {
    setBlockedPlayers(prev => prev.filter(n => n !== data.unblockedName));
    setToastMessage({
      message: `You have unblocked ${data.unblockedName}`,
      variant: 'success',
      title: 'Player Unblocked',
    });
  });

  // Activity feed updates
  useSocketEvent(socket, 'lounge_activity', (activity: LoungeActivity) => {
    setActivities(prev => [activity, ...prev].slice(0, 50));
    sounds.chatNotification();
  });

  // Lounge chat updates - with deduplication to prevent duplicates on reconnection
  useSocketEvent(socket, 'lounge_chat_message', (data: { message: LoungeChatMessage }) => {
    // Use messageId for deduplication (more reliable than timestamp)
    if (seenMessageIds.current.has(data.message.messageId)) return;
    seenMessageIds.current.add(data.message.messageId);
    // Limit seen IDs to prevent memory growth (keep last 200)
    if (seenMessageIds.current.size > 200) {
      const idsArray = Array.from(seenMessageIds.current);
      seenMessageIds.current = new Set(idsArray.slice(-150));
    }
    setLoungeMessages(prev => [...prev, data.message].slice(-100));

    // Increment unread count if not on chat tab and message is from someone else
    if (mobileTabRef.current !== 'chat' && data.message.playerName !== playerName) {
      setUnreadChatCount(prev => prev + 1);
    }
  });

  // Typing indicator updates
  useSocketEvent(socket, 'lounge_typing_started', (data: { playerName: string }) => {
    setTypingPlayers(prev => {
      if (prev.includes(data.playerName)) return prev;
      return [...prev, data.playerName];
    });
  });

  useSocketEvent(socket, 'lounge_typing_stopped', (data: { playerName: string }) => {
    setTypingPlayers(prev => prev.filter(p => p !== data.playerName));
  });

  // @mention received - show browser notification
  useSocketEvent(socket, 'lounge_mention', (data: {
    messageId: number;
    mentionedBy: string;
    messagePreview: string;
  }) => {
    // Browser notification when tab is not focused
    showNotification({
      title: `@${playerName} mentioned`,
      body: `${data.mentionedBy}: ${data.messagePreview.slice(0, 100)}${data.messagePreview.length > 100 ? '...' : ''}`,
      tag: `mention-${data.messageId}`,
      onClick: () => {
        // Switch to chat tab on mobile
        setMobileTab('chat');
      },
    });
  });

  // Table updates
  useSocketEvent(socket, 'lounge_table_updated', (data: { table: LoungeTable }) => {
    setTables(prev => {
      const index = prev.findIndex(t => t.id === data.table.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = data.table;
        return updated;
      }
      return [...prev, data.table];
    });
  });

  useSocketEvent(socket, 'lounge_table_deleted', (data: { tableId: string }) => {
    setTables(prev => prev.filter(t => t.id !== data.tableId));
    if (selectedTableId === data.tableId) {
      setSelectedTableId(null);
    }
  });

  // Table created - auto-select it
  useSocketEvent(socket, 'table_created', (data: { table: LoungeTable }) => {
    setTables(prev => [...prev, data.table]);
    if (data.table.hostName === playerName) {
      setSelectedTableId(data.table.id);
    }
  });

  // Player updates
  useSocketEvent(socket, 'lounge_player_joined', (data: { player: LoungePlayer }) => {
    setOnlinePlayers(prev => {
      const exists = prev.some(p => p.playerName === data.player.playerName);
      if (exists) {
        return prev.map(p => p.playerName === data.player.playerName ? data.player : p);
      }
      return [...prev, data.player];
    });
  });

  useSocketEvent(socket, 'lounge_player_left', (data: { playerName: string }) => {
    setOnlinePlayers(prev => prev.filter(p => p.playerName !== data.playerName));
  });

  useSocketEvent(socket, 'lounge_player_status_changed', (data: {
    playerName: string;
    status: string;
    statusMessage?: string;
  }) => {
    setOnlinePlayers(prev => prev.map(p =>
      p.playerName === data.playerName
        ? { ...p, status: data.status as LoungePlayer['status'], statusMessage: data.statusMessage }
        : p
    ));
  });

  // Voice updates
  useSocketEvent(socket, 'lounge_voice_participant_joined', (data: {
    participant: LoungeVoiceParticipant;
  }) => {
    setVoiceParticipants(prev => [...prev, data.participant]);
  });

  useSocketEvent(socket, 'lounge_voice_participant_left', (data: { playerName: string }) => {
    setVoiceParticipants(prev => prev.filter(p => p.playerName !== data.playerName));
  });

  useSocketEvent(socket, 'lounge_voice_joined', (data: {
    participants: LoungeVoiceParticipant[];
  }) => {
    setVoiceParticipants(data.participants);
  });

  // Voice participant status updates (mute/speaking)
  useSocketEvent(socket, 'lounge_voice_participant_updated', (data: {
    playerName: string;
    isMuted: boolean;
  }) => {
    setVoiceParticipants(prev => prev.map(p =>
      p.playerName === data.playerName
        ? { ...p, isMuted: data.isMuted }
        : p
    ));
  });

  useSocketEvent(socket, 'lounge_voice_participant_speaking', (data: {
    playerName: string;
    isSpeaking: boolean;
  }) => {
    setVoiceParticipants(prev => prev.map(p =>
      p.playerName === data.playerName
        ? { ...p, isSpeaking: data.isSpeaking }
        : p
    ));
  });

  // Live games updates
  useSocketEvent(socket, 'live_game_updated', (data: { game: LiveGame }) => {
    setLiveGames(prev => {
      const index = prev.findIndex(g => g.gameId === data.game.gameId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = data.game;
        return updated;
      }
      return [...prev, data.game];
    });
  });

  useSocketEvent(socket, 'live_game_removed', (data: { gameId: string }) => {
    setLiveGames(prev => prev.filter(g => g.gameId !== data.gameId));
  });

  // Wave received - show toast notification and browser notification
  useSocketEvent(socket, 'player_waved_at_you', (data: { playerName: string }) => {
    sounds.chatNotification();
    setToastMessage({
      message: `${data.playerName} waved at you!`,
      variant: 'info',
      title: '👋 Wave',
    });
    // Browser notification when tab is not focused
    showNotification({
      title: '👋 Wave',
      body: `${data.playerName} waved at you!`,
      tag: `wave-${data.playerName}`,
    });
  });

  // Wave sent confirmation - show feedback to sender
  useSocketEvent(socket, 'wave_sent', (data: { targetPlayerName: string }) => {
    setToastMessage({
      message: `You waved at ${data.targetPlayerName}`,
      variant: 'success',
      title: '👋 Wave Sent',
    });
  });

  // Table join confirmation - only update UI on success
  useSocketEvent(socket, 'table_joined', (data: { table: LoungeTable }) => {
    setSelectedTableId(data.table.id);
    setJoiningTableId(null);
    // Update table in list with latest data (including chat history)
    setTables(prev => {
      const index = prev.findIndex(t => t.id === data.table.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = data.table;
        return updated;
      }
      return [...prev, data.table];
    });
    // Also update our own status in the players list to "at_table"
    setOnlinePlayers(prev => prev.map(p =>
      p.playerName === playerName
        ? { ...p, status: 'at_table' as const, tableId: data.table.id }
        : p
    ));
  });

  // Table invite received - store for later and show actionable toast
  useSocketEvent(socket, 'table_invite_received', (data: {
    tableId: string;
    tableName: string;
    hostName: string;
    inviterName: string;
  }) => {
    sounds.chatNotification();

    // Store the invite (avoid duplicates - but allow different inviters for same table)
    setPendingInvites(prev => {
      const exists = prev.some(inv => inv.tableId === data.tableId && inv.inviterName === data.inviterName);
      if (exists) return prev;
      return [...prev, { ...data, receivedAt: Date.now() }];
    });

    // Show toast with join action
    setToastMessage({
      message: `${data.inviterName} invited you to join "${data.tableName}"`,
      variant: 'info',
      title: '📨 Table Invite',
      action: {
        label: 'Join',
        onClick: () => {
          if (socket && !joiningTableId) {
            setJoiningTableId(data.tableId);
            socket.emit('join_table', { tableId: data.tableId });
            // Remove from pending invites
            setPendingInvites(prev => prev.filter(inv => inv.tableId !== data.tableId));
          }
        },
      },
    });

    // Browser notification when tab is not focused
    showNotification({
      title: '📨 Table Invite',
      body: `${data.inviterName} invited you to "${data.tableName}"`,
      tag: `invite-${data.tableId}`,
      requireInteraction: true, // Keep visible until user interacts
      onClick: () => {
        // Focus will happen automatically, then user can see the toast
      },
    });
  });

  // Clear invite when table is deleted
  useEffect(() => {
    // Remove invites for tables that no longer exist
    setPendingInvites(prev => prev.filter(inv =>
      tables.some(t => t.id === inv.tableId) || !tables.length
    ));
  }, [tables]);

  // Expire old invites (5 minutes) and notify user
  useEffect(() => {
    const interval = setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      setPendingInvites(prev => {
        const expiring = prev.filter(inv => inv.receivedAt <= fiveMinutesAgo);
        if (expiring.length > 0) {
          // Show toast for expired invites
          const names = expiring.map(inv => inv.tableName).join(', ');
          setToastMessage({
            message: `Invite${expiring.length > 1 ? 's' : ''} to "${names}" expired`,
            variant: 'info',
            title: 'Invite Expired',
          });
        }
        return prev.filter(inv => inv.receivedAt > fiveMinutesAgo);
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Player removed from table notification
  useSocketEvent(socket, 'player_removed_from_table', (data: {
    tableId: string;
    playerName: string;
  }) => {
    if (data.playerName === playerName) {
      setSelectedTableId(null);
      setToastMessage({
        message: 'You were removed from the table',
        variant: 'warning',
        title: 'Removed',
      });
    }
  });

  // Error handling for socket events
  useSocketEvent(socket, 'error', (data: { message: string; context?: string }) => {
    // Clear pending join state on error
    if (data.context === 'join_table' || data.context === 'sit_at_table') {
      setJoiningTableId(null);
    }
    // Use appropriate title based on error type
    const isRateLimit = data.message.toLowerCase().includes('too many') || data.message.toLowerCase().includes('slow down');
    setToastMessage({
      message: data.message,
      variant: isRateLimit ? 'warning' : 'error',
      title: isRateLimit ? 'Rate Limited' : 'Error',
    });
  });

  // Friend request success - show toast on actual success from server
  useSocketEvent(socket, 'friend_request_sent', (data: { request: { to_player: string } }) => {
    setToastMessage({
      message: `Friend request sent to ${data.request.to_player}`,
      variant: 'success',
      title: 'Request Sent',
    });
  });

  // Table invite success - show toast on actual success from server
  useSocketEvent(socket, 'invite_sent', (data: { targetPlayerName: string }) => {
    setToastMessage({
      message: `Invited ${data.targetPlayerName} to join your table`,
      variant: 'success',
      title: 'Invite Sent',
    });
  });

  // Actions
  const handleJoinVoice = useCallback(async () => {
    sounds.buttonClick();
    await joinVoice();
  }, [joinVoice]);

  const handleLeaveVoice = useCallback(() => {
    sounds.buttonClick();
    leaveVoice();
  }, [leaveVoice]);

  const handleCreateTable = useCallback(() => {
    setShowCreateModal(true);
    sounds.buttonClick();
  }, []);

  const handleJoinTable = useCallback((tableId: string) => {
    if (socket && !joiningTableId) {
      setJoiningTableId(tableId); // Track pending join
      socket.emit('join_table', { tableId });
      // Don't set selectedTableId here - wait for table_joined confirmation
      sounds.buttonClick();
    }
  }, [socket, joiningTableId]);

  const handleViewTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    sounds.buttonClick();
  }, []);

  const handleLeaveTable = useCallback(() => {
    setSelectedTableId(null);
    sounds.buttonClick();
  }, []);

  const handleGameStart = useCallback((gameId: string, gameState?: GameState) => {
    // If gameState is provided (from table game), use direct setter
    if (gameState && onTableGameStart) {
      onTableGameStart(gameId, gameState);
    } else if (onJoinGame) {
      // Fallback to join_game flow (shouldn't happen for table games)
      onJoinGame(gameId, playerName);
    }
  }, [onJoinGame, onTableGameStart, playerName]);

  const handleWave = useCallback((targetName: string) => {
    if (socket) {
      socket.emit('wave_at_player', { targetPlayerName: targetName });
      sounds.buttonClick();
    }
  }, [socket]);


  const handleSendMessage = useCallback((payload: LoungeChatPayload) => {
    if (socket && (payload.message?.trim() || payload.mediaUrl)) {
      socket.emit('lounge_chat', payload);
    }
  }, [socket]);

  const handlePlayerClick = useCallback((name: string) => {
    onViewProfile(name);
  }, [onViewProfile]);

  const handleTableClick = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    setMobileTab('tables');
  }, []);

  const handleAddFriend = useCallback((targetName: string) => {
    if (socket) {
      socket.emit('send_friend_request', { toPlayer: targetName });
      sounds.buttonClick();
      // Toast will be shown on friend_request_sent or error event from server
    }
  }, [socket]);

  const handleInviteToTable = useCallback((targetName: string) => {
    if (socket && selectedTableId) {
      socket.emit('invite_to_table', { tableId: selectedTableId, targetPlayerName: targetName });
      sounds.buttonClick();
      // Toast will be shown on invite_sent or error event from server
    }
  }, [socket, selectedTableId]);

  const handleBlockPlayer = useCallback((targetName: string) => {
    if (socket) {
      socket.emit('block_player', { targetPlayerName: targetName });
      sounds.buttonClick();
    }
  }, [socket]);

  // Set status to "looking for game"
  const handleSetLookingForGame = useCallback(() => {
    if (socket) {
      socket.emit('set_player_status', { status: 'looking_for_game' });
      sounds.buttonClick();
    }
  }, [socket]);

  // Set status with optional message
  const handleSetStatusWithMessage = useCallback((status: LoungePlayer['status'], message?: string) => {
    if (socket) {
      socket.emit('set_player_status', { status, statusMessage: message });
      sounds.buttonClick();
    }
  }, [socket]);

  const handleAcceptInvite = useCallback((tableId: string) => {
    if (socket && !joiningTableId) {
      setJoiningTableId(tableId);
      socket.emit('join_table', { tableId });
      // Remove from pending invites
      setPendingInvites(prev => prev.filter(inv => inv.tableId !== tableId));
      sounds.buttonClick();
    }
  }, [socket, joiningTableId]);

  const handleDismissInvite = useCallback((tableId: string) => {
    setPendingInvites(prev => prev.filter(inv => inv.tableId !== tableId));
    sounds.buttonClick();
  }, []);

  // If user is in a table room, show the TableRoom view
  if (selectedTable) {
    return (
      <TableRoom
        socket={socket}
        table={selectedTable}
        playerName={playerName}
        onLeave={handleLeaveTable}
        onGameStart={handleGameStart}
      />
    );
  }

  // Mobile tab content
  const renderMobileContent = () => {
    switch (mobileTab) {
      case 'tables':
        return (
          <TablesView
            tables={tables}
            onCreateTable={handleCreateTable}
            onJoinTable={handleJoinTable}
            onViewTable={handleViewTable}
            playerName={playerName}
          />
        );
      case 'chat':
        return (
          <LoungeChat
            socket={socket}
            messages={loungeMessages}
            onSendMessage={handleSendMessage}
            playerName={playerName}
            onlinePlayers={onlinePlayers}
            typingPlayers={typingPlayers}
          />
        );
      case 'players':
        return (
          <WhoIsHere
            players={onlinePlayers}
            playerName={playerName}
            onWave={handleWave}
            onViewProfile={onViewProfile}
            onMessage={onOpenMessages}
            onAddFriend={handleAddFriend}
            onInviteToTable={handleInviteToTable}
            onBlockPlayer={handleBlockPlayer}
            isAuthenticated={!!user}
            isAtTable={!!selectedTableId}
            blockedPlayers={blockedPlayers}
          />
        );
      case 'games':
        return (
          <LiveGamesView
            games={liveGames}
            onSpectate={onSpectateGame}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-skin-primary">
      {/* Connection status banner (shows when disconnected) */}
      <ConnectionStatus socket={socket} />

      {/* Toast notifications */}
      {toastMessage && (
        <ToastContainer position="top-right">
          <Toast
            variant={toastMessage.variant}
            message={toastMessage.message}
            title={toastMessage.title}
            action={toastMessage.action}
            autoDismiss={toastMessage.action ? 15000 : 5000}
            onClose={() => setToastMessage(null)}
          />
        </ToastContainer>
      )}

      {/* Header */}
      <LoungeHeader
        user={user}
        playerName={playerName}
        onlinePlayers={onlinePlayers}
        voiceParticipants={voiceParticipants}
        isInVoice={isInVoice}
        onJoinVoice={handleJoinVoice}
        onShowLogin={onShowLogin}
        onShowRegister={onShowRegister}
        onViewProfile={onViewProfile}
        onBackToLobby={onBackToLobby}
        pendingInvites={pendingInvites}
        onAcceptInvite={handleAcceptInvite}
        onDismissInvite={handleDismissInvite}
        currentStatus={currentStatus}
        isAutoAway={isAutoAway}
        onSetAway={setManualAway}
        onClearAway={clearManualAway}
        onSetLookingForGame={handleSetLookingForGame}
        currentStatusMessage={currentPlayer?.statusMessage}
        onSetStatusWithMessage={handleSetStatusWithMessage}
      />

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        socket={socket}
        playerName={playerName}
      />

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 max-w-[1600px] mx-auto">
        {/* Left Sidebar - Voice + Players */}
        <div className="col-span-3 space-y-4">
          <ErrorBoundary fallback={<SectionErrorFallback section="Voice" />} componentName="VoiceRoom">
            <VoiceRoom
              playerName={playerName}
              participants={voiceParticipants}
              onJoinVoice={handleJoinVoice}
              onLeaveVoice={handleLeaveVoice}
              onToggleMute={toggleMute}
              onToggleDeafen={toggleDeafen}
              isInVoice={isInVoice}
              isConnecting={isVoiceConnecting}
              isMuted={isMuted}
              isDeafened={isDeafened}
              error={voiceError}
              isPushToTalk={isPushToTalk}
              onTogglePushToTalk={togglePushToTalk}
              pttActive={pttActive}
              onSetPttActive={setPttActive}
              participantVolumes={participantVolumes}
              onSetParticipantVolume={setParticipantVolume}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback={<SectionErrorFallback section="Players" />} componentName="WhoIsHere">
            <WhoIsHere
              players={onlinePlayers}
              playerName={playerName}
              onWave={handleWave}
              onViewProfile={onViewProfile}
              onMessage={onOpenMessages}
              onAddFriend={handleAddFriend}
              onInviteToTable={handleInviteToTable}
              onBlockPlayer={handleBlockPlayer}
              isAuthenticated={!!user}
              isAtTable={!!selectedTableId}
              blockedPlayers={blockedPlayers}
            />
          </ErrorBoundary>
        </div>

        {/* Center - Tables + Activity */}
        <div className="col-span-6 space-y-4">
          <ErrorBoundary fallback={<SectionErrorFallback section="Tables" />} componentName="TablesView">
            <TablesView
              tables={tables}
              onCreateTable={handleCreateTable}
              onJoinTable={handleJoinTable}
              onViewTable={handleViewTable}
              playerName={playerName}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback={<SectionErrorFallback section="Activity" />} componentName="ActivityFeed">
            <ActivityFeed
              activities={activities}
              onPlayerClick={handlePlayerClick}
              onTableClick={handleTableClick}
            />
          </ErrorBoundary>
        </div>

        {/* Right Sidebar - Chat + Live Games */}
        <div className="col-span-3 space-y-4">
          <ErrorBoundary fallback={<SectionErrorFallback section="Chat" />} componentName="LoungeChat">
            <LoungeChat
              socket={socket}
              messages={loungeMessages}
              onSendMessage={handleSendMessage}
              playerName={playerName}
              onlinePlayers={onlinePlayers}
              typingPlayers={typingPlayers}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback={<SectionErrorFallback section="Live Games" />} componentName="LiveGamesView">
            <LiveGamesView
              games={liveGames}
              onSpectate={onSpectateGame}
            />
          </ErrorBoundary>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Voice Room - Always visible at top on mobile */}
        <div className="p-2">
          <ErrorBoundary fallback={<SectionErrorFallback section="Voice" />} componentName="VoiceRoom-Mobile">
            <VoiceRoom
              playerName={playerName}
              participants={voiceParticipants}
              onJoinVoice={handleJoinVoice}
              onLeaveVoice={handleLeaveVoice}
              onToggleMute={toggleMute}
              onToggleDeafen={toggleDeafen}
              isInVoice={isInVoice}
              isConnecting={isVoiceConnecting}
              isMuted={isMuted}
              isDeafened={isDeafened}
              error={voiceError}
              isPushToTalk={isPushToTalk}
              onTogglePushToTalk={togglePushToTalk}
              pttActive={pttActive}
              onSetPttActive={setPttActive}
              participantVolumes={participantVolumes}
              onSetParticipantVolume={setParticipantVolume}
            />
          </ErrorBoundary>
        </div>

        {/* Tab Content */}
        <div className="p-2 pb-20">
          {renderMobileContent()}
        </div>

        {/* Bottom Navigation - with safe area padding for notched devices */}
        <nav className="fixed bottom-0 left-0 right-0 bg-skin-secondary border-t border-skin-default z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4 gap-1 p-2 px-[max(0.5rem,env(safe-area-inset-left))]">
            {(['chat', 'tables', 'players', 'games'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMobileTab(tab);
                  sounds.buttonClick();
                }}
                className={`
                  py-3 px-2 rounded-lg text-center transition-colors
                  ${mobileTab === tab
                    ? 'bg-skin-accent text-skin-inverse'
                    : 'text-skin-secondary hover:bg-skin-tertiary'
                  }
                `}
              >
                <div className="text-xl mb-1 relative">
                  {tab === 'tables' && '🎴'}
                  {tab === 'chat' && (
                    <>
                      💬
                      {unreadChatCount > 0 && (
                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                    </>
                  )}
                  {tab === 'players' && '👥'}
                  {tab === 'games' && '👁️'}
                </div>
                <div className="text-xs font-medium capitalize">{tab}</div>
                {tab === 'tables' && tables.filter(t => t.status === 'gathering').length > 0 && (
                  <div className="text-[10px] text-green-400">{tables.filter(t => t.status === 'gathering').length} open</div>
                )}
                {tab === 'chat' && unreadChatCount > 0 && (
                  <div className="text-[10px] text-red-400">{unreadChatCount} new</div>
                )}
                {tab === 'players' && (
                  <div className="text-[10px] text-skin-muted">{onlinePlayers.length}</div>
                )}
                {tab === 'games' && liveGames.length > 0 && (
                  <div className="text-[10px] text-skin-muted">{liveGames.length} live</div>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Back button is now in header - removed floating FAB for cleaner mobile UX */}
    </div>
  );
}

export default Lounge;
