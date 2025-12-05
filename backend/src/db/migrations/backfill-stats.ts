/**
 * Backfill Stats Migration
 *
 * This script extracts historical statistics from the round_history JSONB column
 * in game_history table and populates the missing player_stats columns.
 *
 * Run this ONCE after deploying the schema changes that add the 20 new columns
 * to player_stats.
 *
 * Usage: npx ts-node src/db/migrations/backfill-stats.ts
 *
 * Sprint 20: Data Integrity Fix
 */

import { query, closePool } from '../index';

interface RoundHistoryPlayerStats {
  playerName: string;
  tricksWon: number;
  pointsWon: number;
  redZerosCollected: number;
  brownZerosReceived: number;
}

interface RoundHistoryBet {
  playerName: string;
  amount: number;
  withoutTrump: boolean;
}

interface RoundHistoryEntry {
  roundNumber: number;
  highestBet: RoundHistoryBet;
  betMade: boolean;
  offensiveTeam: 1 | 2;
  offensivePoints: number;
  defensivePoints: number;
  playerStats?: RoundHistoryPlayerStats[];
  tricks?: Array<{
    cards: Array<{ playerId: string }>;
    winnerId: string;
  }>;
}

interface GameHistoryRow {
  game_id: string;
  round_history: RoundHistoryEntry[] | string;
  player_names: string[];
  player_teams: number[];
  team1_score: number;
  team2_score: number;
  winning_team: 1 | 2 | null;
  game_duration_seconds: number | null;
  is_finished: boolean;
}

interface PlayerStatsAccumulator {
  total_rounds_played: number;
  rounds_won: number;
  rounds_lost: number;
  total_tricks_won: number;
  total_points_earned: number;
  most_tricks_in_round: number;
  zero_trick_rounds: number;
  highest_points_in_round: number;
  total_bets_placed: number;
  bets_made: number;
  bets_failed: number;
  total_bet_amount: number;
  highest_bet: number;
  without_trump_bets: number;
  red_zeros_collected: number;
  brown_zeros_received: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  current_win_streak: number;
  best_win_streak: number;
  current_loss_streak: number;
  worst_loss_streak: number;
  total_game_duration_seconds: number;
  fastest_win: number | null;
  longest_game: number | null;
}

function createEmptyAccumulator(): PlayerStatsAccumulator {
  return {
    total_rounds_played: 0,
    rounds_won: 0,
    rounds_lost: 0,
    total_tricks_won: 0,
    total_points_earned: 0,
    most_tricks_in_round: 0,
    zero_trick_rounds: 0,
    highest_points_in_round: 0,
    total_bets_placed: 0,
    bets_made: 0,
    bets_failed: 0,
    total_bet_amount: 0,
    highest_bet: 0,
    without_trump_bets: 0,
    red_zeros_collected: 0,
    brown_zeros_received: 0,
    games_played: 0,
    games_won: 0,
    games_lost: 0,
    current_win_streak: 0,
    best_win_streak: 0,
    current_loss_streak: 0,
    worst_loss_streak: 0,
    total_game_duration_seconds: 0,
    fastest_win: null,
    longest_game: null,
  };
}

