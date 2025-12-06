/**
 * Card Skin Selector Component
 *
 * Allows users to select and preview different card skins.
 * Shows lock status based on player level with unlock requirements.
 *
 * Features:
 * - Grid layout showing all card skins
 * - Live preview with sample cards
 * - Lock indicators for level-gated skins
 * - Current selection highlighting
 */

import { useState, useEffect } from 'react';
import { useCardSkin } from '../contexts/SkinContext';
import { CardSkin, CardSkinId } from '../config/cardSkins';
import { Card } from './Card';
import { Card as CardType } from '../types/game';
import { UIBadge } from './ui/UIBadge';
import { sounds } from '../utils/sounds';

// ============================================================================
// CARD SKIN CARD COMPONENT
// ============================================================================

interface CardSkinCardProps {
  cardSkin: CardSkin;
  isSelected: boolean;
  isLocked: boolean;
  requiredLevel: number;
  currentLevel: number;
  onSelect: (id: CardSkinId) => void;
  justSelected?: boolean; // Animation trigger
}

function CardSkinCard({
  cardSkin,
  isSelected,
  isLocked,
  requiredLevel,
  currentLevel,
  onSelect,
  justSelected = false,
}: CardSkinCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSelectFlash, setShowSelectFlash] = useState(false);

  // Trigger flash animation when justSelected changes to true
  useEffect(() => {
    if (justSelected) {
      setShowSelectFlash(true);
      const timer = setTimeout(() => setShowSelectFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [justSelected]);

  // Sample cards for preview
  const sampleCards = [
    { color: 'red' as const, value: 5 },
    { color: 'blue' as const, value: 7 },
    { color: 'green' as const, value: 3 },
  ];

  return (
    <button
      onClick={() => !isLocked && onSelect(cardSkin.id)}
      disabled={isLocked}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative
        w-full
        p-4
        rounded-[var(--radius-lg)]
        border-2
        transition-all duration-[var(--duration-normal)]
        text-left
        ${isLocked
          ? 'opacity-70 cursor-not-allowed border-[var(--color-border-default)]'
          : isSelected
            ? 'border-[var(--color-text-accent)] shadow-[0_0_20px_var(--color-glow)] scale-[1.02]'
            : 'border-[var(--color-border-default)] hover:border-[var(--color-border-accent)] hover:scale-[1.01]'
        }
        bg-[var(--color-bg-secondary)]
        focus-visible:outline-none
        focus-visible:ring-[var(--input-focus-ring-width)]
        focus-visible:ring-[var(--color-text-accent)]
        overflow-hidden
      `}
    >
      {/* Selection flash overlay */}
      {showSelectFlash && (
        <div
          className="absolute inset-0 z-20 pointer-events-none rounded-[var(--radius-lg)]"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
            animation: 'skinSelectFlash 0.6s ease-out forwards',
          }}
        />
      )}

      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-black/50 z-10">
          <span className="text-4xl mb-2">🔒</span>
          <p className="text-sm text-white font-bold">Level {requiredLevel}</p>
          <p className="text-xs text-gray-300 mt-1">
            {requiredLevel - currentLevel} levels to unlock
          </p>
        </div>
      )}

      {/* Premium badge */}
      {cardSkin.isPremium && !isLocked && (
        <div className="absolute top-2 left-2 z-10">
          <UIBadge variant="solid" color="warning" size="xs">
            ✨ Premium
          </UIBadge>
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && !isLocked && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center z-10">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Preview area */}
      <div
        className="rounded-[var(--radius-md)] p-3 mb-3 flex justify-center gap-1"
        style={{ background: cardSkin.preview }}
      >
        {/* Show sample cards with this skin's formatting */}
        {sampleCards.map((card, index) => (
          <div
            key={index}
            className="transform scale-75 origin-center"
            style={{
              opacity: isHovered || isSelected ? 1 : 0.9,
              transition: 'all 0.2s ease',
              animation: showSelectFlash
                ? `skinCardBounce 0.5s ease-out ${index * 0.08}s both`
                : 'none',
            }}
          >
            {/* Mini card preview showing the value format */}
            <div
              className="w-10 h-14 rounded-md flex items-center justify-center text-white font-bold text-sm transition-shadow duration-200"
              style={{
                backgroundColor: cardSkin.suits[card.color].color,
                fontFamily: cardSkin.fontFamily,
                boxShadow: isHovered || showSelectFlash
                  ? `0 0 15px ${cardSkin.suits[card.color].glowColor}`
                  : 'none',
              }}
            >
              {cardSkin.formatValue(card.value, false)}
            </div>
          </div>
        ))}
      </div>

      {/* Skin info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3
            className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm"
            style={{ fontFamily: cardSkin.fontFamily }}
          >
            {cardSkin.name}
          </h3>
          {cardSkin.requiredLevel > 0 && !isLocked && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              Lvl {cardSkin.requiredLevel}+
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] font-body line-clamp-2">
          {cardSkin.description}
        </p>
      </div>
    </button>
  );
}

// ============================================================================
// CARD SKIN SELECTOR GRID
// ============================================================================

interface CardSkinSelectorProps {
  /** Number of columns */
  columns?: 2 | 3;
  /** Callback when skin is selected */
  onSkinChange?: (cardSkin: CardSkin) => void;
  /** Show preview section */
  showPreview?: boolean;
}

export function CardSkinSelector({
  columns = 2,
  onSkinChange,
  showPreview = true,
}: CardSkinSelectorProps) {
  const {
    cardSkin,
    cardSkinId,
    setCardSkin,
    availableCardSkins,
    isCardSkinUnlocked,
    getCardSkinRequiredLevel,
    playerLevel,
  } = useCardSkin();

  // Track the just-selected skin for animation
  const [justSelectedId, setJustSelectedId] = useState<CardSkinId | null>(null);
  const [previewBounce, setPreviewBounce] = useState(false);

  const handleSelect = (id: CardSkinId) => {
    // Skip if already selected
    if (id === cardSkinId) return;

    // Play selection sound
    sounds.buttonClick();

    // Trigger animations
    setJustSelectedId(id);
    setPreviewBounce(true);

    // Set the new skin
    setCardSkin(id);

    // Clear animation states after animation completes
    setTimeout(() => {
      setJustSelectedId(null);
      setPreviewBounce(false);
    }, 700);

    const selectedSkin = availableCardSkins.find(s => s.id === id);
    if (selectedSkin && onSkinChange) {
      onSkinChange(selectedSkin);
    }
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  // Sort skins: free first, then by level requirement
  const sortedSkins = [...availableCardSkins].sort((a, b) => {
    if (a.requiredLevel === 0 && b.requiredLevel > 0) return -1;
    if (a.requiredLevel > 0 && b.requiredLevel === 0) return 1;
    return a.requiredLevel - b.requiredLevel;
  });

  return (
    <div className="space-y-4">
      {/* Live Preview with actual Card component */}
      {showPreview && (
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] overflow-hidden">
          <p className="text-xs text-[var(--color-text-muted)] mb-3 text-center uppercase tracking-wider">
            Live Preview
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {([
              { color: 'red', value: 5 },
              { color: 'blue', value: 6 },
              { color: 'green', value: 1 },
              { color: 'brown', value: 7 },
              { color: 'red', value: 0 },  // Special card
              { color: 'brown', value: 0 }, // Special card
            ] as CardType[]).map((card, index) => (
              <div
                key={`${card.color}-${card.value}`}
                style={{
                  animation: previewBounce
                    ? `skinCardBounce 0.5s ease-out ${index * 0.06}s both`
                    : 'none',
                }}
              >
                <Card card={card} size="small" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skin Grid */}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {sortedSkins.map((skin) => (
          <CardSkinCard
            key={skin.id}
            cardSkin={skin}
            isSelected={skin.id === cardSkinId}
            isLocked={!isCardSkinUnlocked(skin.id)}
            requiredLevel={getCardSkinRequiredLevel(skin.id)}
            currentLevel={playerLevel}
            onSelect={handleSelect}
            justSelected={justSelectedId === skin.id}
          />
        ))}
      </div>

      {/* Current Selection Info */}
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
              Active Card Skin
            </p>
            <p
              className="font-display text-[var(--color-text-primary)] uppercase tracking-wider"
              style={{ fontFamily: cardSkin.fontFamily }}
            >
              {cardSkin.name}
            </p>
          </div>
          {cardSkin.isPremium && (
            <UIBadge variant="solid" color="warning" size="sm">
              ✨ Premium
            </UIBadge>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT CARD SKIN DROPDOWN
// ============================================================================

interface CardSkinDropdownProps {
  onSkinChange?: (cardSkin: CardSkin) => void;
}

export function CardSkinDropdown({ onSkinChange }: CardSkinDropdownProps) {
  const {
    cardSkin,
    cardSkinId,
    setCardSkin,
    availableCardSkins,
    isCardSkinUnlocked,
    getCardSkinRequiredLevel,
  } = useCardSkin();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: CardSkinId) => {
    if (!isCardSkinUnlocked(id)) return;
    if (id === cardSkinId) {
      setIsOpen(false);
      return;
    }

    // Play selection sound
    sounds.buttonClick();

    setCardSkin(id);
    setIsOpen(false);
    const selectedSkin = availableCardSkins.find(s => s.id === id);
    if (selectedSkin && onSkinChange) {
      onSkinChange(selectedSkin);
    }
  };

  // Sort skins: free first, then by level requirement
  const sortedSkins = [...availableCardSkins].sort((a, b) => {
    if (a.requiredLevel === 0 && b.requiredLevel > 0) return -1;
    if (a.requiredLevel > 0 && b.requiredLevel === 0) return 1;
    return a.requiredLevel - b.requiredLevel;
  });

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3
          px-4 py-3
          rounded-[var(--radius-lg)]
          border-[var(--input-border-width)]
          border-[var(--color-border-default)]
          bg-[var(--color-bg-secondary)]
          hover:border-[var(--color-border-accent)]
          transition-all duration-[var(--duration-fast)]
          w-full
          text-left
        `}
      >
        {/* Preview swatch */}
        <div
          className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs"
          style={{
            background: cardSkin.preview,
            fontFamily: cardSkin.fontFamily,
          }}
        >
          {cardSkin.formatValue(7, false)}
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm"
            style={{ fontFamily: cardSkin.fontFamily }}
          >
            {cardSkin.name}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className={`
            absolute top-full left-0 right-0
            mt-2
            rounded-[var(--radius-lg)]
            border-[var(--input-border-width)]
            border-[var(--color-border-accent)]
            bg-[var(--color-bg-secondary)]
            shadow-[var(--shadow-lg)]
            z-50
            overflow-hidden
            max-h-80 overflow-y-auto
            animate-slideUp
          `}>
            {sortedSkins.map((s) => {
              const isLocked = !isCardSkinUnlocked(s.id);
              const requiredLevel = getCardSkinRequiredLevel(s.id);

              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  disabled={isLocked}
                  className={`
                    flex items-center gap-3
                    w-full
                    px-4 py-3
                    text-left
                    transition-colors duration-[var(--duration-fast)]
                    ${isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : s.id === cardSkinId
                        ? 'bg-[var(--color-bg-tertiary)]'
                        : 'hover:bg-[var(--color-bg-tertiary)]'
                    }
                  `}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs"
                      style={{
                        background: s.preview,
                        fontFamily: s.fontFamily,
                      }}
                    >
                      {s.formatValue(5, false)}
                    </div>
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[var(--radius-sm)]">
                        <span className="text-sm">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm"
                      style={{ fontFamily: s.fontFamily }}
                    >
                      {s.name}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] font-body">
                      {isLocked ? `Level ${requiredLevel} required` : s.description}
                    </div>
                  </div>
                  {s.id === cardSkinId && !isLocked && (
                    <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {isLocked && (
                    <span className="text-xs text-[var(--color-text-muted)]">Lvl {requiredLevel}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default CardSkinSelector;
