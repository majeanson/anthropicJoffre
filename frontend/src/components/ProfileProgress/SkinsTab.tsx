/**
 * SkinsTab Component
 *
 * Shows all skin categories: Card Skins, Special Card Skins, and UI Themes.
 * Part of ProfileProgressModal.
 */

import { Card } from '../Card';
import { skinList, getSkinPricing } from '../../config/skins';
import { cardSkinList, getCardSkinPricing } from '../../config/cardSkins';
import {
  rarityStyles,
  getUnlockRequirementText,
  type SpecialCardSkinWithStatus,
  type PlayerEquippedSpecialSkins,
} from '../../config/specialCardSkins';
import type { SkinId, CardSkinId } from '../../contexts/SkinContext';

interface SkinsTabProps {
  progression: {
    level: number;
    cosmeticCurrency: number;
    unlockedSkins: string[];
  };
  // Current skin state
  skinId: SkinId;
  cardSkinId: CardSkinId;
  equippedSpecialSkins: PlayerEquippedSpecialSkins;
  // Preview state
  isPreviewActive: boolean;
  previewSkinId: SkinId | null;
  previewCardSkinId: CardSkinId | null;
  previewSpecialSkins: PlayerEquippedSpecialSkins | null;
  // Special card skins data
  redZeroSkins: SpecialCardSkinWithStatus[];
  brownZeroSkins: SpecialCardSkinWithStatus[];
  // Actions
  setSkin: (id: SkinId) => void;
  setCardSkin: (id: CardSkinId) => void;
  setEquippedSpecialSkins: (skins: PlayerEquippedSpecialSkins) => void;
  startPreviewSkin: (id: SkinId) => void;
  startPreviewCardSkin: (id: CardSkinId) => void;
  startPreviewSpecialSkin: (type: 'red_zero' | 'brown_zero', skinId: string) => void;
  stopPreview: () => void;
  // Purchase
  isPurchasing: boolean;
  purchaseError: string | null;
  purchaseSuccess: string | null;
  onPurchaseSkin: (skinId: string, skinType: 'ui' | 'card') => void;
}

export function SkinsTab({
  progression,
  skinId,
  cardSkinId,
  equippedSpecialSkins,
  isPreviewActive,
  previewSkinId,
  previewCardSkinId,
  previewSpecialSkins,
  redZeroSkins,
  brownZeroSkins,
  setSkin,
  setCardSkin,
  setEquippedSpecialSkins,
  startPreviewSkin,
  startPreviewCardSkin,
  startPreviewSpecialSkin,
  stopPreview,
  isPurchasing,
  purchaseError,
  purchaseSuccess,
  onPurchaseSkin,
}: SkinsTabProps) {
  return (
    <div className="space-y-6">
      {/* Balance and status bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-skin-secondary">
        <div>
          <p className="text-xs text-skin-muted">
            Level: <strong className="text-skin-primary">{progression.level}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-skin-warning">💰</span>
          <span className="font-bold text-skin-primary">
            {progression.cosmeticCurrency.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Purchase notifications */}
      {purchaseSuccess && (
        <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm text-center animate-pulse">
          ✓ {purchaseSuccess}
        </div>
      )}
      {purchaseError && (
        <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm text-center">
          ✕ {purchaseError}
        </div>
      )}

      {/* Preview indicator with Apply All */}
      {isPreviewActive && (
        <PreviewIndicator
          previewSkinId={previewSkinId}
          previewCardSkinId={previewCardSkinId}
          previewSpecialSkins={previewSpecialSkins}
          equippedSpecialSkins={equippedSpecialSkins}
          redZeroSkins={redZeroSkins}
          brownZeroSkins={brownZeroSkins}
          setSkin={setSkin}
          setCardSkin={setCardSkin}
          setEquippedSpecialSkins={setEquippedSpecialSkins}
          stopPreview={stopPreview}
        />
      )}

      {/* Combined Live Preview */}
      <LivePreview />

      {/* Card Skins Section */}
      <CardSkinsSection
        cardSkinId={cardSkinId}
        previewCardSkinId={previewCardSkinId}
        progression={progression}
        isPurchasing={isPurchasing}
        setCardSkin={setCardSkin}
        startPreviewCardSkin={startPreviewCardSkin}
        onPurchaseSkin={onPurchaseSkin}
      />

      {/* Special Card Skins Section */}
      <SpecialCardSkinsSection
        equippedSpecialSkins={equippedSpecialSkins}
        previewSpecialSkins={previewSpecialSkins}
        redZeroSkins={redZeroSkins}
        brownZeroSkins={brownZeroSkins}
        startPreviewSpecialSkin={startPreviewSpecialSkin}
      />

      {/* UI Theme Skins Section */}
      <UIThemesSection
        skinId={skinId}
        previewSkinId={previewSkinId}
        progression={progression}
        isPurchasing={isPurchasing}
        setSkin={setSkin}
        startPreviewSkin={startPreviewSkin}
        onPurchaseSkin={onPurchaseSkin}
      />
    </div>
  );
}

