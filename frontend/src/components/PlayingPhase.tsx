import { useState } from 'react';
import { Card as CardComponent } from './Card';
import { GameState, Card as CardType } from '../types/game';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
}

export function PlayingPhase({ gameState, currentPlayerId, onPlayCard }: PlayingPhaseProps) {
  const [validationMessage, setValidationMessage] = useState<string>('');

  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  if (!currentPlayer) return null;

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
