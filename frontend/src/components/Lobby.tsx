import { useState, useEffect } from 'react';
import { getRecentPlayers, RecentPlayer } from '../utils/recentPlayers';

interface OnlinePlayer {
  socketId: string;
  playerName: string;
  status: 'in_lobby' | 'in_game' | 'in_team_selection';
  gameId?: string;
  lastActivity: number;
}

interface LobbyProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
  onSpectateGame: (gameId: string, spectatorName?: string) => void;
  onQuickPlay: () => void;
  onRejoinGame?: () => void;
  hasValidSession?: boolean;
  autoJoinGameId?: string;
  onlinePlayers: OnlinePlayer[];
}

// Rules Modal Component
interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-parchment-50 rounded-xl p-8 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-4 border-umber-600" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-4xl font-bold text-umber-900 font-serif">Game Rules</h2>
          <button
            onClick={onClose}
            className="text-umber-600 hover:text-umber-800 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 text-umber-800">
          {/* Overview */}
          <section>
            <h3 className="text-2xl font-bold text-umber-900 mb-3 flex items-center gap-2">
              Overview
            </h3>
            <p className="text-lg leading-relaxed">
              J⋀ffre is a 4-player, 2-team trick-taking card game. Teams compete to win tricks and accumulate points.
              The first team to reach 41 points wins the game!
            </p>
          </section>

          {/* Betting Phase */}
          <section className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-300">
            <h3 className="text-2xl font-bold text-umber-900 mb-3 flex items-center gap-2">
              Betting Phase
            </h3>
            <ul className="space-y-2 text-lg">
              <li>• Each round starts with betting (7-12 points)</li>
              <li>• Players take turns bidding after the dealer</li>
              <li>• <strong>Non-dealers must raise</strong> or skip (if no bets yet)</li>
              <li>• <strong>Dealer can equalize or raise</strong> - dealer wins ties!</li>
              <li>• "Without Trump" doubles the bet stakes</li>
              <li>• Highest bidder becomes the offensive team</li>
            </ul>
          </section>

          {/* Playing Phase */}
          <section className="bg-blue-50 rounded-lg p-4 border-2 border-blue-300">
            <h3 className="text-2xl font-bold text-umber-900 mb-3 flex items-center gap-2">
              Playing Phase
            </h3>
            <ul className="space-y-2 text-lg">
              <li>• Highest bidder leads the first trick</li>
              <li>• <strong>You must follow suit</strong> if you have the led color</li>
              <li>• Trump (bet color) beats non-trump cards</li>
              <li>• Highest card in led suit wins if no trump played</li>
              <li>• Winner of each trick leads the next</li>
            </ul>
          </section>

          {/* Special Cards */}
          <section className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
            <h3 className="text-2xl font-bold text-umber-900 mb-3 flex items-center gap-2">
              Special Cards
            </h3>
            <ul className="space-y-2 text-lg">
              <li>• <strong className="text-red-600">Red 0:</strong> +5 bonus points (6 total for that trick)</li>
              <li>• <strong className="text-amber-800">Brown 0:</strong> -2 penalty points (-1 total for that trick)</li>
              <li>• All other tricks worth 1 point</li>
            </ul>
          </section>

          {/* Scoring */}
          <section className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
            <h3 className="text-2xl font-bold text-umber-900 mb-3 flex items-center gap-2">
              Scoring
            </h3>
            <ul className="space-y-2 text-lg">
              <li>• Offensive team wins if they meet their bet</li>
              <li>• They gain points equal to their bet</li>
              <li>• Defensive team gains points from tricks won</li>
              <li>• If offensive fails, they lose bet points</li>
            </ul>
          </section>

          {/* Teams */}
          <section>
            <h3 className="text-2xl font-bold text-umber-900 mb-3 flex items-center gap-2">
              Teams
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-100 rounded-lg p-4 border-2 border-orange-400">
                <p className="text-lg font-bold text-orange-800">Team 1 (Orange)</p>
                <p className="text-sm text-orange-700 mt-1">Players 1 & 3</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-400">
                <p className="text-lg font-bold text-purple-800">Team 2 (Purple)</p>
                <p className="text-sm text-purple-700 mt-1">Players 2 & 4</p>
              </div>
            </div>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 bg-umber-600 text-parchment-50 py-4 rounded-lg font-bold hover:bg-umber-700 transition-colors border-2 border-umber-700 text-lg"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

