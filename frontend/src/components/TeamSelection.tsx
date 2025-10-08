import { Player } from '../types/game';

interface TeamSelectionProps {
  players: Player[];
  gameId: string;
  currentPlayerId: string;
  onSelectTeam: (teamId: 1 | 2) => void;
  onSwapPosition: (targetPlayerId: string) => void;
  onStartGame: () => void;
}

export function TeamSelection({
  players,
  gameId,
  currentPlayerId,
  onSelectTeam,
  onSwapPosition,
  onStartGame,
}: TeamSelectionProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const team1Players = players.filter(p => p.teamId === 1);
  const team2Players = players.filter(p => p.teamId === 2);

  // Validation for starting game
  const canStartGame = (): boolean => {
    if (players.length !== 4) return false;
    if (team1Players.length !== 2) return false;
    if (team2Players.length !== 2) return false;
    return true;
  };

  const getStartGameMessage = (): string => {
    if (players.length !== 4) {
      return `Waiting for ${4 - players.length} more player(s) to join`;
    }
    if (team1Players.length !== 2 || team2Players.length !== 2) {
      return 'Teams must have 2 players each';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-4xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Team Selection</h2>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Game ID:</p>
          <div className="bg-gray-100 p-3 rounded-lg font-mono text-lg text-center">{gameId}</div>
        </div>

        <div className="mb-8">
          <p className="text-center text-gray-600 mb-4">
            Players ({players.length}/4) - Choose your team and position
          </p>
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Team 1 */}
          <div className="border-2 border-blue-300 rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team1Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;

                return (
                  <div
                    key={`team1-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-blue-200 border-blue-500'
                        : playerAtPosition
                        ? 'bg-white border-blue-200'
                        : 'bg-gray-100 border-dashed border-gray-300'
                    }`}
                  >
                    {playerAtPosition ? (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        {!isCurrentPlayer && currentPlayer && (
                          <button
                            onClick={() => onSwapPosition(playerAtPosition.id)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Swap
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        {currentPlayer?.teamId !== 1 ? (
                          <button
                            onClick={() => onSelectTeam(1)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Join Team 1
                          </button>
                        ) : (
                          <span className="text-gray-400">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team 2 */}
          <div className="border-2 border-red-300 rounded-lg p-6 bg-red-50">
            <h3 className="text-xl font-bold text-red-800 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team2Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;

                return (
                  <div
                    key={`team2-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-red-200 border-red-500'
                        : playerAtPosition
                        ? 'bg-white border-red-200'
                        : 'bg-gray-100 border-dashed border-gray-300'
                    }`}
                  >
                    {playerAtPosition ? (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        {!isCurrentPlayer && currentPlayer && (
                          <button
                            onClick={() => onSwapPosition(playerAtPosition.id)}
                            className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                          >
                            Swap
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        {currentPlayer?.teamId !== 2 ? (
                          <button
                            onClick={() => onSelectTeam(2)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Join Team 2
                          </button>
                        ) : (
                          <span className="text-gray-400">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <div className="text-center">
          {canStartGame() ? (
            <button
              onClick={onStartGame}
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-bold hover:bg-green-700 shadow-lg transition-colors"
            >
              Start Game
            </button>
          ) : (
            <div className="space-y-3">
              <button
                disabled
                className="bg-gray-300 text-gray-500 px-8 py-3 rounded-lg text-lg font-bold cursor-not-allowed"
              >
                Start Game
              </button>
              <p className="text-gray-600 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
                {getStartGameMessage()}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">How to Play:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Teams play opposite each other (Team 1 vs Team 2)</li>
            <li>• You can swap positions with other players before starting</li>
            <li>• Position affects turn order during the game</li>
            <li>• The dealer rotates each round</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
