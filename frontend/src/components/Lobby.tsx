import { useState, useEffect } from 'react';
import { getRecentPlayers, RecentPlayer } from '../utils/recentPlayers';
import { DarkModeToggle } from './DarkModeToggle';
import { LobbyBrowser } from './LobbyBrowser';
import { PlayerStatsModal } from './PlayerStatsModal';
import { GlobalLeaderboard } from './GlobalLeaderboard';
import { HowToPlay } from './HowToPlay';
import { Socket } from 'socket.io-client';

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
  socket: Socket | null;
}


export function Lobby({ onCreateGame, onJoinGame, onSpectateGame, onQuickPlay, onRejoinGame, hasValidSession, autoJoinGameId, onlinePlayers, socket }: LobbyProps) {
  console.log('Lobby rendered with autoJoinGameId:', autoJoinGameId);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState(autoJoinGameId || '');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'spectate'>(autoJoinGameId ? 'join' : 'menu');
  const [joinType, setJoinType] = useState<'player' | 'spectator'>('player');
  const [showRules, setShowRules] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [mainTab, setMainTab] = useState<'play' | 'social' | 'stats' | 'settings'>('play');
  const [socialTab, setSocialTab] = useState<'recent' | 'online'>('online');
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedPlayerName, setSelectedPlayerName] = useState('');

  console.log('Lobby state - mode:', mode, 'gameId:', gameId, 'autoJoinGameId:', autoJoinGameId);

  // Load recent players on mount
  useEffect(() => {
    setRecentPlayers(getRecentPlayers());
  }, []);

  // React to autoJoinGameId prop changes
  useEffect(() => {
    if (autoJoinGameId) {
      console.log('AutoJoinGameId changed to:', autoJoinGameId, '- updating state');
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
        <HowToPlay isModal={true} isOpen={showRules} onClose={() => setShowRules(false)} />
        {showBrowser && (
          <LobbyBrowser
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
            </div>

            {/* Horizontal Tab Navigation */}
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => setMainTab('play')}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                    mainTab === 'play'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  PLAY
                </button>
                <button
                  onClick={() => setMainTab('social')}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm relative ${
                    mainTab === 'social'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
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
                  onClick={() => setMainTab('stats')}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                    mainTab === 'stats'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105'
                      : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                  }`}
                >
                  STATS
                </button>
                <button
                  onClick={() => setMainTab('settings')}
                  className={`py-3 rounded-lg font-bold transition-all duration-200 text-sm ${
                    mainTab === 'settings'
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg scale-105'
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
                  <div className="space-y-3">
                    {/* Rejoin Game (if available) */}
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

                    {/* Primary Actions - Large Buttons */}
                    <div className="space-y-3">
                      <button
                        data-testid="quick-play-button"
                        onClick={onQuickPlay}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-5 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-3 border-2 border-green-800 shadow-lg transform hover:scale-105 text-lg"
                      >
                        <span className="text-2xl">⚡</span>
                        <span>Quick Play (1P + 3 Bots)</span>
                      </button>

                      <button
                        data-testid="create-game-button"
                        onClick={() => setMode('create')}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 border-2 border-green-800 shadow-lg transform hover:scale-105"
                      >
                        ➕ Create Game
                      </button>

                      <button
                        onClick={() => setShowBrowser(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <span>🔍</span>
                        Browse Games
                      </button>
                    </div>
                  </div>
                )}

                {/* SOCIAL TAB */}
                {mainTab === 'social' && (
                  <div className="space-y-4">
                    {/* Sub-tabs for Social */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSocialTab('online')}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm ${
                          socialTab === 'online'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                            : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        🟢 Online ({onlinePlayers.length})
                      </button>
                      <button
                        onClick={() => setSocialTab('recent')}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm ${
                          socialTab === 'recent'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                            : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        📜 Recent
                      </button>
                    </div>

                    {/* Players List */}
                    <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600 min-h-[320px] max-h-[320px] overflow-y-auto">
                      {socialTab === 'online' && (
                        <div className="space-y-2">
                          {onlinePlayers.length === 0 ? (
                            <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                              <p className="text-2xl mb-2">😴</p>
                              <p className="text-lg font-semibold">No players online</p>
                              <p className="text-sm mt-2">Online players will appear here</p>
                            </div>
                          ) : (
                            onlinePlayers.map(player => (
                              <div
                                key={player.socketId}
                                className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-500 hover:border-green-400 dark:hover:border-green-500 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-green-500 text-lg flex-shrink-0">🟢</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-bold text-umber-900 dark:text-gray-100 truncate">{player.playerName}</p>
                                      <p className="text-xs text-umber-600 dark:text-gray-400">{getStatusLabel(player.status)}</p>
                                    </div>
                                  </div>
                                  {player.gameId && player.status !== 'in_lobby' && (
                                    <button
                                      onClick={() => {
                                        const nameToUse = playerName.trim() || window.prompt('Enter your name to join:');
                                        if (nameToUse && nameToUse.trim()) {
                                          if (!playerName.trim()) {
                                            setPlayerName(nameToUse.trim());
                                          }
                                          onJoinGame(player.gameId!, nameToUse.trim());
                                        }
                                      }}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors flex-shrink-0"
                                      title="Join their game"
                                    >
                                      🎮 Join
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {socialTab === 'recent' && (
                        <div className="space-y-2">
                          {recentPlayers.length === 0 ? (
                            <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                              <p className="text-2xl mb-2">📭</p>
                              <p className="text-lg font-semibold">No recent players yet</p>
                              <p className="text-sm mt-2">Players you've played with will appear here</p>
                            </div>
                          ) : (
                            recentPlayers.map(player => (
                              <div
                                key={player.name}
                                className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-bold text-umber-900 dark:text-gray-100">{player.name}</p>
                                    <p className="text-xs text-umber-600 dark:text-gray-400">
                                      {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} • {new Date(player.lastPlayed).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STATS TAB */}
                {mainTab === 'stats' && (
                  <div className="space-y-3">
                    <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-6 border-2 border-parchment-400 dark:border-gray-600 text-center">
                      <p className="text-4xl mb-3">📊</p>
                      <h3 className="text-xl font-bold text-umber-900 dark:text-gray-100 mb-4">Player Statistics</h3>

                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (!socket) return;
                            if (!playerName.trim()) {
                              const name = window.prompt('Enter your player name to view stats:');
                              if (name && name.trim()) {
                                setPlayerName(name.trim());
                                setSelectedPlayerName(name.trim());
                                setShowPlayerStats(true);
                              }
                            } else {
                              setSelectedPlayerName(playerName);
                              setShowPlayerStats(true);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 border-2 border-purple-800 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          disabled={!socket}
                        >
                          <span className="text-xl">📊</span>
                          My Stats
                        </button>

                        <button
                          onClick={() => {
                            if (socket) {
                              setShowLeaderboard(true);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 text-white py-4 rounded-xl font-bold hover:from-yellow-700 hover:to-yellow-800 transition-all duration-300 border-2 border-yellow-800 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          disabled={!socket}
                        >
                          <span className="text-xl">🏆</span>
                          Global Leaderboard
                        </button>

                        <div className="pt-3 border-t-2 border-parchment-300 dark:border-gray-600">
                          <button
                            onClick={() => setShowRules(true)}
                            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-200"
                          >
                            📖 How to Play
                          </button>
                        </div>
                      </div>

                      {!socket && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-4">
                          ⚠️ Connect to server to view stats
                        </p>
                      )}
                    </div>
                  </div>
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

                        {/* Sound - Placeholder for future implementation */}
                        <div>
                          <label className="block text-sm font-semibold text-umber-800 dark:text-gray-200 mb-2">
                            Sound Effects
                          </label>
                          <div className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-300 dark:border-gray-500">
                            <p className="text-xs text-umber-600 dark:text-gray-400">
                              🔊 Sound settings available in-game
                            </p>
                          </div>
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
          <>
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
          </>
        )}
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

        <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-amber-700 dark:border-gray-600 relative">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-br-xl"></div>

          <h2 className="text-4xl font-bold mb-6 text-umber-900 dark:text-gray-100 font-serif text-center">Create Game</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
                Your Name
              </label>
              <input
                data-testid="player-name-input"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100"
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

      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl max-w-md w-full border-4 border-amber-700 dark:border-gray-600 relative">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 dark:border-gray-500 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 dark:border-gray-500 rounded-br-xl"></div>

        <h2 className="text-4xl font-bold mb-6 text-umber-900 dark:text-gray-100 font-serif text-center">Join Game</h2>

        {/* Show message when joining from URL */}
        {autoJoinGameId && (
          <div className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 border-2 border-blue-500 dark:border-blue-600 rounded-lg p-5 animate-pulse shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🎮</span>
              <p className="text-blue-900 dark:text-blue-200 font-bold text-lg text-center">
                Joining game: <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-400 dark:border-blue-500">{gameId}</span>
              </p>
            </div>
            <p className="text-blue-700 dark:text-blue-300 font-medium text-center">
              👇 Enter your name below to join!
            </p>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Join Type Selection */}
          <div className="bg-parchment-100 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600">
            <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3">
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
                <span className="ml-3 text-umber-800 dark:text-gray-200 font-medium">Player</span>
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
                <span className="ml-3 text-umber-800 dark:text-gray-200 font-medium">Guest (Spectator)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
              Game ID
            </label>
            <input
              data-testid="game-id-input"
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              className="w-full px-4 py-2 border-2 border-parchment-400 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100"
              placeholder="Enter game ID"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-2">
              Your Name {joinType === 'spectator' && '(Optional)'}
            </label>
            <input
              data-testid="player-name-input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-umber-500 focus:border-umber-500 bg-parchment-100 dark:bg-gray-700 text-umber-900 dark:text-gray-100 ${
                autoJoinGameId
                  ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                  : 'border-parchment-400 dark:border-gray-500'
              }`}
              placeholder={autoJoinGameId ? "👤 Type your name here..." : "Enter your name"}
              required={joinType === 'player'}
            />
          </div>

          {/* Info message for spectator mode */}
          {joinType === 'spectator' && (
            <div className="bg-parchment-200 border-2 border-umber-400 rounded-lg p-3">
              <p className="text-sm text-umber-800">
                As a spectator, you can watch the game but cannot play cards. Player hands will be hidden.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {/* Show appropriate back button based on context */}
            {autoJoinGameId ? (
              <button
                data-testid="back-to-homepage-button"
                type="button"
                onClick={() => {
                  setMode('menu');
                  setGameId('');
                  setPlayerName('');
                }}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
              >
                🏠 Back to Homepage
              </button>
            ) : (
              <button
                data-testid="back-button"
                type="button"
                onClick={() => setMode('menu')}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 border-gray-700 shadow-lg transform hover:scale-105"
              >
                Back
              </button>
            )}
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

      {/* Stats & Leaderboard Modals */}
      {socket && (
        <>
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
        </>
      )}
    </div>
  );
}