// Sub-components for SkinsTab

function PreviewIndicator({
  previewSkinId,
  previewCardSkinId,
  previewSpecialSkins,
  equippedSpecialSkins,
  redZeroSkins,
  brownZeroSkins,
  setSkin,
  setCardSkin,
  setEquippedSpecialSkins,
  stopPreview,
}: {
  previewSkinId: SkinId | null;
  previewCardSkinId: CardSkinId | null;
  previewSpecialSkins: PlayerEquippedSpecialSkins | null;
  equippedSpecialSkins: PlayerEquippedSpecialSkins;
  redZeroSkins: SpecialCardSkinWithStatus[];
  brownZeroSkins: SpecialCardSkinWithStatus[];
  setSkin: (id: SkinId) => void;
  setCardSkin: (id: CardSkinId) => void;
  setEquippedSpecialSkins: (skins: PlayerEquippedSpecialSkins) => void;
  stopPreview: () => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-blue-600/30 border border-blue-400/50 text-white text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">👁️ Preview Mode</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (previewSkinId) setSkin(previewSkinId);
              if (previewCardSkinId) setCardSkin(previewCardSkinId);
              if (previewSpecialSkins) {
                setEquippedSpecialSkins(previewSpecialSkins);
              }
              stopPreview();
            }}
            className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
          >
            Apply All
          </button>
          <button
            onClick={stopPreview}
            className="px-3 py-1 rounded bg-skin-tertiary hover:bg-skin-secondary text-skin-primary text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="text-xs text-blue-200 space-y-1">
        {previewSkinId && (
          <div>
            UI Theme:{' '}
            <span className="text-white">
              {skinList.find((s) => s.id === previewSkinId)?.name || previewSkinId}
            </span>
          </div>
        )}
        {previewCardSkinId && (
          <div>
            Card Style:{' '}
            <span className="text-white">
              {cardSkinList.find((s) => s.id === previewCardSkinId)?.name || previewCardSkinId}
            </span>
          </div>
        )}
        {previewSpecialSkins?.redZeroSkin &&
          previewSpecialSkins.redZeroSkin !== equippedSpecialSkins.redZeroSkin && (
            <div>
              Red Zero:{' '}
              <span className="text-white">
                {redZeroSkins.find((s) => s.skinId === previewSpecialSkins.redZeroSkin)?.skinName ||
                  previewSpecialSkins.redZeroSkin}
              </span>
            </div>
          )}
        {previewSpecialSkins?.brownZeroSkin &&
          previewSpecialSkins.brownZeroSkin !== equippedSpecialSkins.brownZeroSkin && (
            <div>
              Brown Zero:{' '}
              <span className="text-white">
                {brownZeroSkins.find((s) => s.skinId === previewSpecialSkins.brownZeroSkin)
                  ?.skinName || previewSpecialSkins.brownZeroSkin}
              </span>
            </div>
          )}
      </div>
    </div>
  );
}

