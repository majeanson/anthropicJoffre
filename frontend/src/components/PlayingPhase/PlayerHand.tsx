/**
 * PlayerHand Component
 * Renders player's hand with card dealing animation, keyboard navigation,
 * and card click handlers
 *
 * Extracted from PlayingPhase.tsx (lines 209-235, 333-422, 451-511, 1024-1121)
 * Part of Sprint: PlayingPhase.tsx split into focused components
 */

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Card as CardComponent } from '../Card';
import { Card as CardType, TrickCard } from '../../types/game';
import { sounds } from '../../utils/sounds';

export interface PlayerHandProps {
  hand: CardType[];
  isCurrentTurn: boolean;
  currentTrick: TrickCard[];
  currentPlayerIndex: number;
  roundNumber: number;
  animationsEnabled: boolean;
  isSpectator: boolean;
  onPlayCard: (card: CardType) => void;
  onSetPlayEffect?: (effect: { card: CardType; position: { x: number; y: number } } | null) => void;
  queuedCard?: CardType | null;
  onQueueCard?: (card: CardType | null) => void;
}

export const PlayerHand = memo(function PlayerHand({
  hand,
  isCurrentTurn,
  currentTrick,
  currentPlayerIndex,
  roundNumber,
  animationsEnabled,
  isSpectator,
  onPlayCard,
  onSetPlayEffect,
  queuedCard,
  onQueueCard,
}: PlayerHandProps) {
  const [showDealingAnimation, setShowDealingAnimation] = useState(false);
  const [dealingCardIndex, setDealingCardIndex] = useState(0);
  const [cardInTransition, setCardInTransition] = useState<CardType | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate playable cards (suit-following rules)
  const playableCards = useMemo(() => {
    if (!isCurrentTurn) return [];
    if (currentTrick.length === 0) return hand;

    const ledSuit = currentTrick[0].card.color;
    const hasLedSuit = hand.some(c => c.color === ledSuit);

    if (hasLedSuit) {
      return hand.filter(c => c.color === ledSuit);
    }

    return hand;
  }, [isCurrentTurn, hand, currentTrick]);

  // Check if specific card is playable
  const isCardPlayable = useCallback(
    (card: CardType) => {
      return playableCards.some(c => c.color === card.color && c.value === card.value);
    },
    [playableCards]
  );

  // Check if a card is queued
  const isCardQueued = useCallback(
    (card: CardType) => {
      return queuedCard?.color === card.color && queuedCard?.value === card.value;
    },
    [queuedCard]
  );

  // Handle card click with debouncing and validation
  const handleCardClick = useCallback(
    (card: CardType, event?: React.MouseEvent) => {
      // Debounce: prevent rapid clicks
      if (isPlayingCard) return;

      // If NOT current turn, handle queue logic
      if (!isCurrentTurn) {
        if (onQueueCard) {
          onQueueCard(card);
        }
        return;
      }

      // Validation for playing
      if (!isCardPlayable(card)) return;

      // Set transition state
      setIsPlayingCard(true);
      setCardInTransition(card);

      // Play sound + visual effect
      sounds.cardConfirm(card.value);

      if (event && onSetPlayEffect) {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        onSetPlayEffect({ card, position });

        // Clear play effect after animation
        setTimeout(() => onSetPlayEffect(null), 800);
      }

      // Emit socket event
      onPlayCard(card);

      // Clear transition after animation
      setTimeout(() => {
        setCardInTransition(null);
        setIsPlayingCard(false);
      }, 450);
    },
    [isPlayingCard, isCurrentTurn, isCardPlayable, onPlayCard, onSetPlayEffect, onQueueCard]
  );

  // Dealing animation on new round
  useEffect(() => {
    if (animationsEnabled && hand.length > 0 && !showDealingAnimation) {
      setShowDealingAnimation(true);
      setDealingCardIndex(0);

      sounds.roundStart();

      const interval = setInterval(() => {
        setDealingCardIndex(prev => {
          if (prev >= hand.length - 1) {
            clearInterval(interval);
            setTimeout(() => setShowDealingAnimation(false), 300);
            return prev;
          }
          sounds.cardDeal();
          return prev + 1;
        });
      }, 120); // Stagger animation for each card

      return () => clearInterval(interval);
    }
  }, [roundNumber, animationsEnabled, hand.length]);

  // Reset card-in-transition when new trick starts
  useEffect(() => {
    if (currentTrick.length === 0) {
      setCardInTransition(null);
    }
  }, [currentTrick.length, roundNumber]);

  // Reset isPlayingCard on turn change
  useEffect(() => {
    if (!isCurrentTurn) setIsPlayingCard(false);
  }, [isCurrentTurn]);

  // Reset isPlayingCard on trick change
  useEffect(() => {
    setIsPlayingCard(false);
  }, [currentTrick.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isCurrentTurn || hand.length === 0) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const playableCardsIndexes = hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => isCardPlayable(card))
        .map(({ index }) => index);

      if (playableCardsIndexes.length === 0) return;

      // Arrow keys: navigate through playable cards
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        sounds.cardDeal();

        if (selectedCardIndex === null) {
          setSelectedCardIndex(playableCardsIndexes[0]);
        } else {
          const currentPos = playableCardsIndexes.indexOf(selectedCardIndex);

          if (e.key === 'ArrowRight') {
            const nextPos = (currentPos + 1) % playableCardsIndexes.length;
            setSelectedCardIndex(playableCardsIndexes[nextPos]);
          } else {
            const prevPos =
              (currentPos - 1 + playableCardsIndexes.length) % playableCardsIndexes.length;
            setSelectedCardIndex(playableCardsIndexes[prevPos]);
          }
        }
      }
      // Tab: cycle through playable cards
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
        const card = hand[selectedCardIndex];
        if (card && playableCardsIndexes.includes(selectedCardIndex)) {
          sounds.cardPlay();
          handleCardClick(card);
          setSelectedCardIndex(null);
        }
      }
      // Number keys 1-9: quick select card by position
      else if (e.key >= '1' && e.key <= '9') {
        const cardIndex = parseInt(e.key) - 1;
        if (cardIndex < hand.length && playableCardsIndexes.includes(cardIndex)) {
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
  }, [isCurrentTurn, hand, selectedCardIndex, currentTrick, isCardPlayable, handleCardClick]);

  // Reset selection when turn changes
  useEffect(() => {
    setSelectedCardIndex(null);
  }, [currentPlayerIndex]);

  // Scroll selected card into view (for keyboard navigation on mobile)
  useEffect(() => {
    if (selectedCardIndex !== null && cardRefs.current[selectedCardIndex]) {
      cardRefs.current[selectedCardIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedCardIndex]);

  if (isSpectator) {
    return (
      <div className="md:max-w-6xl lg:max-w-7xl md:mx-auto px-2 md:px-6 lg:px-8 pb-2 md:pb-6 lg:pb-8 z-10">
        <div
          className="bg-umber-900/40 backdrop-blur-xl rounded-2xl p-2 md:p-4 lg:p-6 shadow-2xl border-2 border-parchment-400 dark:border-gray-600"
          data-testid="player-hand"
        >
          <div className="text-center py-8">
            <div className="inline-block bg-gradient-to-br from-parchment-100 to-parchment-50 px-6 py-4 rounded-xl border-2 border-parchment-400 dark:border-gray-600 shadow-lg">
              <span className="text-umber-800 dark:text-gray-200 text-base font-semibold">
                🔒 Hands Hidden
              </span>
              <p className="text-umber-600 dark:text-gray-400 text-sm mt-1.5">Spectator Mode</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hand.length === 0) {
    return null;
  }

  // Create combined hand: actual hand + card in transition (if it's no longer in hand)
  const displayHand = [...hand];
  if (
    cardInTransition &&
    !hand.some(c => c.color === cardInTransition.color && c.value === cardInTransition.value)
  ) {
    displayHand.push(cardInTransition);
  }

  return (
    <div className="md:max-w-6xl lg:max-w-7xl md:mx-auto px-2 md:px-6 lg:px-8 pb-2 md:pb-6 lg:pb-8 z-10">
      <div
        className="bg-umber-900/40 backdrop-blur-xl rounded-2xl p-2 md:p-4 lg:p-6 shadow-2xl border-2 border-parchment-400 dark:border-gray-600"
        data-testid="player-hand"
      >
        <div className="overflow-x-auto md:overflow-x-visible -mx-2 md:mx-0 px-2 md:px-0">
          <div className="flex gap-2 md:gap-4 lg:gap-6 md:flex-wrap justify-center min-w-min">
            {displayHand.map((card, index) => {
              const playable = isCardPlayable(card);
              const isCardDealt = showDealingAnimation && index <= dealingCardIndex;
              const dealDelay = index * 120; // Stagger animation for each card
              const isTransitioning =
                cardInTransition &&
                card.color === cardInTransition.color &&
                card.value === cardInTransition.value;
              const isSelected = selectedCardIndex === index;
              const isQueued = isCardQueued(card);

              return (
                <div
                  key={`${card.color}-${card.value}-${index}`}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  className={`relative flex-shrink-0 md:flex-shrink transition-all duration-200 ${
                    showDealingAnimation && !isCardDealt
                      ? 'opacity-0 scale-50'
                      : isTransitioning
                      ? 'opacity-0 motion-safe:animate-card-play-arc'
                      : 'opacity-100 scale-100'
                  }
                            ${isSelected || isQueued ? '-translate-y-4 scale-110' : ''}`}
                  style={{
                    transition: isTransitioning
                      ? 'opacity 400ms ease-out, transform 400ms ease-out'
                      : `opacity 300ms ease-out ${dealDelay}ms, transform 300ms ease-out ${dealDelay}ms`,
                  }}
                >
                  {/* Selection indicator ring */}
                  {isSelected && (
                    <div className="absolute -inset-2 rounded-lg ring-4 ring-blue-500 dark:ring-blue-400 animate-pulse pointer-events-none" />
                  )}
                  {/* Queued indicator - pulsing gold ring and badge */}
                  {isQueued && (
                    <>
                      <div className="absolute -inset-2 rounded-lg ring-4 ring-yellow-400 dark:ring-yellow-500 animate-pulse pointer-events-none z-10" />
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-20 whitespace-nowrap">
                        QUEUED
                      </div>
                    </>
                  )}
                  <CardComponent
                    card={card}
                    size="small"
                    onClick={e => handleCardClick(card, e)}
                    disabled={isCurrentTurn ? (!playable || !!isTransitioning) : false}
                    isPlayable={isCurrentTurn ? (playable && isCurrentTurn) : !isQueued}
                    isKeyboardSelected={isSelected}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
