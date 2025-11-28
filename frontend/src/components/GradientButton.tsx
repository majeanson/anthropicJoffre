import { ButtonHTMLAttributes } from 'react';
import { designTokens } from '../styles/designTokens';

export type ButtonVariant = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'gray' | 'amber';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  blue: `bg-gradient-to-r ${designTokens.gradients.primary} hover:from-blue-700 hover:to-blue-800 border-blue-800`,
  green: `bg-gradient-to-r ${designTokens.gradients.success} hover:from-green-700 hover:to-green-800 border-green-800`,
  purple: `bg-gradient-to-r ${designTokens.gradients.team2} hover:from-purple-700 hover:to-purple-800 border-purple-800`,
  orange: `bg-gradient-to-r ${designTokens.gradients.team1} hover:from-orange-600 hover:to-orange-700 border-orange-700`,
  red: `bg-gradient-to-r ${designTokens.gradients.error} hover:from-red-700 hover:to-red-800 border-red-800`,
  yellow: `bg-gradient-to-r ${designTokens.gradients.special} hover:from-yellow-700 hover:to-yellow-800 border-yellow-800`,
  gray: `bg-gradient-to-r ${designTokens.gradients.secondary} hover:from-gray-600 hover:to-gray-700 border-gray-700`,
  amber: `bg-gradient-to-r ${designTokens.gradients.warning} hover:from-amber-700 hover:to-amber-800 border-amber-800`,
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-3 text-lg',
};

export function GradientButton({
  variant = 'blue',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  disabled = false,
  ...props
}: GradientButtonProps) {
  const baseClasses = 'text-white rounded-lg font-bold transition-all duration-300 border-2 shadow-lg transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  const focusRingClass = disabled ? '' : 'focus:ring-blue-400';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClasses} ${focusRingClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
