-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify all policies were created correctly
-- =====================================================

-- 1. Check all admin policies
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%is_admin_user%' THEN '✅ Admin Policy'
        WHEN qual LIKE '%auth.uid()%' THEN '✅ User Policy'
        ELSE 'Other Policy'
    END as policy_type
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'product_variants', 'admin_low_stock_alerts')
ORDER BY tablename, policyname;

-- 2. Verify is_admin_user function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'is_admin_user'
AND routine_schema = 'public';

-- 3. Check admin users
SELECT 
    id,
    email,
    user_type,
    is_active,
    created_at
FROM users
WHERE user_type = 'admin'
ORDER BY created_at DESC;

-- 4. Test is_admin_user function (replace with your admin user ID)
-- SELECT 
--     id,
--     email,
--     is_admin_user(id) as is_admin_check
-- FROM users
-- WHERE user_type = 'admin'
-- LIMIT 1;

