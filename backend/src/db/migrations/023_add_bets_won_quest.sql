-- Migration 023: Add "Win a Bet" quest
-- Adds a new quest type for winning bets (offensive team wins the round)

-- Add the new quest template
INSERT INTO quest_templates (quest_key, name, description, quest_type, objective_type, target_value, reward_xp, reward_currency, icon) VALUES
  ('win_2_bets', 'Bet Winner', 'Win 2 bets as the offensive team', 'easy', 'bets_won', 2, 20, 15, '🎯')
ON CONFLICT (quest_key) DO NOTHING;
