-- Migration 030: Friend Request Expiration
-- Adds expiration tracking and auto-expire functionality for friend requests

-- Add expires_at column to friend_requests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'friend_requests' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE friend_requests ADD COLUMN expires_at TIMESTAMP;
    -- Set default expiration for new requests: 30 days from creation
    ALTER TABLE friend_requests ALTER COLUMN expires_at SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
    -- Update existing pending requests to expire 30 days from creation
    UPDATE friend_requests
    SET expires_at = created_at + INTERVAL '30 days'
    WHERE status = 'pending' AND expires_at IS NULL;
  END IF;
END $$;

-- Create index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_friend_requests_expires ON friend_requests(expires_at) WHERE status = 'pending';

-- Function to expire old friend requests
CREATE OR REPLACE FUNCTION expire_old_friend_requests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE friend_requests
  SET status = 'expired', responded_at = CURRENT_TIMESTAMP
  WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Add 'expired' to status check if not already present
-- This requires recreating the constraint
DO $$
BEGIN
  -- Check if the constraint already includes 'expired'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'friend_requests_status_check'
    AND check_clause LIKE '%expired%'
  ) THEN
    -- Drop old constraint and add new one
    ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS friend_requests_status_check;
    ALTER TABLE friend_requests ADD CONSTRAINT friend_requests_status_check
      CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'));
  END IF;
END $$;
