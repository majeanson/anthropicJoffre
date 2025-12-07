import { colors } from '../design-system';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'button';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  const baseClasses = `animate-pulse bg-gradient-to-r ${colors.gradients.neutral} bg-[length:200%_100%] motion-safe:animate-[shimmer_2s_ease-in-out_infinite]`;

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
    card: 'h-32 rounded-lg',
    button: 'h-10 rounded-lg',
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={getStyle()}
            data-testid="skeleton"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={getStyle()}
      data-testid="skeleton"
    />
  );
}

// Compound components for common patterns
export function SkeletonCard() {
  return (
    <div
      className="bg-skin-primary border-2 border-skin-default rounded-lg p-4 space-y-3"
      data-testid="skeleton-card"
    >
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" count={3} />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="button" width={100} />
        <Skeleton variant="button" width={100} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" data-testid="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-skin-primary rounded-lg border border-skin-default"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGameCard() {
  return (
    <div
      className="bg-skin-primary border-2 border-skin-default rounded-lg p-4"
      data-testid="skeleton-game-card"
    >
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="rectangular" width={60} height={24} />
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="button" className="flex-1" />
        <Skeleton variant="button" width={80} />
      </div>
    </div>
  );
}
