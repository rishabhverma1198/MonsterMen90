-- =====================================================
-- CREATE ADMIN USER
-- Table structure: id (UUID), email, full_name, user_type, is_active
-- =====================================================

-- IMPORTANT: First create user in Supabase Auth Dashboard
-- Then get the UUID and run this SQL

-- Step 1: Check existing users in auth.users
-- (Run this in Supabase Dashboard → Authentication → Users)
-- Copy the UUID of your admin user

-- Step 2: Create admin user profile
-- Replace 'YOUR_USER_UUID_HERE' with actual UUID from auth.users
-- Replace 'admin@monstermen90.com' with your admin email

INSERT INTO users (
    id,
    email,
    full_name,
    user_type,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'YOUR_USER_UUID_HERE',  -- Get from Supabase Auth → Users
    'admin@monstermen90.com',  -- Your admin email
    'Admin User',
    'admin',  -- user_type is ENUM, so use 'admin'
    true,  -- is_active = true
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
    user_type = 'admin',
    is_active = true,
    updated_at = NOW();

-- Step 3: Verify admin user was created
SELECT 
    id,
    email,
    full_name,
    user_type,
    is_active,
    created_at
FROM users
WHERE user_type = 'admin';

-- =====================================================
-- ALTERNATIVE: Update Existing User to Admin
-- =====================================================

-- If user already exists in users table, just update:
-- UPDATE users 
-- SET user_type = 'admin',
--     is_active = true,
--     updated_at = NOW()
-- WHERE email = 'your-email@example.com';

