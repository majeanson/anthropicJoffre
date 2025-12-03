-- Migration 025: Fix Weekly Calendar Functions
-- Created: 2025-12-03
-- Purpose: Fix SQL type casting errors in get_week_monday function

-- Fix the get_week_monday function - remove invalid INTEGER cast
CREATE OR REPLACE FUNCTION get_week_monday(check_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Returns the Monday of the week for the given date
  -- ISODOW returns 1=Monday, 7=Sunday
  -- Subtracting (ISODOW - 1) days gives us the Monday
  RETURN check_date - (EXTRACT(ISODOW FROM check_date)::INTEGER - 1);
END;
$$ LANGUAGE plpgsql;

-- Also update claim_weekly_reward to use the fixed function
-- (The function body references get_week_monday, so it should work now)
