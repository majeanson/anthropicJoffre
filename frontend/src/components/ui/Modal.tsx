/**
 * Modal Component - Midnight Alchemy Edition
 *
 * Mystical modal system with ethereal lighting and brass frame aesthetics.
 * Each modal feels like opening an ancient grimoire or alchemist's cabinet.
 *
 * ## Recommended Themes (Core 6):
 * - `minimal`: Clean, neutral - uses CSS variables for skin compatibility (most versatile)
 * - `arcane`: Copper accents with mystical glow (default, primary modals)
 * - `blue`: Blue celestial atmosphere (info, primary actions)
 * - `purple`: Purple mystical (social features, profiles)
 * - `red`: Red danger/error styling (errors, destructive actions)
 * - `green`: Teal/green transformation (success, positive actions)
 *
 * ## Legacy Themes (maintained for compatibility):
 * These themes are still supported but mapped to core themes:
 * - midnight → blue (equivalent)
 * - teal → green (equivalent)
 * - ember/orange → arcane (similar warm tones)
 * - void, parchment, velvet, neon, etc. → kept for specific use cases
 *
 * ## Features:
 * - Multiple size variants (sm, md, lg, xl, full)
 * - Ethereal shadow and copper glow effects
 * - Mobile full-screen optimization (85vh max height)
 * - Keyboard handling (ESC to close)
 * - Focus trap (Tab/Shift+Tab)
 * - Body scroll lock
 * - Stacking support for nested modals
 * - Sacred geometry corner decorations
 *
 * ## Usage:
 * ```tsx
 * // Recommended - use core themes
 * <Modal theme="minimal" title="Settings">...</Modal>
 * <Modal theme="blue" title="Information">...</Modal>
 * <Modal theme="red" title="Delete Confirmation">...</Modal>
 *
 * // Or use preset components
 * <MinimalModal title="Settings">...</MinimalModal>
 * ```
 */

import { ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getModalZIndex } from '../../config/zIndex';
import { sizes } from '../../config/layout';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalTheme =
  | 'arcane'
  | 'midnight'
  | 'ember'
  | 'void'
  | 'parchment'
  | 'teal'
  | 'minimal'
  // Legacy themes for backward compatibility
  | 'elegant'
  | 'velvet'
  | 'neon'
  | 'arcade'
  | 'hologram'
  | 'classic'
  | 'terminal'
  | 'blue'
  | 'purple'
  | 'green'
  | 'orange'
  | 'red';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;

  // Header customization
  /** Modal title */
  title?: ReactNode;
  /** Subtitle text below title */
  subtitle?: string;
  /** Icon element to show before title */
  icon?: ReactNode;

  // Appearance
  /** Theme preset to use */
  theme?: ModalTheme;
  /** Size preset */
  size?: ModalSize;

  // Layout
  /** Footer content (usually buttons) */
  footer?: ReactNode;

  // Behavior
  /** Show X button in header */
  showCloseButton?: boolean;
  /** Allow closing by clicking backdrop */
  closeOnBackdrop?: boolean;
  /** Allow closing with ESC key */
  closeOnEscape?: boolean;
  /** Lock body scroll when modal is open */
  preventBodyScroll?: boolean;
  /** Make modal full-screen on mobile devices */
  mobileFullScreen?: boolean;

  // Effects
  /** Enable scanline overlay effect */
  scanlines?: boolean;
  /** Enable glow animation on border */
  glowAnimation?: boolean;

  // Advanced
  /** Stacking level for nested modals (0 = base, 1+ = nested) */
  stackLevel?: number;
  /** Custom z-index override */
  customZIndex?: number;
  /** Custom height class (e.g., 'h-[600px]') */
  customHeight?: string;
  /** Custom className for content area */
  contentClassName?: string;

  // Accessibility
  /** aria-label for modal */
  ariaLabel?: string;
  /** data-testid for testing */
  testId?: string;
}

// Theme configurations - Midnight Alchemy aesthetic
const themeConfigs: Record<
  ModalTheme,
  {
    backdrop: string;
    container: string;
    header: string;
    border: string;
    title: string;
    closeButton: string;
    footer: string;
    glow: string;
  }
