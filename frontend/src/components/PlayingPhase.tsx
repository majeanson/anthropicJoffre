import { useState } from 'react';
import { Card as CardComponent } from './Card';
import { GameState, Card as CardType, TrickCard } from '../types/game';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
}

export function PlayingPhase({ gameState, currentPlayerId, onPlayCard }: PlayingPhaseProps) {
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [showPreviousTrick, setShowPreviousTrick] = useState<boolean>(false);

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  if (!currentPlayer) return null;

  // Find current player's index
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayerId);

  // Arrange cards in circular order relative to current player (bottom)
  // Positions: [bottom, left, top, right]
  const getCardPositions = (trick: TrickCard[]): (TrickCard | null)[] => {
    const positions: (TrickCard | null)[] = [null, null, null, null]; // bottom, left, top, right

    trick.forEach(tc => {
      const playerIndex = gameState.players.findIndex(p => p.id === tc.playerId);
      // Calculate relative position (0=bottom, 1=left, 2=top, 3=right)
      const relativePos = (playerIndex - currentPlayerIndex + 4) % 4;
      positions[relativePos] = tc;
    });

    return positions;
  };

  // Determine which cards are playable
  const getPlayableCards = (): CardType[] => {
    if (!isCurrentTurn) return [];

    // If no cards in trick, all cards are playable
    if (gameState.currentTrick.length === 0) return currentPlayer.hand;

    // Get led suit
    const ledSuit = gameState.currentTrick[0].card.color;
    const cardsInLedSuit = currentPlayer.hand.filter(c => c.color === ledSuit);

    // If player has led suit, they must play it
    if (cardsInLedSuit.length > 0) {
      return cardsInLedSuit;
    }

    // Otherwise, all cards are playable
    return currentPlayer.hand;
  };

  const playableCards = getPlayableCards();

  const isCardPlayable = (card: CardType): boolean => {
    return playableCards.some(c => c.color === card.color && c.value === card.value);
  };

  const handleCardClick = (card: CardType) => {
    if (!isCurrentTurn) {
      setValidationMessage("Wait for your turn");
      return;
    }

    if (!isCardPlayable(card)) {
      const ledSuit = gameState.currentTrick[0]?.card.color;
      setValidationMessage(`You must follow suit (${ledSuit}) if you have it`);
      return;
    }

    setValidationMessage('');
    onPlayCard(card);
  };

  const cardPositions = getCardPositions(gameState.currentTrick);
  const previousCardPositions = gameState.previousTrick ? getCardPositions(gameState.previousTrick.trick) : null;

  // Get player names for each position
  const getPlayerName = (positionIndex: number): string => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    return gameState.players[playerIndex]?.name || '';
  };

  const getPlayerTeam = (positionIndex: number): 1 | 2 => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    return gameState.players[playerIndex]?.teamId || 1;
  };

  const renderCard = (tc: TrickCard | null, isWinner: boolean = false) => {
    if (!tc) {
      return (
        <div className="w-20 h-28 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
          <span className="text-white/40 text-xs">Empty</span>
        </div>
      );
    }

    return (
      <div className={`transition-all duration-300 ${isWinner ? 'scale-110 ring-4 ring-yellow-400' : ''}`}>
        <CardComponent card={tc.card} size="medium" />
      </div>
    );
  };

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

      {/* Circular Card Layout */}
      <div className="max-w-6xl mx-auto mb-8 relative">
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 min-h-[500px] relative">
          {/* Previous Trick Button */}
          {gameState.previousTrick && (
            <button
              onClick={() => setShowPreviousTrick(!showPreviousTrick)}
              className="absolute top-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              {showPreviousTrick ? 'Current Trick' : 'Previous Trick'}
            </button>
          )}

          {showPreviousTrick && previousCardPositions ? (
            // Previous Trick View
            <div className="relative h-[400px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-yellow-400 text-2xl font-bold mb-2">Previous Trick</div>
                <div className="text-white text-lg">
                  Winner: {gameState.previousTrick ? gameState.players.find(p => p.id === gameState.previousTrick?.winnerId)?.name : ''}
                </div>
                <div className="text-white/80 text-sm">
                  +{gameState.previousTrick?.points || 0} points
                </div>
              </div>

              {/* Bottom (Current Player) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                {renderCard(previousCardPositions[0], previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId)}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(0) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(0)} (You)
                </div>
              </div>

              {/* Left (Partner/Opponent) */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(1) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(1)}
                </div>
                {renderCard(previousCardPositions[1], previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId)}
              </div>

              {/* Top (Opponent) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(2) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(2)}
                </div>
                {renderCard(previousCardPositions[2], previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId)}
              </div>

              {/* Right (Partner/Opponent) */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-2">
                {renderCard(previousCardPositions[3], previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId)}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(3) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(3)}
                </div>
              </div>
            </div>
          ) : (
            // Current Trick View
            <div className="relative h-[400px]">
              {gameState.currentTrick.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60 text-center">
                  <p className="text-xl">Waiting for first card...</p>
                </div>
              )}

              {/* Bottom (Current Player) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                {renderCard(cardPositions[0])}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(0) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(0)} (You)
                </div>
              </div>

              {/* Left (Partner/Opponent) */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(1) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(1)}
                </div>
                {renderCard(cardPositions[1])}
              </div>

              {/* Top (Opponent) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(2) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(2)}
                </div>
                {renderCard(cardPositions[2])}
              </div>

              {/* Right (Partner/Opponent) */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-2">
                {renderCard(cardPositions[3])}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  getPlayerTeam(3) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {getPlayerName(3)}
                </div>
              </div>
            </div>
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

          {validationMessage && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              {validationMessage}
            </div>
          )}

          {isCurrentTurn && gameState.currentTrick.length > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
              <strong>Led suit:</strong> {gameState.currentTrick[0].card.color.charAt(0).toUpperCase() + gameState.currentTrick[0].card.color.slice(1)}
              {playableCards.length < currentPlayer.hand.length &&
                ` - You must play ${gameState.currentTrick[0].card.color}`}
            </div>
          )}

          <div className="flex gap-4 flex-wrap justify-center">
            {currentPlayer.hand.map((card, index) => {
              const playable = isCardPlayable(card);
              return (
                <div key={`${card.color}-${card.value}-${index}`} className="relative">
                  <CardComponent
                    card={card}
                    onClick={() => handleCardClick(card)}
                    disabled={!isCurrentTurn || !playable}
                  />
                  {isCurrentTurn && !playable && (
                    <div className="absolute inset-0 bg-gray-500 bg-opacity-50 rounded-lg flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">✕</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!isCurrentTurn && (
            <p className="text-center text-gray-500 mt-4">
              Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
