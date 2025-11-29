/**
 * Connection Quality Indicator
 * Sprint 6: Connection Quality Monitoring
 *
 * Displays real-time connection status and ping latency
 * Shows warnings for poor connection quality
 */

import { useEffect } from 'react';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { UICard, UICardGradient } from './ui/UICard';

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
  const getQualityDisplay = (): { gradient: UICardGradient; icon: string; label: string } => {
    switch (quality) {
      case 'excellent':
        return { gradient: 'success', icon: '🟢', label: 'Excellent' };
      case 'good':
        return { gradient: 'info', icon: '🔵', label: 'Good' };
      case 'fair':
        return { gradient: 'warning', icon: '🟡', label: 'Fair' };
      case 'poor':
        return { gradient: 'error', icon: '🔴', label: 'Poor' };
      case 'offline':
        return { gradient: 'primary', icon: '⚫', label: 'Offline' };
    }
  };

  const display = getQualityDisplay();

  return (
    <UICard
      variant="gradient"
      gradient={display.gradient}
      size="sm"
      className="inline-flex items-center gap-2 border-2"
    >
      <div
        className="flex items-center gap-2"
        title={`Connection: ${display.label}${ping ? ` (${ping}ms)` : ''}`}
      >
        <span className="text-base">{display.icon}</span>
        <div className="flex flex-col items-start">
          <span className="text-xs font-medium">
            {display.label}
          </span>
          {ping !== null && (
            <span className="text-xs font-mono">
              {ping}ms
            </span>
          )}
        </div>
      </div>
    </UICard>
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
