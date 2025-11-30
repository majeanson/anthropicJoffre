/**
 * Tabs Component
 * Storybook UI Component
 *
 * Flexible tab navigation with multiple variants.
 * Supports controlled and uncontrolled modes.
 *
 * Features:
 * - 3 variants: underline, pills, boxed
 * - 3 sizes: sm, md, lg
 * - Icon support
 * - Badge support
 * - Full width option
 * - Dark mode support
 * - Full accessibility (ARIA tabs pattern)
 *
 * Usage:
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'friends', label: 'Friends', icon: '👥' },
 *     { id: 'requests', label: 'Requests', badge: 3 },
 *     { id: 'search', label: 'Search' },
 *   ]}
 *   activeTab={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */

import { ReactNode } from 'react';

export type TabVariant = 'underline' | 'pills' | 'boxed';
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
    tab: 'px-3 py-3 text-sm',
    icon: 'text-sm',
    badge: 'text-xs px-1.5 py-0.5 min-w-[1.25rem]',
  },
  md: {
    tab: 'px-4 py-3 text-base',
    icon: 'text-base',
    badge: 'text-xs px-2 py-0.5 min-w-[1.5rem]',
  },
  lg: {
    tab: 'px-5 py-3 text-lg',
    icon: 'text-lg',
    badge: 'text-sm px-2 py-0.5 min-w-[1.75rem]',
  },
};

const variantClasses: Record<TabVariant, { container: string; tab: string; active: string; inactive: string }> = {
  underline: {
    container: 'border-b-2 border-parchment-300 dark:border-gray-700',
    tab: 'border-b-2 -mb-[2px] transition-colors duration-200',
    active: 'border-blue-500 text-blue-600 dark:text-blue-400',
    inactive: 'border-transparent text-umber-600 dark:text-gray-400 hover:text-umber-900 dark:hover:text-gray-200 hover:border-parchment-400 dark:hover:border-gray-600',
  },
  pills: {
    container: 'gap-2',
    tab: 'rounded-full transition-all duration-200',
    active: 'bg-blue-500 text-white shadow-md',
    inactive: 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600',
  },
  boxed: {
    container: 'bg-parchment-200 dark:bg-gray-800 p-1 rounded-lg gap-1',
    tab: 'rounded-md transition-all duration-200',
    active: 'bg-white dark:bg-gray-700 text-umber-900 dark:text-gray-100 shadow-sm',
    inactive: 'text-umber-600 dark:text-gray-400 hover:text-umber-900 dark:hover:text-gray-200',
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
  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];

  return (
    <div
      role="tablist"
      className={`
        flex
        ${variantStyle.container}
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isDisabled = tab.disabled;

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
              ${variantStyle.tab}
              ${isActive ? variantStyle.active : variantStyle.inactive}
              ${fullWidth ? 'flex-1' : ''}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              inline-flex items-center justify-center gap-2
              font-medium
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
            `}
          >
            {/* Icon */}
            {tab.icon && (
              <span className={sizeStyle.icon} aria-hidden="true">
                {tab.icon}
              </span>
            )}

            {/* Label */}
            <span>{tab.label}</span>

            {/* Badge */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`
                  ${sizeStyle.badge}
                  inline-flex items-center justify-center
                  rounded-full font-bold
                  ${isActive
                    ? variant === 'pills'
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                    : 'bg-red-500 text-white'
                  }
                `}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
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
      className={className}
    >
      {children}
    </div>
  );
}
