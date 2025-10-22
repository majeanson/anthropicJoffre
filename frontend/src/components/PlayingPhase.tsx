import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Card as CardComponent } from './Card';
import { Leaderboard } from './Leaderboard';
import { TimeoutIndicator } from './TimeoutIndicator';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { Tooltip } from './Tooltip';
import { GameState, Card as CardType, TrickCard, CardColor } from '../types/game';
import { sounds } from '../utils/sounds';
import { useSettings } from '../contexts/SettingsContext';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
  isSpectator?: boolean;
  currentTrickWinnerId?: string | null;
  onLeaveGame?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
}

export function PlayingPhase({ gameState, currentPlayerId, onPlayCard, isSpectator = false, currentTrickWinnerId = null, onLeaveGame, autoplayEnabled = false, onAutoplayToggle, socket, gameId, chatMessages = [], onNewChatMessage }: PlayingPhaseProps) {
  const { darkMode, setDarkMode } = useSettings();
  const [showPreviousTrick, setShowPreviousTrick] = useState<boolean>(false);
  const [isPlayingCard, setIsPlayingCard] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showDealingAnimation, setShowDealingAnimation] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  // Debug: Log autoplay button visibility conditions
  console.log('Autoplay button conditions:', {
    isSpectator,
    hasOnAutoplayToggle: !!onAutoplayToggle,
    autoplayEnabled,
    shouldShow: !isSpectator && !!onAutoplayToggle
  });
  const [dealingCardIndex, setDealingCardIndex] = useState<number>(0);
  const [trickCollectionAnimation, setTrickCollectionAnimation] = useState<boolean>(false);
  const [lastTrickLength, setLastTrickLength] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [previousScores, setPreviousScores] = useState<{team1: number, team2: number} | null>(null);
  const [scoreAnimation, setScoreAnimation] = useState<{team1: boolean, team2: boolean}>({team1: false, team2: false});
  const [floatingPoints, setFloatingPoints] = useState<{team1: number | null, team2: number | null}>({team1: null, team2: null});
  const [previousRoundScores, setPreviousRoundScores] = useState<{team1: number, team2: number} | null>(null);
  const [floatingTrickPoints, setFloatingTrickPoints] = useState<{team1: number | null, team2: number | null}>({team1: null, team2: null});

  const currentPlayer = isSpectator ? gameState.players[0] : gameState.players.find(p => p.id === currentPlayerId);
  const isCurrentTurn = !isSpectator && gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId;

  // Listen for chat messages to update unread count
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      if (!chatOpen) {
        setUnreadChatCount(prev => prev + 1);
        // Play notification sound if message is from another player
        if (msg.playerId !== currentPlayerId) {
          sounds.chatNotification();
        }
      }
    };

    socket.on('game_chat_message', handleChatMessage);

    return () => {
      socket.off('game_chat_message', handleChatMessage);
    };
  }, [socket, chatOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (chatOpen) {
      setUnreadChatCount(0);
    }
  }, [chatOpen]);

  // Toggle sound on/off
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sounds.setEnabled(newState);
    if (newState) {
      sounds.buttonClick(); // Play test sound when enabling
    }
  };

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

  // Card dealing animation when round starts or hand changes
  useEffect(() => {
    if (currentPlayer && currentPlayer.hand.length > 0 && gameState.currentTrick.length === 0) {
      setShowDealingAnimation(true);
      setDealingCardIndex(0);
      sounds.roundStart(); // Play round start sound

      const dealInterval = setInterval(() => {
        setDealingCardIndex(prev => {
          if (prev >= currentPlayer.hand.length - 1) {
            clearInterval(dealInterval);
            setTimeout(() => setShowDealingAnimation(false), 300);
            return prev;
          }
          sounds.cardDeal(prev + 1); // Play card deal sound for each card
          return prev + 1;
        });
      }, 80); // 80ms between each card

      return () => clearInterval(dealInterval);
    }
  }, [gameState.roundNumber]);

  // Trick collection animation when trick is completed
  useEffect(() => {
    if (gameState.currentTrick.length === 4 && lastTrickLength !== 4) {
      setTrickCollectionAnimation(true);
      setTimeout(() => {
        setTrickCollectionAnimation(false);
      }, 3000); // Match the backend 3-second delay
    }
    setLastTrickLength(gameState.currentTrick.length);
  }, [gameState.currentTrick.length]);

  // Play win/loss sounds based on previousTrick outcome
  useEffect(() => {
    if (gameState.previousTrick && gameState.previousTrick.winnerId) {
      const winner = gameState.players.find(p => p.id === gameState.previousTrick?.winnerId);
      const currentPlayerTeam = currentPlayer?.teamId;

      if (winner && currentPlayerTeam) {
        if (winner.teamId === currentPlayerTeam) {
          // Current player's team won - play win sound
          sounds.trickWon();
        } else {
          // Current player's team lost - play loss sound
          setTimeout(() => {
            sounds.trickCollect(); // Play collection sound for losses
          }, 500);
        }
      }
    }
  }, [gameState.previousTrick?.winnerId]);

  // Your turn notification sound
  useEffect(() => {
    if (isCurrentTurn && gameState.currentTrick.length > 0) {
      sounds.yourTurn();
    }
  }, [isCurrentTurn, gameState.currentPlayerIndex]);

  // Score change animation (for cumulative scores at round end)
  useEffect(() => {
    // Initialize previousScores on first render
    if (previousScores === null) {
      setPreviousScores({ team1: gameState.teamScores.team1, team2: gameState.teamScores.team2 });
      return;
    }

    const team1Delta = gameState.teamScores.team1 - previousScores.team1;
    const team2Delta = gameState.teamScores.team2 - previousScores.team2;

    if (team1Delta !== 0) {
      setFloatingPoints(prev => ({ ...prev, team1: team1Delta }));
      setScoreAnimation(prev => ({ ...prev, team1: true }));
      setTimeout(() => {
        setScoreAnimation(prev => ({ ...prev, team1: false }));
        setTimeout(() => setFloatingPoints(prev => ({ ...prev, team1: null })), 2000);
      }, 500);
    }

    if (team2Delta !== 0) {
      setFloatingPoints(prev => ({ ...prev, team2: team2Delta }));
      setScoreAnimation(prev => ({ ...prev, team2: true }));
      setTimeout(() => {
        setScoreAnimation(prev => ({ ...prev, team2: false }));
        setTimeout(() => setFloatingPoints(prev => ({ ...prev, team2: null })), 2000);
      }, 500);
    }

    setPreviousScores({ team1: gameState.teamScores.team1, team2: gameState.teamScores.team2 });
  }, [gameState.teamScores.team1, gameState.teamScores.team2]);

  // Round score change animation (for trick points during the round)
  useEffect(() => {
    const team1RoundScore = gameState.players
      .filter(p => p.teamId === 1)
      .reduce((sum, p) => sum + p.pointsWon, 0);
    const team2RoundScore = gameState.players
      .filter(p => p.teamId === 2)
      .reduce((sum, p) => sum + p.pointsWon, 0);

    // Initialize previousRoundScores on first render
    if (previousRoundScores === null) {
      setPreviousRoundScores({ team1: team1RoundScore, team2: team2RoundScore });
      return;
    }

    const team1Delta = team1RoundScore - previousRoundScores.team1;
    const team2Delta = team2RoundScore - previousRoundScores.team2;

    if (team1Delta !== 0) {
      setFloatingTrickPoints(prev => ({ ...prev, team1: team1Delta }));
      setTimeout(() => {
        setFloatingTrickPoints(prev => ({ ...prev, team1: null }));
      }, 2000);
    }

    if (team2Delta !== 0) {
      setFloatingTrickPoints(prev => ({ ...prev, team2: team2Delta }));
      setTimeout(() => {
        setFloatingTrickPoints(prev => ({ ...prev, team2: null }));
      }, 2000);
    }

    setPreviousRoundScores({ team1: team1RoundScore, team2: team2RoundScore });
  }, [gameState.players]);

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
    sounds.cardPlay(); // Play card play sound
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

  const renderCard = (tc: TrickCard | null, isWinner: boolean = false, positionIndex?: number) => {
    if (!tc) {
      return (
        <div className="w-16 h-24 md:w-20 md:h-28 border-2 border-dashed border-parchment-400 dark:border-gray-600/40 rounded-xl flex items-center justify-center bg-parchment-300/50 dark:bg-gray-600/20 backdrop-blur">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-dashed border-parchment-400 dark:border-gray-600/50 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-parchment-500/40 dark:bg-parchment-400/30"></div>
          </div>
        </div>
      );
    }

    // Determine animation classes
    let animationClass = '';

    // Card play animation - cards slide in from their position
    if (positionIndex !== undefined) {
      const slideDirections = ['animate-slide-from-bottom', 'animate-slide-from-left', 'animate-slide-from-top', 'animate-slide-from-right'];
      animationClass = slideDirections[positionIndex];
    }

    // Trick collection animation - all cards move to winner
    if (trickCollectionAnimation && gameState.currentTrick.length === 4) {
      const winnerPosition = cardPositions.findIndex(cp => cp?.playerId === currentTrickWinnerId);
      if (winnerPosition !== -1 && positionIndex !== undefined) {
        const directions = ['bottom', 'left', 'top', 'right'];
        const winnerDir = directions[winnerPosition];
        animationClass = `animate-collect-to-${winnerDir}`;
      }
    }

    return (
      <div className={`inline-block transition-all duration-500 ${isWinner ? 'scale-110 ring-4 md:ring-6 ring-yellow-400 rounded-lg shadow-2xl shadow-yellow-400/50' : ''} ${animationClass}`}>
        <CardComponent card={tc.card} size="small" />
      </div>
    );
  };

  // Get color class for trump suit
  const getTrumpColor = (trump: CardColor | null): string => {
    if (!trump) return 'text-umber-900 dark:text-gray-100';
    switch (trump) {
      case 'red': return 'text-red-600';
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'brown': return 'text-amber-700';
      default: return 'text-umber-900 dark:text-gray-100';
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

  // Get betting team
  const bettingPlayer = gameState.highestBet ? gameState.players.find(p => p.id === gameState.highestBet?.playerId) : null;
  const bettingTeam = bettingPlayer?.teamId || null;

  return (
    <div className="h-screen md:min-h-screen bg-gradient-to-br from-parchment-400 to-parchment-500 dark:from-gray-800 dark:to-gray-900 flex flex-col overflow-hidden md:overflow-visible">
      {/* Score Board - Fixed height */}
      <div className="w-full mb-2 md:mb-4 flex-shrink-0 px-2 md:px-4 pt-2 md:pt-4">
        <div className="bg-umber-900/40 backdrop-blur-md rounded-2xl p-2 md:p-4 shadow-2xl border-2 border-parchment-400 dark:border-gray-600">
          <div className="flex justify-between items-center gap-2 md:gap-8">
            {/* Team 1 */}
            <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-2 md:p-4 border border-orange-200 relative overflow-visible">
              <h3 className="text-[10px] md:text-xs font-semibold text-orange-600/70 uppercase tracking-wider mb-1">Team 1</h3>
              <p className={`text-3xl md:text-5xl font-black text-orange-600 leading-none ${scoreAnimation.team1 ? 'animate-score-pop' : ''}`}>
                {gameState.teamScores.team1}
              </p>
              <p className="text-xs md:text-sm font-bold text-orange-500 mt-1 relative">
                {team1RoundScore >= 0 ? '+' : ''}{team1RoundScore} pts
                {floatingTrickPoints.team1 !== null && (
                  <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 animate-points-float-up z-50">
                    <span className={`px-2 py-1 rounded-full font-black text-white shadow-2xl border-2 text-xs ${
                      floatingTrickPoints.team1 >= 0
                        ? 'bg-green-500 border-green-300'
                        : 'bg-red-500 border-red-300'
                    }`}>
                      {floatingTrickPoints.team1 >= 0 ? '+' : ''}{floatingTrickPoints.team1}
                    </span>
                  </span>
                )}
              </p>
              {floatingPoints.team1 !== null && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 animate-points-float-up z-50">
                  <div className={`px-3 py-1.5 rounded-full font-black text-white shadow-2xl border-2 ${
                    floatingPoints.team1 >= 0
                      ? 'bg-green-500 border-green-300'
                      : 'bg-red-500 border-red-300'
                  }`}>
                    <span className="text-base md:text-xl">
                      {floatingPoints.team1 >= 0 ? '+' : ''}{floatingPoints.team1}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Center Info */}
            <div className="text-center flex-shrink-0 space-y-1.5 md:space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="bg-gradient-to-r from-parchment-200 to-parchment-100 dark:from-gray-700 dark:to-gray-800 px-2 md:px-3 py-1 rounded-lg border border-parchment-400 dark:border-gray-600">
                  <p className="text-[10px] md:text-xs font-bold text-umber-800 dark:text-gray-200">ROUND {gameState.roundNumber}</p>
                </div>
                {/* Sound Toggle Button - Compact */}
                <Tooltip content={soundEnabled ? 'Mute Sound (Volume Control)' : 'Unmute Sound'}>
                  <button
                    onClick={toggleSound}
                    className={`${
                      soundEnabled
                        ? 'bg-sapphire-500 hover:bg-sapphire-600'
                        : 'bg-parchment-400 hover:bg-parchment-50 dark:bg-gray-800'
                    } text-white px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg border border-parchment-400 dark:border-gray-600 focus:ring-2 focus:ring-sapphire-400 focus:outline-none`}
                    aria-label={soundEnabled ? 'Mute Sound' : 'Unmute Sound'}
                  >
                    {soundEnabled ? '🔊' : '🔇'}
                  </button>
                </Tooltip>
                {/* Dark Mode Toggle Button - Compact */}
                <Tooltip content={darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg border border-parchment-400 dark:border-gray-600 focus:ring-2 focus:ring-gray-500 focus:outline-none"
                    aria-label={darkMode ? "Mornin' J⋀ffre" : 'J⋀ffre after dark'}
                  >
                    {darkMode ? '☀️' : '🌙'}
                  </button>
                </Tooltip>
                {/* Autoplay Toggle Button - Compact */}
                {!isSpectator && onAutoplayToggle && (
                  <Tooltip content={autoplayEnabled ? 'Disable Autoplay (Bot Mode)' : 'Enable Autoplay (Bot Mode)'}>
                    <button
                      onClick={onAutoplayToggle}
                      className={`${
                        autoplayEnabled
                          ? 'bg-green-500 hover:bg-green-600 motion-safe:animate-pulse'
                          : 'bg-purple-500 hover:bg-purple-600'
                      } text-white px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg border border-parchment-400 dark:border-gray-600 focus:ring-2 focus:ring-green-400 focus:outline-none`}
                      aria-label={autoplayEnabled ? 'Disable Autoplay' : 'Enable Autoplay'}
                    >
                      {autoplayEnabled ? '🤖' : '🎮'}
                    </button>
                  </Tooltip>
                )}
                {/* Leave Game Button - Compact */}
                {onLeaveGame && (
                  <Tooltip content="Leave Game">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to leave the game?')) {
                          onLeaveGame();
                        }
                      }}
                      className="bg-crimson-600 hover:bg-crimson-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition-all duration-200 shadow-lg border border-parchment-400 dark:border-gray-600 focus:ring-2 focus:ring-crimson-400 focus:outline-none"
                      aria-label="Leave Game"
                    >
                      🚪
                    </button>
                  </Tooltip>
                )}
              </div>

              {/* Current Turn Indicator with Timeout */}
              <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-sm font-bold shadow-lg flex items-center justify-center gap-1 md:gap-2 border-2 min-h-[2.5rem] md:min-h-[3rem] ${
                gameState.currentTrick.length >= 4
                  ? 'bg-gradient-to-r from-umber-500 to-umber-600 text-parchment-50 border-umber-700'
                  : currentTurnTeam === 1
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-700'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-700'
              }`}>
                {gameState.currentTrick.length >= 4 ? (
                  <span className="whitespace-nowrap">Waiting for trick to end...</span>
                ) : (
                  <>
                    <span className="whitespace-nowrap">Waiting for: {currentTurnPlayer?.name}</span>
                    <TimeoutIndicator
                      duration={60000}
                      isActive={gameState.currentTrick.length < 4 && isCurrentTurn}
                      resetKey={gameState.currentPlayerIndex}
                      onTimeout={() => {
                        // Auto-enable autoplay when timeout expires (only for current player)
                        if (isCurrentTurn && onAutoplayToggle && !autoplayEnabled) {
                          console.log('Timeout expired - enabling autoplay');
                          onAutoplayToggle();
                        }
                      }}
                    />
                  </>
                )}
              </div>

              {/* Current Bet & Trump */}
              {gameState.highestBet && bettingTeam && (
                <div className={`backdrop-blur px-3 md:px-4 py-1 md:py-1.5 rounded-lg border-2 shadow-md ${
                  bettingTeam === 1
                    ? 'bg-orange-100/90 dark:bg-orange-900/70 border-orange-400 dark:border-orange-600'
                    : 'bg-purple-100/90 dark:bg-purple-900/70 border-purple-400 dark:border-purple-600'
                }`}>
                  <p className={`text-xs md:text-base font-black ${
                    bettingTeam === 1 ? 'text-orange-800 dark:text-orange-200' : 'text-purple-800 dark:text-purple-200'
                  }`}>
                    🎲 {gameState.highestBet.amount} {gameState.highestBet.withoutTrump ? 'NO TRUMP' : ''}
                  </p>
                </div>
              )}
              {/* Trump */}
              {gameState.trump && (
                <div className="bg-parchment-300/80 dark:bg-gray-800/80 backdrop-blur px-3 md:px-4 py-1 md:py-1.5 rounded-lg border-2 border-parchment-400 dark:border-gray-600">
                  <p className={`text-xs md:text-base font-bold ${getTrumpColor(gameState.trump)}`}>
                    <span className="capitalize">{!gameState.trump ? 'No Trump' : gameState.trump}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-2 md:p-4 text-right border border-purple-200 relative overflow-visible">
              <h3 className="text-[10px] md:text-xs font-semibold text-purple-600/70 uppercase tracking-wider mb-1">Team 2</h3>
              <p className={`text-3xl md:text-5xl font-black text-purple-600 leading-none ${scoreAnimation.team2 ? 'animate-score-pop' : ''}`}>
                {gameState.teamScores.team2}
              </p>
              <p className="text-xs md:text-sm font-bold text-purple-500 mt-1 relative">
                {team2RoundScore >= 0 ? '+' : ''}{team2RoundScore} pts
                {floatingTrickPoints.team2 !== null && (
                  <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 animate-points-float-up z-50">
                    <span className={`px-2 py-1 rounded-full font-black text-white shadow-2xl border-2 text-xs ${
                      floatingTrickPoints.team2 >= 0
                        ? 'bg-green-500 border-green-300'
                        : 'bg-red-500 border-red-300'
                    }`}>
                      {floatingTrickPoints.team2 >= 0 ? '+' : ''}{floatingTrickPoints.team2}
                    </span>
                  </span>
                )}
              </p>
              {floatingPoints.team2 !== null && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 animate-points-float-up z-50">
                  <div className={`px-3 py-1.5 rounded-full font-black text-white shadow-2xl border-2 ${
                    floatingPoints.team2 >= 0
                      ? 'bg-green-500 border-green-300'
                      : 'bg-red-500 border-red-300'
                  }`}>
                    <span className="text-base md:text-xl">
                      {floatingPoints.team2 >= 0 ? '+' : ''}{floatingPoints.team2}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Circular Card Layout - Takes remaining space */}
      <div className="mb-2 md:mb-4 relative px-2 md:px-4">
        <div className="bg-umber-900/40 backdrop-blur-xl rounded-3xl p-3 md:p-6 md:min-h-[400px] relative border-2 border-parchment-400 dark:border-gray-600 shadow-2xl">
          {/* Previous Trick Button - Top Left Corner */}
          {gameState.previousTrick && (
            <button
              onClick={() => setShowPreviousTrick(!showPreviousTrick)}
              className={`absolute top-4 left-4 z-50 ${
                showPreviousTrick
                  ? 'bg-gradient-to-br from-forest-600 to-forest-800 hover:from-forest-700 hover:to-forest-900 shadow-forest-500/50 border-forest-900'
                  : 'bg-gradient-to-br from-umber-400 to-umber-500 hover:from-umber-500 hover:to-umber-600 shadow-umber-400/50 border-umber-600 dark:border-gray-600'
              } active:scale-95 text-parchment-50 w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-lg md:text-sm font-bold transition-all duration-200 shadow-2xl hover:shadow-2xl flex items-center justify-center backdrop-blur-md border-2`}
              title={showPreviousTrick ? 'Current Trick' : 'Previous Trick'}
            >
              <span className="md:hidden">{showPreviousTrick ? '▶️' : '⏮️'}</span>
              <span className="hidden md:inline">{showPreviousTrick ? '▶️ Current' : '⏮️ Previous'}</span>
            </button>
          )}

          {/* Leaderboard Button - Top Right Corner */}
          <button
            onClick={() => setShowLeaderboard(true)}
            className="absolute top-4 right-4 z-50 bg-gradient-to-br from-umber-500 to-umber-700 hover:from-umber-600 hover:to-umber-800 active:scale-95 text-parchment-50 w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-lg md:text-sm font-bold transition-all duration-200 shadow-2xl hover:shadow-umber-500/50 flex items-center justify-center backdrop-blur-md border-2 border-umber-800"
            title="Leaderboard"
          >
            <span className="md:hidden">🏆</span>
            <span className="hidden md:inline">🏆 Leaderboard</span>
          </button>

          {/* Chat Button - Bottom Right Corner of Card Play Area */}
          {socket && gameId && !isSpectator && (
            <Tooltip content="Open Chat">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="absolute bottom-2 md:bottom-4 right-4 z-50 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 active:scale-95 text-parchment-50 w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-lg md:text-sm font-bold transition-all duration-200 shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center backdrop-blur-md border-2 border-blue-800 relative focus:ring-2 focus:ring-blue-400 focus:outline-none"
                aria-label="Open Chat"
              >
                <span className="md:hidden">💬</span>
                <span className="hidden md:inline">💬 Chat</span>
                {unreadChatCount > 0 && !chatOpen && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            </Tooltip>
          )}

          {showPreviousTrick && previousCardPositions ? (
            // Previous Trick View - Circular layout on both mobile and desktop
            <>
              {/* Modal overlay background */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-lg z-30" />

              {/* Title - always visible */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-40">
                <div className="text-yellow-400 text-sm md:text-2xl font-bold mb-1 md:mb-2">Previous Trick</div>
                <div className="text-white text-xs md:text-lg">
                  Winner: {gameState.previousTrick ? gameState.players.find(p => p.id === gameState.previousTrick?.winnerId)?.name : ''}
                </div>
                <div className="text-white/80 text-xs md:text-sm">
                  +{gameState.previousTrick?.points || 0} points
                </div>
              </div>

              {/* Circular Layout for both mobile and desktop - ANTI-CLOCKWISE */}
              <div className="relative h-[320px] md:h-[350px] z-40">
                {/* Bottom - You (position 0) */}
                <div className="absolute bottom-4 md:bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(previousCardPositions[0], previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId, 0)}
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
                  {renderCard(previousCardPositions[1], previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId, 1)}
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
                  {renderCard(previousCardPositions[2], previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId, 2)}
                </div>

                {/* Right - Previous player anti-clockwise (position 3) */}
                <div className="absolute top-1/2 right-2 md:right-0 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                  {renderCard(previousCardPositions[3], previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId, 3)}
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
              <div className="relative h-[320px] md:h-[350px]">
              

                {/* Bottom - You (position 0) */}
                <div className="absolute bottom-4 md:bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(cardPositions[0], cardPositions[0]?.playerId === currentTrickWinnerId, 0)}
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
                  {renderCard(cardPositions[1], cardPositions[1]?.playerId === currentTrickWinnerId, 1)}
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
                  {renderCard(cardPositions[2], cardPositions[2]?.playerId === currentTrickWinnerId, 2)}
                </div>

                {/* Right - Previous player anti-clockwise (position 3) */}
                <div className="absolute top-1/2 right-2 md:right-0 -translate-y-1/2 flex items-center gap-1.5 md:gap-2">
                  {renderCard(cardPositions[3], cardPositions[3]?.playerId === currentTrickWinnerId, 3)}
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
      <div className="md:max-w-6xl md:mx-auto px-2 md:px-6 pb-2 md:pb-6 z-10">
        {gameState.currentTrick.length === 0 && !showLeaderboard && !showPreviousTrick && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="bg-umber-800/90 rounded-2xl px-6 py-4 border-2 border-parchment-400 dark:border-gray-600 shadow-xl">
                    <p className="text-parchment-50 text-lg md:text-2xl font-semibold">{`Waiting for first card from ${gameState.players[gameState.currentPlayerIndex]?.name}...`}</p>
                    <div className="mt-2 flex gap-1 justify-center">
                      <div className="w-2 h-2 bg-parchment-300 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-parchment-300 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-parchment-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
        {/* Only show player hand section if spectator OR if player has cards */}
        {(isSpectator || (currentPlayer && currentPlayer.hand.length > 0)) && (
          <div className="bg-umber-900/40 backdrop-blur-xl rounded-2xl p-2 md:p-4 shadow-2xl border-2 border-parchment-400 dark:border-gray-600">
            {/* Card Hand - Hidden for spectators, horizontal scrollable on mobile for players */}
            {isSpectator ? (
              <div className="text-center py-8">
                <div className="inline-block bg-gradient-to-br from-parchment-100 to-parchment-50 px-6 py-4 rounded-xl border-2 border-parchment-400 dark:border-gray-600 shadow-lg">
                  <span className="text-umber-800 dark:text-gray-200 text-base font-semibold">🔒 Hands Hidden</span>
                  <p className="text-umber-600 dark:text-gray-400 text-sm mt-1.5">Spectator Mode</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto md:overflow-x-visible -mx-2 md:mx-0 px-2 md:px-0">
                  <div className="flex gap-2 md:gap-4 md:flex-wrap md:justify-center min-w-min">
                    {currentPlayer.hand.map((card, index) => {
                      const playable = isCardPlayable(card);
                      const isCardDealt = showDealingAnimation && index <= dealingCardIndex;
                      const dealDelay = index * 80; // Stagger animation for each card

                      return (
                        <div
                          key={`${card.color}-${card.value}-${index}`}
                          className={`relative flex-shrink-0 md:flex-shrink transition-all duration-200 ${
                            playable && isCurrentTurn ? 'hover:-translate-y-2' : ''
                          } ${showDealingAnimation && !isCardDealt ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
                          style={{
                            transition: `opacity 200ms ease-out ${dealDelay}ms, transform 200ms ease-out ${dealDelay}ms`
                          }}
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
        )}
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {socket && gameId && !isSpectator && onNewChatMessage && (
        <ChatPanel
          socket={socket}
          gameId={gameId}
          currentPlayerId={currentPlayerId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onNewMessage={onNewChatMessage}
        />
      )}
    </div>
  );
}
