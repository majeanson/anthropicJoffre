/**
 * Card Component - Midnight Alchemy Edition
 *
 * Playing cards as ancient alchemical artifacts. Each card appears as an
 * illuminated manuscript page with mystical glow effects and copper accents.
 *
 * Design Philosophy:
 * - Cards have parchment-like backgrounds with aged texture
 * - Each suit glows with its elemental color on hover
 * - Special cards (Red 0, Brown 0) pulse with mystical energy
 * - Playable cards levitate with ethereal lighting
 * - Non-playable cards fade into shadow with arcane seal
 *
 * Accessibility:
 * - Full keyboard navigation support
 * - Clear visual feedback for all states
 * - ARIA labels for screen readers
 */

import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card as CardType } from '../../types/game';
import { useCardSkin, useSpecialCardSkins } from '../../contexts/SkinContext';
import { CardTooltip } from './CardTooltip';
import { suitClasses, sizeStyles } from './cardStyles';

interface CardProps {
  card: CardType;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  /** Reason why card is disabled - shown as tooltip */
  disabledReason?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  isPlayable?: boolean;
  isKeyboardSelected?: boolean;
  /** Show card back instead of face */
  faceDown?: boolean;
}

function CardComponent({
  card,
  onClick,
  disabled,
  disabledReason,
  size = 'medium',
  isPlayable = false,
  isKeyboardSelected = false,
  faceDown = false,
}: CardProps) {
  // Tooltip state for disabled card explanations
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<number | null>(null);
  const tooltipId = useRef(`card-tooltip-${Math.random().toString(36).substr(2, 9)}`);

  // Show tooltip with small delay to prevent flicker
  const handleShowTooltip = useCallback(() => {
    if (!disabled || !disabledReason) return;

    tooltipTimeoutRef.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, 200); // 200ms delay before showing
  }, [disabled, disabledReason]);

  // Hide tooltip immediately
  const handleHideTooltip = useCallback(() => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setShowTooltip(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Get card skin for value formatting
  const { cardSkin } = useCardSkin();

  // Get special card skins (Red 0 & Brown 0)
  const { getEquippedSpecialSkin } = useSpecialCardSkins();

  // Memoize expensive calculations
  const isSpecial = useMemo(
    () => (card.color === 'red' || card.color === 'brown') && card.value === 0,
    [card.color, card.value]
  );

  // Get equipped special skin for this card type
  const equippedSpecialSkin = useMemo(() => {
    if (!isSpecial) return null;
    const cardType = card.color === 'red' ? 'red_zero' : 'brown_zero';
    return getEquippedSpecialSkin(cardType);
  }, [isSpecial, card.color, getEquippedSpecialSkin]);

  const suitClass = suitClasses[card.color];
  const sizeConfig = sizeStyles[size];

  // Get formatted value from card skin
  const formattedValue = useMemo(
    () => cardSkin.formatValue(card.value, isSpecial),
    [cardSkin, card.value, isSpecial]
  );

  // Get special card display from card skin
  const specialDisplay = useMemo(() => {
    if (!isSpecial) return null;
    if (card.color === 'red') {
      return cardSkin.specialCards.redBonus;
    }
    return cardSkin.specialCards.brownPenalty;
  }, [isSpecial, card.color, cardSkin]);

  // Get suit-specific style overrides from card skin
  const cardSkinSuitStyle = cardSkin.suits[card.color];

  // Determine which image to show (or use center icon if skin specifies)
  const cardImage = useMemo(() => {
    if (isSpecial) {
      return `/cards/production/${card.color}_bon.jpg`;
    }
    return `/cards/production/${card.color}_emblem.jpg`;
  }, [isSpecial, card.color]);

  // Get center icon from card skin (used when useCenterIcons is true)
  const centerIcon = cardSkinSuitStyle.centerIcon;
  const useCenterIcons = cardSkin.useCenterIcons && !isSpecial;

  // Generate aria-label for accessibility
  const ariaLabel = isSpecial
    ? `${card.color} special card (${card.color === 'red' ? '+5 points' : '-2 points'})`
    : `${card.color} ${card.value}`;

  // Card back design - Alchemical grimoire pattern
  if (faceDown) {
    return (
      <div
        className={`
          ${sizeConfig.container}
          rounded-[var(--radius-lg)]
          flex items-center justify-center
          relative overflow-hidden
          border-solid border-skin-accent
          card-back-bg
        `}
      >
        {/* Alchemical circle pattern */}
        <div className="absolute inset-3 rounded-full border border-skin-accent opacity-20" />
        <div className="absolute inset-5 rounded-full border border-skin-accent opacity-15" />

        {/* Sacred geometry corners */}
        <div className="absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 border-skin-accent opacity-50" />
        <div className="absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 border-skin-accent opacity-50" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 border-skin-accent opacity-50" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-skin-accent opacity-50" />

        {/* Center symbol */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center relative card-center-symbol">
          {/* Triangle inside circle */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 4L21 20H3L12 4Z"
              className="stroke-skin-inverse"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Compute state-based classes
  const stateClasses = useMemo(() => {
    const classes: string[] = ['card-base'];
    if (isPlayable && !disabled) {
      classes.push('card-playable');
    } else if (disabled) {
      classes.push('card-disabled');
    }
    return classes.join(' ');
  }, [isPlayable, disabled]);

  // Special card effect classes (Red 0 = golden glow, Brown 0 = dark aura)
  const specialEffectClass = useMemo(() => {
    if (!isSpecial) return '';
    return card.color === 'red' ? 'card-red-zero-effect' : 'card-brown-zero-effect';
  }, [isSpecial, card.color]);

  // Brown cards get thicker border
  const borderThicknessClass = card.color === 'brown' ? 'border-4' : '';

  // Show tooltip for disabled cards with a reason
  const hasTooltip = disabled && disabledReason;

  return (
    <div className="relative">
      {/* Tooltip for disabled card explanation */}
      {hasTooltip && (
        <CardTooltip
          content={disabledReason}
          isVisible={showTooltip}
        />
      )}

      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={hasTooltip && showTooltip ? tooltipId.current : undefined}
        data-testid={`card-${card.color}-${card.value}`}
        data-card-value={card.value}
        data-card-color={card.color}
        onMouseEnter={handleShowTooltip}
        onMouseLeave={handleHideTooltip}
        onFocus={handleShowTooltip}
        onBlur={handleHideTooltip}
        className={`
          ${sizeConfig.container}
          ${borderThicknessClass}
          ${suitClass.border}
          ${suitClass.borderStyle}
          ${stateClasses}
          ${specialEffectClass}
          rounded-[var(--radius-lg)]
          font-display
          flex flex-col items-center justify-center gap-1
          relative overflow-hidden
          touch-manipulation
          select-none
          ${!disabled && onClick ? 'cursor-pointer active:scale-95 hover:card-playable' : 'cursor-default'}
          ${isKeyboardSelected ? 'ring-[3px] ring-skin-accent ring-offset-2 ring-offset-skin-primary' : ''}
          focus-visible:outline-none
          focus-visible:ring-[3px]
          focus-visible:ring-skin-accent
          focus-visible:ring-offset-2
          focus-visible:ring-offset-skin-primary
        `}
      >
      {/* Parchment texture overlay */}
      <div className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none opacity-40 card-parchment-overlay" />

      {/* Special card particle effects */}
      {isSpecial && card.color === 'red' && (
        <div className="card-red-zero-sparkles" aria-hidden="true" />
      )}
      {isSpecial && card.color === 'brown' && (
        <div className="card-brown-zero-wisps" aria-hidden="true" />
      )}

      {/* Ethereal glow for playable cards */}
      {isPlayable && !disabled && (
        <div
          className={`
            absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none
            ${suitClass.innerGlow}
            animate-[ethereal-pulse_2.5s_ease-in-out_infinite]
          `}
        />
      )}

      {/* Top-left value badge - colored background with white text for high contrast */}
      {!isSpecial && (
        <div
          className={`
            absolute ${sizeConfig.cornerOffset}
            flex items-center justify-center
            rounded-md
            select-none
            px-1
            card-badge
            ${suitClass.badge}
            ${sizeConfig.badgeSize}
          `}
        >
          <span
            className={`font-display ${sizeConfig.cornerText} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}
          >
            {formattedValue}
          </span>
        </div>
      )}

      {/* Center emblem: special skin icon, emoji icon, or image depending on skin */}
      {isSpecial && equippedSpecialSkin?.centerIcon ? (
        // Use special card skin icon for Red 0 / Brown 0
        <div
          className={`
            ${sizeConfig.emblem}
            flex items-center justify-center
            text-3xl md:text-4xl
            ${equippedSpecialSkin.animationClass || ''}
            ${isPlayable ? 'card-emblem-playable' : ''}
          `}
        >
          {equippedSpecialSkin.centerIcon}
        </div>
      ) : useCenterIcons ? (
        <div
          className={`
            ${sizeConfig.emblem}
            flex items-center justify-center
            text-3xl md:text-4xl
            ${isPlayable ? 'card-emblem-playable' : ''}
          `}
        >
          {centerIcon}
        </div>
      ) : (
        <img
          src={cardImage}
          alt={`${card.color} ${isSpecial ? 'bon' : 'emblem'}`}
          decoding="async"
          loading="lazy"
          className={`
            ${sizeConfig.emblem}
            object-contain
            ${isSpecial ? '' : 'opacity-85'}
            ${isPlayable ? 'card-emblem-playable-drop-shadow' : 'card-emblem-drop-shadow'}
          `}
        />
      )}

      {/* Bottom-right value badge (rotated) - colored background with white text */}
      {!isSpecial && (
        <div
          className={`
            absolute ${sizeConfig.cornerOffsetBottom}
            flex items-center justify-center
            rounded-md
            rotate-180
            select-none
            px-1
            card-badge
            ${suitClass.badge}
            ${sizeConfig.badgeSize}
          `}
        >
          <span
            className={`font-display ${sizeConfig.cornerText} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]`}
          >
            {formattedValue}
          </span>
        </div>
      )}

      {/* Special card badge with transmutation glow */}
      {isSpecial && specialDisplay && (
        <span
          className={`
            absolute top-0.5 right-0.5
            ${sizeConfig.badge}
            font-display font-bold
            rounded-[var(--radius-sm)]
            text-skin-inverse
            ${card.color === 'red' ? 'card-special-badge-success' : 'card-special-badge-error'}
          `}
        >
          {specialDisplay.label}
        </span>
      )}

      {/* Disabled overlay with seal */}
      {disabled && onClick && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] card-disabled-overlay">
          <div className="w-10 h-10 rounded-full flex items-center justify-center card-disabled-seal">
            <span className="font-display text-xl font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              ✕
            </span>
          </div>
        </div>
      )}
      </button>
    </div>
  );
}

// Custom comparison function for React.memo
function arePropsEqual(prevProps: CardProps, nextProps: CardProps) {
  return (
    prevProps.card.color === nextProps.card.color &&
    prevProps.card.value === nextProps.card.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.disabledReason === nextProps.disabledReason &&
    prevProps.size === nextProps.size &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.isPlayable === nextProps.isPlayable &&
    prevProps.isKeyboardSelected === nextProps.isKeyboardSelected &&
    prevProps.faceDown === nextProps.faceDown
  );
}

// Export memoized component for better performance
export const Card = memo(CardComponent, arePropsEqual);
export default Card;
