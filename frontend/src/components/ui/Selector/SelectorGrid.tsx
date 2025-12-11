/**
 * SelectorGrid Component
 *
 * Responsive grid layout for selector cards with configurable columns.
 *
 * @example
 * <SelectorGrid columns={2}>
 *   {items.map(item => (
 *     <SelectorCard key={item.id} ... />
 *   ))}
 * </SelectorGrid>
 */

import { ReactNode } from 'react';

export interface SelectorGridProps {
  /** Number of columns (responsive) */
  columns?: 1 | 2 | 3 | 4;
  /** Gap size between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Grid content (SelectorCard components) */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
};

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function SelectorGrid({
  columns = 2,
  gap = 'md',
  children,
  className = '',
}: SelectorGridProps) {
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

export default SelectorGrid;
