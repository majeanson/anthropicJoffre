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

import { useState, useEffect, useCallback } from 'react';
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

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    variant: 'success' | 'warning' | 'error' | 'info';
    title?: string;
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

  // Lounge chat updates
  useSocketEvent(socket, 'lounge_chat_message', (data: { message: ChatMessage }) => {
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
  });

  // Table invite received
  useSocketEvent(socket, 'table_invite_received', (data: {
    tableId: string;
    tableName: string;
    hostName: string;
    inviterName: string;
  }) => {
    sounds.chatNotification();
    setToastMessage({
      message: `${data.inviterName} invited you to join "${data.tableName}"`,
      variant: 'info',
      title: '📨 Table Invite',
    });
  });

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
    setToastMessage({
      message: data.message,
      variant: 'error',
      title: 'Error',
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
      setToastMessage({
        message: `Friend request sent to ${targetName}`,
        variant: 'success',
        title: 'Request Sent',
      });
    }
  }, [socket]);

  const handleInviteToTable = useCallback((targetName: string) => {
    if (socket && selectedTableId) {
      socket.emit('invite_to_table', { tableId: selectedTableId, targetPlayerName: targetName });
      sounds.buttonClick();
      setToastMessage({
        message: `Invited ${targetName} to join your table`,
        variant: 'success',
        title: 'Invite Sent',
      });
    }
  }, [socket, selectedTableId]);

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
            autoDismiss={5000}
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

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-skin-secondary border-t border-skin-default z-40">
          <div className="grid grid-cols-4 gap-1 p-2">
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
