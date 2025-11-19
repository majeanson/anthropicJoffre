-- Migration 017: JWT Refresh Token System
-- Sprint 18 Phase 1 Task 1.1: Implement secure refresh token rotation

-- Refresh tokens table: Dedicated table for refresh token management
-- Follows OAuth 2.0 best practices with token rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of the token
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45), -- IPv4 (15) or IPv6 (45) address
  user_agent VARCHAR(500),

  -- Security: Track if token was used (for rotation detection)
  rotation_count INTEGER DEFAULT 0,

  -- Soft delete instead of hard delete for audit trail
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked = FALSE;

-- Function to automatically clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_refresh_tokens()
RETURNS void AS $$
BEGIN
  -- Delete tokens expired more than 30 days ago (keep recent ones for audit)
  DELETE FROM refresh_tokens
  WHERE expires_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create trigger to revoke old tokens when user changes password
-- This ensures password change invalidates all refresh tokens
CREATE OR REPLACE FUNCTION revoke_user_refresh_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Only revoke if password actually changed
  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
    UPDATE refresh_tokens
    SET revoked = TRUE, revoked_at = NOW()
    WHERE user_id = NEW.user_id AND revoked = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_revoke_tokens_on_password_change'
  ) THEN
    CREATE TRIGGER trigger_revoke_tokens_on_password_change
    AFTER UPDATE OF password_hash ON users
    FOR EACH ROW
    EXECUTE FUNCTION revoke_user_refresh_tokens();
  END IF;
END $$;

-- Cleanup old refresh_token column from game_sessions (no longer needed)
-- Keep it for now to avoid breaking existing code, will remove in future migration
COMMENT ON COLUMN game_sessions.refresh_token IS 'DEPRECATED: Use refresh_tokens table instead. Will be removed in migration 018.';
