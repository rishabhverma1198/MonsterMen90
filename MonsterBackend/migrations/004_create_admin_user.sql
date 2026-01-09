-- =====================================================
-- CREATE ADMIN USER (If doesn't exist)
-- Run this in Supabase SQL Editor
-- =====================================================

-- IMPORTANT: First create the user in Supabase Auth Dashboard
-- Then run this SQL to create the profile in users table

-- Step 1: Check if admin user already exists
SELECT 
    id,
    email,
    user_type,
    is_active
FROM users
WHERE user_type = 'admin';

-- Step 2: If no admin user exists, create one
-- Replace 'YOUR_ADMIN_EMAIL@example.com' with your actual admin email
-- Replace 'YOUR_USER_ID_FROM_AUTH' with the UUID from auth.users table

-- First, get the user ID from auth.users:
-- SELECT id, email FROM auth.users WHERE email = 'YOUR_ADMIN_EMAIL@example.com';

-- Then insert into users table:
-- INSERT INTO users (id, email, full_name, user_type, is_active)
-- VALUES (
--     'YOUR_USER_ID_FROM_AUTH',  -- Get this from auth.users table
--     'YOUR_ADMIN_EMAIL@example.com',
--     'Admin User',
--     'admin',
--     true
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET user_type = 'admin',
--     is_active = true,
--     updated_at = NOW();

-- =====================================================
-- ALTERNATIVE: Create Admin User via Supabase Dashboard
-- =====================================================

-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter:
--    - Email: admin@monstermen90.com (or your admin email)
--    - Password: (set a strong password)
--    - Auto Confirm User: ✅ (checked)
-- 4. Copy the User UUID
-- 5. Run this SQL (replace UUID and email):

/*
INSERT INTO users (id, email, full_name, user_type, is_active, created_at, updated_at)
VALUES (
    'PASTE_USER_UUID_HERE',  -- From step 4
    'admin@monstermen90.com',  -- Your admin email
    'Admin User',
    'admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_active = true,
    updated_at = NOW();
*/

-- =====================================================
-- VERIFICATION
-- =====================================================

-- After creating admin user, verify:
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.user_type,
    u.is_active,
    au.email as auth_email,
    au.email_confirmed_at
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.user_type = 'admin';

-- Expected: One row with:
-- - user_type = 'admin'
-- - is_active = true
-- - auth_email matches users.email
-- - email_confirmed_at is NOT NULL

