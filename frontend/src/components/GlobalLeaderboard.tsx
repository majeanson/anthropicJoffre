import { useEffect, useState, memo } from 'react';
import { Socket } from 'socket.io-client';
import { getTierColor, getTierIcon, getRankMedal } from '../utils/tierBadge';
import { TableSkeleton } from './ui/Skeleton';
import { Modal, Button, UICard, EmptyState } from './ui';

interface LeaderboardPlayer {
  player_name: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  win_percentage: number;
  elo_rating: number;
  highest_rating: number;
  total_tricks_won: number;
  total_points_earned: number;
  total_rounds_played: number;
  rounds_won: number;
  rounds_win_percentage: number;
  avg_tricks_per_round: number;
  bet_success_rate: number;
  avg_points_per_round: number;
  ranking_tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

interface GlobalLeaderboardProps {
  socket: Socket;
  isOpen: boolean;
  onClose: () => void;
  onViewPlayerStats?: (playerName: string) => void;
}

// Memoized player row component to prevent re-renders
interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  index: number;
  showRoundStats: boolean;
  onViewPlayerStats?: (playerName: string) => void;
}

const LeaderboardRow = memo(function LeaderboardRow({
  player,
  index,
  showRoundStats,
  onViewPlayerStats,
}: LeaderboardRowProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 p-4 rounded-lg transition-all duration-200 ${
        index < 3
          ? 'bg-skin-warning/20 border-2 border-skin-warning'
          : 'bg-skin-primary hover:bg-skin-tertiary border border-skin-default'
      } ${onViewPlayerStats ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={() => onViewPlayerStats?.(player.player_name)}
    >
      {/* Rank */}
      <div className="col-span-1 flex items-center">
        <span className="text-2xl md:text-3xl font-bold text-skin-secondary">
          {getRankMedal(index + 1)}
        </span>
      </div>

      {/* Player Name */}
      <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
        <p className="font-bold text-lg text-skin-primary">{player.player_name}</p>
        <p className="text-xs text-skin-muted">
          {showRoundStats
            ? `${player.rounds_won || 0}W - ${(player.total_rounds_played || 0) - (player.rounds_won || 0)}L`
            : `${player.games_won}W - ${player.games_lost}L`}
        </p>
      </div>

      {!showRoundStats ? (
        <>
          {/* ELO Rating */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-secondary md:hidden">ELO</p>
            <p className="text-2xl font-bold text-team2">
              {player.elo_rating}
            </p>
            <p className="text-xs text-skin-muted">
              Peak: {player.highest_rating}
            </p>
          </div>

          {/* Games Played */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-secondary md:hidden">Games</p>
            <p className="text-xl font-bold text-skin-secondary">
              {player.games_played}
            </p>
          </div>

          {/* Win Percentage */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-secondary md:hidden">Win Rate</p>
            <p className="text-xl font-bold text-skin-success">
              {player.win_percentage}%
            </p>
          </div>

          {/* Tier Badge */}
          <div className="col-span-1 flex items-center justify-center">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${getTierColor(player.ranking_tier, true)}`}
            >
              {getTierIcon(player.ranking_tier)} {player.ranking_tier}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Total Rounds Played */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-info md:hidden">Rounds</p>
            <p className="text-2xl font-bold text-skin-info">
              {player.total_rounds_played || 0}
            </p>
          </div>

          {/* Round Win Percentage */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-info md:hidden">Round Win%</p>
            <p className="text-xl font-bold text-skin-success">
              {player.rounds_win_percentage || 0}%
            </p>
          </div>

          {/* Average Tricks Per Round */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-info md:hidden">Avg Tricks</p>
            <p className="text-xl font-bold text-team1">
              {player.avg_tricks_per_round || 0}
            </p>
          </div>

          {/* Bet Success Rate */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <p className="text-sm text-skin-info md:hidden">Bet Success</p>
            <p className="text-xl font-bold text-team2">
              {player.bet_success_rate || 0}%
            </p>
          </div>
        </>
      )}
    </div>
  );
});

export function GlobalLeaderboard({
  socket,
  isOpen,
  onClose,
  onViewPlayerStats,
}: GlobalLeaderboardProps) {
  // ✅ CRITICAL: Check isOpen BEFORE any hooks to prevent "Rendered more hooks than during the previous render" error
  // Rules of Hooks: All early returns must happen BEFORE calling any hooks
  if (!isOpen) return null;

  // ✅ NOW it's safe to call hooks - all conditional returns are done
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoundStats, setShowRoundStats] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    socket.emit('get_leaderboard', { limit: 100, excludeBots: true });

    const handleLeaderboardResponse = ({
      players: receivedPlayers,
    }: {
      players: LeaderboardPlayer[];
    }) => {
      setPlayers(receivedPlayers);
      setLoading(false);
      setError(null);
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message || 'Failed to load leaderboard');
      setLoading(false);
    };

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Request timed out. Please try again.');
        setLoading(false);
      }
    }, 10000);

    socket.on('leaderboard_response', handleLeaderboardResponse);
    socket.on('leaderboard_error', handleError);

    return () => {
      clearTimeout(timeout);
      socket.off('leaderboard_response', handleLeaderboardResponse);
      socket.off('leaderboard_error', handleError);
    };
  }, [isOpen, socket]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Leaderboard"
      subtitle={`Top ${players.length} Players`}
      icon="🏆"
      theme="purple"
      size="xl"
    >
      <div className="space-y-4">
        {loading && (
          <div className="space-y-4">
            <TableSkeleton rows={10} columns={7} showHeader={true} />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <EmptyState icon="⚠️" title="Error" description={error} compact />
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                setError(null);
                setLoading(true);
                socket.emit('get_leaderboard', { limit: 100, excludeBots: true });
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <EmptyState
            icon="🎮"
            title="No players yet!"
            description="Be the first to play and claim the top spot!"
            card
          />
        )}

        {!loading && !error && players.length > 0 && (
          <div className="space-y-4">
            {/* Toggle Stats View Button */}
            <div className="flex justify-center">
              <Button variant="primary" onClick={() => setShowRoundStats(!showRoundStats)}>
                {showRoundStats ? '🏆 Show Game Stats' : '📊 Show Round Stats'}
              </Button>
            </div>

            {/* Table Header - Game Stats */}
            {!showRoundStats && (
              <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-3 bg-skin-tertiary rounded-lg font-bold text-sm text-skin-secondary">
                <div className="col-span-1">Rank</div>
                <div className="col-span-2">Player</div>
                <div className="col-span-1 text-center">ELO</div>
                <div className="col-span-1 text-center">Games</div>
                <div className="col-span-1 text-center">Win Rate</div>
                <div className="col-span-1 text-center">Tier</div>
              </div>
            )}

            {/* Table Header - Round Stats */}
            {showRoundStats && (
              <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-3 bg-skin-accent/20 rounded-lg font-bold text-sm text-skin-accent">
                <div className="col-span-1">Rank</div>
                <div className="col-span-2">Player</div>
                <div className="col-span-1 text-center">Rounds</div>
                <div className="col-span-1 text-center">Round Win%</div>
                <div className="col-span-1 text-center">Avg Tricks</div>
                <div className="col-span-1 text-center">Bet Success</div>
              </div>
            )}

            {/* Player Rows */}
            {players.map((player, index) => (
              <LeaderboardRow
                key={player.player_name}
                player={player}
                index={index}
                showRoundStats={showRoundStats}
                onViewPlayerStats={onViewPlayerStats}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && players.length > 0 && (
          <UICard variant="bordered" size="md" className="mt-4">
            <div className="flex flex-wrap gap-4 justify-center text-sm text-skin-secondary">
              <div className="flex items-center gap-2">
                <span>💎 Diamond:</span>
                <span className="font-bold">
                  {players.filter((p) => p.ranking_tier === 'Diamond').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🏆 Platinum:</span>
                <span className="font-bold">
                  {players.filter((p) => p.ranking_tier === 'Platinum').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥇 Gold:</span>
                <span className="font-bold">
                  {players.filter((p) => p.ranking_tier === 'Gold').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥈 Silver:</span>
                <span className="font-bold">
                  {players.filter((p) => p.ranking_tier === 'Silver').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>🥉 Bronze:</span>
                <span className="font-bold">
                  {players.filter((p) => p.ranking_tier === 'Bronze').length}
                </span>
              </div>
            </div>
            {onViewPlayerStats && (
              <p className="text-center text-xs text-skin-muted mt-2">
                Click on a player to view detailed statistics
              </p>
            )}
          </UICard>
        )}
      </div>
    </Modal>
  );
}
