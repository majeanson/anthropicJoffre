/**
 * SelectorInfo Component
 *
 * Standard info section for selector cards with title, subtitle, and description.
 *
 * @example
 * <SelectorInfo
 *   title="Midnight Theme"
 *   subtitle="Dark"
 *   description="A sleek dark theme with purple accents"
 * />
 */

import { ReactNode } from 'react';

export interface SelectorInfoProps {
  /** Main title */
  title: string;
  /** Optional subtitle/badge (displayed inline with title) */
  subtitle?: ReactNode;
  /** Description text */
  description?: string;
  /** Maximum lines for description (1-3) */
  descriptionLines?: 1 | 2 | 3;
  /** Additional CSS classes */
  className?: string;
}

const lineClampClasses = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
};

export function SelectorInfo({
  title,
  subtitle,
  description,
  descriptionLines = 2,
  className = '',
}: SelectorInfoProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-skin-primary uppercase tracking-wider text-sm truncate">
          {title}
        </h3>
        {subtitle && (
          <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-skin-tertiary text-skin-text-secondary">
            {subtitle}
          </span>
        )}
      </div>
      {description && (
        <p
          className={`text-xs text-skin-text-muted font-body ${lineClampClasses[descriptionLines]}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export default SelectorInfo;
