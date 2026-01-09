-- =====================================================
-- CHECK ADMIN USERS (Correct Query)
-- Table structure confirmed: id column EXISTS
-- =====================================================

-- Step 1: Check all admin users
SELECT 
    id,
    email,
    full_name,
    user_type,
    is_active,
    created_at
FROM users
WHERE user_type = 'admin'
ORDER BY created_at DESC;

-- Step 2: Count admin users
SELECT 
    COUNT(*) as total_admin_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_admin_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_admin_users
FROM users
WHERE user_type = 'admin';

-- Step 3: Check if any users exist at all
SELECT COUNT(*) as total_users FROM users;

-- Step 4: List all users (to see structure)
SELECT * FROM users LIMIT 10;

