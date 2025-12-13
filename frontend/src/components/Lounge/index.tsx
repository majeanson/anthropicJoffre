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
  ChatMessage,
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
import { useSocketEvent } from '../../hooks/useSocketEvent';
import { useLoungeVoice } from '../../hooks/useLoungeVoice';
import { sounds } from '../../utils/sounds';
import { Button } from '../ui/Button';
import { Toast, ToastContainer } from '../ui/Toast';

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
}

type MobileTab = 'tables' | 'chat' | 'players' | 'games';

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
}: LoungeProps) {
  // Lounge state
  const [tables, setTables] = useState<LoungeTable[]>([]);
  const [activities, setActivities] = useState<LoungeActivity[]>([]);
  const [voiceParticipants, setVoiceParticipants] = useState<LoungeVoiceParticipant[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<LoungePlayer[]>([]);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loungeMessages, setLoungeMessages] = useState<ChatMessage[]>([]);

  // Track seen message IDs to prevent duplicates on reconnection
  const seenMessageIds = useRef<Set<string>>(new Set());

  // Voice chat with microphone permission handling
  const {
    isInVoice,
    isConnecting: isVoiceConnecting,
    isMuted,
    error: voiceError,
    joinVoice,
    leaveVoice,
    toggleMute,
  } = useLoungeVoice({ socket });

  // Local state
  const [mobileTab, setMobileTab] = useState<MobileTab>('tables');
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
    chatMessages?: ChatMessage[];
  }) => {
    setTables(data.tables);
    setActivities(data.activities);
    setVoiceParticipants(data.voiceParticipants);
    setOnlinePlayers(data.onlinePlayers);
    setLiveGames(data.liveGames);
    if (data.chatMessages) {
      setLoungeMessages(data.chatMessages);
    }
  });

  // Activity feed updates
  useSocketEvent(socket, 'lounge_activity', (activity: LoungeActivity) => {
    setActivities(prev => [activity, ...prev].slice(0, 50));
    sounds.chatNotification();
  });

  // Lounge chat updates - with deduplication to prevent duplicates on reconnection
  useSocketEvent(socket, 'lounge_chat_message', (data: { message: ChatMessage }) => {
    // Create unique ID from timestamp + playerName to detect duplicates
    const msgId = `${data.message.timestamp}-${data.message.playerName}`;
    if (seenMessageIds.current.has(msgId)) return;
    seenMessageIds.current.add(msgId);
    // Limit seen IDs to prevent memory growth (keep last 200)
    if (seenMessageIds.current.size > 200) {
      const idsArray = Array.from(seenMessageIds.current);
      seenMessageIds.current = new Set(idsArray.slice(-150));
    }
    setLoungeMessages(prev => [...prev, data.message].slice(-100));
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
  }) => {
    setOnlinePlayers(prev => prev.map(p =>
      p.playerName === data.playerName
        ? { ...p, status: data.status as LoungePlayer['status'] }
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

  // Wave received - show toast notification
  useSocketEvent(socket, 'player_waved_at_you', (data: { playerName: string }) => {
    sounds.chatNotification();
    setToastMessage({
      message: `${data.playerName} waved at you!`,
      variant: 'info',
      title: '👋 Wave',
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


  const handleSendMessage = useCallback((message: string) => {
    if (socket && message.trim()) {
      socket.emit('lounge_chat', { message: message.trim() });
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
            isAuthenticated={!!user}
            isAtTable={!!selectedTableId}
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
          <VoiceRoom
            playerName={playerName}
            participants={voiceParticipants}
            onJoinVoice={handleJoinVoice}
            onLeaveVoice={handleLeaveVoice}
            onToggleMute={toggleMute}
            isInVoice={isInVoice}
            isConnecting={isVoiceConnecting}
            isMuted={isMuted}
            error={voiceError}
          />
          <WhoIsHere
            players={onlinePlayers}
            playerName={playerName}
            onWave={handleWave}
            onViewProfile={onViewProfile}
            onMessage={onOpenMessages}
            onAddFriend={handleAddFriend}
            onInviteToTable={handleInviteToTable}
            isAuthenticated={!!user}
            isAtTable={!!selectedTableId}
          />
        </div>

        {/* Center - Tables + Activity */}
        <div className="col-span-6 space-y-4">
          <TablesView
            tables={tables}
            onCreateTable={handleCreateTable}
            onJoinTable={handleJoinTable}
            onViewTable={handleViewTable}
            playerName={playerName}
          />
          <ActivityFeed
            activities={activities}
            onPlayerClick={handlePlayerClick}
            onTableClick={handleTableClick}
          />
        </div>

        {/* Right Sidebar - Chat + Live Games */}
        <div className="col-span-3 space-y-4">
          <LoungeChat
            socket={socket}
            messages={loungeMessages}
            onSendMessage={handleSendMessage}
            playerName={playerName}
            onlinePlayers={onlinePlayers}
          />
          <LiveGamesView
            games={liveGames}
            onSpectate={onSpectateGame}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Voice Room - Always visible at top on mobile */}
        <div className="p-2">
          <VoiceRoom
            playerName={playerName}
            participants={voiceParticipants}
            onJoinVoice={handleJoinVoice}
            onLeaveVoice={handleLeaveVoice}
            onToggleMute={toggleMute}
            isInVoice={isInVoice}
            isConnecting={isVoiceConnecting}
            isMuted={isMuted}
            error={voiceError}
          />
        </div>

        {/* Tab Content */}
        <div className="p-2 pb-20">
          {renderMobileContent()}
        </div>

        {/* Bottom Navigation - with safe area padding for notched devices */}
        <nav className="fixed bottom-0 left-0 right-0 bg-skin-secondary border-t border-skin-default z-40 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4 gap-1 p-2 px-[max(0.5rem,env(safe-area-inset-left))]">
            {(['tables', 'chat', 'players', 'games'] as const).map((tab) => (
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
                <div className="text-xl mb-1">
                  {tab === 'tables' && '🎴'}
                  {tab === 'chat' && '💬'}
                  {tab === 'players' && '👥'}
                  {tab === 'games' && '👁️'}
                </div>
                <div className="text-xs font-medium capitalize">{tab}</div>
                {tab === 'tables' && tables.filter(t => t.status === 'gathering').length > 0 && (
                  <div className="text-[10px] text-green-400">{tables.filter(t => t.status === 'gathering').length} open</div>
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

      {/* Back to Lobby FAB - Mobile only */}
      {onBackToLobby && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onBackToLobby();
              sounds.buttonClick();
            }}
            className="shadow-lg"
          >
            ← Back
          </Button>
        </div>
      )}
    </div>
  );
}

export default Lounge;
