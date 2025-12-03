-- Migration 023: Add "Win a Bet" quest
-- Adds a new quest type for winning bets (offensive team wins the round)

-- First, drop the existing CHECK constraint and add new one with 'bets_won' included
ALTER TABLE quest_templates DROP CONSTRAINT IF EXISTS quest_templates_objective_type_check;
ALTER TABLE quest_templates ADD CONSTRAINT quest_templates_objective_type_check
  CHECK (objective_type IN ('wins', 'games_played', 'tricks_won', 'bets_made', 'special_cards', 'bet_amount', 'comeback', 'bets_won'));

-- Add the new quest template
INSERT INTO quest_templates (quest_key, name, description, quest_type, objective_type, target_value, reward_xp, reward_currency, icon) VALUES
  ('win_2_bets', 'Bet Winner', 'Win 2 bets as the offensive team', 'easy', 'bets_won', 2, 20, 15, '🎯')
ON CONFLICT (quest_key) DO NOTHING;
