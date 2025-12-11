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
 *
 * Styling:
 * - Uses CSS classes from index.css (card-*, border-suit-*, etc.)
 * - No inline styles - all styling via Tailwind or CSS classes
 */

import { memo, useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Card as CardType, CardColor } from '../types/game';
import { useCardSkin, useSpecialCardSkins } from '../contexts/SkinContext';

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

// Suit-specific CSS class mappings
const suitClasses: Record<
  CardColor,
  {
    border: string;
    innerGlow: string;
    badge: string;
    borderStyle: string;
  }
> = {
  red: {
    border: 'border-suit-red',
    innerGlow: 'card-inner-glow-red',
    badge: 'card-badge-red',
    borderStyle: 'border-solid',
  },
  brown: {
    border: 'border-suit-brown',
    innerGlow: 'card-inner-glow-brown',
    badge: 'card-badge-brown',
    borderStyle: 'border-double',
  },
  green: {
    border: 'border-suit-green',
    innerGlow: 'card-inner-glow-green',
    badge: 'card-badge-green',
    borderStyle: 'border-solid',
  },
  blue: {
    border: 'border-suit-blue',
    innerGlow: 'card-inner-glow-blue',
    badge: 'card-badge-blue',
    borderStyle: 'border-solid',
  },
};

// Size configurations - all Tailwind classes, no inline styles
// Note: Badge text minimum 10px on mobile for readability (WCAG)
const sizeStyles = {
  tiny: {
    container: 'w-[2.75rem] h-[4rem] sm:w-12 sm:h-20 border-2',
    text: 'text-base',
    cornerText: 'text-sm font-black',
    emblem: 'w-6 h-6 sm:w-6 sm:h-6',
    badge: 'text-[10px] sm:text-[10px] px-1 py-0.5',
    badgeSize: 'min-w-[18px] h-[18px]',
    cornerOffset: 'top-0.5 left-0.5',
    cornerOffsetBottom: 'bottom-0.5 right-0.5',
  },
  small: {
    container: 'w-[3.25rem] h-[5rem] sm:w-16 sm:h-24 md:w-16 md:h-28 border-2',
    text: 'text-base sm:text-lg',
    cornerText: 'text-sm sm:text-base font-black',
    emblem: 'w-8 h-8 sm:w-10 sm:h-10 md:w-10 md:h-10',
    badge: 'text-[10px] sm:text-xs px-1 py-0.5',
    badgeSize: 'min-w-[22px] h-[22px]',
    cornerOffset: 'top-0.5 left-1 sm:top-1 sm:left-1.5',
    cornerOffsetBottom: 'bottom-0.5 right-1 sm:bottom-1 sm:right-1.5',
  },
  medium: {
    container: 'w-[4rem] h-[6rem] sm:w-20 sm:h-32 md:w-20 md:h-32 border-2',
    text: 'text-lg sm:text-2xl',
    cornerText: 'text-base sm:text-lg font-black',
    emblem: 'w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12',
    badge: 'text-[11px] sm:text-xs px-1 sm:px-1.5 py-0.5',
    badgeSize: 'min-w-[26px] h-[26px]',
    cornerOffset: 'top-0.5 left-1 sm:top-1 sm:left-1.5',
    cornerOffsetBottom: 'bottom-0.5 right-1 sm:bottom-1 sm:right-1.5',
  },
  large: {
    container: 'w-[5rem] h-[7.5rem] sm:w-24 sm:h-36 md:w-24 md:h-36 border-[3px]',
    text: 'text-xl sm:text-3xl',
    cornerText: 'text-lg sm:text-xl font-black',
    emblem: 'w-12 h-12 sm:w-16 sm:h-16 md:w-16 md:h-16',
    badge: 'text-xs sm:text-sm px-1.5 sm:px-2 py-0.5',
    badgeSize: 'min-w-[26px] h-[26px]',
    cornerOffset: 'top-1 left-1.5 sm:top-1.5 sm:left-2',
    cornerOffsetBottom: 'bottom-1 right-1.5 sm:bottom-1.5 sm:right-2',
  },
};

// ============================================================================
// CARD TOOLTIP COMPONENT (for disabled card explanations)
// ============================================================================

