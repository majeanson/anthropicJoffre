import { Player, ChatMessage } from '../types/game';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useSettings } from '../contexts/SettingsContext';
import { HowToPlay } from './HowToPlay';
import { BotDifficulty } from '../utils/botPlayer';
import { PlayerConnectionIndicator } from './PlayerConnectionIndicator';
import { UnifiedChat } from './UnifiedChat';
import { TeamSelectionSocialSidebar } from './TeamSelectionSocialSidebar';
import { sounds } from '../utils/sounds';
import { colors } from '../design-system';
import { UICard } from './ui/UICard';

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
}: TeamSelectionProps) {
  const { darkMode, setDarkMode } = useSettings();
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [showSocialSidebar, setShowSocialSidebar] = useState(false);

  // Keyboard navigation state - grid-based like GameBoy
  // Sections: header -> teams -> difficulty -> actions -> rules
  const [navSection, setNavSection] = useState<NavSection>('actions');
  const [navCol, setNavCol] = useState(0);
  const [teamNavRow, setTeamNavRow] = useState(0); // 0-1 for team positions
  const [teamNavTeam, setTeamNavTeam] = useState<1 | 2>(1); // Which team

  // Refs for focusable elements
  const leaveButtonRef = useRef<HTMLButtonElement>(null);
  const darkModeButtonRef = useRef<HTMLButtonElement>(null);
  const copyLinkButtonRef = useRef<HTMLButtonElement>(null);
  const easyButtonRef = useRef<HTMLButtonElement>(null);
  const mediumButtonRef = useRef<HTMLButtonElement>(null);
  const hardButtonRef = useRef<HTMLButtonElement>(null);
  const addBotButtonRef = useRef<HTMLButtonElement>(null);
  const startGameButtonRef = useRef<HTMLButtonElement>(null);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const team1SwapRefs = useRef<(HTMLButtonElement | null)[]>([null, null]);
  const team2SwapRefs = useRef<(HTMLButtonElement | null)[]>([null, null]);

  // Sprint 8 Task 2: Memoize expensive computations for performance
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

  // Listen for chat messages (for FloatingTeamChat)
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
    }
  }, [gameId]);

  // Check if difficulty section is visible
  const showDifficulty = players.filter(p => !p.isEmpty).length < 4 && onAddBot && onBotDifficultyChange;
  const showAddBot = players.filter(p => !p.isEmpty).length < 4 && onAddBot;

  // Get sections in order (some may be hidden)
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
      case 'teams': return 2; // Team 1 | Team 2
      case 'difficulty': return 3; // Easy | Medium | Hard
      case 'actions': return showAddBot ? 2 : 1; // Add Bot | Start Game
      case 'rules': return 1;
      default: return 1;
    }
  }, [onLeaveGame, showAddBot]);

  // Focus current element based on section and column
  const focusCurrentElement = useCallback(() => {
    switch (navSection) {
      case 'header':
        if (navCol === 0 && leaveButtonRef.current) leaveButtonRef.current.focus();
        else if (navCol === 1 && darkModeButtonRef.current) darkModeButtonRef.current.focus();
        else if (!onLeaveGame && darkModeButtonRef.current) darkModeButtonRef.current.focus();
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
    if (showRules) return; // Don't navigate when modal is open

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
            // Navigate within team positions
            setTeamNavRow(prev => prev > 0 ? prev - 1 : 1);
          } else {
            // Move to previous section
            const newIndex = currentIndex > 0 ? currentIndex - 1 : sections.length - 1;
            setNavSection(sections[newIndex]);
            setNavCol(0);
          }
          sounds.buttonClick();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (navSection === 'teams') {
            // Navigate within team positions
            setTeamNavRow(prev => prev < 1 ? prev + 1 : 0);
          } else {
            // Move to next section
            const newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : 0;
            setNavSection(sections[newIndex]);
            setNavCol(0);
          }
          sounds.buttonClick();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (navSection === 'teams') {
            // Switch between teams
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
            // Switch between teams
            setTeamNavTeam(prev => prev === 1 ? 2 : 1);
          } else {
            const maxCols = getMaxCols(navSection);
            setNavCol(prev => prev < maxCols - 1 ? prev + 1 : 0);
          }
          sounds.buttonClick();
          break;

        case 'Enter':
        case ' ':
          // Let buttons handle their own clicks
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

  // Validation for starting game (memoized to avoid recalculation on every render)
  const canStartGame = useMemo(() => {
    // Must have 4 players (including real players, bots, but NOT empty seats)
    const realPlayers = players.filter(p => !p.isEmpty);
    if (realPlayers.length !== 4) return false;

    // Must have 2 real players per team (no empty seats)
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: colors.gradients.special }}>
      <div className="bg-parchment-50 dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-4xl w-full relative border-2 border-amber-700 dark:border-gray-600 backdrop-blur-sm">

        {/* Top-left buttons */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          {onLeaveGame && (
            <button
              ref={leaveButtonRef}
              onClick={onLeaveGame}
              className="text-white px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 border-2 border-red-800 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              style={{ background: colors.gradients.error }}
              title="Leave Game"
            >
              <span aria-hidden="true">🚪</span> Leave
            </button>
          )}
          <button
            onClick={() => setShowSocialSidebar(!showSocialSidebar)}
            className="text-white px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 border-2 border-green-800 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            style={{ background: colors.gradients.success }}
            title="Find players to invite"
          >
            <span aria-hidden="true">👥</span> Find Players
          </button>
          <button
            ref={darkModeButtonRef}
            onClick={() => setDarkMode(!darkMode)}
            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 border-2 border-gray-900 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            title={darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <h2 className="text-3xl font-bold mb-6 text-umber-900 dark:text-gray-100 text-center font-serif mt-12">Team Selection</h2>

        <div className="mb-6">
          <p className="text-sm text-umber-700 dark:text-gray-300 mb-2">Game ID:</p>
          <UICard variant="bordered" size="md" className="bg-parchment-100 dark:bg-gray-700">
            <div data-testid="game-id" className="font-mono text-lg text-center text-umber-900 dark:text-gray-100">{gameId}</div>
          </UICard>

          {/* Copy Game Link Button */}
          <button
            ref={copyLinkButtonRef}
            onClick={handleCopyGameLink}
            className="w-full mt-3 text-white px-4 py-2.5 rounded-lg font-bold transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            style={{ background: colors.gradients.info }}
            title="Copy shareable game link"
          >
            <span aria-hidden="true">🔗</span>
            <span>Copy Game Link</span>
          </button>
        </div>

        {/* Toast Notification */}
        {showCopyToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-green-700 animate-bounce z-50 flex items-center gap-2">
            <span>✅</span>
            <span className="font-bold">Game link copied! Share with friends.</span>
          </div>
        )}

        <div className="mb-8">
          <p className="text-center text-umber-700 dark:text-gray-300 mb-4">
            Players (<span data-testid="player-count">{players.length}</span>/4) - Choose your team and position
          </p>
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Team 1 */}
          <UICard variant="bordered" size="lg" className="border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/40" data-testid="team-1-container">
            <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team1Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;
                const isEmptySeat = playerAtPosition?.isEmpty;

                return (
                  <div
                    key={`team1-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-orange-200 dark:bg-orange-700/60 border-orange-500 dark:border-orange-500'
                        : playerAtPosition && !isEmptySeat
                        ? 'bg-parchment-50 dark:bg-gray-700 border-orange-200 dark:border-orange-700'
                        : 'bg-parchment-100 dark:bg-gray-700 border-dashed border-parchment-300 dark:border-gray-600'
                    }`}
                  >
                    {playerAtPosition && !isEmptySeat ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-umber-900 dark:text-gray-100 text-center sm:text-left">
                            {playerAtPosition.name}
                            {isCurrentPlayer && ' (You)'}
                          </span>
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
                            <button
                              onClick={() => onSwapPosition(playerAtPosition.id)}
                              className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-orange-800 shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                              style={{ background: colors.gradients.team1 }}
                              title={currentPlayer.teamId !== 1 ? 'Swap with this player (changes teams!)' : 'Swap positions'}
                              aria-label={`Swap positions with ${playerAtPosition.name}${currentPlayer.teamId !== 1 ? ' (this will change your team)' : ''}`}
                            >
                              Swap
                            </button>
                          )}
                          {!isCurrentPlayer && currentPlayerId === creatorId && onKickPlayer && (
                            <button
                              onClick={() => onKickPlayer(playerAtPosition.id)}
                              className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-red-800 shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                              style={{ background: colors.gradients.error }}
                              title="Remove player from game"
                              aria-label={`Remove ${playerAtPosition.name} from game`}
                            >
                              <span aria-hidden="true">✕</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        {isEmptySeat ? (
                          <div className="space-y-2">
                            <div className="text-umber-400 dark:text-gray-500 text-sm italic">
                              💺 {playerAtPosition.emptySlotName || 'Empty Seat'}
                            </div>
                            {!currentPlayer && socket && (
                              <button
                                onClick={() => {
                                  // Get player index to fill the seat
                                  const allPlayers = players;
                                  const seatIndex = allPlayers.findIndex(p => p.id === playerAtPosition.id);
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
                                className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-green-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                style={{ background: colors.gradients.success }}
                              >
                                Fill Seat
                              </button>
                            )}
                          </div>
                        ) : currentPlayer?.teamId !== 1 ? (
                          <button
                            onClick={() => {
                              sounds.teamSwitch(); // Sprint 1 Phase 6
                              onSelectTeam(1);
                            }}
                            className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium"
                          >
                            Join Team 1
                          </button>
                        ) : (
                          <span className="text-umber-400 dark:text-gray-500">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </UICard>

          {/* Team 2 */}
          <UICard variant="bordered" size="lg" className="border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/40" data-testid="team-2-container">
            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team2Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;
                const isEmptySeat = playerAtPosition?.isEmpty;

                return (
                  <div
                    key={`team2-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-purple-200 dark:bg-purple-700/60 border-purple-500 dark:border-purple-500'
                        : playerAtPosition && !isEmptySeat
                        ? 'bg-parchment-50 dark:bg-gray-700 border-purple-200 dark:border-purple-700'
                        : 'bg-parchment-100 dark:bg-gray-700 border-dashed border-parchment-300 dark:border-gray-600'
                    }`}
                  >
                    {playerAtPosition && !isEmptySeat ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-umber-900 dark:text-gray-100 text-center sm:text-left">
                            {playerAtPosition.name}
                            {isCurrentPlayer && ' (You)'}
                          </span>
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
                            <button
                              onClick={() => onSwapPosition(playerAtPosition.id)}
                              className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-purple-800 shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                              style={{ background: colors.gradients.team2 }}
                              title={currentPlayer.teamId !== 2 ? 'Swap with this player (changes teams!)' : 'Swap positions'}
                            >
                              Swap
                            </button>
                          )}
                          {!isCurrentPlayer && currentPlayerId === creatorId && onKickPlayer && (
                            <button
                              onClick={() => onKickPlayer(playerAtPosition.id)}
                              className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-red-800 shadow-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                              style={{ background: colors.gradients.error }}
                              title="Remove player from game"
                            >
                              <span aria-hidden="true">✕</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        {isEmptySeat ? (
                          <div className="space-y-2">
                            <div className="text-umber-400 dark:text-gray-500 text-sm italic">
                              💺 {playerAtPosition.emptySlotName || 'Empty Seat'}
                            </div>
                            {!currentPlayer && socket && (
                              <button
                                onClick={() => {
                                  // Get player index to fill the seat
                                  const allPlayers = players;
                                  const seatIndex = allPlayers.findIndex(p => p.id === playerAtPosition.id);
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
                                className="text-xs text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-green-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                style={{ background: colors.gradients.success }}
                              >
                                Fill Seat
                              </button>
                            )}
                          </div>
                        ) : currentPlayer?.teamId !== 2 ? (
                          <button
                            onClick={() => {
                              sounds.teamSwitch(); // Sprint 1 Phase 6
                              onSelectTeam(2);
                            }}
                            className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                          >
                            Join Team 2
                          </button>
                        ) : (
                          <span className="text-umber-400 dark:text-gray-500">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </UICard>
        </div>


        {/* Bot Difficulty & Start Game Section */}
        <div className="text-center space-y-3">
          {/* Bot Difficulty Selector */}
          {players.filter(p => !p.isEmpty).length < 4 && onAddBot && onBotDifficultyChange && (
            <UICard variant="bordered" size="md" className="bg-parchment-200 dark:bg-gray-700 max-w-md mx-auto">
              <label className="block text-xs font-semibold text-umber-700 dark:text-gray-300 mb-2">
                Bot Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  ref={easyButtonRef}
                  onClick={() => onBotDifficultyChange('easy')}
                  className={`py-2 px-2 rounded font-bold transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-umber-400 focus:ring-offset-2 ${
                    botDifficulty === 'easy'
                      ? 'bg-umber-600 dark:bg-gray-600 text-white shadow-md scale-105 border border-umber-800 dark:border-gray-500'
                      : 'bg-parchment-100 dark:bg-gray-600 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-500'
                  }`}
                >
                  Easy
                </button>
                <button
                  ref={mediumButtonRef}
                  onClick={() => onBotDifficultyChange('medium')}
                  className={`py-2 px-2 rounded font-bold transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-umber-400 focus:ring-offset-2 ${
                    botDifficulty === 'medium'
                      ? 'bg-umber-600 dark:bg-gray-600 text-white shadow-md scale-105 border border-umber-800 dark:border-gray-500'
                      : 'bg-parchment-100 dark:bg-gray-600 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-500'
                  }`}
                >
                  Medium
                </button>
                <button
                  ref={hardButtonRef}
                  onClick={() => onBotDifficultyChange('hard')}
                  className={`py-2 px-2 rounded font-bold transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-umber-400 focus:ring-offset-2 ${
                    botDifficulty === 'hard'
                      ? 'bg-umber-600 dark:bg-gray-600 text-white shadow-md scale-105 border border-umber-800 dark:border-gray-500'
                      : 'bg-parchment-100 dark:bg-gray-600 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-500'
                  }`}
                >
                  Hard
                </button>
              </div>
            </UICard>
          )}

          <div className="flex gap-3 justify-center items-center">
            {/* Add Bot Button - only show if less than 4 real players (excluding empty seats) */}
            {players.filter(p => !p.isEmpty).length < 4 && onAddBot && (
              <button
                ref={addBotButtonRef}
                onClick={onAddBot}
                className="text-white px-6 py-3 rounded-lg text-base font-bold transition-all duration-200 border border-umber-800 dark:border-gray-600 shadow flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                style={{ background: colors.gradients.warning }}
                title="Add a bot player"
              >
                <span aria-hidden="true">🤖</span> Add Bot
              </button>
            )}

            {canStartGame ? (
              <button
                ref={startGameButtonRef}
                data-testid="start-game-button"
                onClick={() => {
                  sounds.gameStart(); // Sprint 1 Phase 6
                  onStartGame();
                }}
                className="bg-forest-600 text-parchment-50 px-8 py-3 rounded-lg text-lg font-bold hover:bg-forest-700 shadow-lg transition-colors border-2 border-forest-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              >
                Start Game
              </button>
            ) : (
              <button
                ref={startGameButtonRef}
                data-testid="start-game-button-disabled"
                disabled
                className="bg-parchment-300 text-umber-500 px-8 py-3 rounded-lg text-lg font-bold cursor-not-allowed border-2 border-parchment-400 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Start Game
              </button>
            )}
          </div>

          {!canStartGame && (
            <UICard variant="bordered" size="sm" className="bg-parchment-200 dark:bg-gray-600 border-umber-400">
              <p data-testid="start-game-message" className="text-umber-800 dark:text-gray-200">
                {startGameMessage}
              </p>
            </UICard>
          )}
        </div>

        <div className="mt-6">
          <button
            ref={rulesButtonRef}
            onClick={() => setShowRules(true)}
            className="w-full text-white py-3 rounded-xl font-bold transition-all duration-300 border-2 border-amber-800 dark:border-amber-900 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            style={{ background: colors.gradients.warning }}
          >
            <span aria-hidden="true">📖</span> Game Rules
          </button>
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
