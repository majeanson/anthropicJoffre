import { ActiveGames } from './ActiveGames';
import { QuickPlayPanel } from './QuickPlayPanel';
import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { getUserTierInfo } from '../utils/userTier';
import { UICard } from './ui/UICard';
import { Button } from './ui/Button';

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
  onQuickPlay: (difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual', playerName?: string) => void;
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
        <UICard variant="bordered" size="md" gradient="warning">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center mb-2">
            Enter a player name or create an account to play games
          </p>
          <div className="flex gap-2 justify-center">
            {onShowLogin && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => { sounds.buttonClick(); onShowLogin(); }}
              >
                Login
              </Button>
            )}
            {onShowRegister && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { sounds.buttonClick(); onShowRegister(); }}
              >
                Register
              </Button>
            )}
          </div>
        </UICard>
      )}

      {/* Rejoin Game (if available) */}
      {hasValidSession && onRejoinGame && (
        <Button
          data-testid="rejoin-game-button"
          data-keyboard-nav="rejoin-game"
          variant="warning"
          size="lg"
          onClick={onRejoinGame}
          className="w-full animate-pulse ring-2 ring-orange-400"
        >
          <span aria-hidden="true">🔄</span>
          <span>Rejoin Game</span>
        </Button>
      )}

      {/* Active Games (Resumable) */}
      <ActiveGames
        playerName={playerName}
        socket={socket}
        onResumeGame={onResumeGame}
      />

      {/* Multiplayer Section */}
      <UICard variant="bordered" size="md" className="bg-parchment-200 dark:bg-gray-700/50">
        <h3 className="text-sm font-bold text-umber-800 dark:text-gray-200 mb-3 text-center">
          Multiplayer
        </h3>
        <div className="space-y-2">
          <Button
            data-testid="create-game-button"
            data-keyboard-nav="create-game"
            variant="warning"
            size="md"
            onClick={() => { sounds.buttonClick(); onCreateGame(); }}
            disabled={!tierInfo.canCreateGame}
            className="w-full"
          >
            {tierInfo.canCreateGame ? '➕ Create Game' : '🔒 Create Game (Login Required)'}
          </Button>

          <Button
            data-testid="join-game-button"
            data-keyboard-nav="browse-games"
            variant="primary"
            size="md"
            onClick={() => { sounds.buttonClick(); onBrowseGames(); }}
            className="w-full"
          >
            <span aria-hidden="true">🔍</span>
            Browse & Join Games
          </Button>
        </div>
      </UICard>

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