async function backfillPlayerStats(): Promise<void> {
  console.log('Starting backfill of player statistics from game_history...');

  // Get all finished games with round_history
  const gamesResult = await query(`
    SELECT
      game_id,
      round_history,
      player_names,
      player_teams,
      team1_score,
      team2_score,
      winning_team,
      game_duration_seconds,
      is_finished
    FROM game_history
    WHERE is_finished = TRUE
      AND round_history IS NOT NULL
    ORDER BY created_at ASC
  `);

  const games: GameHistoryRow[] = gamesResult.rows;
  console.log(`Found ${games.length} finished games to process`);

  // Accumulate stats for each player
  const playerStats: Map<string, PlayerStatsAccumulator> = new Map();

  let processedGames = 0;
  let processedRounds = 0;

  for (const game of games) {
    // Parse round_history if it's a string
    let roundHistory: RoundHistoryEntry[];
    try {
      roundHistory = typeof game.round_history === 'string'
        ? JSON.parse(game.round_history)
        : game.round_history;
    } catch (err) {
      console.warn(`Skipping game ${game.game_id}: Could not parse round_history`);
      continue;
    }

    if (!roundHistory || !Array.isArray(roundHistory) || roundHistory.length === 0) {
      continue;
    }

    const playerNames = game.player_names || [];
    const playerTeams = game.player_teams || [];

    // Create a map of player names to team IDs
    const playerTeamMap: Map<string, number> = new Map();
    playerNames.forEach((name, idx) => {
      playerTeamMap.set(name, playerTeams[idx]);
    });

    // Process each round
    for (const round of roundHistory) {
      processedRounds++;

      // Process round-level stats from playerStats array
      if (round.playerStats && Array.isArray(round.playerStats)) {
        for (const ps of round.playerStats) {
          const playerName = ps.playerName;
          if (!playerName) continue;

          // Skip bots
          if (playerName.startsWith('Bot_')) continue;

          if (!playerStats.has(playerName)) {
            playerStats.set(playerName, createEmptyAccumulator());
          }
          const acc = playerStats.get(playerName)!;

          // Increment round stats
          acc.total_rounds_played++;
          acc.total_tricks_won += ps.tricksWon || 0;
          acc.total_points_earned += ps.pointsWon || 0;
          acc.red_zeros_collected += ps.redZerosCollected || 0;
          acc.brown_zeros_received += ps.brownZerosReceived || 0;

          // Track round extremes
          acc.most_tricks_in_round = Math.max(acc.most_tricks_in_round, ps.tricksWon || 0);
          acc.highest_points_in_round = Math.max(acc.highest_points_in_round, ps.pointsWon || 0);
          if ((ps.tricksWon || 0) === 0) {
            acc.zero_trick_rounds++;
          }

          // Determine if player's team won this round
          const playerTeam = playerTeamMap.get(playerName);
          const offensiveTeam = round.offensiveTeam;
          const betMade = round.betMade;

          // Team wins round if:
          // - They were offensive (betting) team and made the bet
          // - They were defensive team and offensive team failed the bet
          const playerWasOffensive = playerTeam === offensiveTeam;
          const roundWon = playerWasOffensive ? betMade : !betMade;

          if (roundWon) {
            acc.rounds_won++;
          } else {
            acc.rounds_lost++;
          }

          // Track betting stats if this player was the bidder
          if (round.highestBet && round.highestBet.playerName === playerName) {
            acc.total_bets_placed++;
            acc.total_bet_amount += round.highestBet.amount || 0;
            acc.highest_bet = Math.max(acc.highest_bet, round.highestBet.amount || 0);

            if (round.highestBet.withoutTrump) {
              acc.without_trump_bets++;
            }

            if (betMade) {
              acc.bets_made++;
            } else {
              acc.bets_failed++;
            }
          }
        }
      }
    }

    // Process game-level stats
    for (const playerName of playerNames) {
      // Skip bots
      if (playerName.startsWith('Bot_')) continue;

      if (!playerStats.has(playerName)) {
        playerStats.set(playerName, createEmptyAccumulator());
      }
      const acc = playerStats.get(playerName)!;

      acc.games_played++;

      const playerTeam = playerTeamMap.get(playerName);
      const won = game.winning_team === playerTeam;

      if (won) {
        acc.games_won++;
        acc.current_win_streak++;
        acc.current_loss_streak = 0;
        acc.best_win_streak = Math.max(acc.best_win_streak, acc.current_win_streak);

        // Track fastest win
        if (game.game_duration_seconds) {
          if (acc.fastest_win === null || game.game_duration_seconds < acc.fastest_win) {
            acc.fastest_win = game.game_duration_seconds;
          }
        }
      } else {
        acc.games_lost++;
        acc.current_loss_streak++;
        acc.current_win_streak = 0;
        acc.worst_loss_streak = Math.max(acc.worst_loss_streak, acc.current_loss_streak);
      }

      // Track game duration
      if (game.game_duration_seconds) {
        acc.total_game_duration_seconds += game.game_duration_seconds;
        if (acc.longest_game === null || game.game_duration_seconds > acc.longest_game) {
          acc.longest_game = game.game_duration_seconds;
        }
      }
    }

    processedGames++;
    if (processedGames % 100 === 0) {
      console.log(`Processed ${processedGames}/${games.length} games...`);
    }
  }

  console.log(`\nProcessed ${processedGames} games and ${processedRounds} rounds`);
  console.log(`Found stats for ${playerStats.size} unique players`);

  // Update each player's stats in the database
  let updatedPlayers = 0;
  for (const [playerName, acc] of playerStats) {
    // Calculate derived fields
    const roundsWinPercentage = acc.total_rounds_played > 0
      ? (acc.rounds_won / acc.total_rounds_played * 100).toFixed(2)
      : '0.00';
    const avgTricksPerRound = acc.total_rounds_played > 0
      ? (acc.total_tricks_won / acc.total_rounds_played).toFixed(2)
      : '0.00';
    const avgPointsPerRound = acc.total_rounds_played > 0
      ? (acc.total_points_earned / acc.total_rounds_played).toFixed(2)
      : '0.00';
    const betSuccessRate = acc.total_bets_placed > 0
      ? (acc.bets_made / acc.total_bets_placed * 100).toFixed(2)
      : '0.00';
    const avgBetAmount = acc.total_bets_placed > 0
      ? (acc.total_bet_amount / acc.total_bets_placed).toFixed(2)
      : '0.00';
    const avgGameDurationMinutes = acc.games_played > 0
      ? (acc.total_game_duration_seconds / acc.games_played / 60).toFixed(2)
      : '0.00';

    try {
      // First ensure the player exists
      await query(`
        INSERT INTO player_stats (player_name, is_bot)
        VALUES ($1, FALSE)
        ON CONFLICT (player_name) DO NOTHING
      `, [playerName]);

      // Update with backfilled stats
      // Note: Cast $22 and $23 to INTEGER to help PostgreSQL with NULL type inference
      await query(`
        UPDATE player_stats SET
          total_rounds_played = COALESCE(total_rounds_played, 0) + $2,
          rounds_won = COALESCE(rounds_won, 0) + $3,
          rounds_lost = COALESCE(rounds_lost, 0) + $4,
          rounds_win_percentage = $5,
          avg_tricks_per_round = $6,
          most_tricks_in_round = GREATEST(COALESCE(most_tricks_in_round, 0), $7),
          zero_trick_rounds = COALESCE(zero_trick_rounds, 0) + $8,
          highest_points_in_round = GREATEST(COALESCE(highest_points_in_round, 0), $9),
          avg_points_per_round = $10,
          total_bets_placed = COALESCE(total_bets_placed, 0) + $11,
          bets_made = COALESCE(bets_made, 0) + $12,
          bets_failed = COALESCE(bets_failed, 0) + $13,
          bet_success_rate = $14,
          avg_bet_amount = $15,
          highest_bet = GREATEST(COALESCE(highest_bet, 0), $16),
          without_trump_bets = COALESCE(without_trump_bets, 0) + $17,
          red_zeros_collected = COALESCE(red_zeros_collected, 0) + $18,
          brown_zeros_received = COALESCE(brown_zeros_received, 0) + $19,
          best_win_streak = GREATEST(COALESCE(best_win_streak, 0), $20),
          worst_loss_streak = GREATEST(COALESCE(worst_loss_streak, 0), $21),
          fastest_win = CASE
            WHEN $22::INTEGER IS NOT NULL THEN LEAST(COALESCE(NULLIF(fastest_win, 0), $22::INTEGER), $22::INTEGER)
            ELSE fastest_win
          END,
          longest_game = GREATEST(COALESCE(longest_game, 0), COALESCE($23::INTEGER, 0)),
          avg_game_duration_minutes = $24,
          updated_at = CURRENT_TIMESTAMP
        WHERE player_name = $1
      `, [
        playerName,
        acc.total_rounds_played,
        acc.rounds_won,
        acc.rounds_lost,
        roundsWinPercentage,
        avgTricksPerRound,
        acc.most_tricks_in_round,
        acc.zero_trick_rounds,
        acc.highest_points_in_round,
        avgPointsPerRound,
        acc.total_bets_placed,
        acc.bets_made,
        acc.bets_failed,
        betSuccessRate,
        avgBetAmount,
        acc.highest_bet,
        acc.without_trump_bets,
        acc.red_zeros_collected,
        acc.brown_zeros_received,
        acc.best_win_streak,
        acc.worst_loss_streak,
        acc.fastest_win,
        acc.longest_game,
        avgGameDurationMinutes,
      ]);

      updatedPlayers++;
      if (updatedPlayers % 10 === 0) {
        console.log(`Updated ${updatedPlayers}/${playerStats.size} players...`);
      }
    } catch (err) {
      console.error(`Failed to update stats for ${playerName}:`, err);
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`- Games processed: ${processedGames}`);
  console.log(`- Rounds processed: ${processedRounds}`);
  console.log(`- Players updated: ${updatedPlayers}`);
}

// Run the migration
async function main(): Promise<void> {
  try {
    await backfillPlayerStats();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { backfillPlayerStats };