function LivePreview() {
  return (
    <div className="p-4 rounded-lg bg-skin-tertiary border border-skin-subtle">
      <p className="text-xs text-skin-muted mb-3 text-center uppercase tracking-wider">
        👁️ Live Preview (Cards & Backs)
      </p>
      <div className="flex flex-col items-center gap-3">
        {/* Card fronts row */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          <Card card={{ color: 'red', value: 5 }} size="small" />
          <Card card={{ color: 'blue', value: 6 }} size="small" />
          <Card card={{ color: 'green', value: 1 }} size="small" />
          <Card card={{ color: 'brown', value: 7 }} size="small" />
        </div>
        {/* Card backs row */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          <Card card={{ color: 'red', value: 1 }} size="small" faceDown />
          <Card card={{ color: 'blue', value: 1 }} size="small" faceDown />
          <Card card={{ color: 'red', value: 0 }} size="small" />
          <Card card={{ color: 'brown', value: 0 }} size="small" />
        </div>
      </div>
      <p className="text-xs text-skin-muted mt-3 text-center">
        Top: Card fronts • Bottom: Card backs & special cards
      </p>
    </div>
  );
}

function CardSkinsSection({
  cardSkinId,
  previewCardSkinId,
  progression,
  isPurchasing,
  setCardSkin,
  startPreviewCardSkin,
  onPurchaseSkin,
}: {
  cardSkinId: CardSkinId;
  previewCardSkinId: CardSkinId | null;
  progression: { cosmeticCurrency: number; unlockedSkins: string[] };
  isPurchasing: boolean;
  setCardSkin: (id: CardSkinId) => void;
  startPreviewCardSkin: (id: CardSkinId) => void;
  onPurchaseSkin: (skinId: string, skinType: 'ui' | 'card') => void;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-skin-primary">
        <span>🃏</span> Card Skins
      </h3>
      <p className="text-xs mb-3 text-skin-muted">
        Click to preview. Mix and match across all skin types!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cardSkinList.map((cardSkinItem) => {
          const pricing = getCardSkinPricing(cardSkinItem.id);
          const isUnlocked =
            pricing.price === 0 || progression.unlockedSkins.includes(cardSkinItem.id);
          const isActive = cardSkinId === cardSkinItem.id;
          const isPreviewing = previewCardSkinId === cardSkinItem.id;
          const canAfford = progression.cosmeticCurrency >= pricing.price;

          return (
            <div
              key={cardSkinItem.id}
              className={`
                relative p-3 rounded-lg text-left transition-all cursor-pointer bg-skin-secondary border
                ${
                  isActive
                    ? 'ring-2 ring-blue-500 border-skin-accent'
                    : isPreviewing
                      ? 'ring-2 ring-team2 border-team2'
                      : 'hover:ring-1 hover:ring-purple-500/50 border-skin-subtle'
                }
              `}
              onClick={() => startPreviewCardSkin(cardSkinItem.id)}
            >
              {/* Preview gradient with mini cards */}
              <div
                className="w-full h-12 rounded mb-2 flex items-center justify-center gap-1"
                style={{ background: cardSkinItem.preview }}
              >
                {[5, 7, 3].map((val, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-9 rounded text-white font-bold text-xs flex items-center justify-center"
                    style={{
                      backgroundColor:
                        cardSkinItem.suits[['red', 'blue', 'green'][idx] as 'red' | 'blue' | 'green']
                          .color,
                      fontFamily: cardSkinItem.fontFamily,
                    }}
                  >
                    {cardSkinItem.formatValue(val, false)}
                  </div>
                ))}
              </div>

              <h4 className="font-medium text-sm text-skin-primary">{cardSkinItem.name}</h4>
              <p className="text-xs line-clamp-1 mb-2 text-skin-muted">{cardSkinItem.description}</p>

              <div className="flex items-center justify-between">
                {isUnlocked ? (
                  <>
                    {isActive ? (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500 text-white">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => setCardSkin(cardSkinItem.id)}
                        className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        Select
                      </button>
                    )}
                    <span className="text-xs text-skin-muted">✓ Owned</span>
                  </>
                ) : (
                  <>
                    {pricing.price > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPurchaseSkin(cardSkinItem.id, 'card');
                        }}
                        disabled={!canAfford || isPurchasing}
                        className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors ${
                          canAfford
                            ? 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50 border border-yellow-500/50'
                            : 'bg-skin-tertiary text-skin-muted cursor-not-allowed'
                        }`}
                      >
                        <span>💰</span>
                        <span>Buy {pricing.price}</span>
                      </button>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                        Free
                      </span>
                    )}
                    <span className="text-xs text-skin-muted">Lvl {pricing.suggestedLevel}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpecialCardSkinsSection({
  equippedSpecialSkins,
  previewSpecialSkins,
  redZeroSkins,
  brownZeroSkins,
  startPreviewSpecialSkin,
}: {
  equippedSpecialSkins: PlayerEquippedSpecialSkins;
  previewSpecialSkins: PlayerEquippedSpecialSkins | null;
  redZeroSkins: SpecialCardSkinWithStatus[];
  brownZeroSkins: SpecialCardSkinWithStatus[];
  startPreviewSpecialSkin: (type: 'red_zero' | 'brown_zero', skinId: string) => void;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-skin-primary">
        <span>✨</span> Special Card Skins
      </h3>
      <p className="text-xs mb-3 text-skin-muted">
        Customize your Red 0 (+5 pts) and Brown 0 (-2 pts) cards. Unlock skins via achievements!
      </p>

      {/* Red Zero Skins */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-skin-secondary">
          <span className="text-lg">🔥</span> Red Zero (+5 Points)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {redZeroSkins.map((skin) => (
            <SpecialSkinCard
              key={skin.skinId}
              skin={skin}
              isEquipped={equippedSpecialSkins.redZeroSkin === skin.skinId}
              isPreviewing={previewSpecialSkins?.redZeroSkin === skin.skinId}
              cardType="red"
              imageSrc="/cards/production/red_bon.jpg"
              onClick={() => startPreviewSpecialSkin('red_zero', skin.skinId)}
            />
          ))}
        </div>
      </div>

      {/* Brown Zero Skins */}
      <div>
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-skin-secondary">
          <span className="text-lg">🌍</span> Brown Zero (-2 Points)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {brownZeroSkins.map((skin) => (
            <SpecialSkinCard
              key={skin.skinId}
              skin={skin}
              isEquipped={equippedSpecialSkins.brownZeroSkin === skin.skinId}
              isPreviewing={previewSpecialSkins?.brownZeroSkin === skin.skinId}
              cardType="brown"
              imageSrc="/cards/production/brown_bon.jpg"
              onClick={() => startPreviewSpecialSkin('brown_zero', skin.skinId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecialSkinCard({
  skin,
  isEquipped,
  isPreviewing,
  cardType,
  imageSrc,
  onClick,
}: {
  skin: SpecialCardSkinWithStatus;
  isEquipped: boolean;
  isPreviewing: boolean;
  cardType: 'red' | 'brown';
  imageSrc: string;
  onClick: () => void;
}) {
  const rarityStyle = rarityStyles[skin.rarity];
  const ringColor = cardType === 'red' ? 'ring-team1 border-team1' : 'ring-amber-700 border-amber-700';
  const hoverRing = cardType === 'red' ? 'hover:ring-team1' : 'hover:ring-amber-600/50';
  const equippedColor = cardType === 'red' ? 'text-team1' : 'text-amber-600';
  const defaultBorderColor = cardType === 'red' ? '#dc2626' : '#78350f';

  return (
    <div
      className={`
        relative p-2 rounded-lg text-center transition-all cursor-pointer bg-skin-secondary border
        ${
          isEquipped
            ? `ring-2 ${ringColor}`
            : isPreviewing
              ? 'ring-2 ring-team2 border-team2'
              : `${hoverRing} hover:ring-1 border-skin-subtle`
        }
        ${!skin.isUnlocked ? 'opacity-60' : ''}
      `}
      onClick={onClick}
    >
      {/* Rarity badge */}
      <div
        className={`absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded ${rarityStyle.badgeColor} text-white uppercase tracking-wider`}
      >
        {skin.rarity}
      </div>

      {/* Icon or image preview */}
      <div
        className="w-12 h-16 mx-auto mb-1 rounded flex items-center justify-center"
        style={{
          backgroundColor: skin.borderColor || defaultBorderColor,
          boxShadow: skin.glowColor ? `0 0 12px ${skin.glowColor}` : undefined,
        }}
      >
        {skin.centerIcon ? (
          <span className="text-2xl">{skin.centerIcon}</span>
        ) : (
          <img
            src={imageSrc}
            alt={skin.skinName}
            draggable={false}
            className="w-full h-full object-cover rounded select-none pointer-events-none"
          />
        )}
      </div>

      <p className="text-xs font-medium truncate text-skin-primary">{skin.skinName}</p>

      {/* Status */}
      {isEquipped ? (
        <span className={`text-[10px] ${equippedColor}`}>Equipped</span>
      ) : skin.isUnlocked ? (
        <span className="text-[10px] text-green-400">Select</span>
      ) : (
        <span className="text-[10px] text-skin-muted">{getUnlockRequirementText(skin)}</span>
      )}
    </div>
  );
}

function UIThemesSection({
  skinId,
  previewSkinId,
  progression,
  isPurchasing,
  setSkin,
  startPreviewSkin,
  onPurchaseSkin,
}: {
  skinId: SkinId;
  previewSkinId: SkinId | null;
  progression: { cosmeticCurrency: number; unlockedSkins: string[] };
  isPurchasing: boolean;
  setSkin: (id: SkinId) => void;
  startPreviewSkin: (id: SkinId) => void;
  onPurchaseSkin: (skinId: string, skinType: 'ui' | 'card') => void;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2 text-skin-primary">
        <span>🎨</span> UI Themes
      </h3>
      <p className="text-xs mb-3 text-skin-muted">
        Click to preview. Mix and match across all skin types!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {skinList.map((skinItem) => {
          const pricing = getSkinPricing(skinItem.id as SkinId);
          const isUnlocked =
            pricing.price === 0 || progression.unlockedSkins.includes(skinItem.id);
          const isActive = skinId === skinItem.id;
          const isPreviewing = previewSkinId === skinItem.id;
          const canAfford = progression.cosmeticCurrency >= pricing.price;

          return (
            <div
              key={skinItem.id}
              className={`
                relative p-3 rounded-lg text-left transition-all cursor-pointer bg-skin-secondary border
                ${
                  isActive
                    ? 'ring-2 ring-blue-500 border-skin-accent'
                    : isPreviewing
                      ? 'ring-2 ring-team2 border-team2'
                      : 'hover:ring-1 hover:ring-purple-500/50 border-skin-subtle'
                }
              `}
              onClick={() => startPreviewSkin(skinItem.id as SkinId)}
            >
              <div
                className="w-full h-12 rounded mb-2"
                style={{ background: skinItem.preview }}
              />

              <h4 className="font-medium text-sm text-skin-primary">{skinItem.name}</h4>
              <p className="text-xs line-clamp-1 mb-2 text-skin-muted">{skinItem.description}</p>

              <div className="flex items-center justify-between">
                {isUnlocked ? (
                  <>
                    {isActive ? (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500 text-white">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => setSkin(skinItem.id as SkinId)}
                        className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        Select
                      </button>
                    )}
                    <span className="text-xs text-skin-muted">✓ Owned</span>
                  </>
                ) : (
                  <>
                    {pricing.price > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPurchaseSkin(skinItem.id, 'ui');
                        }}
                        disabled={!canAfford || isPurchasing}
                        className={`text-xs px-3 py-1.5 rounded flex items-center gap-1 font-medium transition-colors ${
                          canAfford
                            ? 'bg-yellow-500/30 text-yellow-300 hover:bg-yellow-500/50 border border-yellow-500/50'
                            : 'bg-skin-tertiary text-skin-muted cursor-not-allowed'
                        }`}
                      >
                        <span>💰</span>
                        <span>Buy {pricing.price}</span>
                      </button>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                        Free
                      </span>
                    )}
                    <span className="text-xs text-skin-muted">Lvl {pricing.suggestedLevel}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
