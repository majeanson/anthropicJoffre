-- Migration 024: Simplify Daily Quests
-- Created: 2025-12-04
-- Purpose: Make daily quests easier and more accessible for casual players
-- Difficulty is based on TIME INVESTMENT:
--   Easy = quick actions (tricks, bets, special cards) - can happen in any game
--   Medium = require some skill within a game
--   Hard = require full game commitment (time-intensive)

-- Update quest_templates table to allow bets_won objective type
ALTER TABLE quest_templates DROP CONSTRAINT IF EXISTS quest_templates_objective_type_check;
ALTER TABLE quest_templates ADD CONSTRAINT quest_templates_objective_type_check
  CHECK (objective_type IN ('wins', 'games_played', 'tricks_won', 'bets_made', 'bets_won', 'special_cards', 'bet_amount', 'comeback'));

-- Delete existing templates and recreate with simpler requirements
DELETE FROM player_daily_quests WHERE date_assigned < CURRENT_DATE; -- Clear old quests
DELETE FROM quest_templates;

-- Insert simplified quest templates
-- Difficulty based on TIME, not skill: tricks/bets/special cards are easy, full games are hard
INSERT INTO quest_templates (quest_key, name, description, quest_type, objective_type, target_value, reward_xp, reward_currency, icon) VALUES
  -- Easy quests (quick actions that happen naturally during play)
  ('win_3_tricks', 'Trick Taker', 'Win 3 tricks', 'easy', 'tricks_won', 3, 10, 5, '🃏'),
  ('place_1_bet', 'First Bid', 'Place 1 bet (be the bidder)', 'easy', 'bets_made', 1, 10, 5, '🎲'),
  ('win_red_zero', 'Red Zero Hunter', 'Win a trick with Red 0 card', 'easy', 'special_cards', 1, 15, 10, '🔴'),

  -- Medium quests (require some engagement/skill but not full game time)
  ('win_5_tricks', 'Trick Master', 'Win 5 tricks', 'medium', 'tricks_won', 5, 20, 15, '🃏'),
  ('win_1_bet', 'Bet Maker', 'Win 1 bet (your team makes the bid)', 'medium', 'bets_won', 1, 20, 15, '✅'),
  ('win_brown_zero', 'Brown Zero Master', 'Use Brown 0 card in a trick', 'medium', 'special_cards', 1, 20, 15, '🟤'),

  -- Hard quests (time-intensive - require playing full games)
  ('play_1_game', 'Card Player', 'Complete 1 full game', 'hard', 'games_played', 1, 30, 25, '🎮'),
  ('win_1_game', 'Winner', 'Win 1 game', 'hard', 'wins', 1, 35, 30, '🏆'),
  ('play_2_games', 'Dedicated Player', 'Complete 2 full games', 'hard', 'games_played', 2, 40, 35, '👑')
ON CONFLICT (quest_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  quest_type = EXCLUDED.quest_type,
  objective_type = EXCLUDED.objective_type,
  target_value = EXCLUDED.target_value,
  reward_xp = EXCLUDED.reward_xp,
  reward_currency = EXCLUDED.reward_currency,
  icon = EXCLUDED.icon;
