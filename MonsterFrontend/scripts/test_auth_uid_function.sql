-- Create a test RPC function that wraps auth.uid()
-- This should only be used in development/CI environments
-- DO NOT deploy this to production

-- Only run in development environment
-- This can be enabled by setting APP_ENV=development

CREATE OR REPLACE FUNCTION test_auth_uid()
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql;

-- Grant execute permission to authenticated users (for testing)
-- Remove this line in production
GRANT EXECUTE ON FUNCTION test_auth_uid() TO authenticated;
