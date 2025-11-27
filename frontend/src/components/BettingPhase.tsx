import { useMemo, useState, useEffect, memo } from 'react';
import { Socket } from 'socket.io-client';
import { Bet, Player, GameState } from '../types/game';
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
  onOpenAchievements?: () => void; // Sprint 2 Phase 1
  onOpenFriends?: () => void; // Sprint 2 Phase 2
  pendingFriendRequestsCount?: number; // Sprint 16 - Friend requests badge
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  connectionStats?: ConnectionStats;
  socket?: Socket | null;
  gameId?: string;
  chatMessages?: ChatMessage[];
  onNewChatMessage?: (message: ChatMessage) => void;
  onClickPlayer: (playerName: string) => void; // Click player to view profile (REQUIRED)
}

function BettingPhaseComponent({ players, currentBets, currentPlayerId, currentPlayerIndex, dealerIndex, onPlaceBet, onLeaveGame, gameState, autoplayEnabled = false, onAutoplayToggle, onOpenBotManagement, onOpenAchievements, onOpenFriends, pendingFriendRequestsCount = 0, soundEnabled = true, onSoundToggle, connectionStats, socket, gameId, chatMessages = [], onNewChatMessage, onClickPlayer }: BettingPhaseProps) {

  // Get beginner mode setting
  const { beginnerMode } = useSettings();

  // Memoize expensive computations
  // Find current player by name (stable identifier)
  const currentPlayer = useMemo(
    () => players.find(p => p.name === currentPlayerId),
    [players, currentPlayerId]
  );

  const hasPlacedBet = useMemo(
    () => currentPlayer ? currentBets.some(b => b.playerName === currentPlayer.name) : false,
    [currentBets, currentPlayer]
  );

  const isMyTurn = useMemo(
    () => currentPlayer ? players[currentPlayerIndex]?.id === currentPlayer.id : false,
    [players, currentPlayerIndex, currentPlayer]
  );

  const isDealer = useMemo(
    () => currentPlayerIndex === dealerIndex,
    [currentPlayerIndex, dealerIndex]
  );

  const playerHand = useMemo(
    () => currentPlayer?.hand || [],
    [currentPlayer]
  );

  // State for bet selection
  const [selectedAmount, setSelectedAmount] = useState<number>(7);
  const [withoutTrump, setWithoutTrump] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);

  // Keyboard navigation state - 3 levels
  // Level 0: Bet amount (7-12)
  // Level 1: Trump option (With/Without)
  // Level 2: Action buttons (Skip/Place)
  const [navLevel, setNavLevel] = useState<number>(0);
  const [actionIndex, setActionIndex] = useState<number>(0); // 0=Skip, 1=Place (for level 2)

  // Use chat notifications hook
  const { unreadChatCount } = useChatNotifications({
    socket,
    currentPlayerId,
    chatOpen,
    onNewChatMessage
  });

  // Get highest valid bet (excluding skipped bets) - memoized
  const highestBet = useMemo((): Bet | null => {
    const validBets = currentBets.filter(b => !b.skipped);
    if (validBets.length === 0) return null;
    return validBets.reduce((highest, current) => {
      if (current.amount > highest.amount) return current;
      if (current.amount === highest.amount && current.withoutTrump && !highest.withoutTrump) return current;
      return highest;
    });
  }, [currentBets]);

  const canSkip = (): boolean => {
    // Non-dealers can always skip
    if (!isDealer) {
      return true;
    }

    // Dealer CANNOT skip if NO valid bets exist (must start the betting)
    // Dealer CAN skip if there ARE valid bets
    const hasValidBets = currentBets.some(b => !b.skipped);
    return hasValidBets; // Dealer can skip only if someone has bet
  };

  const handlePlaceBet = () => {
    sounds.betPlaced(); // Sprint 1 Phase 6: Bet placed sound
    onPlaceBet(selectedAmount, withoutTrump, false);
  };

  const handleSkip = () => {
    sounds.betSkipped(); // Sprint 1 Phase 6: Skip sound
    onPlaceBet(-1, false, true);
  };

  // Scroll to the active navigation level
  const scrollToLevel = (level: number) => {
    const levelIds = ['bet-level-amount', 'bet-level-trump', 'bet-level-action'];
    const element = document.getElementById(levelIds[level]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Keyboard accessibility for betting - 3 level navigation
  useEffect(() => {
    if (!isMyTurn || hasPlacedBet) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Up/Down - Navigate between levels
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newLevel = Math.max(0, navLevel - 1);
        setNavLevel(newLevel);
        scrollToLevel(newLevel);
        sounds.buttonClick();
      }
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newLevel = Math.min(2, navLevel + 1);
        setNavLevel(newLevel);
        scrollToLevel(newLevel);
        sounds.buttonClick();
      }
      // Left/Right - Adjust value within current level
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (navLevel === 0) {
          // Level 0: Bet amount
          if (e.key === 'ArrowRight') {
            setSelectedAmount(prev => Math.min(12, prev + 1));
          } else {
            setSelectedAmount(prev => Math.max(7, prev - 1));
          }
        } else if (navLevel === 1) {
          // Level 1: Trump option toggle
          setWithoutTrump(prev => !prev);
        } else if (navLevel === 2) {
          // Level 2: Action buttons (Skip/Place)
          const hasSkip = canSkip();
          if (hasSkip) {
            setActionIndex(prev => prev === 0 ? 1 : 0);
          }
        }
        sounds.buttonClick();
      }
      // Enter - Activate current selection
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (navLevel === 2) {
          // Action level - execute selected action
          if (actionIndex === 0 && canSkip()) {
            handleSkip();
          } else if (actionIndex === 1 || !canSkip()) {
            if (isCurrentBetValid()) {
              handlePlaceBet();
            }
          }
        } else {
          // On other levels, Enter moves to action level
          setNavLevel(2);
        }
        sounds.buttonClick();
      }
      // Escape - Go back one level or skip
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (navLevel > 0) {
          setNavLevel(prev => prev - 1);
        } else if (canSkip()) {
          handleSkip();
        }
        sounds.buttonClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, hasPlacedBet, selectedAmount, withoutTrump, navLevel, actionIndex]);

  // Check if a specific bet amount is valid (for button disabling)
  const isBetAmountValid = (amount: number): boolean => {
    if (!highestBet) return true; // No bets yet, all amounts valid

    if (isDealer) {
      // Dealer can match or raise
      return amount >= highestBet.amount;
    } else {
      // Non-dealer must raise (strictly greater)
      // Note: They could match with withoutTrump, but we disable the button to encourage raising
      return amount > highestBet.amount;
    }
  };

  // Check if current selection is valid
  const isCurrentBetValid = (): boolean => {
    if (!highestBet) return true; // No bets yet, all valid

    if (isDealer) {
      // Dealer can match or raise
      return selectedAmount >= highestBet.amount;
    } else {
      // Non-dealer must raise (higher amount or same with withoutTrump)
      return selectedAmount > highestBet.amount ||
             (selectedAmount === highestBet.amount && withoutTrump && !highestBet.withoutTrump);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-parchment-400 to-parchment-500 dark:from-gray-800 dark:to-gray-900 flex flex-col">
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
        botCount={gameState.players.filter(p => p.isBot).length}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        unreadChatCount={unreadChatCount}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        connectionStats={connectionStats}
        highestBet={highestBet ? { amount: highestBet.amount, withoutTrump: highestBet.withoutTrump, playerId: highestBet.playerId } : undefined}
        trump={gameState.trump}
        bettingTeamId={gameState.highestBet?.playerId ? gameState.players.find(p => p.id === gameState.highestBet?.playerId)?.teamId : null}
      />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-parchment-50 dark:bg-gray-800 rounded-xl p-6 shadow-lg max-w-2xl w-full border-2 border-parchment-400 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-umber-900 dark:text-gray-100 font-serif mb-4">Betting Phase</h2>

      {/* Current Turn Indicator with Timeout */}
      {!hasPlacedBet && (
        <div className="relative mb-6">
          {/* Spotlight effect for current player */}
          {isMyTurn && (
            <div className="absolute inset-0 -m-4 rounded-full bg-gradient-radial from-blue-400/30 via-blue-400/10 to-transparent motion-safe:animate-spotlight motion-reduce:opacity-30 pointer-events-none" />
          )}
          <div className={`relative px-3 md:px-4 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold shadow-lg flex items-center justify-center gap-2 flex-wrap transition-all ${
            players[currentPlayerIndex]?.teamId === 1
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
          } ${isMyTurn ? 'border-4 border-blue-500 motion-safe:animate-turn-pulse' : ''}`}>
            {isMyTurn && (
              <span className="motion-safe:animate-arrow-bounce motion-reduce:inline">👇</span>
            )}
            <span>Waiting for: {players[currentPlayerIndex]?.name}{isMyTurn ? ' (Your Turn)' : ''}</span>
            <TimeoutIndicator
              duration={60000}
              isActive={!hasPlacedBet && isMyTurn}
              resetKey={currentPlayerIndex}
              onTimeout={() => {
                // Auto-enable autoplay when timeout expires (only for current player)
                if (isMyTurn && onAutoplayToggle && !autoplayEnabled) {
                  onAutoplayToggle();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* IMPROVEMENT #12: Betting History Visualization */}
      <div className="mb-6">
        <BettingHistory
          players={players}
          currentBets={currentBets}
          dealerIndex={dealerIndex}
          onClickPlayer={onClickPlayer}
        />
      </div>

      {/* Player's Hand Display - 4x2 Grid */}
      {playerHand.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-umber-800 dark:text-gray-200">Your Hand</h3>
          <div className="grid grid-cols-4 gap-2 md:gap-3 max-w-md mx-auto">
            {playerHand.map((card, index) => (
              <div
                key={`${card.color}-${card.value}-${index}`}
                className="flex justify-center"
              >
                <CardComponent
                  card={card}
                  size="small"
                />
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

      {!hasPlacedBet && (
        <div className="space-y-3 mt-6 pt-6 border-t-2 border-parchment-400 dark:border-gray-600">
          {isMyTurn ? (
            <>
              <div className="space-y-4">
                {/* Level 0: Bet Amount */}
                <div id="bet-level-amount" className={`p-3 rounded-lg transition-all ${navLevel === 0 ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    {navLevel === 0 && <span className="text-orange-500">▶</span>}
                    Select Bet Amount: <span className="hidden sm:inline text-xs text-umber-600 dark:text-gray-400">(← → to adjust)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 8, 9, 10, 11, 12].map((amount) => {
                      const isValid = isBetAmountValid(amount);
                      return (
                        <button
                          key={amount}
                          onClick={() => setSelectedAmount(amount)}
                          disabled={!isValid}
                          className={`py-3 px-4 rounded-lg font-semibold transition-all text-base border-2 ${
                            !isValid
                              ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 dark:text-gray-600 cursor-not-allowed opacity-50 border-gray-400'
                              : selectedAmount === amount
                                ? 'bg-umber-600 text-parchment-50 ring-2 ring-umber-400 border-umber-700'
                                : 'bg-parchment-100 dark:bg-gray-700 text-umber-800 dark:text-gray-200 hover:bg-parchment-200 dark:bg-gray-600 border-parchment-400 dark:border-gray-600'
                          }`}
                        >
                          {amount}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Level 1: Trump Option */}
                <div id="bet-level-trump" className={`p-3 rounded-lg transition-all ${navLevel === 1 ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    {navLevel === 1 && <span className="text-orange-500">▶</span>}
                    Trump Option: <span className="hidden sm:inline text-xs text-umber-600 dark:text-gray-400">(← → to toggle)</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 bg-parchment-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-parchment-200 dark:bg-gray-600 transition-colors border border-parchment-300 dark:border-gray-600">
                      <input
                        type="radio"
                        name="trump"
                        checked={!withoutTrump}
                        onChange={() => setWithoutTrump(false)}
                        className="w-4 h-4 text-umber-600 dark:text-gray-400 focus:ring-umber-500"
                      />
                      <span className="ml-3 text-sm font-medium text-umber-800 dark:text-gray-200">
                        With Trump (1x)
                      </span>
                    </label>
                    <label className="flex items-center p-3 bg-parchment-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-parchment-200 dark:bg-gray-600 transition-colors border border-parchment-300 dark:border-gray-600">
                      <input
                        type="radio"
                        name="trump"
                        checked={withoutTrump}
                        onChange={() => setWithoutTrump(true)}
                        className="w-4 h-4 text-umber-600 dark:text-gray-400 focus:ring-umber-500"
                      />
                      <span className="ml-3 text-sm font-medium text-umber-800 dark:text-gray-200">
                        Without Trump (2x multiplier)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Level 2: Action Buttons */}
                <div id="bet-level-action" className={`p-3 rounded-lg transition-all ${navLevel === 2 ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}`}>
                  <label className="block text-sm font-medium text-umber-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    {navLevel === 2 && <span className="text-orange-500">▶</span>}
                    Action: <span className="hidden sm:inline text-xs text-umber-600 dark:text-gray-400">(← → to select, Enter to confirm)</span>
                  </label>
                  <div className="flex gap-3">
                    {canSkip() && (
                      <button
                        data-testid="skip-bet-button"
                        onClick={handleSkip}
                        className={`flex-1 py-4 px-6 rounded-xl font-black text-base bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-300 border-2 shadow-lg transform hover:scale-105 ${
                          navLevel === 2 && actionIndex === 0 ? 'ring-4 ring-orange-500 border-orange-500' : 'border-gray-700'
                        }`}
                      >
                        SKIP
                      </button>
                    )}
                    <button
                      onClick={handlePlaceBet}
                      disabled={!isCurrentBetValid()}
                      className={`flex-1 py-4 px-6 rounded-xl font-black text-base transition-all duration-300 border-2 shadow-lg transform ${
                        isCurrentBetValid()
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:scale-105'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-600 cursor-not-allowed border-gray-400 opacity-60'
                      } ${navLevel === 2 && (actionIndex === 1 || !canSkip()) ? 'ring-4 ring-orange-500 border-orange-500' : 'border-green-800'}`}
                    >
                      Place Bet: {selectedAmount} {withoutTrump ? '(No Trump)' : ''}
                    </button>
                  </div>
                </div>
              </div>

              {/* Smart Validation Messages - Single priority-based display */}
              <SmartValidationMessage
                messages={[
                  ...(!isCurrentBetValid() && highestBet ? [{
                    type: 'warning' as const,
                    text: `Too low: Current highest is ${highestBet.amount} points${highestBet.withoutTrump ? ' (No Trump)' : ''}. ${isDealer ? 'You can match or raise.' : 'You must raise.'}`
                  }] : []),
                  ...(isDealer && currentBets.length > 0 && currentBets.some(b => !b.skipped) ? [{
                    type: 'info' as const,
                    text: 'Dealer Privilege: You can match or raise the current bet'
                  }] : []),
                  ...(isDealer && !currentBets.some(b => !b.skipped) ? [{
                    type: 'info' as const,
                    text: 'Dealer: You must bet at least 7 points'
                  }] : []),
                  ...(isCurrentBetValid() ? [{
                    type: 'success' as const,
                    text: `Ready to place bet: ${selectedAmount} ${withoutTrump ? '(No Trump)' : ''}`
                  }] : [])
                ]}
              />
            </>
          ) : (
            <div className="text-center text-umber-700 dark:text-gray-300 font-medium py-3 text-sm">
              <span>It's {players[currentPlayerIndex]?.name}'s turn to bet</span>
            </div>
          )}
        </div>
      )}

      {hasPlacedBet && (
        <div className="text-center text-forest-700 font-medium mt-6 pt-6 border-t-2 border-parchment-400 dark:border-gray-600">
          Waiting for other players to bet...
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
              message: message.trim()
            });
            // Trigger new message callback for sound effects
            onNewChatMessage({
              playerId: currentPlayerId,
              playerName: currentPlayer?.name || 'Unknown',
              message: message.trim(),
              timestamp: Date.now(),
              teamId: currentPlayer?.teamId || null
            });
          }}
          title="💬 Game Chat"
        />
      )}
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
// Only re-render when bets, players, or critical props change
export const BettingPhase = memo(BettingPhaseComponent);
