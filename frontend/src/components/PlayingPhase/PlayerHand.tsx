/**
 * PlayerHand Component - Multi-Skin Edition
 *
 * Renders player's hand with card dealing animation and keyboard navigation.
 * Uses CSS variables for skin compatibility.
 *
 * Mobile: Adaptive layout based on card count
 * - When cards fit: Horizontal row with all cards visible (straight, no overlap)
 * - When cards don't fit: Fan-style with swipe navigation
 * - Cards are always straight (no rotation)
 * - Uses full available width
 *
 * Desktop: Traditional grid layout with wrapping
 *
 * Refactored to use extracted hooks:
 * - useCardPlayability: Card playability logic
 * - useHandKeyboardNav: Keyboard navigation
 * - useHandSwipeNav: Mobile swipe navigation
 * - useDealingAnimation: Card dealing animation
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Card as CardComponent } from '../Card';
import { Card as CardType } from '../../types/game';
import { sounds } from '../../utils/sounds';
import type { PlayerHandProps } from './types';
import { useCardPlayability } from './useCardPlayability';
import { useHandKeyboardNav } from './useHandKeyboardNav';
import { useHandSwipeNav } from './useHandSwipeNav';
import { useDealingAnimation } from './useDealingAnimation';

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
  trump,
}: PlayerHandProps) {
  const [cardInTransition, setCardInTransition] = useState<CardType | null>(null);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const handContainerRef = useRef<HTMLDivElement>(null);

  // Use extracted hooks
  const { isCardPlayable, isCardQueued, isCardTrump, getDisabledReason } = useCardPlayability({
    hand,
    isCurrentTurn,
    currentTrick,
    trump,
    queuedCard,
  });

  const { showDealingAnimation, dealingCardIndex } = useDealingAnimation({
    cardCount: hand.length,
    roundNumber,
    animationsEnabled,
  });

  const {
    focusedCardIndex,
    previewCardIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleCardFocus,
  } = useHandSwipeNav({ cardCount: hand.length });

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

  // Use keyboard navigation hook
  const { selectedCardIndex } = useHandKeyboardNav({
    hand,
    isCurrentTurn,
    currentPlayerIndex,
    isCardPlayable,
    onCardClick: handleCardClick,
    cardRefs,
  });

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

  // Calculate if all cards fit in a row (for mobile layout decision)
  const cardWidth = 70;
  const cardGap = 8;
  const containerPadding = 32;
  const availableWidth = typeof window !== 'undefined' ? window.innerWidth - containerPadding : 360;
  const totalCardsWidth = displayHand.length * cardWidth + (displayHand.length - 1) * cardGap;
  const allCardsFit = totalCardsWidth <= availableWidth;

  return (
    <div className="md:max-w-6xl lg:max-w-7xl md:mx-auto px-1 sm:px-2 md:px-6 lg:px-8 z-[11] overflow-visible">
      <div
        className="rounded-[var(--radius-xl)] p-2 sm:p-4 border-2 border-skin-accent bg-skin-secondary shadow-[var(--shadow-glow)] backdrop-blur-xl overflow-visible touch-manipulation"
        data-testid="player-hand"
        ref={handContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile: Adaptive layout - row when cards fit, fan when they don't */}
        <div className="md:hidden relative flex items-end justify-center overflow-visible" style={{ minHeight: allCardsFit ? '140px' : '160px' }}>
          {allCardsFit ? (
            // All cards fit: Show them in a straight row
            <MobileRowLayout
              displayHand={displayHand}
              showDealingAnimation={showDealingAnimation}
              dealingCardIndex={dealingCardIndex}
              cardInTransition={cardInTransition}
              selectedCardIndex={selectedCardIndex}
              isCurrentTurn={isCurrentTurn}
              isCardPlayable={isCardPlayable}
              isCardQueued={isCardQueued}
              isCardTrump={isCardTrump}
              getDisabledReason={getDisabledReason}
              handleCardClick={handleCardClick}
              cardRefs={cardRefs}
            />
          ) : (
            // Cards don't fit: Fan-style with swipe navigation
            <MobileFanLayout
              displayHand={displayHand}
              showDealingAnimation={showDealingAnimation}
              dealingCardIndex={dealingCardIndex}
              cardInTransition={cardInTransition}
              selectedCardIndex={selectedCardIndex}
              focusedCardIndex={focusedCardIndex}
              previewCardIndex={previewCardIndex}
              isCurrentTurn={isCurrentTurn}
              isCardPlayable={isCardPlayable}
              isCardQueued={isCardQueued}
              isCardTrump={isCardTrump}
              getDisabledReason={getDisabledReason}
              handleCardClick={handleCardClick}
              handleCardFocus={handleCardFocus}
              cardRefs={cardRefs}
            />
          )}
        </div>

        {/* Desktop: Traditional grid layout */}
        <DesktopGridLayout
          displayHand={displayHand}
          showDealingAnimation={showDealingAnimation}
          dealingCardIndex={dealingCardIndex}
          cardInTransition={cardInTransition}
          selectedCardIndex={selectedCardIndex}
          isCurrentTurn={isCurrentTurn}
          isCardPlayable={isCardPlayable}
          isCardQueued={isCardQueued}
          isCardTrump={isCardTrump}
          getDisabledReason={getDisabledReason}
          handleCardClick={handleCardClick}
          cardRefs={cardRefs}
        />
      </div>
    </div>
  );
});

