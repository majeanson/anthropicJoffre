-- Round-Level Stats Migration
-- Add new columns to player_stats table for round-level tracking
-- These update after EACH round (not just on game finish)

DO $$
BEGIN
    -- ========== ROUND PERFORMANCE ==========

    -- Total rounds played (regardless of game completion)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='total_rounds_played') THEN
        ALTER TABLE player_stats ADD COLUMN total_rounds_played INTEGER DEFAULT 0;
    END IF;

    -- Rounds won (team made their bet)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='rounds_won') THEN
        ALTER TABLE player_stats ADD COLUMN rounds_won INTEGER DEFAULT 0;
    END IF;

    -- Rounds lost (team failed bet)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='rounds_lost') THEN
        ALTER TABLE player_stats ADD COLUMN rounds_lost INTEGER DEFAULT 0;
    END IF;

    -- Round win percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='rounds_win_percentage') THEN
        ALTER TABLE player_stats ADD COLUMN rounds_win_percentage DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- ========== TRICK PERFORMANCE ==========

    -- Average tricks per round
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='avg_tricks_per_round') THEN
        ALTER TABLE player_stats ADD COLUMN avg_tricks_per_round DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Most tricks won in a single round
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='most_tricks_in_round') THEN
        ALTER TABLE player_stats ADD COLUMN most_tricks_in_round INTEGER DEFAULT 0;
    END IF;

    -- Rounds with zero tricks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='zero_trick_rounds') THEN
        ALTER TABLE player_stats ADD COLUMN zero_trick_rounds INTEGER DEFAULT 0;
    END IF;

    -- ========== BETTING PERFORMANCE ==========

    -- Total bets placed (times player was bidder)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='total_bets_placed') THEN
        ALTER TABLE player_stats ADD COLUMN total_bets_placed INTEGER DEFAULT 0;
    END IF;

    -- Bets made successfully
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='bets_made') THEN
        ALTER TABLE player_stats ADD COLUMN bets_made INTEGER DEFAULT 0;
    END IF;

    -- Bets failed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='bets_failed') THEN
        ALTER TABLE player_stats ADD COLUMN bets_failed INTEGER DEFAULT 0;
    END IF;

    -- Bet success rate
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='bet_success_rate') THEN
        ALTER TABLE player_stats ADD COLUMN bet_success_rate DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- ========== POINTS PERFORMANCE ==========

    -- Average points per round
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='avg_points_per_round') THEN
        ALTER TABLE player_stats ADD COLUMN avg_points_per_round DECIMAL(5,2) DEFAULT 0.00;
    END IF;

    -- Highest points in a single round
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='highest_points_in_round') THEN
        ALTER TABLE player_stats ADD COLUMN highest_points_in_round INTEGER DEFAULT 0;
    END IF;

    -- ========== GAME-LEVEL STATS (ELO) ==========

    -- Lowest ELO rating ever achieved
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='lowest_rating') THEN
        ALTER TABLE player_stats ADD COLUMN lowest_rating INTEGER DEFAULT 1200;
    END IF;

    -- Computed tier based on ELO (updated via trigger or calculated field)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='ranking_tier') THEN
        ALTER TABLE player_stats ADD COLUMN ranking_tier VARCHAR(20) DEFAULT 'Bronze';
    END IF;

    -- ========== STREAKS ==========

    -- Current win streak (consecutive game wins)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='current_win_streak') THEN
        ALTER TABLE player_stats ADD COLUMN current_win_streak INTEGER DEFAULT 0;
    END IF;

    -- Best win streak ever
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='best_win_streak') THEN
        ALTER TABLE player_stats ADD COLUMN best_win_streak INTEGER DEFAULT 0;
    END IF;

    -- Current loss streak
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='current_loss_streak') THEN
        ALTER TABLE player_stats ADD COLUMN current_loss_streak INTEGER DEFAULT 0;
    END IF;

    -- Worst loss streak
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='worst_loss_streak') THEN
        ALTER TABLE player_stats ADD COLUMN worst_loss_streak INTEGER DEFAULT 0;
    END IF;

    -- ========== GAME PERFORMANCE ==========

    -- Fastest win (fewest rounds to win a game)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='fastest_win') THEN
        ALTER TABLE player_stats ADD COLUMN fastest_win INTEGER;
    END IF;

    -- Longest game (most rounds in a finished game)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='longest_game') THEN
        ALTER TABLE player_stats ADD COLUMN longest_game INTEGER DEFAULT 0;
    END IF;

    -- Average game duration in minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='player_stats' AND column_name='avg_game_duration_minutes') THEN
        ALTER TABLE player_stats ADD COLUMN avg_game_duration_minutes DECIMAL(5,2) DEFAULT 0.00;
    END IF;

END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_player_stats_rounds_played ON player_stats(total_rounds_played DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_rounds_won ON player_stats(rounds_won DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_tier ON player_stats(ranking_tier, elo_rating DESC);

-- Function to calculate and update ranking tier based on ELO
CREATE OR REPLACE FUNCTION update_ranking_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ranking_tier := CASE
        WHEN NEW.elo_rating >= 1600 THEN 'Diamond'
        WHEN NEW.elo_rating >= 1400 THEN 'Platinum'
        WHEN NEW.elo_rating >= 1200 THEN 'Gold'
        WHEN NEW.elo_rating >= 1000 THEN 'Silver'
        ELSE 'Bronze'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update ranking tier on ELO changes
DROP TRIGGER IF EXISTS trigger_update_ranking_tier ON player_stats;
CREATE TRIGGER trigger_update_ranking_tier
    BEFORE INSERT OR UPDATE OF elo_rating ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_ranking_tier();
