/**
 * Tabs Component - Multi-Skin Edition
 *
 * Tab navigation with proper CSS variable support for all themes.
 *
 * Features:
 * - 4 variants: underline, pills, arcane, boxed
 * - 3 sizes: sm, md, lg
 * - Badge support
 * - Full width option
 * - Full accessibility (ARIA tabs pattern)
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

  // Variant-specific container styles using CSS variables
  const containerStyles: Record<TabVariant, string> = {
    underline: 'border-b-2 border-[var(--color-border-default)]',
    pills: 'gap-2',
    arcane:
      'gap-1 p-1 bg-[var(--color-bg-tertiary)]/50 rounded-[var(--radius-lg)] border border-[var(--color-border-default)]',
    boxed:
      'gap-1 p-1 bg-[var(--color-bg-tertiary)]/50 rounded-[var(--radius-lg)] border border-[var(--color-border-default)]',
  };

  return (
    <div
      role="tablist"
      className={`
        flex
        overflow-x-auto
        scrollbar-thin scrollbar-thumb-[var(--color-border-default)] scrollbar-track-transparent
        ${containerStyles[variant]}
        ${className}
      `}
      style={{
        // Hide scrollbar on mobile but allow scrolling
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled;

        // Variant-specific tab button styles using CSS variables
        const getTabStyles = () => {
          switch (variant) {
            case 'underline':
              return {
                base: 'border-b-2 -mb-[2px] transition-all duration-[var(--duration-normal)]',
                active: `
                  border-[var(--color-text-accent)] text-[var(--color-text-accent)]
                `,
                inactive: `
                  border-transparent text-[var(--color-text-secondary)]
                  hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-accent)]/50
                `,
              };
            case 'pills':
              return {
                base: 'rounded-full transition-all duration-[var(--duration-normal)]',
                active: `
                  bg-gradient-to-r from-[var(--color-bg-accent)] to-[color-mix(in_srgb,var(--color-bg-accent)_80%,var(--color-text-accent))]
                  text-[var(--color-text-inverse)] font-semibold
                  shadow-[var(--shadow-glow)]
                `,
                inactive: `
                  bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]
                  hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]
                `,
              };
            case 'arcane':
              return {
                base: 'rounded-[var(--radius-md)] transition-all duration-[var(--duration-normal)] relative',
                active: `
                  bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]
                  text-[var(--color-text-accent)]
                  shadow-[var(--shadow-md)]
                  border border-[var(--color-text-accent)]/40
                `,
                inactive: `
                  text-[var(--color-text-muted)]
                  hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]/50
                `,
              };
            case 'boxed':
              return {
                base: 'rounded-[var(--radius-md)] transition-all duration-[var(--duration-normal)] relative border',
                active: `
                  bg-gradient-to-b from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]
                  text-[var(--color-text-accent)]
                  shadow-[var(--shadow-md)]
                  border-[var(--color-text-accent)]/40
                `,
                inactive: `
                  text-[var(--color-text-muted)] border-transparent
                  hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]/50 hover:border-[var(--color-border-default)]
                `,
              };
            default:
              return {
                base: 'border-b-2 -mb-[2px] transition-all duration-[var(--duration-normal)]',
                active: 'border-[var(--color-text-accent)] text-[var(--color-text-accent)]',
                inactive:
                  'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-accent)]/50',
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
              ${fullWidth ? 'flex-1' : 'flex-shrink-0'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              inline-flex items-center justify-center gap-2
              font-display font-medium tracking-wide whitespace-nowrap
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-[var(--color-text-accent)]
              focus-visible:ring-offset-2
              focus-visible:ring-offset-[var(--color-bg-primary)]
            `}
          >
            {/* Icon */}
            {tab.icon && (
              <span className={sizeStyle.icon} aria-hidden="true">
                {tab.icon}
              </span>
            )}

            {/* Label */}
            <span className="uppercase">{tab.label}</span>

            {/* Badge */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`
                  ${sizeStyle.badge}
                  inline-flex items-center justify-center
                  rounded-full font-display font-bold
                  ${
                    isActive
                      ? 'bg-[var(--color-text-accent)] text-[var(--color-text-inverse)]'
                      : 'bg-[var(--color-error)] text-white'
                  }
                `}
                style={{
                  boxShadow: isActive
                    ? '0 2px 8px var(--color-glow)'
                    : '0 2px 8px color-mix(in srgb, var(--color-error) 40%, transparent)',
                }}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}

            {/* Arcane corner accents for active arcane variant */}
            {variant === 'arcane' && isActive && (
              <>
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[var(--color-text-accent)] rounded-tl-sm opacity-60" />
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[var(--color-text-accent)] rounded-tr-sm opacity-60" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[var(--color-text-accent)] rounded-bl-sm opacity-60" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[var(--color-text-accent)] rounded-br-sm opacity-60" />
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
 * Content panel for a tab
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
    >
      {children}
    </div>
  );
}

// ============================================================================
// PRESET TAB COMPONENTS
// ============================================================================

/** Arcane tabs with corner accents */
export const ArcaneTabs = (props: Omit<TabsProps, 'variant'>) => (
  <Tabs variant="arcane" {...props} />
);

/** Pill tabs */
export const PillTabs = (props: Omit<TabsProps, 'variant'>) => <Tabs variant="pills" {...props} />;

export default Tabs;
