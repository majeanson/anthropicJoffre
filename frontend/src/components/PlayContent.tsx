import { ActiveGames } from './ActiveGames';
import { QuickPlayPanel } from './QuickPlayPanel';
import { Socket } from 'socket.io-client';
import { BotDifficulty } from '../utils/botPlayer';
import { sounds } from '../utils/sounds';
import { User } from '../types/auth';

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
  onQuickPlay: (difficulty: BotDifficulty, persistenceMode: 'elo' | 'casual') => void;
  user: User | null;
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
}: PlayContentProps) {
  return (
    <div className="space-y-4">
      {/* Rejoin Game (if available) */}
      {hasValidSession && onRejoinGame && (
        <button
          data-testid="rejoin-game-button"
          data-keyboard-nav="rejoin-game"
          onClick={onRejoinGame}
          className="w-full bg-gradient-to-r from-umber-600 to-umber-700 dark:from-gray-600 dark:to-gray-700 text-white py-4 rounded-xl font-bold hover:from-umber-700 hover:to-umber-800 dark:hover:from-gray-700 dark:hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-2 ring-2 ring-umber-400 dark:ring-gray-500 animate-pulse border border-umber-800 dark:border-gray-600 shadow-lg focus-visible:ring-4 focus-visible:ring-orange-500"
        >
          <span>🔄</span>
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
            className="w-full bg-gradient-to-r from-amber-700 to-orange-700 dark:from-purple-700 dark:to-purple-800 text-white py-3 rounded-lg font-bold hover:from-amber-800 hover:to-orange-800 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200 border border-amber-900 dark:border-purple-600 shadow focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            ➕ Create Game
          </button>

          <button
            data-testid="join-game-button"
            data-keyboard-nav="browse-games"
            onClick={() => { sounds.buttonClick(); onBrowseGames(); }}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 dark:from-indigo-700 dark:to-indigo-800 text-white py-3 rounded-lg font-bold hover:from-amber-700 hover:to-orange-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-200 border border-amber-800 dark:border-indigo-600 shadow flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
        user={user}
      />
    </div>
  );
}
