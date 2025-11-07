/**
 * SocialPanel Component
 * Sprint 4 Phase 4.2: Extracted from Lobby.tsx
 *
 * Displays online players and recent players with join functionality
 */

import { OnlinePlayer } from '../types/game';
import { RecentPlayer } from '../utils/recentPlayers';
import { sounds } from '../utils/sounds';

interface SocialPanelProps {
  socialTab: 'recent' | 'online' | 'chat';
  setSocialTab: (tab: 'recent' | 'online' | 'chat') => void;
  onlinePlayers: OnlinePlayer[];
  recentPlayers: RecentPlayer[];
  playerName: string;
  setPlayerName: (name: string) => void;
  onJoinGame: (gameId: string, playerName: string) => void;
}

export function SocialPanel({
  socialTab,
  setSocialTab,
  onlinePlayers,
  recentPlayers,
  playerName,
  setPlayerName,
  onJoinGame,
}: SocialPanelProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_lobby': return 'In Lobby';
      case 'in_game': return 'Playing';
      case 'in_team_selection': return 'Setting up';
      default: return status;
    }
  };

  return (
    <>
      {/* Sub-tabs for Social */}
      <div className="flex gap-2">
        <button
          data-keyboard-nav="social-online"
          onClick={() => { sounds.buttonClick(); setSocialTab('online'); }}
          className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm ${
            socialTab === 'online'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          🟢 Online ({onlinePlayers.length})
        </button>
        <button
          data-keyboard-nav="social-recent"
          onClick={() => { sounds.buttonClick(); setSocialTab('recent'); }}
          className={`flex-1 py-2 rounded-lg font-bold transition-all duration-200 text-sm ${
            socialTab === 'recent'
              ? 'bg-gradient-to-r from-umber-500 to-umber-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg'
              : 'bg-parchment-200 dark:bg-gray-700 text-umber-700 dark:text-gray-300 hover:bg-parchment-300 dark:hover:bg-gray-600'
          }`}
        >
          📜 Recent
        </button>
      </div>

      {/* Players List */}
      <div className="bg-parchment-200 dark:bg-gray-700 rounded-lg p-4 border-2 border-parchment-400 dark:border-gray-600 min-h-[320px] max-h-[320px] overflow-y-auto">
        {socialTab === 'online' && (
          <div className="space-y-2">
            {onlinePlayers.length === 0 ? (
              <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                <p className="text-2xl mb-2">😴</p>
                <p className="text-lg font-semibold">No players online</p>
                <p className="text-sm mt-2">Online players will appear here</p>
              </div>
            ) : (
              onlinePlayers.map(player => (
                <div
                  key={player.socketId}
                  className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-500 hover:border-green-400 dark:hover:border-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-green-500 text-lg flex-shrink-0">🟢</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-umber-900 dark:text-gray-100 truncate">
                          {player.playerName || player.socketId || 'Unknown'}
                        </p>
                        <p className="text-xs text-umber-600 dark:text-gray-400">{getStatusLabel(player.status)}</p>
                      </div>
                    </div>
                    {player.gameId && player.status !== 'in_lobby' && (
                      <button
                        data-keyboard-nav={`join-player-${player.socketId}`}
                        onClick={() => {
                          sounds.buttonClick();
                          const nameToUse = playerName.trim() || window.prompt('Enter your name to join:');
                          if (nameToUse && nameToUse.trim()) {
                            if (!playerName.trim()) {
                              setPlayerName(nameToUse.trim());
                            }
                            onJoinGame(player.gameId!, nameToUse.trim());
                          }
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors flex-shrink-0"
                        title="Join their game"
                      >
                        🎮 Join
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {socialTab === 'recent' && (
          <div className="space-y-2">
            {(() => {
              // Filter out bots (names starting with "Bot ")
              const humanPlayers = recentPlayers.filter(p => !p.name.startsWith('Bot '));

              if (humanPlayers.length === 0) {
                return (
                  <div className="text-center text-umber-600 dark:text-gray-400 py-16">
                    <p className="text-2xl mb-2">📭</p>
                    <p className="text-lg font-semibold">No recent players yet</p>
                    <p className="text-sm mt-2">Players you've played with will appear here</p>
                  </div>
                );
              }

              return humanPlayers.map(player => (
                <div
                  key={player.name}
                  className="bg-parchment-100 dark:bg-gray-600 rounded-lg p-3 border-2 border-parchment-400 dark:border-gray-500 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-umber-900 dark:text-gray-100">{player.name}</p>
                      <p className="text-xs text-umber-600 dark:text-gray-400">
                        {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} • {new Date(player.lastPlayed).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </>
  );
}
