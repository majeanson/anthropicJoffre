import { useState, useEffect } from 'react';
import { Card as CardComponent } from './Card';
import { Leaderboard } from './Leaderboard';
import { GameState, Card as CardType, TrickCard } from '../types/game';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
  isSpectator?: boolean;
  currentTrickWinnerId?: string | null;
}

export function PlayingPhase({ gameState, currentPlayerId, onPlayCard, isSpectator = false, currentTrickWinnerId = null }: PlayingPhaseProps) {
  const [showPreviousTrick, setShowPreviousTrick] = useState<boolean>(false);
  const [isPlayingCard, setIsPlayingCard] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);

  const currentPlayer = isSpectator ? gameState.players[0] : gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = !isSpectator && gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  // Reset isPlayingCard flag when it's no longer the player's turn or when trick changes
  useEffect(() => {
    if (!isCurrentTurn) {
      setIsPlayingCard(false);
    }
  }, [isCurrentTurn]);

  // Also reset when currentTrick length changes (new trick started or card was played)
  useEffect(() => {
    setIsPlayingCard(false);
  }, [gameState.currentTrick.length]);

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
    // Prevent multiple rapid clicks
    if (isPlayingCard) {
      return;
    }

    if (!isCurrentTurn) {
      return;
    }

    if (!isCardPlayable(card)) {
      return;
    }

    setIsPlayingCard(true);
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
        <div className="w-12 h-20 md:w-20 md:h-28 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
          <span className="text-white/40 text-[10px] md:text-xs">Empty</span>
        </div>
      );
    }

    return (
      <div className={`transition-all duration-300 ${isWinner ? 'scale-110 ring-2 md:ring-4 ring-yellow-400' : ''}`}>
        <div className="md:hidden">
          <CardComponent card={tc.card} size="tiny" />
        </div>
        <div className="hidden md:block">
          <CardComponent card={tc.card} size="medium" />
        </div>
      </div>
    );
  };

  // Get color class for trump suit
  const getTrumpColor = (trump: string | null): string => {
    if (!trump || trump === 'none') return 'text-gray-900';
    switch (trump) {
      case 'red': return 'text-red-600';
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-900';
    }
  };

  // Get current player and their team
  const currentTurnPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentTurnTeam = currentTurnPlayer?.teamId || 1;

  // Calculate round scores (points earned this round)
  const team1RoundScore = gameState.players
    .filter(p => p.teamId === 1)
    .reduce((sum, p) => sum + p.pointsWon, 0);
  const team2RoundScore = gameState.players
    .filter(p => p.teamId === 2)
    .reduce((sum, p) => sum + p.pointsWon, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-teal-900 flex flex-col">
      {/* Score Board - 20% of screen height on mobile */}
      <div className="w-full mb-1 md:mb-4 sticky top-0 z-10 pr-16 md:pr-0">
        <div className="bg-white rounded-lg p-2 md:p-3 shadow-lg mx-2 md:mx-auto md:max-w-6xl">
          <div className="flex justify-between items-start gap-2">
            {/* Team 1 */}
            <div className="flex-1">
              <h3 className="text-xs text-gray-500">T1</h3>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">{gameState.teamScores.team1}</p>
              <p className="text-sm md:text-xs font-semibold text-blue-500 mt-0.5">+{team1RoundScore}</p>
            </div>

            {/* Center Info */}
            <div className="text-center flex-shrink-0">
              <p className="text-xs text-gray-500">R{gameState.roundNumber}</p>

              {/* Current Turn Indicator */}
              <div className={`mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                currentTurnTeam === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {currentTurnPlayer?.name}
              </div>

              {/* Trump */}
              {gameState.trump && (
                <p className={`text-sm md:text-base font-bold mt-1 ${getTrumpColor(gameState.trump)}`}>
                  <span className="capitalize">{!gameState.trump ? 'No Trump' : gameState.trump}</span>
                </p>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex-1 text-right">
              <h3 className="text-xs text-gray-500">T2</h3>
              <p className="text-3xl md:text-4xl font-bold text-red-600">{gameState.teamScores.team2}</p>
              <p className="text-sm md:text-xs font-semibold text-red-500 mt-0.5">+{team2RoundScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Card Layout - 60% of screen height on mobile */}
      <div className="flex-1 mx-2 md:mx-auto md:max-w-6xl mb-1 md:mb-8 relative min-h-0">
        <div className="bg-white/10 backdrop-blur rounded-lg p-2 md:p-8 h-full relative min-h-[400px] md:min-h-[500px]">
          {/* Floating Action Buttons - Bottom Right Corner, above hand cards */}
          <div className="fixed bottom-[140px] right-4 z-40 flex flex-col gap-2 md:absolute md:bottom-auto md:top-4 md:right-4">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-yellow-500 bg-opacity-90 hover:bg-opacity-100 active:bg-yellow-700 text-white w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-xl md:text-sm font-semibold transition-all shadow-lg flex items-center justify-center backdrop-blur-sm"
              title="Leaderboard"
            >
              <span className="md:hidden">🏆</span>
              <span className="hidden md:inline">🏆 Leaderboard</span>
            </button>
            {gameState.previousTrick && (
              <button
                onClick={() => setShowPreviousTrick(!showPreviousTrick)}
                className="bg-purple-600 bg-opacity-90 hover:bg-opacity-100 active:bg-purple-800 text-white w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-xl md:text-sm font-semibold transition-all shadow-lg flex items-center justify-center backdrop-blur-sm"
                title={showPreviousTrick ? 'Current Trick' : 'Previous Trick'}
              >
                <span className="md:hidden">{showPreviousTrick ? '▶️' : '⏮️'}</span>
                <span className="hidden md:inline">{showPreviousTrick ? 'Current' : 'Previous'}</span>
              </button>
            )}
          </div>

          {showPreviousTrick && previousCardPositions ? (
            // Previous Trick View - Circular layout on both mobile and desktop
            <>
              {/* Title - always visible */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                <div className="text-yellow-400 text-sm md:text-2xl font-bold mb-1 md:mb-2">Previous Trick</div>
                <div className="text-white text-xs md:text-lg">
                  Winner: {gameState.previousTrick ? gameState.players.find(p => p.id === gameState.previousTrick?.winnerId)?.name : ''}
                </div>
                <div className="text-white/80 text-xs md:text-sm">
                  +{gameState.previousTrick?.points || 0} points
                </div>
              </div>

              {/* Circular Layout for both mobile and desktop */}
              <div className="relative h-full md:h-[400px]">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-2">
                  {renderCard(previousCardPositions[0], previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId)}
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold ${
                    getPlayerTeam(0) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {getPlayerName(0)} (You)
                  </div>
                </div>

                <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    getPlayerTeam(1) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {getPlayerName(1)}
                  </div>
                  {renderCard(previousCardPositions[1], previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId)}
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    getPlayerTeam(2) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {getPlayerName(2)}
                  </div>
                  {renderCard(previousCardPositions[2], previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId)}
                </div>

                <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-2">
                  {renderCard(previousCardPositions[3], previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId)}
                  <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    getPlayerTeam(3) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {getPlayerName(3)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Current Trick View - Circular layout on both mobile and desktop
            <>
              {/* Circular Layout for both mobile and desktop */}
              <div className="relative h-full md:h-[400px]">
                {gameState.currentTrick.length === 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/60 text-center">
                    <p className="text-xl">Waiting for first card...</p>
                  </div>
                )}

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-2">
                  {renderCard(cardPositions[0], cardPositions[0]?.playerId === currentTrickWinnerId)}
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold ${
                    getPlayerTeam(0) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  } ${cardPositions[0]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-4 ring-yellow-400' : ''}`}>
                    {getPlayerName(0)} (You)
                  </div>
                </div>

                <div className="absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-1 md:gap-2">
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold ${
                    getPlayerTeam(1) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  } ${cardPositions[1]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-4 ring-yellow-400' : ''}`}>
                    {getPlayerName(1)}
                  </div>
                  {renderCard(cardPositions[1], cardPositions[1]?.playerId === currentTrickWinnerId)}
                </div>

                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-2">
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold ${
                    getPlayerTeam(2) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  } ${cardPositions[2]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-4 ring-yellow-400' : ''}`}>
                    {getPlayerName(2)}
                  </div>
                  {renderCard(cardPositions[2], cardPositions[2]?.playerId === currentTrickWinnerId)}
                </div>

                <div className="absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-1 md:gap-2">
                  {renderCard(cardPositions[3], cardPositions[3]?.playerId === currentTrickWinnerId)}
                  <div className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold ${
                    getPlayerTeam(3) === 1 ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'
                  } ${cardPositions[3]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-4 ring-yellow-400' : ''}`}>
                    {getPlayerName(3)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>


      {/* Player Hand */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg p-2 md:p-4 shadow-lg">
          {/* Card Hand - Hidden for spectators, horizontal scrollable on mobile for players */}
          {isSpectator ? (
            <div className="text-center py-6">
              <div className="inline-block bg-gray-100 px-4 py-3 rounded-lg">
                <span className="text-gray-600 text-sm">🔒 Hands Hidden</span>
                <p className="text-gray-500 text-xs mt-1">Spectator Mode</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto md:overflow-x-visible -mx-2 md:mx-0 px-2 md:px-0">
                <div className="flex gap-1.5 md:gap-4 md:flex-wrap md:justify-center min-w-min">
                  {currentPlayer.hand.map((card, index) => {
                    const playable = isCardPlayable(card);
                    return (
                      <div key={`${card.color}-${card.value}-${index}`} className="relative flex-shrink-0 md:flex-shrink">
                        <CardComponent
                          card={card}
                          size="small"
                          onClick={() => handleCardClick(card)}
                          disabled={!isCurrentTurn || !playable}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              {!isCurrentTurn && (
                <p className="text-center text-gray-500 mt-2 text-xs md:text-sm">
                  Waiting for {gameState.players[gameState.currentPlayerIndex]?.name}...
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}
