import { useState, useRef, useEffect } from 'react';
import { SettingsPanel } from './SettingsPanel';
import { ConnectionStats } from '../hooks/useConnectionQuality';
import { CardColor } from '../types/game';
import { useCountUp } from '../hooks/useCountUp';

interface GameHeaderProps {
  gameId: string;
  roundNumber: number;
  team1Score: number;
  team2Score: number;
  onLeaveGame?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenChat?: () => void;
  onOpenBotManagement?: () => void;
  onOpenRules?: () => void;
  onOpenAchievements?: () => void; // Sprint 2 Phase 1
  onOpenFriends?: () => void; // Sprint 2 Phase 2
  onOpenNotifications?: () => void; // Sprint 3 Phase 5
  unreadNotificationsCount?: number; // Sprint 3 Phase 5
  botCount?: number;
  autoplayEnabled?: boolean;
  onAutoplayToggle?: () => void;
  isSpectator?: boolean;
  unreadChatCount?: number;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  connectionStats?: ConnectionStats;
  highestBet?: { amount: number; withoutTrump: boolean; playerId: string };
  trump?: CardColor | null;
  bettingTeamId?: 1 | 2 | null;
}

export function GameHeader({
  gameId,
  roundNumber,
  team1Score,
  team2Score,
  onLeaveGame,
  onOpenLeaderboard,
  onOpenChat,
  onOpenBotManagement,
  onOpenRules,
  onOpenAchievements,
  onOpenFriends,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  botCount = 0,
  autoplayEnabled = false,
  onAutoplayToggle,
  isSpectator = false,
  unreadChatCount = 0,
  soundEnabled = true,
  onSoundToggle,
  connectionStats,
  highestBet,
  trump,
  bettingTeamId
}: GameHeaderProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Score change animation state
  const prevTeam1ScoreRef = useRef(team1Score);
  const prevTeam2ScoreRef = useRef(team2Score);
  const [team1ScoreChange, setTeam1ScoreChange] = useState<number | null>(null);
  const [team2ScoreChange, setTeam2ScoreChange] = useState<number | null>(null);
  const [team1Flash, setTeam1Flash] = useState<'green' | 'red' | null>(null);
  const [team2Flash, setTeam2Flash] = useState<'green' | 'red' | null>(null);

  // Animated score values
  const animatedTeam1Score = useCountUp(team1Score, 500);
  const animatedTeam2Score = useCountUp(team2Score, 500);

  // Detect score changes and trigger animations
  useEffect(() => {
    const team1Change = team1Score - prevTeam1ScoreRef.current;
    const team2Change = team2Score - prevTeam2ScoreRef.current;

    if (team1Change !== 0) {
      setTeam1ScoreChange(team1Change);
      setTeam1Flash(team1Change > 0 ? 'green' : 'red');

      // Clear flash after 500ms
      setTimeout(() => setTeam1Flash(null), 500);

      // Clear floating indicator after 1500ms
      setTimeout(() => setTeam1ScoreChange(null), 1500);
    }

    if (team2Change !== 0) {
      setTeam2ScoreChange(team2Change);
      setTeam2Flash(team2Change > 0 ? 'green' : 'red');

      setTimeout(() => setTeam2Flash(null), 500);
      setTimeout(() => setTeam2ScoreChange(null), 1500);
    }

    prevTeam1ScoreRef.current = team1Score;
    prevTeam2ScoreRef.current = team2Score;
  }, [team1Score, team2Score]);

  // Helper to get trump color display
  const getTrumpColorClass = (color: CardColor | null | undefined): string => {
    if (!color) return 'bg-gray-500';
    const colorMap: Record<CardColor, string> = {
      red: 'bg-red-500',
      brown: 'bg-amber-700',
      green: 'bg-green-600',
      blue: 'bg-blue-500'
    };
    return colorMap[color];
  };

  const getTrumpColorName = (color: CardColor | null | undefined): string => {
    if (!color) return '?';
    return color.charAt(0).toUpperCase() + color.slice(1);
  };

  const handleCopyGameLink = async () => {
    const gameLink = `${window.location.origin}?gameId=${gameId}`;
    try {
      await navigator.clipboard.writeText(gameLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-700 to-orange-700 dark:from-gray-700 dark:to-gray-900 border-b-2 border-amber-800 dark:border-gray-600 shadow-lg min-h-[60px] z-10 relative">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-1.5">
        {/* Desktop: Single row - All items on same horizontal line */}
        <div className="hidden md:flex items-center gap-3">
          {/* Game Info - Clickable to copy link */}
          <button
            onClick={handleCopyGameLink}
            className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0 hover:bg-white/30 dark:hover:bg-black/30 transition-all cursor-pointer border border-transparent hover:border-white/50"
            title="Click to copy game link"
          >
            <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">
              {linkCopied ? '✓ Copied!' : gameId}
            </p>
          </button>
          <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
            <p className="text-xs text-white dark:text-gray-100 font-bold" data-testid="round-number">R{roundNumber}</p>
          </div>

          {/* Bet and Trump Display */}
          {(highestBet || trump) && (
            <div className="flex items-center gap-1 bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
              {highestBet && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80 dark:text-gray-300">Bet:</span>
                  <span className="text-xs text-white dark:text-gray-100 font-bold">{highestBet.amount}</span>
                  {highestBet.withoutTrump && <span className="text-xs text-yellow-300 font-bold" title="Without Trump">!</span>}
                </div>
              )}
              {highestBet && trump && <span className="text-white/50">|</span>}
              {trump && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-white/80 dark:text-gray-300">Trump:</span>
                  <div className={`w-3 h-3 rounded-sm ${getTrumpColorClass(trump)}`} title={getTrumpColorName(trump)}></div>
                </div>
              )}
            </div>
          )}

          {/* Team Scores */}
          <div className="flex items-center gap-1" data-testid="team-scores">
            <span className="sr-only">Team 1: {team1Score} Team 2: {team2Score}</span>
            <div className={`relative bg-orange-500 dark:bg-orange-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${bettingTeamId === 1 ? 'ring-2 ring-yellow-300 ring-offset-1 ring-offset-amber-800 dark:ring-offset-gray-800' : ''} ${team1Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''} ${team1Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}>
              <p className="text-xs text-white/90 font-semibold">T1</p>
              <p className="text-base text-white font-black">{animatedTeam1Score}</p>
              {team1ScoreChange !== null && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap">
                  <span className={team1ScoreChange > 0 ? 'text-green-400' : 'text-red-400'}>
                    {team1ScoreChange > 0 ? '+' : ''}{team1ScoreChange}
                  </span>
                </div>
              )}
            </div>
            <div className="text-white dark:text-gray-300 font-bold text-sm flex-shrink-0">:</div>
            <div className={`relative bg-purple-500 dark:bg-purple-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${bettingTeamId === 2 ? 'ring-2 ring-yellow-300 ring-offset-1 ring-offset-amber-800 dark:ring-offset-gray-800' : ''} ${team2Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''} ${team2Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}>
              <p className="text-xs text-white/90 font-semibold">T2</p>
              <p className="text-base text-white font-black">{animatedTeam2Score}</p>
              {team2ScoreChange !== null && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-lg font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap">
                  <span className={team2ScoreChange > 0 ? 'text-green-400' : 'text-red-400'}>
                    {team2ScoreChange > 0 ? '+' : ''}{team2ScoreChange}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Chat Button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="relative bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Chat"
                data-testid="header-chat-button"
              >
                <span className="text-base md:text-lg">💬</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Chat</span>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Leaderboard Button */}
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Leaderboard"
                data-testid="header-leaderboard-button"
              >
                <span className="text-base md:text-lg">🏆</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Stats</span>
              </button>
            )}

            {/* Achievements Button - Sprint 2 Phase 1 */}
            {onOpenAchievements && (
              <button
                onClick={onOpenAchievements}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Achievements"
                data-testid="header-achievements-button"
              >
                <span className="text-base md:text-lg">🏅</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Achievements</span>
              </button>
            )}

            {/* Friends Button - Sprint 2 Phase 2 */}
            {onOpenFriends && (
              <button
                onClick={onOpenFriends}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Friends"
                data-testid="header-friends-button"
              >
                <span className="text-base md:text-lg">👥</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Friends</span>
              </button>
            )}

            {/* Notifications Button - Sprint 3 Phase 5 */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
                title="Notifications"
                data-testid="header-notifications-button"
              >
                <span className="text-base md:text-lg">🔔</span>
                <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Notifications</span>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Settings Button - Opens unified settings panel */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 md:px-3 md:py-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center gap-1.5"
              title="Settings"
              data-testid="header-settings-button"
            >
              <span className="text-base md:text-lg">⚙️</span>
              <span className="hidden md:inline text-white dark:text-gray-100 font-semibold text-sm">Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile: Two rows */}
        <div className="md:hidden space-y-1">
          {/* Row 1: Game Info and Scores */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyGameLink}
              className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0 active:bg-white/30 dark:active:bg-black/30"
              title="Click to copy game link"
            >
              <p className="text-xs text-white/80 dark:text-gray-300 font-mono font-bold">
                {linkCopied ? '✓' : gameId}
              </p>
            </button>
            <div className="bg-white/20 dark:bg-black/20 px-2 py-1 rounded backdrop-blur-sm flex-shrink-0">
              <p className="text-xs text-white dark:text-gray-100 font-bold">R{roundNumber}</p>
            </div>

            {/* Mobile Bet and Trump Display */}
            {(highestBet || trump) && (
              <div className="flex items-center gap-0.5 bg-white/20 dark:bg-black/20 px-1.5 py-1 rounded backdrop-blur-sm flex-shrink-0">
                {highestBet && (
                  <span className="text-[10px] text-white dark:text-gray-100 font-bold">{highestBet.amount}{highestBet.withoutTrump ? '!' : ''}</span>
                )}
                {trump && (
                  <div className={`w-2.5 h-2.5 rounded-sm ${getTrumpColorClass(trump)}`}></div>
                )}
              </div>
            )}

            <div className="flex-1"></div>

            <div className="flex items-center gap-1">
              <div className={`relative bg-orange-500 dark:bg-orange-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${bettingTeamId === 1 ? 'ring-2 ring-yellow-300' : ''} ${team1Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''} ${team1Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}>
                <p className="text-xs text-white/90 font-semibold">T1</p>
                <p className="text-base text-white font-black">{animatedTeam1Score}</p>
                {team1ScoreChange !== null && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap">
                    <span className={team1ScoreChange > 0 ? 'text-green-400' : 'text-red-400'}>
                      {team1ScoreChange > 0 ? '+' : ''}{team1ScoreChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-white dark:text-gray-300 font-bold text-sm flex-shrink-0">:</div>
              <div className={`relative bg-purple-500 dark:bg-purple-600 px-2 py-1 rounded shadow-md flex items-center gap-1 flex-shrink-0 transition-all ${bettingTeamId === 2 ? 'ring-2 ring-yellow-300' : ''} ${team2Flash === 'green' ? 'motion-safe:animate-score-flash-green' : ''} ${team2Flash === 'red' ? 'motion-safe:animate-score-flash-red' : ''}`}>
                <p className="text-xs text-white/90 font-semibold">T2</p>
                <p className="text-base text-white font-black">{animatedTeam2Score}</p>
                {team2ScoreChange !== null && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black motion-safe:animate-plus-minus-float motion-reduce:opacity-100 pointer-events-none whitespace-nowrap">
                    <span className={team2ScoreChange > 0 ? 'text-green-400' : 'text-red-400'}>
                      {team2ScoreChange > 0 ? '+' : ''}{team2ScoreChange}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center justify-center gap-1">
            {/* Chat Button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="relative bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600 flex items-center"
                title="Chat"
              >
                <span className="text-base">💬</span>
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            )}

            {/* Leaderboard Button */}
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600"
                title="Leaderboard"
              >
                <span className="text-base">🏆</span>
              </button>
            )}

            {/* Achievements Button - Sprint 2 Phase 1 */}
            {onOpenAchievements && (
              <button
                onClick={onOpenAchievements}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600"
                title="Achievements"
              >
                <span className="text-base">🏅</span>
              </button>
            )}

            {/* Friends Button - Sprint 2 Phase 2 */}
            {onOpenFriends && (
              <button
                onClick={onOpenFriends}
                className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600"
                title="Friends"
              >
                <span className="text-base">👥</span>
              </button>
            )}

            {/* Settings Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="bg-white/20 dark:bg-black/30 hover:bg-white/30 dark:hover:bg-black/40 p-1.5 rounded backdrop-blur-sm transition-all duration-200 border border-white/30 dark:border-gray-600"
              title="Settings"
            >
              <span className="text-base">⚙️</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        soundEnabled={soundEnabled}
        onSoundToggle={onSoundToggle}
        autoplayEnabled={autoplayEnabled}
        onAutoplayToggle={onAutoplayToggle}
        botCount={botCount}
        onOpenBotManagement={onOpenBotManagement}
        onLeaveGame={onLeaveGame}
        onOpenRules={onOpenRules}
        isSpectator={isSpectator}
        connectionStats={connectionStats}
      />
    </div>
  );
}
