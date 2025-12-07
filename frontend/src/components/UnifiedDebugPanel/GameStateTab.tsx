import { GameState } from '../../types/game';

interface GameStateTabProps {
  gameState: GameState | null;
  gameId: string;
}

export function GameStateTab({ gameState, gameId }: GameStateTabProps) {
  if (!gameState) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg mb-2">No active game</p>
        <p className="text-sm">Join or create a game to see game state information</p>
      </div>
    );
  }

  const highestBidder = gameState.highestBet
    ? gameState.players.find((p) => p.id === gameState.highestBet?.playerId)
    : null;

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Game Info */}
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
          <span>📋</span> Game Information
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded p-3">
            <span className="text-xs text-gray-400">Game ID</span>
            <p className="font-mono text-sm text-purple-400 font-bold">{gameId}</p>
          </div>
          <div className="bg-gray-800/50 rounded p-3">
            <span className="text-xs text-gray-400">Phase</span>
            <p className="text-sm">
              <span
                className={`px-2 py-1 rounded-full font-semibold text-xs ${
                  gameState.phase === 'team_selection'
                    ? 'bg-purple-500/30 text-purple-300'
                    : gameState.phase === 'betting'
                      ? 'bg-orange-500/30 text-orange-300'
                      : gameState.phase === 'playing'
                        ? 'bg-blue-500/30 text-blue-300'
                        : gameState.phase === 'scoring'
                          ? 'bg-green-500/30 text-green-300'
                          : 'bg-gray-500/30 text-gray-300'
                }`}
              >
                {gameState.phase.replace('_', ' ').toUpperCase()}
              </span>
            </p>
          </div>
          <div className="bg-gray-800/50 rounded p-3">
            <span className="text-xs text-gray-400">Round</span>
            <p className="text-sm font-bold text-white">{gameState.roundNumber}</p>
          </div>
          <div className="bg-gray-800/50 rounded p-3">
            <span className="text-xs text-gray-400">Trump Suit</span>
            <p className="text-sm font-bold text-white">{gameState.trump || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Team Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 border-2 border-orange-500/50 rounded-lg p-4 text-center">
          <h4 className="text-sm font-semibold text-orange-300 mb-1">Team 1</h4>
          <p className="text-4xl font-bold text-orange-400">{gameState.teamScores.team1}</p>
          <p className="text-xs text-orange-300 mt-1">
            {gameState.teamScores.team1 >= 41
              ? '✓ Winner!'
              : `${41 - gameState.teamScores.team1} to win`}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-900/50 to-violet-900/50 border-2 border-purple-500/50 rounded-lg p-4 text-center">
          <h4 className="text-sm font-semibold text-purple-300 mb-1">Team 2</h4>
          <p className="text-4xl font-bold text-purple-400">{gameState.teamScores.team2}</p>
          <p className="text-xs text-purple-300 mt-1">
            {gameState.teamScores.team2 >= 41
              ? '✓ Winner!'
              : `${41 - gameState.teamScores.team2} to win`}
          </p>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>👥</span> Players
        </h3>
        {gameState.players.map((player, index) => {
          const isCurrentTurn = index === gameState.currentPlayerIndex;
          const isDealer = index === gameState.dealerIndex;
          const bet = gameState.currentBets.find((b) => b.playerName === player.name);

          return (
            <div
              key={player.id}
              className={`p-3 rounded-lg border ${
                isCurrentTurn
                  ? 'bg-green-900/30 border-green-500 shadow-lg'
                  : 'bg-gray-800/30 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      player.teamId === 1 ? 'bg-orange-500' : 'bg-purple-500'
                    }`}
                  ></span>
                  <span className="font-bold text-white text-sm">{player.name}</span>
                  {isDealer && (
                    <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs font-semibold rounded-full">
                      DEALER
                    </span>
                  )}
                  {isCurrentTurn && (
                    <span className="px-2 py-0.5 bg-green-500/30 text-green-300 text-xs font-semibold rounded-full animate-pulse">
                      TURN
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-mono">Pos {index + 1}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-gray-900/50 rounded px-2 py-1">
                  <span className="text-gray-400">Cards:</span>
                  <span className="ml-1 font-semibold text-white">{player.hand.length}</span>
                </div>
                <div className="bg-gray-900/50 rounded px-2 py-1">
                  <span className="text-gray-400">Tricks:</span>
                  <span className="ml-1 font-semibold text-white">{player.tricksWon}</span>
                </div>
                <div className="bg-gray-900/50 rounded px-2 py-1">
                  <span className="text-gray-400">Points:</span>
                  <span className="ml-1 font-semibold text-white">{player.pointsWon}</span>
                </div>
                {bet && (
                  <div className="bg-gray-900/50 rounded px-2 py-1">
                    <span className="text-gray-400">Bet:</span>
                    <span className="ml-1 font-semibold text-white">
                      {bet.skipped ? 'Skip' : `${bet.amount}${bet.withoutTrump ? ' 🚫' : ''}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Trick */}
      {gameState.currentTrick.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-300 mb-3">
            🎴 Current Trick ({gameState.currentTrick.length}/4 cards)
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {gameState.currentTrick.map((trickCard, index) => {
              const player = gameState.players.find((p) => p.id === trickCard.playerId);
              return (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-700"
                >
                  <p className="text-xs text-gray-400 mb-1">{player?.name}</p>
                  <div
                    className={`inline-block px-2 py-1 rounded font-bold text-white text-sm ${
                      trickCard.card.color === 'blue'
                        ? 'bg-orange-600'
                        : trickCard.card.color === 'green'
                          ? 'bg-green-600'
                          : 'bg-amber-800'
                    }`}
                  >
                    {trickCard.card.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Betting Info */}
      {gameState.currentBets.length > 0 && (
        <div className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border border-amber-500/30 rounded-lg p-4">
          <h3 className="text-lg font-bold text-amber-300 mb-3">💰 Betting Information</h3>
          {highestBidder && gameState.highestBet && (
            <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 mb-3">
              <p className="font-semibold text-yellow-300 text-sm">
                🏅 Highest Bet: {highestBidder.name} - {gameState.highestBet.amount} points
                {gameState.highestBet.withoutTrump && ' (Without Trump - 2x)'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {gameState.currentBets.map((bet) => {
              const player = gameState.players.find((p) => p.id === bet.playerId);
              return (
                <div
                  key={bet.playerId}
                  className="flex items-center justify-between bg-gray-800/50 rounded p-2 border border-gray-700 text-sm"
                >
                  <span className="font-medium text-gray-300">{player?.name}</span>
                  <span
                    className={`font-semibold ${bet.skipped ? 'text-gray-500' : 'text-purple-400'}`}
                  >
                    {bet.skipped ? 'Skipped' : `${bet.amount}${bet.withoutTrump ? ' 🚫' : ''}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
