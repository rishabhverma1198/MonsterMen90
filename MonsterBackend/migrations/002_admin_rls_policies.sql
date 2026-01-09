-- =====================================================
-- ADMIN RLS POLICIES FOR SECURE ACCESS
-- Run this in Supabase SQL Editor if 401 errors persist
-- =====================================================

-- Enable RLS on critical tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_low_stock_alerts if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_low_stock_alerts') THEN
        EXECUTE 'ALTER TABLE admin_low_stock_alerts ENABLE ROW LEVEL SECURITY';
    END IF;
END $$;

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND user_type = 'admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Admin can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND is_admin_user(auth.uid())
    );

-- Admin can update users
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL 
        AND is_admin_user(auth.uid())
    );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Admin can view all orders
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND is_admin_user(auth.uid())
    );

-- Admin can update orders
CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL 
        AND is_admin_user(auth.uid())
    );

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- PRODUCT_VARIANTS TABLE POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all product variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product variants" ON product_variants;
DROP POLICY IF EXISTS "Public can view active product variants" ON product_variants;

-- Admin can view all product variants
CREATE POLICY "Admins can view all product variants" ON product_variants
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL 
        AND is_admin_user(auth.uid())
    );

-- Admin can update product variants
CREATE POLICY "Admins can update product variants" ON product_variants
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL 
        AND is_admin_user(auth.uid())
    );

-- Public can view active product variants (for buyer/wholesaler)
CREATE POLICY "Public can view active product variants" ON product_variants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_variants.product_id 
            AND products.is_active = true
        )
    );

-- =====================================================
-- ADMIN_LOW_STOCK_ALERTS TABLE POLICIES (if exists)
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view low stock alerts" ON admin_low_stock_alerts;
DROP POLICY IF EXISTS "Admins can update low stock alerts" ON admin_low_stock_alerts;

-- Admin can view low stock alerts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_low_stock_alerts') THEN
        EXECUTE '
        CREATE POLICY "Admins can view low stock alerts" ON admin_low_stock_alerts
            FOR SELECT
            USING (
                auth.uid() IS NOT NULL 
                AND is_admin_user(auth.uid())
            );
        ';
        
        EXECUTE '
        CREATE POLICY "Admins can update low stock alerts" ON admin_low_stock_alerts
            FOR UPDATE
            USING (
                auth.uid() IS NOT NULL 
                AND is_admin_user(auth.uid())
            );
        ';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('users', 'orders', 'product_variants', 'admin_low_stock_alerts')
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. These policies allow admin users (via JWT) to access tables
-- 2. Backend uses service_role key which bypasses RLS
-- 3. Frontend uses anon key which respects RLS
-- 4. If 401 persists, verify:
--    - User has user_type = 'admin' in users table
--    - User has is_active = true
--    - JWT token is being sent in Authorization header
--    - Backend middleware is correctly validating token