interface CardTooltipProps {
  content: string;
  isVisible: boolean;
}

function CardTooltip({ content, isVisible }: CardTooltipProps) {
  if (!isVisible) return null;

  return (
    <div
      role="tooltip"
      className={`
        absolute z-50
        bottom-full left-1/2 -translate-x-1/2 mb-2
        px-3 py-2
        text-xs sm:text-sm font-medium
        rounded-lg
        whitespace-nowrap
        pointer-events-none
        transition-all duration-200
        border-2 border-solid
        bg-error text-white border-error
        shadow-lg
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}
      `}
    >
      {content}
      {/* Arrow pointing down */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--color-error)',
        }}
      />
    </div>
  );
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

// ============================================================================
// CARD BACK COMPONENT (for opponent hands)
// ============================================================================

interface CardBackProps {
  size?: 'tiny' | 'small' | 'medium' | 'large';
  /** Optional team color tint */
  teamColor?: 1 | 2;
}

export function CardBack({ size = 'medium', teamColor }: CardBackProps) {
  const sizeConfig = sizeStyles[size];

  // Determine team-specific classes
  const teamBorderClass =
    teamColor === 1
      ? 'border-skin-team1-primary'
      : teamColor === 2
        ? 'border-skin-team2-primary'
        : 'border-skin-accent';
  const teamBackClass =
    teamColor === 1 ? 'card-back-team1' : teamColor === 2 ? 'card-back-team2' : 'card-back-bg';
  const teamSymbolClass =
    teamColor === 1
      ? 'card-center-symbol-team1'
      : teamColor === 2
        ? 'card-center-symbol-team2'
        : 'card-center-symbol';

  return (
    <div
      className={`
        ${sizeConfig.container}
        rounded-[var(--radius-lg)]
        flex items-center justify-center
        relative overflow-hidden
        border-solid
        ${teamBorderClass}
        ${teamBackClass}
      `}
    >
      {/* Alchemical circle pattern */}
      <div className={`absolute inset-3 rounded-full border ${teamBorderClass} opacity-20`} />

      {/* Sacred geometry corners */}
      <div
        className={`absolute top-1 left-1 w-3 h-3 border-l-2 border-t-2 ${teamBorderClass} opacity-50`}
      />
      <div
        className={`absolute top-1 right-1 w-3 h-3 border-r-2 border-t-2 ${teamBorderClass} opacity-50`}
      />
      <div
        className={`absolute bottom-1 left-1 w-3 h-3 border-l-2 border-b-2 ${teamBorderClass} opacity-50`}
      />
      <div
        className={`absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 ${teamBorderClass} opacity-50`}
      />

      {/* Center symbol */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${teamSymbolClass}`}>
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

// ============================================================================
// CARD STACK COMPONENT (for deck visualization)
// ============================================================================

interface CardStackProps {
  count: number;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  maxVisible?: number;
}

export function CardStack({ count, size = 'medium', maxVisible = 5 }: CardStackProps) {
  const visibleCards = Math.min(count, maxVisible);

  return (
    <div className="relative">
      {Array.from({ length: visibleCards }).map((_, index) => (
        <div
          key={index}
          className="absolute card-stack-offset"
          style={{ '--stack-index': index } as React.CSSProperties}
        >
          <CardBack size={size} />
        </div>
      ))}

      {/* Card count badge */}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center font-display text-xs font-bold card-count-badge">
          {count}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ELEGANT CARD DISPLAY (for showcasing single cards)
// ============================================================================

interface ElegantCardDisplayProps {
  card: CardType;
  size?: 'small' | 'medium' | 'large';
  /** Add dramatic spotlight effect */
  spotlight?: boolean;
}

export function ElegantCardDisplay({
  card,
  size = 'medium',
  spotlight = false,
}: ElegantCardDisplayProps) {
  return (
    <div className="relative inline-block">
      {/* Spotlight effect */}
      {spotlight && (
        <div className="absolute -inset-10 rounded-full pointer-events-none card-spotlight" />
      )}
      <Card card={card} size={size} />
    </div>
  );
}

export default Card;
