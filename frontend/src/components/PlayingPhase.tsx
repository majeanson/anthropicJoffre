import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Socket } from 'socket.io-client';
import { Card as CardComponent } from './Card';
import { Leaderboard } from './Leaderboard';
import { TimeoutIndicator } from './TimeoutIndicator';
import { ChatPanel, ChatMessage } from './ChatPanel';
import { GameHeader } from './GameHeader';
import { GameState, Card as CardType, TrickCard, CardColor } from '../types/game';
import { sounds } from '../utils/sounds';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { ConnectionQualityBadge } from './ConnectionQualityIndicator';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
  isSpectator?: boolean;
  currentTrickWinnerId?: string | null;
  onLeaveGame?: () => void;
  onReplaceMeWithBot?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  onOpenBotManagement?: () => void;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  connectionStats?: ConnectionStats;
}

function PlayingPhaseComponent({ gameState, currentPlayerId, onPlayCard, isSpectator = false, currentTrickWinnerId = null, onLeaveGame, onReplaceMeWithBot, autoplayEnabled = false, onAutoplayToggle, onOpenBotManagement, socket, gameId, chatMessages = [], onNewChatMessage, connectionStats }: PlayingPhaseProps) {
  // ✅ CRITICAL: Check player existence BEFORE any hooks to prevent "Rendered fewer hooks than expected" error
  // Rules of Hooks: All hooks must be called in the same order on every render
  // Early returns before hooks are safe, but early returns AFTER hooks will cause React to crash
  const playerLookup = isSpectator ? gameState.players[0] : gameState.players.find(p => p.id === currentPlayerId);

  // Safety check: If player not found and not spectator, show error BEFORE calling any hooks
  if (!playerLookup && !isSpectator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-blue-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Player Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your player data could not be found in this game.
          </p>
          <button
            onClick={() => {
              // Force reload to lobby - handles cases where socket is disconnected
              sessionStorage.removeItem('gameSession');
              window.location.reload();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ✅ NOW it's safe to call hooks - all conditional returns are done
  const [showPreviousTrick, setShowPreviousTrick] = useState<boolean>(false);
  const [isPlayingCard, setIsPlayingCard] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showDealingAnimation, setShowDealingAnimation] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [dealingCardIndex, setDealingCardIndex] = useState<number>(0);
  const [trickCollectionAnimation, setTrickCollectionAnimation] = useState<boolean>(false);
  const [lastTrickLength, setLastTrickLength] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [floatingPoints, setFloatingPoints] = useState<{team1: number | null, team2: number | null}>({team1: null, team2: null});
  const [previousRoundScores, setPreviousRoundScores] = useState<{team1: number, team2: number} | null>(null);
  const [floatingTrickPoints, setFloatingTrickPoints] = useState<{team1: number | null, team2: number | null}>({team1: null, team2: null});
  const [cardInTransition, setCardInTransition] = useState<CardType | null>(null);

  // Sprint 6: Keyboard navigation state
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

  // Memoize expensive computations (now using the pre-validated playerLookup)
  const currentPlayer = useMemo(
    () => playerLookup,
    [playerLookup]
  );

  const isCurrentTurn = useMemo(
    () => !isSpectator && gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId,
    [isSpectator, gameState.players, gameState.currentPlayerIndex, currentPlayerId]
  );

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
  const toggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    sounds.setEnabled(newState);
    if (newState) {
      sounds.buttonClick(); // Play test sound when enabling
    }
  }, [soundEnabled]);

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

  // Clear card transition when trick is resolved or new round starts
  useEffect(() => {
    if (gameState.currentTrick.length === 0) {
      setCardInTransition(null);
    }
  }, [gameState.currentTrick.length, gameState.roundNumber]);

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
      }, 2000); // Match the backend 2-second delay
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
    const team1Delta = gameState.teamScores.team1 - (floatingPoints.team1 || 0);
    const team2Delta = gameState.teamScores.team2 - (floatingPoints.team2 || 0);

    if (team1Delta !== 0) {
      setFloatingPoints(prev => ({ ...prev, team1: team1Delta }));
      setTimeout(() => setFloatingPoints(prev => ({ ...prev, team1: null })), 2500);
    }

    if (team2Delta !== 0) {
      setFloatingPoints(prev => ({ ...prev, team2: team2Delta }));
      setTimeout(() => setFloatingPoints(prev => ({ ...prev, team2: null })), 2500);
    }
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

  // Sprint 6: Keyboard navigation for cards
  useEffect(() => {
    if (!isCurrentTurn || !currentPlayer) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const playableCardsIndexes = currentPlayer.hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => {
          // Check if card is playable using same logic as isCardPlayable
          if (gameState.currentTrick.length === 0) return true;
          const ledSuit = gameState.currentTrick[0].card.color;
          const hasLedSuit = currentPlayer.hand.some(c => c.color === ledSuit);
          if (hasLedSuit) return card.color === ledSuit;
          return true;
        })
        .map(({ index }) => index);

      if (playableCardsIndexes.length === 0) return;

      // Arrow keys: navigate through playable cards
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        sounds.cardDeal(); // Subtle sound effect for navigation

        if (selectedCardIndex === null) {
          // No selection yet - select first playable card
          setSelectedCardIndex(playableCardsIndexes[0]);
        } else {
          // Find current position in playable cards
          const currentPos = playableCardsIndexes.indexOf(selectedCardIndex);

          if (e.key === 'ArrowRight') {
            // Move right (next card)
            const nextPos = (currentPos + 1) % playableCardsIndexes.length;
            setSelectedCardIndex(playableCardsIndexes[nextPos]);
          } else {
            // Move left (previous card)
            const prevPos = (currentPos - 1 + playableCardsIndexes.length) % playableCardsIndexes.length;
            setSelectedCardIndex(playableCardsIndexes[prevPos]);
          }
        }
      }
      // Tab: cycle through playable cards only
      else if (e.key === 'Tab') {
        e.preventDefault();
        sounds.cardDeal();

        if (selectedCardIndex === null || playableCardsIndexes.length === 0) {
          setSelectedCardIndex(playableCardsIndexes[0]);
        } else {
          const currentPos = playableCardsIndexes.indexOf(selectedCardIndex);
          const nextPos = e.shiftKey
            ? (currentPos - 1 + playableCardsIndexes.length) % playableCardsIndexes.length
            : (currentPos + 1) % playableCardsIndexes.length;
          setSelectedCardIndex(playableCardsIndexes[nextPos]);
        }
      }
      // Enter or Space: play selected card
      else if ((e.key === 'Enter' || e.key === ' ') && selectedCardIndex !== null) {
        e.preventDefault();
        const card = currentPlayer.hand[selectedCardIndex];
        if (card && playableCardsIndexes.includes(selectedCardIndex)) {
          sounds.cardPlay(); // Play card sound
          handleCardClick(card);
          setSelectedCardIndex(null); // Reset selection after playing
        }
      }
      // Number keys 1-9: quick select card by position
      else if (e.key >= '1' && e.key <= '9') {
        const cardIndex = parseInt(e.key) - 1;
        if (cardIndex < currentPlayer.hand.length && playableCardsIndexes.includes(cardIndex)) {
          e.preventDefault();
          sounds.cardDeal();
          setSelectedCardIndex(cardIndex);
        }
      }
      // Escape: clear selection
      else if (e.key === 'Escape' && selectedCardIndex !== null) {
        e.preventDefault();
        setSelectedCardIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCurrentTurn, currentPlayer, selectedCardIndex, gameState.currentTrick]);

  // Reset selection when turn changes
  useEffect(() => {
    setSelectedCardIndex(null);
  }, [gameState.currentPlayerIndex]);

  // Find current player's index (currentPlayer is guaranteed to exist here due to early return at line 55)
  const currentPlayerIndex = gameState.players.findIndex(p => p.id === currentPlayerId);

  // Arrange cards in circular order relative to current player (bottom)
  // Positions: [bottom, left, top, right] - anti-clockwise
  const getCardPositions = (trick: TrickCard[]): (TrickCard | null)[] => {
    const positions: (TrickCard | null)[] = [null, null, null, null]; // bottom, left, top, right

    trick.forEach(tc => {
      // Use playerName for lookup (stable across reconnections)
      // Fall back to playerId for backwards compat
      const playerIndex = gameState.players.findIndex(p =>
        p.name === tc.playerName || p.id === tc.playerId
      );

      if (playerIndex !== -1) {
        // Calculate relative position (0=bottom, 1=left, 2=top, 3=right) - anti-clockwise
        // Map: player 0→bottom, 1→left, 2→top, 3→right
        const relativePos = (playerIndex - currentPlayerIndex + 4) % 4;
        positions[relativePos] = tc;
      }
    });

    return positions;
  };

  // Determine which cards are playable (memoized for performance)
  const playableCards = useMemo(() => {
    if (!isCurrentTurn || !currentPlayer) return [];

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
  }, [isCurrentTurn, currentPlayer, gameState.currentTrick]);

  const isCardPlayable = useCallback((card: CardType): boolean => {
    return playableCards.some(c => c.color === card.color && c.value === card.value);
  }, [playableCards]);

  const handleCardClick = useCallback((card: CardType) => {
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
    setCardInTransition(card); // Mark card as transitioning
    sounds.cardPlay(); // Play card play sound
    onPlayCard(card);

    // Clear the transition state after the board animation completes (400ms)
    setTimeout(() => {
      setCardInTransition(null);
    }, 450); // Slightly longer than the 400ms animation
  }, [isPlayingCard, isCurrentTurn, isCardPlayable, onPlayCard]);

  const cardPositions = getCardPositions(gameState.currentTrick);
  const previousCardPositions = gameState.previousTrick ? getCardPositions(gameState.previousTrick.trick) : null;

  // Get player names for each position
  const getPlayerName = (positionIndex: number): string => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    const player = gameState.players[playerIndex];
    if (!player) return '';
    if (player.isEmpty) {
      return player.emptySlotName || 'Empty Seat';
    }
    return player.name;
  };

  const getPlayerTeam = (positionIndex: number): 1 | 2 => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    return gameState.players[playerIndex]?.teamId || 1;
  };

  const isPlayerEmpty = (positionIndex: number): boolean => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    return gameState.players[playerIndex]?.isEmpty || false;
  };

  // Sprint 6: Bot indicator helpers
  const getPlayer = (positionIndex: number) => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    return gameState.players[playerIndex];
  };

  const isPlayerThinking = (positionIndex: number): boolean => {
    const playerIndex = (currentPlayerIndex + positionIndex) % 4;
    const player = gameState.players[playerIndex];
    // Bot is thinking if it's their turn and they haven't played yet
    return (
      player?.isBot === true &&
      gameState.currentPlayerIndex === playerIndex &&
      !gameState.currentTrick.some(tc => tc.playerId === player.id)
    );
  };

  const getBotDifficultyBadge = (positionIndex: number): JSX.Element | null => {
    const player = getPlayer(positionIndex);
    if (!player?.isBot || !player.botDifficulty) return null;

    const badges = {
      easy: { color: 'bg-green-500/90 text-white', icon: '🤖', label: 'Easy' },
      medium: { color: 'bg-yellow-500/90 text-white', icon: '🤖', label: 'Med' },
      hard: { color: 'bg-red-500/90 text-white', icon: '🤖', label: 'Hard' },
    };

    const badge = badges[player.botDifficulty];
    const isThinking = isPlayerThinking(positionIndex);

    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.color} ml-1`}
        title={`Bot (${badge.label} difficulty)${isThinking ? ' - Thinking...' : ''}`}
      >
        <span className={isThinking ? 'animate-pulse' : ''}>{badge.icon}</span>
        {isThinking && (
          <span className="flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        )}
      </span>
    );
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

    // Trick collection animation - all cards move to winner (PRIORITY)
    if (trickCollectionAnimation && gameState.currentTrick.length === 4) {
      const winnerPosition = cardPositions.findIndex(cp => cp?.playerId === currentTrickWinnerId);
      if (winnerPosition !== -1 && positionIndex !== undefined) {
        const directions = ['bottom', 'left', 'top', 'right'];
        const winnerDir = directions[winnerPosition];
        animationClass = `animate-collect-to-${winnerDir}`;
      }
    }
    // Card play animation - cards slide in from their position (ONLY when trick not complete)
    else if (positionIndex !== undefined && gameState.currentTrick.length < 4) {
      const slideDirections = ['animate-slide-from-bottom', 'animate-slide-from-left', 'animate-slide-from-top', 'animate-slide-from-right'];
      animationClass = slideDirections[positionIndex];
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
      <GameHeader
        gameId={gameState.id}
        roundNumber={gameState.roundNumber}
        team1Score={gameState.teamScores.team1}
        team2Score={gameState.teamScores.team2}
        onLeaveGame={onLeaveGame}
        onReplaceMeWithBot={onReplaceMeWithBot}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenBotManagement={onOpenBotManagement}
        botCount={gameState.players.filter(p => p.isBot).length}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        isSpectator={isSpectator}
        unreadChatCount={unreadChatCount}
        soundEnabled={soundEnabled}
        onSoundToggle={toggleSound}
      />

      {/* Connection Quality Indicator - Sprint 6 */}
      {connectionStats && (
        <div className="absolute top-20 right-4 z-10">
          <ConnectionQualityBadge stats={connectionStats} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden md:overflow-visible">
        {/* Score Board - Fixed height */}
      <div className="w-full mb-2 md:mb-4 flex-shrink-0 px-2 md:px-4 pt-2 md:pt-4">
        <div className="bg-umber-900/40 backdrop-blur-md rounded-2xl p-2 md:p-4 shadow-2xl border-2 border-parchment-400 dark:border-gray-600" data-testid="score-board">
          <div className="flex justify-between items-center gap-2 md:gap-8">
            {/* Team 1 */}
            <div className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-2 md:p-3 border border-orange-200 relative overflow-visible">
              <h3 className="text-xs md:text-sm font-semibold text-orange-600/70 uppercase tracking-wider mb-1">Team 1</h3>
              <p className="text-lg md:text-2xl font-bold text-orange-500 relative">
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
                    <span className="whitespace-nowrap" data-testid="current-turn-player">Waiting for: {currentTurnPlayer?.name}</span>
                    <TimeoutIndicator
                      duration={60000}
                      isActive={gameState.currentTrick.length < 4 && isCurrentTurn}
                      resetKey={gameState.currentPlayerIndex}
                      onTimeout={() => {
                        // Auto-enable autoplay when timeout expires (only for current player)
                        if (isCurrentTurn && onAutoplayToggle && !autoplayEnabled) {
                          onAutoplayToggle();
                        }
                      }}
                    />
                  </>
                )}
              </div>

              {/* Current Bet */}
              {gameState.highestBet && (
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
              {/* Trump (or NO TRUMP if withoutTrump bet) */}
              {gameState.highestBet && (
                <div className="bg-parchment-300/80 dark:bg-gray-800/80 backdrop-blur px-3 md:px-4 py-1 md:py-1.5 rounded-lg border-2 border-parchment-400 dark:border-gray-600">
                  {gameState.highestBet.withoutTrump ? (
                    <p className="text-xs md:text-base font-bold text-gray-500 dark:text-gray-400">
                      NO TRUMP
                    </p>
                  ) : (
                    <p className={`text-xs md:text-base font-bold ${getTrumpColor(gameState.trump)}`}>
                      <span className="capitalize">{gameState.trump}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-2 md:p-3 text-right border border-purple-200 relative overflow-visible">
              <h3 className="text-xs md:text-sm font-semibold text-purple-600/70 uppercase tracking-wider mb-1">Team 2</h3>
              <p className="text-lg md:text-2xl font-bold text-purple-500 relative">
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
              className={`absolute top-3 left-3 md:top-4 md:left-4 z-50 ${
                showPreviousTrick
                  ? 'bg-gradient-to-br from-forest-600 to-forest-800 hover:from-forest-700 hover:to-forest-900 shadow-forest-500/50 border-forest-900'
                  : 'bg-gradient-to-br from-umber-400 to-umber-500 hover:from-umber-500 hover:to-umber-600 shadow-umber-400/50 border-umber-600 dark:border-gray-600'
              } active:scale-95 text-parchment-50 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full md:rounded-lg text-base md:text-sm font-bold transition-all duration-200 shadow-2xl hover:shadow-2xl flex items-center justify-center backdrop-blur-md border-2`}
              title={showPreviousTrick ? 'Current Trick' : 'Previous Trick'}
            >
              <span className="md:hidden">{showPreviousTrick ? '▶️' : '⏮️'}</span>
              <span className="hidden md:inline">{showPreviousTrick ? '▶️ Current' : '⏮️ Previous'}</span>
            </button>
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
              <div className="relative h-[340px] md:h-[380px] z-40">
                {/* Bottom - You (position 0) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
                  {renderCard(previousCardPositions[0], previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId, 0)}
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(0)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(0) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[0]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(0) ? '💺 ' : ''}{getPlayerName(0)} (You)
                      {getBotDifficultyBadge(0)}
                    </span>
                  </div>
                </div>

                {/* Left - Next player anti-clockwise (position 1) */}
                <div className="absolute top-1/2 left-2 md:left-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(previousCardPositions[1], previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId, 1)}
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(1)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(1) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[1]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(1) ? '💺 ' : ''}{getPlayerName(1)}
                      {getBotDifficultyBadge(1)}
                    </span>
                  </div>
                </div>

                {/* Top - Opposite player (position 2) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(2)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(2) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(2) ? '💺 ' : ''}{getPlayerName(2)}
                      {getBotDifficultyBadge(2)}
                    </span>
                  </div>
                  {renderCard(previousCardPositions[2], previousCardPositions[2]?.playerId === gameState.previousTrick?.winnerId, 2)}
                </div>

                {/* Right - Previous player anti-clockwise (position 3) */}
                <div className="absolute top-1/2 right-2 md:right-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(previousCardPositions[3], previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId, 3)}
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(3)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(3) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${previousCardPositions[3]?.playerId === gameState.previousTrick?.winnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(3) ? '💺 ' : ''}{getPlayerName(3)}
                      {getBotDifficultyBadge(3)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Current Trick View - Circular layout on both mobile and desktop - ANTI-CLOCKWISE
            <>
              {/* Circular Layout for both mobile and desktop */}
              <div className="relative h-[340px] md:h-[380px]" data-testid="trick-area">


                {/* Bottom - You (position 0) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
                  {renderCard(cardPositions[0], cardPositions[0]?.playerId === currentTrickWinnerId, 0)}
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(0)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(0) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[0]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(0) ? '💺 ' : ''}{getPlayerName(0)} (You)
                      {getBotDifficultyBadge(0)}
                    </span>
                  </div>
                </div>

                {/* Left - Next player anti-clockwise (position 1) */}
                <div className="absolute top-1/2 left-2 md:left-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(cardPositions[1], cardPositions[1]?.playerId === currentTrickWinnerId, 1)}
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(1)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(1) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[1]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(1) ? '💺 ' : ''}{getPlayerName(1)}
                      {getBotDifficultyBadge(1)}
                    </span>
                  </div>
                </div>

                {/* Top - Opposite player (position 2) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 md:gap-1.5">
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(2)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(2) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[2]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(2) ? '💺 ' : ''}{getPlayerName(2)}
                      {getBotDifficultyBadge(2)}
                    </span>
                  </div>
                  {renderCard(cardPositions[2], cardPositions[2]?.playerId === currentTrickWinnerId, 2)}
                </div>

                {/* Right - Previous player anti-clockwise (position 3) */}
                <div className="absolute top-1/2 right-2 md:right-0 -translate-y-1/2 flex flex-col items-center gap-1.5 md:gap-2">
                  {renderCard(cardPositions[3], cardPositions[3]?.playerId === currentTrickWinnerId, 3)}
                  <div className={`max-w-[120px] truncate px-3 md:px-4 py-1 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-lg ${
                    isPlayerEmpty(3)
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600 text-gray-200 border-2 border-dashed border-gray-500'
                      : getPlayerTeam(3) === 1
                        ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                  } ${cardPositions[3]?.playerId === currentTrickWinnerId ? 'ring-2 md:ring-3 ring-yellow-400' : ''}`}>
                    <span className="flex items-center justify-center">
                      {isPlayerEmpty(3) ? '💺 ' : ''}{getPlayerName(3)}
                      {getBotDifficultyBadge(3)}
                    </span>
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
                  <div className="bg-umber-800/90 rounded-2xl px-6 py-4 border-2 border-parchment-400 dark:border-gray-600 shadow-xl" data-testid="waiting-first-card">
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
          <div className="bg-umber-900/40 backdrop-blur-xl rounded-2xl p-2 md:p-4 shadow-2xl border-2 border-parchment-400 dark:border-gray-600" data-testid="player-hand">
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
                    {(() => {
                      // Create combined hand: actual hand + card in transition (if it's no longer in hand)
                      const displayHand = [...currentPlayer!.hand];

                      // If a card is in transition and not in the current hand, add it temporarily
                      if (cardInTransition && !currentPlayer!.hand.some(c => c.color === cardInTransition.color && c.value === cardInTransition.value)) {
                        displayHand.push(cardInTransition);
                      }

                      return displayHand.map((card, index) => {
                        const playable = isCardPlayable(card);
                        const isCardDealt = showDealingAnimation && index <= dealingCardIndex;
                        const dealDelay = index * 80; // Stagger animation for each card
                        const isTransitioning = cardInTransition && card.color === cardInTransition.color && card.value === cardInTransition.value;
                        const isSelected = selectedCardIndex === index; // Sprint 6: Keyboard selection

                        return (
                          <div
                            key={`${card.color}-${card.value}-${index}`}
                            className={`relative flex-shrink-0 md:flex-shrink transition-all duration-200 ${
                              playable && isCurrentTurn ? 'hover:-translate-y-2' : ''
                            } ${showDealingAnimation && !isCardDealt ? 'opacity-0 scale-50' : isTransitioning ? 'opacity-0' : 'opacity-100 scale-100'}
                            ${isSelected ? '-translate-y-4 scale-110' : ''}`}
                            style={{
                              transition: isTransitioning
                                ? 'opacity 400ms ease-out, transform 400ms ease-out'
                                : `opacity 200ms ease-out ${dealDelay}ms, transform 200ms ease-out ${dealDelay}ms`
                            }}
                          >
                            {/* Sprint 6: Selection indicator ring */}
                            {isSelected && (
                              <div className="absolute -inset-2 rounded-lg ring-4 ring-blue-500 dark:ring-blue-400 animate-pulse pointer-events-none" />
                            )}
                            <CardComponent
                              card={card}
                              size="small"
                              onClick={() => handleCardClick(card)}
                              disabled={!isCurrentTurn || !playable || !!isTransitioning}
                            />
                          </div>
                        );
                      });
                    })()}
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
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
// Only re-render when game state, player ID, or critical props change
export const PlayingPhase = memo(PlayingPhaseComponent);
