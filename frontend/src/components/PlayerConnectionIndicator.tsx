import React from 'react';
import { ConnectionStatus } from '../types/game';

interface PlayerConnectionIndicatorProps {
  status?: ConnectionStatus;
  reconnectTimeLeft?: number;
  playerName?: string;
  small?: boolean;
}

export const PlayerConnectionIndicator: React.FC<PlayerConnectionIndicatorProps> = ({
  status = 'connected',
  reconnectTimeLeft,
  playerName,
  small = false,
}) => {
  // Format time remaining
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine indicator styling based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'connected':
        return {
          bg: 'bg-green-500',
          text: 'text-green-600',
          icon: '✓',
          label: 'Connected',
          pulse: false,
        };
      case 'disconnected':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          icon: '✕',
          label: 'Disconnected',
          pulse: true,
        };
      case 'reconnecting':
        return {
          bg: 'bg-yellow-500',
          text: 'text-yellow-600',
          icon: '↻',
          label: 'Reconnecting',
          pulse: true,
        };
      default:
        return {
          bg: 'bg-gray-500',
          text: 'text-gray-600',
          icon: '?',
          label: 'Unknown',
          pulse: false,
        };
    }
  };

  const { bg, text, label, pulse } = getStatusStyles();
  const sizeClass = small ? 'w-2 h-2' : 'w-3 h-3';

  if (small) {
    // Small indicator - just a colored dot
    return (
      <div className="relative inline-block">
        <div
          className={`${sizeClass} ${bg} rounded-full ${
            pulse ? 'animate-pulse' : ''
          }`}
          title={`${playerName ? playerName + ' - ' : ''}${label}${
            reconnectTimeLeft !== undefined ? ` (${formatTime(reconnectTimeLeft)})` : ''
          }`}
        />
      </div>
    );
  }

  // Full indicator with text
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClass} ${bg} rounded-full ${
            pulse ? 'animate-pulse' : ''
          }`}
        />
        {pulse && (
          <div
            className={`absolute inset-0 ${bg} rounded-full animate-ping opacity-75`}
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${text}`}>
          {playerName && <span className="text-gray-700 dark:text-gray-300">{playerName} - </span>}
          {label}
        </span>
        {status === 'disconnected' && reconnectTimeLeft !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Time remaining: {formatTime(reconnectTimeLeft)}
          </span>
        )}
      </div>
    </div>
  );
};

// Player card with integrated connection status
interface PlayerCardWithStatusProps {
  playerName: string;
  teamId: 1 | 2;
  isCurrentPlayer?: boolean;
  connectionStatus?: ConnectionStatus;
  reconnectTimeLeft?: number;
  isBot?: boolean;
}

export const PlayerCardWithStatus: React.FC<PlayerCardWithStatusProps> = ({
  playerName,
  teamId,
  isCurrentPlayer,
  connectionStatus = 'connected',
  reconnectTimeLeft,
  isBot,
}) => {
  const teamColor = teamId === 1 ? 'bg-orange-100 border-orange-400' : 'bg-purple-100 border-purple-400';
  const teamColorDark = teamId === 1 ? 'dark:bg-orange-900/20 dark:border-orange-600' : 'dark:bg-purple-900/20 dark:border-purple-600';

  const isDisconnected = connectionStatus === 'disconnected';
  const opacity = isDisconnected ? 'opacity-50' : '';

  return (
    <div
      className={`relative p-3 rounded-lg border-2 ${teamColor} ${teamColorDark} ${opacity} transition-opacity duration-300`}
    >
      {/* Connection status indicator in top-right corner */}
      {!isBot && (
        <div className="absolute top-1 right-1">
          <PlayerConnectionIndicator
            status={connectionStatus}
            reconnectTimeLeft={reconnectTimeLeft}
            small
          />
        </div>
      )}

      {/* Player name */}
      <div className="flex items-center gap-2">
        <span className={`font-medium ${isDisconnected ? 'line-through' : ''}`}>
          {playerName}
        </span>
        {isCurrentPlayer && (
          <span className="text-xs text-green-600 dark:text-green-400">(You)</span>
        )}
        {isBot && (
          <span className="text-xs bg-blue-500 text-white px-1 rounded">BOT</span>
        )}
      </div>

      {/* Disconnection message */}
      {isDisconnected && reconnectTimeLeft !== undefined && (
        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
          Reconnecting... {Math.floor(reconnectTimeLeft / 60)}:{(reconnectTimeLeft % 60).toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
};

export default PlayerConnectionIndicator;