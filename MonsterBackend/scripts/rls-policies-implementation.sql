-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin users can insert users" ON users;
DROP POLICY IF EXISTS "Admin users can update any profile" ON users;

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

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin users can insert orders" ON orders;
DROP POLICY IF EXISTS "Admin users can update orders" ON orders;

-- Admin users can view all orders (single store - simplified)
CREATE POLICY "Admin users can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Admin users can insert orders
CREATE POLICY "Admin users can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Admin users can update orders
CREATE POLICY "Admin users can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Enable RLS on inventory table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view all inventory" ON inventory;
DROP POLICY IF EXISTS "Admin users can update inventory" ON inventory;
DROP POLICY IF EXISTS "Admin users can insert inventory" ON inventory;

-- Admin users can view all inventory (single store - simplified)
CREATE POLICY "Admin users can view all inventory" ON inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Admin users can update inventory
CREATE POLICY "Admin users can update inventory" ON inventory
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Admin users can insert inventory
CREATE POLICY "Admin users can insert inventory" ON inventory
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Enable RLS on daily_sales table
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view all daily_sales" ON daily_sales;
DROP POLICY IF EXISTS "Admin users can insert daily_sales" ON daily_sales;
DROP POLICY IF EXISTS "Admin users can update daily_sales" ON daily_sales;

-- Admin users can view all daily_sales (single store - simplified)
CREATE POLICY "Admin users can view all daily_sales" ON daily_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Admin users can insert daily_sales
CREATE POLICY "Admin users can insert daily_sales" ON daily_sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Admin users can update daily_sales
CREATE POLICY "Admin users can update daily_sales" ON daily_sales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );