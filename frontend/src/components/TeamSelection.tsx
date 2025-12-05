/**
 * TeamSelection Component - Multi-Skin Edition
 *
 * Team selection phase with proper CSS variable usage for skin compatibility.
 * Features team panels, bot management, and game setup.
 */

import { Player, ChatMessage, VoiceParticipant } from '../types/game';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { HowToPlay } from './HowToPlay';
import { BotDifficulty } from '../utils/botPlayer';
import { PlayerConnectionIndicator } from './PlayerConnectionIndicator';
import { UnifiedChat } from './UnifiedChat';
import { TeamSelectionSocialSidebar } from './TeamSelectionSocialSidebar';
import { sounds } from '../utils/sounds';
import { Button, NeonButton } from './ui/Button';

// Keyboard navigation type for team selection
type NavSection = 'header' | 'teams' | 'difficulty' | 'actions' | 'rules';

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
  // voiceError, // Available for error display
  onVoiceToggle,
  onVoiceMuteToggle,
  onShowWhyRegister,
}: TeamSelectionProps) {
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showSocialSidebar, setShowSocialSidebar] = useState(false);

  // Keyboard navigation state
  const [navSection, setNavSection] = useState<NavSection>('actions');
  const [navCol, setNavCol] = useState(0);
  const [teamNavRow, setTeamNavRow] = useState(0);
  const [teamNavTeam, setTeamNavTeam] = useState<1 | 2>(1);

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
  const currentPlayer = useMemo(() =>
    players.find(p => p.name === currentPlayerId || p.id === currentPlayerId),
    [players, currentPlayerId]
  );

  const team1Players = useMemo(() =>
    players.filter(p => p.teamId === 1),
    [players]
  );

  const team2Players = useMemo(() =>
    players.filter(p => p.teamId === 2),
    [players]
  );

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('team_selection_chat_message', handleChatMessage);

    return () => {
      socket.off('team_selection_chat_message', handleChatMessage);
    };
  }, [socket]);

  const handleCopyGameLink = useCallback(async () => {
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
      // Silently fail
    }
  }, [gameId]);

  // Check if difficulty section is visible
  const showDifficulty = players.filter(p => !p.isEmpty).length < 4 && onAddBot && onBotDifficultyChange;
  const showAddBot = players.filter(p => !p.isEmpty).length < 4 && onAddBot;

  // Get sections in order
  const getSections = useCallback((): NavSection[] => {
    const sections: NavSection[] = ['header', 'teams'];
    if (showDifficulty) sections.push('difficulty');
    sections.push('actions', 'rules');
    return sections;
  }, [showDifficulty]);

  // Get max columns for a section
  const getMaxCols = useCallback((section: NavSection): number => {
    switch (section) {
      case 'header': return onLeaveGame ? 2 : 1;
      case 'teams': return 2;
      case 'difficulty': return 3;
      case 'actions': return showAddBot ? 2 : 1;
      case 'rules': return 1;
      default: return 1;
    }
  }, [onLeaveGame, showAddBot]);

  // Focus current element based on section and column
  const focusCurrentElement = useCallback(() => {
    switch (navSection) {
      case 'header':
        if (navCol === 0 && leaveButtonRef.current) leaveButtonRef.current.focus();
        else if (!onLeaveGame && copyLinkButtonRef.current) copyLinkButtonRef.current.focus();
        break;
      case 'teams':
        const teamRefs = teamNavTeam === 1 ? team1SwapRefs.current : team2SwapRefs.current;
        teamRefs[teamNavRow]?.focus();
        break;
      case 'difficulty':
        if (navCol === 0 && easyButtonRef.current) easyButtonRef.current.focus();
        else if (navCol === 1 && mediumButtonRef.current) mediumButtonRef.current.focus();
        else if (navCol === 2 && hardButtonRef.current) hardButtonRef.current.focus();
        break;
      case 'actions':
        if (showAddBot && navCol === 0 && addBotButtonRef.current) addBotButtonRef.current.focus();
        else if (startGameButtonRef.current) startGameButtonRef.current.focus();
        break;
      case 'rules':
        rulesButtonRef.current?.focus();
        break;
    }
  }, [navSection, navCol, teamNavTeam, teamNavRow, onLeaveGame, showAddBot]);

  // Keyboard navigation
  useEffect(() => {
    if (showRules) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const sections = getSections();
      const currentIndex = sections.indexOf(navSection);

      switch (e.key) {
        case 'Escape':
          if (onLeaveGame) {
            e.preventDefault();
            sounds.buttonClick();
            onLeaveGame();
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavRow(prev => prev > 0 ? prev - 1 : 1);
          } else {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
            setNavSection(sections[newIndex]);
            setNavCol(0);
          }
          sounds.buttonClick();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavRow(prev => prev < 1 ? prev + 1 : 0);
          } else {
            const newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
            setNavSection(sections[newIndex]);
            setNavCol(0);
          }
          sounds.buttonClick();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavTeam(prev => prev === 1 ? 2 : 1);
          } else {
            const maxCols = getMaxCols(navSection);
            setNavCol(prev => prev > 0 ? prev - 1 : maxCols - 1);
          }
          sounds.buttonClick();
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (navSection === 'teams') {
            setTeamNavTeam(prev => prev === 1 ? 2 : 1);
          } else {
            const maxCols = getMaxCols(navSection);
            setNavCol(prev => prev < maxCols - 1 ? prev + 1 : 0);
          }
          sounds.buttonClick();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navSection, navCol, teamNavRow, teamNavTeam, showRules, onLeaveGame, getSections, getMaxCols]);

  // Focus element when navigation changes
  useEffect(() => {
    if (!showRules) {
      focusCurrentElement();
    }
  }, [navSection, navCol, teamNavRow, teamNavTeam, showRules, focusCurrentElement]);

  // Validation for starting game
  const canStartGame = useMemo(() => {
    const realPlayers = players.filter(p => !p.isEmpty);
    if (realPlayers.length !== 4) return false;

    const team1RealPlayers = team1Players.filter(p => !p.isEmpty);
    const team2RealPlayers = team2Players.filter(p => !p.isEmpty);
    if (team1RealPlayers.length !== 2) return false;
    if (team2RealPlayers.length !== 2) return false;
    return true;
  }, [players, team1Players, team2Players]);

  const startGameMessage = useMemo(() => {
    const realPlayers = players.filter(p => !p.isEmpty);
    const emptySeats = players.filter(p => p.isEmpty).length;

    if (emptySeats > 0) {
      return `${emptySeats} empty seat(s) - fill them to start`;
    }
    if (realPlayers.length !== 4) {
      return `Waiting for ${4 - realPlayers.length} more player(s) to join`;
    }

    const team1RealPlayers = team1Players.filter(p => !p.isEmpty);
    const team2RealPlayers = team2Players.filter(p => !p.isEmpty);
    if (team1RealPlayers.length !== 2 || team2RealPlayers.length !== 2) {
      return 'Teams must have 2 players each (no empty seats)';
    }
    return '';
  }, [players, team1Players, team2Players]);

  // Render team player slot
  const renderPlayerSlot = (
    playerAtPosition: Player | undefined,
    position: number,
    teamId: 1 | 2,
    teamColor: string,
    _teamColorSecondary: string // Reserved for future use
  ) => {
    void _teamColorSecondary;
    const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;
    const isEmptySeat = playerAtPosition?.isEmpty;

    return (
      <div
        key={`team${teamId}-${position}`}
        className={`
          p-4 rounded-[var(--radius-md)]
          border-2 transition-all duration-[var(--duration-fast)]
          ${isCurrentPlayer
            ? ''
            : playerAtPosition && !isEmptySeat
            ? 'bg-[var(--color-bg-secondary)] border-[var(--color-border-default)]'
            : 'bg-[var(--color-bg-tertiary)] border-dashed border-[var(--color-border-subtle)]'
          }
        `}
        style={isCurrentPlayer ? {
          backgroundColor: `${teamColor}20`,
          borderColor: teamColor,
          boxShadow: `0 0 10px ${teamColor}40`,
        } : {}}
      >
        {playerAtPosition && !isEmptySeat ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="font-display text-sm uppercase tracking-wider"
                style={{ color: isCurrentPlayer ? teamColor : 'var(--color-text-primary)' }}
              >
                {playerAtPosition.name}
                {isCurrentPlayer && ' (You)'}
              </span>
              {playerAtPosition.isBot && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                  🤖 Bot
                </span>
              )}
              {!playerAtPosition.isBot && (
                <PlayerConnectionIndicator
                  status={playerAtPosition.connectionStatus}
                  reconnectTimeLeft={playerAtPosition.reconnectTimeLeft}
                  small
                />
              )}
            </div>
            <div className="flex gap-2">
              {!isCurrentPlayer && currentPlayer && (
                <Button
                  ref={(el) => {
                    if (teamId === 1) team1SwapRefs.current[position] = el;
                    else team2SwapRefs.current[position] = el;
                  }}
                  onClick={() => { sounds.buttonClick(); onSwapPosition(playerAtPosition.id); }}
                  variant={teamId === 1 ? 'warning' : 'secondary'}
                  size="xs"
                  title={currentPlayer.teamId !== teamId ? 'Swap with this player (changes teams!)' : 'Swap positions'}
                >
                  ↔ Swap
                </Button>
              )}
              {!isCurrentPlayer && currentPlayerId === creatorId && onKickPlayer && (
                <Button
                  onClick={() => { sounds.buttonClick(); onKickPlayer(playerAtPosition.id); }}
                  variant="danger"
                  size="xs"
                  title="Remove player from game"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            {isEmptySeat ? (
              <div className="space-y-2">
                <div className="text-[var(--color-text-muted)] text-sm font-body italic">
                  💺 {playerAtPosition?.emptySlotName || 'Empty Seat'}
                </div>
                {!currentPlayer && socket && (
                  <Button
                    onClick={() => {
                      const allPlayers = players;
                      const seatIndex = allPlayers.findIndex(p => p.id === playerAtPosition?.id);
                      if (seatIndex !== -1) {
                        const playerName = prompt('Enter your name to fill this seat:');
                        if (playerName && playerName.trim()) {
                          socket.emit('fill_empty_seat', {
                            gameId,
                            playerName: playerName.trim(),
                            emptySlotIndex: seatIndex,
                          });
                        }
                      }
                    }}
                    variant="success"
                    size="xs"
                  >
                    Fill Seat
                  </Button>
                )}
              </div>
            ) : currentPlayer?.teamId !== teamId ? (
              <button
                onClick={() => {
                  sounds.teamSwitch();
                  onSelectTeam(teamId);
                }}
                className="
                  font-display text-sm uppercase tracking-wider
                  transition-all duration-[var(--duration-fast)]
                  hover:scale-105
                "
                style={{
                  color: teamColor,
                  textShadow: `0 0 10px ${teamColor}60`,
                }}
              >
                Join Team {teamId}
              </button>
            ) : (
              <span className="text-[var(--color-text-muted)] font-body">Empty Seat</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(var(--color-border-subtle) 1px, transparent 1px),
              linear-gradient(90deg, var(--color-border-subtle) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Main container - full width */}
      <div
        className="
          bg-[var(--color-bg-secondary)]
          rounded-[var(--radius-xl)]
          p-6 sm:p-8
          w-full
          relative
          border-2 border-[var(--color-border-accent)]
        "
        style={{
          boxShadow: 'var(--shadow-glow), var(--shadow-lg)',
          maxWidth: '1200px',
        }}
      >
        {/* Top-left buttons */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {onLeaveGame && (
            <Button
              ref={leaveButtonRef}
              onClick={() => { sounds.buttonClick(); onLeaveGame(); }}
              variant="danger"
              size="sm"
              title="Leave Game"
            >
              🚪 Leave
            </Button>
          )}
          <Button
            onClick={() => { sounds.buttonClick(); setShowSocialSidebar(!showSocialSidebar); }}
            variant="success"
            size="sm"
            title="Find players to invite"
          >
            👥 Find Players
          </Button>
          {/* Voice Chat Buttons */}
          {onVoiceToggle && (
            <Button
              onClick={() => { sounds.buttonClick(); onVoiceToggle(); }}
              variant={isVoiceEnabled ? "success" : "secondary"}
              size="sm"
              title={isVoiceEnabled ? `Voice Chat (${voiceParticipants.length} in call)` : "Join Voice Chat"}
            >
              {isVoiceEnabled ? (isVoiceMuted ? "🔇" : "🎙️") : "🎤"} Voice{isVoiceEnabled && ` (${voiceParticipants.length})`}
            </Button>
          )}
          {isVoiceEnabled && onVoiceMuteToggle && (
            <Button
              onClick={() => { sounds.buttonClick(); onVoiceMuteToggle(); }}
              variant={isVoiceMuted ? "warning" : "secondary"}
              size="sm"
              title={isVoiceMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {isVoiceMuted ? "🔇 Unmute" : "🔊 Mute"}
            </Button>
          )}
        </div>


        {/* Title */}
        <h2
          className="text-2xl sm:text-3xl font-display uppercase tracking-wider mb-6 text-center mt-12"
          style={{
            color: 'var(--color-text-primary)',
            textShadow: '0 0 20px var(--color-glow)',
          }}
        >
          Team Selection
        </h2>

        {/* Game ID Section */}
        <div className="mb-6">
          <p className="text-sm text-[var(--color-text-muted)] mb-2 font-body">Game ID:</p>
          <div
            className="
              p-3
              rounded-[var(--radius-md)]
              border border-[var(--color-border-default)]
              bg-[var(--color-bg-tertiary)]
            "
          >
            <div
              data-testid="game-id"
              className="font-mono text-lg text-center"
              style={{ color: 'var(--color-text-accent)' }}
            >
              {gameId}
            </div>
          </div>

          <NeonButton
            ref={copyLinkButtonRef}
            onClick={handleCopyGameLink}
            size="md"
            fullWidth
            className="mt-3"
            glow
          >
            🔗 Copy Game Link
          </NeonButton>
        </div>

        {/* Toast Notification */}
        {showCopyToast && (
          <div
            className="
              fixed top-4 left-1/2 transform -translate-x-1/2
              px-6 py-3 rounded-[var(--radius-lg)]
              border-2 animate-bounce z-50
              flex items-center gap-2
              font-display uppercase tracking-wider text-sm
            "
            style={{
              backgroundColor: 'var(--color-success)',
              borderColor: 'var(--color-success)',
              color: 'var(--color-text-inverse)',
              boxShadow: '0 0 20px var(--color-success)',
            }}
          >
            <span>✅</span>
            <span>Game link copied!</span>
          </div>
        )}

        {/* Player count */}
        <div className="mb-6">
          <p className="text-center text-[var(--color-text-secondary)] font-body">
            Players (<span data-testid="player-count">{players.filter(p => !p.isEmpty).length}</span>/4) - Choose your team and position
          </p>
        </div>

        {/* Team Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
          {/* Team 1 */}
          <div
            className="
              p-4 sm:p-6
              rounded-[var(--radius-lg)]
              border-2
            "
            style={{
              borderColor: 'var(--color-team1-primary)',
              backgroundColor: 'var(--color-team1-primary)10',
            }}
            data-testid="team-1-container"
          >
            <h3
              className="text-xl font-display uppercase tracking-wider mb-4 text-center"
              style={{
                color: 'var(--color-team1-primary)',
                textShadow: '0 0 10px var(--color-team1-primary)',
              }}
            >
              Team 1
            </h3>
            <div className="space-y-3">
              {[0, 1].map((position) =>
                renderPlayerSlot(
                  team1Players[position],
                  position,
                  1,
                  'var(--color-team1-primary)',
                  'var(--color-team1-secondary)'
                )
              )}
            </div>
          </div>

          {/* Team 2 */}
          <div
            className="
              p-4 sm:p-6
              rounded-[var(--radius-lg)]
              border-2
            "
            style={{
              borderColor: 'var(--color-team2-primary)',
              backgroundColor: 'var(--color-team2-primary)10',
            }}
            data-testid="team-2-container"
          >
            <h3
              className="text-xl font-display uppercase tracking-wider mb-4 text-center"
              style={{
                color: 'var(--color-team2-primary)',
                textShadow: '0 0 10px var(--color-team2-primary)',
              }}
            >
              Team 2
            </h3>
            <div className="space-y-3">
              {[0, 1].map((position) =>
                renderPlayerSlot(
                  team2Players[position],
                  position,
                  2,
                  'var(--color-team2-primary)',
                  'var(--color-team2-secondary)'
                )
              )}
            </div>
          </div>
        </div>

        {/* Bot Difficulty & Start Game Section */}
        <div className="text-center space-y-4">
          {/* Bot Difficulty Selector */}
          {showDifficulty && onBotDifficultyChange && (
            <div
              className="
                p-4
                rounded-[var(--radius-lg)]
                border border-[var(--color-border-default)]
                bg-[var(--color-bg-tertiary)]
                max-w-md mx-auto
              "
            >
              <label className="block text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
                Bot Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((difficulty, index) => (
                  <button
                    key={difficulty}
                    ref={index === 0 ? easyButtonRef : index === 1 ? mediumButtonRef : hardButtonRef}
                    onClick={() => { sounds.buttonClick(); onBotDifficultyChange(difficulty); }}
                    className={`
                      px-3 py-2
                      rounded-[var(--radius-md)]
                      font-display text-xs uppercase tracking-wider
                      border-2 transition-all duration-[var(--duration-fast)]
                      ${botDifficulty === difficulty
                        ? 'border-[var(--color-text-accent)] bg-[var(--color-text-accent)]/20 text-[var(--color-text-accent)]'
                        : 'border-[var(--color-border-default)] bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-accent)]'
                      }
                    `}
                    style={botDifficulty === difficulty ? { boxShadow: '0 0 10px var(--color-glow)' } : {}}
                  >
                    {difficulty === 'easy' && '😊'} {difficulty === 'medium' && '🤔'} {difficulty === 'hard' && '😈'} {difficulty}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center items-center flex-wrap">
            {showAddBot && onAddBot && (
              <Button
                ref={addBotButtonRef}
                onClick={() => { sounds.buttonClick(); onAddBot(); }}
                variant="warning"
                size="md"
              >
                🤖 Add Bot
              </Button>
            )}

            <Button
              ref={startGameButtonRef}
              data-testid={canStartGame ? "start-game-button" : "start-game-button-disabled"}
              onClick={canStartGame ? () => {
                sounds.gameStart();
                onStartGame();
              } : undefined}
              disabled={!canStartGame}
              variant="success"
              size="lg"
            >
              🎮 Start Game
            </Button>
          </div>

          {/* Start game validation message */}
          {!canStartGame && (
            <div
              className="
                p-3
                rounded-[var(--radius-md)]
                border border-[var(--color-warning)]
                bg-[var(--color-warning)]/10
                max-w-md mx-auto
              "
            >
              <p
                data-testid="start-game-message"
                className="text-sm font-body"
                style={{ color: 'var(--color-warning)' }}
              >
                {startGameMessage}
              </p>
            </div>
          )}
        </div>

        {/* Rules button */}
        <div className="mt-6">
          <NeonButton
            ref={rulesButtonRef}
            onClick={() => { sounds.buttonClick(); setShowRules(true); }}
            size="lg"
            fullWidth
            glow
          >
            📖 Game Rules
          </NeonButton>
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
              message: message.trim()
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
