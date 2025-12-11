/**
 * PlayingPhase Component - Multi-Skin Edition
 *
 * Main orchestrator for the playing phase with proper CSS variable usage.
 * Coordinates: ScoreBoard, TrickArea, PlayerHand
 *
 * Refactored to use extracted hooks and components:
 * - TurnIndicator: Turn state display
 * - useCardQueue: Card queuing logic
 * - useTrickState: Trick collection state
 * - useBotThinking: Bot explanations
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CardPlayEffect } from '../CardPlayEffect';
import { TrickWinnerBanner } from '../TrickWinnerBanner';
import { Leaderboard } from '../Leaderboard';
import { UnifiedChat } from '../UnifiedChat';
import { GameHeader } from '../GameHeader';
import { HowToPlay } from '../HowToPlay';
import SideBetsPanel from '../SideBetsPanel';
import { SideBetToast } from '../SideBetToast';
import { Card as CardType, GameState } from '../../types/game';
import { sounds } from '../../utils/sounds';
import type { AchievementProgress } from '../../types/achievements';
import { useSettings } from '../../contexts/SettingsContext';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { useAchievementCache } from '../../hooks/useAchievementCache';
import { suggestMove } from '../../utils/moveSuggestion';
import { Button } from '../ui/Button';

// Extracted components and hooks
import { ScoreBoard } from './ScoreBoard';
import { TrickArea } from './TrickArea';
import { PlayerHand } from './PlayerHand';
import { TurnIndicator } from './TurnIndicator';
import { useCardQueue } from './useCardQueue';
import { useTrickState } from './useTrickState';
import { useBotThinking } from './useBotThinking';
import type { PlayingPhaseProps } from './types';

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
  onClickPlayer,
  socket,
  gameId,
  chatMessages = [],
  onNewChatMessage,
  connectionStats,
  isVoiceEnabled = false,
  isVoiceMuted = false,
  voiceParticipants = [],
  voiceError,
  onVoiceToggle,
  onVoiceMuteToggle,
}: PlayingPhaseProps) {
  // CRITICAL: Check player existence BEFORE any hooks
  const playerLookup = isSpectator
    ? gameState.players[0]
    : gameState.players.find((p) => p.name === currentPlayerId || p.id === currentPlayerId);

  // Safety check: If player not found and not spectator, show error BEFORE calling any hooks
  if (!playerLookup && !isSpectator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-skin-primary">
        <div className="p-8 rounded-[var(--radius-xl)] text-center border-2 bg-skin-secondary border-skin-accent shadow-[var(--shadow-glow),var(--shadow-lg)]">
          <h2 className="text-2xl font-display uppercase tracking-wider mb-4 text-skin-primary">
            Player Not Found
          </h2>
          <p className="font-body mb-6 text-skin-muted">
            Your player data could not be found in this game.
          </p>
          <Button
            onClick={() => {
              sessionStorage.removeItem('gameSession');
              window.location.reload();
            }}
            variant="primary"
            size="lg"
          >
            Return to Lobby
          </Button>
        </div>
      </div>
    );
  }

  // NOW it's safe to call hooks
  const { animationsEnabled, beginnerMode } = useSettings();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [sideBetsOpen, setSideBetsOpen] = useState(false);
  const [openSideBetsCount, setOpenSideBetsCount] = useState(0);
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage,
  });

  // Card play effect state
  const [playEffect, setPlayEffect] = useState<{
    card: CardType;
    position: { x: number; y: number };
  } | null>(null);

  // Achievement badge cache for player cards
  const { getCachedBadges, fetchAchievements } = useAchievementCache(socket ?? null);
  const [playerAchievements, setPlayerAchievements] = useState<Map<string, AchievementProgress[]>>(
    new Map()
  );

  // Track autoplayEnabled with ref
  const autoplayEnabledRef = useRef(autoplayEnabled);
  useEffect(() => {
    autoplayEnabledRef.current = autoplayEnabled;
  }, [autoplayEnabled]);

  // Get current player info
  const currentPlayer = useMemo(() => playerLookup, [playerLookup]);
  const isCurrentTurn = useMemo(() => {
    const turnPlayer = gameState.players[gameState.currentPlayerIndex];
    return turnPlayer?.name === currentPlayerId || turnPlayer?.id === currentPlayerId;
  }, [gameState.players, gameState.currentPlayerIndex, currentPlayerId]);
  const currentPlayerIndex = useMemo(
    () =>
      gameState.players.findIndex((p) => p.name === currentPlayerId || p.id === currentPlayerId),
    [gameState.players, currentPlayerId]
  );

  // Use extracted hooks
  const { isTrickCollecting, lastTrickWinnerName, trickWinner, setTrickWinner } = useTrickState({
    currentTrick: gameState.currentTrick,
    previousTrick: gameState.previousTrick,
    currentTrickWinnerId,
    players: gameState.players,
    currentPlayerTeamId: currentPlayer?.teamId,
  });

  const { botThinkingMap, openThinkingButtons, toggleBotThinking } = useBotThinking({
    currentTrick: gameState.currentTrick,
    players: gameState.players,
    trump: gameState.trump,
  });

  const { queuedCard, handleQueueCard } = useCardQueue({
    isCurrentTurn,
    isTrickCollecting,
    currentPlayer,
    currentTrick: gameState.currentTrick,
    previousTrick: gameState.previousTrick,
    roundNumber: gameState.roundNumber,
    onPlayCard,
  });

  // Scroll to top when entering playing phase
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handler for autoplay timeout
  const handleAutoplayTimeout = useCallback(() => {
    if (isCurrentTurn && onAutoplayToggle && !autoplayEnabledRef.current) {
      onAutoplayToggle();
    }
  }, [isCurrentTurn, onAutoplayToggle]);

  const toggleSuggestion = useCallback(() => {
    setSuggestionOpen((prev) => !prev);
  }, []);

  // Fetch achievement badges for human players
  useEffect(() => {
    if (!socket) return;

    const humanPlayers = gameState.players.filter((p) => !p.isBot && !p.isEmpty);

    // Fetch achievements for each human player
    humanPlayers.forEach(async (player) => {
      // Check cache first
      const cached = getCachedBadges(player.name);
      if (cached.length > 0) {
        setPlayerAchievements((prev) => {
          const next = new Map(prev);
          next.set(player.name, cached);
          return next;
        });
      } else {
        // Fetch from server
        const result = await fetchAchievements(player.name);
        if (result?.topBadges) {
          setPlayerAchievements((prev) => {
            const next = new Map(prev);
            next.set(player.name, result.topBadges);
            return next;
          });
        }
      }
    });
  }, [socket, gameState.players, getCachedBadges, fetchAchievements]);

  // Trick winner listener
  useEffect(() => {
    if (!socket) return;

    const handleTrickResolved = (data: {
      winnerId: string;
      points: number;
      gameState: GameState;
    }) => {
      const winner = data.gameState.players.find((p) => p.id === data.winnerId);
      if (!winner) return;

      const winnerIndex = data.gameState.players.findIndex((p) => p.id === data.winnerId);
      const relativePosition = (winnerIndex - currentPlayerIndex + 4) % 4;
      const positions: ('bottom' | 'left' | 'top' | 'right')[] = ['bottom', 'left', 'top', 'right'];

      setTrickWinner({
        playerName: winner.name,
        points: data.points,
        teamId: winner.teamId,
        position: positions[relativePosition],
      });

      setTimeout(() => setTrickWinner(null), 2000);
    };

    socket.on('trick_resolved', handleTrickResolved);
    return () => {
      socket.off('trick_resolved', handleTrickResolved);
    };
  }, [socket, currentPlayerIndex, setTrickWinner]);

  // "Your turn" notification
  useEffect(() => {
    if (!isCurrentTurn) return;
    const timeoutId = setTimeout(() => sounds.yourTurn(), 10000);
    return () => clearTimeout(timeoutId);
  }, [isCurrentTurn, gameState.currentPlayerIndex]);

  // Reset suggestion when trick ends
  useEffect(() => {
    if (gameState.currentTrick.length === 0) {
      setSuggestionOpen(false);
    }
  }, [gameState.currentTrick.length]);

  // Get current move suggestion
  const currentSuggestion = useMemo(() => {
    if (!isCurrentTurn || isSpectator || gameState.phase !== 'playing') return null;
    return suggestMove(gameState, currentPlayerId);
  }, [isCurrentTurn, isSpectator, gameState, currentPlayerId]);

  return (
    <div className="h-screen-safe md:min-h-screen-safe flex flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain game-container bg-skin-primary">
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
        onOpenSideBets={() => setSideBetsOpen(!sideBetsOpen)}
        openSideBetsCount={openSideBetsCount}
        connectionStats={connectionStats}
        highestBet={
          gameState.highestBet
            ? {
                amount: gameState.highestBet.amount,
                withoutTrump: gameState.highestBet.withoutTrump,
                playerId: gameState.highestBet.playerId,
              }
            : undefined
        }
        trump={gameState.trump}
        bettingTeamId={
          gameState.highestBet?.playerId
            ? gameState.players.find((p) => p.id === gameState.highestBet?.playerId)?.teamId
            : null
        }
        isVoiceEnabled={isVoiceEnabled}
        isVoiceMuted={isVoiceMuted}
        voiceParticipants={voiceParticipants}
        voiceError={voiceError}
        onVoiceToggle={onVoiceToggle}
        onVoiceMuteToggle={onVoiceMuteToggle}
      />

      <div className="flex flex-col flex-1 overflow-visible relative">
        <ScoreBoard
          gameState={gameState}
          isCurrentTurn={isCurrentTurn}
          onAutoplayTimeout={handleAutoplayTimeout}
        />

        <div className="mb-2 md:mb-4 lg:mb-6 relative px-2 md:px-4 lg:px-6 flex-1">
          <div
            className="
              rounded-[var(--radius-xl)] p-3 md:p-6 lg:p-8
              md:min-h-[400px] lg:min-h-[450px]
              relative border-2 h-full flex flex-col
              bg-skin-secondary border-skin-accent shadow-[var(--shadow-glow)]
            "
          >
            <TurnIndicator
              isCurrentTurn={isCurrentTurn}
              isTrickCollecting={isTrickCollecting}
              lastTrickWinnerName={lastTrickWinnerName}
              currentPlayerId={currentPlayerId}
              players={gameState.players}
              currentPlayerIndex={gameState.currentPlayerIndex}
              currentTrickLength={gameState.currentTrick.length}
            />

            <TrickArea
              gameState={gameState}
              currentPlayerIndex={currentPlayerIndex}
              currentTrickWinnerId={currentTrickWinnerId}
              isSpectator={isSpectator}
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
              playerAchievements={playerAchievements}
            />
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
          trump={gameState.trump}
        />
      </div>

      {/* Leaderboard Modal */}
      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {/* How to Play Modal */}
      <HowToPlay isModal={true} isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

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
            socket.emit('send_game_chat', { gameId, message: message.trim() });
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

      {/* Winner Banner */}
      {trickWinner && (
        <TrickWinnerBanner
          playerName={trickWinner.playerName}
          points={trickWinner.points}
          position={trickWinner.position}
          teamColor={trickWinner.teamId === 1 ? 'orange' : 'purple'}
        />
      )}

      {/* Side Bets Panel */}
      {socket && gameId && currentPlayer && (
        <SideBetsPanel
          socket={socket}
          gameId={gameId}
          playerName={currentPlayerId}
          playerTeamId={currentPlayer.teamId}
          isWithoutTrump={gameState.highestBet?.withoutTrump ?? false}
          isSpectator={isSpectator}
          isOpen={sideBetsOpen}
          onClose={() => setSideBetsOpen(false)}
          onOpenBetsCountChange={setOpenSideBetsCount}
        />
      )}

      {/* Side Bet Toast Notifications - visible when panel is closed */}
      {socket && (
        <SideBetToast socket={socket} playerName={currentPlayerId} enabled={!sideBetsOpen} />
      )}
    </div>
  );
}

export const PlayingPhase = PlayingPhaseComponent;
