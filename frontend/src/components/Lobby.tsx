import { useState, useEffect, Suspense, lazy } from 'react';
import { getRecentPlayers, RecentPlayer } from '../utils/recentPlayers';
import { DarkModeToggle } from './DarkModeToggle';
import { LobbyBrowser } from './LobbyBrowser';
import { HowToPlay } from './HowToPlay';
import { DebugInfo } from './DebugInfo';
import { LobbyChat } from './LobbyChat';
import { ActiveGames } from './ActiveGames';
import { QuickPlayPanel } from './QuickPlayPanel';
import { SocialPanel } from './SocialPanel';
import { StatsPanel } from './StatsPanel';
import { GameCreationForm } from './GameCreationForm';
import { JoinGameForm } from './JoinGameForm';
import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';
import { OnlinePlayer } from '../types/game';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, logout } = useAuth();
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
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [mainTab, setMainTab] = useState<'play' | 'social' | 'stats' | 'settings'>('play');
  const [socialTab, setSocialTab] = useState<'recent' | 'online' | 'chat'>('online');
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [soundVolume, setSoundVolume] = useState(sounds.getVolume());
  const [quickPlayPersistence, setQuickPlayPersistence] = useState<'elo' | 'casual'>('casual'); // Default to casual for Quick Play
  const [focusedTabIndex, setFocusedTabIndex] = useState<number | null>(null); // 0=PLAY, 1=SOCIAL, 2=STATS, 3=SETTINGS
  const [focusedButtonIndex, setFocusedButtonIndex] = useState<number>(0); // Index within active tab


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

  // Keyboard navigation for lobby menu
  useEffect(() => {
    if (mode !== 'menu') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab navigation with Arrow Left/Right
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const tabs = ['play', 'social', 'stats', 'settings'];
        const currentIndex = tabs.indexOf(mainTab);

        if (e.key === 'ArrowRight') {
          const nextIndex = (currentIndex + 1) % tabs.length;
          setMainTab(tabs[nextIndex] as typeof mainTab);
          setFocusedTabIndex(nextIndex);
          setFocusedButtonIndex(0);
        } else {
          const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
          setMainTab(tabs[prevIndex] as typeof mainTab);
          setFocusedTabIndex(prevIndex);
          setFocusedButtonIndex(0);
        }
        sounds.buttonClick();
      }

      // Button navigation within tab with Arrow Up/Down
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        // Get all interactive buttons in current tab
        const buttons = getActiveTabButtons();

        if (buttons.length === 0) return;

        // Initialize focus if not set
        if (focusedTabIndex === null) {
          const tabs = ['play', 'social', 'stats', 'settings'];
          setFocusedTabIndex(tabs.indexOf(mainTab));
          setFocusedButtonIndex(0);
          sounds.buttonClick();
          return;
        }

        if (e.key === 'ArrowDown') {
          setFocusedButtonIndex((prev) => (prev + 1) % buttons.length);
        } else {
          setFocusedButtonIndex((prev) => prev === 0 ? buttons.length - 1 : prev - 1);
        }
        sounds.buttonClick();
      }

      // Activate focused button with Enter
      else if (e.key === 'Enter') {
        if (focusedTabIndex !== null) {
          e.preventDefault();
          const buttons = getActiveTabButtons();
          const button = buttons[focusedButtonIndex];
          if (button) {
            button.click();
          }
        }
      }

      // Clear focus with Escape
      else if (e.key === 'Escape') {
        setFocusedTabIndex(null);
        setFocusedButtonIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, mainTab, socialTab, focusedTabIndex, focusedButtonIndex, playerName, socket, hasValidSession, onlinePlayers]);

  // Helper function to get all interactive buttons in the current tab
  const getActiveTabButtons = (): HTMLButtonElement[] => {
    const buttons: HTMLButtonElement[] = [];

    if (mainTab === 'play') {
      // Rejoin button (if available)
      if (hasValidSession && onRejoinGame) {
        const rejoinBtn = document.querySelector('[data-testid="rejoin-game-button"]') as HTMLButtonElement;
        if (rejoinBtn) buttons.push(rejoinBtn);
      }

      // Create Game, Browse Games, Quick Play buttons
      const createBtn = document.querySelector('[data-testid="create-game-button"]') as HTMLButtonElement;
      const browseBtn = document.querySelector('[data-keyboard-nav="browse-games"]') as HTMLButtonElement;
      const quickPlayBtn = document.querySelector('[data-testid="quick-play-button"]') as HTMLButtonElement;

      if (createBtn) buttons.push(createBtn);
      if (browseBtn) buttons.push(browseBtn);
      if (quickPlayBtn) buttons.push(quickPlayBtn);
    } else if (mainTab === 'social') {
      // Social sub-tabs
      const onlineTabBtn = document.querySelector('[data-keyboard-nav="social-online"]') as HTMLButtonElement;
      const chatTabBtn = document.querySelector('[data-keyboard-nav="social-chat"]') as HTMLButtonElement;
      const recentTabBtn = document.querySelector('[data-keyboard-nav="social-recent"]') as HTMLButtonElement;

      if (onlineTabBtn) buttons.push(onlineTabBtn);
      if (chatTabBtn) buttons.push(chatTabBtn);
      if (recentTabBtn) buttons.push(recentTabBtn);

      // Join buttons for online players
      if (socialTab === 'online') {
        const joinButtons = Array.from(document.querySelectorAll('[data-keyboard-nav^="join-player-"]')) as HTMLButtonElement[];
        buttons.push(...joinButtons);
      }
    } else if (mainTab === 'stats') {
      const myStatsBtn = document.querySelector('[data-keyboard-nav="my-stats"]') as HTMLButtonElement;
      const leaderboardBtn = document.querySelector('[data-keyboard-nav="leaderboard"]') as HTMLButtonElement;
      const recentGamesBtn = document.querySelector('[data-keyboard-nav="recent-games"]') as HTMLButtonElement;

      if (myStatsBtn) buttons.push(myStatsBtn);
      if (leaderboardBtn) buttons.push(leaderboardBtn);
      if (recentGamesBtn) buttons.push(recentGamesBtn);
    } else if (mainTab === 'settings') {
      const rulesBtn = document.querySelector('[data-keyboard-nav="how-to-play"]') as HTMLButtonElement;
      const debugBtn = document.querySelector('[data-keyboard-nav="debug-fun"]') as HTMLButtonElement;

      if (rulesBtn) buttons.push(rulesBtn);
      if (debugBtn) buttons.push(debugBtn);
    }

    return buttons;
  };

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
        <DebugInfo isOpen={showDebugInfo} onClose={() => setShowDebugInfo(false)} />
        {showBrowser && (
          <LobbyBrowser
            socket={socket}
            onJoinGame={(gameId) => {
              setGameId(gameId);
              setMode('join');
            }}
            onSpectateGame={(gameId) => {
              setGameId(gameId);
              setMode('join');
              setJoinType('spectator');
            }}
            onClose={() => setShowBrowser(false)}
          />
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
              {playerName.trim() && !user && (
                <p className="text-sm text-umber-600 dark:text-gray-400 mt-2 font-medium">
                  Joined as <span className="font-bold text-umber-800 dark:text-gray-200">{playerName}</span>
                </p>
              )}

              {/* Authentication Section */}
              <div className="mt-4">
                {user ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2 bg-parchment-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                      {user.avatar_url && (
                        <img src={user.avatar_url} alt={user.username} className="w-6 h-6 rounded-full" />
                      )}
                      <span className="text-sm font-semibold text-umber-800 dark:text-gray-200">
                        {user.display_name || user.username}
                      </span>
                      {user.is_verified && <span className="text-blue-500" title="Verified">✓</span>}
                    </div>
                    <button
                      onClick={() => logout()}
                      className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={onShowLogin}
                      className="text-sm px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 shadow"
                    >
                      Login
                    </button>
                    <button
                      onClick={onShowRegister}
                      className="text-sm px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200 shadow"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Tab Navigation */}
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => { sounds.buttonClick(); setMainTab('play'); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                    mainTab === 'play'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  PLAY
                </button>
                <button
                  onClick={() => { sounds.buttonClick(); setMainTab('social'); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm relative ${
                    mainTab === 'social'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105'
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
                  onClick={() => { sounds.buttonClick(); setMainTab('stats'); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                    mainTab === 'stats'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  STATS
                </button>
                <button
                  onClick={() => { sounds.buttonClick(); setMainTab('settings'); }}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                    mainTab === 'settings'
                      ? 'bg-gradient-to-r from-umber-600 to-umber-700 dark:from-purple-700 dark:to-purple-800 text-white shadow-lg scale-105'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  SETTINGS
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {/* PLAY TAB */}
                {mainTab === 'play' && (
                  <div className="space-y-4">
                    {/* Rejoin Game (if available) */}
                    {hasValidSession && onRejoinGame && (
                      <button
                        data-testid="rejoin-game-button"
                        onClick={onRejoinGame}
                        className="w-full bg-gradient-to-r from-umber-600 to-umber-700 dark:from-gray-600 dark:to-gray-700 text-white py-4 rounded-xl font-bold hover:from-umber-700 hover:to-umber-800 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-2 ring-2 ring-umber-400 dark:ring-gray-500 animate-pulse border border-umber-800 dark:border-gray-600 shadow-lg"
                      >
                        <span>🔄</span>
                        <span>Rejoin Game</span>
                      </button>
                    )}

                    {/* Active Games (Resumable) */}
                    <ActiveGames
                      playerName={playerName}
                      socket={socket}
                      onResumeGame={(gameId) => {
                        // Use join game to resume - it will handle reconnection automatically
                        onJoinGame(gameId, playerName);
                      }}
                    />

                    {/* Multiplayer Section */}
                    <div className="bg-parchment-200 dark:bg-gray-700/50 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-600">
                      <h3 className="text-sm font-bold text-umber-800 dark:text-gray-200 mb-3 text-center">
                        Multiplayer
                      </h3>
                      <div className="space-y-2">
                        <button
                          data-testid="create-game-button"
                          onClick={() => { sounds.buttonClick(); setMode('create'); }}
                          className="w-full bg-gradient-to-r from-amber-700 to-orange-700 dark:from-purple-700 dark:to-purple-800 text-white py-3 rounded-lg font-bold hover:from-amber-800 hover:to-orange-800 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200 border border-amber-900 dark:border-purple-600 shadow"
                        >
                          ➕ Create Game
                        </button>

                        <button
                          data-keyboard-nav="browse-games"
                          onClick={() => { sounds.buttonClick(); setShowBrowser(true); }}
                          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 dark:from-indigo-700 dark:to-indigo-800 text-white py-3 rounded-lg font-bold hover:from-amber-700 hover:to-orange-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-200 border border-amber-800 dark:border-indigo-600 shadow flex items-center justify-center gap-2"
                        >
                          <span>🔍</span>
                          Browse & Join Games
                        </button>
                      </div>
                    </div>

                    {/* Quick Play Section - Extracted to QuickPlayPanel */}
                    <QuickPlayPanel
                      botDifficulty={botDifficulty}
                      onBotDifficultyChange={onBotDifficultyChange}
                      quickPlayPersistence={quickPlayPersistence}
                      setQuickPlayPersistence={setQuickPlayPersistence}
                      onQuickPlay={onQuickPlay}
                    />
                  </div>
                )}

                {/* SOCIAL TAB - Extracted to SocialPanel */}
                {mainTab === 'social' && (
                  <div className="space-y-4">
                    {socialTab === 'chat' ? (
                      <>
                        {/* Chat tab button */}
                        <div className="flex gap-2">
                          <button
                            data-keyboard-nav="social-online"
                            onClick={() => { sounds.buttonClick(); setSocialTab('online'); }}
                            className="flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600"
                          >
                            🟢 Online ({onlinePlayers.length})
                          </button>
                          <button
                            data-keyboard-nav="social-chat"
                            onClick={() => { sounds.buttonClick(); setSocialTab('chat'); }}
                            className="flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg"
                          >
                            💬 Chat
                          </button>
                          <button
                            data-keyboard-nav="social-recent"
                            onClick={() => { sounds.buttonClick(); setSocialTab('recent'); }}
                            className="flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600"
                          >
                            📜 Recent
                          </button>
                        </div>
                        <LobbyChat
                          socket={socket}
                          playerName={playerName}
                          onSetPlayerName={setPlayerName}
                        />
                      </>
                    ) : (
                      <SocialPanel
                        socialTab={socialTab}
                        setSocialTab={setSocialTab}
                        onlinePlayers={onlinePlayers}
                        recentPlayers={recentPlayers}
                        playerName={playerName}
                        setPlayerName={setPlayerName}
                        onJoinGame={onJoinGame}
                      />
                    )}
                  </div>
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
                  <div className="space-y-4">
                    <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-6 border-2 border-parchment-400 dark:border-gray-600">
                      <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4 text-center">⚙️ Settings</h3>

                      <div className="space-y-4">
                        {/* Dark Mode */}
                        <div>
                          <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
                            Theme
                          </label>
                          <DarkModeToggle />
                        </div>

                        {/* Sound Effects */}
                        <div>
                          <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
                            Sound Effects
                          </label>
                          <div className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-300 dark:border-gray-500 space-y-3">
                            {/* Sound Toggle */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-umber-700 dark:text-gray-300">Enable Sounds</span>
                              <button
                                onClick={() => {
                                  const newEnabled = !soundEnabled;
                                  sounds.setEnabled(newEnabled);
                                  setSoundEnabled(newEnabled);
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  soundEnabled
                                    ? 'bg-green-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Volume Slider */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-umber-700 dark:text-gray-300">Volume</span>
                                <span className="text-xs text-umber-600 dark:text-gray-400">{Math.round(soundVolume * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={soundVolume * 100}
                                onChange={(e) => {
                                  const newVolume = parseInt(e.target.value) / 100;
                                  sounds.setVolume(newVolume);
                                  setSoundVolume(newVolume);
                                }}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* How to Play */}
                        <div className="pt-4 border-t-2 border-parchment-300 dark:border-gray-600">
                          <button
                            data-keyboard-nav="how-to-play"
                            onClick={() => { sounds.buttonClick(); setShowRules(true); }}
                            className="w-full bg-gradient-to-r from-amber-700 to-orange-700 dark:from-teal-700 dark:to-teal-800 text-white py-3 rounded-lg font-bold hover:from-amber-800 hover:to-orange-800 dark:hover:from-teal-600 dark:hover:to-teal-700 transition-all duration-200 border border-amber-900 dark:border-teal-600 shadow flex items-center justify-center gap-2"
                          >
                            📖 How to Play
                          </button>
                        </div>

                        {/* About */}
                        <div className="pt-4 border-t-2 border-parchment-300 dark:border-gray-600">
                          <p className="text-center text-sm text-umber-700 dark:text-gray-300">
                            <strong>J⋀ffre</strong>
                          </p>
                          <p className="text-center text-xs text-umber-600 dark:text-gray-400 mt-1">
                            A 4-player trick-taking card game
                          </p>
                        </div>

                        {/* Debug Fun */}
                        <div className="pt-4 border-t-2 border-parchment-300 dark:border-gray-600">
                          <button
                            data-keyboard-nav="debug-fun"
                            onClick={() => { sounds.buttonClick(); setShowDebugInfo(true); }}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 text-white py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 border border-indigo-800 dark:border-indigo-600 shadow flex items-center justify-center gap-2"
                          >
                            🎮 Debug Fun
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Leaderboard Modals */}
        {socket && (
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
        )}
      </>
    );
  }

  // Should never reach here - modes are handled above
  return null;
}
