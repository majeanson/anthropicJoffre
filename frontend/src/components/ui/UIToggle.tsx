/**
 * UIToggle Component
 * Unified toggle switch component for boolean settings
 *
 * Replaces inline toggle implementations across the codebase
 */

import React from 'react';

export type ToggleSize = 'sm' | 'md' | 'lg';
export type ToggleColor = 'green' | 'blue' | 'amber' | 'purple';

export interface UIToggleProps {
  /** Whether the toggle is enabled */
  enabled: boolean;
  /** Callback when toggle state changes */
  onChange: (enabled: boolean) => void;
  /** Accessible label for the toggle */
  label?: string;
  /** Size variant */
  size?: ToggleSize;
  /** Color when enabled */
  color?: ToggleColor;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

const sizeConfig: Record<ToggleSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3 top-0.5 left-0.5',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4 top-1 left-1',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5 top-1 left-1',
    translate: 'translate-x-7',
  },
};

const colorConfig: Record<ToggleColor, string> = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
};

export function UIToggle({
  enabled,
  onChange,
  label,
  size = 'md',
  color = 'green',
  disabled = false,
  className = '',
  'data-testid': testId,
}: UIToggleProps) {
  const config = sizeConfig[size];
  const enabledColor = colorConfig[color];

  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      data-testid={testId}
      title={label ? `${enabled ? 'Disable' : 'Enable'} ${label}` : undefined}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
        ${config.track}
        ${enabled ? enabledColor : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          absolute bg-white rounded-full shadow-md transition-transform duration-200
          ${config.thumb}
          ${enabled ? config.translate : 'translate-x-0'}
        `}
      />
    </button>
  );
}

/**
 * UIToggleField Component
 * Toggle with label and optional description
 */
export interface UIToggleFieldProps extends UIToggleProps {
  /** Label displayed next to the toggle */
  fieldLabel: string;
  /** Optional description text */
  description?: string;
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Whether to show toggle on left or right */
  togglePosition?: 'left' | 'right';
}

export function UIToggleField({
  fieldLabel,
  description,
  icon,
  togglePosition = 'right',
  ...toggleProps
}: UIToggleFieldProps) {
  const toggle = <UIToggle {...toggleProps} label={toggleProps.label || fieldLabel} />;

  return (
    <div className="flex items-center justify-between gap-4">
      {togglePosition === 'left' && toggle}

      <div className={`flex-1 ${togglePosition === 'left' ? 'text-right' : ''}`}>
        <div className="flex items-center gap-2">
          {togglePosition === 'right' && icon && (
            <span className="text-xl flex-shrink-0">{icon}</span>
          )}
          <span className="text-umber-900 dark:text-gray-100 font-semibold">{fieldLabel}</span>
          {togglePosition === 'left' && icon && (
            <span className="text-xl flex-shrink-0">{icon}</span>
          )}
        </div>
        {description && (
          <p
            className={`text-xs text-umber-600 dark:text-gray-400 mt-0.5 ${
              togglePosition === 'right' && icon ? 'ml-7' : ''
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {togglePosition === 'right' && toggle}
    </div>
  );
}

export default UIToggle;
