-- Migration 024: Simplify Daily Quests
-- Created: 2025-12-04
-- Purpose: Make daily quests easier and more accessible for casual players

-- Update existing quest templates with simpler requirements
-- Easy quests: Very achievable in 1-2 games
-- Medium quests: Achievable in 2-3 games with some skill
-- Hard quests: Achievable in 1-3 games (just play 1 game)

-- Update quest_templates table to allow bets_won objective type
ALTER TABLE quest_templates DROP CONSTRAINT IF EXISTS quest_templates_objective_type_check;
ALTER TABLE quest_templates ADD CONSTRAINT quest_templates_objective_type_check
  CHECK (objective_type IN ('wins', 'games_played', 'tricks_won', 'bets_made', 'bets_won', 'special_cards', 'bet_amount', 'comeback'));

-- Delete existing templates and recreate with simpler requirements
DELETE FROM player_daily_quests WHERE date_assigned < CURRENT_DATE; -- Clear old quests
DELETE FROM quest_templates;

-- Insert simplified quest templates
INSERT INTO quest_templates (quest_key, name, description, quest_type, objective_type, target_value, reward_xp, reward_currency, icon) VALUES
  -- Easy quests (achievable in 1 game, very simple)
  ('play_1_game', 'Card Player', 'Play 1 game', 'easy', 'games_played', 1, 10, 5, '🎮'),
  ('win_3_tricks', 'Trick Taker', 'Win 3 tricks', 'easy', 'tricks_won', 3, 10, 5, '🃏'),
  ('place_1_bet', 'First Bid', 'Place 1 bet (be the bidder)', 'easy', 'bets_made', 1, 10, 5, '🎲'),

  -- Medium quests (achievable in 1-2 games with some skill)
  ('win_1_game', 'Winner', 'Win 1 game', 'medium', 'wins', 1, 20, 15, '🏆'),
  ('win_1_bet', 'Bet Maker', 'Win 1 bet (your team makes the bid)', 'medium', 'bets_won', 1, 20, 15, '✅'),
  ('win_5_tricks', 'Trick Master', 'Win 5 tricks', 'medium', 'tricks_won', 5, 20, 15, '🃏'),

  -- Hard quests (the "hardest" is still just play 1 game - but with special conditions)
  ('play_1_game_hard', 'Daily Player', 'Complete 1 game today', 'hard', 'games_played', 1, 30, 25, '👑'),
  ('win_red_zero', 'Red Zero Hunter', 'Win a trick with Red 0 card', 'hard', 'special_cards', 1, 35, 30, '🔴'),
  ('win_brown_zero', 'Brown Zero Master', 'Use Brown 0 card in a trick', 'hard', 'special_cards', 1, 35, 30, '🟤')
ON CONFLICT (quest_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  quest_type = EXCLUDED.quest_type,
  objective_type = EXCLUDED.objective_type,
  target_value = EXCLUDED.target_value,
  reward_xp = EXCLUDED.reward_xp,
  reward_currency = EXCLUDED.reward_currency,
  icon = EXCLUDED.icon;
