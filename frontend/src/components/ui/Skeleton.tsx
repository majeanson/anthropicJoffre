/**
 * Skeleton Component Library
 * Task 13: Add Loading Skeletons
 *
 * Reusable skeleton components for loading states across the application.
 * Provides better perceived performance and professional UX.
 */

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Base Skeleton component
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`animate-pulse bg-skin-tertiary ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
      role="status"
    />
  );
}

/**
 * Table skeleton for leaderboards and stats tables
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({ rows = 5, columns = 3, showHeader = true }: TableSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 pb-3 border-b border-skin-subtle">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} width={i === 0 ? '40%' : '30%'} height="24px" />
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`row-${rowIndex}-col-${colIndex}`}
              width={colIndex === 0 ? '40%' : '30%'}
              height="40px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton for player cards, stats cards
 */
interface CardSkeletonProps {
  count?: number;
  hasAvatar?: boolean;
}

export function CardSkeleton({ count = 1, hasAvatar = false }: CardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-skin-tertiary rounded-lg p-4 border border-skin-subtle">
          <div className="flex items-center gap-3">
            {hasAvatar && <Skeleton variant="circular" width="48px" height="48px" />}
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height="20px" />
              <Skeleton width="40%" height="16px" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton for messages, conversations
 */
interface ListSkeletonProps {
  count?: number;
  hasAvatar?: boolean;
  hasSecondaryText?: boolean;
}

export function ListSkeleton({
  count = 5,
  hasAvatar = true,
  hasSecondaryText = true,
}: ListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 hover:bg-skin-tertiary rounded-lg">
          {hasAvatar && <Skeleton variant="circular" width="40px" height="40px" />}
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height="16px" />
            {hasSecondaryText && <Skeleton width="50%" height="14px" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Stats grid skeleton for player statistics
 */
interface StatsGridSkeletonProps {
  columns?: number;
  rows?: number;
}

export function StatsGridSkeleton({ columns = 2, rows = 4 }: StatsGridSkeletonProps) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {Array.from({ length: columns * rows }).map((_, index) => (
        <div key={index} className="bg-skin-tertiary rounded-lg p-4 border border-skin-subtle">
          <Skeleton width="60%" height="16px" className="mb-2" />
          <Skeleton width="80%" height="32px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Text block skeleton for paragraphs
 */
interface TextBlockSkeletonProps {
  lines?: number;
}

export function TextBlockSkeleton({ lines = 3 }: TextBlockSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? '70%' : '100%'} height="16px" />
      ))}
    </div>
  );
}

/**
 * Avatar with text skeleton
 */
export function AvatarTextSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1 space-y-2">
        <Skeleton width="150px" height="20px" />
        <Skeleton width="100px" height="16px" />
      </div>
    </div>
  );
}

/**
 * Button skeleton
 */
interface ButtonSkeletonProps {
  width?: string;
  fullWidth?: boolean;
}

export function ButtonSkeleton({ width = '120px', fullWidth = false }: ButtonSkeletonProps) {
  return <Skeleton width={fullWidth ? '100%' : width} height="40px" className="rounded-lg" />;
}
