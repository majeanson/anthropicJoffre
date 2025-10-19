import { useState } from 'react';

interface LobbyProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onSpectateGame: (gameId: string, spectatorName?: string) => void;
  onQuickPlay: () => void;
  onRejoinGame?: () => void;
  hasValidSession?: boolean;
}

export function Lobby({ onCreateGame, onJoinGame, onSpectateGame, onQuickPlay, onRejoinGame, hasValidSession }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'spectate'>('menu');
  const [joinType, setJoinType] = useState<'player' | 'spectator'>('player');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateGame(playerName);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinType === 'player') {
      if (playerName.trim() && gameId.trim()) {
        onJoinGame(gameId, playerName);
      }
    } else {
      // Spectator mode
      if (gameId.trim()) {
        onSpectateGame(gameId, playerName.trim() || undefined);
      }
    }
  };

  if (mode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-parchment-300 to-parchment-400 flex items-center justify-center">
        <div className="bg-parchment-50 rounded-xl p-8 shadow-2xl max-w-md w-full border-2 border-parchment-400">
          <h1 className="text-4xl font-bold text-center mb-8 text-umber-900 font-serif">
            Trick Card Game
          </h1>
          <div className="space-y-4">
            {hasValidSession && onRejoinGame && (
              <button
                data-testid="rejoin-game-button"
                onClick={onRejoinGame}
                className="w-full bg-sapphire-600 text-white py-4 rounded-lg font-semibold hover:bg-sapphire-700 transition-colors flex items-center justify-center gap-2 ring-4 ring-sapphire-300 animate-pulse border-2 border-sapphire-700"
              >
                <span>🔄</span>
                <span>Rejoin Previous Game</span>
              </button>
            )}
            <button
              data-testid="create-game-button"
              onClick={() => setMode('create')}
              className="w-full bg-umber-600 text-parchment-50 py-4 rounded-lg font-semibold hover:bg-umber-700 transition-colors border-2 border-umber-700"
            >
              Create Game
            </button>
            <button
              data-testid="join-game-button"
              onClick={() => setMode('join')}
              className="w-full bg-umber-700 text-parchment-50 py-4 rounded-lg font-semibold hover:bg-umber-800 transition-colors border-2 border-umber-800"
            >
              Join Game
            </button>
            <button
              data-testid="quick-play-button"
              onClick={onQuickPlay}
              className="w-full bg-parchment-600 text-umber-900 py-4 rounded-lg font-semibold hover:bg-parchment-700 transition-colors flex items-center justify-center gap-2 border-2 border-parchment-700"
            >
              <span>⚡</span>
              <span>Quick Play (1 Player + 3 Bots)</span>
            </button>
            <p className="text-center text-sm text-umber-700 mt-2">
              Quick Play creates a game with AI bots for easy testing
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-parchment-300 to-parchment-400 flex items-center justify-center">
        <div className="bg-parchment-50 rounded-xl p-8 shadow-2xl max-w-md w-full border-2 border-parchment-400">
          <h2 className="text-3xl font-bold mb-6 text-umber-900 font-serif">Create Game</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-umber-800 mb-2">
                Your Name
              </label>
              <input
                data-testid="player-name-input"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-parchment-400 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 text-umber-900"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                data-testid="back-button"
                type="button"
                onClick={() => setMode('menu')}
                className="flex-1 bg-parchment-400 text-umber-900 py-3 rounded-lg font-semibold hover:bg-parchment-500 transition-colors border-2 border-parchment-500"
              >
                Back
              </button>
              <button
                data-testid="submit-create-button"
                type="submit"
                className="flex-1 bg-umber-600 text-parchment-50 py-3 rounded-lg font-semibold hover:bg-umber-700 transition-colors border-2 border-umber-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment-300 to-parchment-400 flex items-center justify-center">
      <div className="bg-parchment-50 rounded-xl p-8 shadow-2xl max-w-md w-full border-2 border-parchment-400">
        <h2 className="text-3xl font-bold mb-6 text-umber-900 font-serif">Join Game</h2>
        <form onSubmit={handleJoin} className="space-y-4">
          {/* Join Type Selection */}
          <div className="bg-parchment-100 rounded-lg p-4 border-2 border-parchment-400">
            <label className="block text-sm font-medium text-umber-800 mb-3">
              Join as:
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="joinType"
                  value="player"
                  checked={joinType === 'player'}
                  onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                  className="w-4 h-4 text-umber-600 focus:ring-umber-500"
                />
                <span className="ml-3 text-umber-800 font-medium">🎮 Player</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="joinType"
                  value="spectator"
                  checked={joinType === 'spectator'}
                  onChange={(e) => setJoinType(e.target.value as 'player' | 'spectator')}
                  className="w-4 h-4 text-umber-600 focus:ring-umber-500"
                />
                <span className="ml-3 text-umber-800 font-medium">👁️ Guest (Spectator)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-umber-800 mb-2">
              Game ID
            </label>
            <input
              data-testid="game-id-input"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-parchment-400 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 text-umber-900"
              placeholder="Enter game ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-umber-800 mb-2">
              Your Name {joinType === 'spectator' && '(Optional)'}
            </label>
            <input
              data-testid="player-name-input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-parchment-400 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 text-umber-900"
              placeholder="Enter your name"
              required={joinType === 'player'}
            />
          </div>

          {/* Info message for spectator mode */}
          {joinType === 'spectator' && (
            <div className="bg-parchment-200 border-2 border-umber-400 rounded-lg p-3">
              <p className="text-sm text-umber-800">
                👁️ As a spectator, you can watch the game but cannot play cards. Player hands will be hidden.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              data-testid="back-button"
              type="button"
              onClick={() => setMode('menu')}
              className="flex-1 bg-parchment-400 text-umber-900 py-3 rounded-lg font-semibold hover:bg-parchment-500 transition-colors border-2 border-parchment-500"
            >
              Back
            </button>
            <button
              data-testid="submit-join-button"
              type="submit"
              className={`flex-1 text-parchment-50 py-3 rounded-lg font-semibold transition-colors border-2 ${
                joinType === 'player'
                  ? 'bg-umber-700 hover:bg-umber-800 border-umber-800'
                  : 'bg-umber-600 hover:bg-umber-700 border-umber-700'
              }`}
            >
              {joinType === 'player' ? 'Join as Player' : 'Join as Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
