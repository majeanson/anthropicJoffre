import { useEffect, useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { Socket } from 'socket.io-client';
import { getTierColor, getTierIcon } from '../utils/tierBadge';
import { StatsGridSkeleton, CardSkeleton, TableSkeleton } from './ui/Skeleton';
import { GameHistoryEntry } from '../types/game';
import Avatar from './Avatar'; // Sprint 3 Phase 2
import { useAuth } from '../contexts/AuthContext'; // Sprint 3 Phase 2
import { ProfileEditor, ProfileData } from './ProfileEditor'; // Sprint 3 Phase 3.2
import { UserProfile } from '../types/auth'; // Sprint 3 Phase 3.2
import { MatchCard } from './MatchCard'; // Sprint 3 Phase 3.3
import { ERROR_MESSAGES, getErrorMessage } from '../config/errorMessages';
import logger from '../utils/logger';
import { Modal, Button, Spinner, Tabs } from './ui';

// Lazy load heavy modal
const MatchStatsModal = lazy(() => import('./MatchStatsModal').then(m => ({ default: m.MatchStatsModal })));

interface PlayerStats {
  player_name: string;

  // Game-level stats
  games_played: number;
  games_won: number;
  games_lost: number;
  games_abandoned: number;
  win_percentage: number;
  elo_rating: number;
  highest_rating: number;
  lowest_rating: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  current_win_streak: number;
  best_win_streak: number;
  current_loss_streak: number;
  worst_loss_streak: number;
  fastest_win: number;
  longest_game: number;
  avg_game_duration_minutes: number;

  // Round-level stats
  total_rounds_played: number;
  rounds_won: number;
  rounds_lost: number;
  rounds_win_percentage: number;

  // Trick stats
  total_tricks_won: number;
  avg_tricks_per_round: number;
  most_tricks_in_round: number;
  zero_trick_rounds: number;

  // Betting stats
  total_bets_placed: number;
  bets_made: number;
  bets_failed: number;
  bet_success_rate: number;
  avg_bet_amount: number;
  highest_bet: number;
  without_trump_bets: number;

  // Points stats
  total_points_earned: number;
  avg_points_per_round: number;
  highest_points_in_round: number;

  // Special cards
  trump_cards_played: number;
  red_zeros_collected: number;
  brown_zeros_received: number;

  // Achievement expansion tracking (Sprint 21)
  perfect_bets_won?: number;
  clean_games_won?: number;
  clean_game_streak?: number;
  max_bet_won?: number;
  double_red_zeros?: number;

  created_at: string;
  updated_at: string;
}

interface PlayerStatsModalProps {
  playerName: string;
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewReplay?: (gameId: string) => void;
}

export function PlayerStatsModal({ playerName, socket, isOpen, onClose, onViewReplay }: PlayerStatsModalProps) {
  // ✅ CRITICAL: Check isOpen BEFORE any hooks to prevent "Rendered more hooks than during the previous render" error
  // Rules of Hooks: All early returns must happen BEFORE calling any hooks
  if (!isOpen) return null;

  // ✅ NOW it's safe to call hooks - all conditional returns are done
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'round' | 'game' | 'history' | 'profile'>('round');
  const [historyTab, setHistoryTab] = useState<'finished' | 'unfinished'>('finished');
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Sprint 3 Phase 3: History filtering and sorting
  const [resultFilter, setResultFilter] = useState<'all' | 'won' | 'lost'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'rounds'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Sprint 3 Phase 2: Authentication integration
  const { user, isAuthenticated, updateProfile, getUserProfile } = useAuth();
  const isOwnProfile = isAuthenticated && user?.username === playerName;

  // Sprint 3 Phase 3.2: Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sprint 3 Phase 3.3: Match details modal
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [showMatchStatsModal, setShowMatchStatsModal] = useState(false);

  useEffect(() => {
    if (!isOpen || !playerName) return;

    setLoading(true);
    socket.emit('get_player_stats', { playerName });

    const handleStatsResponse = ({ stats: receivedStats, playerName: responseName }: { stats: PlayerStats | null; playerName: string }) => {
      if (responseName === playerName) {
        setStats(receivedStats);
        setError(null);
        setCorrelationId(null);
        setLoading(false);
      }
    };

    const handleError = (errorData: { message?: string; correlationId?: string; correlation_id?: string }) => {
      logger.error('[PlayerStatsModal] Socket error:', errorData);

      // Extract correlation ID if available
      const corrId = errorData?.correlationId || errorData?.correlation_id || null;
      if (corrId) {
        setCorrelationId(corrId);
      }

      // Set user-friendly error message
      const errorMessage = errorData?.message || ERROR_MESSAGES.PLAYER_STATS_FAILED;
      setError(errorMessage);
      setLoading(false);
    };

    socket.on('player_stats_response', handleStatsResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('player_stats_response', handleStatsResponse);
      socket.off('error', handleError);
    };
  }, [isOpen, playerName, socket]);

  // Fetch game history when history tab is active
  useEffect(() => {
    if (!isOpen || activeTab !== 'history' || !playerName) return;

    setHistoryLoading(true);
    socket.emit('get_player_history', { playerName, limit: 20 });

    const handleHistoryResponse = ({ games, playerName: responseName }: { games: GameHistoryEntry[]; playerName: string }) => {
      if (responseName === playerName) {
        setGameHistory(games);
        setHistoryError(null);
        setHistoryLoading(false);
      }
    };

    const handleError = (errorData: { message?: string; correlationId?: string; correlation_id?: string }) => {
      logger.error('[PlayerStatsModal] Socket error while loading history:', errorData);

      // Set user-friendly error message
      const errorMessage = errorData?.message || ERROR_MESSAGES.GAME_HISTORY_FAILED;
      setHistoryError(errorMessage);
      setHistoryLoading(false);
    };

    socket.on('player_history_response', handleHistoryResponse);
    socket.on('error', handleError);

    return () => {
      socket.off('player_history_response', handleHistoryResponse);
      socket.off('error', handleError);
    };
  }, [isOpen, activeTab, playerName, socket]);

  // Load profile data function - extracted for reuse after save
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const data = await getUserProfile();
      if (data) {
        setProfile(data.profile);
        // setPreferences(data.preferences);
      }
    } catch (error) {
      logger.error('[PlayerStatsModal] Error loading profile:', error);
      const errorMessage = getErrorMessage(error, 'PROFILE_DATA_FAILED');
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  }, [getUserProfile]);

  // Fetch profile data when profile tab is active and it's the user's own profile
  useEffect(() => {
    if (!isOpen || activeTab !== 'profile' || !isOwnProfile) return;
    loadProfile();
  }, [isOpen, activeTab, isOwnProfile, loadProfile]);

  // Filter and sort game history for display
  const filteredAndSortedGames = useMemo(() => {
    let filteredGames = gameHistory.filter(game =>
      historyTab === 'finished' ? game.is_finished : !game.is_finished
    );

    // Apply result filter for finished games
    if (historyTab === 'finished' && resultFilter !== 'all') {
      filteredGames = filteredGames.filter(game => {
        const playerTeamId = game.team_id;
        const didWin = game.winning_team === playerTeamId;
        return resultFilter === 'won' ? didWin : !didWin;
      });
    }

    // Apply sorting
    return [...filteredGames].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.finished_at || a.created_at).getTime();
          const dateB = new Date(b.finished_at || b.created_at).getTime();
          comparison = dateB - dateA; // Newest first by default
          break;
        case 'score':
          const scoreA = Math.abs(a.team1_score - a.team2_score);
          const scoreB = Math.abs(b.team1_score - b.team2_score);
          comparison = scoreB - scoreA; // Bigger score difference first
          break;
        case 'rounds':
          comparison = b.rounds - a.rounds; // More rounds first
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [gameHistory, historyTab, resultFilter, sortBy, sortOrder]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-4">
          <Avatar username={playerName} avatarUrl={user?.avatar_url} size="xl" />
          <div>
            <h2 className="text-2xl font-bold text-parchment-50">{playerName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-amber-200 text-sm">
                {stats ? `Joined ${new Date(stats.created_at).toLocaleDateString()}` : 'Loading...'}
              </span>
              {isOwnProfile && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      }
      theme="parchment"
      size="xl"
    >
      <div className="space-y-6">
          {loading && (
            <div className="space-y-6">
              <CardSkeleton count={1} hasAvatar={false} />
              <StatsGridSkeleton columns={2} rows={3} />
              <TableSkeleton rows={5} columns={5} showHeader={true} />
            </div>
          )}

          {/* Sprint 6: Error State */}
          {!loading && error && (
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden="true">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold mb-1">
                    {error}
                  </p>
                  {correlationId && (
                    <p className="text-xs text-red-700 font-mono mt-2">
                      Error ID: {correlationId}
                      <br />
                      <span className="text-xs opacity-75">
                        Please include this ID when reporting the issue
                      </span>
                    </p>
                  )}
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      setError(null);
                      setCorrelationId(null);
                      setLoading(true);
                      socket.emit('get_player_stats', { playerName });
                    }}
                  >
                    🔄 Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && !stats && (
            <div className="text-center py-12">
              <span className="text-6xl" aria-hidden="true">❌</span>
              <p className="mt-4 text-gray-700 font-bold text-lg">
                No statistics found for {playerName}
              </p>
              <p className="text-gray-600">
                Play some games to start building your stats!
              </p>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Ranking Tier Card */}
              <div className={`bg-gradient-to-r ${getTierColor(stats.ranking_tier)} rounded-xl p-6 text-white shadow-xl`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold opacity-90">Current Rank</p>
                    <p className="text-4xl font-bold flex items-center gap-2 mt-1">
                      {getTierIcon(stats.ranking_tier)} {stats.ranking_tier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold opacity-90">ELO Rating</p>
                    <p className="text-4xl font-bold mt-1">{stats.elo_rating}</p>
                    <p className="text-xs opacity-75">
                      Peak: {stats.highest_rating} • Low: {stats.lowest_rating || stats.elo_rating}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <Tabs
                tabs={[
                  { id: 'round', label: '📊 Round Stats' },
                  { id: 'game', label: '🏆 Game Stats' },
                  { id: 'history', label: '📜 Game History' },
                  ...(isOwnProfile ? [{ id: 'profile', label: '👤 Profile' }] : []),
                ]}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as typeof activeTab)}
                variant="pills"
                size="md"
                fullWidth
              />

              {/* Round Stats Tab */}
              {activeTab === 'round' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Round Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
                      <p className="text-blue-700 font-bold text-sm">Total Rounds</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.total_rounds_played || 0}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                      <p className="text-green-700 font-bold text-sm">Rounds Won</p>
                      <p className="text-3xl font-bold text-green-900">{stats.rounds_won || 0}</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-4 border-2 border-red-300">
                      <p className="text-red-700 font-bold text-sm">Rounds Lost</p>
                      <p className="text-3xl font-bold text-red-900">{stats.rounds_lost || 0}</p>
                    </div>
                    <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300">
                      <p className="text-purple-700 font-bold text-sm">Win Rate</p>
                      <p className="text-3xl font-bold text-purple-900">{stats.rounds_win_percentage || 0}%</p>
                    </div>
                  </div>

                  {/* Trick Performance */}
                  <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-lg p-6 border-2 border-indigo-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span aria-hidden="true">🎯</span> Trick Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Total Tricks</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total_tricks_won || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg Per Round</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avg_tricks_per_round || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Best Round</p>
                        <p className="text-2xl font-bold text-green-700">{stats.most_tricks_in_round || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Zero Tricks</p>
                        <p className="text-2xl font-bold text-red-700">{stats.zero_trick_rounds || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Betting Performance */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border-2 border-orange-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span aria-hidden="true">💰</span> Betting Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Bets Placed</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total_bets_placed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Bets Made</p>
                        <p className="text-2xl font-bold text-green-700">{stats.bets_made || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Bets Failed</p>
                        <p className="text-2xl font-bold text-red-700">{stats.bets_failed || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Success Rate</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.bet_success_rate || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg Bet</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avg_bet_amount || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Highest Bet</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.highest_bet || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Without Trump</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.without_trump_bets || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Points Performance */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border-2 border-emerald-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span aria-hidden="true">⭐</span> Points Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Total Points</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total_points_earned || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg Per Round</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avg_points_per_round || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Best Round</p>
                        <p className="text-2xl font-bold text-green-700">{stats.highest_points_in_round || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Special Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                      <p className="text-red-700 font-bold mb-2 flex items-center gap-2">
                        <span aria-hidden="true">🔴</span> Red Zeros Collected
                      </p>
                      <p className="text-3xl font-bold text-red-900">{stats.red_zeros_collected || 0}</p>
                      <p className="text-xs text-red-600 mt-1">+5 bonus points each</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                      <p className="text-amber-700 font-bold mb-2 flex items-center gap-2">
                        <span aria-hidden="true">🟤</span> Brown Zeros Received
                      </p>
                      <p className="text-3xl font-bold text-amber-900">{stats.brown_zeros_received || 0}</p>
                      <p className="text-xs text-amber-600 mt-1">-3 penalty points each</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Game Stats Tab */}
              {activeTab === 'game' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Win/Loss Record */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-100 rounded-lg p-4 border-2 border-blue-300">
                      <p className="text-blue-700 font-bold text-sm">Games Played</p>
                      <p className="text-3xl font-bold text-blue-900">{stats.games_played}</p>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                      <p className="text-green-700 font-bold text-sm">Games Won</p>
                      <p className="text-3xl font-bold text-green-900">{stats.games_won}</p>
                    </div>
                    <div className="bg-red-100 rounded-lg p-4 border-2 border-red-300">
                      <p className="text-red-700 font-bold text-sm">Games Lost</p>
                      <p className="text-3xl font-bold text-red-900">{stats.games_lost}</p>
                    </div>
                    <div className="bg-purple-100 rounded-lg p-4 border-2 border-purple-300">
                      <p className="text-purple-700 font-bold text-sm">Win Rate</p>
                      <p className="text-3xl font-bold text-purple-900">{stats.win_percentage}%</p>
                    </div>
                  </div>

                  {/* Streaks */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-yellow-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span aria-hidden="true">🔥</span> Streaks
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Current Win</p>
                        <p className="text-2xl font-bold text-green-700">{stats.current_win_streak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Best Win</p>
                        <p className="text-2xl font-bold text-green-700">{stats.best_win_streak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Current Loss</p>
                        <p className="text-2xl font-bold text-red-700">{stats.current_loss_streak || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Worst Loss</p>
                        <p className="text-2xl font-bold text-red-700">{stats.worst_loss_streak || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Game Records */}
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border-2 border-cyan-200">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <span aria-hidden="true">📈</span> Game Records
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-600 text-sm">Fastest Win</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.fastest_win || 'N/A'} {stats.fastest_win && 'rounds'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Longest Game</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.longest_game || 0} rounds</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Avg Duration</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.avg_game_duration_minutes || 0} min</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Game History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Sub-tabs for Finished/Unfinished */}
                  <Tabs
                    tabs={[
                      { id: 'finished', label: '✓ Finished Games' },
                      { id: 'unfinished', label: '⏸ Unfinished Games' },
                    ]}
                    activeTab={historyTab}
                    onChange={(id) => setHistoryTab(id as typeof historyTab)}
                    variant="underline"
                    size="sm"
                  />

                  {/* Result Filter - Only show for finished games */}
                  {historyTab === 'finished' && (
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-sm font-semibold text-gray-700">Filter:</span>
                      <Button
                        onClick={() => setResultFilter('all')}
                        variant={resultFilter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                      >
                        All Games
                      </Button>
                      <Button
                        onClick={() => setResultFilter('won')}
                        variant={resultFilter === 'won' ? 'success' : 'ghost'}
                        size="sm"
                      >
                        🏆 Wins
                      </Button>
                      <Button
                        onClick={() => setResultFilter('lost')}
                        variant={resultFilter === 'lost' ? 'danger' : 'ghost'}
                        size="sm"
                      >
                        ❌ Losses
                      </Button>

                      <span className="text-sm font-semibold text-gray-700 ml-4">Sort by:</span>
                      <Button
                        onClick={() => setSortBy('date')}
                        variant={sortBy === 'date' ? 'primary' : 'ghost'}
                        size="sm"
                      >
                        📅 Date
                      </Button>
                      <Button
                        onClick={() => setSortBy('score')}
                        variant={sortBy === 'score' ? 'primary' : 'ghost'}
                        size="sm"
                      >
                        ⚡ Score
                      </Button>
                      <Button
                        onClick={() => setSortBy('rounds')}
                        variant={sortBy === 'rounds' ? 'primary' : 'ghost'}
                        size="sm"
                      >
                        🔄 Rounds
                      </Button>

                      <Button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        variant="ghost"
                        size="sm"
                        title={sortOrder === 'desc' ? 'Sort descending' : 'Sort ascending'}
                      >
                        {sortOrder === 'desc' ? '↓' : '↑'}
                      </Button>
                    </div>
                  )}

                  {historyLoading && (
                    <div className="text-center py-12">
                      <Spinner size="lg" color="success" />
                      <p className="mt-4 text-gray-600 font-semibold">Loading game history...</p>
                    </div>
                  )}

                  {/* Sprint 6: History Error State */}
                  {!historyLoading && historyError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden="true">⚠️</span>
                        <div className="flex-1">
                          <p className="text-red-800 font-semibold mb-1">
                            {historyError}
                          </p>
                          <Button
                            variant="danger"
                            size="md"
                            onClick={() => {
                              setHistoryError(null);
                              setHistoryLoading(true);
                              socket.emit('get_player_history', { playerName, limit: 20 });
                            }}
                          >
                            🔄 Try Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!historyLoading && !historyError && gameHistory.length === 0 && (
                    <div className="text-center py-12">
                      <span className="text-6xl" aria-hidden="true">📭</span>
                      <p className="mt-4 text-gray-700 font-bold text-lg">
                        No game history found
                      </p>
                      <p className="text-gray-600">
                        Play some games to build your history!
                      </p>
                    </div>
                  )}

                  {!historyLoading && gameHistory.length > 0 && (
                    <>
                      {filteredAndSortedGames.length === 0 ? (
                        <div className="text-center py-12">
                          <span className="text-4xl" aria-hidden="true">🔍</span>
                          <p className="mt-4 text-gray-700 font-bold">
                            No {resultFilter === 'won' ? 'wins' : resultFilter === 'lost' ? 'losses' : historyTab + ' games'} found
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">
                            Showing {filteredAndSortedGames.length} {historyTab} game{filteredAndSortedGames.length !== 1 ? 's' : ''}
                            {historyTab === 'finished' && resultFilter !== 'all' && (
                              <span className="font-semibold"> ({resultFilter === 'won' ? 'wins only' : 'losses only'})</span>
                            )}
                          </p>
                          <div className="space-y-3">
                            {filteredAndSortedGames.map((game) => (
                              <MatchCard
                                key={game.game_id}
                                game={game}
                                onViewReplay={onViewReplay ? (gameId) => {
                                  onViewReplay(gameId);
                                  onClose();
                                } : undefined}
                                onViewDetails={(gameId) => {
                                  setSelectedMatchId(gameId);
                                  setShowMatchStatsModal(true);
                                }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Profile Tab - Sprint 3 Phase 3.2 */}
              {activeTab === 'profile' && isOwnProfile && (
                <div className="space-y-4 animate-fadeIn">
                  {profileLoading && (
                    <div className="text-center py-12">
                      <Spinner size="lg" color="warning" />
                      <p className="mt-4 text-gray-600 font-semibold">Loading profile...</p>
                    </div>
                  )}

                  {/* Sprint 6: Profile Error State */}
                  {!profileLoading && profileError && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden="true">⚠️</span>
                        <div className="flex-1">
                          <p className="text-red-800 font-semibold mb-1">
                            {profileError}
                          </p>
                          <Button
                            variant="danger"
                            size="md"
                            onClick={() => {
                              setProfileError(null);
                              loadProfile();
                            }}
                          >
                            🔄 Try Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!profileLoading && !profileError && (
                    <ProfileEditor
                      initialData={{
                        avatar_id: user?.avatar_url || 'dog',
                        bio: profile?.bio || undefined,
                        country: profile?.country || undefined,
                        favorite_team: profile?.favorite_team || null,
                        visibility: profile?.visibility || 'public',
                        show_online_status: profile?.show_online_status !== undefined ? profile.show_online_status : true,
                        allow_friend_requests: profile?.allow_friend_requests !== undefined ? profile.allow_friend_requests : true,
                      }}
                      onSave={async (data: ProfileData) => {
                        try {
                          await updateProfile(data);
                          // Refresh the profile data to show updated information
                          await loadProfile();
                        } catch (error) {
                          logger.error('[PlayerStatsModal] Error saving profile:', error);
                          // Optionally show error message to user
                        }
                      }}
                      onCancel={() => {
                        // Switch back to round stats tab
                        setActiveTab('round');
                      }}
                    />
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t-2 border-gray-300">
                <p>Member since: {new Date(stats.created_at).toLocaleDateString()}</p>
                <p>Last updated: {new Date(stats.updated_at).toLocaleString()}</p>
              </div>
            </>
          )}
      </div>

      {/* Match Stats Modal - Sprint 3 Phase 3.3 */}
      {selectedMatchId && (
        <Suspense fallback={<div />}>
          <MatchStatsModal
            gameId={selectedMatchId}
            socket={socket}
            isOpen={showMatchStatsModal}
            onClose={() => {
              setShowMatchStatsModal(false);
              setSelectedMatchId(null);
            }}
            onViewReplay={onViewReplay}
          />
        </Suspense>
      )}
    </Modal>
  );
}
