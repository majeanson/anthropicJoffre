import { useState, useEffect, Suspense, lazy } from 'react';
import { getRecentPlayers, RecentPlayer } from '../utils/recentPlayers';
import { LobbyBrowser } from './LobbyBrowser';
import { HowToPlay } from './HowToPlay';
import { UnifiedDebugModal } from './UnifiedDebugModal';
import { useLobbyChat } from '../hooks/useLobbyChat';
import { SocialPanel } from './SocialPanel';
import { StatsPanel } from './StatsPanel';
import { GameCreationForm } from './GameCreationForm';
import { JoinGameForm } from './JoinGameForm';
import { ErrorBoundary } from './ErrorBoundary';
import { LobbyErrorFallback } from './fallbacks/LobbyErrorFallback';
import { StatsErrorFallback } from './fallbacks/StatsErrorFallback';
import { PlayContent } from './PlayContent';
import { SettingsContent } from './SettingsContent';
import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';
import { OnlinePlayer } from '../types/game';
import { useAuth } from '../contexts/AuthContext';
import { ProfileButton } from './ProfileButton';
import { ProfileEditorModal } from './ProfileEditorModal';

// Lazy load heavy modals
const PlayerStatsModal = lazy(() => import('./PlayerStatsModal').then(m => ({ default: m.PlayerStatsModal })));
const GlobalLeaderboard = lazy(() => import('./GlobalLeaderboard').then(m => ({ default: m.GlobalLeaderboard })));

interface LobbyProps {
  onCreateGame: (playerName: string, persistenceMode?: 'elo' | 'casual') => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onSpectateGame: (gameId: string, spectatorName?: string) => void;
  onQuickPlay: (difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual') => void;
  onRejoinGame?: () => void;
  hasValidSession?: boolean;
  autoJoinGameId?: string;
  onlinePlayers: OnlinePlayer[];
  socket: Socket | null;
  botDifficulty?: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
}


export function Lobby({ onCreateGame, onJoinGame, onSpectateGame, onQuickPlay, onRejoinGame, hasValidSession, autoJoinGameId, onlinePlayers, socket, botDifficulty = 'medium', onBotDifficultyChange, onShowLogin, onShowRegister }: LobbyProps) {
  const { user, updateProfile, getUserProfile } = useAuth();
  // Use authenticated username if available, otherwise use stored playerName for guests
  const [playerName, setPlayerName] = useState(() => {
    if (user?.username) {
      return user.username;
    }
    return localStorage.getItem('playerName') || '';
  });
  const [gameId, setGameId] = useState(autoJoinGameId || '');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'spectate'>(autoJoinGameId ? 'join' : 'menu');
  const [joinType, setJoinType] = useState<'player' | 'spectator'>('player');
  const [showRules, setShowRules] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [mainTab, setMainTab] = useState<'play' | 'social' | 'stats' | 'settings'>('play');
  const [socialTab, setSocialTab] = useState<'recent' | 'online' | 'chat' | 'friends' | 'messages' | 'profile'>('online');
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Lobby chat hook for UnifiedChat
  const { messages: lobbyMessages, sendMessage: sendLobbyMessage } = useLobbyChat({
    socket,
    playerName
  });
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [quickPlayPersistence, setQuickPlayPersistence] = useState<'elo' | 'casual'>('casual'); // Default to casual for Quick Play
  // Keyboard navigation state - layered like GameBoy menu
  // Level 0: Login/Register (if not logged in)
  // Level 1: Main tabs (PLAY, SOCIAL, STATS, SETTINGS)
  // Level 2: Tab content buttons
  // Level 3: Sub-content (if any)
  const [navLevel, setNavLevel] = useState<number>(0);
  const [navIndex, setNavIndex] = useState<number>(0); // Index within current level


  // Load recent players on mount
  useEffect(() => {
    setRecentPlayers(getRecentPlayers());
  }, []);

  // Sync playerName with auth and localStorage
  useEffect(() => {
    // If user is authenticated, use their username
    if (user?.username) {
      setPlayerName(user.username);
      localStorage.setItem('playerName', user.username);
    }
    // For guests, save to localStorage
    else if (playerName.trim()) {
      localStorage.setItem('playerName', playerName.trim());
    }
  }, [playerName, user]);

  // React to autoJoinGameId prop changes
  useEffect(() => {
    if (autoJoinGameId) {
      setGameId(autoJoinGameId);
      setMode('join');
    }
  }, [autoJoinGameId]);

  // Focus the name input when joining from URL
  useEffect(() => {
    if (autoJoinGameId && mode === 'join') {
      const nameInput = document.querySelector<HTMLInputElement>('[data-testid="player-name-input"]');
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
      }
    }
  }, [autoJoinGameId, mode]);

