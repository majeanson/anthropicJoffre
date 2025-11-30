/**
 * Tabs Component - Midnight Alchemy Edition
 *
 * Mystical tab navigation with brass frame aesthetics and ethereal transitions.
 * Features arcane underlines and sacred geometry accents.
 *
 * Features:
 * - 3 variants: underline, pills, arcane
 * - 3 sizes: sm, md, lg
 * - Ethereal glow on active states
 * - Badge support with copper accents
 * - Full width option
 * - Full accessibility (ARIA tabs pattern)
 *
 * Usage:
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'grimoire', label: 'Grimoire', icon: '📖' },
 *     { id: 'potions', label: 'Potions', badge: 3 },
 *     { id: 'runes', label: 'Runes' },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */

import { ReactNode } from 'react';

export type TabVariant = 'underline' | 'pills' | 'arcane' | 'boxed';
export type TabSize = 'sm' | 'md' | 'lg';

export interface Tab {
  /** Unique tab identifier */
  id: string;
  /** Tab label */
  label: ReactNode;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional badge count */
  badge?: number;
  /** Disabled state */
  disabled?: boolean;
}

export interface TabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Called when tab changes */
  onChange: (tabId: string) => void;
  /** Tab variant */
  variant?: TabVariant;
  /** Tab size */
  size?: TabSize;
  /** Full width (tabs stretch to fill container) */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
}

const sizeClasses: Record<TabSize, { tab: string; icon: string; badge: string }> = {
  sm: {
    tab: 'px-3 py-2 text-sm',
    icon: 'text-sm',
    badge: 'text-xs px-1.5 py-0.5 min-w-[1.25rem]',
  },
  md: {
    tab: 'px-4 py-2.5 text-base',
    icon: 'text-base',
    badge: 'text-xs px-2 py-0.5 min-w-[1.5rem]',
  },
  lg: {
    tab: 'px-5 py-3 text-lg',
    icon: 'text-lg',
    badge: 'text-sm px-2 py-0.5 min-w-[1.75rem]',
  },
};

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className = '',
}: TabsProps) {
  const sizeStyle = sizeClasses[size];

  // Variant-specific container styles
  const containerStyles: Record<TabVariant, string> = {
    underline: 'border-b-2 border-[#2D3548]',
    pills: 'gap-2',
    arcane: 'gap-1 p-1 bg-[#0B0E14]/50 rounded-lg border border-[#2D3548]',
    boxed: 'gap-1 p-1 bg-[#0B0E14]/50 rounded-lg border border-[#2D3548]',
  };

  return (
    <div
      role="tablist"
      className={`
        flex
        ${containerStyles[variant]}
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled;

        // Variant-specific tab button styles
        const getTabStyles = () => {
          switch (variant) {
            case 'underline':
              return {
                base: 'border-b-2 -mb-[2px] transition-all duration-300',
                active: `
                  border-[#C17F59] text-[#D4A574]
                `,
                inactive: `
                  border-transparent text-[#9CA3AF]
                  hover:text-[#E8E4DC] hover:border-[#C17F59]/50
                `,
              };
            case 'pills':
              return {
                base: 'rounded-full transition-all duration-300',
                active: `
                  bg-gradient-to-r from-[#C17F59] to-[#D4A574]
                  text-[#0B0E14] font-semibold
                  shadow-[0_4px_20px_rgba(193,127,89,0.4),0_0_30px_rgba(212,165,116,0.2)]
                `,
                inactive: `
                  bg-[#1A1F2E] text-[#9CA3AF]
                  hover:bg-[#2D3548] hover:text-[#E8E4DC]
                `,
              };
            case 'arcane':
              return {
                base: 'rounded-md transition-all duration-300 relative',
                active: `
                  bg-gradient-to-b from-[#1A1F2E] to-[#131824]
                  text-[#D4A574]
                  shadow-[0_4px_15px_rgba(193,127,89,0.2),inset_0_1px_0_rgba(212,165,116,0.1)]
                  border border-[#C17F59]/40
                `,
                inactive: `
                  text-[#6B7280]
                  hover:text-[#9CA3AF] hover:bg-[#131824]/50
                `,
              };
            case 'boxed':
              return {
                base: 'rounded-md transition-all duration-300 relative border',
                active: `
                  bg-gradient-to-b from-[#1A1F2E] to-[#131824]
                  text-[#D4A574]
                  shadow-[0_4px_15px_rgba(193,127,89,0.2)]
                  border-[#C17F59]/40
                `,
                inactive: `
                  text-[#6B7280] border-transparent
                  hover:text-[#9CA3AF] hover:bg-[#131824]/50 hover:border-[#2D3548]
                `,
              };
            default:
              return {
                base: 'border-b-2 -mb-[2px] transition-all duration-300',
                active: 'border-[#C17F59] text-[#D4A574]',
                inactive: 'border-transparent text-[#9CA3AF] hover:text-[#E8E4DC] hover:border-[#C17F59]/50',
              };
          }
        };

        const tabStyles = getTabStyles();

        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(tab.id)}
            className={`
              ${sizeStyle.tab}
              ${tabStyles.base}
              ${isActive ? tabStyles.active : tabStyles.inactive}
              ${fullWidth ? 'flex-1' : ''}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              inline-flex items-center justify-center gap-2
              font-medium tracking-wide
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#C17F59]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[#0B0E14]
            `}
            style={{
              fontFamily: '"Cinzel", Georgia, serif',
            }}
          >
            {/* Icon with ethereal glow */}
            {tab.icon && (
              <span
                className={sizeStyle.icon}
                aria-hidden="true"
                style={{
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(212, 165, 116, 0.6))' : undefined,
                }}
              >
                {tab.icon}
              </span>
            )}

            {/* Label */}
            <span className="uppercase">{tab.label}</span>

            {/* Badge with alchemical styling */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`
                  ${sizeStyle.badge}
                  inline-flex items-center justify-center
                  rounded-full font-bold
                `}
                style={{
                  fontFamily: '"Cinzel", Georgia, serif',
                  backgroundColor: isActive
                    ? variant === 'pills'
                      ? 'rgba(11, 14, 20, 0.4)'
                      : '#C17F59'
                    : '#8B3D3D',
                  color: isActive && variant !== 'pills'
                    ? '#0B0E14'
                    : '#E8E4DC',
                  boxShadow: isActive
                    ? '0 2px 8px rgba(193, 127, 89, 0.4)'
                    : '0 2px 8px rgba(139, 61, 61, 0.4)',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}

            {/* Arcane corner accents for active arcane variant */}
            {variant === 'arcane' && isActive && (
              <>
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#C17F59] rounded-tl-sm opacity-60" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#C17F59] rounded-tr-sm opacity-60" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#C17F59] rounded-bl-sm opacity-60" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#C17F59] rounded-br-sm opacity-60" />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TabPanel Component
 * Content panel for a tab with mystical fade animation
 */
export interface TabPanelProps {
  /** Tab ID this panel corresponds to */
  tabId: string;
  /** Currently active tab ID */
  activeTab: string;
  /** Panel content */
  children: ReactNode;
  /** Additional classes */
  className?: string;
}

export function TabPanel({ tabId, activeTab, children, className = '' }: TabPanelProps) {
  if (tabId !== activeTab) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={`animate-fade-in ${className}`}
      style={{
        animation: 'fade-in 0.3s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// PRESET TAB COMPONENTS
// ============================================================================

/** Arcane tabs with sacred geometry styling */
export const ArcaneTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="arcane" {...props} />
);

/** Pill tabs with ethereal glow */
export const PillTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="pills" {...props} />
);

export default Tabs;
