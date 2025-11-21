import { useState, useEffect } from 'react';
import { GameState } from '../types/game';
import { Socket } from 'socket.io-client';
import { CONFIG } from '../config/constants';

interface DebugPanelProps {
  gameState: GameState | null;
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
}

interface ServerHealth {
  status: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  activeGames: number;
  uptime: number;
  timestamp: number;
}

export function DebugPanel({ gameState, gameId, isOpen, onClose, socket }: DebugPanelProps) {
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Listen for clear all games response
  useEffect(() => {
    if (!socket) return;

    const handleAllGamesCleared = (data: { gamesCleared: number; sessionsCleared: number; message: string }) => {
      setClearMessage(`✅ ${data.message}`);
      setIsClearing(false);

      // Clear message after 5 seconds
      setTimeout(() => setClearMessage(null), 5000);

      // Refresh health immediately
      fetchHealthNow();
    };

    socket.on('all_games_cleared', handleAllGamesCleared);

    return () => {
      socket.off('all_games_cleared', handleAllGamesCleared);
    };
  }, [socket]);

  // Fetch server health function (extracted for reuse)
  const fetchHealthNow = async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/ping`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setServerHealth(data);
      setHealthError(null);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Failed to fetch');
      console.error('Failed to fetch server health:', error);
    }
  };

  // Fetch server health every 5 seconds when panel is open
  useEffect(() => {
    if (!isOpen) return;

    // Fetch immediately
    fetchHealthNow();

    // Then fetch every 5 seconds be
    const interval = setInterval(fetchHealthNow, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle clear all games
  const handleClearAllGames = () => {
    if (!socket) {
      setClearMessage('❌ No socket connection');
      return;
    }

    if (!window.confirm('⚠️ Clear ALL games from memory?\n\nThis will disconnect all active players and remove all game data.\n\nAre you sure?')) {
      return;
    }

    setIsClearing(true);
    setClearMessage('🔄 Clearing all games...');
    socket.emit('clear_all_games');
  };

  if (!isOpen || !gameState) return null;

  const highestBidder = gameState.highestBet
    ? gameState.players.find(p => p.id === gameState.highestBet?.playerId)
    : null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="debug-panel-title"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 id="debug-panel-title" className="text-2xl font-bold flex items-center gap-2">
              🐛 Debug Panel
            </h2>
            <p className="text-sm text-purple-100">Game State Inspector</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white dark:bg-gray-800 hover:bg-opacity-20 rounded-lg px-4 py-2 transition-colors font-semibold"
            aria-label="Close debug panel"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Game Info */}
          <section aria-labelledby="game-info-heading">
            <h3 id="game-info-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
              📋 Game Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Game ID:</span>
                <p className="font-mono text-lg text-purple-600 font-bold">{gameId}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Phase:</span>
                <p className="text-lg">
                  <span className={`px-3 py-1 rounded-full font-semibold ${
                    gameState.phase === 'team_selection' ? 'bg-purple-100 text-purple-800' :
                    gameState.phase === 'betting' ? 'bg-orange-100 text-orange-800' :
                    gameState.phase === 'playing' ? 'bg-orange-100 text-orange-800' :
                    gameState.phase === 'scoring' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800 dark:text-gray-200'
                  }`}>
                    {gameState.phase.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Round:</span>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{gameState.roundNumber}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Trump Suit:</span>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{gameState.trump || 'Not set'}</p>
              </div>
            </div>
          </section>

          {/* Server Health */}
          <section aria-labelledby="server-health-heading">
            <div className="flex items-center justify-between mb-3 border-b-2 border-purple-200 pb-2">
              <h3 id="server-health-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200">
                🖥️ Server Health
              </h3>
              <button
                onClick={handleClearAllGames}
                disabled={isClearing || !socket}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  isClearing || !socket
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                }`}
                title="Clear all games from memory (use when memory is high)"
              >
                {isClearing ? '🔄 Clearing...' : '🗑️ Clear All Games'}
              </button>
            </div>
            {clearMessage && (
              <div className={`mb-3 p-3 rounded-lg border-2 ${
                clearMessage.startsWith('✅')
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : clearMessage.startsWith('❌')
                  ? 'bg-red-50 border-red-400 text-red-800'
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}>
                <p className="font-semibold">{clearMessage}</p>
              </div>
            )}
            {healthError ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                <p className="text-red-700 font-semibold">⚠️ Unable to fetch server health</p>
                <p className="text-sm text-red-600 mt-1">{healthError}</p>
              </div>
            ) : serverHealth ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Status:</span>
                  <p className="text-lg font-bold text-green-600">{serverHealth.status.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Uptime:</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {Math.floor(serverHealth.uptime / 60)}m {serverHealth.uptime % 60}s
                  </p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Active Games:</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{serverHealth.activeGames}</p>
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Heap Used:</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {serverHealth.memory.heapUsedMB}MB
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Memory:</span>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-300 ${
                          (serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) > 0.8
                            ? 'bg-red-500'
                            : (serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) > 0.6
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width: `${(serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {serverHealth.memory.heapUsedMB}MB / {serverHealth.memory.heapTotalMB}MB
                      ({Math.round((serverHealth.memory.heapUsedMB / serverHealth.memory.heapTotalMB) * 100)}%)
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">RSS (Total):</span>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{serverHealth.memory.rssMB}MB</p>
                  <p className="text-xs text-gray-500 mt-1">Resident Set Size (all memory)</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-500">Loading server health...</p>
              </div>
            )}
          </section>

          {/* Automation Controls */}
          <section aria-labelledby="automation-heading">
            <h3 id="automation-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
              🎮 Automation Controls
            </h3>

            {/* Playing Phase Controls */}
            {gameState.phase === 'playing' && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-green-700">Playing Phase</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    ACTIVE
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => socket?.emit('debug_auto_play_card', { gameId })}
                    disabled={!socket}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                    title="Play a valid card for the current player"
                  >
                    🤖 Auto-Play Card
                  </button>
                  <button
                    onClick={() => socket?.emit('debug_skip_trick', { gameId })}
                    disabled={!socket || gameState.currentTrick.length === 0}
                    className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                    title="Complete the current trick by auto-playing remaining cards"
                  >
                    ⏭️ Skip Trick
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Skip entire round? This will auto-play all remaining cards.')) {
                        socket?.emit('debug_skip_round', { gameId });
                      }
                    }}
                    disabled={!socket}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                    title="Complete the entire round by auto-playing all cards"
                  >
                    ⏭️⏭️ Skip Round
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  These controls automatically play cards for the current player. Use for testing game flow.
                </p>
              </div>
            )}

            {/* Betting Phase Controls */}
            {gameState.phase === 'betting' && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-orange-700">Betting Phase</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                    ACTIVE
                  </span>
                </div>

                {/* Auto-bet and Skip Betting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => socket?.emit('debug_auto_bet', { gameId })}
                    disabled={!socket}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                    title="Place a valid bet for the current player"
                  >
                    💰 Auto-Bet
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Skip betting phase? This will auto-bet for all players.')) {
                        socket?.emit('debug_skip_betting', { gameId });
                      }
                    }}
                    disabled={!socket}
                    className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
                    title="Complete betting phase by auto-betting for all players"
                  >
                    ⏭️ Skip Betting
                  </button>
                </div>

                {/* Force Bet Override */}
                <div className="border-t-2 border-orange-200 pt-4">
                  <p className="text-sm font-semibold text-orange-700 mb-2">Force Bet Override</p>
                  <div className="grid grid-cols-12 gap-2">
                    {[7, 8, 9, 10, 11, 12].map(amount => (
                      <div key={amount} className="col-span-6 md:col-span-2 flex flex-col gap-1">
                        <button
                          onClick={() => socket?.emit('debug_force_bet', { gameId, amount, withoutTrump: false })}
                          disabled={!socket}
                          className="px-2 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          title={`Force bet ${amount} with trump`}
                        >
                          {amount}
                        </button>
                        <button
                          onClick={() => socket?.emit('debug_force_bet', { gameId, amount, withoutTrump: true })}
                          disabled={!socket}
                          className="px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          title={`Force bet ${amount} WITHOUT trump (2x)`}
                        >
                          {amount} 🚫
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    Click amount to force bet for current player. 🚫 = Without Trump (2x multiplier)
                  </p>
                </div>
              </div>
            )}

            {/* No Automation Available */}
            {gameState.phase !== 'playing' && gameState.phase !== 'betting' && (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 text-center">
                <p className="text-gray-600">
                  No automation controls available for <span className="font-semibold">{gameState.phase.replace('_', ' ')}</span> phase
                </p>
              </div>
            )}
          </section>

          {/* Team Scores */}
          <section aria-labelledby="scores-heading">
            <h3 id="scores-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
              🏆 Team Scores
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
                <h4 className="text-sm font-semibold text-orange-700 mb-1">Team 1</h4>
                <p className="text-4xl font-bold text-orange-600">{gameState.teamScores.team1}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {gameState.teamScores.team1 >= 41 ? '✓ Winner!' : `${41 - gameState.teamScores.team1} to win`}
                </p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                <h4 className="text-sm font-semibold text-purple-700 mb-1">Team 2</h4>
                <p className="text-4xl font-bold text-purple-600">{gameState.teamScores.team2}</p>
                <p className="text-xs text-purple-600 mt-1">
                  {gameState.teamScores.team2 >= 41 ? '✓ Winner!' : `${41 - gameState.teamScores.team2} to win`}
                </p>
              </div>
            </div>
          </section>

          {/* Players */}
          <section aria-labelledby="players-heading">
            <h3 id="players-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
              👥 Players
            </h3>
            <div className="space-y-2">
              {gameState.players.map((player, index) => {
                const isCurrentTurn = index === gameState.currentPlayerIndex;
                const isDealer = index === gameState.dealerIndex;
                const bet = gameState.currentBets.find(b => b.playerId === player.id);

                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentTurn
                        ? 'bg-green-50 border-green-400 shadow-md'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full ${
                          player.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'
                        }`} aria-label={`Team ${player.teamId}`}></span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{player.name}</span>
                        {isDealer && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                            DEALER
                          </span>
                        )}
                        {isCurrentTurn && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full animate-pulse">
                            CURRENT TURN
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        Position {index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Cards in hand:</span>
                        <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">{player.hand.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Tricks won:</span>
                        <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">{player.tricksWon}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Points won:</span>
                        <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">{player.pointsWon}</span>
                      </div>
                      {bet && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Bet:</span>
                          <span className="ml-2 font-semibold text-gray-800 dark:text-gray-200">
                            {bet.skipped ? 'Skipped' : `${bet.amount} ${bet.withoutTrump ? '(No Trump)' : ''}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Current Trick */}
          {gameState.currentTrick.length > 0 && (
            <section aria-labelledby="trick-heading">
              <h3 id="trick-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
                🎴 Current Trick ({gameState.currentTrick.length}/4 cards)
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {gameState.currentTrick.map((trickCard, index) => {
                  const player = gameState.players.find(p => p.id === trickCard.playerId);
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-center border-2 border-gray-200">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{player?.name}</p>
                      <div className={`inline-block px-3 py-2 rounded font-bold text-white ${
                        trickCard.card.color === 'blue' ? 'bg-orange-500' :
                        trickCard.card.color === 'green' ? 'bg-green-500' :
                        'bg-amber-700'
                      }`}>
                        {trickCard.card.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Betting Info */}
          {gameState.currentBets.length > 0 && (
            <section aria-labelledby="betting-heading">
              <h3 id="betting-heading" className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 border-b-2 border-purple-200 pb-2">
                💰 Betting Information
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {highestBidder && gameState.highestBet && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-3">
                    <p className="font-semibold text-yellow-900">
                      🏅 Highest Bet: {highestBidder.name} - {gameState.highestBet.amount} points
                      {gameState.highestBet.withoutTrump && ' (Without Trump - 2x multiplier)'}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {gameState.currentBets.map((bet) => {
                    const player = gameState.players.find(p => p.id === bet.playerId);
                    return (
                      <div key={bet.playerId} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 border border-gray-200">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{player?.name}</span>
                        <span className={`text-sm font-semibold ${bet.skipped ? 'text-gray-500' : 'text-purple-600'}`}>
                          {bet.skipped ? 'Skipped' : `${bet.amount}${bet.withoutTrump ? ' 🚫' : ''}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Raw State */}
          <details className="bg-gray-50 rounded-lg border-2 border-gray-200">
            <summary className="cursor-pointer p-4 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100">
              🔧 Raw Game State (JSON)
            </summary>
            <pre className="p-4 text-xs overflow-x-auto bg-gray-900 text-green-400 rounded-b-lg font-mono">
              {JSON.stringify(gameState, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