  // Get items for current navigation level
  const getItemsForLevel = (level: number): HTMLElement[] => {
    if (level === 0 && !user) {
      // Level 0: Login/Register buttons
      const items: HTMLElement[] = [];
      const loginBtn = document.querySelector('[data-keyboard-nav="login-btn"]') as HTMLElement;
      const registerBtn = document.querySelector('[data-keyboard-nav="register-btn"]') as HTMLElement;
      if (loginBtn) items.push(loginBtn);
      if (registerBtn) items.push(registerBtn);
      return items;
    } else if (level === 1 || (level === 0 && user)) {
      // Level 1: Main tabs (PLAY, SOCIAL, STATS, SETTINGS)
      return Array.from(document.querySelectorAll('[data-nav-tab]')) as HTMLElement[];
    } else if (level === 2) {
      // Level 2: Tab content buttons
      const tabContent = document.querySelector('[data-tab-content]');
      if (tabContent) {
        return Array.from(tabContent.querySelectorAll('[data-keyboard-nav]')) as HTMLElement[];
      }
    }
    return [];
  };

  // Get max level based on current state
  const getMaxLevel = (): number => {
    if (!user) return 2; // Login/Register -> Tabs -> Content
    return 1; // Tabs -> Content (no login level)
  };

  // Keyboard navigation for lobby menu - layered like GameBoy
  useEffect(() => {
    if (mode !== 'menu') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getItemsForLevel(navLevel);

      // Left/Right: Navigate within current level
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        if (items.length === 0) return;

        let newIndex: number;
        if (e.key === 'ArrowRight') {
          newIndex = (navIndex + 1) % items.length;
        } else {
          newIndex = navIndex === 0 ? items.length - 1 : navIndex - 1;
        }

        setNavIndex(newIndex);
        items[newIndex]?.focus();

        // If on tab level, also switch the tab
        if ((navLevel === 1) || (navLevel === 0 && user)) {
          const tabs = ['play', 'social', 'stats', 'settings'];
          if (tabs[newIndex]) {
            setMainTab(tabs[newIndex] as typeof mainTab);
          }
        }

        sounds.buttonClick();
      }

      // Down: Go deeper into menu OR navigate within content level
      else if (e.key === 'ArrowDown') {
        e.preventDefault();

        const effectiveLevel = user ? navLevel + 1 : navLevel; // Adjust for logged in users
        const contentLevel = user ? 1 : 2;

        if (effectiveLevel < contentLevel) {
          // Move to next level
          const nextLevel = navLevel + 1;
          const nextItems = getItemsForLevel(nextLevel);

          setNavLevel(nextLevel);
          setNavIndex(0);

          // Focus first item in new level after React re-renders
          setTimeout(() => {
            const newItems = getItemsForLevel(nextLevel);
            if (newItems.length > 0) {
              newItems[0]?.focus();
            }
          }, 50);
        } else {
          // Already at content level - navigate within content
          if (items.length === 0) return;
          const newIndex = (navIndex + 1) % items.length;
          setNavIndex(newIndex);
          items[newIndex]?.focus();
        }

        sounds.buttonClick();
      }

      // Up: Go back up in menu OR navigate within content level
      else if (e.key === 'ArrowUp') {
        e.preventDefault();

        const effectiveLevel = user ? navLevel + 1 : navLevel;
        const contentLevel = user ? 1 : 2;

        if (effectiveLevel === contentLevel && navIndex > 0) {
          // Navigate up within content level
          const newIndex = navIndex - 1;
          setNavIndex(newIndex);
          items[newIndex]?.focus();
        } else if (navLevel > 0) {
          // Go back to previous level
          const prevLevel = navLevel - 1;
          const prevItems = getItemsForLevel(prevLevel);

          // Find the index of current tab in prev level
          let prevIndex = 0;
          if ((prevLevel === 1) || (prevLevel === 0 && user)) {
            const tabs = ['play', 'social', 'stats', 'settings'];
            prevIndex = tabs.indexOf(mainTab);
          }

          setNavLevel(prevLevel);
          setNavIndex(prevIndex >= 0 ? prevIndex : 0);

          setTimeout(() => {
            const newItems = getItemsForLevel(prevLevel);
            if (newItems.length > 0) {
              newItems[prevIndex >= 0 ? prevIndex : 0]?.focus();
            }
          }, 50);
        }

        sounds.buttonClick();
      }

      // Enter: Activate focused item
      else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[navIndex];
        if (item) {
          item.click();
        }
      }

