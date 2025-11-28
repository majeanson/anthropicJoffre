import { ActiveGames } from './ActiveGames';
import { QuickPlayPanel } from './QuickPlayPanel';
import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';
import { getUserTierInfo } from '../utils/userTier';
import { colors } from '../design-system';

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
        <div className="bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-lg p-3">
          <p className="text-sm text-amber-800 dark:text-amber-200 text-center mb-2">
            Enter a player name or create an account to play games
          </p>
          <div className="flex gap-2 justify-center">
            {onShowLogin && (
              <button
                onClick={() => { sounds.buttonClick(); onShowLogin(); }}
                className="px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white text-sm font-semibold rounded hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
              >
                Login
              </button>
            )}
            {onShowRegister && (
              <button
                onClick={() => { sounds.buttonClick(); onShowRegister(); }}
                className="px-4 py-2 bg-umber-600 dark:bg-purple-700 text-white text-sm font-semibold rounded hover:bg-umber-700 dark:hover:bg-purple-600 transition-colors"
              >
                Register
              </button>
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
          className={`w-full bg-gradient-to-r ${colors.gradients.warning} hover:${colors.gradients.warningHover} text-white py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ring-2 ring-orange-400 animate-pulse border border-orange-800 shadow-lg focus-visible:ring-4 focus-visible:ring-orange-500`}
        >
          <span aria-hidden="true">🔄</span>
          <span>Rejoin Game</span>
        </button>
      )}

      {/* Active Games (Resumable) */}
      <ActiveGames
        playerName={playerName}
        socket={socket}
        onResumeGame={onResumeGame}
      />

      {/* Multiplayer Section */}
      <div className="bg-parchment-200 dark:bg-gray-700/50 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-600">
        <h3 className="text-sm font-bold text-umber-800 dark:text-gray-200 mb-3 text-center">
          Multiplayer
        </h3>
        <div className="space-y-2">
          <button
            data-testid="create-game-button"
            data-keyboard-nav="create-game"
            onClick={() => { sounds.buttonClick(); onCreateGame(); }}
            disabled={!tierInfo.canCreateGame}
            className={`w-full py-3 rounded-lg font-bold transition-all duration-200 border shadow focus-visible:ring-2 focus-visible:ring-orange-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2 ${
              tierInfo.canCreateGame
                ? 'bg-gradient-to-r from-amber-700 to-orange-700 dark:from-purple-700 dark:to-purple-800 text-white hover:from-amber-800 hover:to-orange-800 dark:hover:from-purple-600 dark:hover:to-purple-700 border-amber-900 dark:border-purple-600'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-400 dark:border-gray-500'
            }`}
          >
            {tierInfo.canCreateGame ? '➕ Create Game' : '🔒 Create Game (Login Required)'}
          </button>

          <button
            data-testid="join-game-button"
            data-keyboard-nav="browse-games"
            onClick={() => { sounds.buttonClick(); onBrowseGames(); }}
            className={`w-full bg-gradient-to-r ${colors.gradients.primary} hover:${colors.gradients.primaryHover} text-white py-3 rounded-lg font-bold transition-all duration-200 border border-blue-800 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`}
          >
            <span aria-hidden="true">🔍</span>
            Browse & Join Games
          </button>
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
