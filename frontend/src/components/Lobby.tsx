import { useState, useEffect, Suspense, lazy } from 'react';
import { getRecentPlayers, RecentPlayer } from '../utils/recentPlayers';
import { LobbyBrowser } from './LobbyBrowser';
import { HowToPlay } from './HowToPlay';
import { UnifiedDebugPanel } from './UnifiedDebugPanel';
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
import { LoginStreakBadge } from './LoginStreakBadge';
import { Button } from './ui/Button';
import { Tabs, Tab } from './ui/Tabs';

// Lazy load heavy modals
const PlayerStatsModal = lazy(() => import('./PlayerStatsModal').then(m => ({ default: m.PlayerStatsModal })));
const GlobalLeaderboard = lazy(() => import('./GlobalLeaderboard').then(m => ({ default: m.GlobalLeaderboard })));

interface LobbyProps {
  onCreateGame: (playerName: string, persistenceMode?: 'elo' | 'casual') => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onSpectateGame: (gameId: string, spectatorName?: string) => void;
  onQuickPlay: (difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual', playerName?: string) => void;
  onRejoinGame?: () => void;
  hasValidSession?: boolean;
  autoJoinGameId?: string;
  onlinePlayers: OnlinePlayer[];
  socket: Socket | null;
  botDifficulty?: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
  onShowProgress?: () => void;
}


export function Lobby({ onCreateGame, onJoinGame, onSpectateGame, onQuickPlay, onRejoinGame, hasValidSession, autoJoinGameId, onlinePlayers, socket, botDifficulty = 'medium', onBotDifficultyChange, onShowLogin, onShowRegister, onShowProgress }: LobbyProps) {
  const { user, updateProfile, getUserProfile, isLoading: authLoading } = useAuth();
  // Use authenticated username if available, otherwise use stored playerName for guests
  // Initialize empty - will be set by useEffect once auth state is known
  const [playerName, setPlayerName] = useState('');
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
  // Keyboard navigation state - grid-based like GameBoy
  // Row 0: Login/Register (if not logged in)
  // Row 1: Main tabs (PLAY, SOCIAL, STATS, SETTINGS)
  // Row 2: Sub-tabs (if applicable, e.g., SOCIAL sub-tabs)
  // Row 3: Content buttons
  const [navRow, setNavRow] = useState<number>(0);
  const [navCol, setNavCol] = useState<number>(0); // Column within current row


  // Load recent players on mount
  useEffect(() => {
    setRecentPlayers(getRecentPlayers());
  }, []);

  // Sync playerName with auth state - runs when auth loading completes or user changes
  useEffect(() => {
    // Wait for auth to finish loading before setting playerName
    if (authLoading) return;

    // If user is authenticated, always use their username
    if (user?.username) {
      setPlayerName(user.username);
      localStorage.setItem('playerName', user.username);
    }
    // For guests (no user), use localStorage value
    else if (!playerName) {
      const storedName = localStorage.getItem('playerName') || '';
      setPlayerName(storedName);
    }
  }, [authLoading, user]);

  // Save guest playerName changes to localStorage (only for guests)
  useEffect(() => {
    if (!user && playerName.trim()) {
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

  // Get items for current navigation row
  const getItemsForRow = (row: number): HTMLElement[] => {
    const effectiveRow = user ? row + 1 : row; // Skip login row if logged in

    if (effectiveRow === 0) {
      // Row 0: Login/Register buttons
      const items: HTMLElement[] = [];
      const loginBtn = document.querySelector('[data-keyboard-nav="login-btn"]') as HTMLElement;
      const registerBtn = document.querySelector('[data-keyboard-nav="register-btn"]') as HTMLElement;
      if (loginBtn) items.push(loginBtn);
      if (registerBtn) items.push(registerBtn);
      return items;
    } else if (effectiveRow === 1) {
      // Row 1: Main tabs (PLAY, SOCIAL, STATS, SETTINGS)
      return Array.from(document.querySelectorAll('[data-nav-tab]')) as HTMLElement[];
    } else if (effectiveRow === 2) {
      // Row 2: Sub-tabs (for SOCIAL panel) or first content row
      const subTabs = document.querySelectorAll('[data-nav-subtab]');
      if (subTabs.length > 0) {
        return Array.from(subTabs) as HTMLElement[];
      }
      // No sub-tabs, return content buttons
      const tabContent = document.querySelector('[data-tab-content]');
      if (tabContent) {
        return Array.from(tabContent.querySelectorAll('[data-keyboard-nav]')) as HTMLElement[];
      }
    } else if (effectiveRow === 3) {
      // Row 3: Content buttons (when sub-tabs exist)
      const tabContent = document.querySelector('[data-tab-content]');
      if (tabContent) {
        // Get content buttons excluding sub-tabs
        const allButtons = Array.from(tabContent.querySelectorAll('[data-keyboard-nav]')) as HTMLElement[];
        return allButtons.filter(btn => !btn.hasAttribute('data-nav-subtab'));
      }
    }
    return [];
  };

  // Check if current tab has sub-tabs
  const hasSubTabs = (): boolean => {
    return mainTab === 'social';
  };

  // Get max row based on current state
  const getMaxRow = (): number => {
    const baseRows = user ? 1 : 2; // 0=login (if not logged in), 1=tabs
    if (hasSubTabs()) {
      return baseRows + 2; // +subtabs +content
    }
    return baseRows + 1; // +content
  };

  // Keyboard navigation for lobby menu - grid-based like GameBoy
  useEffect(() => {
    if (mode !== 'menu') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = getItemsForRow(navRow);

      // Left/Right: Navigate within current row
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        if (items.length === 0) return;

        let newCol: number;
        if (e.key === 'ArrowRight') {
          newCol = (navCol + 1) % items.length;
        } else {
          newCol = navCol === 0 ? items.length - 1 : navCol - 1;
        }

        setNavCol(newCol);
        items[newCol]?.focus();

        // If on main tab row, also switch the tab
        const effectiveRow = user ? navRow + 1 : navRow;
        if (effectiveRow === 1) {
          const tabs = ['play', 'social', 'stats', 'settings'];
          if (tabs[newCol]) {
            setMainTab(tabs[newCol] as typeof mainTab);
          }
        }
        // If on social sub-tab row, switch the sub-tab
        if (effectiveRow === 2 && mainTab === 'social') {
          const subTabs = ['messages', 'friends', 'online', 'profile', 'chat'];
          if (subTabs[newCol]) {
            setSocialTab(subTabs[newCol] as typeof socialTab);
          }
        }

        sounds.buttonClick();
      }

      // Down: Move to next row OR next item in single-column content
      else if (e.key === 'ArrowDown') {
        e.preventDefault();

        const effectiveRow = user ? navRow + 1 : navRow;
        const contentRow = hasSubTabs() ? 3 : 2;

        // If we're in content row with single column layout, navigate within items
        if (effectiveRow >= contentRow && items.length > 1) {
          const newCol = (navCol + 1) % items.length;
          setNavCol(newCol);
          items[newCol]?.focus();
        } else {
          // Move to next row
          const maxRow = getMaxRow();
          if (navRow < maxRow - 1) {
            const nextRow = navRow + 1;
            setNavRow(nextRow);

            // Clamp column to new row's item count
            setTimeout(() => {
              const newItems = getItemsForRow(nextRow);
              const newCol = Math.min(navCol, newItems.length - 1);
              setNavCol(Math.max(0, newCol));
              if (newItems.length > 0) {
                newItems[Math.max(0, newCol)]?.focus();
              }
            }, 50);
          }
        }

        sounds.buttonClick();
      }

      // Up: Move to previous row OR previous item in single-column content
      else if (e.key === 'ArrowUp') {
        e.preventDefault();

        const effectiveRow = user ? navRow + 1 : navRow;
        const contentRow = hasSubTabs() ? 3 : 2;

        // If we're in content row and not at first item, navigate within items
        if (effectiveRow >= contentRow && navCol > 0) {
          const newCol = navCol - 1;
          setNavCol(newCol);
          items[newCol]?.focus();
        } else if (navRow > 0) {
          // Move to previous row
          const prevRow = navRow - 1;
          setNavRow(prevRow);

          // Clamp column to new row's item count, preserve tab position
          setTimeout(() => {
            const newItems = getItemsForRow(prevRow);
            let newCol = navCol;

            // If going back to main tabs, try to preserve the tab position
            const effectivePrevRow = user ? prevRow + 1 : prevRow;
            if (effectivePrevRow === 1) {
              const tabs = ['play', 'social', 'stats', 'settings'];
              newCol = tabs.indexOf(mainTab);
            }

            newCol = Math.min(Math.max(0, newCol), newItems.length - 1);
            setNavCol(newCol);
            if (newItems.length > 0) {
              newItems[newCol]?.focus();
            }
          }, 50);
        }

        sounds.buttonClick();
      }

      // Enter: Activate focused item
      else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[navCol];
        if (item) {
          item.click();
        }
      }

      // Escape: Go back one row (or clear focus at top)
      else if (e.key === 'Escape') {
        if (navRow > 0) {
          setNavRow(navRow - 1);
          setTimeout(() => {
            const newItems = getItemsForRow(navRow - 1);
            if (newItems.length > 0) {
              const newCol = Math.min(navCol, newItems.length - 1);
              setNavCol(newCol);
              newItems[newCol]?.focus();
            }
          }, 50);
        } else {
          (document.activeElement as HTMLElement)?.blur();
        }
        sounds.buttonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, mainTab, socialTab, navRow, navCol, user, playerName, socket, hasValidSession, onlinePlayers]);

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
        <UnifiedDebugPanel
          isOpen={showDebug}
          onClose={() => setShowDebug(false)}
          gameState={null}
          gameId=""
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
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated background - Retro grid lines */}
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
            {/* Animated glow orbs */}
            <div
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, var(--color-glow) 0%, transparent 70%)',
                opacity: 0.3,
                animationDuration: '4s',
              }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, var(--color-team2-primary) 0%, transparent 70%)',
                opacity: 0.2,
                animationDuration: '3s',
                animationDelay: '1s',
              }}
            />
          </div>

          {/* Main container with neon border */}
          <div
            className="
              bg-[var(--color-bg-secondary)]
              rounded-[var(--radius-xl)]
              p-8 md:p-10
              max-w-md w-full
              border-[var(--modal-border-width)]
              border-[var(--color-border-accent)]
              relative
              overflow-hidden
            "
            style={{
              boxShadow: 'var(--shadow-glow), var(--shadow-lg)',
            }}
          >
            {/* Scanline effect overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-30"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 2px)',
              }}
            />

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-[var(--color-text-accent)] rounded-tl-[var(--radius-xl)] opacity-60" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-[var(--color-text-accent)] rounded-tr-[var(--radius-xl)] opacity-60" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-[var(--color-team2-primary)] rounded-bl-[var(--radius-xl)] opacity-60" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-[var(--color-team2-primary)] rounded-br-[var(--radius-xl)] opacity-60" />

            {/* Title with neon glow */}
            <div className="text-center mb-8 relative z-20">
              <h1
                className="text-5xl md:text-6xl font-display uppercase tracking-wider"
                style={{
                  color: 'var(--color-text-primary)',
                  textShadow: '0 0 10px var(--color-glow), 0 0 20px var(--color-glow), 0 0 40px var(--color-glow)',
                }}
              >
                J⋀ffre
              </h1>
              <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest mt-2 font-body">
                Multiplayer Trick Card Game
              </p>

              {/* Authentication Section */}
              <div className="mt-6">
                {user ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* Login Streak Badge - Sprint 22D */}
                    <LoginStreakBadge
                      socket={socket}
                      playerName={user.username}
                      onClick={onShowProgress}
                    />
                    {/* Profile Button - Clickable dropdown menu with profile actions */}
                    <ProfileButton
                      user={user}
                      playerName={playerName}
                      socket={socket}
                      onShowLogin={onShowLogin}
                      onShowProfileEditor={() => setShowProfileEditor(true)}
                      onShowPersonalHub={onShowProgress}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {playerName.trim() && (
                      <p className="text-xs text-[var(--color-text-muted)] font-body">
                        Playing as{' '}
                        <span className="font-display text-[var(--color-text-accent)]">{playerName}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        data-keyboard-nav="login-btn"
                        onClick={onShowLogin}
                        variant="elegant"
                        size="sm"
                      >
                        Login
                      </Button>
                      <Button
                        data-keyboard-nav="register-btn"
                        onClick={onShowRegister}
                        variant="success"
                        size="sm"
                      >
                        Register
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Tab Navigation - Arcade style */}
            <div className="mb-6 relative z-20">
              <Tabs
                tabs={[
                  { id: 'play', label: 'Play' },
                  { id: 'social', label: 'Social', badge: onlinePlayers.length > 0 ? onlinePlayers.length : undefined },
                  { id: 'stats', label: 'Stats' },
                  { id: 'settings', label: 'Settings' },
                ] as Tab[]}
                activeTab={mainTab}
                onChange={(tabId) => {
                  sounds.buttonClick();
                  setMainTab(tabId as typeof mainTab);
                  setNavCol(['play', 'social', 'stats', 'settings'].indexOf(tabId));
                }}
                variant="boxed"
                size="sm"
                fullWidth
                className="mb-4"
              />

              {/* Tab Content */}
              <div className="min-h-[400px] relative z-20" data-tab-content>
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
                    onShowLogin={onShowLogin}
                    onShowRegister={onShowRegister}
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
                    onShowProgress={onShowProgress}
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
            socket={socket}
          />
        )}
      </>
    );
  }

  // Should never reach here - modes are handled above
  return null;
}
