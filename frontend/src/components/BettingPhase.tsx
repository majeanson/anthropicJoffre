/**
 * BettingPhase Component - Multi-Skin Edition
 *
 * Betting phase with proper CSS variable usage for skin compatibility.
 * Features bet selection, trump options, and validation feedback.
 */

import { useMemo, useState, useEffect, memo } from 'react';
import { Socket } from 'socket.io-client';
import { Bet, Player, GameState, VoiceParticipant } from '../types/game';
import { Card as CardComponent } from './Card';
import { TimeoutIndicator } from './TimeoutIndicator';
import { Leaderboard } from './Leaderboard';
import { UnifiedChat } from './UnifiedChat';
import { ChatMessage } from '../types/game';
import { GameHeader } from './GameHeader';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { sounds } from '../utils/sounds';
import { SmartValidationMessage } from './SmartValidationMessage';
import { useChatNotifications } from '../hooks/useChatNotifications';
import { MoveSuggestionPanel } from './MoveSuggestionPanel';
import { useSettings } from '../contexts/SettingsContext';
import { BettingHistory } from './BettingHistory';
import { Button, ElegantButton } from './ui/Button';

interface BettingPhaseProps {
  players: Player[];
  currentBets: Bet[];
  currentPlayerId: string;
  currentPlayerIndex: number;
  dealerIndex: number;
  onPlaceBet: (amount: number, withoutTrump: boolean, skipped?: boolean) => void;
  onLeaveGame?: () => void;
  gameState: GameState;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  onOpenBotManagement?: () => void;
  onOpenAchievements?: () => void;
  onOpenFriends?: () => void;
  pendingFriendRequestsCount?: number;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  connectionStats?: ConnectionStats;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  onClickPlayer: (playerName: string) => void;
  // Voice chat props
  isVoiceEnabled?: boolean;
  isVoiceMuted?: boolean;
  voiceParticipants?: VoiceParticipant[];
  voiceError?: string | null;
  onVoiceToggle?: () => void;
  onVoiceMuteToggle?: () => void;
}

