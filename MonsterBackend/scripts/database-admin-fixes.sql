-- Database Admin Fixes Script
-- Date: December 28, 2025
-- Purpose: Fix RLS policies and create admin user to resolve admin timeout issues

-- =============================================================================
-- STEP 1: IMPLEMENT RLS POLICIES FOR USERS TABLE
-- =============================================================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin users can insert users" ON users;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow admin users to read all profiles
CREATE POLICY "Admin users can view all profiles" ON users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type = 'admin'
    )
  );

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow admin users to insert new users
CREATE POLICY "Admin users can insert users" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type = 'admin'
    )
  );

-- Allow admin users to update any user profile
CREATE POLICY "Admin users can update any profile" ON users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE user_type = 'admin'
    )
  );

-- =============================================================================
-- STEP 2: CREATE INITIAL ADMIN USER
-- =============================================================================

-- Create admin user directly (bypasses RLS for initial setup)
-- Using service role context to bypass RLS temporarily
DO $$
DECLARE
    admin_user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
BEGIN
    -- Insert admin user if doesn't exist
    INSERT INTO users (id, email, full_name, user_type, phone, is_active, created_at, updated_at)
    VALUES (
        admin_user_id,
        'admin@monstermen90.com',
        'System Administrator',
        'admin',
        '+91-9876543210',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        user_type = EXCLUDED.user_type,
        phone = EXCLUDED.phone,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END $$;

-- =============================================================================
-- STEP 3: SYNC AUTH.USERS WITH PUBLIC.USERS
-- =============================================================================

-- Create missing user profiles for existing auth users
INSERT INTO public.users (id, email, full_name, user_type, is_active, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    'buyer',  -- Default user type
    true,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STEP 4: VERIFICATION QUERIES
-- =============================================================================

-- Verify admin user exists and is accessible
SELECT 'Admin User Verification:' as check_type;
SELECT id, email, full_name, user_type, is_active, created_at 
FROM users 
WHERE user_type = 'admin';

-- Test the exact query used by AdminContext
SELECT 'AdminContext Query Test:' as check_type;
SELECT id, user_type, email, full_name, is_active
FROM users 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- Check RLS policies are in place
SELECT 'RLS Policies Status:' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- Check total user count
SELECT 'User Count Summary:' as check_type;
SELECT user_type, COUNT(*) as count
FROM users 
GROUP BY user_type;

-- =============================================================================
-- STEP 5: ADMIN FUNCTIONALITY TEST QUERIES
-- =============================================================================

-- Test admin can read all users (this should work with new policies)
SELECT 'Admin Read Access Test:' as test_name;
SELECT COUNT(*) as total_users, user_type
FROM users 
GROUP BY user_type;

-- Test user can read own profile
SELECT 'User Self Access Test:' as test_name;
SELECT id, user_type, email
FROM users 
WHERE id = auth.uid();

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 'Database Admin Fixes Completed Successfully!' as status,
       NOW() as completed_at;