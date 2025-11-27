/**
 * PlayingPhase Component - Main Orchestrator
 * Coordinates all sub-components: ScoreBoard, TrickArea, PlayerHand
 * Manages socket listeners, sound effects, and overlay effects
 *
 * Refactored from PlayingPhase.tsx (1,191 lines → ~400 lines)
 * Split into focused components for better maintainability
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { CardPlayEffect } from '../CardPlayEffect';
import { TrickWinnerBanner } from '../TrickWinnerBanner';
import { Leaderboard } from '../Leaderboard';
import { UnifiedChat } from '../UnifiedChat';
import { GameHeader } from '../GameHeader';
import { HowToPlay } from '../HowToPlay';
import { ChatMessage } from '../../types/game';
import { GameState, Card as CardType } from '../../types/game';
import { sounds } from '../../utils/sounds';
import { ConnectionStats } from '../../hooks/useConnectionQuality';
import { useSettings } from '../../contexts/SettingsContext';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { MoveSuggestionPanel } from '../MoveSuggestionPanel';
import { suggestMove } from '../../utils/moveSuggestion';

// Extracted components
import { ScoreBoard } from './ScoreBoard';
import { TrickArea } from './TrickArea';
import { PlayerHand } from './PlayerHand';

interface PlayingPhaseProps {
  gameState: GameState;
  currentPlayerId: string;
  onPlayCard: (card: CardType) => void;
  isSpectator?: boolean;
  currentTrickWinnerId?: string | null;
  onLeaveGame?: () => void;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  onOpenBotManagement?: () => void;
  onOpenAchievements?: () => void;
  onOpenFriends?: () => void;
  pendingFriendRequestsCount?: number; // Sprint 16 - Friend requests badge
  onSwapPosition?: (targetPlayerId: string) => void;
  onClickPlayer?: (playerName: string) => void;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  connectionStats?: ConnectionStats;
}

function PlayingPhaseComponent({
  gameState,
  currentPlayerId,
  onPlayCard,
  isSpectator = false,
  currentTrickWinnerId = null,
  onLeaveGame,
  autoplayEnabled = false,
  onAutoplayToggle,
  soundEnabled = true,
  onSoundToggle,
  onOpenBotManagement,
  onOpenAchievements,
  onOpenFriends,
  pendingFriendRequestsCount = 0,
  onSwapPosition,
  onClickPlayer,
  socket,
  gameId,
  chatMessages = [],
  onNewChatMessage,
  connectionStats,
}: PlayingPhaseProps) {
  // ✅ CRITICAL: Check player existence BEFORE any hooks
  // Use player NAME as stable identifier (socket.id changes on reconnect)
  const playerLookup = isSpectator
    ? gameState.players[0]
    : gameState.players.find(p => p.name === currentPlayerId || p.id === currentPlayerId);


  // Safety check: If player not found and not spectator, show error BEFORE calling any hooks
  if (!playerLookup && !isSpectator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-blue-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Player Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Your player data could not be found in this game.
          </p>
          <button
            onClick={() => {
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

  // ✅ NOW it's safe to call hooks
  const { animationsEnabled, beginnerMode } = useSettings();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage
  });

  // Sprint 1 Phase 2: Card play effect state
  const [playEffect, setPlayEffect] = useState<{
    card: CardType;
    position: { x: number; y: number };
  } | null>(null);

  // Card queue state - allows pre-selecting a card to auto-play when turn comes
  const [queuedCard, setQueuedCard] = useState<CardType | null>(null);

  // Sprint 1 Phase 3: Trick winner celebration state
  const [trickWinner, setTrickWinner] = useState<{
    playerName: string;
    points: number;
    teamId: 1 | 2;
    position: 'bottom' | 'left' | 'top' | 'right';
  } | null>(null);

  // IMPROVEMENT #11: Bot thinking - store reasons for ALL bots in current trick
  const [botThinkingMap, setBotThinkingMap] = useState<Map<string, string>>(new Map());
  const [openThinkingButtons, setOpenThinkingButtons] = useState<Set<string>>(new Set());
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  // Track autoplayEnabled with ref to avoid stale closure
  const autoplayEnabledRef = useRef(autoplayEnabled);
  useEffect(() => {
    autoplayEnabledRef.current = autoplayEnabled;
  }, [autoplayEnabled]);

  // Track which trick we've already played sound for (prevents duplicate sounds)
  const lastSoundedTrickWinnerRef = useRef<string | null>(null);

  // Get current player
  const currentPlayer = useMemo(() => playerLookup, [playerLookup]);
  const isCurrentTurn = useMemo(
    () => {
      const turnPlayer = gameState.players[gameState.currentPlayerIndex];
      return turnPlayer?.name === currentPlayerId || turnPlayer?.id === currentPlayerId;
    },
    [gameState.players, gameState.currentPlayerIndex, currentPlayerId]
  );
  const currentPlayerIndex = useMemo(
    () => gameState.players.findIndex(p => p.name === currentPlayerId || p.id === currentPlayerId),
    [gameState.players, currentPlayerId]
  );

  // Handler for autoplay timeout
  const handleAutoplayTimeout = useCallback(() => {
    if (isCurrentTurn && onAutoplayToggle && !autoplayEnabledRef.current) {
      onAutoplayToggle();
    }
  }, [isCurrentTurn, onAutoplayToggle]);

  // Toggle handlers for bot thinking and move suggestions
  const toggleBotThinking = useCallback((botName: string) => {
    setOpenThinkingButtons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(botName)) {
        newSet.delete(botName);
      } else {
        newSet.add(botName);
      }
      return newSet;
    });
  }, []);

  const toggleSuggestion = useCallback(() => {
    setSuggestionOpen(prev => !prev);
  }, []);

  // Trick winner listener
  useEffect(() => {
    if (!socket) return;

    const handleTrickResolved = (data: {
      winnerId: string;
      points: number;
      gameState: GameState;
    }) => {
      const winner = data.gameState.players.find(p => p.id === data.winnerId);
      if (!winner) return;

      // Map player position to direction
      const winnerIndex = data.gameState.players.findIndex(p => p.id === data.winnerId);
      const relativePosition = (winnerIndex - currentPlayerIndex + 4) % 4;
      const positions: ('bottom' | 'left' | 'top' | 'right')[] = [
        'bottom',
        'left',
        'top',
        'right',
      ];

      setTrickWinner({
        playerName: winner.name,
        points: data.points,
        teamId: winner.teamId,
        position: positions[relativePosition],
      });

      // Auto-clear after 2s
      setTimeout(() => setTrickWinner(null), 2000);
    };

    socket.on('trick_resolved', handleTrickResolved);

    return () => {
      socket.off('trick_resolved', handleTrickResolved);
    };
  }, [socket, currentPlayerIndex]);

  // Win/loss sound effects - use ref to prevent duplicate sounds
  useEffect(() => {
    if (!gameState.previousTrick) return;

    const winnerId = gameState.previousTrick.winnerId;

    // Skip if we already played sound for this trick winner
    if (lastSoundedTrickWinnerRef.current === winnerId) return;
    lastSoundedTrickWinnerRef.current = winnerId;

    const winnerTeamId = gameState.players.find(
      p => p.id === winnerId
    )?.teamId;
    const currentPlayerTeamId = currentPlayer?.teamId;

    if (winnerTeamId === currentPlayerTeamId) {
      sounds.trickWon();
    } else {
      sounds.trickCollect();
    }
  }, [gameState.previousTrick, currentPlayer?.teamId, gameState.players]);

  // IMPROVEMENT #11: Generate thinking reasons for ALL bots in current trick
  useEffect(() => {
    const newMap = new Map<string, string>();

    gameState.currentTrick.forEach((play, index) => {
      const player = gameState.players.find(p => p.name === play.playerName);
      if (!player?.isBot) return; // Only for bots

      // Generate helpful message based on the card played
      const card = play.card;
      const trickLength = index + 1;
      let action = '';

      if (card.color === 'red' && card.value === 0) {
        action = 'Playing Red 0 for +5 bonus points!';
      } else if (card.color === 'brown' && card.value === 0) {
        action = 'Dumping Brown 0 (-2 penalty)';
      } else if (card.value === 7) {
        if (trickLength === 1) {
          action = `Leading with 7 ${card.color} to control the trick`;
        } else {
          action = `Playing 7 ${card.color} to secure the win`;
        }
      } else if (trickLength === 1) {
        action = `Leading with ${card.value} ${card.color}`;
      } else if (card.color === gameState.trump) {
        action = `Playing trump (${card.value} ${card.color})`;
      } else {
        action = `Playing ${card.value} ${card.color}`;
      }

      newMap.set(player.name, action);
    });

    setBotThinkingMap(newMap);

    // Clear open buttons when trick changes (new trick starts)
    if (gameState.currentTrick.length === 0) {
      setOpenThinkingButtons(new Set());
      setSuggestionOpen(false);
    }
  }, [gameState.currentTrick, gameState.players, gameState.trump]);

  // "Your turn" notification
  useEffect(() => {
    if (!isCurrentTurn) return;

    const timeoutId = setTimeout(() => sounds.yourTurn(), 10000);
    return () => clearTimeout(timeoutId);
  }, [isCurrentTurn, gameState.currentPlayerIndex]);

  // Auto-play queued card when turn comes
  useEffect(() => {
    if (!isCurrentTurn || !queuedCard || !currentPlayer) return;

    // Check if queued card is still in hand
    const cardInHand = currentPlayer.hand.some(
      c => c.color === queuedCard.color && c.value === queuedCard.value
    );
    if (!cardInHand) {
      setQueuedCard(null);
      return;
    }

    // Check if queued card is valid to play (suit-following rules)
    let isValidToPlay = true;
    if (gameState.currentTrick.length > 0) {
      const ledSuit = gameState.currentTrick[0].card.color;
      const hasLedSuit = currentPlayer.hand.some(c => c.color === ledSuit);
      if (hasLedSuit && queuedCard.color !== ledSuit) {
        // Must follow suit but queued card doesn't match
        isValidToPlay = false;
      }
    }

    if (!isValidToPlay) {
      setQueuedCard(null);
      return;
    }

    // Auto-play the queued card with a small delay for UX
    const timeoutId = setTimeout(() => {
      sounds.cardConfirm(queuedCard.value);
      onPlayCard(queuedCard);
      setQueuedCard(null);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [isCurrentTurn, queuedCard, currentPlayer, gameState.currentTrick, onPlayCard]);

  // Clear queue on new round
  useEffect(() => {
    setQueuedCard(null);
  }, [gameState.roundNumber]);

  // Handler to queue/unqueue a card
  const handleQueueCard = useCallback((card: CardType | null) => {
    if (!card) {
      setQueuedCard(null);
      return;
    }
    // Toggle queue if same card clicked
    if (queuedCard && queuedCard.color === card.color && queuedCard.value === card.value) {
      setQueuedCard(null);
    } else {
      setQueuedCard(card);
      sounds.cardDeal(); // Subtle feedback sound
    }
  }, [queuedCard]);

  // Empty state message when no trick
  const EmptyTrickMessage = () => {
    if (gameState.currentTrick.length > 0) return null;

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-50">
        {/* Spotlight effect for current player's turn */}
        {isCurrentTurn && (
          <div className="absolute inset-0 -m-12 rounded-full bg-gradient-radial from-blue-400/30 via-blue-400/10 to-transparent motion-safe:animate-spotlight motion-reduce:opacity-30 pointer-events-none" />
        )}
        <div
          className={`relative bg-umber-800/90 rounded-2xl px-6 py-4 lg:px-8 lg:py-6 shadow-xl transition-all ${
            isCurrentTurn
              ? 'border-4 border-blue-500 motion-safe:animate-turn-pulse'
              : 'border-2 border-parchment-400 dark:border-gray-600'
          }`}
          data-testid="turn-indicator"
        >
          {isCurrentTurn && (
            <div className="mb-2">
              <span className="text-4xl motion-safe:animate-arrow-bounce motion-reduce:inline">
                👇
              </span>
            </div>
          )}
          <p
            className="text-parchment-50 text-lg md:text-2xl lg:text-3xl font-semibold"
            data-testid="current-turn-player"
          >
            {isCurrentTurn
              ? 'Your Turn - Play a card!'
              : `Waiting for first card from ${
                  gameState.players[gameState.currentPlayerIndex]?.name
                }...`}
          </p>
          <div className="mt-2 flex gap-1 justify-center">
            <div className="w-2 h-2 lg:w-3 lg:h-3 bg-parchment-300 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 lg:w-3 lg:h-3 bg-parchment-300 rounded-full animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className="w-2 h-2 lg:w-3 lg:h-3 bg-parchment-300 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Get current move suggestion for human player
  const currentSuggestion = useMemo(() => {
    if (!isCurrentTurn || isSpectator || gameState.phase !== 'playing') return null;
    const suggestion = suggestMove(gameState, currentPlayerId);
    return suggestion;
  }, [isCurrentTurn, isSpectator, gameState, currentPlayerId]);

  return (
    <div className="h-screen-safe md:min-h-screen-safe bg-gradient-to-br from-parchment-400 to-parchment-500 dark:from-gray-800 dark:to-gray-900 flex flex-col overflow-y-auto overflow-x-hidden md:overflow-visible">
      <GameHeader
        gameId={gameId || ''}
        roundNumber={gameState.roundNumber}
        team1Score={gameState.teamScores.team1}
        team2Score={gameState.teamScores.team2}
        onLeaveGame={onLeaveGame}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenBotManagement={onOpenBotManagement}
        onOpenAchievements={onOpenAchievements}
        onOpenFriends={onOpenFriends}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        onOpenRules={() => setShowHowToPlay(true)}
        onOpenChat={() => setChatOpen(!chatOpen)}
        unreadChatCount={unreadChatCount}
        connectionStats={connectionStats}
      />

      <div className="flex flex-col flex-1 overflow-visible relative">
        <ScoreBoard
          gameState={gameState}
          isCurrentTurn={isCurrentTurn}
          onAutoplayTimeout={handleAutoplayTimeout}
        />

        <div className="mb-2 md:mb-4 lg:mb-6 relative px-2 md:px-4 lg:px-6 flex-1">
          <div className="bg-umber-900/40 backdrop-blur-xl rounded-3xl p-3 md:p-6 lg:p-8 md:min-h-[400px] lg:min-h-[450px] relative border-2 border-parchment-400 dark:border-gray-600 shadow-2xl h-full flex flex-col">
            <EmptyTrickMessage />

            <TrickArea
              gameState={gameState}
              currentPlayerId={currentPlayerId}
              currentPlayerIndex={currentPlayerIndex}
              currentTrickWinnerId={currentTrickWinnerId}
              isSpectator={isSpectator}
              onSwapPosition={onSwapPosition}
              trickWinner={trickWinner}
              onClickPlayer={onClickPlayer}
              botThinkingMap={botThinkingMap}
              openThinkingButtons={openThinkingButtons}
              onToggleBotThinking={toggleBotThinking}
              currentSuggestion={currentSuggestion}
              suggestionOpen={suggestionOpen}
              onToggleSuggestion={toggleSuggestion}
              beginnerMode={beginnerMode}
              isCurrentTurn={isCurrentTurn}
            />

            {/* Beginner Mode: Move Suggestion - Overlaid above bottom of playing field */}
            {beginnerMode && !isSpectator && isCurrentTurn && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 pointer-events-none">
                <div className="opacity-95 pointer-events-auto">
                  <MoveSuggestionPanel
                    gameState={gameState}
                    currentPlayerId={currentPlayerId}
                    isMyTurn={isCurrentTurn}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player Hand */}
        <PlayerHand
          hand={currentPlayer?.hand || []}
          isCurrentTurn={isCurrentTurn}
          currentTrick={gameState.currentTrick}
          currentPlayerIndex={gameState.currentPlayerIndex}
          roundNumber={gameState.roundNumber}
          animationsEnabled={animationsEnabled}
          isSpectator={isSpectator}
          onPlayCard={onPlayCard}
          onSetPlayEffect={setPlayEffect}
          queuedCard={queuedCard}
          onQueueCard={handleQueueCard}
        />
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* How to Play Modal */}
      <HowToPlay
        isModal={true}
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* Chat Panel */}
      <UnifiedChat
        mode="panel"
        context="game"
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        socket={socket || null}
        gameId={gameId}
        currentPlayerId={currentPlayerId}
        messages={chatMessages}
        onSendMessage={(message: string) => {
          if (socket) {
            socket.emit('send_game_chat', {
              gameId,
              message: message.trim(),
            });
          }
        }}
      />

      {/* Overlay Effects */}
      {playEffect && (
        <CardPlayEffect
          card={playEffect.card}
          position={playEffect.position}
          onComplete={() => setPlayEffect(null)}
        />
      )}

      {/* Winner Banner - fixed at bottom */}
      {trickWinner && (
        <TrickWinnerBanner
          playerName={trickWinner.playerName}
          points={trickWinner.points}
          position={trickWinner.position}
          teamColor={trickWinner.teamId === 1 ? 'orange' : 'purple'}
        />
      )}
    </div>
  );
}

export const PlayingPhase = PlayingPhaseComponent;
