import { GameState } from '../types/game';

interface DebugPanelProps {
  gameState: GameState;
  gameId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DebugPanel({ gameState, gameId, isOpen, onClose }: DebugPanelProps) {
  if (!isOpen) return null;

  const highestBidder = gameState.highestBet
    ? gameState.players.find(p => p.id === gameState.highestBet?.playerId)
    : null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="debug-panel-title"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
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
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg px-4 py-2 transition-colors font-semibold"
            aria-label="Close debug panel"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Game Info */}
          <section aria-labelledby="game-info-heading">
            <h3 id="game-info-heading" className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-purple-200 pb-2">
              📋 Game Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div>
                <span className="text-sm font-semibold text-gray-600">Game ID:</span>
                <p className="font-mono text-lg text-purple-600 font-bold">{gameId}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Phase:</span>
                <p className="text-lg">
                  <span className={`px-3 py-1 rounded-full font-semibold ${
                    gameState.phase === 'team_selection' ? 'bg-purple-100 text-purple-800' :
                    gameState.phase === 'betting' ? 'bg-orange-100 text-orange-800' :
                    gameState.phase === 'playing' ? 'bg-orange-100 text-orange-800' :
                    gameState.phase === 'scoring' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {gameState.phase.replace('_', ' ').toUpperCase()}
                  </span>
                </p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Round:</span>
                <p className="text-lg font-bold text-gray-800">{gameState.roundNumber}</p>
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-600">Trump Suit:</span>
                <p className="text-lg font-bold text-gray-800">{gameState.trump || 'Not set'}</p>
              </div>
            </div>
          </section>

          {/* Team Scores */}
          <section aria-labelledby="scores-heading">
            <h3 id="scores-heading" className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-purple-200 pb-2">
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
            <h3 id="players-heading" className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-purple-200 pb-2">
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
                        <span className="font-bold text-gray-800">{player.name}</span>
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
                        <span className="text-gray-600">Cards in hand:</span>
                        <span className="ml-2 font-semibold text-gray-800">{player.hand.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tricks won:</span>
                        <span className="ml-2 font-semibold text-gray-800">{player.tricksWon}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Points won:</span>
                        <span className="ml-2 font-semibold text-gray-800">{player.pointsWon}</span>
                      </div>
                      {bet && (
                        <div>
                          <span className="text-gray-600">Bet:</span>
                          <span className="ml-2 font-semibold text-gray-800">
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
              <h3 id="trick-heading" className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-purple-200 pb-2">
                🎴 Current Trick ({gameState.currentTrick.length}/4 cards)
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {gameState.currentTrick.map((trickCard, index) => {
                  const player = gameState.players.find(p => p.id === trickCard.playerId);
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-center border-2 border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">{player?.name}</p>
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
              <h3 id="betting-heading" className="text-lg font-bold text-gray-800 mb-3 border-b-2 border-purple-200 pb-2">
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
                      <div key={bet.playerId} className="flex items-center justify-between bg-white rounded p-2 border border-gray-200">
                        <span className="font-medium text-gray-700">{player?.name}</span>
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
            <summary className="cursor-pointer p-4 font-semibold text-gray-700 hover:bg-gray-100">
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
