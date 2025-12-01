/**
 * UIDropdownMenu Component
 * Sprint 21: Storybook UI System
 *
 * Reusable dropdown menu component for navigation and action menus.
 * Provides consistent styling, keyboard navigation, and accessibility.
 *
 * Features:
 * - Multiple trigger types (button, custom element)
 * - Click-outside to close
 * - Keyboard navigation (Escape to close)
 * - Customizable position (top, bottom, left, right)
 * - Menu items with icons, dividers, and danger states
 * - Accessible with ARIA attributes
 *
 * Usage:
 * ```tsx
 * <UIDropdownMenu
 *   trigger={<Button>Open Menu</Button>}
 *   items={[
 *     { label: 'View Profile', icon: '👤', onClick: handleViewProfile },
 *     { label: 'Settings', icon: '⚙️', onClick: handleSettings },
 *     { type: 'divider' },
 *     { label: 'Logout', icon: '🚪', onClick: handleLogout, danger: true },
 *   ]}
 * />
 * ```
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { UICard } from './UICard';
import { Button } from './Button';
import { UIDivider } from './UIDivider';

export type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

export interface DropdownMenuItem {
  type?: 'item' | 'divider';
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  'data-testid'?: string;
}

export interface UIDropdownMenuProps {
  /** Trigger element that opens the dropdown */
  trigger: ReactNode;
  /** Menu items to display */
  items: DropdownMenuItem[];
  /** Position of dropdown relative to trigger */
  position?: DropdownPosition;
  /** Width of the dropdown menu */
  width?: 'auto' | 'sm' | 'md' | 'lg';
  /** Close dropdown when an item is clicked */
  closeOnItemClick?: boolean;
  /** Controlled open state */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
  /** Additional className for the container */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

const widthClasses = {
  auto: 'min-w-[150px]',
  sm: 'w-40',
  md: 'w-56',
  lg: 'w-72',
};

export function UIDropdownMenu({
  trigger,
  items,
  position = 'bottom-right',
  width = 'md',
  closeOnItemClick = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  className = '',
  testId = 'dropdown-menu',
}: UIDropdownMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(value);
    }
    onOpenChange?.(value);
  };

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = width === 'sm' ? 160 : width === 'md' ? 224 : width === 'lg' ? 288 : 150;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'bottom-left':
          top = rect.bottom + 8;
          left = rect.left;
          break;
        case 'bottom-right':
          top = rect.bottom + 8;
          left = rect.right - dropdownWidth;
          break;
        case 'top-left':
          top = rect.top - 8;
          left = rect.left;
          break;
        case 'top-right':
          top = rect.top - 8;
          left = rect.right - dropdownWidth;
          break;
      }

      // Ensure dropdown doesn't go off-screen
      left = Math.max(8, Math.min(left, window.innerWidth - dropdownWidth - 8));

      setDropdownPosition({ top, left });
    }
  }, [isOpen, position, width]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    if (closeOnItemClick) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} data-testid={testId}>
      {/* Trigger */}
      <div ref={triggerRef} onClick={handleTriggerClick} data-testid={`${testId}-trigger`}>
        {trigger}
      </div>

      {/* Dropdown Menu - Rendered via portal to escape overflow:hidden */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <UICard
            variant="elevated"
            size="sm"
            className={`${widthClasses[width]} animate-fade-in !p-0`}
            data-testid={`${testId}-content`}
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              {items.map((item, index) => {
                if (item.type === 'divider') {
                  return <UIDivider key={index} className="my-1" />;
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleItemClick(item)}
                    variant={item.danger ? 'danger' : 'ghost'}
                    size="sm"
                    disabled={item.disabled}
                    className={`w-full justify-start px-4 py-2 rounded-none ${
                      item.danger ? '!bg-transparent hover:!bg-red-50 dark:hover:!bg-red-900/20' : ''
                    }`}
                    role="menuitem"
                    data-testid={item['data-testid']}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </UICard>
        </div>,
        document.body
      )}
    </div>
  );
}
