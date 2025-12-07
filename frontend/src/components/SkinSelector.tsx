/**
 * Skin Selector Component
 *
 * Allows users to browse and select from available UI skins/themes.
 * Features visual previews, descriptions, and instant application.
 *
 * Can be displayed as:
 * - Grid of skin cards
 * - Dropdown selector
 * - Modal picker
 */

import { useState, useEffect } from 'react';
import { useSkin } from '../contexts/SkinContext';
import { Skin, SkinId } from '../config/skins';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

// ============================================================================
// SKIN CARD COMPONENT
// ============================================================================

interface SkinCardProps {
  skin: Skin;
  isSelected: boolean;
  isLocked: boolean;
  requiredLevel: number;
  onSelect: (id: SkinId) => void;
}

function SkinCard({ skin, isSelected, isLocked, requiredLevel, onSelect }: SkinCardProps) {
  return (
    <button
      onClick={() => !isLocked && onSelect(skin.id)}
      disabled={isLocked}
      className={`
        relative
        w-full
        p-4
        rounded-[var(--radius-lg)]
        border-2
        transition-all
        text-left
        ${
          isLocked
            ? 'opacity-60 cursor-not-allowed border-skin-default'
            : isSelected
              ? 'border-skin-text-accent shadow-[0_0_20px_var(--color-glow)]'
              : 'border-skin-default hover:border-skin-accent hover:scale-[1.02]'
        }
        bg-skin-secondary
        focus-visible:outline-none
        focus-visible:ring-3
        focus-visible:ring-skin-text-accent
      `}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-lg)] bg-black/40 z-10">
          <div className="text-center">
            <span className="text-3xl">🔒</span>
            <p className="text-xs text-white mt-1 font-medium">Level {requiredLevel}</p>
          </div>
        </div>
      )}

      {/* Preview gradient */}
      <div
        className="w-full h-20 rounded-[var(--radius-md)] mb-3"
        style={{ background: skin.preview }}
      />

      {/* Skin info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-skin-primary uppercase tracking-wider text-sm">
            {skin.name}
          </h3>
          {skin.isDark ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-skin-tertiary text-skin-text-secondary">
              Dark
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-skin-text-secondary">
              Light
            </span>
          )}
        </div>
        <p className="text-xs text-skin-text-muted font-body line-clamp-2">{skin.description}</p>
      </div>

      {/* Selected indicator */}
      {isSelected && !isLocked && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-skin-status-success flex items-center justify-center">
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ============================================================================
// SKIN SELECTOR GRID
// ============================================================================

interface SkinSelectorGridProps {
  /** Number of columns (responsive default) */
  columns?: 1 | 2 | 3;
  /** Show skin descriptions */
  showDescriptions?: boolean;
  /** Callback when skin is selected */
  onSkinChange?: (skin: Skin) => void;
}

export function SkinSelectorGrid({
  columns = 2,
  showDescriptions: _showDescriptions = true,
  onSkinChange,
}: SkinSelectorGridProps) {
  void _showDescriptions; // Reserved for future use
  const { skinId, setSkin, availableSkins, isSkinUnlocked, getRequiredLevel } = useSkin();

  const handleSelect = (id: SkinId) => {
    setSkin(id);
    const selectedSkin = availableSkins.find((s) => s.id === id);
    if (selectedSkin && onSkinChange) {
      onSkinChange(selectedSkin);
    }
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {availableSkins.map((skin) => (
        <SkinCard
          key={skin.id}
          skin={skin}
          isSelected={skin.id === skinId}
          isLocked={!isSkinUnlocked(skin.id)}
          requiredLevel={getRequiredLevel(skin.id)}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SKIN SELECTOR DROPDOWN
// ============================================================================

interface SkinSelectorDropdownProps {
  /** Callback when skin is selected */
  onSkinChange?: (skin: Skin) => void;
}

export function SkinSelectorDropdown({ onSkinChange }: SkinSelectorDropdownProps) {
  const { skin, skinId, setSkin, availableSkins, isSkinUnlocked, getRequiredLevel } = useSkin();
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

  const handleSelect = (id: SkinId) => {
    if (!isSkinUnlocked(id)) return; // Don't allow locked skins
    setSkin(id);
    setIsOpen(false);
    const selectedSkin = availableSkins.find((s) => s.id === id);
    if (selectedSkin && onSkinChange) {
      onSkinChange(selectedSkin);
    }
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3
          px-4 py-3
          rounded-[var(--radius-lg)]
          border-2
          border-skin-default
          bg-skin-secondary
          hover:border-skin-accent
          transition-all
          w-full
          text-left
        `}
      >
        {/* Preview swatch */}
        <div
          className="w-8 h-8 rounded-[var(--radius-sm)] flex-shrink-0"
          style={{ background: skin.preview }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-display text-skin-primary uppercase tracking-wider text-sm">
            {skin.name}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-skin-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
          {/* Backdrop - click to close, keyboard handled by Escape key listener */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            role="presentation"
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className={`
            absolute top-full left-0 right-0
            mt-2
            rounded-[var(--radius-lg)]
            border-2
            border-skin-accent
            bg-skin-secondary
            shadow-lg
            z-50
            overflow-hidden
            animate-slideUp
          `}
          >
            {availableSkins.map((s) => {
              const isLocked = !isSkinUnlocked(s.id);
              const requiredLevel = getRequiredLevel(s.id);

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
                    transition-colors
                    ${
                      isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : s.id === skinId
                          ? 'bg-skin-tertiary'
                          : 'hover:bg-skin-tertiary'
                    }
                  `}
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-[var(--radius-sm)] flex-shrink-0"
                      style={{ background: s.preview }}
                    />
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[var(--radius-sm)]">
                        <span className="text-sm">🔒</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-skin-primary uppercase tracking-wider text-sm">
                      {s.name}
                    </div>
                    <div className="text-xs text-skin-text-muted font-body">
                      {isLocked
                        ? `Level ${requiredLevel} required`
                        : s.isDark
                          ? 'Dark theme'
                          : 'Light theme'}
                    </div>
                  </div>
                  {s.id === skinId && !isLocked && (
                    <svg
                      className="w-5 h-5 text-skin-status-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isLocked && (
                    <span className="text-xs text-skin-text-muted">Lvl {requiredLevel}</span>
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

// ============================================================================
// SKIN SELECTOR MODAL
// ============================================================================

interface SkinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkinChange?: (skin: Skin) => void;
}

export function SkinSelectorModal({ isOpen, onClose, onSkinChange }: SkinSelectorModalProps) {
  const { skin } = useSkin();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Skin"
      subtitle="Choose your visual style"
      icon="🎨"
      size="lg"
      theme="neon"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-skin-text-secondary font-body">
          Customize the look and feel of your game experience. Each skin offers a unique visual
          style with its own colors, effects, and atmosphere.
        </p>

        <SkinSelectorGrid
          columns={2}
          onSkinChange={(selectedSkin) => {
            onSkinChange?.(selectedSkin);
          }}
        />

        {/* Current skin info */}
        <div className="mt-6 p-4 rounded-[var(--radius-lg)] bg-skin-tertiary border border-skin-border-subtle">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[var(--radius-md)]"
              style={{ background: skin.preview }}
            />
            <div>
              <div className="font-display text-skin-primary uppercase tracking-wider">
                Currently Active: {skin.name}
              </div>
              <div className="text-sm text-skin-text-muted font-body">{skin.description}</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// QUICK SKIN TOGGLE (for header/toolbar)
// ============================================================================

interface QuickSkinToggleProps {
  /** Show label text */
  showLabel?: boolean;
}

export function QuickSkinToggle({ showLabel = false }: QuickSkinToggleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { skin } = useSkin();

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`
          flex items-center gap-2
          px-3 py-2
          rounded-[var(--radius-md)]
          border-2
          border-skin-default
          bg-skin-secondary
          hover:border-skin-accent
          hover:shadow-[0_0_10px_var(--color-glow)]
          transition-all
        `}
        aria-label="Change skin"
      >
        <div className="w-5 h-5 rounded-[var(--radius-sm)]" style={{ background: skin.preview }} />
        {showLabel && (
          <span className="font-display text-xs text-skin-text-secondary uppercase tracking-wider">
            {skin.name}
          </span>
        )}
      </button>

      <SkinSelectorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

// Default export
export default SkinSelectorGrid;
