/**
 * State Display Components
 * Storybook UI Components
 *
 * Standardized components for loading, empty, and error states.
 * Ensures consistent UX across all data-fetching scenarios.
 *
 * Features:
 * - LoadingState: Spinner with optional message
 * - EmptyState: Icon + title + description + optional action
 * - ErrorState: Error message with retry option
 * - Dark mode support
 * - Customizable icons and messages
 *
 * Usage:
 * ```tsx
 * <LoadingState message="Loading games..." />
 *
 * <EmptyState
 *   icon="🎮"
 *   title="No games found"
 *   description="Create a new game to get started"
 *   action={{ label: "Create Game", onClick: handleCreate }}
 * />
 *
 * <ErrorState
 *   message="Failed to load data"
 *   onRetry={handleRetry}
 * />
 * ```
 */

import { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { Button } from './Button';
import { UICard } from './UICard';

// ============================================
// LoadingState Component
// ============================================

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Spinner color */
  color?: 'primary' | 'white' | 'gray';
  /** Use card container */
  card?: boolean;
  /** Additional classes */
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  size = 'lg',
  color = 'primary',
  card = false,
  className = '',
}: LoadingStateProps) {
  const content = (
    <div className={`text-center py-8 ${className}`}>
      <Spinner size={size} color={color} />
      {message && <p className="mt-4 text-gray-600 font-medium">{message}</p>}
    </div>
  );

  if (card) {
    return (
      <UICard variant="bordered" size="md">
        {content}
      </UICard>
    );
  }

  return content;
}

// ============================================
// EmptyState Component
// ============================================

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success';
}

export interface EmptyStateProps {
  /** Large icon or emoji */
  icon?: ReactNode;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: EmptyStateAction;
  /** Use card container */
  card?: boolean;
  /** Compact variant */
  compact?: boolean;
  /** Additional classes */
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  card = false,
  compact = false,
  className = '',
}: EmptyStateProps) {
  const content = (
    <div className={`text-center ${compact ? 'py-6' : 'py-12'} ${className}`}>
      <div className={`${compact ? 'text-4xl' : 'text-6xl'} mb-4`} aria-hidden="true">
        {icon}
      </div>
      <h3
        className={`font-bold text-gray-700 ${compact ? 'text-base' : 'text-lg'}`}
      >
        {title}
      </h3>
      {description && (
        <p className={`text-gray-500 mt-2 ${compact ? 'text-sm' : ''}`}>
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant={action.variant || 'primary'} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );

  if (card) {
    return (
      <UICard variant="bordered" size="md">
        {content}
      </UICard>
    );
  }

  return content;
}

// ============================================
// ErrorState Component
// ============================================

export interface ErrorStateProps {
  /** Error message */
  message: string;
  /** Correlation/Error ID for support */
  correlationId?: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Use card container */
  card?: boolean;
  /** Additional classes */
  className?: string;
}

export function ErrorState({
  message,
  correlationId,
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
  card = false,
  className = '',
}: ErrorStateProps) {
  const content = (
    <div
      className={`bg-red-50 border-2 border-red-400 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          ⚠️
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-red-800 font-semibold">{message}</p>
          {correlationId && (
            <p className="text-xs text-red-700 font-mono mt-2">
              Error ID: {correlationId}
              <br />
              <span className="opacity-75">Please include this ID when reporting the issue</span>
            </p>
          )}
          {onRetry && (
            <div className="mt-3">
              <Button variant="danger" size="sm" onClick={onRetry} disabled={isRetrying}>
                {isRetrying ? 'Retrying...' : `🔄 ${retryLabel}`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (card) {
    return (
      <UICard variant="bordered" size="md" className="p-0 overflow-hidden">
        {content}
      </UICard>
    );
  }

  return content;
}

// ============================================
// DataState Component (Combined Helper)
// ============================================

export interface DataStateProps<T> {
  /** Data array or object */
  data: T[] | T | null | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error?: string | null;
  /** Correlation ID for errors */
  correlationId?: string;
  /** Retry handler for errors */
  onRetry?: () => void;
  /** Empty state config */
  emptyState: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: EmptyStateAction;
  };
  /** Loading message */
  loadingMessage?: string;
  /** Children to render when data is available */
  children: ReactNode;
}

/**
 * DataState - Handles loading/empty/error states automatically
 *
 * @example
 * <DataState
 *   data={games}
 *   isLoading={loading}
 *   error={error}
 *   onRetry={fetchGames}
 *   emptyState={{
 *     icon: '🎮',
 *     title: 'No games found',
 *     description: 'Create a new game to get started',
 *   }}
 * >
 *   {games.map(game => <GameCard key={game.id} game={game} />)}
 * </DataState>
 */
export function DataState<T>({
  data,
  isLoading,
  error,
  correlationId,
  onRetry,
  emptyState,
  loadingMessage,
  children,
}: DataStateProps<T>) {
  // Loading state
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} correlationId={correlationId} onRetry={onRetry} />;
  }

  // Empty state
  const isEmpty = Array.isArray(data) ? data.length === 0 : data === null || data === undefined;

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  // Data available - render children
  return <>{children}</>;
}
