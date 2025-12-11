/**
 * SelectorPreview Component
 *
 * Standard preview area for selector cards with gradient background support.
 *
 * @example
 * <SelectorPreview background={skin.preview}>
 *   <div>Preview content</div>
 * </SelectorPreview>
 */

import { ReactNode } from 'react';

export interface SelectorPreviewProps {
  /** Background color, gradient, or image */
  background?: string;
  /** Height of preview area */
  height?: 'sm' | 'md' | 'lg';
  /** Content to display in preview */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const heightClasses = {
  sm: 'h-16',
  md: 'h-20',
  lg: 'h-24',
};

export function SelectorPreview({
  background,
  height = 'md',
  children,
  className = '',
}: SelectorPreviewProps) {
  return (
    <div
      className={`
        w-full
        ${heightClasses[height]}
        rounded-[var(--radius-md)]
        mb-3
        flex items-center justify-center
        ${className}
      `}
      style={background ? { background } : undefined}
    >
      {children}
    </div>
  );
}

export default SelectorPreview;
