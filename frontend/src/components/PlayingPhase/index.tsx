/**
 * PlayingPhase Component - Multi-Skin Edition
 *
 * Main orchestrator for the playing phase with proper CSS variable usage.
 * Coordinates: ScoreBoard, TrickArea, PlayerHand
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { CardPlayEffect } from '../CardPlayEffect';
import { TrickWinnerBanner } from '../TrickWinnerBanner';
import { Leaderboard } from '../Leaderboard';
import { UnifiedChat } from '../UnifiedChat';
import { GameHeader } from '../GameHeader';
import { HowToPlay } from '../HowToPlay';
import { ChatMessage, VoiceParticipant } from '../../types/game';
import { GameState, Card as CardType } from '../../types/game';
import { sounds } from '../../utils/sounds';
import { ConnectionStats } from '../../hooks/useConnectionQuality';
import { useSettings } from '../../contexts/SettingsContext';
import { useChatNotifications } from '../../hooks/useChatNotifications';
import { suggestMove } from '../../utils/moveSuggestion';
import { Button } from '../ui/Button';

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
  pendingFriendRequestsCount?: number;
  onClickPlayer?: (playerName: string) => void;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  connectionStats?: ConnectionStats;
  // Voice chat props
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  voiceError?: string | null;
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
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
    : gameState.players.find(p => p.name === currentPlayerId || p.id === currentPlayerId);

  // Safety check: If player not found and not spectator, show error BEFORE calling any hooks
  if (!playerLookup && !isSpectator) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        <div
          className="p-8 rounded-[var(--radius-xl)] text-center border-2"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-accent)',
            boxShadow: 'var(--shadow-glow), var(--shadow-lg)',
          }}
        >
          <h2
            className="text-2xl font-display uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Player Not Found
          </h2>
          <p
            className="font-body mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
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

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage
  });

  // Card play effect state
  const [playEffect, setPlayEffect] = useState<{
    card: CardType;
    position: { x: number; y: number };
  } | null>(null);

  // Card queue state
  const [queuedCard, setQueuedCard] = useState<CardType | null>(null);
  // Track if the card was queued while it was the player's turn (for continuous play flow)
  const [queuedDuringOwnTurn, setQueuedDuringOwnTurn] = useState(false);

  // Trick winner celebration state
  const [trickWinner, setTrickWinner] = useState<{
    playerName: string;
    points: number;
    teamId: 1 | 2;
    position: 'bottom' | 'left' | 'top' | 'right';
  } | null>(null);

  // Bot thinking state
  const [botThinkingMap, setBotThinkingMap] = useState<Map<string, string>>(new Map());
  const [openThinkingButtons, setOpenThinkingButtons] = useState<Set<string>>(new Set());
  const [suggestionOpen, setSuggestionOpen] = useState(false);

  // Track autoplayEnabled with ref
  const autoplayEnabledRef = useRef(autoplayEnabled);
  useEffect(() => {
    autoplayEnabledRef.current = autoplayEnabled;
  }, [autoplayEnabled]);

  // Track which trick we've already played sound for
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

  // Toggle handlers
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

      const winnerIndex = data.gameState.players.findIndex(p => p.id === data.winnerId);
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
    return () => { socket.off('trick_resolved', handleTrickResolved); };
  }, [socket, currentPlayerIndex]);

  // Win/loss sound effects
  useEffect(() => {
    if (!gameState.previousTrick) return;

    const winnerId = gameState.previousTrick.winnerId;
    if (lastSoundedTrickWinnerRef.current === winnerId) return;
    lastSoundedTrickWinnerRef.current = winnerId;

    const winnerTeamId = gameState.players.find(p => p.id === winnerId)?.teamId;
    const currentPlayerTeamId = currentPlayer?.teamId;

    if (winnerTeamId === currentPlayerTeamId) {
      sounds.trickWon();
    } else {
      sounds.trickCollect();
    }
  }, [gameState.previousTrick, currentPlayer?.teamId, gameState.players]);

  // Generate thinking reasons for bots
  useEffect(() => {
    const newMap = new Map<string, string>();

    gameState.currentTrick.forEach((play, index) => {
      const player = gameState.players.find(p => p.name === play.playerName);
      if (!player?.isBot) return;

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

    const cardInHand = currentPlayer.hand.some(
      c => c.color === queuedCard.color && c.value === queuedCard.value
    );
    if (!cardInHand) {
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
      return;
    }

    // Don't auto-play if:
    // 1. Player just won the trick and is now leading AND
    // 2. The card was queued while waiting (not during own turn)
    // This allows continuous play flow when winning tricks (queue 7, play, queue 6, auto-play, etc.)
    const justWonTrick = gameState.currentTrick.length === 0 &&
      gameState.previousTrick?.winnerName === currentPlayer.name;
    if (justWonTrick && !queuedDuringOwnTurn) {
      // Keep the card queued but don't auto-play - player queued while waiting, now they're leading
      return;
    }

    let isValidToPlay = true;
    // Only validate suit-following if there are 1-3 cards in the trick (someone has led)
    // When currentTrick.length === 4, the previous trick is still displayed for 2 seconds,
    // but we're actually leading a new trick (no suit-following required)
    // When currentTrick.length === 0, we're also leading (no suit-following required)
    if (gameState.currentTrick.length > 0 && gameState.currentTrick.length < 4) {
      const ledSuit = gameState.currentTrick[0].card.color;
      const hasLedSuit = currentPlayer.hand.some(c => c.color === ledSuit);
      if (hasLedSuit && queuedCard.color !== ledSuit) {
        isValidToPlay = false;
      }
    }

    if (!isValidToPlay) {
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      sounds.cardConfirm(queuedCard.value);
      onPlayCard(queuedCard);
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [isCurrentTurn, queuedCard, queuedDuringOwnTurn, currentPlayer, gameState.currentTrick, gameState.previousTrick, onPlayCard]);

  // Clear queue on new round
  useEffect(() => {
    setQueuedCard(null);
    setQueuedDuringOwnTurn(false);
  }, [gameState.roundNumber]);

  // Handler to queue/unqueue a card
  const handleQueueCard = useCallback((card: CardType | null) => {
    if (!card) {
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
      return;
    }
    if (queuedCard && queuedCard.color === card.color && queuedCard.value === card.value) {
      // Unqueue - clicking same card
      setQueuedCard(null);
      setQueuedDuringOwnTurn(false);
    } else {
      // Queue new card - track if it was queued during own turn for continuous play flow
      setQueuedCard(card);
      setQueuedDuringOwnTurn(isCurrentTurn);
      sounds.cardDeal();
    }
  }, [queuedCard, isCurrentTurn]);

  // Empty state message when no trick
  const EmptyTrickMessage = () => {
    if (gameState.currentTrick.length > 0) return null;

    return (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-50">
        <div
          className={`
            relative rounded-[var(--radius-xl)] px-6 py-4 lg:px-8 lg:py-6
            border-2 transition-all duration-[var(--duration-fast)]
          `}
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            borderColor: isCurrentTurn ? 'var(--color-text-accent)' : 'var(--color-border-default)',
            boxShadow: isCurrentTurn ? 'var(--shadow-glow)' : 'var(--shadow-lg)',
          }}
          data-testid="turn-indicator"
        >
          {isCurrentTurn && (
            <div className="mb-2">
              <span className="text-4xl animate-bounce">👇</span>
            </div>
          )}
          <p
            className="text-lg md:text-2xl lg:text-3xl font-display uppercase tracking-wider"
            style={{ color: 'var(--color-text-primary)' }}
            data-testid="current-turn-player"
          >
            {isCurrentTurn
              ? 'Your Turn - Play a card!'
              : `Waiting for ${gameState.players[gameState.currentPlayerIndex]?.name}...`}
          </p>
          <div className="mt-2 flex gap-1 justify-center" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 lg:w-3 lg:h-3 rounded-full animate-bounce"
                style={{
                  backgroundColor: 'var(--color-text-accent)',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Get current move suggestion
  const currentSuggestion = useMemo(() => {
    if (!isCurrentTurn || isSpectator || gameState.phase !== 'playing') return null;
    return suggestMove(gameState, currentPlayerId);
  }, [isCurrentTurn, isSpectator, gameState, currentPlayerId]);

  return (
    <div
      className="h-screen-safe md:min-h-screen-safe flex flex-col overflow-y-auto overflow-x-hidden md:overflow-visible"
      style={{ background: 'var(--color-bg-primary)' }}
    >
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
        highestBet={gameState.highestBet ? { amount: gameState.highestBet.amount, withoutTrump: gameState.highestBet.withoutTrump, playerId: gameState.highestBet.playerId } : undefined}
        trump={gameState.trump}
        bettingTeamId={gameState.highestBet?.playerId ? gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.teamId : null}
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
            "
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-accent)',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <EmptyTrickMessage />

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
    </div>
  );
}

export const PlayingPhase = PlayingPhaseComponent;