function BettingPhaseComponent({
  players,
  currentBets,
  currentPlayerId,
  currentPlayerIndex,
  dealerIndex,
  onPlaceBet,
  onLeaveGame,
  gameState,
  autoplayEnabled = false,
  onAutoplayToggle,
  onOpenBotManagement,
  onOpenAchievements,
  onOpenFriends,
  pendingFriendRequestsCount = 0,
  soundEnabled = true,
  onSoundToggle,
  connectionStats,
  socket,
  gameId,
  chatMessages = [],
  onNewChatMessage,
  onClickPlayer,
  isVoiceEnabled = false,
  isVoiceMuted = false,
  voiceParticipants = [],
  voiceError,
  onVoiceToggle,
  onVoiceMuteToggle,
}: BettingPhaseProps) {
  const { beginnerMode } = useSettings();

  // Memoize expensive computations
  const currentPlayer = useMemo(
    () => players.find((p) => p.name === currentPlayerId),
    [players, currentPlayerId]
  );

  const hasPlacedBet = useMemo(
    () => (currentPlayer ? currentBets.some((b) => b.playerName === currentPlayer.name) : false),
    [currentBets, currentPlayer]
  );

  const isMyTurn = useMemo(
    () => (currentPlayer ? players[currentPlayerIndex]?.id === currentPlayer.id : false),
    [players, currentPlayerIndex, currentPlayer]
  );

  const isDealer = useMemo(
    () => currentPlayerIndex === dealerIndex,
    [currentPlayerIndex, dealerIndex]
  );

  const playerHand = useMemo(() => currentPlayer?.hand || [], [currentPlayer]);

  // State for bet selection
  const [selectedAmount, setSelectedAmount] = useState<number>(7);
  const [withoutTrump, setWithoutTrump] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);

  // Keyboard navigation state
  const [navLevel, setNavLevel] = useState<number>(0);
  const [actionIndex, setActionIndex] = useState<number>(0);

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage,
  });

  // Get highest valid bet
  const highestBet = useMemo((): Bet | null => {
    const validBets = currentBets.filter((b) => !b.skipped);
    if (validBets.length === 0) return null;
    return validBets.reduce((highest, current) => {
      if (current.amount > highest.amount) return current;
      if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump)
        return current;
      return highest;
    });
  }, [currentBets]);

  const canSkip = (): boolean => {
    if (!isDealer) return true;
    const hasValidBets = currentBets.some((b) => !b.skipped);
    return hasValidBets;
  };

  const handlePlaceBet = () => {
    sounds.betPlaced();
    onPlaceBet(selectedAmount, withoutTrump, false);
  };

  const handleSkip = () => {
    sounds.betSkipped();
    onPlaceBet(-1, false, true);
  };

  const scrollToLevel = (level: number) => {
    const levelIds = ['bet-level-amount', 'bet-level-trump', 'bet-level-action'];
    const element = document.getElementById(levelIds[level]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isMyTurn || hasPlacedBet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newLevel = Math.max(0, navLevel - 1);
        setNavLevel(newLevel);
        scrollToLevel(newLevel);
        sounds.buttonClick();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newLevel = Math.min(2, navLevel + 1);
        setNavLevel(newLevel);
        scrollToLevel(newLevel);
        sounds.buttonClick();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (navLevel === 0) {
          if (e.key === 'ArrowRight') {
            setSelectedAmount((prev) => Math.min(12, prev + 1));
          } else {
            setSelectedAmount((prev) => Math.max(7, prev - 1));
          }
        } else if (navLevel === 1) {
          setWithoutTrump((prev) => !prev);
        } else if (navLevel === 2) {
          const hasSkip = canSkip();
          if (hasSkip) {
            setActionIndex((prev) => (prev === 0 ? 1 : 0));
          }
        }
        sounds.buttonClick();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (navLevel === 2) {
          if (actionIndex === 0 && canSkip()) {
            handleSkip();
          } else if (actionIndex === 1 || !canSkip()) {
            if (isCurrentBetValid()) {
              handlePlaceBet();
            }
          }
        } else {
          setNavLevel(2);
        }
        sounds.buttonClick();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (navLevel > 0) {
          setNavLevel((prev) => prev - 1);
        } else if (canSkip()) {
          handleSkip();
        }
        sounds.buttonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, hasPlacedBet, selectedAmount, withoutTrump, navLevel, actionIndex]);

  const isBetAmountValid = (amount: number): boolean => {
    if (!highestBet) return true;
    if (isDealer) return amount >= highestBet.amount;
    return amount > highestBet.amount;
  };

  const isCurrentBetValid = (): boolean => {
    if (!highestBet) return true;
    if (isDealer) return selectedAmount >= highestBet.amount;
    return (
      selectedAmount > highestBet.amount ||
      (selectedAmount === highestBet.amount && withoutTrump && !highestBet.withoutTrump)
    );
  };

  // Get current player's team color
  const currentTurnTeamId = players[currentPlayerIndex]?.teamId;

  return (
    <div className="min-h-screen flex flex-col game-container bg-skin-primary">
      <GameHeader
        gameId={gameState.id}
        roundNumber={gameState.roundNumber}
        team1Score={gameState.teamScores.team1}
        team2Score={gameState.teamScores.team2}
        onLeaveGame={onLeaveGame}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenChat={() => setChatOpen(!chatOpen)}
        onOpenBotManagement={onOpenBotManagement}
        onOpenAchievements={onOpenAchievements}
        onOpenFriends={onOpenFriends}
        pendingFriendRequestsCount={pendingFriendRequestsCount}
        botCount={gameState.players.filter((p) => p.isBot).length}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        unreadChatCount={unreadChatCount}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        connectionStats={connectionStats}
        highestBet={
          highestBet
            ? {
                amount: highestBet.amount,
                withoutTrump: highestBet.withoutTrump,
                playerId: highestBet.playerId,
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

      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="
            bg-skin-secondary
            rounded-[var(--radius-xl)]
            p-6 max-w-2xl w-full
            border-2 border-skin-accent
            shadow-main-glow
          "
        >
          <h2 className="text-2xl font-display uppercase tracking-wider mb-4 text-center text-skin-primary drop-shadow-[0_0_10px_var(--color-glow)]">
            Betting Phase
          </h2>

          {/* Current Turn Indicator */}
          {!hasPlacedBet && (
            <div className="relative mb-6">
              <div
                className={`
                  relative px-4 py-3 rounded-[var(--radius-lg)]
                  font-display uppercase tracking-wider text-sm
                  flex items-center justify-center gap-2 flex-wrap
                  border-2 transition-all duration-[var(--duration-fast)]
                  ${currentTurnTeamId === 1 ? 'bg-team1 text-skin-team1-text' : 'bg-team2 text-skin-team2-text'}
                  ${isMyTurn ? 'border-skin-accent shadow-turn-active' : 'border-transparent'}
                  ${!isMyTurn && (currentTurnTeamId === 1 ? 'shadow-turn-team1' : 'shadow-turn-team2')}
                `}
              >
                {isMyTurn && <span className="animate-bounce">👇</span>}
                <span>
                  Waiting for: {players[currentPlayerIndex]?.name}
                  {isMyTurn ? ' (Your Turn)' : ''}
                </span>
                <TimeoutIndicator
                  duration={60000}
                  isActive={!hasPlacedBet && isMyTurn}
                  resetKey={currentPlayerIndex}
                  onTimeout={() => {
                    if (isMyTurn && onAutoplayToggle && !autoplayEnabled) {
                      onAutoplayToggle();
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Betting History */}
          <div className="mb-6">
            <BettingHistory
              players={players}
              currentBets={currentBets}
              dealerIndex={dealerIndex}
              onClickPlayer={onClickPlayer}
            />
          </div>

          {/* Player's Hand Display */}
          {playerHand.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-display uppercase tracking-wider mb-3 text-skin-secondary">
                Your Hand
              </h3>
              <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
                {playerHand.map((card, index) => (
                  <div key={`${card.color}-${card.value}-${index}`} className="flex justify-center">
                    <CardComponent card={card} size="small" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Beginner Mode: Move Suggestion */}
          {beginnerMode && !hasPlacedBet && isMyTurn && (
            <div className="mb-6">
              <MoveSuggestionPanel
                gameState={gameState}
                currentPlayerId={currentPlayerId}
                isMyTurn={isMyTurn}
              />
            </div>
          )}

          {/* Betting Controls */}
          {!hasPlacedBet && (
            <div className="space-y-4 mt-6 pt-6 border-t-2 border-skin-default">
              {isMyTurn ? (
                <>
                  {/* Level 0: Bet Amount */}
                  <div
                    id="bet-level-amount"
                    className={`
                      p-4 rounded-[var(--radius-lg)]
                      border-2 transition-all duration-[var(--duration-fast)]
                      ${
                        navLevel === 0
                          ? 'border-skin-accent bg-skin-accent/10 shadow-nav-active'
                          : 'border-skin-default bg-skin-tertiary'
                      }
                    `}
                  >
                    <label className="block text-xs font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-skin-muted">
                      {navLevel === 0 && <span className="text-skin-accent">▶</span>}
                      Select Bet Amount
                      <span className="hidden sm:inline text-[10px]">(← → to adjust)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[7, 8, 9, 10, 11, 12].map((amount) => {
                        const isValid = isBetAmountValid(amount);
                        const isSelected = selectedAmount === amount;
                        return (
                          <button
                            key={amount}
                            onClick={() => {
                              sounds.buttonClick();
                              setSelectedAmount(amount);
                            }}
                            disabled={!isValid}
                            className={`
                              min-h-[48px] py-3 sm:py-4 px-3 sm:px-4
                              rounded-[var(--radius-md)]
                              font-display text-lg sm:text-xl
                              border-2 transition-all duration-[var(--duration-fast)]
                              touch-manipulation select-none
                              active:scale-95
                              ${
                                !isValid
                                  ? 'opacity-40 cursor-not-allowed border-skin-subtle text-skin-muted'
                                  : isSelected
                                    ? 'border-skin-accent bg-skin-accent/20 text-skin-accent shadow-btn-selected'
                                    : 'border-skin-default bg-transparent text-skin-secondary hover:border-skin-accent'
                              }
                            `}
                          >
                            {amount}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level 1: Trump Option */}
                  <div
                    id="bet-level-trump"
                    className={`
                      p-4 rounded-[var(--radius-lg)]
                      border-2 transition-all duration-[var(--duration-fast)]
                      ${
                        navLevel === 1
                          ? 'border-skin-accent bg-skin-accent/10 shadow-nav-active'
                          : 'border-skin-default bg-skin-tertiary'
                      }
                    `}
                  >
                    <label className="block text-xs font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-skin-muted">
                      {navLevel === 1 && <span className="text-skin-accent">▶</span>}
                      Trump Option
                      <span className="hidden sm:inline text-[10px]">(← → to toggle)</span>
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: false, label: 'With Trump (1x)', icon: '🃏' },
                        { value: true, label: 'Without Trump (2x)', icon: '✨' },
                      ].map((option) => (
                        <button
                          key={option.label}
                          onClick={() => {
                            sounds.buttonClick();
                            setWithoutTrump(option.value);
                          }}
                          className={`
                            w-full flex items-center min-h-[48px] p-3 sm:p-4
                            rounded-[var(--radius-md)]
                            border-2 transition-all duration-[var(--duration-fast)]
                            touch-manipulation select-none
                            active:scale-[0.98]
                            ${
                              withoutTrump === option.value
                                ? 'border-[var(--color-text-accent)] bg-[var(--color-text-accent)]/20'
                                : 'border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-accent)]'
                            }
                          `}
                        >
                          <span className="mr-3 text-lg sm:text-xl">{option.icon}</span>
                          <span
                            className={`font-body text-sm sm:text-base ${
                              withoutTrump === option.value
                                ? 'text-skin-accent'
                                : 'text-skin-secondary'
                            }`}
                          >
                            {option.label}
                          </span>
                          {withoutTrump === option.value && (
                            <span className="ml-auto text-lg text-skin-accent">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Level 2: Action Buttons */}
                  <div
                    id="bet-level-action"
                    className={`
                      p-4 rounded-[var(--radius-lg)]
                      border-2 transition-all duration-[var(--duration-fast)]
                      ${
                        navLevel === 2
                          ? 'border-skin-accent bg-skin-accent/10 shadow-nav-active'
                          : 'border-skin-default bg-skin-tertiary'
                      }
                    `}
                  >
                    <label className="block text-xs font-display uppercase tracking-wider mb-3 flex items-center gap-2 text-skin-muted">
                      {navLevel === 2 && <span className="text-skin-accent">▶</span>}
                      Action
                      <span className="hidden sm:inline text-[10px]">
                        (← → select, Enter confirm)
                      </span>
                    </label>
                    <div className="flex gap-3">
                      {canSkip() && (
                        <Button
                          data-testid="skip-bet-button"
                          onClick={handleSkip}
                          variant="ghost"
                          size="lg"
                          className={`flex-1 ${navLevel === 2 && actionIndex === 0 ? 'ring-2 ring-[var(--color-text-accent)]' : ''}`}
                        >
                          ⏭️ Skip
                        </Button>
                      )}
                      <ElegantButton
                        onClick={handlePlaceBet}
                        disabled={!isCurrentBetValid()}
                        size="lg"
                        glow={isCurrentBetValid()}
                        className={`flex-1 ${navLevel === 2 && (actionIndex === 1 || !canSkip()) ? 'ring-2 ring-[var(--color-text-accent)]' : ''}`}
                      >
                        🎲 Bet {selectedAmount} {withoutTrump ? '(No Trump)' : ''}
                      </ElegantButton>
                    </div>
                  </div>

                  {/* Validation Messages */}
                  <SmartValidationMessage
                    messages={[
                      ...(!isCurrentBetValid() && highestBet
                        ? [
                            {
                              type: 'warning' as const,
                              text: `Too low: Current highest is ${highestBet.amount} points${highestBet.withoutTrump ? ' (No Trump)' : ''}. ${isDealer ? 'You can match or raise.' : 'You must raise.'}`,
                            },
                          ]
                        : []),
                      ...(isDealer && currentBets.length > 0 && currentBets.some((b) => !b.skipped)
                        ? [
                            {
                              type: 'info' as const,
                              text: 'Dealer Privilege: You can match or raise the current bet',
                            },
                          ]
                        : []),
                      ...(isDealer && !currentBets.some((b) => !b.skipped)
                        ? [
                            {
                              type: 'info' as const,
                              text: 'Dealer: You must bet at least 7 points',
                            },
                          ]
                        : []),
                      ...(isCurrentBetValid()
                        ? [
                            {
                              type: 'success' as const,
                              text: `Ready to place bet: ${selectedAmount} ${withoutTrump ? '(No Trump)' : ''}`,
                            },
                          ]
                        : []),
                    ]}
                  />
                </>
              ) : (
                <div className="text-center font-body py-3 text-skin-muted">
                  It's {players[currentPlayerIndex]?.name}'s turn to bet
                </div>
              )}
            </div>
          )}

          {hasPlacedBet && (
            <div className="text-center font-body mt-6 pt-6 border-t-2 border-skin-default text-skin-success">
              ✓ Waiting for other players to bet...
            </div>
          )}
        </div>
      </div>

      <Leaderboard
        gameState={gameState}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      {socket && gameId && onNewChatMessage && (
        <UnifiedChat
          mode="panel"
          context="game"
          socket={socket}
          gameId={gameId}
          currentPlayerId={currentPlayerId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          messages={chatMessages}
          onSendMessage={(message) => {
            socket.emit('send_game_chat', {
              gameId,
              message: message.trim(),
            });
            onNewChatMessage({
              playerId: currentPlayerId,
              playerName: currentPlayer?.name || 'Unknown',
              message: message.trim(),
              timestamp: Date.now(),
              teamId: currentPlayer?.teamId || null,
            });
          }}
          title="💬 Game Chat"
        />
      )}
    </div>
  );
}

export const BettingPhase = memo(BettingPhaseComponent);
