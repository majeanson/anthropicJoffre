/**
 * CardTooltip Component
 * Tooltip displayed when hovering over disabled cards to explain why they can't be played
 */

interface CardTooltipProps {
  content: string;
  isVisible: boolean;
}

export function CardTooltip({ content, isVisible }: CardTooltipProps) {
  if (!isVisible) return null;

  return (
    <div
      role="tooltip"
      className={`
        absolute z-50
        bottom-full left-1/2 -translate-x-1/2 mb-2
        px-3 py-2
        text-xs sm:text-sm font-medium
        rounded-lg
        whitespace-nowrap
        pointer-events-none
        transition-all duration-200
        border-2 border-solid
        bg-error text-white border-error
        shadow-lg
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-95'}
      `}
    >
      {content}
      {/* Arrow pointing down */}
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid var(--color-error)',
        }}
      />
    </div>
  );
}
