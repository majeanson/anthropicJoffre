/**
 * TeamSelection Component - Multi-Skin Edition
 *
 * Team selection phase with proper CSS variable usage for skin compatibility.
 * Features team panels, bot management, and game setup.
 *
 * Refactored into modular sub-components:
 * - TeamPanel: Individual team container with player slots
 * - PlayerSlot: Single player position in a team
 * - BotDifficultySelector: Bot difficulty selection
 * - GameLinkSection: Game ID display and copy link
 * - ActionButtons: Add bot and start game buttons
 * - HeaderButtons: Top-left action buttons
 * - useTeamSelectionKeyboardNav: Keyboard navigation hook
 */

import { Player, ChatMessage, VoiceParticipant } from '../../types/game';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { HowToPlay } from '../HowToPlay';
import { BotDifficulty } from '../../utils/botPlayerEnhanced';
import { UnifiedChat } from '../UnifiedChat';
import { TeamSelectionSocialSidebar } from '../TeamSelectionSocialSidebar';
import { sounds } from '../../utils/sounds';
import { ElegantButton } from '../ui/Button';

import { TeamPanel } from './TeamPanel';
import { BotDifficultySelector } from './BotDifficultySelector';
import { GameLinkSection } from './GameLinkSection';
import { ActionButtons } from './ActionButtons';
import { HeaderButtons } from './HeaderButtons';
import {
  useTeamSelectionKeyboardNav,
  NavSection,
} from './useTeamSelectionKeyboardNav';

interface TeamSelectionProps {
  players: Player[];
  gameId: string;
  currentPlayerId: string;
  creatorId: string;
  onSelectTeam: (teamId: 1 | 2) => void;
  onSwapPosition: (targetPlayerId: string) => void;
  onStartGame: () => void;
  onLeaveGame?: () => void;
  onAddBot?: () => void;
  onKickPlayer?: (playerId: string) => void;
  socket?: Socket | null;
  botDifficulty?: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  // Voice chat props
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  voiceError?: string | null;
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
  // Registration prompt
  onShowWhyRegister?: () => void;
}

