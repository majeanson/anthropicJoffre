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

import { useState } from 'react';
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
  onSelect: (id: SkinId) => void;
}

function SkinCard({ skin, isSelected, onSelect }: SkinCardProps) {
  return (
    <button
      onClick={() => onSelect(skin.id)}
      className={`
        relative
        w-full
        p-4
        rounded-[var(--radius-lg)]
        border-[var(--button-border-width)]
        transition-all duration-[var(--duration-normal)]
        text-left
        ${isSelected
          ? 'border-[var(--color-text-accent)] shadow-[0_0_20px_var(--color-glow)]'
          : 'border-[var(--color-border-default)] hover:border-[var(--color-border-accent)]'
        }
        bg-[var(--color-bg-secondary)]
        hover:scale-[1.02]
        focus-visible:outline-none
        focus-visible:ring-[var(--input-focus-ring-width)]
        focus-visible:ring-[var(--color-text-accent)]
      `}
    >
      {/* Preview gradient */}
      <div
        className="w-full h-20 rounded-[var(--radius-md)] mb-3"
        style={{ background: skin.preview }}
      />

      {/* Skin info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm">
            {skin.name}
          </h3>
          {skin.isDark ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              Dark
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-[var(--color-text-secondary)]">
              Light
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] font-body line-clamp-2">
          {skin.description}
        </p>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center">
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
  const { skinId, setSkin, availableSkins } = useSkin();

  const handleSelect = (id: SkinId) => {
    setSkin(id);
    const selectedSkin = availableSkins.find(s => s.id === id);
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
  const { skin, skinId, setSkin, availableSkins } = useSkin();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: SkinId) => {
    setSkin(id);
    setIsOpen(false);
    const selectedSkin = availableSkins.find(s => s.id === id);
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
          className="w-8 h-8 rounded-[var(--radius-sm)] flex-shrink-0"
          style={{ background: skin.preview }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm">
            {skin.name}
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
            animate-slideUp
          `}>
            {availableSkins.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className={`
                  flex items-center gap-3
                  w-full
                  px-4 py-3
                  text-left
                  transition-colors duration-[var(--duration-fast)]
                  ${s.id === skinId
                    ? 'bg-[var(--color-bg-tertiary)]'
                    : 'hover:bg-[var(--color-bg-tertiary)]'
                  }
                `}
              >
                <div
                  className="w-8 h-8 rounded-[var(--radius-sm)] flex-shrink-0"
                  style={{ background: s.preview }}
                />
                <div className="flex-1">
                  <div className="font-display text-[var(--color-text-primary)] uppercase tracking-wider text-sm">
                    {s.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] font-body">
                    {s.isDark ? 'Dark theme' : 'Light theme'}
                  </div>
                </div>
                {s.id === skinId && (
                  <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
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
        <p className="text-[var(--color-text-secondary)] font-body">
          Customize the look and feel of your game experience. Each skin offers a unique visual style with its own colors, effects, and atmosphere.
        </p>

        <SkinSelectorGrid
          columns={2}
          onSkinChange={(selectedSkin) => {
            onSkinChange?.(selectedSkin);
          }}
        />

        {/* Current skin info */}
        <div className="mt-6 p-4 rounded-[var(--radius-lg)] bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[var(--radius-md)]"
              style={{ background: skin.preview }}
            />
            <div>
              <div className="font-display text-[var(--color-text-primary)] uppercase tracking-wider">
                Currently Active: {skin.name}
              </div>
              <div className="text-sm text-[var(--color-text-muted)] font-body">
                {skin.description}
              </div>
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
          border-[var(--input-border-width)]
          border-[var(--color-border-default)]
          bg-[var(--color-bg-secondary)]
          hover:border-[var(--color-border-accent)]
          hover:shadow-[0_0_10px_var(--color-glow)]
          transition-all duration-[var(--duration-fast)]
        `}
        aria-label="Change skin"
      >
        <div
          className="w-5 h-5 rounded-[var(--radius-sm)]"
          style={{ background: skin.preview }}
        />
        {showLabel && (
          <span className="font-display text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
            {skin.name}
          </span>
        )}
      </button>

      <SkinSelectorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

// Default export
export default SkinSelectorGrid;
