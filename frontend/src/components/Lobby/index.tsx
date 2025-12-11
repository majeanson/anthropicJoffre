/**
 * Lobby Component
 *
 * Main lobby screen with tabs for Play, Social, Stats, and Settings.
 * Features keyboard navigation (grid-based like GameBoy).
 *
 * Refactored to use extracted types and keyboard navigation hook.
 */

import { useState, useEffect, Suspense, lazy } from 'react';
import { getRecentPlayers, RecentPlayer } from '../../utils/recentPlayers';
import { LobbyBrowser } from '../LobbyBrowser';
import { HowToPlay } from '../HowToPlay';
import { UnifiedDebugPanel } from '../UnifiedDebugPanel';
import { useLobbyChat } from '../../hooks/useLobbyChat';
import { SocialPanel } from '../SocialPanel';
import { StatsPanel } from '../StatsPanel';
import { GameCreationForm } from '../GameCreationForm';
import { JoinGameForm } from '../JoinGameForm';
import { ErrorBoundary } from '../ErrorBoundary';
import { LobbyErrorFallback } from '../fallbacks/LobbyErrorFallback';
import { StatsErrorFallback } from '../fallbacks/StatsErrorFallback';
import { PlayContent } from '../PlayContent';
import { SettingsContent } from '../SettingsContent';
import { sounds } from '../../utils/sounds';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileButton } from '../ProfileButton';
import { ProfileEditorModal } from '../ProfileEditorModal';
import { LoginStreakBadge } from '../LoginStreakBadge';
import { Button } from '../ui/Button';
import { Tabs, Tab } from '../ui/Tabs';
import { LobbyProps, LobbyMode, LobbyMainTab, LobbySocialTab, JoinType } from './types';
import { useLobbyKeyboardNav } from './useLobbyKeyboardNav';

// Lazy load heavy modals
const PlayerStatsModal = lazy(() =>
  import('../PlayerStatsModal').then((m) => ({ default: m.PlayerStatsModal }))
);
const GlobalLeaderboard = lazy(() =>
  import('../GlobalLeaderboard').then((m) => ({ default: m.GlobalLeaderboard }))
);

export function Lobby({
  onCreateGame,
  onJoinGame,
  onSpectateGame,
  onQuickPlay,
  onRejoinGame,
  hasValidSession,
  autoJoinGameId,
  onlinePlayers,
  socket,
  botDifficulty = 'medium',
  onBotDifficultyChange,
  onShowLogin,
  onShowRegister,
  onShowProgress,
  onShowWhyRegister,
}: LobbyProps) {
  const { user, updateProfile, getUserProfile, isLoading: authLoading } = useAuth();
  // Use authenticated username if available, otherwise use stored playerName for guests
  // Initialize empty - will be set by useEffect once auth state is known
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState(autoJoinGameId || '');
  const [mode, setMode] = useState<LobbyMode>(autoJoinGameId ? 'join' : 'menu');
  const [joinType, setJoinType] = useState<JoinType>('player');
  const [showRules, setShowRules] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [mainTab, setMainTab] = useState<LobbyMainTab>('play');
  const [socialTab, setSocialTab] = useState<LobbySocialTab>('online');
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  // Lobby chat hook for UnifiedChat
  const { messages: lobbyMessages, sendMessage: sendLobbyMessage } = useLobbyChat({
    socket,
    playerName,
  });
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [quickPlayPersistence, setQuickPlayPersistence] = useState<'elo' | 'casual'>('casual');

  // Keyboard navigation state - grid-based like GameBoy
  const [navRow, setNavRow] = useState<number>(0);
  const [navCol, setNavCol] = useState<number>(0);

  // Use extracted keyboard navigation hook
  useLobbyKeyboardNav({
    mode,
    mainTab,
    socialTab,
    navRow,
    navCol,
    user,
    setNavRow,
    setNavCol,
    setMainTab,
    setSocialTab,
  });

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

  // Register player with server when name is set (for online players list & LFG feature)
  useEffect(() => {
    if (!socket || !playerName.trim()) return;

    // Emit register_player to add to online players list
    // Server will ignore if already authenticated
    socket.emit('register_player', { playerName: playerName.trim() });
  }, [socket, playerName]);

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
      const nameInput = document.querySelector<HTMLInputElement>(
        '[data-testid="player-name-input"]'
      );
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
      }
    }
  }, [autoJoinGameId, mode]);

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
              onShowWhyRegister={() => {
                setShowBrowser(false);
                onShowWhyRegister?.();
              }}
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
                background:
                  'radial-gradient(circle, var(--color-team2-primary) 0%, transparent 70%)',
                opacity: 0.2,
                animationDuration: '3s',
                animationDelay: '1s',
              }}
            />
          </div>

          {/* Main container with neon border */}
          <div
            className="
              bg-skin-secondary
              rounded-[var(--radius-xl)]
              p-8 md:p-10
              max-w-md w-full
              border-[var(--modal-border-width)]
              border-skin-accent
              relative
              overflow-hidden
              shadow-main-glow
            "
          >
            {/* Scanline effect overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10 opacity-30"
              style={{
                background:
                  'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 2px)',
              }}
            />

            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-[3px] border-l-[3px] border-[var(--color-text-accent)] rounded-tl-[var(--radius-xl)] opacity-60" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-[3px] border-r-[3px] border-[var(--color-text-accent)] rounded-tr-[var(--radius-xl)] opacity-60" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[3px] border-l-[3px] border-[var(--color-team2-primary)] rounded-bl-[var(--radius-xl)] opacity-60" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[3px] border-r-[3px] border-[var(--color-team2-primary)] rounded-br-[var(--radius-xl)] opacity-60" />

            {/* Title with neon glow */}
            <div className="text-center mb-8 relative z-20">
              <h1 className="text-5xl md:text-6xl font-display uppercase tracking-wider text-skin-primary text-shadow-glow">
                J⋀ffre
              </h1>
              <p className="text-skin-muted text-xs uppercase tracking-widest mt-2 font-body">
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
                      onShowWhyRegister={onShowWhyRegister}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    {playerName.trim() && (
                      <p className="text-xs text-skin-muted font-body">
                        Playing as{' '}
                        <span className="font-display text-skin-accent">{playerName}</span>
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
                tabs={
                  [
                    { id: 'play', label: 'Play' },
                    {
                      id: 'social',
                      label: 'Social',
                      badge: onlinePlayers.length > 0 ? onlinePlayers.length : undefined,
                    },
                    { id: 'stats', label: 'Stats' },
                    { id: 'settings', label: 'Settings' },
                  ] as Tab[]
                }
                activeTab={mainTab}
                onChange={(tabId) => {
                  sounds.buttonClick();
                  setMainTab(tabId as LobbyMainTab);
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
                    onShowWhyRegister={onShowWhyRegister}
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
                    socket={socket}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Leaderboard Modals */}
        {socket && (
          <ErrorBoundary
            fallback={
              <StatsErrorFallback
                onClose={() => {
                  setShowPlayerStats(false);
                  setShowLeaderboard(false);
                }}
              />
            }
          >
            <Suspense fallback={<div />}>
              <PlayerStatsModal
                playerName={selectedPlayerName}
                socket={socket}
                isOpen={showPlayerStats}
                onClose={() => setShowPlayerStats(false)}
                onResumeGame={(gameId) => {
                  setShowPlayerStats(false);
                  onJoinGame(gameId, playerName);
                }}
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

// Re-export types
export type { LobbyProps, LobbyMode, LobbyMainTab, LobbySocialTab, JoinType } from './types';
