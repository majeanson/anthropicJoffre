/**
 * PlayerHand Component - Multi-Skin Edition
 *
 * Renders player's hand with card dealing animation and keyboard navigation.
 * Uses CSS variables for skin compatibility.
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
    // When currentTrick.length === 4, the previous trick is still displayed for 2 seconds,
    // but we're actually leading a new trick (all cards are playable)
    // When currentTrick.length === 0, we're also leading (all cards are playable)
    if (currentTrick.length === 0 || currentTrick.length === 4) return hand;

    const ledSuit = currentTrick[0].card.color;
    const hasLedSuit = hand.some((c) => c.color === ledSuit);

    if (hasLedSuit) {
      return hand.filter((c) => c.color === ledSuit);
    }

    return hand;
  }, [isCurrentTurn, hand, currentTrick]);

  // Check if specific card is playable
  const isCardPlayable = useCallback(
    (card: CardType) => {
      return playableCards.some((c) => c.color === card.color && c.value === card.value);
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
        setDealingCardIndex((prev) => {
          if (prev >= hand.length - 1) {
            clearInterval(interval);
            setTimeout(() => setShowDealingAnimation(false), 300);
            return prev;
          }
          sounds.cardDeal();
          return prev + 1;
        });
      }, 120);

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
    if (hand.length === 0) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // When it's your turn: only navigate playable cards
      // When it's NOT your turn: navigate all cards (for queuing)
      const navigableCardsIndexes = isCurrentTurn
        ? hand
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => isCardPlayable(card))
            .map(({ index }) => index)
        : hand.map((_, index) => index);

      if (navigableCardsIndexes.length === 0) return;

      // Arrow keys: navigate through cards
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        sounds.cardDeal();

        if (selectedCardIndex === null) {
          setSelectedCardIndex(navigableCardsIndexes[0]);
        } else {
          const currentPos = navigableCardsIndexes.indexOf(selectedCardIndex);

          if (e.key === 'ArrowRight') {
            const nextPos = (currentPos + 1) % navigableCardsIndexes.length;
            setSelectedCardIndex(navigableCardsIndexes[nextPos]);
          } else {
            const prevPos =
              (currentPos - 1 + navigableCardsIndexes.length) % navigableCardsIndexes.length;
            setSelectedCardIndex(navigableCardsIndexes[prevPos]);
          }
        }
      }
      // Tab: cycle through cards
      else if (e.key === 'Tab') {
        e.preventDefault();
        sounds.cardDeal();

        if (selectedCardIndex === null || navigableCardsIndexes.length === 0) {
          setSelectedCardIndex(navigableCardsIndexes[0]);
        } else {
          const currentPos = navigableCardsIndexes.indexOf(selectedCardIndex);
          const nextPos = e.shiftKey
            ? (currentPos - 1 + navigableCardsIndexes.length) % navigableCardsIndexes.length
            : (currentPos + 1) % navigableCardsIndexes.length;
          setSelectedCardIndex(navigableCardsIndexes[nextPos]);
        }
      }
      // Enter or Space: play/queue selected card
      else if ((e.key === 'Enter' || e.key === ' ') && selectedCardIndex !== null) {
        e.preventDefault();
        const card = hand[selectedCardIndex];
        if (!card) return;

        // If it's your turn: play the card (if playable)
        if (isCurrentTurn) {
          if (isCardPlayable(card)) {
            sounds.cardPlay();
            handleCardClick(card);
            setSelectedCardIndex(null);
          }
        } else {
          // If NOT your turn: queue the card
          sounds.cardDeal();
          handleCardClick(card);
        }
      }
      // Number keys 1-9: quick select card by position
      else if (e.key >= '1' && e.key <= '9') {
        const cardIndex = parseInt(e.key) - 1;
        if (cardIndex < hand.length && navigableCardsIndexes.includes(cardIndex)) {
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

  // Scroll selected card into view
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
      <div className="md:max-w-6xl lg:max-w-7xl md:mx-auto px-2 md:px-6 lg:px-8 z-10">
        <div
          className="rounded-[var(--radius-xl)] p-4 border-2 border-skin-accent bg-skin-secondary backdrop-blur-xl shadow-2xl"
          data-testid="player-hand"
        >
          <div className="text-center py-8">
            <div className="inline-block rounded-[var(--radius-lg)] px-6 py-3 border-2 border-skin-default bg-skin-tertiary shadow-[var(--shadow-glow)]">
              <span className="text-base font-semibold flex items-center gap-2 text-skin-secondary">
                <span aria-hidden="true">🔒</span> Hands Hidden
              </span>
              <p className="text-sm mt-1.5 text-skin-muted">Spectator Mode</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hand.length === 0) {
    return null;
  }

  // Create combined hand: actual hand + card in transition
  const displayHand = [...hand];
  if (
    cardInTransition &&
    !hand.some((c) => c.color === cardInTransition.color && c.value === cardInTransition.value)
  ) {
    displayHand.push(cardInTransition);
  }

  return (
    <div className="md:max-w-6xl lg:max-w-7xl md:mx-auto px-1 sm:px-2 md:px-6 lg:px-8 z-[11] overflow-visible">
      <div
        className="rounded-[var(--radius-xl)] p-2 sm:p-4 border-2 border-skin-accent bg-skin-secondary shadow-[var(--shadow-glow)] backdrop-blur-xl overflow-visible touch-manipulation"
        data-testid="player-hand"
      >
        <div className="overflow-x-auto overflow-y-visible md:overflow-visible -mx-1 sm:-mx-2 md:mx-0 px-1 sm:px-2 md:px-0 pt-4 sm:pt-6 -mt-2 sm:-mt-4 pb-2 scrollbar-none">
          <div className="flex gap-0.5 sm:gap-2 md:gap-4 lg:gap-6 md:flex-wrap justify-center min-w-min px-1 sm:px-2">
            {displayHand.map((card, index) => {
              const playable = isCardPlayable(card);
              const isCardDealt = showDealingAnimation && index <= dealingCardIndex;
              const dealDelay = index * 120;
              const isTransitioning =
                cardInTransition &&
                card.color === cardInTransition.color &&
                card.value === cardInTransition.value;
              const isSelected = selectedCardIndex === index;
              const isQueued = isCardQueued(card);

              return (
                <div
                  key={`${card.color}-${card.value}-${index}`}
                  ref={(el) => {
                    cardRefs.current[index] = el;
                  }}
                  className={`relative flex-shrink-0 md:flex-shrink transition-all duration-200 overflow-visible ${
                    showDealingAnimation && !isCardDealt
                      ? 'opacity-0 scale-50'
                      : isTransitioning
                        ? 'opacity-0 motion-safe:animate-card-play-arc'
                        : 'opacity-100 scale-100'
                  } ${isSelected || isQueued ? '-translate-y-2 scale-110' : ''}`}
                  style={{
                    transition: isTransitioning
                      ? 'opacity 400ms ease-out, transform 400ms ease-out'
                      : `opacity 300ms ease-out ${dealDelay}ms, transform 300ms ease-out ${dealDelay}ms`,
                    zIndex: isQueued ? 9999 : 'auto',
                  }}
                >
                  {/* Selection indicator ring */}
                  {isSelected && (
                    <div className="absolute -inset-2 rounded-lg animate-pulse pointer-events-none z-10 shadow-[0_0_0_4px_var(--color-info)]" />
                  )}
                  {/* Queued indicator - pulsing ring and badge */}
                  {isQueued && (
                    <>
                      <div className="absolute -inset-2 rounded-lg animate-pulse pointer-events-none z-20 shadow-[0_0_0_4px_var(--color-warning)]" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs md:text-sm font-bold px-3 py-1 rounded-full shadow-2xl z-30 whitespace-nowrap border-2 pointer-events-none bg-warning text-skin-primary border-warning">
                        QUEUED
                      </div>
                    </>
                  )}
                  <CardComponent
                    card={card}
                    size="small"
                    onClick={(e) => handleCardClick(card, e)}
                    disabled={isCurrentTurn ? !playable || !!isTransitioning : false}
                    isPlayable={isCurrentTurn ? playable && isCurrentTurn : !isQueued}
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
