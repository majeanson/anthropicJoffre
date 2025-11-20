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
import { ConfettiEffect } from '../ConfettiEffect';
import { TrickWinnerBanner } from '../TrickWinnerBanner';
import { Leaderboard } from '../Leaderboard';
import { UnifiedChat } from '../UnifiedChat';
import { GameHeader } from '../GameHeader';
import { ChatMessage } from '../../types/game';
import { GameState, Card as CardType } from '../../types/game';
import { sounds } from '../../utils/sounds';
import { ConnectionStats } from '../../hooks/useConnectionQuality';
import { useSettings } from '../../contexts/SettingsContext';
import { useChatNotifications } from '../../hooks/useChatNotifications';

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
  onSwapPosition?: (targetPlayerId: string) => void;
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
  onSwapPosition,
  socket,
  gameId,
  chatMessages = [],
  onNewChatMessage,
  connectionStats,
}: PlayingPhaseProps) {
  // ✅ CRITICAL: Check player existence BEFORE any hooks
  const playerLookup = isSpectator
    ? gameState.players[0]
    : gameState.players.find(p => p.id === currentPlayerId);


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
  const { animationsEnabled } = useSettings();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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

  // Sprint 1 Phase 3: Trick winner celebration state
  const [trickWinner, setTrickWinner] = useState<{
    playerName: string;
    points: number;
    teamId: 1 | 2;
    position: 'bottom' | 'left' | 'top' | 'right';
  } | null>(null);

  // Track autoplayEnabled with ref to avoid stale closure
  const autoplayEnabledRef = useRef(autoplayEnabled);
  useEffect(() => {
    autoplayEnabledRef.current = autoplayEnabled;
  }, [autoplayEnabled]);

  // Get current player
  const currentPlayer = useMemo(() => playerLookup, [playerLookup]);
  const isCurrentTurn = useMemo(
    () => gameState.players[gameState.currentPlayerIndex]?.id === currentPlayerId,
    [gameState.players, gameState.currentPlayerIndex, currentPlayerId]
  );
  const currentPlayerIndex = useMemo(
    () => gameState.players.findIndex(p => p.id === currentPlayerId),
    [gameState.players, currentPlayerId]
  );

  // Handler for autoplay timeout
  const handleAutoplayTimeout = useCallback(() => {
    if (isCurrentTurn && onAutoplayToggle && !autoplayEnabledRef.current) {
      onAutoplayToggle();
    }
  }, [isCurrentTurn, onAutoplayToggle]);

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

  // Win/loss sound effects
  useEffect(() => {
    if (!gameState.previousTrick) return;

    const winnerTeamId = gameState.players.find(
      p => p.id === gameState.previousTrick?.winnerId
    )?.teamId;
    const currentPlayerTeamId = currentPlayer?.teamId;

    if (winnerTeamId === currentPlayerTeamId) {
      sounds.trickWon();
    } else {
      sounds.trickCollect();
    }
  }, [gameState.previousTrick?.winnerId, currentPlayer?.teamId, gameState.players]);

  // "Your turn" notification
  useEffect(() => {
    if (!isCurrentTurn) return;

    const timeoutId = setTimeout(() => sounds.yourTurn(), 10000);
    return () => clearTimeout(timeoutId);
  }, [isCurrentTurn, gameState.currentPlayerIndex]);

  // Empty state message when no trick
  const EmptyTrickMessage = () => {
    if (gameState.currentTrick.length > 0) return null;

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
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

  return (
    <div className="h-screen md:min-h-screen bg-gradient-to-br from-parchment-400 to-parchment-500 dark:from-gray-800 dark:to-gray-900 flex flex-col overflow-hidden md:overflow-visible">
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
        onOpenChat={() => setChatOpen(!chatOpen)}
        unreadChatCount={unreadChatCount}
        connectionStats={connectionStats}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
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
            />
          </div>
        </div>

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
        />
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
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

      {trickWinner && (
        <>
          <ConfettiEffect
            position={trickWinner.position}
            teamColor={trickWinner.teamId === 1 ? 'orange' : 'purple'}
            duration={2000}
          />
          <TrickWinnerBanner
            playerName={trickWinner.playerName}
            points={trickWinner.points}
            position={trickWinner.position}
            teamColor={trickWinner.teamId === 1 ? 'orange' : 'purple'}
          />
        </>
      )}
    </div>
  );
}

export const PlayingPhase = PlayingPhaseComponent;
