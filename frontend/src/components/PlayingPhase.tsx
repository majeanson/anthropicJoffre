import { Card as CardComponent } from './Card';
import { GameState, Card as CardType } from '../types/game';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
}

export function PlayingPhase({ gameState, currentPlayerId, onPlayCard }: PlayingPhaseProps) {
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  if (!currentPlayer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-teal-900 p-6">
      {/* Score Board */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm text-gray-600">Team 1</h3>
              <p className="text-3xl font-bold text-blue-600">{gameState.teamScores.team1}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Round {gameState.roundNumber}</p>
              {gameState.trump && (
                <p className="text-lg font-semibold mt-1">
                  Trump: <span className="capitalize">{gameState.trump}</span>
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm text-gray-600">Team 2</h3>
              <p className="text-3xl font-bold text-red-600">{gameState.teamScores.team2}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Trick */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 min-h-48">
          <h3 className="text-white text-xl font-semibold mb-4 text-center">Current Trick</h3>
          <div className="flex justify-center gap-6 flex-wrap">
            {gameState.currentTrick.map((tc, index) => {
              const player = gameState.players.find(p => p.id === tc.playerId);
              return (
                <div key={index} className="flex flex-col items-center gap-2">
                  <CardComponent card={tc.card} size="medium" />
                  <span className="text-white text-sm">{player?.name}</span>
                </div>
              );
            })}
          </div>
          {gameState.currentTrick.length === 0 && (
            <p className="text-white/60 text-center">No cards played yet</p>
          )}
        </div>
      </div>

      {/* Players Info */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="grid grid-cols-4 gap-4">
          {gameState.players.map((player, index) => (
            <div
              key={player.id}
              className={`bg-white rounded-lg p-4 ${
                gameState.currentPlayerIndex === index ? 'ring-4 ring-yellow-400' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${player.teamId === 1 ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                <span className="font-medium truncate">{player.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Tricks: {player.tricksWon}</p>
                <p>Cards: {player.hand.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Hand */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">
            Your Hand {isCurrentTurn && <span className="text-green-600">(Your Turn)</span>}
          </h3>
          <div className="flex gap-4 flex-wrap justify-center">
            {currentPlayer.hand.map((card, index) => (
              <CardComponent
                key={`${card.color}-${card.value}-${index}`}
                card={card}
                onClick={() => isCurrentTurn && onPlayCard(card)}
                disabled={!isCurrentTurn}
              />
            ))}
          </div>
          {!isCurrentTurn && (
            <p className="text-center text-gray-500 mt-4">Waiting for other players...</p>
          )}
        </div>
      </div>
    </div>
  );
}
