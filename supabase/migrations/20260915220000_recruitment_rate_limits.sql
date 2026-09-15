-- Rate limiting table for persistent throttle (survives Vercel cold starts)
-- This replaces the in-memory Map approach which breaks on serverless

CREATE TABLE IF NOT EXISTS recruitment_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_hash text NOT NULL,
  action_prefix text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recruitment_rate_limits_lookup
  ON recruitment_rate_limits (client_hash, action_prefix, created_at);

-- Auto-cleanup: delete records older than 5 minutes to prevent unbounded growth
-- This is a lightweight self-maintaining approach
CREATE OR REPLACE FUNCTION cleanup_recruitment_rate_limits()
RETURNS trigger AS $$
BEGIN
  DELETE FROM recruitment_rate_limits
  WHERE created_at < now() - interval '5 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup on every 100th insert approximately (using random sampling)
DROP TRIGGER IF EXISTS trg_cleanup_rate_limits ON recruitment_rate_limits;
CREATE TRIGGER trg_cleanup_rate_limits
  AFTER INSERT ON recruitment_rate_limits
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_recruitment_rate_limits();

-- Grant service role access
GRANT ALL ON recruitment_rate_limits TO service_role;
