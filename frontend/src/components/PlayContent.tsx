/**
 * PlayContent Component - Retro Gaming Edition
 *
 * Main play tab content with game options:
 * - Rejoin active games
 * - Create multiplayer games
 * - Browse and join games
 * - Quick play with bots
 */

import { ActiveGames } from './ActiveGames';
import { QuickPlayPanel } from './QuickPlayPanel';
import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../utils/botPlayerEnhanced';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { getUserTierInfo } from '../utils/userTier';
import { Button, ElegantButton } from './ui/Button';

interface PlayContentProps {
  hasValidSession?: boolean;
  onRejoinGame?: () => void;
  playerName: string;
  socket: Socket | null;
  onResumeGame: (gameId: string) => void;
  onCreateGame: () => void;
  onBrowseGames: () => void;
  botDifficulty?: BotDifficulty;
  onBotDifficultyChange?: (difficulty: BotDifficulty) => void;
  quickPlayPersistence: 'elo' | 'casual';
  setQuickPlayPersistence: (mode: 'elo' | 'casual') => void;
  onQuickPlay: (
    difficulty: BotDifficulty,
    persistenceMode: 'elo' | 'casual',
    playerName?: string
  ) => void;
  user: User | null;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
}

export function PlayContent({
  hasValidSession,
  onRejoinGame,
  playerName,
  socket,
  onResumeGame,
  onCreateGame,
  onBrowseGames,
  botDifficulty = 'medium',
  onBotDifficultyChange,
  quickPlayPersistence,
  setQuickPlayPersistence,
  onQuickPlay,
  user,
  onShowLogin,
  onShowRegister,
}: PlayContentProps) {
  const tierInfo = getUserTierInfo(user, playerName);
  const isGuest = tierInfo.tier === 'guest';

  return (
    <div className="space-y-4">
      {/* Guest Tier Banner - Prompt to create account */}
      {isGuest && (
        <div
          className="
            p-4
            rounded-[var(--radius-lg)]
            border-2 border-[var(--color-warning)]
            bg-[var(--color-warning)]/10
          "
          style={{
            boxShadow: '0 0 15px rgba(255, 190, 11, 0.2)',
          }}
        >
          <p className="text-sm text-[var(--color-warning)] text-center mb-3 font-body">
            Enter a player name or create an account to play games
          </p>
          <div className="flex gap-3 justify-center">
            {onShowLogin && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => {
                  sounds.buttonClick();
                  onShowLogin();
                }}
              >
                Login
              </Button>
            )}
            {onShowRegister && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  sounds.buttonClick();
                  onShowRegister();
                }}
              >
                Register
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Rejoin Game (if available) */}
      {hasValidSession && onRejoinGame && (
        <button
          data-testid="rejoin-game-button"
          data-keyboard-nav="rejoin-game"
          onClick={onRejoinGame}
          className="
            w-full py-4
            font-display uppercase tracking-wider
            rounded-[var(--radius-lg)]
            border-2 border-[var(--color-warning)]
            bg-[var(--color-warning)]/20
            text-[var(--color-warning)]
            animate-pulse
            transition-all duration-[var(--duration-fast)]
            hover:bg-[var(--color-warning)]/30
            flex items-center justify-center gap-3
          "
          style={{
            boxShadow: '0 0 20px var(--color-warning), inset 0 0 20px rgba(255, 190, 11, 0.1)',
          }}
        >
          <span className="text-xl">🔄</span>
          <span>Rejoin Game</span>
        </button>
      )}

      {/* Active Games (Resumable) */}
      <ActiveGames playerName={playerName} socket={socket} onResumeGame={onResumeGame} />

      {/* Multiplayer Section */}
      <div
        className="
          p-4
          rounded-[var(--radius-lg)]
          border border-[var(--color-border-default)]
          bg-[var(--color-bg-tertiary)]
        "
      >
        <h3 className="text-xs font-display uppercase tracking-wider text-[var(--color-text-muted)] mb-3 text-center">
          Multiplayer
        </h3>
        <div className="space-y-3">
          <Button
            data-testid="create-game-button"
            data-keyboard-nav="create-game"
            variant="warning"
            size="md"
            onClick={() => {
              sounds.buttonClick();
              onCreateGame();
            }}
            disabled={!tierInfo.canCreateGame}
            fullWidth
            leftIcon={<span>{tierInfo.canCreateGame ? '➕' : '🔒'}</span>}
          >
            {tierInfo.canCreateGame ? 'Create Game' : 'Create Game (Login)'}
          </Button>

          <ElegantButton
            data-testid="join-game-button"
            data-keyboard-nav="browse-games"
            size="md"
            onClick={() => {
              sounds.buttonClick();
              onBrowseGames();
            }}
            fullWidth
            leftIcon={<span>🔍</span>}
          >
            Browse & Join Games
          </ElegantButton>
        </div>
      </div>

      {/* Quick Play Section - Available for all users including guests */}
      <QuickPlayPanel
        botDifficulty={botDifficulty}
        onBotDifficultyChange={onBotDifficultyChange}
        quickPlayPersistence={quickPlayPersistence}
        setQuickPlayPersistence={setQuickPlayPersistence}
        onQuickPlay={onQuickPlay}
        user={user}
        playerName={playerName}
      />
    </div>
  );
}
