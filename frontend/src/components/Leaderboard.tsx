import { GameState } from '../types/game';

interface LeaderboardProps {
  gameState: GameState;
  isOpen: boolean;
  onClose: () => void;
}

export function Leaderboard({ gameState, isOpen, onClose }: LeaderboardProps) {
  if (!isOpen) return null;

  // Determine which team is leading
  const team1Score = gameState.teamScores.team1;
  const team2Score = gameState.teamScores.team2;
  const leadingTeam = team1Score > team2Score ? 1 : team1Score < team2Score ? 2 : null;

  // Get team members
  const team1Players = gameState.players.filter(p => p.teamId === 1);
  const team2Players = gameState.players.filter(p => p.teamId === 2);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-labelledby="leaderboard-title"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div>
            <h2 id="leaderboard-title" className="text-2xl font-bold flex items-center gap-2">
              🏆 Leaderboard
            </h2>
            <p className="text-sm text-purple-100">Round {gameState.roundNumber} Stats & History</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg px-4 py-2 transition-colors font-semibold"
            aria-label="Close leaderboard"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Standings */}
          <section>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-purple-200 pb-2">
              📊 Current Standings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 ${
                leadingTeam === 1 ? 'ring-4 ring-yellow-400' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-blue-800">Team 1</h4>
                  {leadingTeam === 1 && <span className="text-3xl">👑</span>}
                </div>
                <div className="text-5xl font-bold text-blue-600 mb-4">{team1Score}</div>
                <div className="space-y-2">
                  {team1Players.map(player => (
                    <div key={player.id} className="bg-white bg-opacity-60 rounded px-3 py-2">
                      <p className="font-semibold text-blue-900">{player.name}</p>
                      <p className="text-sm text-blue-700">Tricks: {player.tricksWon}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team 2 */}
              <div className={`bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 ${
                leadingTeam === 2 ? 'ring-4 ring-yellow-400' : ''
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-bold text-red-800">Team 2</h4>
                  {leadingTeam === 2 && <span className="text-3xl">👑</span>}
                </div>
                <div className="text-5xl font-bold text-red-600 mb-4">{team2Score}</div>
                <div className="space-y-2">
                  {team2Players.map(player => (
                    <div key={player.id} className="bg-white bg-opacity-60 rounded px-3 py-2">
                      <p className="font-semibold text-red-900">{player.name}</p>
                      <p className="text-sm text-red-700">Tricks: {player.tricksWon}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {leadingTeam === null && (
              <p className="text-center text-gray-600 mt-4 font-semibold">
                It's a tie! Both teams have {team1Score} points.
              </p>
            )}
          </section>

          {/* Current Bet */}
          {gameState.highestBet && (
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-purple-200 pb-2">
                🎲 Current Bet
              </h3>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Highest Bidder</p>
                    <p className="text-lg font-bold text-purple-800">
                      {gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Bet Amount</p>
                    <p className="text-lg font-bold text-purple-800">
                      {gameState.highestBet.amount} points
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Type</p>
                    <p className="text-lg font-bold text-purple-800">
                      {gameState.highestBet.withoutTrump ? (
                        <span className="text-orange-600">Without Trump (2x)</span>
                      ) : (
                        'With Trump'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Round History */}
          {gameState.roundHistory.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-purple-200 pb-2">
                📜 Round History
              </h3>
              <div className="space-y-3">
                {gameState.roundHistory.slice().reverse().map((round) => {
                  const betPlayer = gameState.players.find(p => p.id === round.highestBet.playerId);
                  return (
                    <div
                      key={round.roundNumber}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-gray-800">
                          Round {round.roundNumber}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          round.betMade
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {round.betMade ? '✓ Bet Made' : '✗ Bet Failed'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 font-semibold">Bidder</p>
                          <p className="font-bold">{betPlayer?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">Team {round.offensiveTeam}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Bet</p>
                          <p className="font-bold">{round.betAmount} points</p>
                          <p className="text-xs text-gray-500">
                            {round.withoutTrump ? 'Without Trump (2x)' : 'With Trump'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Points Earned</p>
                          <p className="font-bold">
                            {round.offensivePoints} / {round.betAmount}
                          </p>
                          <p className="text-xs text-gray-500">
                            Defensive: {round.defensivePoints}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">Round Score</p>
                          <p className="font-bold">
                            <span className="text-blue-600">{round.roundScore.team1 >= 0 ? '+' : ''}{round.roundScore.team1}</span>
                            {' / '}
                            <span className="text-red-600">{round.roundScore.team2 >= 0 ? '+' : ''}{round.roundScore.team2}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Total: {round.cumulativeScore.team1} - {round.cumulativeScore.team2}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {gameState.roundHistory.length === 0 && (
            <section>
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500 text-lg">
                  No rounds completed yet. Start playing to see round history!
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
