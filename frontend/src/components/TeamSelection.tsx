import { Player } from '../types/game';

interface TeamSelectionProps {
  players: Player[];
  gameId: string;
  currentPlayerId: string;
  onSelectTeam: (teamId: 1 | 2) => void;
  onSwapPosition: (targetPlayerId: string) => void;
  onStartGame: () => void;
  onLeaveGame?: () => void;
}

export function TeamSelection({
  players,
  gameId,
  currentPlayerId,
  onSelectTeam,
  onSwapPosition,
  onStartGame,
  onLeaveGame,
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
    <div className="min-h-screen bg-gradient-to-br from-parchment-300 to-parchment-400 flex items-center justify-center p-6">
      <div className="bg-parchment-50 rounded-xl p-8 shadow-2xl max-w-4xl w-full relative border-2 border-parchment-400">
        {onLeaveGame && (
          <button
            onClick={onLeaveGame}
            className="absolute top-4 right-4 bg-crimson-600 hover:bg-crimson-700 text-parchment-50 px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-2 border-2 border-crimson-700"
            title="Leave Game"
          >
            🚪 Leave
          </button>
        )}
        <h2 className="text-3xl font-bold mb-6 text-umber-900 text-center font-serif">Team Selection</h2>

        <div className="mb-6">
          <p className="text-sm text-umber-700 mb-2">Game ID:</p>
          <div data-testid="game-id" className="bg-parchment-100 p-3 rounded-lg font-mono text-lg text-center border-2 border-parchment-400 text-umber-900">{gameId}</div>
        </div>

        <div className="mb-8">
          <p className="text-center text-umber-700 mb-4">
            Players (<span data-testid="player-count">{players.length}</span>/4) - Choose your team and position
          </p>
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Team 1 */}
          <div data-testid="team-1-container" className="border-2 border-orange-300 rounded-lg p-6 bg-orange-50">
            <h3 className="text-xl font-bold text-orange-800 mb-4 text-center">Team 1</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team1Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;

                return (
                  <div
                    key={`team1-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-orange-200 border-orange-500'
                        : playerAtPosition
                        ? 'bg-parchment-50 border-orange-200'
                        : 'bg-parchment-100 border-dashed border-parchment-300'
                    }`}
                  >
                    {playerAtPosition ? (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-umber-900">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        {!isCurrentPlayer && currentPlayer && (
                          <button
                            onClick={() => onSwapPosition(playerAtPosition.id)}
                            className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 border border-orange-700"
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
                            className="text-orange-600 hover:text-orange-800 font-medium"
                          >
                            Join Team 1
                          </button>
                        ) : (
                          <span className="text-umber-400">Empty Seat</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team 2 */}
          <div data-testid="team-2-container" className="border-2 border-purple-300 rounded-lg p-6 bg-purple-50">
            <h3 className="text-xl font-bold text-purple-800 mb-4 text-center">Team 2</h3>
            <div className="space-y-3">
              {[0, 1].map((position) => {
                const playerAtPosition = team2Players[position];
                const isCurrentPlayer = playerAtPosition?.id === currentPlayerId;

                return (
                  <div
                    key={`team2-${position}`}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrentPlayer
                        ? 'bg-purple-200 border-purple-500'
                        : playerAtPosition
                        ? 'bg-parchment-50 border-purple-200'
                        : 'bg-parchment-100 border-dashed border-parchment-300'
                    }`}
                  >
                    {playerAtPosition ? (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-umber-900">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        {!isCurrentPlayer && currentPlayer && (
                          <button
                            onClick={() => onSwapPosition(playerAtPosition.id)}
                            className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 border border-purple-700"
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
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Join Team 2
                          </button>
                        ) : (
                          <span className="text-umber-400">Empty Seat</span>
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
              data-testid="start-game-button"
              onClick={onStartGame}
              className="bg-forest-600 text-parchment-50 px-8 py-3 rounded-lg text-lg font-bold hover:bg-forest-700 shadow-lg transition-colors border-2 border-forest-700"
            >
              Start Game
            </button>
          ) : (
            <div className="space-y-3">
              <button
                data-testid="start-game-button-disabled"
                disabled
                className="bg-parchment-300 text-umber-500 px-8 py-3 rounded-lg text-lg font-bold cursor-not-allowed border-2 border-parchment-400"
              >
                Start Game
              </button>
              <p data-testid="start-game-message" className="text-umber-800 bg-parchment-200 border-2 border-umber-400 px-4 py-2 rounded-lg">
                {getStartGameMessage()}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-parchment-100 rounded-lg border-2 border-parchment-400">
          <h4 className="font-semibold text-umber-800 mb-2">How to Play:</h4>
          <ul className="text-sm text-umber-700 space-y-1">
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
