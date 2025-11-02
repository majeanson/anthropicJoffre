/**
 * Connection Quality Indicator
 * Sprint 6: Connection Quality Monitoring
 *
 * Displays real-time connection status and ping latency
 * Shows warnings for poor connection quality
 */

import { useEffect } from 'react';
import { ConnectionStats } from '../hooks/useConnectionQuality';

interface ConnectionQualityIndicatorProps {
  stats: ConnectionStats;
  showToast?: (message: string, type: 'info' | 'warning' | 'error') => void;
}

export function ConnectionQualityIndicator({ stats, showToast }: ConnectionQualityIndicatorProps) {
  const { ping, quality } = stats;

  // Show warning toast for poor connection
  useEffect(() => {
    if (quality === 'poor' && showToast) {
      showToast('Poor connection detected. Game may lag.', 'warning');
    } else if (quality === 'offline' && showToast) {
      showToast('Connection lost. Attempting to reconnect...', 'error');
    }
  }, [quality, showToast]);

  // Get color and icon based on quality
  const getQualityDisplay = () => {
    switch (quality) {
      case 'excellent':
        return {
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-green-500 dark:border-green-600',
          icon: '🟢',
          label: 'Excellent',
        };
      case 'good':
        return {
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          border: 'border-blue-500 dark:border-blue-600',
          icon: '🔵',
          label: 'Good',
        };
      case 'fair':
        return {
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          border: 'border-yellow-500 dark:border-yellow-600',
          icon: '🟡',
          label: 'Fair',
        };
      case 'poor':
        return {
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-red-500 dark:border-red-600',
          icon: '🔴',
          label: 'Poor',
        };
      case 'offline':
        return {
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          border: 'border-gray-500 dark:border-gray-600',
          icon: '⚫',
          label: 'Offline',
        };
    }
  };

  const display = getQualityDisplay();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${display.bg} ${display.border} transition-all duration-300`}
      title={`Connection: ${display.label}${ping ? ` (${ping}ms)` : ''}`}
    >
      <span className="text-base">{display.icon}</span>
      <div className="flex flex-col items-start">
        <span className={`text-xs font-medium ${display.color}`}>
          {display.label}
        </span>
        {ping !== null && (
          <span className={`text-xs font-mono ${display.color}`}>
            {ping}ms
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for in-game display
 */
export function ConnectionQualityBadge({ stats }: { stats: ConnectionStats }) {
  const { ping, quality } = stats;

  const getIcon = () => {
    switch (quality) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'fair': return '🟡';
      case 'poor': return '🔴';
      case 'offline': return '⚫';
    }
  };

  return (
    <div
      className="inline-flex items-center gap-1 text-xs font-mono opacity-70 hover:opacity-100 transition-opacity"
      title={`Connection: ${quality}${ping ? ` (${ping}ms)` : ''}`}
    >
      <span>{getIcon()}</span>
      {ping !== null && <span>{ping}ms</span>}
    </div>
  );
}
