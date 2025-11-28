/**
 * UnreadBadge Component
 *
 * Small badge for displaying unread counts (messages, notifications, etc.).
 *
 * Features:
 * - Color variants
 * - Size options
 * - Auto-hide when count is 0
 * - Position variants (inline, absolute)
 *
 * Usage:
 * ```tsx
 * <UnreadBadge count={5} />
 * <UnreadBadge count={99} variant="red" size="sm" />
 * <UnreadBadge count={3} position="absolute" />
 * ```
 */

export type UnreadBadgeVariant = 'blue' | 'red' | 'green' | 'purple';
export type UnreadBadgeSize = 'sm' | 'md' | 'lg';
export type UnreadBadgePosition = 'inline' | 'absolute';

interface UnreadBadgeProps {
  /** Number to display */
  count: number;
  /** Color variant */
  variant?: UnreadBadgeVariant;
  /** Size */
  size?: UnreadBadgeSize;
  /** Position type */
  position?: UnreadBadgePosition;
  /** Max number to display (shows "+") */
  max?: number;
  /** Custom className */
  className?: string;
}

const variantClasses: Record<UnreadBadgeVariant, string> = {
  blue: 'bg-blue-600 text-white',
  red: 'bg-red-500 text-white',
  green: 'bg-green-500 text-white',
  purple: 'bg-purple-600 text-white',
};

const sizeClasses: Record<UnreadBadgeSize, string> = {
  sm: 'text-[10px] min-w-[16px] h-4 px-1',
  md: 'text-xs min-w-[20px] h-5 px-1.5',
  lg: 'text-sm min-w-[24px] h-6 px-2',
};

const positionClasses: Record<UnreadBadgePosition, string> = {
  inline: 'inline-flex',
  absolute: 'absolute -top-1 -right-1',
};

export function UnreadBadge({
  count,
  variant = 'red',
  size = 'md',
  position = 'inline',
  max = 99,
  className = '',
}: UnreadBadgeProps) {
  // Don't render if count is 0
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${positionClasses[position]}
        rounded-full font-bold
        items-center justify-center
        ${className}
      `}
    >
      {displayCount}
    </span>
  );
}