> = {
  arcane: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#131824] via-[#1A1F2E] to-[#0B0E14]',
    header: 'bg-gradient-to-r from-[#1A1F2E] via-[#2D3548] to-[#1A1F2E]',
    border: 'border-[#C17F59]',
    title: 'text-[#D4A574]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]',
    footer: 'bg-[#0B0E14]',
    glow: '0 0 50px rgba(193, 127, 89, 0.2), 0 0 100px rgba(212, 165, 116, 0.1), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  midnight: {
    backdrop: 'bg-[rgba(11,14,20,0.96)]',
    container: 'bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A]',
    header: 'bg-gradient-to-r from-[#1E3A5F] via-[#2563EB] to-[#1E3A5F]',
    border: 'border-[#3B82F6]',
    title: 'text-[#93C5FD]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]',
    footer: 'bg-[#0F172A]',
    glow: '0 0 50px rgba(59, 130, 246, 0.25), 0 0 100px rgba(37, 99, 235, 0.1), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  ember: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#1C1410] via-[#2A1F18] to-[#0D0806]',
    header: 'bg-gradient-to-r from-[#B45309] via-[#F59E0B] to-[#B45309]',
    border: 'border-[#D97706]',
    title: 'text-[#0B0E14]',
    closeButton: 'bg-[#7F1D1D] hover:bg-[#991B1B] hover:shadow-[0_0_20px_rgba(127,29,29,0.5)]',
    footer: 'bg-[#0D0806]',
    glow: '0 0 50px rgba(245, 158, 11, 0.25), 0 0 100px rgba(217, 119, 6, 0.1), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  void: {
    backdrop: 'bg-[rgba(0,0,0,0.98)]',
    container: 'bg-[#050505]',
    header: 'bg-gradient-to-r from-[#1F2937] via-[#374151] to-[#1F2937]',
    border: 'border-[#4B5563]',
    title: 'text-[#9CA3AF]',
    closeButton: 'bg-[#374151] hover:bg-[#4B5563] hover:shadow-[0_0_15px_rgba(75,85,99,0.5)]',
    footer: 'bg-[#050505]',
    glow: '0 0 30px rgba(75, 85, 99, 0.15), 0 8px 32px rgba(0, 0, 0, 0.9)',
  },
  parchment: {
    backdrop: 'bg-[rgba(0,0,0,0.75)]',
    container: 'bg-gradient-to-b from-[#F5F0E6] to-[#E8E4DC]',
    header: 'bg-gradient-to-r from-[#5e5344] via-[#3d3428] to-[#5e5344]',
    border: 'border-[#B45309]',
    title: 'text-[#F5F0E6]',
    closeButton: 'bg-[#B45309] hover:bg-[#D97706] hover:shadow-[0_0_15px_rgba(180,83,9,0.5)]',
    footer: 'bg-[#E8E4DC]',
    glow: '0 0 40px rgba(180, 83, 9, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  teal: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#0D1F1F] via-[#134E4A] to-[#0D1F1F]',
    header: 'bg-gradient-to-r from-[#115E59] via-[#2DD4BF] to-[#115E59]',
    border: 'border-[#2DD4BF]',
    title: 'text-[#0B0E14]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]',
    footer: 'bg-[#0D1F1F]',
    glow: '0 0 50px rgba(45, 212, 191, 0.25), 0 0 100px rgba(45, 212, 191, 0.1), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  // Minimal theme - uses CSS variables for skin compatibility
  minimal: {
    backdrop: 'bg-[var(--color-bg-overlay)]',
    container: 'bg-[var(--color-bg-secondary)]',
    header: 'bg-[var(--color-bg-accent)]',
    border: 'border-[var(--color-border-accent)]',
    title: 'text-[var(--color-text-inverse)]',
    closeButton: 'bg-[var(--color-error)] hover:opacity-90',
    footer: 'bg-[var(--color-bg-tertiary)]',
    glow: 'var(--shadow-lg)',
  },
  // Legacy theme mappings
  elegant: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#131824] via-[#1A1F2E] to-[#0B0E14]',
    header: 'bg-gradient-to-r from-[#1A1F2E] via-[#2D3548] to-[#1A1F2E]',
    border: 'border-[#C17F59]',
    title: 'text-[#D4A574]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0B0E14]',
    glow: '0 0 50px rgba(193, 127, 89, 0.2), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  velvet: {
    backdrop: 'bg-black/90',
    container: 'bg-gradient-to-b from-[#2a1a1a] to-[#1a0f0f]',
    header: 'bg-gradient-to-r from-[#4a1a1a] via-[#6a2a2a] to-[#4a1a1a]',
    border: 'border-[#8a3a3a]',
    title: 'text-[#f0d0d0]',
    closeButton: 'bg-[#6a2a2a] hover:bg-[#8a3a3a]',
    footer: 'bg-[#1a0f0f]',
    glow: '0 0 40px rgba(138, 58, 58, 0.2), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  neon: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#131824] to-[#0B0E14]',
    header: 'bg-gradient-to-r from-[#1A1F2E] via-[#2D3548] to-[#1A1F2E]',
    border: 'border-[#C17F59]',
    title: 'text-[#D4A574]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0B0E14]',
    glow: '0 0 50px rgba(193, 127, 89, 0.2), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  arcade: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#131824] to-[#0B0E14]',
    header: 'bg-gradient-to-r from-[#B45309] to-[#F59E0B]',
    border: 'border-[#F59E0B]',
    title: 'text-[#0B0E14]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0B0E14]',
    glow: '0 0 40px rgba(245, 158, 11, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  hologram: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#131824] to-[#0B0E14]',
    header: 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]',
    border: 'border-[#60A5FA]',
    title: 'text-white',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0B0E14]',
    glow: '0 0 40px rgba(96, 165, 250, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  classic: {
    backdrop: 'bg-black/70',
    container: 'bg-gradient-to-b from-[#F5F0E6] to-[#E8E4DC]',
    header: 'bg-gradient-to-r from-[#5e5344] via-[#3d3428] to-[#5e5344]',
    border: 'border-[#B45309]',
    title: 'text-[#F5F0E6]',
    closeButton: 'bg-[#B45309] hover:bg-[#D97706]',
    footer: 'bg-[#E8E4DC]',
    glow: '0 0 30px rgba(180, 83, 9, 0.15), 0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  terminal: {
    backdrop: 'bg-black/95',
    container: 'bg-[#0a0a0a]',
    header: 'bg-[#0a1a0a]',
    border: 'border-[#2DD4BF]',
    title: 'text-[#2DD4BF]',
    closeButton: 'bg-[#1a3a1a] hover:bg-[#2a4a2a] text-[#2DD4BF]',
    footer: 'bg-[#0a1a0a]',
    glow: '0 0 30px rgba(45, 212, 191, 0.2), 0 8px 32px rgba(0, 0, 0, 0.8)',
  },
  blue: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#0F172A] to-[#1E293B]',
    header: 'bg-gradient-to-r from-[#1E3A5F] to-[#2563EB]',
    border: 'border-[#3B82F6]',
    title: 'text-[#E8E4DC]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0F172A]',
    glow: '0 0 40px rgba(59, 130, 246, 0.2), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  purple: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#1E1B2E] to-[#0F0D1A]',
    header: 'bg-gradient-to-r from-[#5B21B6] to-[#7C3AED]',
    border: 'border-[#8B5CF6]',
    title: 'text-[#E8E4DC]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0F0D1A]',
    glow: '0 0 40px rgba(139, 92, 246, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  green: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#0D1F1F] to-[#052E16]',
    header: 'bg-gradient-to-r from-[#047857] to-[#059669]',
    border: 'border-[#10B981]',
    title: 'text-[#E8E4DC]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#052E16]',
    glow: '0 0 40px rgba(16, 185, 129, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  orange: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#1C1410] to-[#0D0806]',
    header: 'bg-gradient-to-r from-[#B45309] to-[#D97706]',
    border: 'border-[#F59E0B]',
    title: 'text-[#E8E4DC]',
    closeButton: 'bg-[#DC2626] hover:bg-[#EF4444]',
    footer: 'bg-[#0D0806]',
    glow: '0 0 40px rgba(245, 158, 11, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
  red: {
    backdrop: 'bg-[rgba(11,14,20,0.94)]',
    container: 'bg-gradient-to-b from-[#1F1212] to-[#0D0606]',
    header: 'bg-gradient-to-r from-[#B91C1C] to-[#DC2626]',
    border: 'border-[#EF4444]',
    title: 'text-[#E8E4DC]',
    closeButton: 'bg-[#7F1D1D] hover:bg-[#991B1B]',
    footer: 'bg-[#0D0606]',
    glow: '0 0 40px rgba(220, 38, 38, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
  },
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  theme = 'arcane',
  size = 'md',
  footer,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  mobileFullScreen = true,
  scanlines = false,
  glowAnimation = true,
  stackLevel = 0,
  customZIndex,
  customHeight,
  contentClassName,
  ariaLabel,
  testId = 'modal',
}: ModalProps) {
  const config = themeConfigs[theme];
  const modalZIndex = customZIndex || getModalZIndex(stackLevel);

  // Stable callback for escape handler
  const handleEscape = useCallback(() => {
    if (closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  // Use focus trap hook for proper focus management
  const { containerRef } = useFocusTrap({
    isActive: isOpen,
    onEscape: closeOnEscape ? handleEscape : undefined,
    autoFocus: true,
    restoreFocus: true,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventBodyScroll]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  // Stop keyboard events from propagating
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };

  // Mobile responsive classes - using 85vh to leave room for mobile browser UI
  const mobileClasses = mobileFullScreen
    ? 'sm:rounded-[var(--radius-xl)] sm:max-h-[85vh] max-sm:rounded-none max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:max-w-full'
    : 'rounded-[var(--radius-xl)] max-h-[85vh]';

  const hasHeader = title || icon || subtitle || showCloseButton;

  // Use portal to render at document.body level, avoiding stacking context issues
  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center ${mobileFullScreen ? 'sm:p-4 max-sm:p-0' : 'p-4'}`}
      style={{ zIndex: modalZIndex }}
      data-testid={`${testId}-backdrop`}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop with mystical blur */}
      <div
        className={`
          absolute inset-0
          ${config.backdrop}
          backdrop-blur-[var(--modal-backdrop-blur)]
        `}
        style={{
          animation: 'fade-in var(--duration-normal) var(--easing)',
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={containerRef}
        tabIndex={-1}
        className={`
          relative
          ${config.container}
          ${sizes.modal[size]}
          w-full
          flex flex-col
          border-[var(--modal-border-width)]
          ${config.border}
          ${mobileClasses}
          overflow-hidden
          ${customHeight || ''}
          ${glowAnimation ? 'transition-shadow duration-[var(--duration-normal)]' : ''}
        `}
        style={{
          boxShadow: glowAnimation ? config.glow : undefined,
          animation: 'scale-in var(--duration-normal) var(--easing)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
        aria-labelledby={title ? `${testId}-title` : undefined}
        data-testid={`${testId}-content`}
      >
        {/* Sacred geometry corner decorations */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[var(--color-text-accent)] opacity-60 rounded-tl-[var(--radius-xl)]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[var(--color-text-accent)] opacity-60 rounded-tr-[var(--radius-xl)]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[var(--color-text-accent)] opacity-60 rounded-bl-[var(--radius-xl)]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[var(--color-text-accent)] opacity-60 rounded-br-[var(--radius-xl)]" />

        {/* Scanline overlay */}
        {scanlines && (
          <div
            className="absolute inset-0 pointer-events-none z-50"
            style={{
              background:
                'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.03) 0px, rgba(0, 0, 0, 0.03) 1px, transparent 1px, transparent 3px)',
            }}
          />
        )}

        {/* Header */}
        {hasHeader && (
          <div
            className={`
              sticky top-0
              ${config.header}
              px-6 py-5
              flex items-center justify-between
              border-b-[var(--modal-border-width)]
              ${config.border}
              z-10
              ${mobileFullScreen ? 'sm:rounded-t-[calc(var(--radius-xl)-var(--modal-border-width))] max-sm:rounded-t-none' : 'rounded-t-[calc(var(--radius-xl)-var(--modal-border-width))]'}
            `}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {icon && (
                <span className="text-3xl flex-shrink-0 drop-shadow-[0_0_8px_rgba(212,165,116,0.5)]">
                  {icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {title && (
                  <h2
                    id={`${testId}-title`}
                    className={`
                      text-xl md:text-2xl
                      font-display
                      font-bold
                      tracking-wider
                      ${config.title}
                      drop-shadow-lg
                    `}
                  >
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-sm md:text-base opacity-75 font-body italic truncate mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  ml-4
                  ${config.closeButton}
                  text-white
                  w-11 h-11
                  rounded-[var(--radius-md)]
                  font-display
                  font-bold
                  text-xl
                  transition-all duration-[var(--duration-fast)]
                  hover:scale-110
                  active:scale-95
                  flex-shrink-0
                  flex items-center justify-center
                  border border-white/20
                `}
                aria-label="Close modal"
                data-testid={`${testId}-close`}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={contentClassName || 'flex-1 overflow-y-auto p-6 text-skin-primary'}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={`
              ${config.footer}
              p-5
              border-t-[var(--modal-border-width)]
              ${config.border}
              ${mobileFullScreen ? 'sm:rounded-b-[calc(var(--radius-xl)-var(--modal-border-width))] max-sm:rounded-b-none' : 'rounded-b-[calc(var(--radius-xl)-var(--modal-border-width))]'}
              flex gap-3 justify-end
            `}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// PRESET MODAL COMPONENTS - Recommended Core 6
// ============================================================================

export interface PresetModalProps extends Omit<ModalProps, 'theme'> {}

// ---- RECOMMENDED PRESETS (Core 6) ----

/** Minimal theme modal - uses CSS variables for skin compatibility (most versatile) */
export const MinimalModal = (props: PresetModalProps) => <Modal theme="minimal" {...props} />;

/** Arcane copper-accented modal (default, primary modals) */
export const ArcaneModal = (props: PresetModalProps) => (
  <Modal theme="arcane" glowAnimation {...props} />
);

/** Blue celestial modal (info, primary actions) */
export const BlueModal = (props: PresetModalProps) => (
  <Modal theme="blue" glowAnimation {...props} />
);

/** Purple mystical modal (social features, profiles) */
export const PurpleModal = (props: PresetModalProps) => (
  <Modal theme="purple" glowAnimation {...props} />
);

/** Red danger modal (errors, destructive actions) */
export const RedModal = (props: PresetModalProps) => (
  <Modal theme="red" glowAnimation {...props} />
);

/** Green success modal (success, positive actions) */
export const GreenModal = (props: PresetModalProps) => (
  <Modal theme="green" glowAnimation {...props} />
);

// ---- LEGACY PRESETS (maintained for backwards compatibility) ----

/** @deprecated Use BlueModal instead */
export const MidnightModal = (props: PresetModalProps) => (
  <Modal theme="midnight" glowAnimation {...props} />
);

/** @deprecated Use ArcaneModal instead */
export const EmberModal = (props: PresetModalProps) => (
  <Modal theme="ember" glowAnimation {...props} />
);

/** @deprecated Use GreenModal instead */
export const TealModal = (props: PresetModalProps) => (
  <Modal theme="teal" glowAnimation {...props} />
);

/** Classic parchment styled modal */
export const ClassicModal = (props: PresetModalProps) => <Modal theme="parchment" {...props} />;

/** Terminal/hacker styled modal */
export const TerminalModal = (props: PresetModalProps) => (
  <Modal theme="terminal" scanlines {...props} />
);

/** @deprecated Use ArcaneModal instead */
export const ElegantModal = ArcaneModal;

/** @deprecated Use ArcaneModal instead */
export const NeonModal = ArcaneModal;

/** @deprecated Use RedModal or PurpleModal instead */
export const VelvetModal = (props: PresetModalProps) => (
  <Modal theme="velvet" glowAnimation {...props} />
);

/** @deprecated Use ArcaneModal instead */
export const ArcadeModal = (props: PresetModalProps) => (
  <Modal theme="arcade" glowAnimation {...props} />
);

/** @deprecated Use BlueModal instead */
export const HologramModal = (props: PresetModalProps) => (
  <Modal theme="hologram" glowAnimation {...props} />
);

export default Modal;