export function Lobby({ onCreateGame, onJoinGame, onSpectateGame, onQuickPlay, onRejoinGame, hasValidSession, autoJoinGameId, onlinePlayers }: LobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState(autoJoinGameId || '');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'spectate'>(autoJoinGameId ? 'join' : 'menu');
  const [joinType, setJoinType] = useState<'player' | 'spectator'>('player');
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'online'>('recent');
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [showToast, setShowToast] = useState(false);

  // Load recent players on mount
  useEffect(() => {
    setRecentPlayers(getRecentPlayers());
  }, []);

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

  const handleCopyInviteLink = (gameIdToCopy: string) => {
    const inviteLink = `${window.location.origin}/?join=${gameIdToCopy}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_lobby': return 'In Lobby';
      case 'in_game': return 'Playing';
      case 'in_team_selection': return 'Setting up';
      default: return status;
    }
  };

  if (mode === 'menu') {
    return (
      <>
        <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
        <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated background cards */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
            <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
            <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
            <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
          </div>

          <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-2xl p-10 shadow-2xl max-w-md w-full border-4 border-amber-700 relative">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 rounded-tl-xl"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 rounded-tr-xl"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 rounded-bl-xl"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 rounded-br-xl"></div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-800 via-orange-700 to-red-800 font-serif tracking-wider animate-pulse" style={{ animationDuration: '1s' }}>
                J⋀ffre
              </h1>
            </div>

            {/* Recent/Online Players Tabs */}
            <div className="mb-6">
              {/* Tab Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 ${
                    activeTab === 'recent'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'bg-parchment-200 text-umber-700 hover:bg-parchment-300'
                  }`}
                >
                  Recent Players
                </button>
                <button
                  onClick={() => setActiveTab('online')}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 ${
                    activeTab === 'online'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                      : 'bg-parchment-200 text-umber-700 hover:bg-parchment-300'
                  }`}
                >
                  Online Now ({onlinePlayers.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-parchment-200 rounded-lg p-4 border-2 border-parchment-400 min-h-[200px] max-h-[200px] overflow-y-auto">
                {activeTab === 'recent' && (
                  <div className="space-y-2">
                    {recentPlayers.length === 0 ? (
                      <div className="text-center text-umber-600 py-8">
                        <p className="text-lg">No recent players yet</p>
                        <p className="text-sm mt-2">Players you've played with will appear here</p>
                      </div>
                    ) : (
                      recentPlayers.map(player => (
                        <div
                          key={player.name}
                          className="bg-parchment-100 rounded-lg p-3 border-2 border-parchment-400 hover:border-blue-400 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-bold text-umber-900">{player.name}</p>
                              <p className="text-sm text-umber-600">
                                {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} • {new Date(player.lastPlayed).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'online' && (
                  <div className="space-y-2">
                    {onlinePlayers.length === 0 ? (
                      <div className="text-center text-umber-600 py-8">
                        <p className="text-lg">No players online</p>
                        <p className="text-sm mt-2">Online players will appear here</p>
                      </div>
                    ) : (
                      onlinePlayers.map(player => (
                        <div
                          key={player.socketId}
                          className="bg-parchment-100 rounded-lg p-3 border-2 border-parchment-400 hover:border-green-400 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-green-500 text-xl">🟢</span>
                              <div>
                                <p className="font-bold text-umber-900">{player.playerName}</p>
                                <p className="text-sm text-umber-600">{getStatusLabel(player.status)}</p>
                              </div>
                            </div>
                            {player.gameId && player.status !== 'in_lobby' && (
                              <button
                                onClick={() => handleCopyInviteLink(player.gameId!)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-bold transition-colors"
                                title="Copy invite link"
                              >
                                📋 Invite
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
              <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50">
                ✓ Invite link copied!
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              {hasValidSession && onRejoinGame && (
                <button
                  data-testid="rejoin-game-button"
                  onClick={onRejoinGame}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 ring-4 ring-blue-300 animate-pulse border-2 border-blue-800 shadow-lg transform hover:scale-105"
                >
                  <span>🔄</span>
                  <span>Rejoin Game</span>
                </button>
              )}
              <button
                data-testid="create-game-button"
                onClick={() => setMode('create')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105"
              >
                Create Game
              </button>
              <button
                data-testid="join-game-button"
                onClick={() => setMode('join')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 border-2 border-purple-800 shadow-lg transform hover:scale-105"
              >
                Join Game
              </button>
              <button
                data-testid="quick-play-button"
                onClick={onQuickPlay}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-orange-700 shadow-lg transform hover:scale-105"
              >
                Quick Play (bots)
              </button>
              <button
                onClick={() => setShowRules(true)}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-4 rounded-xl font-bold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 border-2 border-amber-800 shadow-lg transform hover:scale-105"
              >
                Rules
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background cards */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
          <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
          <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
          <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
        </div>

        <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-amber-700 relative">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 rounded-br-xl"></div>

          <h2 className="text-4xl font-bold mb-6 text-umber-900 font-serif text-center">Create Game</h2>
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
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
              >
                Back
              </button>
              <button
                data-testid="submit-create-button"
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
        <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
      </div>

      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-amber-700 relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 rounded-br-xl"></div>

        <h2 className="text-4xl font-bold mb-6 text-umber-900 font-serif text-center">Join Game</h2>
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
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
            >
              Back
            </button>
            <button
              data-testid="submit-join-button"
              type="submit"
              className={`flex-1 text-white py-3 rounded-xl font-bold transition-all duration-300 border-2 shadow-lg transform hover:scale-105 ${
                joinType === 'player'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 border-purple-800'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-blue-800'
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
