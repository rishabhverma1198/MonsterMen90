-- RLS Policy Migration for Admin Products CRUD Operations
-- This migration creates RLS policies to allow admin users full CRUD access to products table

-- Enable RLS on products table if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admin users can insert products" ON products;
DROP POLICY IF EXISTS "Admin users can select products" ON products;
DROP POLICY IF EXISTS "Admin users can update products" ON products;
DROP POLICY IF EXISTS "Admin users can delete products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;

-- Create admin products CRUD policies
-- Admin users can INSERT products
CREATE POLICY "Admin users can insert products" ON products
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Admin users can SELECT all products (for management)
CREATE POLICY "Admin users can select products" ON products
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Admin users can UPDATE products
CREATE POLICY "Admin users can update products" ON products
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Admin users can DELETE products
CREATE POLICY "Admin users can delete products" ON products
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'admin'
        )
    );

-- Public can view active products (for the storefront)
CREATE POLICY "Public can view active products" ON products
    FOR SELECT 
    TO anon, authenticated
    USING (is_active = true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;

-- Verify the policies were created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;