/**
 * Special Card Skin Selector Component
 *
 * Allows users to select skins for Red 0 (+5) and Brown 0 (-2) cards.
 * These are the most important special cards in the game.
 *
 * Features:
 * - Separate sections for Red 0 and Brown 0 skins
 * - Rarity-based visual styling (common, rare, epic, legendary)
 * - Lock indicators for achievement/level/purchase requirements
 * - Purchase flow for coin-purchasable skins
 * - Live preview of selected skins
 */

import { useState, useEffect } from 'react';
import { useSpecialCardSkins } from '../contexts/SkinContext';
import {
  SpecialCardSkinWithStatus,
  SpecialCardType,
  rarityStyles,
  getUnlockRequirementText,
  getRarityDisplayName,
} from '../config/specialCardSkins';
import { Socket } from 'socket.io-client';

// ============================================================================
// SKIN CARD COMPONENT
// ============================================================================

interface SpecialSkinCardProps {
  skin: SpecialCardSkinWithStatus;
  isEquipped: boolean;
  playerLevel: number;
  cosmeticCurrency: number;
  onEquip: (skinId: string, cardType: SpecialCardType) => void;
  onPurchase: (skinId: string) => void;
}

function SpecialSkinCard({
  skin,
  isEquipped,
  playerLevel,
  cosmeticCurrency,
  onEquip,
  onPurchase,
}: SpecialSkinCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const canAfford = cosmeticCurrency >= skin.price;
  const isLevelLocked =
    skin.unlockType === 'level' &&
    !skin.isUnlocked &&
    playerLevel < parseInt(skin.unlockRequirement || '0', 10);
  const isAchievementLocked = skin.unlockType === 'achievement' && !skin.isUnlocked;

  const isLocked = !skin.isUnlocked && skin.unlockType !== 'purchase';
  const rarity = rarityStyles[skin.rarity];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative
        rounded-xl
        border-2
        p-4
        transition-all duration-300
        ${
          isEquipped
            ? 'border-[var(--color-text-accent)] shadow-lg'
            : skin.isUnlocked
              ? 'border-[var(--color-border-default)] hover:border-[var(--color-border-accent)]'
              : 'border-[var(--color-border-subtle)] opacity-80'
        }
        bg-[var(--color-bg-secondary)]
      `}
    >
      {/* Rarity gradient border glow for equipped */}
      {isEquipped && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `0 0 20px ${skin.glowColor || 'rgba(255,255,255,0.3)'}`,
          }}
        />
      )}

      {/* Lock overlay */}
      {(isLocked || (skin.unlockType === 'purchase' && !skin.isUnlocked)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/60 z-10 p-2">
          {isLevelLocked ? (
            <>
              <span className="text-3xl mb-1">🔒</span>
              <p className="text-sm text-white font-bold">Level {skin.unlockRequirement}</p>
              <p className="text-xs text-white/70">
                {parseInt(skin.unlockRequirement || '0', 10) - playerLevel} levels to go
              </p>
            </>
          ) : isAchievementLocked ? (
            <>
              <span className="text-3xl mb-1">🏆</span>
              <p className="text-xs text-white font-bold text-center">Achievement Required</p>
              <p className="text-xs text-white/70 text-center mt-1">
                {getUnlockRequirementText(skin)}
              </p>
            </>
          ) : skin.unlockType === 'purchase' && !skin.isUnlocked ? (
            <>
              <span className="text-2xl mb-1">🪙</span>
              <p className="text-sm text-white font-bold">{skin.price} coins</p>
              {canAfford ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPurchase(skin.skinId);
                  }}
                  className="mt-2 px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all"
                >
                  Purchase
                </button>
              ) : (
                <p className="text-xs text-red-400 mt-1">
                  Need {skin.price - cosmeticCurrency} more
                </p>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center z-20">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Rarity badge */}
      <div className="absolute top-2 left-2 z-20">
        <span
          className={`
            px-2 py-0.5 rounded-full text-xs font-bold text-white
            ${rarity.badgeColor}
          `}
        >
          {getRarityDisplayName(skin.rarity)}
        </span>
      </div>

      {/* Card preview */}
      <div
        className={`
          relative
          w-20 h-28
          mx-auto
          mt-6
          mb-4
          rounded-lg
          flex items-center justify-center
          transition-transform duration-300
          ${isHovered ? 'scale-110' : ''}
          ${skin.animationClass || ''}
        `}
        style={{
          backgroundColor: skin.cardType === 'red_zero' ? '#fee2e2' : '#fef3c7',
          border: `3px solid ${skin.borderColor || '#888'}`,
          boxShadow:
            isHovered || isEquipped
              ? `0 0 20px ${skin.glowColor || 'rgba(0,0,0,0.3)'}`
              : '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        {/* Icon */}
        <span className="text-4xl" role="img" aria-label={skin.skinName}>
          {skin.centerIcon || (skin.cardType === 'red_zero' ? '🔥' : '🌍')}
        </span>

        {/* Value badge */}
        <div
          className={`
            absolute -bottom-2 left-1/2 -translate-x-1/2
            px-2 py-0.5 rounded text-xs font-bold text-white
            ${skin.cardType === 'red_zero' ? 'bg-green-600' : 'bg-red-600'}
          `}
        >
          {skin.cardType === 'red_zero' ? '+5' : '-2'}
        </div>
      </div>

      {/* Skin info */}
      <div className="text-center">
        <h4 className="font-bold text-[var(--color-text-primary)] text-sm">{skin.skinName}</h4>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
          {skin.description}
        </p>
      </div>

      {/* Equip button */}
      {skin.isUnlocked && !isEquipped && (
        <button
          onClick={() => onEquip(skin.skinId, skin.cardType)}
          className="
            mt-3
            w-full
            py-2
            rounded-lg
            text-sm font-bold
            bg-[var(--color-bg-accent)]
            text-[var(--color-text-inverse)]
            hover:opacity-90
            transition-opacity
          "
        >
          Equip
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN SELECTOR COMPONENT
// ============================================================================

interface SpecialCardSkinSelectorProps {
  socket: Socket | null;
  onClose?: () => void;
}

export function SpecialCardSkinSelector({ socket, onClose }: SpecialCardSkinSelectorProps) {
  const {
    setSpecialCardSkins,
    equippedSpecialSkins,
    setEquippedSpecialSkins,
    cosmeticCurrency,
    playerLevel,
    redZeroSkins,
    brownZeroSkins,
  } = useSpecialCardSkins();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load skins from backend on mount
  useEffect(() => {
    if (!socket) return;

    socket.emit('get_special_card_skins');

    const handleResponse = (data: {
      skins?: SpecialCardSkinWithStatus[];
      equipped?: { redZeroSkin: string | null; brownZeroSkin: string | null };
      error?: string;
    }) => {
      if (data.error) {
        setError(data.error);
        return;
      }
      if (data.skins) {
        setSpecialCardSkins(data.skins);
      }
      if (data.equipped) {
        setEquippedSpecialSkins(data.equipped);
      }
    };

    socket.on('special_card_skins_response', handleResponse);

    return () => {
      socket.off('special_card_skins_response', handleResponse);
    };
  }, [socket, setSpecialCardSkins, setEquippedSpecialSkins]);

  // Handle equip
  const handleEquip = (skinId: string, cardType: SpecialCardType) => {
    if (!socket) return;
    setIsLoading(true);
    socket.emit('equip_special_card_skin', { skinId, cardType });

    // Listen for response
    const handleEquipped = (data: {
      success: boolean;
      equipped?: { redZeroSkin: string | null; brownZeroSkin: string | null };
      error?: string;
    }) => {
      setIsLoading(false);
      if (data.success && data.equipped) {
        setEquippedSpecialSkins(data.equipped);
      } else if (data.error) {
        setError(data.error);
      }
      socket.off('special_card_skin_equipped', handleEquipped);
    };

    socket.on('special_card_skin_equipped', handleEquipped);
  };

  // Handle purchase
  const handlePurchase = (skinId: string) => {
    if (!socket) return;
    setIsLoading(true);
    socket.emit('purchase_special_card_skin', { skinId });

    // Listen for response
    const handlePurchased = (data: {
      success: boolean;
      skins?: SpecialCardSkinWithStatus[];
      equipped?: { redZeroSkin: string | null; brownZeroSkin: string | null };
      error?: string;
    }) => {
      setIsLoading(false);
      if (data.success) {
        if (data.skins) setSpecialCardSkins(data.skins);
        if (data.equipped) setEquippedSpecialSkins(data.equipped);
      } else if (data.error) {
        setError(data.error);
      }
      socket.off('special_card_skin_purchased', handlePurchased);
    };

    socket.on('special_card_skin_purchased', handlePurchased);
  };

  return (
    <div className="p-4 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
            Special Card Skins
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Customize your Red 0 (+5) and Brown 0 (-2) cards
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] rounded-lg">
            <span>🪙</span>
            <span className="font-bold text-[var(--color-text-primary)]">{cosmeticCurrency}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-[var(--color-text-secondary)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50 rounded-lg">
          <div className="animate-spin w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
        </div>
      )}

      {/* Red Zero Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔥</span>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Red Zero Skins</h3>
          <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full font-bold">
            +5 Points
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {redZeroSkins.map((skin) => (
            <SpecialSkinCard
              key={skin.skinId}
              skin={skin}
              isEquipped={equippedSpecialSkins.redZeroSkin === skin.skinId}
              playerLevel={playerLevel}
              cosmeticCurrency={cosmeticCurrency}
              onEquip={handleEquip}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      </div>

      {/* Brown Zero Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🌍</span>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Brown Zero Skins</h3>
          <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-xs rounded-full font-bold">
            -2 Points
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {brownZeroSkins.map((skin) => (
            <SpecialSkinCard
              key={skin.skinId}
              skin={skin}
              isEquipped={equippedSpecialSkins.brownZeroSkin === skin.skinId}
              playerLevel={playerLevel}
              cosmeticCurrency={cosmeticCurrency}
              onEquip={handleEquip}
              onPurchase={handlePurchase}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpecialCardSkinSelector;

// ============================================================================
// DROPDOWN VARIANT (for Settings panel)
// ============================================================================

interface SpecialCardSkinDropdownProps {
  cardType: SpecialCardType;
  socket?: Socket | null;
}

export function SpecialCardSkinDropdown({ cardType, socket }: SpecialCardSkinDropdownProps) {
  const { specialCardSkins, equippedSpecialSkins, setEquippedSpecialSkins } = useSpecialCardSkins();

  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown on Escape key for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filter skins by card type
  const skins = specialCardSkins.filter((s) => s.cardType === cardType);

  // Get currently equipped skin
  const equippedSkinId =
    cardType === 'red_zero' ? equippedSpecialSkins.redZeroSkin : equippedSpecialSkins.brownZeroSkin;

  const equippedSkin = skins.find((s) => s.skinId === equippedSkinId) || skins[0];

  const handleSelect = (skinId: string) => {
    const skin = skins.find((s) => s.skinId === skinId);
    if (!skin?.isUnlocked) return;

    // Update local state immediately for responsiveness
    if (cardType === 'red_zero') {
      setEquippedSpecialSkins({ ...equippedSpecialSkins, redZeroSkin: skinId });
    } else {
      setEquippedSpecialSkins({ ...equippedSpecialSkins, brownZeroSkin: skinId });
    }

    // Persist to backend via socket
    if (socket) {
      socket.emit('equip_special_card_skin', { skinId, cardType });
    }

    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full
          flex items-center justify-between
          px-4 py-3
          rounded-[var(--radius-md)]
          border border-[var(--color-border-default)]
          bg-[var(--color-bg-secondary)]
          text-[var(--color-text-primary)]
          hover:border-[var(--color-border-accent)]
          transition-colors
        "
      >
        <div className="flex items-center gap-3">
          {equippedSkin?.centerIcon ? (
            <span className="text-2xl">{equippedSkin.centerIcon}</span>
          ) : (
            <img
              src={`/cards/production/${cardType === 'red_zero' ? 'red' : 'brown'}_bon.jpg`}
              alt={equippedSkin?.skinName || 'Default'}
              draggable={false}
              className="w-8 h-8 rounded object-cover select-none pointer-events-none"
            />
          )}
          <div className="text-left">
            <div className="font-display text-sm">{equippedSkin?.skinName || 'Select Skin'}</div>
            <div className="text-xs text-[var(--color-text-muted)] capitalize">
              {equippedSkin?.rarity || 'common'}
            </div>
          </div>
        </div>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-2 w-full
            rounded-[var(--radius-md)]
            border border-[var(--color-border-default)]
            bg-[var(--color-bg-tertiary)]
            shadow-lg
            max-h-64 overflow-y-auto
          "
        >
          {skins.map((skin) => {
            const isEquipped = skin.skinId === equippedSkinId;
            const isLocked = !skin.isUnlocked;
            const rarity = rarityStyles[skin.rarity];

            return (
              <button
                key={skin.skinId}
                onClick={() => handleSelect(skin.skinId)}
                disabled={isLocked}
                className={`
                  w-full
                  flex items-center gap-3
                  px-4 py-3
                  text-left
                  transition-colors
                  ${
                    isEquipped
                      ? 'bg-[var(--color-text-accent)]/20 border-l-4 border-[var(--color-text-accent)]'
                      : isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-[var(--color-bg-secondary)]'
                  }
                  border-b border-[var(--color-border-subtle)] last:border-b-0
                `}
              >
                {skin.centerIcon ? (
                  <span className="text-2xl">{skin.centerIcon}</span>
                ) : (
                  <img
                    src={`/cards/production/${cardType === 'red_zero' ? 'red' : 'brown'}_bon.jpg`}
                    alt={skin.skinName}
                    draggable={false}
                    className="w-8 h-8 rounded object-cover select-none pointer-events-none"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm text-[var(--color-text-primary)]">
                      {skin.skinName}
                    </span>
                    {isEquipped && (
                      <span className="text-xs text-[var(--color-text-accent)]">✓</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span
                      className={`capitalize ${rarity.badgeColor.replace('bg-', 'text-').replace('-500', '-400')}`}
                    >
                      {skin.rarity}
                    </span>
                    {isLocked && (
                      <span className="flex items-center gap-1">
                        <span>🔒</span>
                        {getUnlockRequirementText(skin)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Backdrop - click to close, keyboard handled by Escape key listener */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