// ==================== Sub-components for different layouts ====================

interface CardLayoutProps {
  displayHand: CardType[];
  showDealingAnimation: boolean;
  dealingCardIndex: number;
  cardInTransition: CardType | null;
  selectedCardIndex: number | null;
  isCurrentTurn: boolean;
  isCardPlayable: (card: CardType) => boolean;
  isCardQueued: (card: CardType) => boolean;
  isCardTrump: (card: CardType) => boolean;
  getDisabledReason: (card: CardType) => string | undefined;
  handleCardClick: (card: CardType, event?: React.MouseEvent) => void;
  cardRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

interface MobileFanLayoutProps extends CardLayoutProps {
  focusedCardIndex: number;
  previewCardIndex: number | null;
  handleCardFocus: (index: number) => void;
}

/** Mobile row layout when all cards fit */
function MobileRowLayout({
  displayHand,
  showDealingAnimation,
  dealingCardIndex,
  cardInTransition,
  selectedCardIndex,
  isCurrentTurn,
  isCardPlayable,
  isCardQueued,
  isCardTrump,
  getDisabledReason,
  handleCardClick,
  cardRefs,
}: CardLayoutProps) {
  return (
    <div className="flex items-end justify-center gap-2 w-full pb-2">
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
            className={`relative will-change-transform ${
              showDealingAnimation && !isCardDealt
                ? 'opacity-0 scale-50'
                : isTransitioning
                  ? 'opacity-0 -translate-y-20'
                  : ''
            } ${isSelected || isQueued ? '-translate-y-3 scale-110' : ''}`}
            style={{
              zIndex: isQueued ? 9999 : isSelected ? 100 : 'auto',
              opacity: showDealingAnimation && !isCardDealt ? 0 : isTransitioning ? 0 : 1,
              transition: isTransitioning
                ? 'opacity 350ms ease-out, transform 350ms ease-out'
                : `transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out`,
              transitionDelay: showDealingAnimation && !isCardDealt ? `${dealDelay}ms` : '0ms',
            }}
          >
            {/* Glow effect for playable card on current turn */}
            {isCurrentTurn && playable && (
              <div className="absolute -inset-2 rounded-xl bg-green-400/30 animate-pulse pointer-events-none z-0" />
            )}
            {/* Selection indicator ring */}
            {isSelected && (
              <div className="absolute -inset-2 rounded-xl animate-pulse pointer-events-none z-10 shadow-[0_0_0_3px_var(--color-info)]" />
            )}
            {/* Queued indicator */}
            {isQueued && (
              <>
                <div className="absolute -inset-2 rounded-xl animate-pulse pointer-events-none z-20 shadow-[0_0_0_3px_var(--color-warning)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-full shadow-2xl z-30 whitespace-nowrap border-2 pointer-events-none bg-warning text-skin-primary border-warning">
                  QUEUED
                </div>
              </>
            )}
            {/* Trump card indicator */}
            {isCardTrump(card) && !isQueued && !isSelected && (
              <div className="absolute -inset-1 rounded-xl animate-trump-indicator pointer-events-none z-0" />
            )}
            <CardComponent
              card={card}
              size="large"
              onClick={(e) => handleCardClick(card, e)}
              disabled={isCurrentTurn ? !playable || !!isTransitioning : false}
              disabledReason={getDisabledReason(card)}
              isPlayable={isCurrentTurn ? playable : !isQueued}
              isKeyboardSelected={isSelected}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Mobile fan layout with swipe navigation */
function MobileFanLayout({
  displayHand,
  showDealingAnimation,
  dealingCardIndex,
  cardInTransition,
  selectedCardIndex,
  focusedCardIndex,
  previewCardIndex,
  isCurrentTurn,
  isCardPlayable,
  isCardQueued,
  isCardTrump,
  getDisabledReason,
  handleCardClick,
  handleCardFocus,
  cardRefs,
}: MobileFanLayoutProps) {
  return (
    <>
      <div className="relative flex items-end justify-center w-full h-full">
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

          // Use preview index during swipe, otherwise use focused index
          const activeIndex = previewCardIndex !== null ? previewCardIndex : focusedCardIndex;
          const isFocused = activeIndex === index;
          const isPreview = previewCardIndex !== null && previewCardIndex === index;

          // Calculate fan position
          const centerOffset = index - activeIndex;
          const cardVisibleEdge = 60;
          const xOffset = centerOffset * cardVisibleEdge;
          const zIndex = isFocused ? 100 : 50 - Math.abs(centerOffset);
          const scale = isFocused ? 1.15 : 0.9;
          const yOffset = isFocused ? -16 : 0;
          const opacity = isFocused ? 1 : 0.85;

          return (
            <div
              key={`${card.color}-${card.value}-${index}`}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`absolute bottom-4 will-change-transform ${
                showDealingAnimation && !isCardDealt
                  ? 'opacity-0 scale-50'
                  : isTransitioning
                    ? 'opacity-0 -translate-y-20'
                    : ''
              }`}
              style={{
                transform: `translateX(${xOffset}px) translateY(${yOffset}px) scale(${scale})`,
                zIndex: isQueued ? 9999 : zIndex,
                opacity: showDealingAnimation && !isCardDealt ? 0 : isTransitioning ? 0 : opacity,
                transition: isTransitioning
                  ? 'opacity 350ms ease-out, transform 350ms ease-out'
                  : `transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease-out`,
                transitionDelay: showDealingAnimation && !isCardDealt ? `${dealDelay}ms` : '0ms',
              }}
              onClick={() => {
                if (!isFocused) {
                  handleCardFocus(index);
                  sounds.cardDeal();
                }
              }}
            >
              {/* Preview indicator during swipe */}
              {isPreview && (
                <div className="absolute -inset-3 rounded-2xl bg-blue-400/50 pointer-events-none z-0 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
              )}
              {/* Glow effect for focused playable card */}
              {isFocused && !isPreview && isCurrentTurn && playable && (
                <div className="absolute -inset-3 rounded-2xl bg-green-400/40 animate-pulse pointer-events-none z-0" />
              )}
              {/* Selection indicator ring */}
              {isSelected && (
                <div className="absolute -inset-3 rounded-2xl animate-pulse pointer-events-none z-10 shadow-[0_0_0_4px_var(--color-info)]" />
              )}
              {/* Queued indicator */}
              {isQueued && (
                <>
                  <div className="absolute -inset-3 rounded-2xl animate-pulse pointer-events-none z-20 shadow-[0_0_0_4px_var(--color-warning)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-bold px-4 py-1.5 rounded-full shadow-2xl z-30 whitespace-nowrap border-2 pointer-events-none bg-warning text-skin-primary border-warning">
                    QUEUED
                  </div>
                </>
              )}
              {/* Trump card indicator */}
              {isCardTrump(card) && !isQueued && !isSelected && !isPreview && (
                <div className="absolute -inset-2 rounded-2xl animate-trump-indicator pointer-events-none z-0" />
              )}
              <CardComponent
                card={card}
                size="large"
                onClick={(e) => {
                  if (isFocused) {
                    handleCardClick(card, e);
                  } else {
                    handleCardFocus(index);
                    sounds.cardDeal();
                  }
                }}
                disabled={isCurrentTurn ? !playable || !!isTransitioning : false}
                disabledReason={getDisabledReason(card)}
                isPlayable={isCurrentTurn ? playable : !isQueued}
                isKeyboardSelected={isSelected}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Desktop grid layout */
function DesktopGridLayout({
  displayHand,
  showDealingAnimation,
  dealingCardIndex,
  cardInTransition,
  selectedCardIndex,
  isCurrentTurn,
  isCardPlayable,
  isCardQueued,
  isCardTrump,
  getDisabledReason,
  handleCardClick,
  cardRefs,
}: CardLayoutProps) {
  return (
    <div className="hidden md:block overflow-x-auto overflow-y-visible md:overflow-visible -mx-1 sm:-mx-2 md:mx-0 px-1 sm:px-2 md:px-0 pt-4 sm:pt-6 -mt-2 sm:-mt-4 pb-2 scrollbar-none">
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
              {/* Queued indicator */}
              {isQueued && (
                <>
                  <div className="absolute -inset-2 rounded-lg animate-pulse pointer-events-none z-20 shadow-[0_0_0_4px_var(--color-warning)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs md:text-sm font-bold px-3 py-1 rounded-full shadow-2xl z-30 whitespace-nowrap border-2 pointer-events-none bg-warning text-skin-primary border-warning">
                    QUEUED
                  </div>
                </>
              )}
              {/* Trump card indicator */}
              {isCardTrump(card) && !isQueued && !isSelected && (
                <div className="absolute -inset-1 rounded-lg animate-trump-indicator pointer-events-none z-0" />
              )}
              <CardComponent
                card={card}
                size="small"
                onClick={(e) => handleCardClick(card, e)}
                disabled={isCurrentTurn ? !playable || !!isTransitioning : false}
                disabledReason={getDisabledReason(card)}
                isPlayable={isCurrentTurn ? playable && isCurrentTurn : !isQueued}
                isKeyboardSelected={isSelected}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
