-- Migration 020: Tutorial Completion Achievement
-- Add achievement for completing all beginner tutorials

INSERT INTO achievements (achievement_key, achievement_name, description, icon, tier, category, points, is_secret) VALUES
  ('tutorial_complete', 'Master Student', 'Complete all beginner tutorials', '🎓', 'bronze', 'milestone', 15, false)
ON CONFLICT (achievement_key) DO NOTHING;
