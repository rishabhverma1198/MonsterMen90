-- Verification Queries (execute after RLS policies and admin user creation)

-- 1. Verify admin user exists
SELECT id, email, full_name, user_type, is_active 
FROM users 
WHERE user_type = 'admin';

-- 2. Test AdminContext query
SELECT id, user_type, email, full_name, is_active
FROM users 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- 3. Check RLS policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 4. Test admin can read all users (should work after fix)
SELECT COUNT(*) as total_users, user_type
FROM users 
GROUP BY user_type;

-- 5. Test the specific query mentioned in the task
SELECT id, user_type FROM users WHERE id = auth.uid();