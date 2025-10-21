import { Player } from '../types/game';
import { useState } from 'react';

interface TeamSelectionProps {
  players: Player[];
  gameId: string;
  currentPlayerId: string;
  onSelectTeam: (teamId: 1 | 2) => void;
  onSwapPosition: (targetPlayerId: string) => void;
  onStartGame: () => void;
  onLeaveGame?: () => void;
  onAddBot?: () => void;
}

export function TeamSelection({
  players,
  gameId,
  currentPlayerId,
  onSelectTeam,
  onSwapPosition,
  onStartGame,
  onLeaveGame,
  onAddBot,
}: TeamSelectionProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const team1Players = players.filter(p => p.teamId === 1);
  const team2Players = players.filter(p => p.teamId === 2);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const handleCopyGameLink = async () => {
    const gameUrl = `${window.location.origin}?join=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background cards */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}>🃏</div>
        <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>🎴</div>
        <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>🂡</div>
        <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}>🂱</div>
      </div>

      <div className="bg-gradient-to-br from-parchment-50 to-parchment-100 rounded-2xl p-8 shadow-2xl max-w-4xl w-full relative border-4 border-amber-700">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-600 rounded-tl-xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-600 rounded-tr-xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-600 rounded-bl-xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-600 rounded-br-xl"></div>

        {/* Leave Button - positioned above everything with more top margin to avoid overlap */}
        {onLeaveGame && (
          <button
            onClick={onLeaveGame}
            className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 border-2 border-red-800 shadow-lg transform hover:scale-105 z-10"
            title="Leave Game"
          >
            🚪 Leave
          </button>
        )}

        <h2 className="text-3xl font-bold mb-6 text-umber-900 text-center font-serif mt-12">Team Selection</h2>

        <div className="mb-6">
          <p className="text-sm text-umber-700 mb-2">Game ID:</p>
          <div data-testid="game-id" className="bg-parchment-100 p-3 rounded-lg font-mono text-lg text-center border-2 border-parchment-400 text-umber-900">{gameId}</div>

          {/* Copy Game Link Button */}
          <button
            onClick={handleCopyGameLink}
            className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg font-bold transition-all duration-300 border-2 border-blue-800 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
            title="Copy shareable game link"
          >
            <span>🔗</span>
            <span>Copy Game Link</span>
          </button>
        </div>

        {/* Toast Notification */}
        {showCopyToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-green-700 animate-bounce z-50 flex items-center gap-2">
            <span>✅</span>
            <span className="font-bold">Game link copied! Share with friends.</span>
          </div>
        )}

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
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="font-medium text-umber-900 text-center sm:text-left">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        {!isCurrentPlayer && currentPlayer && (
                          <button
                            onClick={() => onSwapPosition(playerAtPosition.id)}
                            className="text-xs bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-orange-800 shadow-sm flex-shrink-0"
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
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <span className="font-medium text-umber-900 text-center sm:text-left">
                          {playerAtPosition.name}
                          {isCurrentPlayer && ' (You)'}
                        </span>
                        {!isCurrentPlayer && currentPlayer && (
                          <button
                            onClick={() => onSwapPosition(playerAtPosition.id)}
                            className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 py-1.5 rounded-lg font-bold transition-all border border-purple-800 shadow-sm flex-shrink-0"
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
        <div className="text-center space-y-3">
          <div className="flex gap-3 justify-center items-center">
            {/* Add Bot Button - only show if less than 4 players and onAddBot is provided */}
            {players.length < 4 && onAddBot && (
              <button
                onClick={onAddBot}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg text-base font-bold transition-all duration-300 border-2 border-purple-800 shadow-lg transform hover:scale-105 flex items-center gap-2"
                title="Add a bot player"
              >
                🤖 Add Bot
              </button>
            )}

            {canStartGame() ? (
              <button
                data-testid="start-game-button"
                onClick={onStartGame}
                className="bg-forest-600 text-parchment-50 px-8 py-3 rounded-lg text-lg font-bold hover:bg-forest-700 shadow-lg transition-colors border-2 border-forest-700"
              >
                Start Game
              </button>
            ) : (
              <button
                data-testid="start-game-button-disabled"
                disabled
                className="bg-parchment-300 text-umber-500 px-8 py-3 rounded-lg text-lg font-bold cursor-not-allowed border-2 border-parchment-400"
              >
                Start Game
              </button>
            )}
          </div>

          {!canStartGame() && (
            <p data-testid="start-game-message" className="text-umber-800 bg-parchment-200 border-2 border-umber-400 px-4 py-2 rounded-lg">
              {getStartGameMessage()}
            </p>
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