export function TeamSelection({
  players,
  gameId,
  currentPlayerId,
  creatorId,
  onSelectTeam,
  onSwapPosition,
  onStartGame,
  onLeaveGame,
  onAddBot,
  onKickPlayer,
  socket,
  botDifficulty = 'medium',
  onBotDifficultyChange,
  isVoiceEnabled = false,
  isVoiceMuted = false,
  voiceParticipants = [],
  onVoiceToggle,
  onVoiceMuteToggle,
  onShowWhyRegister,
}: TeamSelectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showSocialSidebar, setShowSocialSidebar] = useState(false);

  // Refs for focusable elements
  const leaveButtonRef = useRef<HTMLButtonElement>(null);
  const copyLinkButtonRef = useRef<HTMLButtonElement>(null);
  const easyButtonRef = useRef<HTMLButtonElement>(null);
  const mediumButtonRef = useRef<HTMLButtonElement>(null);
  const hardButtonRef = useRef<HTMLButtonElement>(null);
  const addBotButtonRef = useRef<HTMLButtonElement>(null);
  const startGameButtonRef = useRef<HTMLButtonElement>(null);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const team1SwapRefs = useRef<(HTMLButtonElement | null)[]>([null, null]);
  const team2SwapRefs = useRef<(HTMLButtonElement | null)[]>([null, null]);

  // Memoize expensive computations
  const currentPlayer = useMemo(
    () => players.find((p) => p.name === currentPlayerId || p.id === currentPlayerId),
    [players, currentPlayerId]
  );

  const team1Players = useMemo(() => players.filter((p) => p.teamId === 1), [players]);
  const team2Players = useMemo(() => players.filter((p) => p.teamId === 2), [players]);

  // Check if difficulty section is visible
  const showDifficulty =
    players.filter((p) => !p.isEmpty).length < 4 && onAddBot && onBotDifficultyChange;
  const showAddBot = players.filter((p) => !p.isEmpty).length < 4 && onAddBot;

  // Focus callback for keyboard navigation
  const handleFocusElement = useCallback(
    (section: NavSection, col: number, teamNavRow: number, teamNavTeam: 1 | 2) => {
      switch (section) {
        case 'header':
          if (col === 0 && leaveButtonRef.current) leaveButtonRef.current.focus();
          else if (!onLeaveGame && copyLinkButtonRef.current) copyLinkButtonRef.current.focus();
          break;
        case 'teams':
          const teamRefs = teamNavTeam === 1 ? team1SwapRefs.current : team2SwapRefs.current;
          teamRefs[teamNavRow]?.focus();
          break;
        case 'difficulty':
          if (col === 0 && easyButtonRef.current) easyButtonRef.current.focus();
          else if (col === 1 && mediumButtonRef.current) mediumButtonRef.current.focus();
          else if (col === 2 && hardButtonRef.current) hardButtonRef.current.focus();
          break;
        case 'actions':
          if (showAddBot && col === 0 && addBotButtonRef.current) addBotButtonRef.current.focus();
          else if (startGameButtonRef.current) startGameButtonRef.current.focus();
          break;
        case 'rules':
          rulesButtonRef.current?.focus();
          break;
      }
    },
    [onLeaveGame, showAddBot]
  );

  // Use keyboard navigation hook
  useTeamSelectionKeyboardNav({
    showDifficulty: !!showDifficulty,
    showAddBot: !!showAddBot,
    hasLeaveGame: !!onLeaveGame,
    isRulesOpen: showRules,
    onEscape: onLeaveGame,
    onFocusElement: handleFocusElement,
  });

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('team_selection_chat_message', handleChatMessage);

    return () => {
      socket.off('team_selection_chat_message', handleChatMessage);
    };
  }, [socket]);

  // Validation for starting game
  const canStartGame = useMemo(() => {
    const realPlayers = players.filter((p) => !p.isEmpty);
    if (realPlayers.length !== 4) return false;

    const team1RealPlayers = team1Players.filter((p) => !p.isEmpty);
    const team2RealPlayers = team2Players.filter((p) => !p.isEmpty);
    if (team1RealPlayers.length !== 2) return false;
    if (team2RealPlayers.length !== 2) return false;
    return true;
  }, [players, team1Players, team2Players]);

  const startGameMessage = useMemo(() => {
    const realPlayers = players.filter((p) => !p.isEmpty);
    const emptySeats = players.filter((p) => p.isEmpty).length;

    if (emptySeats > 0) {
      return `${emptySeats} empty seat(s) - fill them to start`;
    }
    if (realPlayers.length !== 4) {
      return `Waiting for ${4 - realPlayers.length} more player(s) to join`;
    }

    const team1RealPlayers = team1Players.filter((p) => !p.isEmpty);
    const team2RealPlayers = team2Players.filter((p) => !p.isEmpty);
    if (team1RealPlayers.length !== 2 || team2RealPlayers.length !== 2) {
      return 'Teams must have 2 players each (no empty seats)';
    }
    return '';
  }, [players, team1Players, team2Players]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative game-container bg-skin-primary">
      {/* Animated background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>

      {/* Main container - full width */}
      <div
        className="
          bg-skin-secondary
          rounded-[var(--radius-xl)]
          p-6 sm:p-8
          w-full max-w-[1200px]
          relative
          border-2 border-skin-accent
          shadow-main-glow
        "
      >
        {/* Top-left buttons */}
        <HeaderButtons
          onLeaveGame={onLeaveGame}
          onToggleSocialSidebar={() => setShowSocialSidebar(!showSocialSidebar)}
          isVoiceEnabled={isVoiceEnabled}
          isVoiceMuted={isVoiceMuted}
          voiceParticipants={voiceParticipants}
          onVoiceToggle={onVoiceToggle}
          onVoiceMuteToggle={onVoiceMuteToggle}
          leaveButtonRef={leaveButtonRef}
        />

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-wider mb-6 text-center mt-12 text-skin-primary drop-shadow-[0_0_20px_var(--color-glow)]">
          Team Selection
        </h2>

        {/* Game ID Section */}
        <GameLinkSection gameId={gameId} copyLinkButtonRef={copyLinkButtonRef} />

        {/* Player count */}
        <div className="mb-6">
          <p className="text-center text-[var(--color-text-secondary)] font-body">
            Players (
            <span data-testid="player-count">{players.filter((p) => !p.isEmpty).length}</span>/4) -
            Choose your team and position
          </p>
        </div>

        {/* Team Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
          <TeamPanel
            teamId={1}
            teamPlayers={team1Players}
            currentPlayerId={currentPlayerId}
            currentPlayer={currentPlayer}
            creatorId={creatorId}
            allPlayers={players}
            gameId={gameId}
            socket={socket}
            swapRefs={team1SwapRefs}
            onSelectTeam={onSelectTeam}
            onSwapPosition={onSwapPosition}
            onKickPlayer={onKickPlayer}
          />
          <TeamPanel
            teamId={2}
            teamPlayers={team2Players}
            currentPlayerId={currentPlayerId}
            currentPlayer={currentPlayer}
            creatorId={creatorId}
            allPlayers={players}
            gameId={gameId}
            socket={socket}
            swapRefs={team2SwapRefs}
            onSelectTeam={onSelectTeam}
            onSwapPosition={onSwapPosition}
            onKickPlayer={onKickPlayer}
          />
        </div>

        {/* Bot Difficulty Selector */}
        {showDifficulty && onBotDifficultyChange && (
          <div className="mb-4">
            <BotDifficultySelector
              difficulty={botDifficulty}
              onDifficultyChange={onBotDifficultyChange}
              easyRef={easyButtonRef}
              mediumRef={mediumButtonRef}
              hardRef={hardButtonRef}
            />
          </div>
        )}

        {/* Action Buttons */}
        <ActionButtons
          showAddBot={!!showAddBot}
          canStartGame={canStartGame}
          startGameMessage={startGameMessage}
          onAddBot={onAddBot}
          onStartGame={onStartGame}
          addBotButtonRef={addBotButtonRef}
          startGameButtonRef={startGameButtonRef}
        />

        {/* Rules button */}
        <div className="mt-6">
          <ElegantButton
            ref={rulesButtonRef}
            onClick={() => {
              sounds.buttonClick();
              setShowRules(true);
            }}
            size="lg"
            fullWidth
            glow
          >
            📖 Game Rules
          </ElegantButton>
        </div>
      </div>

      {/* Game Rules Modal */}
      <HowToPlay isModal={true} isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Social Sidebar - Find Players */}
      {socket && (
        <TeamSelectionSocialSidebar
          socket={socket}
          gameId={gameId}
          isOpen={showSocialSidebar}
          onClose={() => setShowSocialSidebar(false)}
          onShowWhyRegister={onShowWhyRegister}
        />
      )}

      {/* Floating Team Chat */}
      {socket && (
        <UnifiedChat
          mode="floating"
          context="team"
          socket={socket}
          gameId={gameId}
          currentPlayerId={currentPlayerId}
          messages={messages}
          onSendMessage={(message) => {
            socket.emit('send_team_selection_chat', {
              gameId,
              message: message.trim(),
            });
          }}
          title="💬 Team Selection Chat"
          showQuickEmojis={true}
          showEmojiPicker={true}
        />
      )}
    </div>
  );
}
