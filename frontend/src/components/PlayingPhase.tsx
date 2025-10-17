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
  onLeaveGame?: () => void;
}

export function PlayingPhase({ gameState, currentPlayerId, onPlayCard, isSpectator = false, currentTrickWinnerId = null, onLeaveGame }: PlayingPhaseProps) {
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
  // Positions: [bottom, left, top, right] - anti-clockwise
  const getCardPositions = (trick: TrickCard[]): (TrickCard | null)[] => {
    const positions: (TrickCard | null)[] = [null, null, null, null]; // bottom, left, top, right

    trick.forEach(tc => {
      const playerIndex = gameState.players.findIndex(p => p.id === tc.playerId);
      // Calculate relative position (0=bottom, 1=left, 2=top, 3=right) - anti-clockwise
      // Map: player 0→bottom, 1→left, 2→top, 3→right
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
        <div className="w-16 h-24 md:w-20 md:h-28 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </div>
      );
    }

    return (
      <div className={`transition-all duration-500 ${isWinner ? 'scale-110 ring-4 md:ring-6 ring-yellow-400 shadow-2xl shadow-yellow-400/50' : ''}`}>
        <CardComponent card={tc.card} size="small" />
      </div>
    );
  };

  // Get color class for trump suit
  const getTrumpColor = (trump: string | null): string => {
    if (!trump || trump === 'none') return 'text-gray-900';
    switch (trump) {
      case 'red': return 'text-purple-600';
      case 'green': return 'text-green-600';
      case 'blue': return 'text-orange-600';
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
    <div className="h-screen md:min-h-screen bg-gradient-to-br from-green-900 to-teal-900 flex flex-col overflow-hidden md:overflow-visible">
      {/* Score Board - Fixed height */}
      <div className="w-full mb-3 md:mb-6 flex-shrink-0 px-2 md:px-6 pt-2 md:pt-6">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 md:p-6 shadow-2xlborder border-white/20">
          <div className="flex justify-between items-center gap-4 md:gap-8">
            {/* Team 1 */}
            <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-2 md:p-4">
              <h3 className="text-[10px] md:text-xs font-semibold text-orange-600/70 uppercase tracking-wider mb-1">Team 1</h3>
              <p className="text-3xl md:text-5xl font-black text-orange-600 leading-none">{gameState.teamScores.team1}</p>
              <p className="text-xs md:text-sm font-bold text-orange-500 mt-1">+{team1RoundScore} pts</p>
            </div>

            {/* Center Info */}
            <div className="text-center flex-shrink-0 space-y-1.5 md:space-y-2">
              <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-2 md:px-3 py-1 rounded-lg">
                <p className="text-[10px] md:text-xs font-bold text-gray-600">ROUND {gameState.roundNumber}</p>
              </div>

              {/* Current Turn Indicator */}
              <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-sm font-bold shadow-lg ${
                currentTurnTeam === 1
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
              }`}>
                {currentTurnPlayer?.name}
              </div>

              {/* Trump */}
              {gameState.trump && (
                <div className="bg-white/60 backdrop-blur px-3 md:px-4 py-1 md:py-1.5 rounded-lg border border-gray-200">
                  <p className={`text-xs md:text-base font-bold ${getTrumpColor(gameState.trump)}`}>
                    <span className="capitalize">{!gameState.trump ? 'No Trump' : gameState.trump}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-2 md:p-4 text-right">
              <h3 className="text-[10px] md:text-xs font-semibold text-purple-600/70 uppercase tracking-wider mb-1">Team 2</h3>
              <p className="text-3xl md:text-5xl font-black text-purple-600 leading-none">{gameState.teamScores.team2}</p>
              <p className="text-xs md:text-sm font-bold text-purple-500 mt-1">+{team2RoundScore} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Card Layout - Takes remaining space */}
      <div className="mb-3 md:mb-8 relative px-2 md:px-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 md:p-10 md:min-h-[500px] relative border border-white/10 shadow-2xl">
          {/* Floating Action Buttons - Bottom Right Corner, above hand cards */}
          <div className="fixed bottom-[140px] right-4 z-40 flex flex-col gap-3 absolute  bottom-auto top-4 right-4">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 active:scale-95 text-white w-14 h-14 md:w-auto md:h-auto md:px-5 md:py-3 rounded-full md:rounded-xl text-xl md:text-base font-bold transition-all duration-200 shadow-2xl hover:shadow-yellow-500/50 flex items-center justify-center backdrop-blur-md border border-yellow-300/30"
              title="Leaderboard"
            >
              <span className="md:hidden">🏆</span>
              <span className="hidden md:inline">🏆 Leaderboard</span>
            </button>
            {onLeaveGame && (
              <button
                onClick={onLeaveGame}
                className="bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 active:scale-95 text-white w-14 h-14 md:w-auto md:h-auto md:px-5 md:py-3 rounded-full md:rounded-xl text-xl md:text-base font-bold transition-all duration-200 shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center backdrop-blur-md border border-purple-300/30"
                title="Leave Game"
              >
                <span className="md:hidden">🚪</span>
                <span className="hidden md:inline">🚪 Leave</span>
              </button>
            )}
            {gameState.previousTrick && (
              <button
                onClick={() => setShowPreviousTrick(!showPreviousTrick)}
                className={`${
                  showPreviousTrick
                    ? 'bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 shadow-green-500/50'
                    : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 shadow-purple-500/50'
                } active:scale-95 text-white w-14 h-14 md:w-auto md:h-auto md:px-5 md:py-3 rounded-full md:rounded-xl text-xl md:text-base font-bold transition-all duration-200 shadow-2xl hover:shadow-2xl flex items-center justify-center backdrop-blur-md border border-white/30`}
                title={showPreviousTrick ? 'Current Trick' : 'Previous Trick'}
              >
                <span className="md:hidden">{showPreviousTrick ? '▶️' : '⏮️'}</span>
                <span className="hidden md:inline">{showPreviousTrick ? '▶️ Current' : '⏮️ Previous'}</span>
              </button>
            )}
          </div>

          {showPreviousTrick && previousCardPositions ? (
            // Previous Trick View - Circular layout on both mobile and desktop
            <>
              {/* Modal overlay background */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg z-0" />

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

              {/* Circular Layout for both mobile and desktop - ANTI-CLOCKWISE */}
              <div className="relative h-[400px] z-10">
                {/* Bottom - You (position 0) */}
                <div className="absolute bottom-4 md:bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(previousCardPositions[0], previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId)}
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(0) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(0)} (You)
                  </div>
                </div>

                {/* Left - Next player anti-clockwise (position 1) */}
                <div className="absolute top-1/2 left-2 md:left-0 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(1) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(1)}
                  </div>
                  {renderCard(previousCardPositions[1], previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId)}
                </div>

                {/* Top - Opposite player (position 2) */}
                <div className="absolute top-4 md:top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(2) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(2)}
                  </div>
                  {renderCard(previousCardPositions[2], previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId)}
                </div>

                {/* Right - Previous player anti-clockwise (position 3) */}
                <div className="absolute top-1/2 right-2 md:right-0 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                  {renderCard(previousCardPositions[3], previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId)}
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(3) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(3)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Current Trick View - Circular layout on both mobile and desktop - ANTI-CLOCKWISE
            <>
              {/* Circular Layout for both mobile and desktop */}
              <div className="relative h-[400px]">
              

                {/* Bottom - You (position 0) */}
                <div className="absolute bottom-4 md:bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(cardPositions[0], cardPositions[0]?.playerId === currentTrickWinnerId)}
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(0) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[0]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(0)} (You)
                  </div>
                </div>

                {/* Left - Next player anti-clockwise (position 1) */}
                <div className="absolute top-1/2 left-2 md:left-0 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(1) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[1]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(1)}
                  </div>
                  {renderCard(cardPositions[1], cardPositions[1]?.playerId === currentTrickWinnerId)}
                </div>

                {/* Top - Opposite player (position 2) */}
                <div className="absolute top-4 md:top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(2) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[2]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(2)}
                  </div>
                  {renderCard(cardPositions[2], cardPositions[2]?.playerId === currentTrickWinnerId)}
                </div>

                {/* Right - Previous player anti-clockwise (position 3) */}
                <div className="absolute top-1/2 right-2 md:right-0 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                  {renderCard(cardPositions[3], cardPositions[3]?.playerId === currentTrickWinnerId)}
                  <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    getPlayerTeam(3) === 1
                      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[3]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    {getPlayerName(3)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>


      {/* Player Hand */}
      <div className="md:max-w-6xl md:mx-auto px-2 md:px-6 pb-2 md:pb-6 mt-auto">
        {gameState.currentTrick.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="bg-black/80 rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
                    <p className="text-white/90 text-lg md:text-2xl font-semibold">{`Waiting for first card from ${gameState.players[gameState.currentPlayerIndex]?.name}...`}</p>
                    <div className="mt-2 flex gap-1 justify-center">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-3 md:p-6 shadow-2xl border border-white/20">
          {/* Card Hand - Hidden for spectators, horizontal scrollable on mobile for players */}
          {isSpectator ? (
            <div className="text-center py-8">
              <div className="inline-block bg-gradient-to-br from-gray-100 to-gray-50 px-6 py-4 rounded-xl border border-gray-200 shadow-lg">
                <span className="text-gray-700 text-base font-semibold">🔒 Hands Hidden</span>
                <p className="text-gray-500 text-sm mt-1.5">Spectator Mode</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto md:overflow-x-visible -mx-2 md:mx-0 px-2 md:px-0">
                <div className="flex gap-2 md:gap-4 md:flex-wrap md:justify-center min-w-min">
                  {currentPlayer.hand.map((card, index) => {
                    const playable = isCardPlayable(card);
                    return (
                      <div
                        key={`${card.color}-${card.value}-${index}`}
                        className={`relative flex-shrink-0 md:flex-shrink transition-all duration-200 ${
                          playable && isCurrentTurn ? 'hover:-translate-y-2' : ''
                        }`}
                      >
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