      // Escape: Go back one level (or clear focus at top)
      else if (e.key === 'Escape') {
        if (navLevel > 0) {
          const prevLevel = navLevel - 1;
          setNavLevel(prevLevel);
          setNavIndex(0);
          setTimeout(() => {
            const newItems = getItemsForLevel(prevLevel);
            if (newItems.length > 0) {
              newItems[0]?.focus();
            }
          }, 50);
        } else {
          // At top level, blur everything
          (document.activeElement as HTMLElement)?.blur();
        }
        sounds.buttonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, mainTab, socialTab, navLevel, navIndex, user, playerName, socket, hasValidSession, onlinePlayers]);

  if (mode === 'create') {
    return (
      <GameCreationForm
        playerName={playerName}
        setPlayerName={setPlayerName}
        onCreateGame={onCreateGame}
        onBack={() => setMode('menu')}
        user={user}
      />
    );
  }

  if (mode === 'join') {
    return (
      <JoinGameForm
        gameId={gameId}
        setGameId={setGameId}
        playerName={playerName}
        setPlayerName={setPlayerName}
        joinType={joinType}
        setJoinType={setJoinType}
        autoJoinGameId={autoJoinGameId}
        onJoinGame={onJoinGame}
        onSpectateGame={onSpectateGame}
        onBack={() => setMode('menu')}
        onBackToHomepage={() => {
          setMode('menu');
          setGameId('');
          setPlayerName('');
        }}
        user={user}
        socket={socket}
        showPlayerStats={showPlayerStats}
        setShowPlayerStats={setShowPlayerStats}
        showLeaderboard={showLeaderboard}
        setShowLeaderboard={setShowLeaderboard}
        selectedPlayerName={selectedPlayerName}
        setSelectedPlayerName={setSelectedPlayerName}
      />
    );
  }

  if (mode === 'menu') {
    return (
      <>
        <HowToPlay isModal={true} isOpen={showRules} onClose={() => setShowRules(false)} />
        <UnifiedDebugModal
          isOpen={showDebug}
          onClose={() => setShowDebug(false)}
          socket={socket}
        />
        {showBrowser && (
          <ErrorBoundary fallback={<LobbyErrorFallback onClose={() => setShowBrowser(false)} />}>
            <LobbyBrowser
              socket={socket}
              onJoinGame={(gameId) => {
                // Close browser and directly join the game (don't show join form)
                setShowBrowser(false);

                // If playerName is empty, prompt user to enter name first
                if (!playerName.trim()) {
                  setGameId(gameId);
                  setMode('join');
                  return;
                }

                onJoinGame(gameId, playerName);
              }}
              onSpectateGame={(gameId) => {
                setShowBrowser(false);
                onSpectateGame(gameId, playerName);
              }}
              onClose={() => setShowBrowser(false)}
            />
          </ErrorBoundary>
        )}
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated background cards */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
            <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
            <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
            <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
          </div>

          <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-10 shadow-2xl max-w-md w-full border-4 border-amber-700 dark:border-gray-600 relative">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-br-xl"></div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-800 via-orange-700 to-red-800 dark:from-blue-400 dark:via-purple-500 dark:to-pink-500 font-serif tracking-wider animate-pulse" style={{ animationDuration: '1s' }}>
                J⋀ffre
              </h1>
              {/* Authentication Section */}
              <div className="mt-4">
                {user ? (
                  <div className="flex flex-col items-center gap-2">
                    {/* Profile Button - Clickable dropdown menu with profile actions */}
                    <ProfileButton
                      user={user}
                      playerName={playerName}
                      socket={socket}
                      onShowLogin={onShowLogin}
                      onShowProfileEditor={() => setShowProfileEditor(true)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {playerName.trim() && (
                      <p className="text-xs text-umber-600 dark:text-gray-400 font-medium">
                        Playing as <span className="font-bold text-umber-800 dark:text-gray-200">{playerName}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        data-keyboard-nav="login-btn"
                        onClick={onShowLogin}
                        className="text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Login
                      </button>
                      <button
                        data-keyboard-nav="register-btn"
                        onClick={onShowRegister}
                        className="text-sm px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200 shadow focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                      >
                        Register
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Tab Navigation */}
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  data-nav-tab="play"
                  onClick={() => { sounds.buttonClick(); setMainTab('play'); setNavIndex(0); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    mainTab === 'play'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105 border-b-4 border-orange-500'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  PLAY
                </button>
                <button
                  data-nav-tab="social"
                  onClick={() => { sounds.buttonClick(); setMainTab('social'); setNavIndex(1); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm relative focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    mainTab === 'social'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105 border-b-4 border-orange-500'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  SOCIAL
                  {onlinePlayers.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {onlinePlayers.length}
                    </span>
                  )}
                </button>
                <button
                  data-nav-tab="stats"
                  onClick={() => { sounds.buttonClick(); setMainTab('stats'); setNavIndex(2); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    mainTab === 'stats'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105 border-b-4 border-orange-500'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  STATS
                </button>
                <button
                  data-nav-tab="settings"
                  onClick={() => { sounds.buttonClick(); setMainTab('settings'); setNavIndex(3); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${
                    mainTab === 'settings'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105 border-b-4 border-orange-500'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  SETTINGS
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]" data-tab-content>
                {/* PLAY TAB */}
                {mainTab === 'play' && (
                  <PlayContent
                    hasValidSession={hasValidSession}
                    onRejoinGame={onRejoinGame}
                    playerName={playerName}
                    socket={socket}
                    onResumeGame={(gameId) => {
                      // Use join game to resume - it will handle reconnection automatically
                      onJoinGame(gameId, playerName);
                    }}
                    onCreateGame={() => setMode('create')}
                    onBrowseGames={() => setShowBrowser(true)}
                    botDifficulty={botDifficulty}
                    onBotDifficultyChange={onBotDifficultyChange}
                    quickPlayPersistence={quickPlayPersistence}
                    setQuickPlayPersistence={setQuickPlayPersistence}
                    onQuickPlay={onQuickPlay}
                    user={user}
                  />
                )}

                {/* SOCIAL TAB - Extracted to SocialPanel */}
                {mainTab === 'social' && (
                  <SocialPanel
                    socialTab={socialTab}
                    setSocialTab={setSocialTab}
                    onlinePlayers={onlinePlayers}
                    recentPlayers={recentPlayers}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    onJoinGame={onJoinGame}
                    socket={socket}
                    user={user}
                    lobbyMessages={lobbyMessages}
                    sendLobbyMessage={sendLobbyMessage}
                  />
                )}

                {/* STATS TAB - Extracted to StatsPanel */}
                {mainTab === 'stats' && (
                  <StatsPanel
                    socket={socket}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    setSelectedPlayerName={setSelectedPlayerName}
                    setShowPlayerStats={setShowPlayerStats}
                    setShowLeaderboard={setShowLeaderboard}
                    setShowBrowser={setShowBrowser}
                  />
                )}

                {/* SETTINGS TAB */}
                {mainTab === 'settings' && (
                  <SettingsContent
                    onShowRules={() => setShowRules(true)}
                    onShowDebug={() => setShowDebug(true)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Leaderboard Modals */}
        {socket && (
          <ErrorBoundary fallback={<StatsErrorFallback onClose={() => { setShowPlayerStats(false); setShowLeaderboard(false); }} />}>
            <Suspense fallback={<div />}>
              <PlayerStatsModal
                playerName={selectedPlayerName}
                socket={socket}
                isOpen={showPlayerStats}
                onClose={() => setShowPlayerStats(false)}
              />
              <GlobalLeaderboard
                socket={socket}
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                onViewPlayerStats={(playerName) => {
                  setSelectedPlayerName(playerName);
                  setShowLeaderboard(false);
                  setShowPlayerStats(true);
                }}
              />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* Profile Editor Modal */}
        {showProfileEditor && user && (
          <ProfileEditorModal
            user={user}
            onClose={() => setShowProfileEditor(false)}
            updateProfile={updateProfile}
            getUserProfile={getUserProfile}
          />
        )}
      </>
    );
  }

  // Should never reach here - modes are handled above
  return null;
}
