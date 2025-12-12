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
import { sounds } from '../../utils/sounds';
import { Button } from '../ui/Button';

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
}: LoungeProps) {
  // Lounge state
  const [tables, setTables] = useState<LoungeTable[]>([]);
  const [activities, setActivities] = useState<LoungeActivity[]>([]);
  const [voiceParticipants, setVoiceParticipants] = useState<LoungeVoiceParticipant[]>([]);
  const [onlinePlayers, setOnlinePlayers] = useState<LoungePlayer[]>([]);
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loungeMessages, setLoungeMessages] = useState<ChatMessage[]>([]);

  // Local state
  const [isInVoice, setIsInVoice] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('tables');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get the selected table object
  const selectedTable = tables.find(t => t.id === selectedTableId);

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
  }) => {
    setTables(data.tables);
    setActivities(data.activities);
    setVoiceParticipants(data.voiceParticipants);
    setOnlinePlayers(data.onlinePlayers);
    setLiveGames(data.liveGames);
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
    setIsInVoice(true);
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

  // Wave received
  useSocketEvent(socket, 'player_waved_at_you', () => {
    sounds.chatNotification();
    // Could show a toast here
  });

  // Actions
  const handleJoinVoice = useCallback(() => {
    if (socket) {
      socket.emit('join_lounge_voice');
      sounds.buttonClick();
    }
  }, [socket]);

  const handleLeaveVoice = useCallback(() => {
    if (socket) {
      socket.emit('leave_lounge_voice');
      setIsInVoice(false);
      sounds.buttonClick();
    }
  }, [socket]);

  const handleCreateTable = useCallback(() => {
    setShowCreateModal(true);
    sounds.buttonClick();
  }, []);

  const handleJoinTable = useCallback((tableId: string) => {
    if (socket) {
      socket.emit('join_table', { tableId });
      setSelectedTableId(tableId);
      sounds.buttonClick();
    }
  }, [socket]);

  const handleViewTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    sounds.buttonClick();
  }, []);

  const handleLeaveTable = useCallback(() => {
    setSelectedTableId(null);
    sounds.buttonClick();
  }, []);

  const handleGameStart = useCallback((gameId: string) => {
    if (onJoinGame) {
      onJoinGame(gameId, playerName);
    }
  }, [onJoinGame, playerName]);

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
            socket={socket}
            playerName={playerName}
            participants={voiceParticipants}
            onJoinVoice={handleJoinVoice}
            onLeaveVoice={handleLeaveVoice}
            isInVoice={isInVoice}
          />
          <WhoIsHere
            players={onlinePlayers}
            playerName={playerName}
            onWave={handleWave}
            onViewProfile={onViewProfile}
            onMessage={onOpenMessages}
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
            socket={socket}
            playerName={playerName}
            participants={voiceParticipants}
            onJoinVoice={handleJoinVoice}
            onLeaveVoice={handleLeaveVoice}
            isInVoice={isInVoice}
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
