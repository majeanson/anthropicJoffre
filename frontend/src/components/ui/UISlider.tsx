/**
 * UISlider Component
 * Unified range slider component
 *
 * Replaces inline range input implementations
 */

import React from 'react';

export type SliderSize = 'sm' | 'md' | 'lg';
export type SliderColor = 'amber' | 'blue' | 'green' | 'purple' | 'gray';

export interface UISliderProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Size variant */
  size?: SliderSize;
  /** Accent color */
  color?: SliderColor;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Accessible label */
  label?: string;
  /** Show value as tooltip or inline */
  showValue?: boolean;
  /** Format value for display */
  formatValue?: (value: number) => string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

const sizeConfig: Record<SliderSize, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorConfig: Record<SliderColor, string> = {
  amber: 'accent-amber-600',
  blue: 'accent-blue-600',
  green: 'accent-green-600',
  purple: 'accent-purple-600',
  gray: 'accent-gray-600',
};

export function UISlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = 'md',
  color = 'amber',
  disabled = false,
  label,
  // These props exist for API consistency but aren't used in the base slider
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showValue: _showValue = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formatValue: _formatValue = (v: number) => `${v}`,
  className = '',
  'data-testid': testId,
}: UISliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      data-testid={testId}
      className={`
        w-full bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
        ${sizeConfig[size]}
        ${colorConfig[color]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800
        ${className}
      `}
    />
  );
}

/**
 * UISliderField Component
 * Slider with label and value display
 */
export interface UISliderFieldProps extends UISliderProps {
  /** Label displayed above the slider */
  fieldLabel: string;
  /** Show value display */
  showValueLabel?: boolean;
  /** Value label position */
  valueLabelPosition?: 'right' | 'below';
}

export function UISliderField({
  fieldLabel,
  showValueLabel = true,
  valueLabelPosition = 'right',
  formatValue = (v) => `${v}%`,
  ...sliderProps
}: UISliderFieldProps) {
  const valueDisplay = formatValue(sliderProps.value);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-umber-700 dark:text-gray-300 font-medium">{fieldLabel}</span>
        {showValueLabel && valueLabelPosition === 'right' && (
          <span className="text-xs text-umber-600 dark:text-gray-400 tabular-nums">
            {valueDisplay}
          </span>
        )}
      </div>
      <UISlider {...sliderProps} formatValue={formatValue} label={fieldLabel} />
      {showValueLabel && valueLabelPosition === 'below' && (
        <div className="text-center mt-1">
          <span className="text-sm text-umber-600 dark:text-gray-400 tabular-nums">
            {valueDisplay}
          </span>
        </div>
      )}
    </div>
  );
}

export default UISlider;
